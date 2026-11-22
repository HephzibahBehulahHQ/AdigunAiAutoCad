'use strict';

const fs = require('node:fs');
const path = require('node:path');
require('../cad-engine.js');
const engine = globalThis.AdigunCADEngine;
const file = path.join(__dirname, '../examples/real-projects/irrigation-controller.adigun.json');

const cabinet = 'irrigation-plc';
const field = 'irrigation-pressure';
const output = 'irrigation-request';
const operator = 'irrigation-operator';
const feedback = 'irrigation-run-feedback';
const project = {
  product: 'AdigunAiAutoCad', project: 'Irrigation pressure monitoring and pump request', revision: '1.2',
  description: 'Editable pressure instrumentation and isolated pump demand contact for an irrigation controller.',
  activeSheet: cabinet,
  sheets: [
    { id: cabinet, number: 'A2/001', name: 'Controller supply and I/O', projectSectionId: 'A2' },
    { id: field, number: 'A2/002', name: 'Field pressure transmitter', projectSectionId: 'A2' },
    { id: output, number: 'A2/003', name: 'Isolated pump request', projectSectionId: 'A2' },
    { id: operator, number: 'A2/004', name: 'Local irrigation request station', projectSectionId: 'A2' },
    { id: feedback, number: 'A2/005', name: 'Pump starter run feedback at XT3', projectSectionId: 'A2' }
  ],
  objects: [], crossSheetConnections: []
};

function device(sheetId, ref, part, x, y, properties = {}) {
  const instance = engine.createInstance(part, x, y, ref);
  Object.assign(instance, { id: ref.toLowerCase(), sheetId });
  Object.assign(instance.properties, properties);
  project.objects.push(instance);
  return instance;
}

function terminal(sheetId, ref, x, y, terminalStrip, position, marking) {
  return device(sheetId, ref, 'phoenix-contact-3209510', x, y, { terminalStrip, position, marking });
}

function pin(device, number) {
  const anchor = engine.worldPins(device).find(point => point.number === number);
  if (!anchor) throw new Error('Missing terminal ' + device.ref + ':' + number);
  return { x: anchor.x, y: anchor.y, attachment: { instanceId: device.id, pinId: anchor.id } };
}

function wire(sheetId, id, potential, start, end, bends) {
  const stroke = potential === '0 V' ? '#164eac' : potential === '+24 V DC' ? '#b42318' : '#38734b';
  const segment = { id, sheetId, kind: 'wire', potential, stroke, strokeWidth: 1.5,
    x: start.x, y: start.y, x1: start.x, y1: start.y, x2: end.x, y2: end.y };
  if (bends) segment.bends = bends;
  if (start.attachment || end.attachment) {
    segment.pinAttachments = { start: start.attachment || null, end: end.attachment || null };
  }
  project.objects.push(segment);
  return segment;
}

function link(id, name, from, to) {
  project.crossSheetConnections.push({ id, name, endpoints: [from, to].map(([sheetId, item, point, direction], index) => {
    const [targetSheetId, targetRef] = index === 0 ? to : from;
    return { sheetId, wireId: id + (index === 0 ? '-cabinet' : '-remote'), point,
      connector: { direction, targetSheetId, targetRef } };
  }) });
}

const plc = device(cabinet, 'A1', 'siemens-6es7212-1ae40-0xb0', 700, 365);
const supply = terminal(cabinet, 'X1', 395, 205, 'XT1', '1', 'External +24 V DC');
const common = terminal(cabinet, 'X2', 395, 280, 'XT1', '2', 'External 0 V');
const sensor = device(field, 'B1', 'ifm-pn2070', 610, 345, {
  marking: 'Irrigation header pressure', signalConfigurationNote: 'OUT2 wiring assumes voltage mode. Pressure scaling remains unassigned.'
});
const relay = device(output, 'K1', 'phoenix-contact-2966171', 600, 345, { marking: 'Pump request interposing relay' });
const contactCommon = terminal(output, 'X3', 920, 345, 'XT2', '1', 'Remote starter contact common');
const contactNO = terminal(output, 'X4', 920, 400, 'XT2', '2', 'Remote starter pump demand');

const request = device(operator, 'S1', 'schneider-electric-xb5aa31', 605, 345, { marking: 'Local irrigation request' });

const feedbackFeed = terminal(feedback, 'X5', 470, 265, 'XT3', '1', 'Supply to external run contact');
const feedbackReturn = terminal(feedback, 'X6', 470, 390, 'XT3', '2', 'Return from external run contact');

wire(cabinet, 'plc-supply', '+24 V DC', pin(supply, '2'), pin(plc, 'X10:1'), [{ x: 450, y: 205 }, { x: 450, y: 239 }]);
wire(cabinet, 'plc-common', '0 V', pin(common, '2'), pin(plc, 'X10:2'), [{ x: 450, y: 280 }, { x: 450, y: 257 }]);
wire(cabinet, 'input-common', '0 V', { x: 535, y: 257 }, pin(plc, 'X10:6'), [{ x: 535, y: 329 }]);
wire(cabinet, 'analog-common', '0 V', pin(plc, 'X11:1'), { x: 490, y: 257 },
  [{ x: 902, y: 239 }, { x: 902, y: 155 }, { x: 490, y: 155 }]);
