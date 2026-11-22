'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { isDeepStrictEqual } = require('node:util');
require('../cad-engine.js');
const engine = globalThis.AdigunCADEngine;
const file = path.join(__dirname, '../examples/real-projects/terminal-marshalling.adigun.json');
const cabinet = 'marshalling-cabinet';
const field = 'marshalling-field';
const operator = 'marshalling-operator-station';
const protectiveEarth = 'marshalling-protective-earth';
const project = {
  product: 'AdigunAiAutoCad', project: 'Controller-to-field terminal marshalling', revision: '1.2',
  description: 'Feed-through marshalling for a 24 V sensor, a two-button operator station, and separate protective-earth boundaries.',
  activeSheet: cabinet,
  sheets: [
    { id: cabinet, number: 'A2/001', name: 'Controller and XT1 terminals', projectSectionId: 'A2' },
    { id: field, number: 'A2/002', name: 'Field XT2 and sensor wiring', projectSectionId: 'A2' },
    { id: operator, number: 'A2/003', name: 'XT3 operator station requests', projectSectionId: 'A2' },
    { id: protectiveEarth, number: 'A2/004', name: 'Protective-earth terminal distribution', projectSectionId: 'A2' }
  ],
  objects: [], crossSheetConnections: []
};

function device(sheetId, ref, part, x, y, properties = {}) {
  const object = engine.createInstance(part, x, y, ref);
  Object.assign(object, { id: ref.toLowerCase(), sheetId });
  Object.assign(object.properties, properties);
  project.objects.push(object);
  return object;
}

function pin(device, number) {
  const point = engine.worldPins(device).find(candidate => candidate.number === number);
  if (!point) throw Error(device.ref + ' has no terminal ' + number);
  return { x: point.x, y: point.y, attachment: { instanceId: device.id, pinId: point.id } };
}

function wire(sheetId, id, potential, points, cableCore) {
  const stroke = potential.includes('return') || potential.includes('0 V') ? '#164eac' : potential.includes('+24 V') ? '#b42318' : '#38734b';
  return points.slice(1).map((end, index) => {
    const start = points[index];
    if (start.x !== end.x && start.y !== end.y) throw Error('Non-orthogonal route: ' + id);
    const object = { id: id + '-' + (index + 1), kind: 'wire', sheetId, x: start.x, y: start.y,
      x1: start.x, y1: start.y, x2: end.x, y2: end.y, potential, stroke, strokeWidth: 1.5 };
    if (start.attachment || end.attachment) object.pinAttachments = { start: start.attachment || null, end: end.attachment || null };
    if (cableCore) Object.assign(object, cableCore);
    project.objects.push(object);
    return object;
  })[0];
}

function point(x, y) { return { x, y }; }
const terminal = (sheetId, ref, x, y, strip, position, marking, part = 'phoenix-contact-3209510') =>
  device(sheetId, ref, part, x, y, { terminalStrip: strip, position, marking });
const cabinetSupply = terminal(cabinet, 'X1', 310, 327, 'XT1', '1', 'Sensor supply and return', 'phoenix-contact-3210567');
const cabinetSignal = terminal(cabinet, 'X2', 310, 440, 'XT1', '2', 'Sensor switching signal');
const externalPlus = terminal(cabinet, 'X3', 495, 195, 'XT0', '1', 'External +24 V DC');
const externalReturn = terminal(cabinet, 'X4', 495, 245, 'XT0', '2', 'External 0 V');
const cpu = device(cabinet, 'A1', 'siemens-6es7212-1ae40-0xb0', 850, 390);
const fieldSupply = terminal(field, 'X5', 325, 360, 'XT2', '1', 'Sensor supply and return', 'phoenix-contact-3210567');
const fieldSignal = terminal(field, 'X6', 325, 470, 'XT2', '2', 'Sensor switching signal');
const sensor = device(field, 'B1', 'ifm-ifs204', 650, 365, { marking: 'Field proximity sensor' });

