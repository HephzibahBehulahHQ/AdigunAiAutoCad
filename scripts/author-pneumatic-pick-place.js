'use strict';

const fs = require('node:fs');
const path = require('node:path');
require('../cad-engine.js');
const engine = globalThis.AdigunCADEngine;
const file = path.join(__dirname, '../examples/real-projects/pneumatic-pick-place.adigun.json');

const cabinet = 'pick-place-plc';
const sensors = 'pick-place-position-sensors';
const vacuum = 'pick-place-vacuum-pilot';
const release = 'pick-place-release-pilot';
const confirmation = 'pick-place-vacuum-confirmation';
const airPressure = 'pick-place-air-pressure-confirmation';
const extend = 'pick-place-slide-extend';
const retract = 'pick-place-slide-retract';
const project = {
  product: 'AdigunAiAutoCad',
  project: 'Pneumatic pick-and-place controls',
  revision: '1.3',
  description: 'Native PLC wiring for slide position sensing and isolated vacuum, release, and slide motion pilot interfaces.',
  activeSheet: cabinet,
  sheets: [
    { id: cabinet, number: 'A2/001', name: 'PLC power and I/O', projectSectionId: 'A2' },
    { id: sensors, number: 'A2/002', name: 'Retracted and extended position sensing', projectSectionId: 'A2' },
    { id: vacuum, number: 'A2/003', name: 'Vacuum pilot interface', projectSectionId: 'A2' },
    { id: release, number: 'A2/004', name: 'Release pilot interface', projectSectionId: 'A2' },
    { id: confirmation, number: 'A2/005', name: 'Vacuum achieved switch interface', projectSectionId: 'A2' },
    { id: airPressure, number: 'A2/006', name: 'Compressed-air pressure switch interface', projectSectionId: 'A2' },
    { id: extend, number: 'A2/007', name: 'Slide extend pilot interface', projectSectionId: 'A2' },
    { id: retract, number: 'A2/008', name: 'Slide retract pilot interface', projectSectionId: 'A2' }
  ],
  objects: [],
  crossSheetConnections: []
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
  return segment;
}

function connectSheets(id, potential, cabinetEnd, fieldEnd, cable) {
  const endpoints = [cabinetEnd, fieldEnd].map(({ sheet, ref, connection, edge, direction, bends }, index) => {
    const other = index === 0 ? fieldEnd : cabinetEnd;
    const segment = wire(sheet, id + (index === 0 ? '-cabinet' : '-field'), potential, connection, edge, bends);
    if (cable) Object.assign(segment, cable);
    return { sheetId: sheet, wireId: segment.id, point: edge, connector: { direction, targetSheetId: other.sheet, targetRef: other.ref } };
  });
  project.crossSheetConnections.push({ id, name: potential, endpoints });
}

const plc = device(cabinet, 'A1', 'siemens-6es7212-1ae40-0xb0', 730, 360);
const plus = terminal(cabinet, 'X1', 355, 234, 'XT1', '1', 'External control feed');
const zero = terminal(cabinet, 'X2', 355, 280, 'XT1', '2', 'External control return');
const b1 = device(sensors, 'B1', 'ifm-ifs204', 630, 290, { marking: 'Slide retracted' });
const b2 = device(sensors, 'B2', 'ifm-ifs204', 630, 435, { marking: 'Slide extended' });

wire(cabinet, 'cpu-feed', '+24 V DC', pin(plus, '2'), pin(plc, 'X10:1'));
wire(cabinet, 'cpu-return', '0 V', pin(zero, '2'), pin(plc, 'X10:2'), [{ x: 455, y: 280 }, { x: 455, y: 252 }]);
wire(cabinet, 'di-common', '0 V', { x: 510, y: 252 }, pin(plc, 'X10:6'), [{ x: 510, y: 324 }]);
wire(cabinet, 'dq-feed', '+24 V DC', { x: 465, y: 234 }, pin(plc, 'X12:1'),
  [{ x: 465, y: 144 }, { x: 960, y: 144 }, { x: 960, y: 352 }]);
wire(cabinet, 'dq-common', '0 V', { x: 455, y: 280 }, pin(plc, 'X12:2'),
  [{ x: 455, y: 602 }, { x: 935, y: 602 }, { x: 935, y: 368 }]);

