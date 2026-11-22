'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { isDeepStrictEqual } = require('node:util');
require('../cad-engine.js');
const engine = globalThis.AdigunCADEngine;
const file = path.join(__dirname, '../examples/real-projects/sitop-24v-dc-distribution.adigun.json');
const source = JSON.parse(fs.readFileSync(file, 'utf8'));
const annunciator = { id: 'annunciator-interface', number: 'A2/020', name: 'XT10 isolated annunciator request', projectSectionId: 'A2' };
const testAccess = { id: 'distribution-test-access', number: 'A2/021', name: 'XT11 downstream DC voltage test access', projectSectionId: 'A2' };
const fieldIndicator = { id: 'field-indicator', number: 'A2/022', name: 'Externally powered H1 annunciator', projectSectionId: 'A2' };
const branchIndicator = { id: 'branch-a-indicator', number: 'A2/023', name: 'Branch A voltage indication', projectSectionId: 'A2' };
const secondPressureSensor = { id: 'ai1-pressure-sensor', number: 'A2/024', name: 'B3 pressure sensor to AI1', projectSectionId: 'A2' };
const branchBMonitor = { id: 'branch-b-monitor', number: 'A2/025', name: 'Branch B voltage-present relay and dry contacts', projectSectionId: 'A2' };
const branchBLossAlert = { id: 'branch-b-loss-alert', number: 'A2/026', name: 'Branch B loss indication from independent supply', projectSectionId: 'A2' };
const fieldSupplyPotential = 'External annunciator +24 V';
const fieldRequestPotential = 'Annunciator switched +24 V';
const remoteLossIndicator = { id: 'branch-b-remote-indicator', number: 'A2/027', name: 'XT15 remote Branch B status indicators', projectSectionId: 'A2' };
const indicatorSupplyTest = { id: 'indicator-supply-test', number: 'A2/028', name: 'XT16 independent indicator supply test access', projectSectionId: 'A2' };
const pressureTerminations = { id: 'b3-field-terminations', number: 'A2/029', name: 'XT17 B3 field cable terminations', projectSectionId: 'A2' };
const pressureStatus = { id: 'b3-switching-boundary', number: 'A2/030', name: 'XT18 B3 switching output boundary', projectSectionId: 'A2' };
const pressureRelay = { id: 'b3-switching-relay', number: 'A2/031', name: 'K5 pressure status relay and dry output', projectSectionId: 'A2' };
const pressureLamp = { id: 'b3-pressure-status-lamp', number: 'A2/032', name: 'XT20 externally powered B3 pressure indication', projectSectionId: 'A2' };
const authoredSheets = [annunciator, testAccess, fieldIndicator, branchIndicator, secondPressureSensor, branchBMonitor, branchBLossAlert, remoteLossIndicator, indicatorSupplyTest, pressureTerminations, pressureStatus, pressureRelay, pressureLamp];
const authoredObject = item => authoredSheets.some(sheet => item.id.startsWith(sheet.id + '-'));

const project = structuredClone(source);
project.revision = '3.10';
project.sheets = project.sheets.filter(item => !authoredSheets.some(sheet => sheet.id === item.id));
project.sheets.push(...authoredSheets);
project.objects = project.objects.filter(object => !authoredObject(object));
project.crossSheetConnections = project.crossSheetConnections.filter(link => !authoredObject(link));

function author(sheet, draw) {
  const prefix = sheet.id + '-';

  function device(ref, componentId, x, y, properties) {
    const instance = { schemaVersion: 1, kind: 'component-instance', id: prefix + ref.toLowerCase(),
      componentId, ref, x, y, rotation: 0, properties, sheetId: sheet.id };
    project.objects.push(instance);
    return instance;
  }

  function pin(instance, number) {
    const anchor = engine.worldPins(instance).find(item => item.number === number);
    if (!anchor) throw new Error('Missing terminal ' + instance.ref + ':' + number);
    return { x: anchor.x, y: anchor.y, attachment: { instanceId: instance.id, pinId: anchor.id } };
  }

  function wire(id, sheetId, start, end, potential) {
    if (start.x !== end.x && start.y !== end.y) throw new Error('Non-orthogonal segment ' + id);
    const pinAttachments = {};
    if (start.attachment) pinAttachments.start = start.attachment;
    if (end.attachment) pinAttachments.end = end.attachment;
    const object = { id: prefix + id, kind: 'wire', sheetId, x: start.x, y: start.y,
      x1: start.x, y1: start.y, x2: end.x, y2: end.y, potential,
      stroke: potential === '0 V DC' ? '#164eac' : '#38734b', strokeWidth: 1.5 };
    if (Object.keys(pinAttachments).length) object.pinAttachments = pinAttachments;
    project.objects.push(object);
    return object;
  }

  function link(id, name, from, to, sourceRef, destinationRef, directions = ['right', 'left']) {
    project.crossSheetConnections.push({ id: prefix + id, name, endpoints: [
      { sheetId: from.sheetId, wireId: from.id, point: { x: from.x2, y: from.y2 },
        connector: { direction: directions[0], targetSheetId: to.sheetId, targetRef: destinationRef } },
      { sheetId: to.sheetId, wireId: to.id, point: { x: to.x1, y: to.y1 },
        connector: { direction: directions[1], targetSheetId: from.sheetId, targetRef: sourceRef } }
    ] });
  }

  function notes(rows) {
    for (const [id, y, text] of rows) {
      project.objects.push({ id: prefix + id, kind: 'text', sheetId: sheet.id, x: 110, y, text, stroke: '#13263b' });
    }
  }
  draw({ device, pin, wire, link, notes });
}

