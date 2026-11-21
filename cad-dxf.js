(function (root) {
  'use strict';

  const supported = new Set(['LINE', 'CIRCLE', 'LWPOLYLINE', 'POLYLINE']);
  const millimetres = new Map([[0, 1], [1, 25.4], [2, 304.8], [4, 1], [5, 10], [6, 1000]]);

  function countEntityTypes(text) {
    const counts = new Map();
    const records = text.split(/\r?\n/);
    let inEntities = false;
    for (let index = 0; index + 1 < records.length; index += 2) {
      if (records[index].trim() !== '0') continue;
      const type = records[index + 1].trim();
      if (type === 'SECTION') inEntities = records[index + 2]?.trim() === '2' && records[index + 3]?.trim() === 'ENTITIES';
      else if (type === 'ENDSEC') inEntities = false;
      else if (inEntities && type !== 'VERTEX' && type !== 'SEQEND') counts.set(type, (counts.get(type) || 0) + 1);
    }
    return counts;
  }

  function importDrawing(text, name, projectId) {
    const parser = new root.DxfParser();
    const document = parser.parseSync(text);
    if (!document) throw new Error('DXF could not be read as an ASCII drawing.');
    const unit = document.header?.$INSUNITS ?? 0;
    const scale = millimetres.get(unit);
    if (!scale) throw new Error('DXF drawing units are unsupported (' + unit + ').');
    const engine = root.AdigunCADEngine;
    const sheetId = 'dxf-drawing';
    const objects = [];
    const skipped = countEntityTypes(text);
    const isPoint = point => Number.isFinite(point?.x) && Number.isFinite(point?.y) && (!point.z || point.z === 0);
    const x = point => point.x * scale;
    const y = point => -point.y * scale;
    for (const entity of document.entities || []) {
      const extrusion = entity.extrusionDirection;
      if (!supported.has(entity.type) || entity.inPaperSpace || entity.extrusionDirectionX || entity.extrusionDirectionY
        || (extrusion && (extrusion.x || extrusion.y || extrusion.z !== 1))
        || (entity.extrusionDirectionZ != null && entity.extrusionDirectionZ !== 1)) continue;
      const color = entity.color ?? document.tables?.layer?.layers?.[entity.layer]?.color;
      const stroke = Number.isInteger(color) && color > 0 && color < 0xffffff ? '#' + color.toString(16).padStart(6, '0') : '#164eac';
      const add = geometry => objects.push({ id: 'dxf-' + (objects.length + 1), sheetId, stroke, dxfLayer: entity.layer || '0', ...geometry });
      if (entity.type === 'CIRCLE') {
        if (!isPoint(entity.center) || !Number.isFinite(entity.radius) || entity.radius <= 0) continue;
        const cx = x(entity.center), cy = y(entity.center);
        add({ kind: 'circle', x: cx, y: cy, x2: cx + entity.radius * scale, y2: cy });
      } else {
        const points = entity.vertices;
        if (!Array.isArray(points) || points.length < 2 || points.some(point => !isPoint(point) || point.bulge)
          || entity.is3dPolyline || entity.is3dPolygonMesh || entity.isPolyfaceMesh || entity.elevation) continue;
        const edgeCount = points.length - 1 + (entity.shape ? 1 : 0);
        for (let edge = 0; edge < edgeCount; edge += 1) {
          const start = points[edge], end = points[(edge + 1) % points.length];
          if (start.x === end.x && start.y === end.y) continue;
          add({ kind: 'line', x: x(start), y: y(start), x1: x(start), y1: y(start), x2: x(end), y2: y(end) });
        }
      }
      skipped.set(entity.type, Math.max(0, (skipped.get(entity.type) || 0) - 1));
    }
    const unsupported = [...skipped].filter(([, count]) => count > 0).map(([type, count]) => type + ' × ' + count);
    if (!objects.length) throw new Error('DXF contains no supported drawing geometry' + (unsupported.length ? ' (' + unsupported.join(', ') + ')' : '') + '.');
    const project = engine.copyExampleProject({
      format: engine.projectFormat, version: engine.projectVersion,
      componentSchemaVersion: engine.componentSchemaVersion, netSchemaVersion: engine.netSchemaVersion,
      project: name, activeSheet: sheetId,
      sheets: [{ id: sheetId, number: 'A2/001', name: name, projectSectionId: 'A2' }], objects,
      crossSheetConnections: []
    }, projectId, name);
    return { project, unsupported };
  }

  async function exportDrawing(objects) {
    const { DxfWriter, Units, point3d } = await import('./vendor/dxf-writer-2.8.9.mjs');
    const writer = new DxfWriter();
    writer.setUnits(Units.Millimeters);
    const layers = new Set(['0']);
    const skipped = new Map();
    let entities = 0;
    for (const object of objects) {
      if (object.hidden) continue;
      const { kind, x, y, x1, y1, x2, y2 } = object;
      const layerName = String(object.dxfLayer || object.layer || (kind === 'wire' ? 'connections' : 'annotations'))
        .replace(/[<>/\\":;?*|=\x00-\x1f]/g, '_').slice(0, 255);
      const options = { layerName };
      if (/^#[\da-f]{6}$/i.test(object.stroke || '')) options.trueColor = object.stroke;
      const addLayer = () => {
        if (layers.has(layerName)) return;
        writer.addLayer(layerName, 7, 'Continuous');
        layers.add(layerName);
      };
      if (!object.rotation) {
        if (kind === 'circle' && [x, y, x2, y2].every(Number.isFinite)) {
          const radius = Math.hypot(x2 - x, y2 - y);
          if (radius > 0) {
            addLayer();
            writer.addCircle(point3d(x, -y), radius, options);
            entities += 1;
            continue;
          }
        }
        let points;
        if (kind === 'line') points = [[x1, y1], [x2, y2]];
        if (kind === 'wire') points = root.AdigunCADEngine.wireRoutePoints(object).map(point => [point.x, point.y]);
        if (kind === 'rect') points = [[x, y], [x2, y], [x2, y2], [x, y2], [x, y]];
        if (kind === 'freehand') points = object.points?.map(point => [point.x, point.y]);
        if (points?.length > 1 && points.every(point => point.every(Number.isFinite))) {
          for (let index = 1; index < points.length; index += 1) {
            const [fromX, fromY] = points[index - 1];
            const [toX, toY] = points[index];
            if (fromX === toX && fromY === toY) continue;
            addLayer();
            writer.addLine(point3d(fromX, -fromY), point3d(toX, -toY), options);
            entities += 1;
          }
          continue;
        }
      }
      skipped.set(kind, (skipped.get(kind) || 0) + 1);
    }
    if (!entities) throw new Error('This sheet has no supported visible DXF geometry.');
    return { text: writer.stringify(), unsupported: [...skipped].map(([kind, count]) => kind + ' × ' + count) };
  }

  root.AdigunDXF = Object.freeze({ importDrawing, exportDrawing });
})(globalThis);
