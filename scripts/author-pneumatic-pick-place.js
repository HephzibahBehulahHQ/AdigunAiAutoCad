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
const interlock = 'pick-place-slide-interlock';
const power = 'pick-place-control-supply';
const cabinetEarth = 'pick-place-cabinet-protective-earth';
const fieldEarth = 'pick-place-field-protective-earth';
const station = 'pick-place-local-operator-station';
const sensorTest = 'pick-place-sensor-test-access';
const motionTest = 'pick-place-motion-command-test';
const ioSchedule = 'pick-place-plc-io-schedule';
const project = {
  product: 'AdigunAiAutoCad',
  project: 'Pneumatic pick-and-place controls',
  revision: '1.10',
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
    { id: retract, number: 'A2/008', name: 'Slide retract pilot interface', projectSectionId: 'A2' },
    { id: interlock, number: 'A2/009', name: 'Opposite-command slide inhibit', projectSectionId: 'A2' },
    { id: power, number: 'A2/010', name: 'PS1 control supply and AC inlet', projectSectionId: 'A2' },
    { id: cabinetEarth, number: 'A2/011', name: 'Cabinet protective-earth distribution', projectSectionId: 'A2' },
    { id: fieldEarth, number: 'A2/012', name: 'Remote valve and slide frame PE terminals', projectSectionId: 'A2' },
    { id: station, number: 'A2/013', name: 'Local start and operational stop station', projectSectionId: 'A2' },
    { id: sensorTest, number: 'A2/014', name: 'Position sensor feed disconnect and test terminals', projectSectionId: 'A2' },
    { id: motionTest, number: 'A2/015', name: 'Slide command disconnect and test terminals', projectSectionId: 'A2' },
    { id: ioSchedule, number: 'A4/001', name: 'Wired PLC I/O schedule', projectSectionId: 'A4' }
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
const plus = terminal(cabinet, 'X1', 355, 234, 'XT1', '1', 'PS1 control feed');
const zero = terminal(cabinet, 'X2', 355, 280, 'XT1', '2', 'PS1 control return');
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
const sensorDisconnect = device(sensorTest, 'X26', 'phoenix-contact-3210156', 440, 290,
  { terminalStrip: 'XT12', position: '1', marking: 'Position sensor feed disconnect', knifePosition: 'closed' });
const sensorTestFeed = terminal(sensorTest, 'X27', 710, 290, 'XT12', '2', 'Switched position sensor feed');
const sensorTestCommon = terminal(sensorTest, 'X28', 710, 420, 'XT12', '3', 'Sensor 0 V test reference');
connectSheets('sensor-feed', '+24 V DC', cabinetPort('X1', pin(plus, '1'), 215, 234, 'left'),
  fieldPort(sensorTest, sensorDisconnect.ref, pin(sensorDisconnect, '1'), 215, 290, 'left'));
wire(sensorTest, 'sensor-test-switched-feed', '+24 V DC', pin(sensorDisconnect, '2'), pin(sensorTestFeed, '1'));
connectSheets('sensor-switched-feed', '+24 V DC',
  fieldPort(sensorTest, sensorTestFeed.ref, pin(sensorTestFeed, '2'), 960, 290, 'right'),
  fieldPort(sensors, b1.ref, fieldPlus, 215, 270, 'left'));
connectSheets('sensor-return', '0 V', cabinetPort('X2', pin(zero, '1'), 215, 280, 'left'),
  fieldPort(sensors, b2.ref, fieldCommon, 215, 455, 'left'));
connectSheets('sensor-test-reference', '0 V',
  { ...fieldPort(sensors, b2.ref, fieldCommon, 215, 520, 'left'), bends: [{ x: 435, y: 520 }] },
  fieldPort(sensorTest, sensorTestCommon.ref, pin(sensorTestCommon, '2'), 960, 420, 'right'));
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

const motionAccess = new Map([
  [extend, 'X29', 'X31', 'Extend', 255, '1', '2'],
  [retract, 'X30', 'X32', 'Retract', 425, '3', '4']
].map(([sheet, disconnectRef, testRef, direction, y, disconnectPosition, testPosition]) => {
  const disconnect = device(motionTest, disconnectRef, 'phoenix-contact-3210156', 440, y,
    { terminalStrip: 'XT13', position: disconnectPosition, marking: direction + ' command disconnect', knifePosition: 'closed' });
  const test = terminal(motionTest, testRef, 710, y, 'XT13', testPosition, direction + ' downstream command test point');
  return [sheet, { disconnect, test }];
}));

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
  const signal = role + ' request';
  const plcPort = cabinetPort('A1', dq, 1020, outputY, 'right', [{ x: elbow, y: dq.y }, { x: elbow, y: outputY }]);
  const relayPort = fieldPort(sheet, ref, coil, 215, coil.y, 'left');
  const access = motionAccess.get(sheet);
  if (access) {
    const { disconnect, test } = access;
    connectSheets(ref.toLowerCase() + '-request', signal, plcPort,
      fieldPort(motionTest, disconnect.ref, pin(disconnect, '1'), 215, disconnect.y, 'left'));
    wire(motionTest, ref.toLowerCase() + '-downstream-test', signal, pin(disconnect, '2'), pin(test, '1'));
    connectSheets(ref.toLowerCase() + '-gated-request', signal,
      fieldPort(motionTest, test.ref, pin(test, '2'), 960, test.y, 'right'), relayPort);
  } else {
    connectSheets(ref.toLowerCase() + '-request', signal, plcPort, relayPort);
  }


  connectSheets(ref.toLowerCase() + '-return', '0 V',
    cabinetPort('A1', { x: 935, y: returnY }, 1020, returnY, 'right'),
    fieldPort(sheet, ref, commonPin, 215, commonPin.y, 'left'));
}