author(annunciator, ({ device, pin, wire, link, notes }) => {
  const sheet = annunciator;
  const relay = device('K3', 'phoenix-contact-2966171', 435, 345, { marking: 'Annunciator request' });
  const xt10 = (ref, y, position, marking) => device(ref, 'phoenix-contact-3209510', 760, y,
    { terminalStrip: 'XT10', position, marking, comment: 'Field indicator circuit on A2/022.' });
  const common = xt10('X24', 345, '1', 'Dry contact common');
  const request = xt10('X25', 412, '2', 'Dry normally open request');
  const cpuPin = pin(project.objects.find(object => object.id === 'a1'), 'X12:5');
  const command = 'Q0.2 annunciator request';
  const elbow = { x: 715, y: cpuPin.y };
  const drop = { x: 715, y: 605 };
  wire('q2-pin', 'plc-inputs', cpuPin, elbow, command);
  wire('q2-drop', 'plc-inputs', elbow, drop, command);
  const commandSend = wire('q2-send', 'plc-inputs', drop, { x: 870, y: drop.y }, command);
  const returnSend = wire('return-send', 'supply', { x: 675, y: 320 }, { x: 675, y: 582 }, '0 V DC');
  const coil = pin(relay, 'A1');
  const coilReturn = pin(relay, 'A2');
  link('command', command, commandSend,
    wire('coil', sheet.id, { x: 195, y: coil.y }, coil, command), 'A1', 'K3');
  link('return', 'K3 coil return', returnSend,
    wire('coil-return', sheet.id, { x: 195, y: coilReturn.y }, coilReturn, '0 V DC'), 'PS1', 'K3');
  wire('common', sheet.id, pin(relay, '11'), pin(common, '1'), fieldSupplyPotential);
  const requestPin = pin(relay, '14');
  const requestTerminal = pin(request, '1');
  const requestTurn = { x: 620, y: requestPin.y };
  const requestDrop = { x: 620, y: requestTerminal.y };
  wire('request-contact', sheet.id, requestPin, requestTurn, fieldRequestPotential);
  wire('request-drop', sheet.id, requestTurn, requestDrop, fieldRequestPotential);
  wire('request-terminal', sheet.id, requestDrop, requestTerminal, fieldRequestPotential);

  notes([
    ['title', 108, 'XT10 · ISOLATED ANNUNCIATOR REQUEST'],
    ['coil-note', 198, 'A1 Q0.2 commands K3. The coil returns to PS1 0 V.'],
    ['contact-note', 465, 'XT10:1 is K3 common. XT10:2 is the normally open request contact.'],
    ['scope', 515, 'See A2/022 for the separate field supply boundary and H1 indicator. PLC switching logic is outside this drawing.']
  ]);
});

