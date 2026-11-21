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
const authoredSheets = [annunciator, testAccess];
const authoredObject = item => authoredSheets.some(sheet => item.id.startsWith(sheet.id + '-'));

const project = structuredClone(source);
project.revision = '2.8';
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

  function link(id, name, from, to, sourceRef, destinationRef) {
    project.crossSheetConnections.push({ id: prefix + id, name, endpoints: [
      { sheetId: from.sheetId, wireId: from.id, point: { x: from.x2, y: from.y2 },
        connector: { direction: 'right', targetSheetId: to.sheetId, targetRef: destinationRef } },
      { sheetId: to.sheetId, wireId: to.id, point: { x: to.x1, y: to.y1 },
        connector: { direction: 'left', targetSheetId: from.sheetId, targetRef: sourceRef } }
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
    { terminalStrip: 'XT10', position, marking, comment: 'External annunciator circuit unassigned.' });
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
  wire('common', sheet.id, pin(relay, '11'), pin(common, '1'), 'K3 dry common');
  const requestPin = pin(relay, '14');
  const requestTerminal = pin(request, '1');
  const requestTurn = { x: 620, y: requestPin.y };
  const requestDrop = { x: 620, y: requestTerminal.y };
  wire('request-contact', sheet.id, requestPin, requestTurn, 'K3 dry request');
  wire('request-drop', sheet.id, requestTurn, requestDrop, 'K3 dry request');
  wire('request-terminal', sheet.id, requestDrop, requestTerminal, 'K3 dry request');

  notes([
    ['title', 108, 'XT10 · ISOLATED ANNUNCIATOR REQUEST'],
    ['coil-note', 198, 'A1 Q0.2 commands K3. The coil returns to PS1 0 V.'],
    ['contact-note', 465, 'XT10:1 is K3 common. XT10:2 is the normally open request contact.'],
    ['scope', 515, 'External annunciator power, load and cable are unassigned. Switching logic is outside this drawing.']
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