for (const [sheet, request, pilotRef, marker, y, oppositeSheet, oppositeRef, terminalRef, position] of [
  [extend, 'Slide extend pilot', 'K3', 'K5', 260, retract, 'X14', 'X15', '1'],
  [retract, 'Slide retract pilot', 'K4', 'K6', 430, extend, 'X12', 'X16', '2']
]) {
  const direction = sheet === extend ? 'Retract' : 'Extend';
  const monitor = device(interlock, marker, 'phoenix-contact-2966171', 550, y, { marking: direction + ' inhibit relay' });
  const coil = pin(monitor, 'A1');
  const zero = pin(monitor, 'A2');
  const contact = pin(monitor, '11');
  const incoming = project.objects.find(object => object.ref === oppositeRef);
  const outgoing = terminal(interlock, terminalRef, 835, y - 55, 'XT8', position, direction + ' pilot command');
  connectSheets(marker.toLowerCase() + '-monitor', request + ' request',
    { ...fieldPort(sheet, pilotRef, { x: 375, y: 365 }, 215, 405, 'left'), bends: [{ x: 375, y: 405 }] },
    fieldPort(interlock, marker, coil, 215, coil.y, 'left'));
  connectSheets(marker.toLowerCase() + '-return', '0 V',
    { ...fieldPort(sheet, pilotRef, { x: 375, y: 325 }, 215, 285, 'left'), bends: [{ x: 375, y: 285 }] },
    fieldPort(interlock, marker, zero, 215, zero.y, 'left'));
  connectSheets(marker.toLowerCase() + '-contact-feed', 'Slide ' + direction.toLowerCase() + ' pilot contact NO',
    fieldPort(oppositeSheet, oppositeRef, pin(incoming, '2'), 1030, incoming.y, 'right'),
    fieldPort(interlock, marker, contact, 960, contact.y, 'right'));
  wire(interlock, marker.toLowerCase() + '-inhibited-output', direction + ' pilot gated command', pin(monitor, '12'),
    pin(outgoing, '1'), [{ x: 715, y: y - 25 }, { x: 715, y: y - 55 }]);
}

const psu = device(power, 'PS1', 'siemens-sitop-psu100c-6ep1332-5ba00', 585, 345, { marking: 'Pneumatic cabinet control supply' });
for (const [ref, position, input, y, part] of [
  ['X17', '1', 'L', 230, 'phoenix-contact-3209510'],
  ['X18', '2', 'N', 345, 'phoenix-contact-3209510'],
  ['X19', '3', 'PE', 460, 'phoenix-contact-3209536']
]) {
  const entry = device(power, ref, part, 300, y, { terminalStrip: 'XT9', position, marking: 'Incoming ' + input });
  const end = pin(psu, input);
  const bends = y === end.y ? undefined : [{ x: 405, y }, { x: 405, y: end.y }];
  wire(power, 'ps1-input-' + input.toLowerCase(), input, pin(entry, '2'), end, bends);
}
for (const [id, polarity, potential, boundary, startY, edgeY] of [
  ['ps1-control-feed', '+', '+24 V DC', plus, 234, 258],
  ['ps1-control-return', '-', '0 V', zero, 280, 308]
]) {
  const output = pin(psu, polarity);
  connectSheets(id, potential,
    cabinetPort(boundary.ref, { x: 300, y: startY }, 215, edgeY, 'left', [{ x: 300, y: edgeY }]),
    fieldPort(power, psu.ref, output, 960, output.y, 'right'));
}