author(testAccess, ({ device, pin, wire, link, notes }) => {
  const channels = [
    { id: 'positive', ref: 'X26', position: '1', y: 275, potential: '+24 V DC', sourceWire: 'b-positive-send', sourceRef: 'X2', tapX: 760, offset: -55 },
    { id: 'return', ref: 'X27', position: '2', y: 390, potential: '0 V DC', sourceWire: 'b-return-send', sourceRef: 'X4', tapX: 760, offset: 45 }
  ];
  for (const channel of channels) {
    const feed = project.objects.find(object => object.id === channel.sourceWire);
    if (!feed || feed.y1 !== feed.y2 || channel.tapX <= feed.x1 || channel.tapX >= feed.x2) {
      throw new Error('Branch B voltage tap no longer meets ' + channel.sourceWire);
    }
    const terminal = device(channel.ref, 'phoenix-contact-3209510', 565, channel.y,
      { terminalStrip: 'XT11', position: channel.position, marking: 'Branch B ' + channel.potential,
        comment: 'Reserved voltage measurement access. No instrument installed.' });
    const send = wire(channel.id + '-send', feed.sheetId,
      { x: channel.tapX, y: feed.y1 }, { x: channel.tapX, y: feed.y1 + channel.offset }, channel.potential);
    const receive = wire(channel.id + '-receive', testAccess.id, { x: 225, y: channel.y }, pin(terminal, '1'), channel.potential);
    link(channel.id, 'Branch B test access ' + channel.potential, send, receive, channel.sourceRef, channel.ref);
  }
  notes([
    ['title', 108, 'XT11 · BRANCH B VOLTAGE TEST ACCESS'],
    ['positive-note', 225, 'XT11:1 is taken downstream of X2 on the Branch B positive conductor.'],
    ['return-note', 340, 'XT11:2 is taken downstream of X4 on the Branch B return conductor.'],
    ['scope', 490, 'The terminals document measurement access. No instrument or test result is assigned.']
  ]);
});

author(fieldIndicator, ({ device, pin, wire, link, notes }) => {
  const lamp = device('H1', 'schneider-electric-xb5avb3', 620, 410, { marking: 'Annunciator requested' });
  const terminal = (ref, x, y, position, marking) => device(ref, 'phoenix-contact-3209510', x, y,
    { terminalStrip: 'XT12', position, marking, comment: 'External annunciator supply boundary.' });
  const positive = terminal('X28', 430, 280, '1', 'External +24 V');
  const returnTerminal = terminal('X29', 840, 410, '2', 'External 0 V');
  const xt10Common = project.objects.find(object => object.ref === 'X24');
  const xt10Request = project.objects.find(object => object.ref === 'X25');
  const common = pin(xt10Common, '2');
  const request = pin(xt10Request, '2');
  const feed = fieldSupplyPotential;
  const switched = fieldRequestPotential;
  link('feed', feed, wire('common-send', annunciator.id, common, { x: 960, y: common.y }, feed),
    wire('feed-receive', fieldIndicator.id, { x: 225, y: 280 }, pin(positive, '1'), feed), 'X24', 'X28');
  link('request', switched, wire('request-send', annunciator.id, request, { x: 960, y: request.y }, switched),
    wire('request-receive', fieldIndicator.id, { x: 225, y: 410 }, pin(lamp, 'X1'), switched), 'X25', 'H1');
  wire('return', fieldIndicator.id, pin(lamp, 'X2'), pin(returnTerminal, '1'), 'External annunciator 0 V');
  notes([
    ['title', 108, 'H1 · EXTERNALLY POWERED ANNUNCIATOR'],
    ['feed-note', 230, 'XT12:1 feeds the K3 dry common on A2/020.'],
    ['command-note', 360, 'K3 normally open contact feeds H1. XT12:2 is the external return.'],
    ['scope', 510, 'The external supply, protection and cable are unassigned. No connection to the SITOP return is modeled.']
  ]);
});

author(branchIndicator, ({ device, pin, wire, link, notes }) => {
  const lamp = device('H2', 'schneider-electric-xb5avb3', 550, 320, { marking: 'Branch A voltage present' });
  for (const [name, sourceId, sourceRef, terminal, potential, tapEndY, boundaryX] of [
    ['feed', 'a-positive-send', 'X1', 'X1', '+24 V DC', 187, 230],
    ['return', 'a-return-send', 'X3', 'X2', '0 V DC', 645, 880]
  ]) {
    const trunk = project.objects.find(object => object.id === sourceId);
    const tapX = 735;
    if (!trunk || trunk.y1 !== trunk.y2 || tapX <= trunk.x1 || tapX >= trunk.x2 || trunk.potential !== potential) {
      throw new Error('Branch A indicator tap no longer meets ' + sourceId);
    }
    const end = pin(lamp, terminal);
    const send = wire(name + '-send', trunk.sheetId, { x: tapX, y: trunk.y1 }, { x: tapX, y: tapEndY }, potential);
    const receive = wire(name + '-receive', branchIndicator.id, { x: boundaryX, y: end.y }, end, potential);
    link(name, 'Branch A H2 ' + potential, send, receive, sourceRef, lamp.ref);
  }
  notes([
    ['title', 108, 'H2 · BRANCH A VOLTAGE INDICATION'],
    ['feed-note', 225, 'H2 connects downstream of X1 and X3, in parallel with the Branch A load.'],
    ['scope', 430, 'H2 indicates voltage at its terminals. The schematic does not establish voltage at the field sensor.'],
    ['review', 475, 'Verify actual supply loading, protection and conductor sizing before installation.']
  ]);
});