const sensorPlus = 'Sensor +24 V', sensorReturn = 'Sensor return', switching = 'B1 switching signal';
wire(cabinet, 'external-plus', 'External +24 V', [pin(externalPlus, '2'), point(677, 195), point(677, 264), pin(cpu, 'X10:1')]);
wire(cabinet, 'external-return', sensorReturn, [pin(externalReturn, '2'), point(620, 245), point(620, 282), pin(cpu, 'X10:2')]);
wire(cabinet, 'sensor-plus', sensorPlus, [pin(cabinetSupply, '1:2'), point(525, 312), point(525, 318), pin(cpu, 'X10:4')]);
wire(cabinet, 'sensor-return', sensorReturn, [pin(cabinetSupply, '2:2'), point(525, 342), point(525, 336), pin(cpu, 'X10:5')]);
wire(cabinet, 'return-reference', sensorReturn, [point(690, 282), point(690, 336), point(690, 354), pin(cpu, 'X10:6')]);
wire(cabinet, 'sensor-input', switching, [pin(cabinetSignal, '2'), point(560, 440), point(560, 372), pin(cpu, 'X10:7')]);
wire(field, 'sensor-power', sensorPlus, [pin(fieldSupply, '1:2'), pin(sensor, '1')]);
wire(field, 'sensor-ground', sensorReturn, [pin(fieldSupply, '2:2'), point(505, 375), point(505, 385), pin(sensor, '3')]);
wire(field, 'sensor-output', switching, [pin(sensor, '4'), point(805, 365), point(805, 470), pin(fieldSignal, '2')]);

function connectTerminals(key, name, potential, from, fromPin, to, toPin, cableCore, sourceBoundaryX = 190, targetBoundaryX = 190, wireIds = [key + '-source', key + '-target']) {
  const source = pin(from, fromPin), target = pin(to, toPin);
  const send = wire(from.sheetId, wireIds[0], potential, [source, point(sourceBoundaryX, source.y)], cableCore);
  const receive = wire(to.sheetId, wireIds[1], potential, [target, point(targetBoundaryX, target.y)], cableCore);
  project.crossSheetConnections.push({ id: key, name, endpoints: [
    { sheetId: from.sheetId, wireId: send.id, point: point(send.x2, send.y2), connector: { direction: sourceBoundaryX > source.x ? 'right' : 'left', targetSheetId: to.sheetId, targetRef: to.ref } },
    { sheetId: to.sheetId, wireId: receive.id, point: point(receive.x2, receive.y2), connector: { direction: targetBoundaryX > target.x ? 'right' : 'left', targetSheetId: from.sheetId, targetRef: from.ref } }
  ] });
}

function connectCableCore(cableId, coreId, potential, from, fromPin, to, toPin, fieldBoundaryX = 190) {
  const key = cableId.toLowerCase().replace('-', '');
  const wireIds = [key + '-cabinet-' + coreId, key + '-field-' + coreId];
  connectTerminals(key + '-core-' + coreId, cableId + ':' + coreId + ' · ' + potential, potential,
    from, fromPin, to, toPin, { cableId, coreId }, 190, fieldBoundaryX, wireIds);
}

for (const [core, potential, from, fromPin, to, toPin] of [
  ['1', sensorPlus, cabinetSupply, '1:1', fieldSupply, '1:1'],
  ['2', sensorReturn, cabinetSupply, '2:1', fieldSupply, '2:1'],
  ['3', switching, cabinetSignal, '1', fieldSignal, '1']
]) connectCableCore('W-01', core, potential, from, fromPin, to, toPin);

const operatorFeed = terminal(cabinet, 'X7', 310, 274, 'XT1', '3', 'Operator station feed');
const startInput = terminal(cabinet, 'X8', 310, 480, 'XT1', '4', 'Start request');
const stopInput = terminal(cabinet, 'X9', 310, 520, 'XT1', '5', 'Operational stop request');
const stationFeed = terminal(operator, 'X10', 310, 250, 'XT3', '1', 'Operator station feed');
const stationStart = terminal(operator, 'X11', 795, 300, 'XT3', '2', 'Start request');
const stationStop = terminal(operator, 'X12', 795, 420, 'XT3', '3', 'Operational stop request');
const startSwitch = device(operator, 'S1', 'schneider-electric-xb5aa31', 575, 300, { marking: 'Start request' });
const stopSwitch = device(operator, 'S2', 'schneider-electric-xb5aa42', 575, 420, { marking: 'Operational stop request' });
const start = 'Start request', stop = 'Operational stop request';
wire(cabinet, 'station-feed', sensorPlus, [point(500, 312), point(500, 274), pin(operatorFeed, '2')]);
wire(cabinet, 'start-input', start, [pin(startInput, '2'), point(590, 480), point(590, 390), pin(cpu, 'X10:8')]);
wire(cabinet, 'stop-input', stop, [pin(stopInput, '2'), point(615, 520), point(615, 408), pin(cpu, 'X10:9')]);
wire(operator, 'station-feed-trunk', sensorPlus, [pin(stationFeed, '2'), point(410, 250), point(410, 300), point(410, 420), pin(stopSwitch, '21')]);
wire(operator, 'station-start-feed', sensorPlus, [point(410, 300), pin(startSwitch, '13')]);
wire(operator, 'station-start-return', start, [pin(startSwitch, '14'), pin(stationStart, '1')]);
wire(operator, 'station-stop-return', stop, [pin(stopSwitch, '22'), pin(stationStop, '1')]);
connectCableCore('W-02', '1', sensorPlus, operatorFeed, '1', stationFeed, '1');
connectCableCore('W-02', '2', start, startInput, '1', stationStart, '2', 920);
connectCableCore('W-02', '3', stop, stopInput, '1', stationStop, '2', 920);

