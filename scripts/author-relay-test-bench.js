'use strict';

const fs = require('node:fs');
const path = require('node:path');
require('../cad-engine.js');
const engine = globalThis.AdigunCADEngine;
const file = path.join(__dirname, '../examples/real-projects/relay-test-bench.adigun.json');
const actuation = 'bench-coil-actuation';
const indication = 'bench-contact-indication';
const project = {
  product: 'AdigunAiAutoCad', project: 'Relay changeover test bench', revision: '1.0',
  description: 'Manual coil actuation and separately powered NC and NO indication for an industrial relay test fixture.',
  activeSheet: actuation,
  sheets: [
    { id: actuation, number: 'A2/001', name: 'Manual relay coil actuation', projectSectionId: 'A2' },
    { id: indication, number: 'A2/002', name: 'Dry changeover contact indication', projectSectionId: 'A2' }
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

function terminal(sheetId, ref, x, y, strip, position, marking) {
  return device(sheetId, ref, 'phoenix-contact-3209510', x, y, { terminalStrip: strip, position, marking });
}

function pin(object, number) {
  const anchor = engine.worldPins(object).find(point => point.number === number);
  if (!anchor) throw new Error('Unknown terminal ' + object.ref + ':' + number);
  return { x: anchor.x, y: anchor.y, attachment: { instanceId: object.id, pinId: anchor.id } };
}

function wire(sheetId, id, potential, start, end, bends) {
  const object = {
    id, sheetId, kind: 'wire', x: start.x, y: start.y, x1: start.x, y1: start.y, x2: end.x, y2: end.y,
    potential, stroke: potential.includes('0 V') ? '#164eac' : '#38734b', strokeWidth: 1.5
  };
  if (bends) object.bends = bends;
  if (start.attachment || end.attachment) object.pinAttachments = { start: start.attachment || null, end: end.attachment || null };
  project.objects.push(object);
  return object;
}

const coilSupply = terminal(actuation, 'X1', 300, 320, 'XT1', '1', 'Coil supply +24 V');
const coilReturn = terminal(actuation, 'X2', 300, 240, 'XT1', '2', 'Coil supply 0 V');
const button = device(actuation, 'S1', 'schneider-electric-xb5aa31', 500, 320, { marking: 'Energize relay under test' });
const relay = device(actuation, 'K1', 'phoenix-contact-2966171', 720, 345, { marking: 'Relay under test' });
wire(actuation, 'coil-feed', 'Coil supply +24 V', pin(coilSupply, '2'), pin(button, '13'));
wire(actuation, 'coil-command', 'Switched coil supply', pin(button, '14'), pin(relay, 'A1'), [{ x: 600, y: 320 }, { x: 600, y: 365 }]);
wire(actuation, 'coil-return', 'Coil supply 0 V', pin(coilReturn, '2'), pin(relay, 'A2'), [{ x: 625, y: 240 }, { x: 625, y: 325 }]);

const lampSupply = terminal(indication, 'X3', 510, 220, 'XT2', '1', 'Indicator supply +24 V');
const lampReturn = terminal(indication, 'X4', 890, 335, 'XT2', '2', 'Indicator supply 0 V');
const ncLamp = device(indication, 'H1', 'schneider-electric-xb5avb3', 710, 285, { marking: 'Normally closed path' });
const noLamp = device(indication, 'H2', 'schneider-electric-xb5avb3', 710, 385, { marking: 'Normally open path' });

for (const [coreId, relayPin, potential, destination, targetPin, boundaryX, direction] of [
  ['1', '11', 'Indicator supply +24 V', lampSupply, '2', 955, 'right'],
  ['2', '12', 'Normally closed indication', ncLamp, 'X1', 210, 'left'],
  ['3', '14', 'Normally open indication', noLamp, 'X1', 210, 'left']
]) {
  const start = pin(relay, relayPin), end = pin(destination, targetPin);
  const id = 'fixture-core-' + coreId;
  const send = wire(actuation, id + '-relay', potential, start, { x: 970, y: start.y });
  const receive = wire(indication, id + '-indicator', potential, { x: boundaryX, y: end.y }, end);
  for (const segment of [send, receive]) Object.assign(segment, { cableId: 'W-T01', coreId });
  project.crossSheetConnections.push({ id, name: 'W-T01:' + coreId + ' · ' + potential, endpoints: [
    { sheetId: actuation, wireId: send.id, point: { x: send.x2, y: send.y2 }, connector: { direction: 'right', targetSheetId: indication, targetRef: destination.ref } },
    { sheetId: indication, wireId: receive.id, point: { x: receive.x1, y: receive.y1 }, connector: { direction, targetSheetId: actuation, targetRef: relay.ref } }
  ] });
}
const join = { x: 795, y: 335 };
for (const lamp of [ncLamp, noLamp]) {
  const output = pin(lamp, 'X2');
  wire(indication, lamp.id + '-return', 'Indicator supply 0 V', output, join, [{ x: join.x, y: output.y }]);
}
wire(indication, 'indicator-return', 'Indicator supply 0 V', join, pin(lampReturn, '1'));

for (const [sheetId, title, lines] of [
  [actuation, 'RELAY TEST BENCH · COIL ACTUATION', [
    'S1 applies the XT1 coil supply to K1 A1. K1 A2 returns to XT1:2.',
    'W-T01 takes K1 common, normally closed and normally open terminals to the indication sheet.'
  ]],
  [indication, 'RELAY TEST BENCH · CHANGEOVER INDICATION', [
    'With indicator power available, H1 shows the NC path at rest and H2 shows the NO path when K1 operates.',
    'XT2 is the independent indicator supply. The drawing leaves source hardware, protection and test procedure unassigned.'
  ]]
]) {
  [title, ...lines].forEach((text, index) => project.objects.push({
    id: sheetId + '-note-' + index, sheetId, kind: 'text', x: 105, y: [110, 510, 555][index], text
  }));
}

const serialized = engine.serializeProject(project);
const report = engine.analyzeProject(JSON.parse(serialized));
if (!report.valid || report.openEndpointCount || report.geometryErrorCount || report.findings.some(finding => finding.severity === 'error')) {
  throw new Error('Relay test bench failed electrical validation.');
}
if (process.argv.includes('--write')) fs.writeFileSync(file, serialized + '\n');
else if (fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n') !== serialized + '\n') {
  throw new Error('Relay test bench drawing is out of date.');
}