const pressureCable = [
  { id: 'power', coreId: '1', ref: 'X42', pinNumber: '1', potential: '+24 V DC', marking: 'B3 supply', y: 280 },
  { id: 'signal', coreId: '2', ref: 'X43', pinNumber: '2', potential: 'B3 analog output', marking: 'B3 OUT2 to AI1', y: 350 },
  { id: 'return', coreId: '3', ref: 'X44', pinNumber: '3', potential: '0 V DC', marking: 'B3 return to 2M', y: 420 },
  { id: 'switch', coreId: '4', ref: 'X45', pinNumber: '4', potential: 'B3 switching output', marking: 'B3 OUT1 to XT18', y: 480 }
];
author(pressureTerminations, ({ device, notes }) => {
  for (const { ref, coreId, marking, y } of pressureCable) {
    device(ref, 'phoenix-contact-3209510', 560, y, { terminalStrip: 'XT17', position: coreId, marking });
  }
  notes([
    ['title', 108, 'XT17 · B3 FIELD CABLE TERMINATIONS'],
    ['feed', 205, 'XT17 picks up Branch B power and the AI1 signal and reference from XT9.'],
    ['cable', 545, 'W-B3 carries L+, OUT2, L− and OUT1 to B3. OUT1 terminates at XT18 on A2/030.'],
    ['scope', 580, 'The schedule identifies the connected cores. Cable construction and routing remain unassigned.']
  ]);
});

author(secondPressureSensor, ({ device, pin, wire, link, notes }) => {
  const sensor = device('B3', 'ifm-pn2070', 510, 325, {
    marking: 'Second pressure input', signalConfigurationNote: 'Illustrative connection assumes OUT2 configured for 0–10 V.'
  });
  const analogSheet = 'spare-analog-interface';
  const analogSignal = 'B3 analog output';
  project.sheets.find(sheet => sheet.id === analogSheet).name = 'XT9 B3 analog voltage input interface';
  const output = project.objects.find(object => object.id === 'x22');
  const reference = project.objects.find(object => object.id === 'x23');
  output.properties.marking = 'B3 OUT2 to AI1';
  output.properties.comment = 'B3 OUT2 through XT17 on A2/029.';
  reference.properties.comment = 'B3 L− through XT17 on A2/029 and CPU 2M on A2/005.';
  for (const id of ['xt9-ai1', 'ai1-to-xt9']) project.objects.find(object => object.id === id).potential = analogSignal;
  project.crossSheetConnections.find(item => item.id === 'xt9-ai1-link').name = analogSignal;
  for (const [suffix, text] of [
    ['title', 'XT9 · B3 ANALOG VOLTAGE INPUT'],
    ['scope', 'B3 uses XT9:1 for OUT2 and XT9:2 for L− via XT17. Scaling is unassigned.'],
    ['mode', 'The modeled connection assumes voltage mode on B3 OUT2.']
  ]) project.objects.find(object => object.id === analogSheet + '-' + suffix).text = text;

  const supply = project.objects.find(object => object.id === 'b-positive-send');
  const tapX = 690;
  if (supply.y1 !== supply.y2 || tapX <= supply.x1 || tapX >= supply.x2) throw new Error('B3 supply tap no longer meets Branch B.');
  const power = wire('power-send', supply.sheetId, { x: tapX, y: supply.y1 }, { x: tapX, y: supply.y1 + 65 }, '+24 V DC');
  for (const { id, coreId, ref, pinNumber, potential, marking } of pressureCable) {
    const terminal = project.objects.find(object => object.id === pressureTerminations.id + '-' + ref.toLowerCase());
    const cablePin = pin(terminal, '2'), target = pin(sensor, pinNumber);
    if(id!=='switch'){
      const cabinet = id === 'signal' ? output : reference;
      const cabinetPin = pin(cabinet, '1'), input = pin(terminal, '1');
      const send = id === 'power' ? power : wire(id + '-send', analogSheet, cabinetPin, { x: 210, y: cabinetPin.y }, potential);
      const feed = wire(id + '-xt17-feed', pressureTerminations.id, { x: 210, y: input.y }, input, potential);
      link(id, marking, send, feed, id === 'power' ? 'X2' : cabinet.ref, ref, [id === 'power' ? 'right' : 'left', 'left']);
    }
    const cableSend = wire(id + '-cable-send', pressureTerminations.id, cablePin, { x: 890, y: cablePin.y }, potential);
    const signal = id === 'signal' || id === 'switch';
    const cableReceive = wire(id, secondPressureSensor.id, { x: signal ? 815 : 200, y: target.y }, target, potential);
    for (const segment of [cableSend, cableReceive]) Object.assign(segment, { cableId: 'W-B3', coreId });
    link(id + '-cable', 'W-B3:' + coreId + ' · ' + marking, cableSend, cableReceive, ref, 'B3', ['right', signal ? 'right' : 'left']);
  }
  notes([
    ['title', 108, 'B3 · SECOND PRESSURE INPUT TO AI1'],
    ['input', 218, 'B3 OUT2 routes through XT9:1 to CPU AI1. B2 retains its own AI0 signal.'],
    ['return-note', 440, 'B3 L− returns via XT9:2 to the shared 2M and 0 V reference.'],
    ['scope', 490, 'W-B3 terminates at XT17 on A2/029. OUT2 assumes voltage mode. OUT1 reaches K5 through XT18.']
  ]);
});

