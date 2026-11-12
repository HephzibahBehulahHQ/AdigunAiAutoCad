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
    referencePrefix: 'X',
    category: 'Electrical · Verified DIN-rail terminal',
    symbol: {
      id: 'terminal.feedthrough.2-connection.v1',
      view: 'schematic',
      unit: 'mm',
      width: 70,
      height: 26,
      pins: [
        { id: 'connection-1', localNumber: '1', name: 'Connection 1', x: -35, y: 0, electricalType: 'passive', connectionType: 'push-in' },
        { id: 'connection-2', localNumber: '2', name: 'Connection 2', x: 35, y: 0, electricalType: 'passive', connectionType: 'push-in' }
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
  const relayDefinition = deepFreeze({
    schemaVersion: COMPONENT_SCHEMA_VERSION,
    id: 'phoenix-contact-2966171',
    manufacturer: 'Phoenix Contact',
    manufacturerPartNumber: '2966171',
    model: 'PLC-RSC- 24DC/21',
    name: 'PLC-INTERFACE relay module',
    family: 'relay-module',
    referencePrefix: 'K',
    category: 'Electrical · Verified interface relay',
    symbol: {
      id: 'relay.interface.changeover.24vdc.v1',
      view: 'schematic',
      unit: 'mm',
      width: 140,
      height: 60,
      pins: [
        { id: 'coil-a2', localNumber: 'A2', name: 'Coil return', x: -70, y: -20, electricalType: 'passive', connectionType: 'screw' },
        { id: 'coil-a1', localNumber: 'A1', name: 'Coil supply', x: -70, y: 20, electricalType: 'passive', connectionType: 'screw' },
        { id: 'contact-11', localNumber: '11', name: 'Changeover common', x: 70, y: 0, electricalType: 'passive', connectionType: 'screw' },
        { id: 'contact-12', localNumber: '12', name: 'Normally closed', x: 70, y: -25, electricalType: 'passive', connectionType: 'screw' },
        { id: 'contact-14', localNumber: '14', name: 'Normally open', x: 70, y: 25, electricalType: 'passive', connectionType: 'screw' }
      ],
      internalConnections: [],
      numberingNote: 'External terminal designations A1, A2, 11, 12 and 14 follow the manufacturer circuit diagram. Pin coordinates are schematic connection points, not a physical relay footprint.'
    },
    electricalFunctions: {
      coil: { pins: ['coil-a1', 'coil-a2'], nominalVoltage: { value: 24, unit: 'V DC' }, polarity: { positive: 'A1', negative: 'A2' }, suppression: 'Integrated polarity/freewheeling diode and input circuit; preserve A1/A2 polarity.' },
      changeoverContact: { common: 'contact-11', normallyClosed: 'contact-12', normallyOpen: 'contact-14', deenergizedConnections: [['contact-11', 'contact-12']], energizedConnections: [['contact-11', 'contact-14']], actuation: 'coil-a1/coil-a2', simulation: 'Not simulated; static connectivity reports only user-authored wires and does not assume a relay state.' }
    },
    specifications: {
      nominalCoilVoltage: { value: 24, unit: 'V DC' },
      coilInputRangeAt20C: { minimum: 18.5, maximum: 33.6, unit: 'V DC' },
      typicalInputCurrent: { value: 9, unit: 'mA' },
      responseTime: { value: 5, unit: 'ms' },
      releaseTime: { value: 8, unit: 'ms' },
      changeoverContactCount: { value: 1, unit: 'changeover contact' },
      maximumSwitchingVoltage: { value: 250, unit: 'V AC/DC', note: 'Manufacturer installation note applies above 250 V between adjacent identical modules.' },
      limitingContinuousCurrent: { value: 6, unit: 'A', note: 'Manufacturer parameter; temperature and mounting derating apply.' },
      ratedImpulseWithstandVoltage: { value: 6, unit: 'kV' },
      windingContactTestVoltage: { value: 4, unit: 'kV AC' },
      contactStandard: { value: 'IEC 60947-5-1' },
      connectionMethod: { value: 'Screw connection · M3 · 0.6–0.8 Nm' },
      rigidConductorRange: { minimum: 0.14, maximum: 2.5, unit: 'mm²' },
      flexibleConductorRange: { minimum: 0.14, maximum: 2.5, unit: 'mm²' },
      connectionCount: { value: 5, unit: 'external electrical terminals' },
      dimensions: { width: { value: 6.2, unit: 'mm' }, height: { value: 80, unit: 'mm' }, depth: { value: 94, unit: 'mm' } },
      mountingRail: { value: 'NS 35/7.5' }
    },
    instanceProperties: {
      terminalStrip: { type: 'string', default: '', maximumLength: 40 },
      position: { type: 'string', default: '', maximumLength: 24 },
      marking: { type: 'string', default: '', maximumLength: 40 },
      comment: { type: 'string', default: '', maximumLength: 160 }
    },
    sources: [{
      publisher: 'Phoenix Contact',
      title: 'PLC-RSC- 24DC/21 · Relay module · Item 2966171, online catalog PDF',
      url: 'https://www.phoenixcontact.com/en-pc/products/relay-module-plc-rsc-24dc-21-2966171?type=pdf',
      documentRevision: 'Manufacturer catalog PDF generated May 19, 2026 · circuit diagram page 9 of 12',
      revisionNote: 'Manufacturer online catalog PDF; retrieved from Phoenix Contact product page. Circuit diagram supplies external pin identifiers and functional arrangement.',
      retrievedAt: '2026-11-12'
    }]
  });
  const contactorDefinition = deepFreeze({
    schemaVersion: COMPONENT_SCHEMA_VERSION,
    id: 'schneider-electric-lc1d09bd',
    manufacturer: 'Schneider Electric',
    manufacturerPartNumber: 'LC1D09BD',
    model: 'TeSys D LC1D09BD',
    name: '3-pole contactor with 24 V DC coil',
    family: 'contactor',
    referencePrefix: 'KM',
    category: 'Electrical · Verified motor-control contactor',
    symbol: {
      id: 'contactor.tesys-d.lc1d09bd.v1',
      view: 'schematic',
      unit: 'mm',
      width: 280,
      height: 130,
      pins: [
        { id: 'coil-a1', localNumber: 'A1', name: 'DC coil terminal A1', x: -120, y: -25, electricalType: 'passive', connectionType: 'screw-clamp' },
        { id: 'coil-a2', localNumber: 'A2', name: 'DC coil terminal A2', x: -120, y: 25, electricalType: 'passive', connectionType: 'screw-clamp' },
        { id: 'power-l1', localNumber: '1/L1', name: 'Main pole 1 line terminal', x: -50, y: -55, electricalType: 'passive', connectionType: 'screw-clamp' },
        { id: 'power-t1', localNumber: '2/T1', name: 'Main pole 1 load terminal', x: -50, y: 55, electricalType: 'passive', connectionType: 'screw-clamp' },
        { id: 'power-l2', localNumber: '3/L2', name: 'Main pole 2 line terminal', x: 0, y: -55, electricalType: 'passive', connectionType: 'screw-clamp' },
        { id: 'power-t2', localNumber: '4/T2', name: 'Main pole 2 load terminal', x: 0, y: 55, electricalType: 'passive', connectionType: 'screw-clamp' },
        { id: 'power-l3', localNumber: '5/L3', name: 'Main pole 3 line terminal', x: 50, y: -55, electricalType: 'passive', connectionType: 'screw-clamp' },
        { id: 'power-t3', localNumber: '6/T3', name: 'Main pole 3 load terminal', x: 50, y: 55, electricalType: 'passive', connectionType: 'screw-clamp' },
        { id: 'aux-13', localNumber: '13', name: 'Auxiliary normally-open contact terminal', x: 100, y: -55, electricalType: 'passive', connectionType: 'screw-clamp' },
        { id: 'aux-14', localNumber: '14', name: 'Auxiliary normally-open contact terminal', x: 100, y: 55, electricalType: 'passive', connectionType: 'screw-clamp' },
        { id: 'aux-21', localNumber: '21', name: 'Auxiliary normally-closed contact terminal', x: 145, y: -55, electricalType: 'passive', connectionType: 'screw-clamp' },
        { id: 'aux-22', localNumber: '22', name: 'Auxiliary normally-closed contact terminal', x: 145, y: 55, electricalType: 'passive', connectionType: 'screw-clamp' }
      ],
      internalConnections: [],
      numberingNote: 'A1/A2, 1/L1–6/T3, 13/14 and 21/22 are the manufacturer wiring-diagram terminal designations. The schematic pins are electrical connection points, not the contactor physical footprint. Main and auxiliary contacts remain separate nets; contactor state is not simulated.'
    },
    electricalFunctions: {
      contactor: {
        coil: { pins: ['coil-a1', 'coil-a2'], nominalVoltage: { value: 24, unit: 'V DC' }, suppression: 'Built-in bidirectional peak-limiting diode suppressor' },
        mainPoles: [
          { line: 'power-l1', load: 'power-t1', normalState: 'open' },
          { line: 'power-l2', load: 'power-t2', normalState: 'open' },
          { line: 'power-l3', load: 'power-t3', normalState: 'open' }
        ],
        auxiliaryContacts: [
          { first: 'aux-13', second: 'aux-14', normalState: 'open', type: 'mechanically-linked NO' },
          { first: 'aux-21', second: 'aux-22', normalState: 'closed', type: 'mechanically-linked NC' }
        ],
        simulationNote: 'Three main poles and the mechanically-linked auxiliary NO/NC contacts are represented as separate external terminal pairs. Contact actuation and coil-state simulation are not implemented; only user-authored wires establish nets.'
      }
    },
    specifications: {
      poles: { value: '3P, 3 normally-open main poles' },
      ac3RatedCurrent: { value: 9, unit: 'A at ≤440 V AC' },
      ac3RatedOperationalVoltage: { value: 440, unit: 'V AC maximum for 9 A AC-3 rating' },
      ratedOperationalVoltage: { value: 690, unit: 'V AC maximum' },
      nominalCoilVoltage: { value: 24, unit: 'V DC' },
      coilOperationalRangeAt60C: { minimum: 0.7, maximum: 1.25, unit: '× Uc' },
      auxiliaryContactComposition: { value: '1 mechanically-linked NO + 1 mechanically-linked NC' },
      coilSuppressor: { value: 'Built-in bidirectional peak-limiting diode' },
      standards: { value: ['IEC 60947-4-1', 'IEC 60947-5-1', 'UL 508'] },
      terminalConnection: { value: 'Screw clamp; manufacturer torque 1.7 N·m' },
      dimensions: { width: { value: 45, unit: 'mm' }, height: { value: 77, unit: 'mm' }, depth: { value: 95, unit: 'mm' } },
      mountingSupport: { value: ['Rail', 'Plate'] }
    },
    instanceProperties: {
      terminalStrip: { type: 'string', default: '', maximumLength: 40 },
      position: { type: 'string', default: '', maximumLength: 24 },
      marking: { type: 'string', default: '', maximumLength: 40 },
      comment: { type: 'string', default: '', maximumLength: 160 }
    },
    sources: [{
      publisher: 'Schneider Electric',
      title: 'LC1D09BD · TeSys D contactor · Product data sheet',
      url: 'https://iportal.se.com/Contents/docs/SQD-LC1D09BD.PDF',
      productUrl: 'https://www.se.com/us/en/product/LC1D09BD/iec-contactor-tesys-deca-nonreversing-9a-5hp-at-480vac-up-to-100ka-sccr-3-phase-3-no-24vdc-coil-open-style/',
      documentRevision: 'Manufacturer product data sheet; wiring diagram page 6; source document dated September 8, 2017.',
      revisionNote: 'Manufacturer sheet supplies coil, main and auxiliary terminal identities, contact composition, ratings and dimensions. Verify the exact product and application limits against the current manufacturer documentation before engineering use.',
      retrievedAt: '2026-11-12'
    }]
  });
  const COMPONENTS = Object.freeze({ [terminalDefinition.id]: terminalDefinition, [relayDefinition.id]: relayDefinition, [contactorDefinition.id]: contactorDefinition });

  function reorderObject(objects,id,direction) {
    if (!Array.isArray(objects) || (direction !== 1 && direction !== -1)) return false;
    const index = objects.findIndex(function (object) { return object && object.id === id; });
    const target = index + direction;
    if (index < 0 || target < 0 || target >= objects.length) return false;
    const moved = objects.splice(index, 1)[0];
    objects.splice(target, 0, moved);
    return true;
  }

  function component(id) { return COMPONENTS[id] || null; }
  function catalog() {
    return Object.keys(COMPONENTS).map(function (id) {
      const def = COMPONENTS[id];
      return { id: def.id, componentId: def.id, name: def.model + ' · ' + def.manufacturerPartNumber, category: def.category, family: def.family, tag: def.referencePrefix || 'X' };
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
      ref: typeof ref === 'string' && ref.trim() ? ref.trim().slice(0, 32) : (def.referencePrefix || 'X') + '1',
      x: x,
      y: y,
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

  function moveInstance(instance, x, y) {
    const result = validateInstance(instance);
    if (!result.valid) throw new Error(result.errors.join(' '));
    if (!finite(x) || !finite(y)) throw new TypeError('Component coordinates must be finite numbers.');
    instance.x = x;
    instance.y = y;
    return instance;
  }
  function rotateInstance(instance, degrees) {
    const result = validateInstance(instance);
    if (!result.valid) throw new Error(result.errors.join(' '));
    if (!finite(degrees) || degrees % 90 !== 0) throw new TypeError('Component rotation must use 90-degree increments.');
    const next = ((instance.rotation + degrees) % 360 + 360) % 360;
    if (![0, 90, 180, 270].includes(next)) throw new TypeError('Component rotation must be 0, 90, 180, or 270 degrees.');
    instance.rotation = next;
    return instance;
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

  function billOfMaterials(objects) {
    const groups = new Map();
    const errors = [];
    (Array.isArray(objects) ? objects : []).forEach(function (instance, index) {
      if (!instance) return;
      if (instance.kind !== 'component-instance') {
        if (['catalog-symbol', 'terminal', 'plc', 'motor', 'ground'].includes(instance.kind)) errors.push('Object ' + (instance.ref || index + 1) + ': unverified legacy symbol cannot be included in a verified BOM.');
        return;
      }
      const validation = validateInstance(instance);
      if (!validation.valid) {
        errors.push('Object ' + (instance.ref || index + 1) + ': ' + validation.errors.join(' '));
        return;
      }
      const definition = validation.definition;
      if (!Array.isArray(definition.sources) || !definition.sources.length) {
        errors.push('Object ' + instance.ref + ': verified source provenance is missing.');
        return;
      }
      if (!groups.has(definition.id)) groups.set(definition.id, { definition: definition, references: [] });
      groups.get(definition.id).references.push(instance.ref);
    });
    const rows = Array.from(groups.values()).map(function (group) {
      const definition = group.definition;
      const source = definition.sources[0];
      return {
        componentId: definition.id, manufacturer: definition.manufacturer, model: definition.model,
        partNumber: definition.manufacturerPartNumber, description: definition.name,
        quantity: group.references.length,
        references: group.references.slice().sort(function (a, b) { return a.localeCompare(b); }),
        sourcePublisher: source.publisher || '', sourceTitle: source.title || '',
        sourceDocumentRevision: source.documentRevision || '', sourceRevisionNote: source.revisionNote || '',
        sourceUrl: source.url, sourceRetrievedAt: source.retrievedAt || ''
      };
    }).sort(function (a, b) { return a.componentId.localeCompare(b.componentId); });
    return { valid: errors.length === 0, errors: errors, rows: rows };
  }
  function billOfMaterialsCsv(objects) {
    const report = billOfMaterials(objects);
    if (!report.valid) throw new Error('BOM export blocked: ' + report.errors.join(' '));
    const columns = [
      ['Manufacturer', 'manufacturer'], ['Model', 'model'], ['Part number', 'partNumber'],
      ['Description', 'description'], ['Quantity', 'quantity'], ['References', 'references'],
      ['Source publisher', 'sourcePublisher'], ['Source title', 'sourceTitle'],
      ['Source document revision', 'sourceDocumentRevision'], ['Source revision note', 'sourceRevisionNote'],
      ['Source URL', 'sourceUrl'], ['Source retrieved date', 'sourceRetrievedAt']
    ];
    function cell(value) {
      let text = Array.isArray(value) ? value.join(', ') : String(value == null ? '' : value);
      if (/^[=+\-@\t\r]/.test(text)) text = "'" + text;
      return '"' + text.replace(/"/g, '""') + '"';
    }
    const lines = [columns.map(function (column) { return cell(column[0]); }).join(',')];
    report.rows.forEach(function (row) { lines.push(columns.map(function (column) { return cell(row[column[1]]); }).join(',')); });
    return '\uFEFF' + lines.join('\r\n') + '\r\n';
  }


  function wireList(objects) {
    const source = Array.isArray(objects) ? objects : [];
    const wires = source.filter(function (object) { return object && object.kind === 'wire'; });
    const errors = [];
    const seen = new Set();
    wires.forEach(function (wire, index) {
      if (typeof wire.id !== 'string' || !wire.id.trim()) errors.push('Wire ' + (index + 1) + ' has no stable object ID.');
      else if (seen.has(wire.id)) errors.push('Wire ID "' + wire.id + '" is duplicated.');
      else seen.add(wire.id);
    });
    source.forEach(function (object, index) {
      if (object && ['catalog-symbol', 'terminal', 'plc', 'motor', 'ground'].includes(object.kind)) {
        errors.push('Object ' + (object.ref || object.id || index + 1) + ': unverified legacy symbols cannot be used for a connected wire list.');
      }
    });
    const analysis = analyze(source);
    analysis.errors.forEach(function (issue) {
      errors.push((issue.objectId ? issue.objectId + ': ' : '') + issue.message);
    });
    if (errors.length) return { valid: false, errors: errors, rows: [] };

    const netByWire = new Map();
    analysis.nets.forEach(function (net) {
      net.wireIds.forEach(function (id) { netByWire.set(id, net); });
    });
    const pinLocations = [];
    source.forEach(function (instance) {
      if (!instance || instance.kind !== 'component-instance') return;
      const validation = validateInstance(instance);
      if (!validation.valid) return;
      worldPins(instance).forEach(function (pin) {
        pinLocations.push({ ref: instance.ref, number: pin.number, x: pin.x, y: pin.y });
      });
    });
    function refsAt(x, y) {
      return pinLocations.filter(function (pin) {
        return Math.abs(pin.x - x) <= EPSILON && Math.abs(pin.y - y) <= EPSILON;
      }).map(function (pin) { return pin.ref + ':' + pin.number; }).sort();
    }
    const rows = wires.map(function (wire) {
      const net = netByWire.get(wire.id);
      const netPins = net ? net.pins.map(function (pin) { return pin.ref + ':' + pin.number; }).sort() : [];
      return {
        wireId: wire.id,
        netId: net ? net.id : '',
        startX: wire.x1,
        startY: wire.y1,
        bendX: wire.x2,
        endX: wire.x2,
        endY: wire.y2,
        lengthMm: Number((Math.abs(wire.x2 - wire.x1) + Math.abs(wire.y2 - wire.y1)).toFixed(6)),
        startPinRefs: refsAt(wire.x1, wire.y1),
        endPinRefs: refsAt(wire.x2, wire.y2),
        netPinRefs: netPins
      };
    }).sort(function (a, b) { return a.wireId.localeCompare(b.wireId); });
    return { valid: true, errors: [], rows: rows };
  }

  function wireListCsv(objects) {
    const report = wireList(objects);
    if (!report.valid) throw new Error('Wire list export blocked: ' + report.errors.join(' '));
    const columns = [
      ['Wire ID', 'wireId'], ['Net ID', 'netId'], ['Start X (mm)', 'startX'],
      ['Start Y (mm)', 'startY'], ['Bend X (mm)', 'bendX'], ['End X (mm)', 'endX'],
      ['End Y (mm)', 'endY'], ['Route length (mm)', 'lengthMm'],
      ['Start pin references', 'startPinRefs'], ['End pin references', 'endPinRefs'],
      ['Connected pin references on net', 'netPinRefs']
    ];
    function cell(value) {
      let text = Array.isArray(value) ? value.join('; ') : String(value == null ? '' : value);
      if (/^[=+\-@\t\r]/.test(text)) text = "'" + text;
      return '"' + text.replace(/"/g, '""') + '"';
    }
    const lines = [columns.map(function (column) { return cell(column[0]); }).join(',')];
    report.rows.forEach(function (row) {
      lines.push(columns.map(function (column) { return cell(row[column[1]]); }).join(','));
    });
    return '\uFEFF' + lines.join('\r\n') + '\r\n';
  }

  root.AdigunCADEngine = Object.freeze({
    componentSchemaVersion: COMPONENT_SCHEMA_VERSION,
    netSchemaVersion: 1,
    projectFormat: PROJECT_FORMAT,
    projectVersion: PROJECT_VERSION,
    component: component,
    catalog: catalog,
    createInstance: createInstance,
    moveInstance: moveInstance,
    reorderObject: reorderObject,
    rotateInstance: rotateInstance,
    validateInstance: validateInstance,
    worldPins: worldPins,
    validateProject: validateProject,
    serializeProject: serializeProject,
    parseProject: parseProject,
    analyze: analyze,
    billOfMaterials: billOfMaterials,
    billOfMaterialsCsv: billOfMaterialsCsv,
    wireList: wireList,
    wireListCsv: wireListCsv
  });
})(typeof window !== 'undefined' ? window : globalThis);
