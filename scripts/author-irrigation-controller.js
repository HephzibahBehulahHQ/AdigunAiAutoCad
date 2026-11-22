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
const indication = 'irrigation-run-indication';
const fault = 'irrigation-starter-fault';
const power = 'irrigation-control-supply';
const earth = 'irrigation-protective-earth';
const alarm = 'irrigation-alarm-interface';
const permissive = 'irrigation-source-permissive';
const stopStation = 'irrigation-operational-stop';
const pressureTest = 'irrigation-pressure-test-access';
const demandTest = 'irrigation-demand-test-access';
const ioSchedule = 'irrigation-plc-io-schedule';
const project = {
  product: 'AdigunAiAutoCad', project: 'Irrigation pressure monitoring and pump request', revision: '1.12',
  description: 'Editable pressure instrumentation and isolated pump demand contact for an irrigation controller.',
  activeSheet: cabinet,
  sheets: [
    { id: cabinet, number: 'A2/001', name: 'Controller supply and I/O', projectSectionId: 'A2' },
    { id: field, number: 'A2/002', name: 'Field pressure transmitter', projectSectionId: 'A2' },
    { id: output, number: 'A2/003', name: 'Isolated pump request', projectSectionId: 'A2' },
    { id: operator, number: 'A2/004', name: 'Local irrigation request station', projectSectionId: 'A2' },
    { id: feedback, number: 'A2/005', name: 'Pump starter run feedback at XT3', projectSectionId: 'A2' },
    { id: indication, number: 'A2/006', name: 'Local pump run indication', projectSectionId: 'A2' },
    { id: fault, number: 'A2/007', name: 'Starter fault contact at XT4', projectSectionId: 'A2' },
    { id: power, number: 'A2/008', name: 'PS1 control supply and AC inlet', projectSectionId: 'A2' },
    { id: earth, number: 'A2/009', name: 'Cabinet and starter enclosure PE terminals', projectSectionId: 'A2' },
    { id: alarm, number: 'A2/010', name: 'Isolated starter fault annunciator interface', projectSectionId: 'A2' },
    { id: permissive, number: 'A2/011', name: 'Water source permissive at XT8', projectSectionId: 'A2' },
    { id: stopStation, number: 'A2/012', name: 'Pump-side operational stop request', projectSectionId: 'A2' },
    { id: pressureTest, number: 'A2/013', name: 'Pressure transmitter disconnect and test terminals', projectSectionId: 'A2' },
    { id: demandTest, number: 'A2/014', name: 'Pump demand disconnect and test terminals', projectSectionId: 'A2' },
    { id: ioSchedule, number: 'A4/001', name: 'Wired PLC I/O schedule', projectSectionId: 'A4' }
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
const supply = terminal(cabinet, 'X1', 395, 205, 'XT1', '1', 'PS1 +24 V DC');
const common = terminal(cabinet, 'X2', 395, 280, 'XT1', '2', 'PS1 0 V');
const sensor = device(field, 'B1', 'ifm-pn2070', 610, 345, {
  marking: 'Irrigation header pressure', signalConfigurationNote: 'OUT2 wiring assumes voltage mode. Pressure scaling remains unassigned.'
});
const relay = device(output, 'K1', 'phoenix-contact-2966171', 600, 345, { marking: 'Pump request interposing relay' });
const contactCommon = terminal(output, 'X3', 920, 345, 'XT2', '1', 'Remote starter contact common');
const contactNO = terminal(output, 'X4', 920, 400, 'XT2', '2', 'Remote starter pump demand');

const request = device(operator, 'S1', 'schneider-electric-xb5aa31', 605, 345, { marking: 'Local irrigation request' });

const feedbackFeed = terminal(feedback, 'X5', 470, 265, 'XT3', '1', 'Supply to external run contact');
const feedbackReturn = terminal(feedback, 'X6', 470, 390, 'XT3', '2', 'Return from external run contact');

const runLamp = device(indication, 'H1', 'schneider-electric-xb5avb3', 605, 345, { marking: 'PLC pump run indication' });

const faultFeed = terminal(fault, 'X7', 470, 265, 'XT4', '1', 'Supply to external fault contact');
const faultReturn = terminal(fault, 'X8', 470, 390, 'XT4', '2', 'Return from external fault contact');

const psu = device(power, 'PS1', 'siemens-sitop-psu100c-6ep1332-5ba00', 585, 345, { marking: 'Irrigation control supply' });
for (const [ref, position, input, y, part] of [
  ['X9', '1', 'L', 230, 'phoenix-contact-3209510'],
  ['X10', '2', 'N', 345, 'phoenix-contact-3209510'],
  ['X11', '3', 'PE', 460, 'phoenix-contact-3209536']
]) {
  const terminal = device(power, ref, part, 300, y, { terminalStrip: 'XT5', position, marking: 'Incoming ' + input });
  const end = pin(psu, input);
  const bends = y === end.y ? undefined : [{ x: 405, y }, { x: 405, y: end.y }];
  wire(power, 'ps1-input-' + input.toLowerCase(), input, pin(terminal, '2'), end, bends);
}

const incomingEarth = project.objects.find(object => object.ref === 'X11');
const [earthEntry, cabinetEarth, starterEarth] = [
  ['X12', '1', 'PE from XT5', 380, 300],
  ['X13', '2', 'Controller enclosure PE boundary', 780, 300],
  ['X14', '3', 'Starter enclosure PE boundary', 780, 425]
].map(([ref, position, marking, x, y]) => device(earth, ref, 'phoenix-contact-3209536', x, y,
  { terminalStrip: 'XT6', position, marking }));
const powerEarthEdge = { x: 215, y: 460 };
const distributionEarthEdge = { x: 215, y: 300 };
wire(power, 'enclosure-earth-cabinet', 'PE', pin(incomingEarth, '1'), powerEarthEdge);
wire(earth, 'enclosure-earth-remote', 'PE', distributionEarthEdge, pin(earthEntry, '1'));
link('enclosure-earth', 'XT6 enclosure protective earth',
  [power, incomingEarth.ref, powerEarthEdge, 'left'], [earth, earthEntry.ref, distributionEarthEdge, 'left']);
const earthBranch = { x: 575, y: 300 };
wire(earth, 'enclosure-earth-trunk', 'PE', pin(earthEntry, '2'), earthBranch);
wire(earth, 'controller-enclosure-earth', 'PE', earthBranch, pin(cabinetEarth, '1'));
wire(earth, 'starter-enclosure-earth', 'PE', earthBranch, pin(starterEarth, '1'), [{ x: 575, y: 425 }]);

const alarmRelay = device(alarm, 'K2', 'phoenix-contact-2966171', 590, 345, { marking: 'PLC fault annunciator relay' });
for (const [ref, position, contact, y, marking, bendX] of [
  ['X16', '2', '12', 255, 'De-energized contact', 760],
  ['X15', '1', '11', 345, 'Alarm circuit common', 0],
  ['X17', '3', '14', 435, 'Energized contact', 760]
]) {
  const boundary = terminal(alarm, ref, 910, y, 'XT7', position, marking);
  const start = pin(alarmRelay, contact);
  const bends = bendX ? [{ x: bendX, y: start.y }, { x: bendX, y }] : undefined;
  wire(alarm, 'alarm-contact-' + contact, marking, start, pin(boundary, '1'), bends);
}

const levelFeed = terminal(permissive, 'X18', 470, 265, 'XT8', '1', 'Feed to external water-available contact');
const levelReturn = terminal(permissive, 'X19', 470, 390, 'XT8', '2', 'Water-available contact return');

const stop = device(stopStation, 'S2', 'schneider-electric-xb5aa42', 605, 345, { marking: 'Pump-side operational stop request' });

const pressureDisconnect = device(pressureTest, 'X20', 'phoenix-contact-3210156', 445, 295,
  { terminalStrip: 'XT9', position: '1', marking: 'Pressure transmitter feed disconnect', knifePosition: 'closed' });
const pressureTestFeed = terminal(pressureTest, 'X21', 710, 295, 'XT9', '2', 'Switched transmitter feed test point');
const pressureTestCommon = terminal(pressureTest, 'X22', 710, 420, 'XT9', '3', 'Transmitter reference test point');
wire(pressureTest, 'pressure-test-switched-feed', '+24 V DC', pin(pressureDisconnect, '2'), pin(pressureTestFeed, '1'));
const pressureTestEdge = { x: 960, y: 295 };
const transmitterEdge = { x: 215, y: pin(sensor, '1').y };
wire(pressureTest, 'pressure-field-feed-cabinet', '+24 V DC', pin(pressureTestFeed, '2'), pressureTestEdge);
wire(field, 'pressure-field-feed-remote', '+24 V DC', transmitterEdge, pin(sensor, '1'));
link('pressure-field-feed', 'XT9 switched transmitter feed', [pressureTest, pressureTestFeed.ref, pressureTestEdge, 'right'],
  [field, sensor.ref, transmitterEdge, 'left']);

const demandDisconnect = device(demandTest, 'X23', 'phoenix-contact-3210156', 445, 295,
  { terminalStrip: 'XT10', position: '1', marking: 'Pump demand disconnect', knifePosition: 'closed' });
const demandTestSignal = terminal(demandTest, 'X24', 710, 295, 'XT10', '2', 'Switched demand test point');
const demandTestCommon = terminal(demandTest, 'X25', 710, 420, 'XT10', '3', 'Pump demand reference test point');
const demandSignal = 'DQ a.0 pump request';
wire(demandTest, 'demand-test-switched-signal', demandSignal, pin(demandDisconnect, '2'), pin(demandTestSignal, '1'));
const demandTestEdge = { x: 960, y: 295 };
const relayDemandEdge = { x: 215, y: pin(relay, 'A1').y };
wire(demandTest, 'pump-coil-demand-cabinet', demandSignal, pin(demandTestSignal, '2'), demandTestEdge);
wire(output, 'pump-coil-demand-remote', demandSignal, relayDemandEdge, pin(relay, 'A1'));
link('pump-coil-demand', 'XT10 switched pump demand', [demandTest, demandTestSignal.ref, demandTestEdge, 'right'],
  [output, relay.ref, relayDemandEdge, 'left']);
const relayCommonY = pin(relay, 'A2').y;
const relayReferenceEdge = { x: 215, y: 245 };
const demandReferenceEdge = { x: 960, y: 420 };
wire(output, 'pump-demand-reference-cabinet', '0 V', { x: 330, y: relayCommonY }, relayReferenceEdge, [{ x: 330, y: 245 }]);
wire(demandTest, 'pump-demand-reference-remote', '0 V', demandReferenceEdge, pin(demandTestCommon, '2'));
link('pump-demand-reference', 'XT10 pump demand 0 V reference', [output, relay.ref, relayReferenceEdge, 'left'],
  [demandTest, demandTestCommon.ref, demandReferenceEdge, 'right']);

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
  ['pressure-feed', '+24 V DC', 'X1', { x: 460, y: 239 }, { x: 215, y: 182 }, [{ x: 460, y: 182 }], pressureDisconnect, '1', 'left'],
  ['pressure-common', '0 V', 'X2', { x: 490, y: 257 }, { x: 215, y: 475 }, [{ x: 490, y: 475 }], sensor, '3', 'left'],
  ['pressure-voltage', 'B1 OUT2 to AI0', 'A1', pin(plc, 'X11:2'), { x: 1020, y: 257 }, null, sensor, '2', 'right'],
  ['pressure-switch', 'B1 OUT1 to DI a.0', 'A1', pin(plc, 'X10:7'), { x: 215, y: 347 }, null, sensor, '4', 'right'],
  ['pump-request', demandSignal, 'A1', pin(plc, 'X12:3'), { x: 1020, y: 389 }, null, demandDisconnect, '1', 'left'],
  ['relay-common', '0 V', 'A1', { x: 925, y: 475 }, { x: 1020, y: 475 }, null, relay, 'A2', 'left'],
  ['operator-feed', '+24 V DC', 'X1', { x: 480, y: 135 }, { x: 215, y: 135 }, null, request, '13', 'left', ['W-01', '1']],
  ['operator-request', 'S1 request to DI a.1', 'A1', pin(plc, 'X10:8'), { x: 215, y: 405 },
    [{ x: 540, y: 365 }, { x: 540, y: 405 }], request, '14', 'right', ['W-01', '2']],
  ['run-feedback-feed', '+24 V DC', 'X1', { x: 460, y: 230 }, { x: 215, y: 230 },
    null, feedbackFeed, '1', 'left', ['W-02', '1']],
  ['run-feedback-input', 'XT3 run feedback to DI a.2', 'A1', pin(plc, 'X10:9'), { x: 215, y: 440 },
    [{ x: 550, y: 383 }, { x: 550, y: 440 }], feedbackReturn, '1', 'left', ['W-02', '2']],
  ['run-indication-output', 'DQ a.1 to H1', 'A1', pin(plc, 'X12:4'), { x: 1020, y: 430 },
    [{ x: 895, y: 405 }, { x: 895, y: 430 }], runLamp, 'X1', 'left', ['W-03', '1']],
  ['run-indication-common', '0 V', 'A1', { x: 925, y: 515 }, { x: 1020, y: 515 },
    null, runLamp, 'X2', 'right', ['W-03', '2']],
  ['starter-fault-feed', '+24 V DC', 'X1', { x: 460, y: 205 }, { x: 215, y: 205 },
    null, faultFeed, '1', 'left', ['W-04', '1']],
  ['starter-fault-input', 'XT4 starter fault to DI a.3', 'A1', pin(plc, 'X10:10'), { x: 215, y: 480 },
    [{ x: 560, y: 401 }, { x: 560, y: 480 }], faultReturn, '1', 'left', ['W-04', '2']],
  ['control-feed', '+24 V DC', 'X1', pin(supply, '1'), { x: 215, y: 260 },
    [{ x: 315, y: 205 }, { x: 315, y: 260 }], psu, '+', 'right'],
  ['control-return', '0 V', 'X2', pin(common, '1'), { x: 215, y: 315 },
    [{ x: 315, y: 280 }, { x: 315, y: 315 }], psu, '-', 'right'],
  ['fault-annunciation-output', 'DQ a.2 to K2', 'A1', pin(plc, 'X12:5'), { x: 1020, y: 454 },
    [{ x: 875, y: 421 }, { x: 875, y: 454 }], alarmRelay, 'A1', 'left', ['W-05', '1']],
  ['fault-annunciation-return', '0 V', 'A1', { x: 925, y: 535 }, { x: 1020, y: 550 },
    [{ x: 950, y: 535 }, { x: 950, y: 550 }], alarmRelay, 'A2', 'left', ['W-05', '2']],
  ['source-permissive-feed', '+24 V DC', 'X1', { x: 280, y: 135 }, { x: 215, y: 160 },
    [{ x: 280, y: 160 }], levelFeed, '1', 'left', ['W-06', '1']],
  ['source-permissive-input', 'XT8 water available to DI a.4', 'A1', pin(plc, 'X10:11'), { x: 215, y: 515 },
    [{ x: 565, y: 419 }, { x: 565, y: 515 }], levelReturn, '1', 'left', ['W-06', '2']],
  ['operational-stop-feed', '+24 V DC', 'X1', { x: 960, y: 185 }, { x: 1020, y: 185 },
    null, stop, '21', 'left', ['W-07', '1']],
  ['operational-stop-input', 'S2 stop request to DI a.5', 'A1', pin(plc, 'X10:12'), { x: 215, y: 550 },
    [{ x: 568, y: 437 }, { x: 568, y: 550 }], stop, '22', 'right', ['W-07', '2']],
  ['pressure-test-reference', '0 V', 'X2', { x: 925, y: 495 }, { x: 1020, y: 495 },
    null, pressureTestCommon, '2', 'right']
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
  [cabinet, 'IRRIGATION CONTROLLER · POWER AND I/O', 'XT1 receives the PS1 24 V DC output. AI0 records header pressure and DI a.0 reads the separate OUT1 signal.'],
  [field, 'IRRIGATION HEADER PRESSURE · B1', 'OUT2 assumes voltage mode. Pressure scaling, OUT1 setpoints and PLC program logic remain unassigned.'],
  [output, 'IRRIGATION PUMP REQUEST · K1', 'XT2 exposes the normally open demand contact. The external starter, motor feeder and safety controls remain outside this drawing.'],
  [operator, 'LOCAL IRRIGATION REQUEST · S1', 'W-01 carries supply and the momentary request to DI a.1. The input requests PLC action through the program.'],
  [feedback, 'PUMP STARTER RUN FEEDBACK · XT3', 'XT3 is the boundary for the external normally open run contact. DI a.2 reports contact state independently of the request to K1.'],
  [indication, 'LOCAL PUMP RUN INDICATION · H1', 'W-03 carries DQ a.1 and 0 V. H1 follows the PLC output command. The logic linking DI a.2 to the indication remains unassigned.'],
  [fault, 'PUMP STARTER FAULT INPUT · XT4', 'W-04 serves the external contact that closes on starter fault. DI a.3 observes the contact. Loss of the circuit is indistinguishable from an open contact.'],
  [power, 'CONTROL SUPPLY · PS1', 'XT5 marks the incoming L, N and PE boundary. PS1 feeds XT1. Upstream protection, conductor sizing remain unassigned.'],
  [earth, 'ENCLOSURE PROTECTIVE EARTH · XT6', 'XT6 carries PE from XT5 to the controller and starter enclosure terminal boundaries. Physical bonds, rails and conductor sizes remain unassigned.'],
  [alarm, 'STARTER FAULT ANNUNCIATOR INTERFACE · K2', 'DQ a.2 commands K2. XT7 exposes the changeover contacts. PLC alarm logic and the external annunciator supply and load remain unassigned.'],
  [permissive, 'WATER SOURCE PERMISSIVE · XT8', 'W-06 serves the external contact that closes when water is available. DI a.4 is a PLC input. Sensor selection and PLC permissive logic remain unassigned.'],
  [stopStation, 'PUMP-SIDE OPERATIONAL STOP · S2', 'Pressing S2 opens the DI a.5 circuit. W-07 carries the feed and return. This is a PLC operational input. Emergency-stop functions remain outside this drawing.'],
  [pressureTest, 'PRESSURE TRANSMITTER TEST ACCESS · XT9', 'X20 opens the transmitter feed. X21 and X22 expose its downstream feed and 0 V reference. Test equipment and procedure remain unassigned.'],
  [demandTest, 'PUMP DEMAND TEST ACCESS · XT10', 'X23 opens the command path to K1. X24 and X25 expose the downstream command and 0 V. External starter isolation remains outside this drawing.']
]) {
  [title, description].forEach((text, index) => project.objects.push({
    id: sheetId + '-note-' + index, sheetId, kind: 'text', x: 105, y: index ? 585 : 100, text
  }));
}