const fieldPlus = { x: 390, y: 270 };
const fieldCommon = { x: 435, y: 455 };
const cabinetPort = (ref, connection, x, y, direction, bends) => ({ sheet: cabinet, ref, connection, edge: { x, y }, direction, bends });
const fieldPort = (sheet, ref, connection, x, y, direction) => ({ sheet, ref, connection, edge: { x, y }, direction });
connectSheets('sensor-feed', '+24 V DC', cabinetPort('X1', pin(plus, '1'), 215, 234, 'left'),
  fieldPort(sensors, b1.ref, fieldPlus, 215, 270, 'left'));
connectSheets('sensor-return', '0 V', cabinetPort('X2', pin(zero, '1'), 215, 280, 'left'),
  fieldPort(sensors, b2.ref, fieldCommon, 215, 455, 'left'));
wire(sensors, 'b1-feed', '+24 V DC', fieldPlus, pin(b1, '1'));
wire(sensors, 'b2-feed', '+24 V DC', fieldPlus, pin(b2, '1'), [{ x: 390, y: 415 }]);
wire(sensors, 'b1-return', '0 V', fieldCommon, pin(b1, '3'), [{ x: 435, y: 310 }]);
wire(sensors, 'b2-return', '0 V', fieldCommon, pin(b2, '3'));
for (const [probe, terminalNumber, y, bendX, signal] of [
  [b1, 'X10:7', 365, 555, 'B1 retracted feedback'],
  [b2, 'X10:8', 410, 575, 'B2 extended feedback']
]) {
  const input = pin(plc, terminalNumber);
  const contact = pin(probe, '4');
  connectSheets(probe.id + '-signal', signal,
    cabinetPort('A1', input, 215, y, 'left', [{ x: bendX, y: input.y }, { x: bendX, y }]),
    fieldPort(sensors, probe.ref, contact, 960, contact.y, 'right'));
}

const vacuumFeed = terminal(confirmation, 'X7', 470, 265, 'XT4', '1', 'Feed to external vacuum switch');
const vacuumReturn = terminal(confirmation, 'X8', 470, 390, 'XT4', '2', 'Vacuum-achieved contact return');
connectSheets('vacuum-switch-feed', '+24 V DC',
  cabinetPort('X1', { x: 270, y: 234 }, 215, 190, 'left', [{ x: 270, y: 190 }]),
  fieldPort(confirmation, vacuumFeed.ref, pin(vacuumFeed, '1'), 215, 265, 'left'),
  { cableId: 'W-01', coreId: '1' });
connectSheets('vacuum-confirmation', 'XT4 vacuum achieved to DI a.2',
  cabinetPort('A1', pin(plc, 'X10:9'), 215, 452, 'left', [{ x: 585, y: 378 }, { x: 585, y: 452 }]),
  fieldPort(confirmation, vacuumReturn.ref, pin(vacuumReturn, '1'), 215, 390, 'left'),
  { cableId: 'W-01', coreId: '2' });

const airFeed = terminal(airPressure, 'X9', 470, 265, 'XT5', '1', 'Feed to external air-pressure switch');
const airReturn = terminal(airPressure, 'X10', 470, 390, 'XT5', '2', 'Air-pressure-ready contact return');
connectSheets('air-switch-feed', '+24 V DC',
  cabinetPort('X1', { x: 960, y: 185 }, 1020, 185, 'right'),
  fieldPort(airPressure, airFeed.ref, pin(airFeed, '1'), 215, 265, 'left'),
  { cableId: 'W-02', coreId: '1' });
connectSheets('air-pressure-confirmation', 'XT5 air pressure ready to DI a.3',
  cabinetPort('A1', pin(plc, 'X10:10'), 215, 486, 'left', [{ x: 593, y: 396 }, { x: 593, y: 486 }]),
  fieldPort(airPressure, airReturn.ref, pin(airReturn, '1'), 215, 390, 'left'),
  { cableId: 'W-02', coreId: '2' });