author(pressureStatus, ({ device, pin, wire, link, notes }) => {
  const signal = device('X46', 'phoenix-contact-3209510', 550, 280,
    { terminalStrip: 'XT18', position: '1', marking: 'B3 OUT1 boundary' });
  const reference = device('X47', 'phoenix-contact-3209510', 550, 385,
    { terminalStrip: 'XT18', position: '2', marking: 'B3 0 V reference' });
  const fieldTerminal = project.objects.find(object=>object.id===pressureTerminations.id+'-x45');
  const start = pin(fieldTerminal, '1'), end = pin(signal, '1');
  const statusPotential = pressureCable.find(core=>core.id==='switch').potential;
  link('switch', 'B3 OUT1 to XT18:1',
    wire('switch-send', pressureTerminations.id, start, { x: 215, y: start.y }, statusPotential),
    wire('switch-receive', pressureStatus.id, { x: 215, y: end.y }, end, statusPotential), fieldTerminal.ref, signal.ref, ['left', 'left']);
  const returnFeed = project.objects.find(object=>object.id===secondPressureSensor.id+'-return-xt17-feed');
  const tapX = 355, boundaryY = 645, returnPin = pin(reference, '1');
  if (returnFeed.y1 !== returnFeed.y2 || tapX <= returnFeed.x1 || tapX >= returnFeed.x2) throw new Error('XT18 return tap no longer meets XT17.');
  link('reference', 'B3 return to XT18:2',
    wire('return-send', pressureTerminations.id, { x: tapX, y: returnFeed.y1 }, { x: tapX, y: boundaryY }, '0 V DC'),
    wire('return-receive', pressureStatus.id, { x: 215, y: returnPin.y }, returnPin, '0 V DC'), 'X44', reference.ref);
  notes([
    ['title', 108, 'XT18 · B3 SWITCHING OUTPUT BOUNDARY'],
    ['signal', 205, 'XT18:1 brings OUT1 from W-B3 core 4 to K5 A1 on A2/031.'],
    ['reference', 465, 'XT18:2 provides the associated 0 V reference. AI1 stays on the separate OUT2 net.'],
    ['scope', 510, 'The relay interface assumes OUT1 sourcing mode. Switching parameters and sensing threshold remain unassigned.']
  ]);
});

author(pressureRelay, ({ device, pin, wire, link, notes }) => {
  const relay = device('K5', 'phoenix-contact-2966171', 480, 330, { marking: 'B3 pressure switching status' });
  const common = device('X48', 'phoenix-contact-3209510', 790, 330,
    { terminalStrip: 'XT19', position: '1', marking: 'Dry contact common' });
  const contact = device('X49', 'phoenix-contact-3209510', 790, 420,
    { terminalStrip: 'XT19', position: '2', marking: 'Dry normally open output' });
  for (const [key, sourceRef, terminal, potential] of [
    ['switch', 'X46', 'A1', 'B3 switching output'],
    ['return', 'X47', 'A2', '0 V DC']
  ]) {
    const source = project.objects.find(object => object.id === pressureStatus.id + '-' + sourceRef.toLowerCase());
    const start = pin(source, '2'), end = pin(relay, terminal);
    const send = wire(key + '-send', pressureStatus.id, start, { x: 850, y: start.y }, potential);
    const receive = wire(key + '-receive', pressureRelay.id, { x: 210, y: end.y }, end, potential);
    link(key, 'K5 coil ' + key, send, receive, sourceRef, relay.ref);
  }
  wire('common', pressureRelay.id, pin(relay, '11'), pin(common, '1'), 'K5 dry contact common');
  const no = pin(relay, '14'), output = pin(contact, '1');
  const turn = { x: 645, y: no.y }, drop = { x: 645, y: output.y };
  wire('no-pin', pressureRelay.id, no, turn, 'K5 dry normally open output');
  wire('no-drop', pressureRelay.id, turn, drop, 'K5 dry normally open output');
  wire('no-terminal', pressureRelay.id, drop, output, 'K5 dry normally open output');
  notes([
    ['title', 108, 'XT19 · B3 PRESSURE STATUS RELAY'],
    ['configuration', 210, 'The circuit assumes B3 OUT1 is configured as a PNP sourcing output.'],
    ['terminal', 465, 'K5 presents a dry common and normally open contact at XT19. Terminal 12 is unused.'],
    ['scope', 510, 'Verify voltage at K5 and actual loading. See A2/032 for the external indicator circuit.']
  ]);
});

