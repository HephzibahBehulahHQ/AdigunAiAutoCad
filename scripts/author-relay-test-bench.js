'use strict';

const fs = require('node:fs');
const path = require('node:path');
require('../cad-engine.js');
const engine = globalThis.AdigunCADEngine;
const file = path.join(__dirname, '../examples/real-projects/relay-test-bench.adigun.json');
const actuation = 'bench-coil-actuation';
const indication = 'bench-contact-indication';
const diagnostics = 'bench-coil-test-access';
const contactTest = 'bench-contact-test-access';
const supplyCheck = 'bench-supply-check';
const indicatorDisconnect = 'bench-indicator-disconnect';
const switchedIndicatorCheck = 'bench-switched-indicator-check';
const project = {
  product: 'AdigunAiAutoCad', project: 'Relay changeover test bench', revision: '1.5',
  description: 'Manual coil actuation, dry contact indication, and separate coil, contact and supply diagnostics for an industrial relay test fixture.',
  activeSheet: actuation,
  sheets: [
    { id: actuation, number: 'A2/001', name: 'Manual relay coil actuation', projectSectionId: 'A2' },
    { id: indication, number: 'A2/002', name: 'Dry changeover contact indication', projectSectionId: 'A2' },
    { id: diagnostics, number: 'A2/003', name: 'XT3 relay coil voltage test access', projectSectionId: 'A2' },
    { id: contactTest, number: 'A2/004', name: 'XT4 NC and NO output test access', projectSectionId: 'A2' },
    { id: supplyCheck, number: 'A2/005', name: 'XT5 independent supply presence checks', projectSectionId: 'A2' },
    { id: indicatorDisconnect, number: 'A2/006', name: 'XT2 indicator supply disconnect', projectSectionId: 'A2' },
    { id: switchedIndicatorCheck, number: 'A2/007', name: 'XT6 switched indicator voltage check', projectSectionId: 'A2' }
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

function link(id, name, send, receive, sourceRef, targetRef, sourceDirection, targetDirection) {
  project.crossSheetConnections.push({ id, name, endpoints: [
    { sheetId: send.sheetId, wireId: send.id, point: { x: send.x2, y: send.y2 }, connector: { direction: sourceDirection, targetSheetId: receive.sheetId, targetRef } },
    { sheetId: receive.sheetId, wireId: receive.id, point: { x: receive.x1, y: receive.y1 }, connector: { direction: targetDirection, targetSheetId: send.sheetId, targetRef: sourceRef } }
  ] });
}

const coilSupply = terminal(actuation, 'X1', 300, 320, 'XT1', '1', 'Coil supply +24 V');
const coilReturn = terminal(actuation, 'X2', 300, 240, 'XT1', '2', 'Coil supply 0 V');
const button = device(actuation, 'S1', 'schneider-electric-xb5aa31', 500, 320, { marking: 'Energize relay under test' });
const relay = device(actuation, 'K1', 'phoenix-contact-2966171', 720, 345, { marking: 'Relay under test' });
const disconnect = device(actuation, 'X14', 'phoenix-contact-3210156', 400, 320,
  { terminalStrip: 'XT1', position: '3', marking: 'Coil supply disconnect', knifePosition: 'closed' });
wire(actuation, 'coil-feed', 'Coil supply +24 V', pin(coilSupply, '2'), pin(disconnect, '1'));
wire(actuation, 'coil-feed-switched-terminal', 'Coil supply +24 V', pin(disconnect, '2'), pin(button, '13'));
wire(actuation, 'coil-command', 'Switched coil supply', pin(button, '14'), pin(relay, 'A1'), [{ x: 600, y: 320 }, { x: 600, y: 365 }]);
wire(actuation, 'coil-return', 'Coil supply 0 V', pin(coilReturn, '2'), pin(relay, 'A2'), [{ x: 625, y: 240 }, { x: 625, y: 325 }]);

const lampSupply = terminal(indicatorDisconnect, 'X3', 370, 310, 'XT2', '1', 'Indicator supply +24 V');
const lampDisconnect = device(indicatorDisconnect, 'X15', 'phoenix-contact-3210156', 625, 310,
  { terminalStrip: 'XT2', position: '3', marking: 'Indicator supply disconnect', knifePosition: 'closed' });
wire(indicatorDisconnect, 'indicator-disconnect-feed', 'Indicator supply +24 V', pin(lampSupply, '2'), pin(lampDisconnect, '1'));
const lampReturn = terminal(indication, 'X4', 890, 335, 'XT2', '2', 'Indicator supply 0 V');
const ncLamp = device(indication, 'H1', 'schneider-electric-xb5avb3', 710, 285, { marking: 'Normally closed path' });
const noLamp = device(indication, 'H2', 'schneider-electric-xb5avb3', 710, 385, { marking: 'Normally open path' });

for (const [coreId, relayPin, potential, destination, targetPin, boundaryX, direction] of [
  ['1', '11', 'Indicator supply +24 V', lampDisconnect, '2', 955, 'right'],
  ['2', '12', 'Normally closed indication', ncLamp, 'X1', 210, 'left'],
  ['3', '14', 'Normally open indication', noLamp, 'X1', 210, 'left']
]) {
  const start = pin(relay, relayPin), end = pin(destination, targetPin);
  const id = 'fixture-core-' + coreId;
  const send = wire(actuation, id + '-relay', potential, start, { x: 970, y: start.y });
  const receive = wire(destination.sheetId, id + '-indicator', potential, { x: boundaryX, y: end.y }, end);
  for (const segment of [send, receive]) Object.assign(segment, { cableId: 'W-T01', coreId });
  link(id, 'W-T01:' + coreId + ' · ' + potential, send, receive, relay.ref, destination.ref, 'right', direction);
}
const join = { x: 795, y: 335 };
for (const lamp of [ncLamp, noLamp]) {
  const output = pin(lamp, 'X2');
  wire(indication, lamp.id + '-return', 'Indicator supply 0 V', output, join, [{ x: join.x, y: output.y }]);
}
wire(indication, 'indicator-return', 'Indicator supply 0 V', join, pin(lampReturn, '1'));

const downstreamLamp = device(switchedIndicatorCheck, 'H6', 'schneider-electric-xb5avb3', 605, 340,
  { marking: 'Switched indicator voltage' });
for (const [id, sourceSheet, sourceRef, ref, position, potential, tap, end, entryX, terminalPin, lampPin] of [
  ['switched-indicator-feed', indicatorDisconnect, 'X15', 'X16', '1', 'Indicator supply +24 V',
    { x: 780, y: 310 }, { x: 780, y: 425 }, 215, '1', 'X1'],
  ['switched-indicator-reference', indication, 'X4', 'X17', '2', 'Indicator supply 0 V',
    { x: 840, y: 335 }, { x: 840, y: 468 }, 1010, '2', 'X2']
]) {
  const testPoint = terminal(switchedIndicatorCheck, ref, terminalPin === '1' ? 370 : 840, 340, 'XT6', position, potential);
  const entry = pin(testPoint, terminalPin);
  const send = wire(sourceSheet, id + '-send', potential, tap, end);
  const receive = wire(switchedIndicatorCheck, id + '-receive', potential, { x: entryX, y: entry.y }, entry);
  wire(switchedIndicatorCheck, id + '-lamp', potential, pin(testPoint, terminalPin === '1' ? '2' : '1'), pin(downstreamLamp, lampPin));
  link(id, 'XT6 ' + potential, send, receive, sourceRef, ref, 'right', terminalPin === '1' ? 'left' : 'right');
}

const testPlus = terminal(diagnostics, 'X5', 370, 340, 'XT3', '1', 'Coil A1 voltage test point');
const testReturn = terminal(diagnostics, 'X6', 850, 340, 'XT3', '2', 'Coil A2 voltage test point');
const coilLamp = device(diagnostics, 'H3', 'schneider-electric-xb5avb3', 605, 340, { marking: 'Coil voltage indication' });
for (const [id, potential, tap, boundary, destination, destinationPin, entryX, direction, lampPin] of [
  ['coil-test-feed', 'Switched coil supply', { x: 610, y: 365 }, { x: 610, y: 455 }, testPlus, '1', 210, 'left', 'X1'],
  ['coil-test-return', 'Coil supply 0 V', { x: 455, y: 240 }, { x: 455, y: 165 }, testReturn, '2', 1000, 'right', 'X2']
]) {
  const end = pin(destination, destinationPin);
  const send = wire(actuation, id + '-send', potential, tap, boundary);
  const receive = wire(diagnostics, id + '-receive', potential, { x: entryX, y: end.y }, end);
  const inner = pin(destination, destinationPin === '1' ? '2' : '1');
  wire(diagnostics, id + '-lamp', potential, inner, pin(coilLamp, lampPin));
  link(id, 'XT3 ' + potential, send, receive, relay.ref, destination.ref, 'right', direction);
}

for (const [id, sourceRef, ref, position, y, potential, tap, boundary] of [
  ['nc-test', 'H1', 'X7', '1', 265, 'Normally closed indication', { x: 420, y: 285 }, { x: 420, y: 245 }],
  ['no-test', 'H2', 'X8', '2', 340, 'Normally open indication', { x: 420, y: 385 }, { x: 420, y: 440 }],
  ['contact-reference', 'X4', 'X9', '3', 415, 'Indicator supply 0 V', { x: 820, y: 335 }, { x: 820, y: 455 }]
]) {
  const destination = terminal(contactTest, ref, 540, y, 'XT4', position, potential);
  const send = wire(indication, id + '-send', potential, tap, boundary);
  const receive = wire(contactTest, id + '-receive', potential, { x: 220, y }, pin(destination, '1'));
  link(id, 'XT4 ' + potential, send, receive, sourceRef, ref, 'right', 'left');
}

const coilSupplyLamp = device(supplyCheck, 'H4', 'schneider-electric-xb5avb3', 605, 265, { marking: 'Coil supply present' });
const indicatorSupplyLamp = device(supplyCheck, 'H5', 'schneider-electric-xb5avb3', 605, 390, { marking: 'Indicator supply present' });
const indicatorPositive = pin(lampSupply, '1');
const indicatorNegative = pin(lampReturn, '2');
for (const [id, sheetId, sourceRef, lamp, ref, position, potential, start, end, lampPin, direction] of [
  ['coil-supply-plus', actuation, 'X1', coilSupplyLamp, 'X10', '1', 'Coil supply +24 V', { x: 350, y: 320 }, { x: 350, y: 405 }, 'X1', 'right'],
  ['coil-supply-minus', actuation, 'X2', coilSupplyLamp, 'X11', '2', 'Coil supply 0 V', { x: 540, y: 240 }, { x: 540, y: 185 }, 'X2', 'right'],
  ['indicator-supply-plus', indicatorDisconnect, 'X3', indicatorSupplyLamp, 'X12', '3', 'Indicator supply +24 V', indicatorPositive, { x: 215, y: indicatorPositive.y }, 'X1', 'left'],
  ['indicator-supply-minus', indication, 'X4', indicatorSupplyLamp, 'X13', '4', 'Indicator supply 0 V', indicatorNegative, { x: 1030, y: indicatorNegative.y }, 'X2', 'right']
]) {
  const positive = lampPin === 'X1';
  const destination = terminal(supplyCheck, ref, positive ? 370 : 840, lamp.y, 'XT5', position, potential);
  const send = wire(sheetId, id + '-send', potential, start, end);
  const receive = wire(supplyCheck, id + '-receive', potential, { x: positive ? 215 : 1010, y: lamp.y }, pin(destination, positive ? '1' : '2'));
  wire(supplyCheck, id + '-lamp', potential, pin(destination, positive ? '2' : '1'), pin(lamp, lampPin));
  link(id, 'XT5 ' + potential, send, receive, sourceRef, ref, direction, positive ? 'left' : 'right');
}

for (const [sheetId, title, lines] of [
  [actuation, 'RELAY TEST BENCH · COIL ACTUATION', [
    'X14 disconnects the S1 feed. With X14 closed, S1 applies the XT1 coil supply to K1 A1.',
    'W-T01 takes K1 common, normally closed and normally open terminals to the indication sheet.'
  ]],
  [indication, 'RELAY TEST BENCH · CHANGEOVER INDICATION', [
    'With indicator power available, H1 shows the NC path at rest and H2 shows the NO path when K1 operates.',
    'XT2 is the independent indicator supply. The drawing leaves source hardware, protection and test procedure unassigned.'
  ]],
  [diagnostics, 'RELAY TEST BENCH · XT3 COIL VOLTAGE TEST ACCESS', [
    'XT3 provides access to the commanded coil voltage between K1 A1 and A2.',
    'H3 indicates voltage at the test terminals. H1 and H2 on A2/002 show the resulting contact paths.'
  ]],
  [contactTest, 'RELAY TEST BENCH · XT4 CONTACT OUTPUT TEST ACCESS', [
    'XT4:1 and XT4:2 expose the powered NC and NO paths respectively. XT4:3 is their indicator supply reference.',
    'This sheet leaves test equipment and measured values unassigned.'
  ]],
  [supplyCheck, 'RELAY TEST BENCH · XT5 INDEPENDENT SUPPLY CHECKS', [
    'H4 checks the incoming coil supply upstream of S1. H5 checks the separate indicator supply.',
    'The two returns remain independent. Lamp illumination indicates local voltage at each branch.'
  ]],
  [indicatorDisconnect, 'RELAY TEST BENCH · INDICATOR SUPPLY DISCONNECT', [
    'X15 opens the indicator feed to K1 common. H5 monitors the supply upstream of X15.',
    'The coil is on a separate supply. The drawing does not establish a physical isolation procedure.'
  ]],
  [switchedIndicatorCheck, 'RELAY TEST BENCH · XT6 SWITCHED INDICATOR VOLTAGE', [
    'H6 monitors the feed downstream of X15. H5 on A2/005 monitors the upstream supply.',
    'XT6 provides local test access across the switched feed and its independent return.'
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
