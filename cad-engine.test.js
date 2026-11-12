'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
require('./cad-engine.js');

const engine = globalThis.AdigunCADEngine;
const componentId = 'phoenix-contact-3212144';
const relayId = 'phoenix-contact-2966171';
const contactorId = 'schneider-electric-lc1d09bd';

test('the shipped workspace inline script parses before UI handlers initialize', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const inlineScripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter(match => !/\bsrc\s*=/.test(match[1]));
  assert.equal(inlineScripts.length, 1);
  assert.doesNotMatch(inlineScripts[0][2], /(?<!\$)\$\((['"])([^'"]*)\1\)\.forEach/);
  assert.doesNotMatch(inlineScripts[0][2], /createInstance\(item\.componentId,\s*580,\s*415/);
  assert.match(inlineScripts[0][2], /state\.pendingComponentId=id/);
  assert.match(inlineScripts[0][2], /beginObjectDrag/);
  assert.match(inlineScripts[0][2], /data-object-coordinate/);
  assert.match(inlineScripts[0][2], /data-rotate-object/);
  assert.match(inlineScripts[0][2], /remapConnectedWireEnds/);
  assert.match(inlineScripts[0][2], /addEventListener\('contextmenu'/);
  assert.match(inlineScripts[0][2], /e\\.button===2/);
  assert.match(inlineScripts[0][2], /event\.target\.closest\('\[data-object\]'\)/);
  assert.match(inlineScripts[0][2], /data-object-command/);
  assert.match(inlineScripts[0][2], /finishObjectMove\(state.pendingMoveObjectId,svgPoint\(e\)\)/);
  assert.match(inlineScripts[0][2], /function duplicateObject\(id\)/);
  assert.match(inlineScripts[0][2], /function deleteObject\(id\)/);
  assert.doesNotThrow(() => new vm.Script(inlineScripts[0][2], { filename: 'index.html inline script' }));
});

test('catalog contains only source-backed engineering components', () => {
  const items = engine.catalog();
  assert.equal(items.length, 3);
  assert.deepEqual(items.map(item => [item.componentId, item.family, item.tag]), [
    [componentId, 'feedthrough-terminal', 'X'],
    [relayId, 'relay-module', 'K'],
    [contactorId, 'contactor', 'KM']
  ]);
});

test('component instances preserve precise snapped drawing coordinates and pin locations', () => {
  const instance = engine.createInstance(componentId, 582.5, 417.5, 'X1');
  assert.deepEqual([instance.x, instance.y], [582.5, 417.5]);
  assert.deepEqual(engine.worldPins(instance).map(pin => [pin.number, pin.x, pin.y]), [
    ['1', 547.5, 417.5], ['2', 617.5, 417.5]
  ]);
});

test('moving and rotating verified components updates all world pin coordinates', () => {
  const instance = engine.createInstance(relayId, 500, 400, 'K9');
  engine.rotateInstance(instance, 90);
  assert.deepEqual([instance.rotation, instance.x, instance.y], [90, 500, 400]);
  assert.deepEqual(engine.worldPins(instance).map(pin => [pin.number, Number(pin.x.toFixed(1)), Number(pin.y.toFixed(1))]), [
    ['A2', 520, 330], ['A1', 480, 330], ['11', 500, 470], ['12', 525, 470], ['14', 475, 470]
  ]);
  engine.moveInstance(instance, 512.5, 427.5);
  assert.deepEqual(engine.worldPins(instance).map(pin => [pin.number, Number(pin.x.toFixed(1)), Number(pin.y.toFixed(1))]), [
    ['A2', 532.5, 357.5], ['A1', 492.5, 357.5], ['11', 512.5, 497.5], ['12', 537.5, 497.5], ['14', 487.5, 497.5]
  ]);
});

test('component definition has manufacturer source, real connection ports, and editable instance properties', () => {
  const def = engine.component(componentId);
  assert.equal(def.manufacturer, 'Phoenix Contact');
  assert.equal(def.manufacturerPartNumber, '3212144');
  assert.equal(def.specifications.nominalVoltage.value, 1000);
  assert.equal(def.specifications.nominalCurrent.value, 76);
  assert.equal(def.symbol.pins.length, 2);
  assert.deepEqual(def.symbol.internalConnections, [['connection-1', 'connection-2']]);
  assert.match(def.sources[0].url, /^https:\/\/www\.phoenixcontact\.com\//);
  const instance = engine.createInstance(componentId, 580, 415, 'X1');
  instance.properties.marking = 'IN-01';
  assert.equal(engine.validateInstance(instance).valid, true);
  assert.deepEqual(engine.worldPins(instance).map(pin => [pin.number, pin.x, pin.y]), [['1', 545, 415], ['2', 615, 415]]);
});

test('wire endpoints connect to the real pins and through the terminal', () => {
  const component = engine.createInstance(componentId, 580, 415, 'X1');
  const report = engine.analyze([
    component,
    { id: 'W1', kind: 'wire', x1: 500, y1: 415, x2: 545, y2: 415 },
    { id: 'W2', kind: 'wire', x1: 615, y1: 415, x2: 660, y2: 415 }
  ]);
  assert.equal(report.componentCount, 1);
  assert.equal(report.componentPinCount, 2);
  assert.equal(report.connectedPinCount, 2);
  assert.equal(report.unconnectedPinCount, 0);
  assert.equal(report.netCount, 1);
  assert.equal(report.nets[0].wireIds.length, 2);
  assert.equal(report.openEndpointCount, 2);
});

test('a visual crossing without a wire vertex does not create a junction', () => {
  const report = engine.analyze([
    { id: 'WH', kind: 'wire', x1: 0, y1: 10, x2: 20, y2: 10 },
    { id: 'WV', kind: 'wire', x1: 10, y1: 0, x2: 10, y2: 20 }
  ]);
  assert.equal(report.netCount, 2);
  assert.equal(report.openEndpointCount, 4);
});

test('unwired component pins are reported and do not create phantom nets', () => {
  const report = engine.analyze([engine.createInstance(componentId, 580, 415, 'X1')]);
  assert.equal(report.componentPinCount, 2);
  assert.equal(report.connectedPinCount, 0);
  assert.equal(report.unconnectedPinCount, 2);
  assert.equal(report.netCount, 0);
});

test('project JSON round-trips the same source-backed component instance', () => {
  const instance = engine.createInstance(componentId, 580, 415, 'X1');
  instance.properties.terminalStrip = 'XT1';
  const serialized = engine.serializeProject({
    product: 'Adigun AI AutoCAD',
    project: 'Terminal test',
    activeSheet: 'control',
    zoom: 100,
    view: { x: 0, y: 0, w: 1200, h: 760 },
    objects: [instance],
    sheets: []
  });
  const parsed = engine.parseProject(serialized);
  assert.equal(parsed.valid, true);
  assert.equal(parsed.project.version, 2);
  assert.equal(parsed.project.objects[0].componentId, componentId);
  assert.equal(parsed.project.objects[0].properties.terminalStrip, 'XT1');
  assert.equal(engine.analyze(parsed.project.objects).componentCount, 1);
});

test('legacy visual-only component glyphs are rejected on project import', () => {
  const parsed = engine.parseProject(JSON.stringify({
    format: engine.projectFormat,
    version: 1,
    objects: [{ id: 'old-1', kind: 'catalog-symbol', symbolId: 'diode' }],
    sheets: []
  }));
  assert.equal(parsed.valid, false);
  assert.match(parsed.errors.join(' '), /legacy visual-only component/);
});

test('unknown and malformed parts never enter the net model', () => {
  const invalid = engine.createInstance(componentId, 10, 10, 'X1');
  invalid.componentId = 'not-a-real-part';
  const report = engine.analyze([invalid]);
  assert.equal(report.componentCount, 0);
  assert.ok(report.errors.some(error => error.code === 'invalid-component-instance'));
});

test('Phoenix Contact relay definition records source-backed terminals, switching semantics and editable fields', () => {
  const def = engine.component(relayId);
  assert.equal(def.manufacturer, 'Phoenix Contact');
  assert.equal(def.manufacturerPartNumber, '2966171');
  assert.equal(def.specifications.nominalCoilVoltage.value, 24);
  assert.equal(def.specifications.limitingContinuousCurrent.value, 6);
  assert.equal(def.specifications.maximumSwitchingVoltage.value, 250);
  assert.deepEqual(def.symbol.pins.map(pin => pin.localNumber), ['A2', 'A1', '11', '12', '14']);
  assert.equal(def.symbol.pins.length, 5);
  assert.deepEqual(def.symbol.internalConnections, []);
  assert.deepEqual(def.electricalFunctions.changeoverContact.deenergizedConnections, [['contact-11', 'contact-12']]);
  assert.deepEqual(def.electricalFunctions.changeoverContact.energizedConnections, [['contact-11', 'contact-14']]);
  assert.match(def.sources[0].url, /^https:\/\/www\.phoenixcontact\.com\//);
  const instance = engine.createInstance(relayId, 580, 415);
  instance.properties.marking = 'PLC interface relay';
  assert.equal(instance.ref, 'K1');
  assert.equal(engine.validateInstance(instance).valid, true);
  assert.deepEqual(engine.worldPins(instance).map(pin => [pin.number, pin.x, pin.y]), [
    ['A2', 510, 395], ['A1', 510, 435], ['11', 650, 415], ['12', 650, 390], ['14', 650, 440]
  ]);
});

test('real relay pins connect to wires without falsely joining the coil and changeover contacts', () => {
  const relay = engine.createInstance(relayId, 580, 415, 'K1');
  const points = engine.worldPins(relay);
  const objects = [relay].concat(points.map((pin, index) => ({
    id: 'WR' + (index + 1), kind: 'wire',
    x1: pin.x - 20, y1: pin.y, x2: pin.x, y2: pin.y
  })));
  const report = engine.analyze(objects);
  assert.equal(report.componentPinCount, 5);
  assert.equal(report.connectedPinCount, 5);
  assert.equal(report.unconnectedPinCount, 0);
  assert.equal(report.netCount, 5);
  assert.equal(report.openEndpointCount, 5);
});

test('relay model survives project save and reopen with its five real terminal identities', () => {
  const relay = engine.createInstance(relayId, 580, 415, 'K1');
  relay.properties.terminalStrip = 'XT2';
  const parsed = engine.parseProject(engine.serializeProject({
    product: 'Adigun AI AutoCAD', project: 'Relay test', activeSheet: 'control',
    zoom: 100, view: { x: 0, y: 0, w: 1200, h: 760 }, objects: [relay], sheets: []
  }));
  assert.equal(parsed.valid, true);
  assert.equal(parsed.project.objects[0].componentId, relayId);
  assert.equal(parsed.project.objects[0].properties.terminalStrip, 'XT2');
  assert.deepEqual(engine.worldPins(parsed.project.objects[0]).map(pin => pin.number), ['A2', 'A1', '11', '12', '14']);
  assert.equal(engine.analyze(parsed.project.objects).componentPinCount, 5);
});

test('Schneider LC1D09BD has manufacturer-backed coil, main poles, auxiliary contacts and editable data', () => {
  const def = engine.component(contactorId);
  assert.equal(def.manufacturer, 'Schneider Electric');
  assert.equal(def.manufacturerPartNumber, 'LC1D09BD');
  assert.equal(def.specifications.nominalCoilVoltage.value, 24);
  assert.equal(def.specifications.ac3RatedCurrent.value, 9);
  assert.equal(def.specifications.ac3RatedOperationalVoltage.value, 440);
  assert.equal(def.specifications.dimensions.width.value, 45);
  assert.equal(def.specifications.dimensions.height.value, 77);
  assert.equal(def.specifications.dimensions.depth.value, 95);
  assert.deepEqual(def.symbol.pins.map(pin => pin.localNumber), [
    'A1', 'A2', '1/L1', '2/T1', '3/L2', '4/T2', '5/L3', '6/T3', '13', '14', '21', '22'
  ]);
  assert.equal(def.symbol.pins.length, 12);
  assert.deepEqual(def.symbol.internalConnections, []);
  assert.deepEqual(def.electricalFunctions.contactor.mainPoles.map(pole => pole.normalState), ['open', 'open', 'open']);
  assert.deepEqual(def.electricalFunctions.contactor.auxiliaryContacts.map(contact => contact.normalState), ['open', 'closed']);
  assert.match(def.sources[0].url, /^https:\/\/iportal\.se\.com\//);
  const instance = engine.createInstance(contactorId, 580, 415);
  assert.equal(instance.ref, 'KM1');
  instance.properties.position = 'DIN rail 1';
  assert.equal(engine.validateInstance(instance).valid, true);
  assert.deepEqual(engine.worldPins(instance).map(pin => [pin.number, pin.x, pin.y]), [
    ['A1', 460, 390], ['A2', 460, 440], ['1/L1', 530, 360], ['2/T1', 530, 470],
    ['3/L2', 580, 360], ['4/T2', 580, 470], ['5/L3', 630, 360], ['6/T3', 630, 470],
    ['13', 680, 360], ['14', 680, 470], ['21', 725, 360], ['22', 725, 470]
  ]);
});

test('all 12 real contactor terminals connect independently without invented contact-state nets', () => {
  const contactor = engine.createInstance(contactorId, 580, 415, 'KM1');
  const points = engine.worldPins(contactor);
  const objects = [contactor].concat(points.map((pin, index) => ({
    id: 'WC' + (index + 1), kind: 'wire', x1: pin.x - 20, y1: pin.y, x2: pin.x, y2: pin.y
  })));
  const report = engine.analyze(objects);
  assert.equal(report.componentPinCount, 12);
  assert.equal(report.connectedPinCount, 12);
  assert.equal(report.unconnectedPinCount, 0);
  assert.equal(report.netCount, 12);
  assert.equal(report.openEndpointCount, 12);
});

test('contactor identity, pin numbering and editable properties survive project save and reopen', () => {
  const contactor = engine.createInstance(contactorId, 580, 415, 'KM1');
  contactor.properties.terminalStrip = 'XT3';
  const parsed = engine.parseProject(engine.serializeProject({
    product: 'Adigun AI AutoCAD', project: 'Contactor test', activeSheet: 'control',
    zoom: 100, view: { x: 0, y: 0, w: 1200, h: 760 }, objects: [contactor], sheets: []
  }));
  assert.equal(parsed.valid, true);
  assert.equal(parsed.project.objects[0].componentId, contactorId);
  assert.equal(parsed.project.objects[0].properties.terminalStrip, 'XT3');
  assert.deepEqual(engine.worldPins(parsed.project.objects[0]).map(pin => pin.number), [
    'A1', 'A2', '1/L1', '2/T1', '3/L2', '4/T2', '5/L3', '6/T3', '13', '14', '21', '22'
  ]);
});