author(pressureLamp, ({ device, pin, wire, link, notes }) => {
  const lamp = device('H6', 'schneider-electric-xb5avb3', 620, 370, { marking: 'B3 pressure switch indication' });
  const supply = device('X50', 'phoenix-contact-3209510', 480, 245,
    { terminalStrip: 'XT20', position: '1', marking: 'External indicator +24 V' });
  const returnTerminal = device('X51', 'phoenix-contact-3209510', 850, 370,
    { terminalStrip: 'XT20', position: '2', marking: 'External indicator 0 V' });
  for (const [coreId, ref, potential, destination, pinNumber, boundaryX, direction] of [
    ['1', 'X48', 'K5 dry contact common', supply, '2', 900, 'right'],
    ['2', 'X49', 'K5 dry normally open output', lamp, 'X1', 210, 'left']
  ]) {
    const terminal = project.objects.find(object=>object.id===pressureRelay.id+'-'+ref.toLowerCase());
    const start = pin(terminal, '2'), end = pin(destination, pinNumber);
    const id = 'core-' + coreId;
    const send = wire(id + '-relay', pressureRelay.id, start, { x: 950, y: start.y }, potential);
    const receive = wire(id + '-indicator', pressureLamp.id, { x: boundaryX, y: end.y }, end, potential);
    for (const segment of [send, receive]) Object.assign(segment, { cableId: 'W-H6', coreId });
    link(id, 'W-H6:' + coreId + ' · ' + potential, send, receive, ref, destination.ref, ['right', direction]);
  }
  wire('lamp-return', pressureLamp.id, pin(lamp, 'X2'), pin(returnTerminal, '1'), 'H6 external indicator 0 V');
  notes([
    ['title', 108, 'XT20 · EXTERNALLY POWERED PRESSURE INDICATION'],
    ['common', 195, 'XT20:1 supplies K5 common over W-H6 core 1.'],
    ['output', 455, 'K5 normally open feeds H6 over core 2 when K5 is energized.'],
    ['scope', 510, 'XT20:2 returns to the external supply. The drawing leaves supply hardware and protection unassigned.']
  ]);
});

author(branchBMonitor, ({ device, pin, wire, link, notes }) => {
  const relay = device('K4', 'phoenix-contact-2966171', 475, 330, { marking: 'Branch B voltage present' });
  const tapX = 315;
  for (const [key, trunkId, potential, pinNumber, boundaryY] of [
    ['feed', 'b-positive-receive', '+24 V DC', 'A1', 205],
    ['return', 'b-return-receive', '0 V DC', 'A2', 430]
  ]) {
    const trunk = project.objects.find(object => object.id === trunkId);
    if (!trunk || trunk.y1 !== trunk.y2 || tapX <= trunk.x1 || tapX >= trunk.x2 || trunk.potential !== potential) {
      throw new Error('Branch B monitor tap no longer meets ' + trunkId);
    }
    const send = wire(key + '-send', trunk.sheetId, { x: tapX, y: trunk.y1 }, { x: tapX, y: boundaryY }, potential);
    const end = pin(relay, pinNumber);
    const receive = wire(key + '-receive', branchBMonitor.id, { x: 190, y: end.y }, end, potential);
    link(key, 'Branch B K4 ' + potential, send, receive, 'B2', relay.ref);
  }
  for (const [ref, position, pinNumber, y, marking] of [
    ['X30', '1', '11', 330, 'Dry contact common'],
    ['X31', '2', '12', 240, 'Normally closed'],
    ['X32', '3', '14', 420, 'Normally open']
  ]) {
    const terminal = device(ref, 'phoenix-contact-3209510', 785, y, { terminalStrip: 'XT13', position, marking });
    const start = pin(relay, pinNumber);
    const end = pin(terminal, '1');
    const net = 'K4 ' + marking;
    const id = 'contact-' + pinNumber;
    if (start.y === end.y) {
      wire(id, branchBMonitor.id, start, end, net);
    } else {
      const turn = { x: 625, y: start.y };
      const drop = { x: turn.x, y: end.y };
      wire(id + '-pin', branchBMonitor.id, start, turn, net);
      wire(id + '-bend', branchBMonitor.id, turn, drop, net);
      wire(id + '-terminal', branchBMonitor.id, drop, end, net);
    }
  }
  notes([
    ['title', 108, 'XT13 · BRANCH B VOLTAGE-PRESENT CONTACTS'],
    ['coil', 175, 'K4 is wired in parallel with B2 on the downstream Branch B supply.'],
    ['contacts', 485, 'XT13 presents dry COM, NC and NO terminals for external indication.'],
    ['scope', 525, 'K4 reports coil energization. See A2/026 for the independent supply and loss indicator.']
  ]);
});