wire(cabinet, 'output-supply', '+24 V DC', { x: 480, y: 239 }, pin(plc, 'X12:1'),
  [{ x: 480, y: 135 }, { x: 960, y: 135 }, { x: 960, y: 357 }]);
wire(cabinet, 'output-common', '0 V', { x: 520, y: 257 }, pin(plc, 'X12:2'),
  [{ x: 520, y: 535 }, { x: 925, y: 535 }, { x: 925, y: 373 }]);
wire(output, 'remote-common', 'Remote starter common', pin(relay, '11'), pin(contactCommon, '1'));
wire(output, 'remote-demand', 'Remote starter demand', pin(relay, '14'), pin(contactNO, '1'),
  [{ x: 770, y: 370 }, { x: 770, y: 400 }]);

for (const [id, name, fromRef, from, fromEdge, bends, target, targetPin, side, cable] of [
  ['pressure-feed', '+24 V DC', 'X1', { x: 460, y: 239 }, { x: 215, y: 182 }, [{ x: 460, y: 182 }], sensor, '1', 'left'],
  ['pressure-common', '0 V', 'X2', { x: 490, y: 257 }, { x: 215, y: 475 }, [{ x: 490, y: 475 }], sensor, '3', 'left'],
  ['pressure-voltage', 'B1 OUT2 to AI0', 'A1', pin(plc, 'X11:2'), { x: 1020, y: 257 }, null, sensor, '2', 'right'],
  ['pressure-switch', 'B1 OUT1 to DI a.0', 'A1', pin(plc, 'X10:7'), { x: 215, y: 347 }, null, sensor, '4', 'right'],
  ['pump-request', 'DQ a.0 pump request', 'A1', pin(plc, 'X12:3'), { x: 1020, y: 389 }, null, relay, 'A1', 'left'],
  ['relay-common', '0 V', 'A1', { x: 925, y: 475 }, { x: 1020, y: 475 }, null, relay, 'A2', 'left'],
  ['operator-feed', '+24 V DC', 'X1', { x: 480, y: 135 }, { x: 215, y: 135 }, null, request, '13', 'left', ['W-01', '1']],
  ['operator-request', 'S1 request to DI a.1', 'A1', pin(plc, 'X10:8'), { x: 215, y: 405 },
    [{ x: 555, y: 365 }, { x: 555, y: 405 }], request, '14', 'right', ['W-01', '2']],
  ['run-feedback-feed', '+24 V DC', 'X1', { x: 460, y: 220 }, { x: 215, y: 220 },
    null, feedbackFeed, '1', 'left', ['W-02', '1']],
  ['run-feedback-input', 'XT3 run feedback to DI a.2', 'A1', pin(plc, 'X10:9'), { x: 215, y: 440 },
    [{ x: 565, y: 383 }, { x: 565, y: 440 }], feedbackReturn, '1', 'left', ['W-02', '2']]
]) {
  const targetPoint = pin(target, targetPin);
  const targetEdge = { x: side === 'left' ? 215 : 960, y: targetPoint.y };
  const cabinetSegment = wire(cabinet, id + '-cabinet', name, from, fromEdge, bends);
  const remoteSegment = wire(target.sheetId, id + '-remote', name, targetEdge, targetPoint);
  if (cable) {
    const [cableId, coreId] = cable;
    for (const segment of [cabinetSegment, remoteSegment]) Object.assign(segment, { cableId, coreId });
  }
  link(id, name, [cabinet, fromRef, fromEdge, fromEdge.x < plc.x ? 'left' : 'right'],
    [target.sheetId, target.ref, targetEdge, side]);
}

for (const [sheetId, title, description] of [
  [cabinet, 'IRRIGATION CONTROLLER · POWER AND I/O', 'XT1 is the external 24 V DC boundary. AI0 records header pressure and DI a.0 reads the separate OUT1 signal.'],
  [field, 'IRRIGATION HEADER PRESSURE · B1', 'OUT2 assumes voltage mode. Pressure scaling, OUT1 setpoints and PLC program logic remain unassigned.'],
  [output, 'IRRIGATION PUMP REQUEST · K1', 'XT2 exposes the normally open demand contact. The external starter, motor feeder and safety controls remain outside this drawing.'],
  [operator, 'LOCAL IRRIGATION REQUEST · S1', 'W-01 carries supply and the momentary request to DI a.1. The input requests PLC action through the program.'],
  [feedback, 'PUMP STARTER RUN FEEDBACK · XT3', 'XT3 is the boundary for the external normally open run contact. DI a.2 reports contact state independently of the request to K1.']
]) {
  [title, description].forEach((text, index) => project.objects.push({
    id: sheetId + '-note-' + index, sheetId, kind: 'text', x: 105, y: index ? 585 : 100, text
  }));
}

const serialized = engine.serializeProject(project);
const report = engine.analyzeProject(JSON.parse(serialized));
if (!report.valid || report.openEndpointCount || report.geometryErrorCount || report.findings.some(finding => finding.severity === 'error')) {
  throw new Error('Irrigation controller failed validation.');
}
if (process.argv.includes('--write')) fs.writeFileSync(file, serialized + '\n');
else if (fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n') !== serialized + '\n') {
  throw new Error('Irrigation controller drawing is out of date.');
}
