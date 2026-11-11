/* Versioned, source-backed component and connectivity model for Adigun AI AutoCAD. */
(function (root) {
  'use strict';

  const COMPONENT_SCHEMA_VERSION = 1;
  const PROJECT_FORMAT = 'adigun-ai-autocad-workspace';
  const PROJECT_VERSION = 2;
  const EPSILON = 1e-7;

  function deepFreeze(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    Object.keys(value).forEach(function (key) { deepFreeze(value[key]); });
    return Object.freeze(value);
  }
  function finite(value) { return typeof value === 'number' && Number.isFinite(value); }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }

  const terminalDefinition = deepFreeze({
    schemaVersion: COMPONENT_SCHEMA_VERSION,
    id: 'phoenix-contact-3212144',
    manufacturer: 'Phoenix Contact',
    manufacturerPartNumber: '3212144',
    model: 'PT 16 N OG',
    name: 'Feed-through terminal block',
    family: 'feedthrough-terminal',
    category: 'Electrical · Verified DIN-rail terminal',
    symbol: {
      id: 'terminal.feedthrough.2-connection.v1',
      view: 'schematic',
      unit: 'mm',
      width: 68,
      height: 26,
      pins: [
        { id: 'connection-1', localNumber: '1', name: 'Connection 1', x: -34, y: 0, electricalType: 'passive', connectionType: 'push-in' },
        { id: 'connection-2', localNumber: '2', name: 'Connection 2', x: 34, y: 0, electricalType: 'passive', connectionType: 'push-in' }
      ],
      internalConnections: [['connection-1', 'connection-2']],
      numberingNote: 'Terminal numbers 1 and 2 are stable model-local connection IDs. The manufacturer page specifies two connections but does not assign these numbers.'
    },
    specifications: {
      nominalVoltage: { value: 1000, unit: 'V' },
      nominalCurrent: { value: 76, unit: 'A' },
      ratedCrossSection: { value: 16, unit: 'mm²' },
      rigidConductorRange: { minimum: 0.5, maximum: 25, unit: 'mm²' },
      flexibleConductorRange: { minimum: 0.5, maximum: 25, unit: 'mm²' },
      connectionCount: { value: 2, unit: 'connections' },
      connectionMethod: { value: 'Push-in' },
      productStandard: { value: 'IEC 60947-7-1' },
      mountingRails: { value: ['NS 35/7.5', 'NS 35/15'] },
      dimensions: {
        width: { value: 12.2, unit: 'mm' },
        height: { value: 75.4, unit: 'mm' },
        depthOnNS35_7_5: { value: 52.6, unit: 'mm' },
        depthOnNS35_15: { value: 60.1, unit: 'mm' }
      },
      color: { value: 'Orange (RAL 2003)' }
    },
    instanceProperties: {
      terminalStrip: { type: 'string', default: '', maximumLength: 40 },
      position: { type: 'string', default: '', maximumLength: 24 },
      marking: { type: 'string', default: '', maximumLength: 40 },
      comment: { type: 'string', default: '', maximumLength: 160 }
    },
    sources: [{
      publisher: 'Phoenix Contact',
      title: 'PT 16 N OG · Feed-through terminal block · Item 3212144',
      url: 'https://www.phoenixcontact.com/en-lt/products/feed-through-terminal-block-pt-16-n-og-3212144',
      documentRevision: null,
      revisionNote: 'Live manufacturer product page; no document revision was displayed.',
      retrievedAt: '2026-11-12'
    }]
  });
  const COMPONENTS = Object.freeze({ [terminalDefinition.id]: terminalDefinition });

  function component(id) { return COMPONENTS[id] || null; }
  function catalog() {
    return Object.keys(COMPONENTS).map(function (id) {
      const def = COMPONENTS[id];
      return { id: def.id, componentId: def.id, name: def.model + ' · ' + def.manufacturerPartNumber, category: def.category, family: def.family, tag: 'X' };
    });
  }
  function createInstance(componentId, x, y, ref) {
    const def = component(componentId);
    if (!def) throw new Error('Unknown verified component: ' + componentId);
    if (!finite(x) || !finite(y)) throw new TypeError('Component coordinates must be finite numbers.');
    const properties = {};
    Object.keys(def.instanceProperties).forEach(function (name) {
      properties[name] = def.instanceProperties[name].default;
    });
    return {
      schemaVersion: COMPONENT_SCHEMA_VERSION,
      kind: 'component-instance',
      id: 'cmp-' + (root.crypto && typeof root.crypto.randomUUID === 'function'
        ? root.crypto.randomUUID()
        : Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 11)),
      componentId: componentId,
      ref: typeof ref === 'string' && ref.trim() ? ref.trim().slice(0, 32) : 'X1',
      x: Math.round(x / 5) * 5,
      y: Math.round(y / 5) * 5,
      rotation: 0,
      properties: properties
    };
  }
  function validateInstance(instance) {
    const errors = [];
    if (!instance || typeof instance !== 'object') return { valid: false, errors: ['Component instance must be an object.'] };
    const def = component(instance.componentId);
    if (instance.kind !== 'component-instance') errors.push('Object is not a component instance.');
    if (instance.schemaVersion !== COMPONENT_SCHEMA_VERSION) errors.push('Unsupported component schema version.');
    if (!def) errors.push('Component ID has no verified definition.');
    if (!finite(instance.x) || !finite(instance.y)) errors.push('Component position is invalid.');
    if (![0, 90, 180, 270].includes(instance.rotation)) errors.push('Component rotation must be 0, 90, 180, or 270 degrees.');
    if (typeof instance.id !== 'string' || !instance.id || instance.id.length > 100) errors.push('Component instance ID is invalid.');
    if (typeof instance.ref !== 'string' || !instance.ref.trim() || instance.ref.length > 32) errors.push('Component reference is invalid.');
    if (!instance.properties || typeof instance.properties !== 'object' || Array.isArray(instance.properties)) errors.push('Component instance properties are missing.');
    if (def && instance.properties && typeof instance.properties === 'object' && !Array.isArray(instance.properties)) {
      Object.keys(def.instanceProperties).forEach(function (name) {
        const value = instance.properties[name];
        const rule = def.instanceProperties[name];
        if (value !== undefined && (typeof value !== 'string' || value.length > rule.maximumLength)) {
          errors.push('Component property "' + name + '" is invalid.');
        }
      });
      Object.keys(instance.properties).forEach(function (name) {
        if (!Object.prototype.hasOwnProperty.call(def.instanceProperties, name)) errors.push('Unknown editable component property "' + name + '".');
      });
    }
    return { valid: errors.length === 0, errors: errors, definition: def };
  }
  function worldPins(instance) {
    const result = validateInstance(instance);
    if (!result.valid) return [];
    const angle = instance.rotation * Math.PI / 180;
    const cos = Math.cos(angle), sin = Math.sin(angle);
    return result.definition.symbol.pins.map(function (pin) {
      return {
        id: pin.id,
        number: pin.localNumber,
        name: pin.name,
        electricalType: pin.electricalType,
        x: instance.x + pin.x * cos - pin.y * sin,
        y: instance.y + pin.x * sin + pin.y * cos
      };
    });
  }
  function validateProject(project) {
    const errors = [];
    if (!project || typeof project !== 'object') return { valid: false, errors: ['Project must be a JSON object.'] };
    if (project.format !== PROJECT_FORMAT) errors.push('Unsupported Adigun project format.');
    if (![1, PROJECT_VERSION].includes(project.version)) errors.push('Unsupported project version.');
    if (!Array.isArray(project.objects) || !Array.isArray(project.sheets)) errors.push('Project objects and sheets must be arrays.');
    if (Array.isArray(project.objects)) {
      project.objects.forEach(function (object, index) {
        if (!object || typeof object !== 'object') {
          errors.push('Drawing object ' + (index + 1) + ' is invalid.');
          return;
        }
        if (object.kind === 'component-instance') {
          const validation = validateInstance(object);
          validation.errors.forEach(function (error) { errors.push('Object ' + (object.ref || index + 1) + ': ' + error); });
        } else if (object.kind === 'catalog-symbol' || ['terminal', 'plc', 'motor', 'ground'].includes(object.kind)) {
          errors.push('Project contains a legacy visual-only component. It must be replaced with a verified component before import.');
        } else if (object.kind === 'wire' && ![object.x1, object.y1, object.x2, object.y2].every(finite)) {
          errors.push('Wire ' + (object.id || index + 1) + ' has invalid coordinates.');
        }
      });
    }
    if (project.version === PROJECT_VERSION && (project.componentSchemaVersion !== COMPONENT_SCHEMA_VERSION || project.netSchemaVersion !== 1)) {
      errors.push('Project component or net schema version is unsupported.');
    }
    return { valid: errors.length === 0, errors: errors };
  }
  function serializeProject(project) {
    const payload = Object.assign({}, project, {
      format: PROJECT_FORMAT,
      version: PROJECT_VERSION,
      componentSchemaVersion: COMPONENT_SCHEMA_VERSION,
      netSchemaVersion: 1
    });
    const validation = validateProject(payload);
    if (!validation.valid) throw new Error(validation.errors.join(' '));
    return JSON.stringify(payload, null, 2);
  }
  function parseProject(text) {
    let project;
    try { project = JSON.parse(text); }
    catch (error) { return { valid: false, errors: ['Project file is not valid JSON.'] }; }
    const validation = validateProject(project);
    return { valid: validation.valid, errors: validation.errors, project: validation.valid ? project : null };
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
    const pins = [];
    const errors = [];
    const validInstances = [];

    source.forEach(function (object, index) {
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
        .filter(function (pair) { return Math.abs(pair[0].x - pair[1].x) > EPSILON || Math.abs(pair[0].y - pair[1].y) > EPSILON; })
        .map(function (pair) { return { a: pair[0], b: pair[1] }; });
      if (!segments.length) {
        errors.push({ code: 'zero-length-wire', objectId: object.id || null, message: 'A wire has zero length.' });
        return;
      }
      wires.push({ id: object.id || 'wire-' + (index + 1), points: [start, bend, end], start: start, end: end, segments: segments });
    });

    source.forEach(function (object) {
      if (!object || object.kind !== 'component-instance') return;
      const validation = validateInstance(object);
      if (!validation.valid) {
        validation.errors.forEach(function (message) {
          errors.push({ code: 'invalid-component-instance', objectId: object.id || null, message: message });
        });
        return;
      }
      validInstances.push(object);
      worldPins(object).forEach(function (pin) {
        pins.push({ instanceId: object.id, ref: object.ref, pinId: pin.id, number: pin.number, name: pin.name, point: { x: pin.x, y: pin.y } });
      });
    });

    const parents = [];
    const addNode = function () { const id = parents.length; parents.push(id); return id; };
    const find = function (id) {
      while (parents[id] !== id) { parents[id] = parents[parents[id]]; id = parents[id]; }
      return id;
    };
    const join = function (a, b) {
      const rootA = find(a), rootB = find(b);
      if (rootA !== rootB) parents[rootB] = rootA;
    };
    wires.forEach(function (wire) { wire.node = addNode(); });
    pins.forEach(function (pin) { pin.node = addNode(); });

    for (let i = 0; i < wires.length; i += 1) {
      for (let j = i + 1; j < wires.length; j += 1) {
        const touches = wires[i].points.some(function (point) {
          return wires[j].segments.some(function (segment) { return pointOnSegment(point, segment); });
        }) || wires[j].points.some(function (point) {
          return wires[i].segments.some(function (segment) { return pointOnSegment(point, segment); });
        });
        if (touches) join(wires[i].node, wires[j].node);
      }
    }
    let connectedPinCount = 0;
    pins.forEach(function (pin) {
      const attachedWires = wires.filter(function (wire) {
        return wire.segments.some(function (segment) { return pointOnSegment(pin.point, segment); });
      });
      if (attachedWires.length) connectedPinCount += 1;
      attachedWires.forEach(function (wire) { join(pin.node, wire.node); });
    });

    validInstances.forEach(function (instance) {
      const def = component(instance.componentId);
      def.symbol.internalConnections.forEach(function (pair) {
        const first = pins.find(function (pin) { return pin.instanceId === instance.id && pin.pinId === pair[0]; });
        const second = pins.find(function (pin) { return pin.instanceId === instance.id && pin.pinId === pair[1]; });
        if (first && second) join(first.node, second.node);
      });
    });

    const openEndpoints = [];
    wires.forEach(function (wire) {
      [wire.start, wire.end].forEach(function (endpoint) {
        const connectedToWire = wires.some(function (other) {
          return other !== wire && other.segments.some(function (segment) { return pointOnSegment(endpoint, segment); });
        });
        const connectedToPin = pins.some(function (pin) {
          return Math.abs(pin.point.x - endpoint.x) <= EPSILON && Math.abs(pin.point.y - endpoint.y) <= EPSILON;
        });
        if (!connectedToWire && !connectedToPin) openEndpoints.push({ wireId: wire.id, point: endpoint });
      });
    });

    const groups = new Map();
    wires.forEach(function (wire) {
      const key = find(wire.node);
      if (!groups.has(key)) groups.set(key, { wires: [], pins: [] });
      groups.get(key).wires.push(wire.id);
    });
    pins.forEach(function (pin) {
      const key = find(pin.node);
      if (!groups.has(key)) groups.set(key, { wires: [], pins: [] });
      groups.get(key).pins.push({ instanceId: pin.instanceId, ref: pin.ref, pinId: pin.pinId, number: pin.number, name: pin.name });
    });
    const nets = [];
    groups.forEach(function (group) {
      if (group.wires.length) nets.push(group);
    });
    nets.sort(function (a, b) {
      const aKey = a.wires[0] || a.pins[0].instanceId + ':' + a.pins[0].pinId;
      const bKey = b.wires[0] || b.pins[0].instanceId + ':' + b.pins[0].pinId;
      return aKey.localeCompare(bKey);
    });
    const serializedNets = nets.map(function (net, index) {
      return { id: 'net-' + (index + 1), wireIds: net.wires.slice().sort(), pins: net.pins.slice().sort(function (a, b) { return a.ref.localeCompare(b.ref) || a.number.localeCompare(b.number); }) };
    });

    return {
      componentSchemaVersion: COMPONENT_SCHEMA_VERSION,
      netSchemaVersion: 1,
      wireCount: wires.length,
      componentCount: validInstances.length,
      componentPinCount: pins.length,
      connectedPinCount: connectedPinCount,
      unconnectedPinCount: pins.length - connectedPinCount,
      netCount: serializedNets.length,
      nets: serializedNets,
      openEndpointCount: openEndpoints.length,
      openEndpoints: openEndpoints,
      geometryErrorCount: errors.length,
      errors: errors,
      scope: 'source-backed component instances and user-authored orthogonal wire geometry; imported/embedded reference artwork is excluded'
    };
  }

  root.AdigunCADEngine = Object.freeze({
    componentSchemaVersion: COMPONENT_SCHEMA_VERSION,
    netSchemaVersion: 1,
    projectFormat: PROJECT_FORMAT,
    projectVersion: PROJECT_VERSION,
    component: component,
    catalog: catalog,
    createInstance: createInstance,
    validateInstance: validateInstance,
    worldPins: worldPins,
    validateProject: validateProject,
    serializeProject: serializeProject,
    parseProject: parseProject,
    analyze: analyze
  });
})(typeof window !== 'undefined' ? window : globalThis);