const lossSignal = 'K4 Normally closed';
const presentSignal = 'K4 Normally open';
const indicatorReturn = 'Independent indicator 0 V';
author(branchBLossAlert, ({ device, pin, wire, link, notes }) => {
  const feed = device('X33', 'phoenix-contact-3209510', 430, 245,
    { terminalStrip: 'XT14', position: '1', marking: 'Independent +24 V' });
  device('X34', 'phoenix-contact-3209510', 850, 425,
    { terminalStrip: 'XT14', position: '2', marking: 'Independent 0 V' });
  const output = device('X35', 'phoenix-contact-3209510', 850, 345,
    { terminalStrip: 'XT14', position: '3', marking: 'Switched power to H3' });
  const presentOutput = device('X38', 'phoenix-contact-3209510', 850, 290,
    { terminalStrip: 'XT14', position: '4', marking: 'Switched power to H4' });
  const monitorTerminals = ['x30', 'x31', 'x32'].map(ref => project.objects.find(object => object.id === branchBMonitor.id + '-' + ref));
  for (const [key, marking, terminal, destination, destinationPin, boundaryX, direction] of [
    ['common', 'Dry contact common', monitorTerminals[0], feed, '2', 940, 'right'],
    ['nc', 'Normally closed', monitorTerminals[1], output, '1', 215, 'left'],
    ['no', 'Normally open', monitorTerminals[2], presentOutput, '1', 215, 'left']
  ]) {
    const start = pin(terminal, '2'), end = pin(destination, destinationPin);
    const potential = 'K4 ' + marking;
    const send = wire(key + '-send', branchBMonitor.id, start, { x: 940, y: start.y }, potential);
    const receive = wire(key + '-receive', branchBLossAlert.id, { x: boundaryX, y: end.y }, end, potential);
    link(key, 'Branch B loss alert · ' + marking, send, receive, terminal.ref, destination.ref, ['right', direction]);
  }
  notes([
    ['title', 108, 'XT14 · BRANCH B INDICATOR SUPPLY'],
    ['feed', 195, 'XT14:1 supplies K4 common from an independent 24 V DC source.'],
    ['signal', 465, 'XT14:3 and XT14:4 send K4 NC and NO power to the indicators on A2/027.'],
    ['scope', 505, 'XT14:2 returns to the independent source. The drawing leaves that source and its protection unassigned.']
  ]);
});