const purposeByTerminal = {
  'X10:7': 'Pressure switch feedback',
  'X10:8': 'Local irrigation request',
  'X10:9': 'Starter run contact',
  'X10:10': 'Starter fault contact',
  'X10:11': 'Water-available contact',
  'X10:12': 'Operational stop request',
  'X11:2': 'Header pressure voltage',
  'X12:3': 'Pump demand relay',
  'X12:4': 'Local run indication',
  'X12:5': 'Fault annunciator relay'
};
const ioReport = engine.plcIoList(JSON.parse(engine.serializeProject(project)));
if (!ioReport.valid) throw new Error(ioReport.errors.join(' '));
const wiredChannels = ioReport.rows.filter(row => row.connectedPins.length);
const table = [['PLC terminal', 'Channel', 'Signal purpose', 'Connected pins'], ...wiredChannels.map(row => {
  const purpose = purposeByTerminal[row.terminal];
  if (!purpose) throw new Error('Missing irrigation signal purpose for ' + row.terminal);
  return [row.ref + ' ' + row.terminal, row.channel, purpose, row.connectedPins.join(' · ')];
})];
table.forEach((cells, row) => cells.forEach((text, column) => {
  project.objects.push({ id: 'io-schedule-' + row + '-' + column, sheetId: ioSchedule, kind: 'text',
    x: [105, 255, 360, 655][column], y: 200 + 34 * row, text });
}));
for (const [id, y, text] of [
  ['title', 105, 'IRRIGATION CONTROLLER · WIRED PLC I/O SCHEDULE'],
  ['scope', 150, 'A1 hardware channels and connected pin references from revision ' + project.revision + '.'],
  ['source', 566, 'Regenerate this schedule from the native wiring model. PLC tag addresses, scaling and program logic remain unassigned.']
]) {
  project.objects.push({ id: 'io-schedule-' + id, sheetId: ioSchedule, kind: 'text', x: 105, y, text });
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