const incomingEarth = project.objects.find(object => object.ref === 'X19');
const [earthEntry, cabinetBond, fieldExit, fieldEntry, valveBond, slideBond] = [
  [cabinetEarth, 'X20', 380, 300, 'XT10', '1', 'PE from XT9'],
  [cabinetEarth, 'X21', 785, 300, 'XT10', '2', 'Controller enclosure PE boundary'],
  [cabinetEarth, 'X22', 785, 425, 'XT10', '3', 'PE toward remote valve assembly'],
  [fieldEarth, 'X23', 380, 300, 'XT11', '1', 'PE from cabinet XT10'],
  [fieldEarth, 'X24', 785, 300, 'XT11', '2', 'Valve enclosure PE boundary'],
  [fieldEarth, 'X25', 785, 425, 'XT11', '3', 'Slide frame PE boundary']
].map(([sheet, ref, x, y, terminalStrip, position, marking]) =>
  device(sheet, ref, 'phoenix-contact-3209536', x, y, { terminalStrip, position, marking }));
connectSheets('cabinet-earth-inlet', 'PE',
  fieldPort(power, incomingEarth.ref, pin(incomingEarth, '1'), 215, 460, 'left'),
  fieldPort(cabinetEarth, earthEntry.ref, pin(earthEntry, '1'), 215, 300, 'left'));
connectSheets('remote-earth-feed', 'PE',
  fieldPort(cabinetEarth, fieldExit.ref, pin(fieldExit, '2'), 960, 425, 'right'),
  fieldPort(fieldEarth, fieldEntry.ref, pin(fieldEntry, '1'), 215, 300, 'left'));
for (const [sheet, entry, first, second] of [
  [cabinetEarth, earthEntry, cabinetBond, fieldExit],
  [fieldEarth, fieldEntry, valveBond, slideBond]
]) {
  const junction = { x: 575, y: 300 };
  wire(sheet, sheet + '-trunk', 'PE', pin(entry, '2'), junction);
  wire(sheet, sheet + '-upper', 'PE', junction, pin(first, '1'));
  wire(sheet, sheet + '-lower', 'PE', junction, pin(second, '1'), [{ x: 575, y: 425 }]);
}

const start = device(station, 'S1', 'schneider-electric-xb5aa31', 605, 270, { marking: 'Local start request' });
const stop = device(station, 'S2', 'schneider-electric-xb5aa42', 605, 410, { marking: 'Local operational stop' });
const stationFeed = { x: 390, y: 270 };
connectSheets('operator-station-feed', '+24 V DC',
  cabinetPort('X1', { x: 960, y: 215 }, 1020, 215, 'right'),
  fieldPort(station, start.ref, stationFeed, 215, 270, 'left'),
  { cableId: 'W-03', coreId: '1' });
wire(station, 'start-switch-feed', '+24 V DC', stationFeed, pin(start, '13'));
wire(station, 'stop-switch-feed', '+24 V DC', stationFeed, pin(stop, '21'), [{ x: 390, y: 410 }]);
for (const [button, terminalNumber, contact, signal, coreId, elbow, edgeY] of [
  [start, 'X10:11', '14', 'S1 start request to DI a.4', '2', 595, 520],
  [stop, 'X10:12', '22', 'S2 stop request to DI a.5', '3', 598, 555]
]) {
  const input = pin(plc, terminalNumber);
  const terminal = pin(button, contact);
  connectSheets(button.id + '-operator-input', signal,
    cabinetPort('A1', input, 215, edgeY, 'left', [{ x: elbow, y: input.y }, { x: elbow, y: edgeY }]),
    fieldPort(station, button.ref, terminal, 960, terminal.y, 'right'),
    { cableId: 'W-03', coreId });
}