const peTerminal = (sheetId, ref, x, y, strip, position, marking) =>
  terminal(sheetId, ref, x, y, strip, position, marking, 'phoenix-contact-3209536');
const peSource = peTerminal(cabinet, 'X13', 310, 690, 'XT0', '3', 'Incoming PE boundary');
const peEntry = peTerminal(protectiveEarth, 'X14', 310, 275, 'XT4', '1', 'PE entry');
const peField = peTerminal(protectiveEarth, 'X15', 650, 275, 'XT4', '2', 'Field PE branch');
const peOperator = peTerminal(protectiveEarth, 'X16', 650, 410, 'XT4', '3', 'Operator station PE branch');
const fieldPeBoundary = peTerminal(field, 'X17', 410, 690, 'XT2', '3', 'Field equipment PE boundary');
const operatorPeBoundary = peTerminal(operator, 'X18', 410, 715, 'XT3', '4', 'Operator enclosure PE boundary');
wire(protectiveEarth, 'pe-trunk', 'PE', [pin(peEntry, '2'), pin(peField, '1')]);
wire(protectiveEarth, 'pe-operator-branch', 'PE', [point(490, 275), point(490, 410), pin(peOperator, '1')]);
connectTerminals('pe-incoming', 'Incoming PE', 'PE', peSource, '1', peEntry, '1');
connectTerminals('pe-field', 'Field protective conductor', 'PE', peField, '2', fieldPeBoundary, '1', null, 870);
connectTerminals('pe-operator', 'Operator station protective conductor', 'PE', peOperator, '2', operatorPeBoundary, '1', null, 870);

for (const [sheetId, title, note] of [
  [cabinet, 'XT1 · CONTROLLER MARSHALLING', 'XT0 is the external supply boundary. A1 sensor supply feeds XT1; X10:7 receives the PNP switching signal.'],
  [field, 'XT2 · FIELD SENSOR MARSHALLING', 'W-01 cores 1, 2 and 3 carry sensor supply, return and switching signal through XT2.'],
  [operator, 'XT3 · OPERATOR STATION MARSHALLING', 'W-02 carries a common feed, a normally open Start request and a normally closed operational Stop request.'],
  [protectiveEarth, 'XT4 · PROTECTIVE-EARTH DISTRIBUTION', 'Incoming PE is routed separately to the field equipment and operator enclosure terminal boundaries.']
]) {
  project.objects.push({ id: sheetId + '-title', sheetId, kind: 'text', x: 105, y: 97, text: title });
  project.objects.push({ id: sheetId + '-note', sheetId, kind: 'text', x: 105, y: 565, text: note });
  project.objects.push({ id: sheetId + '-scope', sheetId, kind: 'text', x: 105, y: 602,
    text: 'Reference drawing. External supply hardware, cable construction, conductor sizing and PLC logic remain unassigned.' });
}
project.objects.push({ id: operator + '-operational-scope', sheetId: operator, kind: 'text', x: 105, y: 640,
  text: 'The Stop contact documents a PLC input request. Emergency-stop and safety functions are outside this drawing.' });
project.objects.push({ id: protectiveEarth + '-scope-review', sheetId: protectiveEarth, kind: 'text', x: 105, y: 640,
  text: 'The drawing defines terminal connectivity. Physical bonding paths, rail mounting and protective-conductor sizing require review.' });

const report = engine.analyzeProject(JSON.parse(engine.serializeProject(project)));
const errors = (report.findings || []).filter(finding => finding.severity === 'error');
if (!report.valid || report.openEndpointCount || report.geometryErrorCount || errors.length) throw Error(JSON.stringify({ errors, report: report.errors, open: report.openEndpoints }));
const serialized = engine.serializeProject(project);
if (process.argv.includes('--write')) fs.writeFileSync(file, serialized + '\n');
else if (!isDeepStrictEqual(JSON.parse(fs.readFileSync(file, 'utf8')), JSON.parse(serialized))) throw Error('Terminal-marshalling drawing is out of date.');