author(remoteLossIndicator, ({ device, pin, wire, link, notes }) => {
  const lamp = device('H3', 'schneider-electric-xb5avb3', 620, 370, { marking: 'Branch B loss indication' });
  const fieldFeed = device('X36', 'phoenix-contact-3209510', 370, 370,
    { terminalStrip: 'XT15', position: '1', marking: 'Switched feed from K4 NC' });
  const fieldReturn = device('X37', 'phoenix-contact-3209510', 850, 370,
    { terminalStrip: 'XT15', position: '2', marking: 'Independent indicator 0 V' });
  const presentLamp = device('H4', 'schneider-electric-xb5avb3', 620, 270, { marking: 'Branch B relay energized' });
  const presentFeed = device('X39', 'phoenix-contact-3209510', 370, 270,
    { terminalStrip: 'XT15', position: '3', marking: 'Switched feed from K4 NO' });
  wire('lamp-feed', remoteLossIndicator.id, pin(fieldFeed, '2'), pin(lamp, 'X1'), lossSignal);
  wire('present-lamp-feed', remoteLossIndicator.id, pin(presentFeed, '2'), pin(presentLamp, 'X1'), presentSignal);
  const returnJunction = { x: 745, y: 370 };
  const returnBend = { x: 745, y: 270 };
  wire('lamp-return', remoteLossIndicator.id, pin(lamp, 'X2'), returnJunction, indicatorReturn);
  wire('present-lamp-return', remoteLossIndicator.id, pin(presentLamp, 'X2'), returnBend, indicatorReturn);
  wire('shared-return-drop', remoteLossIndicator.id, returnBend, returnJunction, indicatorReturn);
  wire('shared-return-terminal', remoteLossIndicator.id, returnJunction, pin(fieldReturn, '1'), indicatorReturn);
  for (const [coreId, potential, cabinetRef, terminal, pinNumber, boundaryX, direction] of [
    ['1', lossSignal, 'X35', fieldFeed, '1', 200, 'left'],
    ['2', indicatorReturn, 'X34', fieldReturn, '2', 1020, 'right'],
    ['3', presentSignal, 'X38', presentFeed, '1', 200, 'left']
  ]) {
    const cabinetTerminal = project.objects.find(object => object.id === branchBLossAlert.id + '-' + cabinetRef.toLowerCase());
    const start = pin(cabinetTerminal, '2'), end = pin(terminal, pinNumber);
    const id = 'core-' + coreId;
    const send = wire(id + '-send', branchBLossAlert.id, start, { x: 1020, y: start.y }, potential);
    const receive = wire(id + '-receive', remoteLossIndicator.id, { x: boundaryX, y: end.y }, end, potential);
    for (const segment of [send, receive]) Object.assign(segment, { cableId: 'W-H3', coreId });
    link(id, 'W-H3:' + coreId + ' · ' + potential, send, receive, cabinetRef, terminal.ref, ['right', direction]);
  }
  notes([
    ['title', 108, 'XT15 · REMOTE BRANCH B STATUS INDICATORS'],
    ['feed', 220, 'W-H3 carries K4 NC, independent return and K4 NO from cabinet strip XT14.'],
    ['function', 465, 'With independent power available, H3 indicates K4 de-energized and H4 indicates K4 energized.'],
    ['scope', 510, 'Cable construction, routing, and conductor sizing are unassigned.']
  ]);
});

author(indicatorSupplyTest, ({ device, pin, wire, link, notes }) => {
  const lamp = device('H5', 'schneider-electric-xb5avb3', 615, 330, { marking: 'Independent supply present' });
  for (const [key, sourceRef, ref, position, marking, potential, lampPin, boundaryX, direction] of [
    ['feed', 'X33', 'X40', '1', 'Independent +24 V test point', 'K4 Dry contact common', 'X1', 200, 'left'],
    ['return', 'X34', 'X41', '2', 'Independent 0 V test point', indicatorReturn, 'X2', 1010, 'right']
  ]) {
    const input = direction === 'left';
    const cabinet = project.objects.find(object => object.id === branchBLossAlert.id + '-' + sourceRef.toLowerCase());
    const testPoint = device(ref, 'phoenix-contact-3209510', input ? 365 : 850, 330,
      { terminalStrip: 'XT16', position, marking });
    const source = pin(cabinet, '1'), entry = pin(testPoint, input ? '1' : '2');
    const send = wire(key + '-send', branchBLossAlert.id, source, { x: 215, y: source.y }, potential);
    const receive = wire(key + '-receive', indicatorSupplyTest.id, { x: boundaryX, y: entry.y }, entry, potential);
    link(key, 'XT16 independent supply ' + key, send, receive, sourceRef, ref, ['left', direction]);
    wire(key + '-lamp', indicatorSupplyTest.id, pin(testPoint, input ? '2' : '1'), pin(lamp, lampPin), potential);
  }
  notes([
    ['title', 108, 'XT16 · INDEPENDENT INDICATOR SUPPLY TEST ACCESS'],
    ['purpose', 210, 'H5 monitors the supply feeding K4 common ahead of the changeover contacts.'],
    ['test', 460, 'XT16:1 and XT16:2 provide local test access to the independent 24 V supply.'],
    ['scope', 500, 'H5 shows local supply indication. Test equipment, source protection and cable sizing remain unassigned.']
  ]);
});

const analysis = engine.analyzeProject(project);
const errors = (analysis.findings || []).filter(finding => finding.severity === 'error');
if (!analysis.valid || analysis.openEndpointCount || analysis.geometryErrorCount || errors.length) {
  throw new Error(JSON.stringify({ errors: analysis.errors, findings: errors, open: analysis.openEndpointCount }));
}
if (process.argv.includes('--write')) {
  fs.writeFileSync(file, JSON.stringify(project, null, 2) + '\n');
} else if (!isDeepStrictEqual(project, source)) {
  throw new Error('SITOP authored sheets are out of date. Run node scripts/author-sitop-sheets.js --write.');
}
