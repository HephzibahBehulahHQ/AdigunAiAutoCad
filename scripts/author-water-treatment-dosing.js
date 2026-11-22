'use strict';

const fs = require('node:fs');
const path = require('node:path');
require('../cad-engine.js');
const engine = globalThis.AdigunCADEngine;
const file = path.join(__dirname, '../examples/real-projects/water-treatment-dosing.adigun.json');

const cabinet = 'dosing-controller';
const sensing = 'dosing-pressure-monitoring';
const command = 'dosing-enable-interface';
const project = {
  product: 'AdigunAiAutoCad', project: 'Water-treatment dosing and pressure monitoring', revision: '1.0',
  description: 'Two independent filter pressure inputs and an isolated dosing-enable contact interface.',
  activeSheet: cabinet,
  sheets: [
    { id: cabinet, number: 'A2/001', name: 'PLC supply, analog inputs and dosing output', projectSectionId: 'A2' },
    { id: sensing, number: 'A2/002', name: 'Filter inlet and outlet pressure transmitters', projectSectionId: 'A2' },
    { id: command, number: 'A2/003', name: 'Isolated chemical dosing enable contact', projectSectionId: 'A2' }
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

function terminal(sheetId, ref, x, y, terminalStrip, position, marking) {
  return device(sheetId, ref, 'phoenix-contact-3209510', x, y, { terminalStrip, position, marking });
}

function pin(object, number) {
  const anchor = engine.worldPins(object).find(point => point.number === number);
  if (!anchor) throw new Error('Missing terminal ' + object.ref + ':' + number);
  return { x: anchor.x, y: anchor.y, attachment: { instanceId: object.id, pinId: anchor.id } };
}

function wire(sheetId, id, potential, start, end, bends) {
  const stroke = potential === '+24 V DC' ? '#b42318' : potential === '0 V' ? '#164eac' : '#38734b';
  const segment = { id, sheetId, kind: 'wire', potential, stroke, strokeWidth: 1.5,
    x: start.x, y: start.y, x1: start.x, y1: start.y, x2: end.x, y2: end.y };
  if (bends) segment.bends = bends;
  if (start.attachment || end.attachment) {
    segment.pinAttachments = { start: start.attachment || null, end: end.attachment || null };
  }
  project.objects.push(segment);
}

function port(sheetId, ref, connection, x, y, direction, bends) {
  return { sheetId, ref, connection, edge: { x, y }, direction, bends };
}

function connect(id, potential, cabinetPort, fieldPort) {
  const endpoints = [cabinetPort, fieldPort].map((source, index) => {
    const target = index === 0 ? fieldPort : cabinetPort;
    const wireId = id + (index === 0 ? '-cabinet' : '-field');
    wire(source.sheetId, wireId, potential, source.connection, source.edge, source.bends);
    return { sheetId: source.sheetId, wireId, point: source.edge, connector: {
      direction: source.direction, targetSheetId: target.sheetId, targetRef: target.ref
    } };
  });
  project.crossSheetConnections.push({ id, name: potential, endpoints });
}

const plc = device(cabinet, 'A1', 'siemens-6es7212-1ae40-0xb0', 730, 360);
const source = terminal(cabinet, 'X1', 370, 234, 'XT1', '1', 'External control +24 V DC');
const common = terminal(cabinet, 'X2', 370, 292, 'XT1', '2', 'External control 0 V');
const inlet = device(sensing, 'B1', 'ifm-pn2070', 610, 290, { marking: 'Filter inlet pressure' });
const outlet = device(sensing, 'B2', 'ifm-pn2070', 610, 455, { marking: 'Filter outlet pressure' });
const relay = device(command, 'K1', 'phoenix-contact-2966171', 605, 350, { marking: 'Dosing-enable relay' });
const contactCommon = terminal(command, 'X3', 905, 350, 'XT2', '1', 'External dosing controller common');
const contactEnable = terminal(command, 'X4', 905, 420, 'XT2', '2', 'External dosing enable request');

wire(cabinet, 'plc-power', '+24 V DC', pin(source, '2'), pin(plc, 'X10:1'));
wire(cabinet, 'plc-return', '0 V', pin(common, '2'), pin(plc, 'X10:2'), [{ x: 465, y: 292 }, { x: 465, y: 252 }]);
wire(cabinet, 'plc-output-feed', '+24 V DC', { x: 490, y: 234 }, pin(plc, 'X12:1'),
  [{ x: 490, y: 145 }, { x: 975, y: 145 }, { x: 975, y: 352 }]);
wire(cabinet, 'plc-output-reference', '0 V', { x: 465, y: 292 }, pin(plc, 'X12:2'),
  [{ x: 465, y: 535 }, { x: 950, y: 535 }, { x: 950, y: 368 }]);
wire(cabinet, 'plc-analog-reference', '0 V', { x: 510, y: 252 }, pin(plc, 'X11:1'),
  [{ x: 510, y: 175 }, { x: 910, y: 175 }, { x: 910, y: 234 }]);

const fieldFeed = { x: 385, y: 265 };
const fieldReturn = { x: 445, y: 480 };
connect('transmitter-feed', '+24 V DC', port(cabinet, source.ref, pin(source, '1'), 215, 234, 'left'),
  port(sensing, inlet.ref, fieldFeed, 215, 265, 'left'));
connect('transmitter-return', '0 V', port(cabinet, common.ref, pin(common, '1'), 215, 292, 'left'),
  port(sensing, outlet.ref, fieldReturn, 215, 480, 'left'));
wire(sensing, 'inlet-feed', '+24 V DC', fieldFeed, pin(inlet, '1'));
wire(sensing, 'outlet-feed', '+24 V DC', fieldFeed, pin(outlet, '1'), [{ x: 385, y: 430 }]);
wire(sensing, 'inlet-return', '0 V', fieldReturn, pin(inlet, '3'), [{ x: 445, y: 315 }]);
wire(sensing, 'outlet-return', '0 V', fieldReturn, pin(outlet, '3'));

for (const [device, channel, signal, edgeY, bends] of [
  [inlet, 'X11:2', 'B1 inlet pressure to AI 0', 252, undefined],
  [outlet, 'X11:3', 'B2 outlet pressure to AI 1', 296, [{ x: 935, y: 270 }, { x: 935, y: 296 }]]
]) {
  const output = pin(device, '2');
  connect(device.id + '-voltage', signal, port(cabinet, plc.ref, pin(plc, channel), 1020, edgeY, 'right', bends),
    port(sensing, device.ref, output, 960, output.y, 'right'));
}

connect('dosing-demand', 'DQ a.0 dosing enable', port(cabinet, plc.ref, pin(plc, 'X12:3'), 1020, 384, 'right'),
  port(command, relay.ref, pin(relay, 'A1'), 215, 370, 'left'));
connect('dosing-return', '0 V', port(cabinet, plc.ref, { x: 950, y: 475 }, 1020, 475, 'right'),
  port(command, relay.ref, pin(relay, 'A2'), 215, 330, 'left'));
wire(command, 'dosing-contact-common', 'Dosing contact common', pin(relay, '11'), pin(contactCommon, '1'));
wire(command, 'dosing-contact-no', 'Dosing contact enable', pin(relay, '14'), pin(contactEnable, '1'),
  [{ x: 770, y: 375 }, { x: 770, y: 420 }]);

for (const [sheetId, title, note] of [
  [cabinet, 'WATER TREATMENT · DOSING AND PRESSURE CONTROL', 'A1 receives two distinct pressure voltages. External controller power enters through XT1.'],
  [sensing, 'FILTER INLET AND OUTLET PRESSURES · B1 AND B2', 'Both OUT2 links assume voltage mode. Sensor suitability, range, scaling and filter differential limits remain unassigned.'],
  [command, 'CHEMICAL DOSING ENABLE INTERFACE · K1', 'XT2 exposes a normally open enable contact. The external dosing controller, dose logic and permissives remain unassigned.']
]) {
  [title, note].forEach((text, index) => project.objects.push({
    id: sheetId + '-note-' + index, sheetId, kind: 'text', x: 105, y: index ? 585 : 100, text
  }));
}

const serialized = engine.serializeProject(project);
const report = engine.analyzeProject(JSON.parse(serialized));
if (!report.valid || report.openEndpointCount || report.geometryErrorCount || report.findings.some(row => row.severity === 'error')) {
  throw new Error('Water-treatment controller failed electrical validation.');
}
if (process.argv.includes('--write')) fs.writeFileSync(file, serialized + '\n');
else if (fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n') !== serialized + '\n') {
  throw new Error('Water-treatment controller drawing is out of date.');
}