for (const [sheet, ref, terminalNumber, strip, commonRef, noRef, role, outputY, returnY, elbow] of [
  [vacuum, 'K1', 'X12:3', 'XT2', 'X3', 'X4', 'Vacuum pilot', 408, 514, 920],
  [release, 'K2', 'X12:4', 'XT3', 'X5', 'X6', 'Release pilot', 442, 538, 905],
  [extend, 'K3', 'X12:5', 'XT6', 'X11', 'X12', 'Slide extend pilot', 466, 562, 895],
  [retract, 'K4', 'X12:6', 'XT7', 'X13', 'X14', 'Slide retract pilot', 490, 586, 885]
]) {
  const relay = device(sheet, ref, 'phoenix-contact-2966171', 600, 345, { marking: role + ' request relay' });
  const common = terminal(sheet, commonRef, 900, 345, strip, '1', role + ' external common');
  const normallyOpen = terminal(sheet, noRef, 900, 415, strip, '2', role + ' external command');
  wire(sheet, ref.toLowerCase() + '-contact-common', role + ' contact common', pin(relay, '11'), pin(common, '1'));
  wire(sheet, ref.toLowerCase() + '-contact-no', role + ' contact NO', pin(relay, '14'), pin(normallyOpen, '1'),
    [{ x: 765, y: 370 }, { x: 765, y: 415 }]);
  const dq = pin(plc, terminalNumber);
  const coil = pin(relay, 'A1');
  const commonPin = pin(relay, 'A2');
  connectSheets(ref.toLowerCase() + '-request', role + ' request',
    cabinetPort('A1', dq, 1020, outputY, 'right', [{ x: elbow, y: dq.y }, { x: elbow, y: outputY }]),
    fieldPort(sheet, ref, coil, 215, coil.y, 'left'));
  connectSheets(ref.toLowerCase() + '-return', '0 V',
    cabinetPort('A1', { x: 935, y: returnY }, 1020, returnY, 'right'),
    fieldPort(sheet, ref, commonPin, 215, commonPin.y, 'left'));
}

for (const [sheetId, title, text] of [
  [cabinet, 'PNEUMATIC PICK-AND-PLACE · PLC WIRING', 'XT1 receives external 24 V DC. B1 and B2 report slide position. Four outputs command isolated pilot interfaces.'],
  [sensors, 'SLIDE POSITION SENSORS · B1 AND B2', 'B1 and B2 report the two end positions separately. Mounting, target geometry and motion timing remain unassigned.'],
  [vacuum, 'VACUUM PILOT INTERFACE · K1', 'XT2 exposes the isolated normally open vacuum demand contact. The valve and its electrical supply remain external.'],
  [release, 'RELEASE PILOT INTERFACE · K2', 'XT3 exposes the isolated normally open release demand contact. PLC sequencing and pilot interlocking remain unassigned.'],
  [confirmation, 'VACUUM ACHIEVED SWITCH INTERFACE · XT4', 'W-01 carries the feed and DI a.2 return for an external contact that closes at the required vacuum. Sensor selection and threshold remain unassigned.'],
  [airPressure, 'COMPRESSED-AIR PRESSURE SWITCH · XT5', 'W-02 carries the feed and DI a.3 return for an external air-pressure-ready contact. The switch, pressure threshold and PLC response remain unassigned.'],
  [extend, 'SLIDE EXTEND PILOT INTERFACE · K3', 'XT6 exposes the isolated normally open extend demand contact. The directional valve and coil supply remain external.'],
  [retract, 'SLIDE RETRACT PILOT INTERFACE · K4', 'XT7 exposes the isolated normally open retract demand contact. Mutual exclusion and motion sequencing remain unassigned.']
]) {
  [title, text].forEach((label, index) => project.objects.push({
    id: sheetId + '-note-' + index, sheetId, kind: 'text', x: 105, y: index ? 588 : 100, text: label
  }));
}

const serialized = engine.serializeProject(project);
const report = engine.analyzeProject(JSON.parse(serialized));
if (!report.valid || report.openEndpointCount || report.geometryErrorCount || report.findings.some(finding => finding.severity === 'error')) {
  throw new Error('Pneumatic pick-and-place drawing failed electrical validation.');
}
if (process.argv.includes('--write')) fs.writeFileSync(file, serialized + '\n');
else if (fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n') !== serialized + '\n') {
  throw new Error('Pneumatic pick-and-place drawing is out of date.');
}