for (const [sheetId, title, text] of [
  [cabinet, 'PNEUMATIC PICK-AND-PLACE · PLC WIRING', 'XT1 receives 24 V DC from PS1. B1 and B2 report slide position. Four outputs command isolated pilot interfaces.'],
  [sensors, 'SLIDE POSITION SENSORS · B1 AND B2', 'B1 and B2 report the two end positions separately. Mounting, target geometry and motion timing remain unassigned.'],
  [vacuum, 'VACUUM PILOT INTERFACE · K1', 'XT2 exposes the isolated normally open vacuum demand contact. The valve and its electrical supply remain external.'],
  [release, 'RELEASE PILOT INTERFACE · K2', 'XT3 exposes the isolated normally open release demand contact. PLC sequencing and pilot interlocking remain unassigned.'],
  [confirmation, 'VACUUM ACHIEVED SWITCH INTERFACE · XT4', 'W-01 carries the feed and DI a.2 return for an external contact that closes at the required vacuum. Sensor selection and threshold remain unassigned.'],
  [airPressure, 'COMPRESSED-AIR PRESSURE SWITCH · XT5', 'W-02 carries the feed and DI a.3 return for an external air-pressure-ready contact. The switch, pressure threshold and PLC response remain unassigned.'],
  [extend, 'SLIDE EXTEND PILOT INTERFACE · K3', 'XT6 carries the extend contact to the opposite-command inhibit sheet. The directional valve and coil supply remain external.'],
  [retract, 'SLIDE RETRACT PILOT INTERFACE · K4', 'XT7 carries the retract contact to the opposite-command inhibit sheet. Motion sequencing remains unassigned.'],
  [interlock, 'SLIDE OPPOSITE-COMMAND INHIBIT · K5 AND K6', 'Each asserted command opens the opposite pilot path after relay operation. Transition timing and safety functions remain outside this schematic.'],
  [power, 'CONTROL SUPPLY · PS1', 'XT9 marks the incoming L, N and PE boundary. PS1 feeds XT1. Upstream protection, conductor sizing remain unassigned.'],
  [cabinetEarth, 'CABINET PROTECTIVE EARTH · XT10', 'XT10 branches incoming PE to the controller enclosure terminal and the remote assembly. Physical bonds remain unassigned.'],
  [fieldEarth, 'REMOTE VALVE AND SLIDE PROTECTIVE EARTH · XT11', 'XT11 continues the incoming PE to the valve enclosure and slide frame terminals. Physical bonds and conductor sizes remain unassigned.'],
  [station, 'LOCAL START AND OPERATIONAL STOP · S1 AND S2', 'W-03 carries the feed and both request inputs. S1 closes DI a.4 and S2 opens DI a.5 when pressed. Emergency-stop functions remain outside this drawing.'],
  [sensorTest, 'POSITION SENSOR FEED TEST ACCESS · XT12', 'X26 disconnects the B1 and B2 feed. X27 and X28 expose the downstream +24 V and 0 V reference. Test equipment and procedures remain unassigned.'],
  [motionTest, 'SLIDE COMMAND TEST ACCESS · XT13', 'X29 and X30 open the respective extend and retract coil commands. X31 and X32 expose the downstream signals. Physical energy isolation remains outside this drawing.']
]) {
  [title, text].forEach((label, index) => project.objects.push({
    id: sheetId + '-note-' + index, sheetId, kind: 'text', x: 105, y: index ? 588 : 100, text: label
  }));
}

const signalPurpose = {
  'X10:7': 'Slide retracted position',
  'X10:8': 'Slide extended position',
  'X10:9': 'Vacuum achieved',
  'X10:10': 'Compressed air ready',
  'X10:11': 'Local start request',
  'X10:12': 'Local operational stop',
  'X12:3': 'Vacuum pilot request',
  'X12:4': 'Release pilot request',
  'X12:5': 'Slide extend request',
  'X12:6': 'Slide retract request'
};
const ioReport = engine.plcIoList(JSON.parse(engine.serializeProject(project)));
if (!ioReport.valid) throw new Error(ioReport.errors.join(' '));
function scheduleText(id, text, x, y) {
  project.objects.push({ id: 'plc-io-' + id, kind: 'text', sheetId: ioSchedule, text, x, y });
}
scheduleText('title', 'PNEUMATIC PICK-AND-PLACE · WIRED PLC I/O SCHEDULE', 105, 105);
scheduleText('revision', 'A1 hardware channel connections · Revision ' + project.revision, 105, 150);
const columns = [105, 250, 345, 640];
['PLC terminal', 'Channel', 'Signal purpose', 'Connected pins'].forEach((text, column) =>
  scheduleText('heading-' + column, text, columns[column], 195));
const channels = ioReport.rows.filter(row => row.connectedPins.length);
channels.forEach((row, index) => {
  const purpose = signalPurpose[row.terminal];
  if (!purpose) throw new Error('Missing signal purpose for ' + row.terminal);
  const y = 231 + index * 37;
  [row.ref + ' ' + row.terminal, row.channel, purpose].forEach((text, column) =>
    scheduleText('row-' + index + '-' + column, text, columns[column], y));
  for (let pinIndex = 0; pinIndex < row.connectedPins.length; pinIndex += 3) {
    scheduleText('row-' + index + '-pins-' + pinIndex, row.connectedPins.slice(pinIndex, pinIndex + 3).join(' · '),
      columns[3], y + pinIndex / 3 * 16);
  }
});
scheduleText('scope', 'Revision snapshot of wired hardware channels. PLC addresses, program logic and timing remain unassigned.', 105, 610);

const serialized = engine.serializeProject(project);
const report = engine.analyzeProject(JSON.parse(serialized));
if (!report.valid || report.openEndpointCount || report.geometryErrorCount || report.findings.some(finding => finding.severity === 'error')) {
  throw new Error('Pneumatic pick-and-place drawing failed electrical validation.');
}
if (process.argv.includes('--write')) fs.writeFileSync(file, serialized + '\n');
else if (fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n') !== serialized + '\n') {
  throw new Error('Pneumatic pick-and-place drawing is out of date.');
}
