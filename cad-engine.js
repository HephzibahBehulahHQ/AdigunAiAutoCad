/* Lightweight electrical wire topology analysis for Adigun AI AutoCAD.
 * Only explicit wire geometry is analyzed. Crossings join only when a wire vertex
 * (endpoint or orthogonal bend) lands on another wire segment.
 */
(function (root) {
  'use strict';

  const EPSILON = 1e-7;

  function finite(value) {
    return typeof value === 'number' && Number.isFinite(value);
  }

  function pointOnSegment(point, segment) {
    const cross = (point.x - segment.a.x) * (segment.b.y - segment.a.y)
      - (point.y - segment.a.y) * (segment.b.x - segment.a.x);
    if (Math.abs(cross) > EPSILON) return false;
    return point.x >= Math.min(segment.a.x, segment.b.x) - EPSILON
      && point.x <= Math.max(segment.a.x, segment.b.x) + EPSILON
      && point.y >= Math.min(segment.a.y, segment.b.y) - EPSILON
      && point.y <= Math.max(segment.a.y, segment.b.y) + EPSILON;
  }

  function analyze(objects) {
    const source = Array.isArray(objects) ? objects : [];
    const wires = [];
    const errors = [];

    source.forEach((object, index) => {
      if (!object || object.kind !== 'wire') return;
      const coords = [object.x1, object.y1, object.x2, object.y2];
      if (!coords.every(finite)) {
        errors.push({ code: 'invalid-coordinate', objectId: object.id || null, message: 'A wire has a missing or non-finite endpoint.' });
        return;
      }
      const start = { x: object.x1, y: object.y1 };
      const bend = { x: object.x2, y: object.y1 };
      const end = { x: object.x2, y: object.y2 };
      const segments = [[start, bend], [bend, end]]
        .filter(([a, b]) => Math.abs(a.x - b.x) > EPSILON || Math.abs(a.y - b.y) > EPSILON)
        .map(([a, b]) => ({ a, b }));
      if (!segments.length) {
        errors.push({ code: 'zero-length-wire', objectId: object.id || null, message: 'A wire has zero length.' });
        return;
      }
      wires.push({ id: object.id || `wire-${index + 1}`, points: [start, bend, end], start, end, segments });
    });

    const parent = wires.map((_, i) => i);
    function find(i) {
      while (parent[i] !== i) {
        parent[i] = parent[parent[i]];
        i = parent[i];
      }
      return i;
    }
    function join(a, b) {
      const ra = find(a), rb = find(b);
      if (ra !== rb) parent[rb] = ra;
    }

    for (let i = 0; i < wires.length; i += 1) {
      for (let j = i + 1; j < wires.length; j += 1) {
        const touches = wires[i].points.some(point => wires[j].segments.some(segment => pointOnSegment(point, segment)))
          || wires[j].points.some(point => wires[i].segments.some(segment => pointOnSegment(point, segment)));
        if (touches) join(i, j);
      }
    }

    const components = new Map();
    wires.forEach((wire, index) => {
      const rootIndex = find(index);
      if (!components.has(rootIndex)) components.set(rootIndex, []);
      components.get(rootIndex).push(wire);
    });

    let openEndpoints = 0;
    for (const wire of wires) {
      for (const endpoint of [wire.start, wire.end]) {
        const connected = wires.some(other => other !== wire
          && other.segments.some(segment => pointOnSegment(endpoint, segment)));
        if (!connected) openEndpoints += 1;
      }
    }

    return {
      wireCount: wires.length,
      netCount: components.size,
      openEndpointCount: openEndpoints,
      geometryErrorCount: errors.length,
      errors,
      scope: 'user-authored wire objects only; embedded reference artwork and device pins are not analyzed'
    };
  }

  root.AdigunCADEngine = Object.freeze({ analyze });
})(typeof window !== 'undefined' ? window : globalThis);
