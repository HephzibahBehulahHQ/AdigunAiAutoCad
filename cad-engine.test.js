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
const motorProtectionBreakerId = 'siemens-3rv2011-1ja10';
const lowRangeMotorProtectionBreakerId = 'siemens-3rv2011-0fa10';
const startPushButtonId = 'schneider-electric-xb5aa31';
const stopPushButtonId = 'schneider-electric-xb5aa42';

test('the shipped workspace inline script parses before UI handlers initialize', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const inlineScripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter(match => !/\bsrc\s*=/.test(match[1]));
  assert.equal(inlineScripts.length, 1);
  assert.match(html, /overflow-x:auto;overflow-y:hidden;scrollbar-width:thin/);
  assert.match(html, /id="customSheetFrame"/);
  assert.doesNotMatch(inlineScripts[0][2], /(?<!\$)\$\((['"])([^'"]*)\1\)\.forEach/);
  assert.doesNotMatch(inlineScripts[0][2], /createInstance\(item\.componentId,\s*580,\s*415/);
  assert.match(inlineScripts[0][2], /state\.pendingComponentId=id/);
  assert.match(inlineScripts[0][2], /beginObjectDrag/);
  assert.match(inlineScripts[0][2], /data-object-coordinate/);
  assert.match(inlineScripts[0][2], /data-rotate-object/);
  assert.match(inlineScripts[0][2], /remapConnectedWireEnds/);
  assert.match(inlineScripts[0][2], /addEventListener\('contextmenu'/);
  assert.match(inlineScripts[0][2], /if\(e\.button===2\)/);
  assert.match(inlineScripts[0][2], /event\.target\.closest\('\[data-object\]'\)/);
  assert.match(inlineScripts[0][2], /data-object-command/);
  assert.match(inlineScripts[0][2], /function copyObject\(id\)/);
  assert.match(inlineScripts[0][2], /function cutObject\(id\)/);
  assert.match(inlineScripts[0][2], /function pasteObject\(\)/);
  assert.match(inlineScripts[0][2], /function toggleObjectLock\(id\)/);
  assert.match(inlineScripts[0][2], /function toggleObjectHidden\(id\)/);
  assert.match(inlineScripts[0][2], /function changeObjectOrder\(id,front\)/);
  assert.match(inlineScripts[0][2], /function renderResizeHandles\(\)/);
  assert.match(inlineScripts[0][2], /beginObjectResize/);
  assert.match(inlineScripts[0][2], /resizeGraphicObject/);
  assert.match(inlineScripts[0][2], /data-resize-handle/);
  assert.match(inlineScripts[0][2], /function stepObjectOrder\(id,direction\)/);
  assert.match(inlineScripts[0][2], /bring-forward/);
  assert.match(inlineScripts[0][2], /send-backward/);
  assert.match(inlineScripts[0][2], /function flipObject\(id,axis\)/);
  assert.match(inlineScripts[0][2], /selectedObjectIds/);
  assert.match(inlineScripts[0][2], /function toggleSelection\(id\)/);
  assert.match(inlineScripts[0][2], /function beginSelectionBox\(event\)/);
  assert.match(inlineScripts[0][2], /function updateSelectionBox\(point\)/);
  assert.match(inlineScripts[0][2], /function finishSelectionBox\(event\)/);
  assert.match(inlineScripts[0][2], /function renameComponent\(id\)/);
  assert.match(inlineScripts[0][2], /function selectSimilarObjects\(id\)/);
  assert.match(inlineScripts[0][2], /function handleDeleteShortcut\(event\)/);
  assert.match(inlineScripts[0][2], /addEventListener\('dblclick',e=>handleObjectDoubleClick/);
  assert.match(inlineScripts[0][2], /function drawingLayerForObject\(obj\)/);
  assert.match(inlineScripts[0][2], /function selectObjectsOnSameLayer\(id\)/);
  assert.match(inlineScripts[0][2], /state\.layerVisibility\[el\.dataset\.layer\]===false/);
  assert.match(inlineScripts[0][2], /data-object-command="select-type"|select-type/);
  assert.match(inlineScripts[0][2], /function selectConnectedComponents\(id\)/);
  assert.match(inlineScripts[0][2], /AdigunCADEngine\.worldPins\(target\)/);
  assert.match(inlineScripts[0][2], /direct electrical nets selected/);
  assert.match(inlineScripts[0][2], /function cancelSelectionBox\(\)/);
  assert.match(inlineScripts[0][2], /selection-window/);
  assert.match(inlineScripts[0][2], /function groupSelection\(\)/);
  assert.match(inlineScripts[0][2], /function ungroupSelection\(\)/);
  assert.match(inlineScripts[0][2], /function deleteSelection\(\)/);
  assert.match(inlineScripts[0][2], /function translateObjectSet\(ids,dx,dy\)/);
  assert.match(inlineScripts[0][2], /function selectionCanAlign\(\)/);
  assert.match(inlineScripts[0][2], /return obj&&obj.kind!=='wire'/);
  assert.match(inlineScripts[0][2], /obj.rotation===90\|\|obj.rotation===270/);
  assert.match(inlineScripts[0][2], /function objectBounds\(obj\)/);
  assert.match(inlineScripts[0][2], /function alignSelection\(edge\)/);
  assert.match(inlineScripts[0][2], /function distributeSelection\(axis\)/);
  assert.match(inlineScripts[0][2], /Move the outer objects farther apart before distributing this selection/);
  assert.match(inlineScripts[0][2], /align-left/);
  assert.match(inlineScripts[0][2], /distribute-horizontal/);
  assert.match(inlineScripts[0][2], /e\.shiftKey\|\|e\.ctrlKey\|\|e\.metaKey/);
  assert.match(inlineScripts[0][2], /groupId/);
  assert.match(inlineScripts[0][2], /event\.key\.toLowerCase\(\)==='a'/);
  assert.doesNotMatch(inlineScripts[0][2], /moveInstance\(copy,copy\.x\+50,copy\.y\+50\)/);
  assert.match(inlineScripts[0][2], /data-canvas-command/);
  assert.match(inlineScripts[0][2], /clipboardObject/);
  assert.match(inlineScripts[0][2], /function copyObject\(id\)/);
  assert.match(inlineScripts[0][2], /function cutObject\(id\)/);
  assert.match(inlineScripts[0][2], /Array\.isArray\(state\.clipboardObject\)/);
  assert.match(inlineScripts[0][2], /state\.objects\.push\.apply\(state\.objects,copies\)/);
  assert.match(inlineScripts[0][2], /copy-selection/);
  assert.match(inlineScripts[0][2], /duplicate-selection/);
  assert.match(inlineScripts[0][2], /finishObjectMove\(state.pendingMoveObjectId,svgPoint\(e\)\)/);
  assert.match(inlineScripts[0][2], /function duplicateObject\(id\)/);
  assert.match(inlineScripts[0][2], /data-export-bom/);
  assert.match(inlineScripts[0][2], /billOfMaterialsCsv/);
  assert.match(inlineScripts[0][2], /wireListCsv/);
  assert.match(inlineScripts[0][2], /data-export-wire-list/);
  assert.match(inlineScripts[0][2], /function deleteObject\(id\)/);
  assert.match(inlineScripts[0][2], /function deleteSheet\(id\)/);
  assert.match(inlineScripts[0][2], /function openSheetContextMenu\(id,event\)/);
  assert.match(inlineScripts[0][2], /data-sheet-command/);
  assert.match(inlineScripts[0][2], /function renameSheet\(id\)/);
  assert.match(inlineScripts[0][2], /function duplicateSheet\(id\)/);
  assert.match(inlineScripts[0][2], /function moveSheetToPosition\(id\)/);
  assert.match(inlineScripts[0][2], /function reorderSheetBefore\(sourceId,targetId\)/);
  assert.match(inlineScripts[0][2], /adigun-sheet/);
  assert.match(inlineScripts[0][2], /sheetLabels:state/);
  assert.match(inlineScripts[0][2], /function collectProjectObjects\(\)/);
  assert.match(inlineScripts[0][2], /state\.sheetObjects\[state\.sheet\]=state\.objects/);
  assert.match(inlineScripts[0][2], /data-delete-sheet/);
  assert.match(inlineScripts[0][2], /data-close-sheet/);
  assert.doesNotThrow(() => new vm.Script(inlineScripts[0][2], { filename: 'index.html inline script' }));
});

test('object z-order moves by one slot and rejects invalid boundaries', () => {
  const objects = [{ id: 'back' }, { id: 'middle' }, { id: 'front' }];
  assert.equal(engine.reorderObject(objects, 'middle', 1), true);
  assert.deepEqual(objects.map(object => object.id), ['back', 'front', 'middle']);
  assert.equal(engine.reorderObject(objects, 'middle', -1), true);
  assert.deepEqual(objects.map(object => object.id), ['back', 'middle', 'front']);
  assert.equal(engine.reorderObject(objects, 'back', -1), false);
  assert.equal(engine.reorderObject(objects, 'front', 1), false);
  assert.equal(engine.reorderObject(objects, 'missing', 1), false);
  assert.equal(engine.reorderObject(objects, 'middle', 0), false);
});

test('resizable drawing geometry preserves anchors and rejects unsupported or undersized edits', () => {
  const rectangle = { id: 'r1', kind: 'rect', x: 10, y: 20, x1: 10, y1: 20, x2: 50, y2: 70 };
  assert.equal(engine.resizeGraphicObject(rectangle, 'nw', { x: 5, y: 15 }), true);
  assert.deepEqual([rectangle.x, rectangle.y, rectangle.x1, rectangle.y1, rectangle.x2, rectangle.y2], [5, 15, 5, 15, 50, 70]);

  const ellipse = { id: 'e1', kind: 'ellipse', x: 10, y: 20, x2: 50, y2: 70 };
  assert.equal(engine.resizeGraphicObject(ellipse, 'se', { x: 60, y: 80 }), true);
  assert.deepEqual([ellipse.x, ellipse.y, ellipse.x2, ellipse.y2], [10, 20, 60, 80]);

  const triangle = { id: 't1', kind: 'triangle', x: 50, y: 70, x2: 10, y2: 20 };
  assert.equal(engine.resizeGraphicObject(triangle, 'ne', { x: 60, y: 10 }), true);
  assert.deepEqual([triangle.x, triangle.y, triangle.x2, triangle.y2], [10, 10, 60, 70]);

  const circle = { id: 'c1', kind: 'circle', x: 100, y: 100, x1: 100, y1: 100, x2: 110, y2: 100 };
  assert.equal(engine.resizeGraphicObject(circle, 'se', { x: 120, y: 120 }), true);
  assert.equal(circle.x, 100);
  assert.equal(circle.y, 100);
  assert.equal(Math.hypot(circle.x2 - circle.x, circle.y2 - circle.y), 20);

  const original = JSON.stringify(rectangle);
  assert.equal(engine.resizeGraphicObject(rectangle, 'se', { x: 6, y: 16 }), false);
  assert.equal(JSON.stringify(rectangle), original);
  assert.equal(engine.resizeGraphicObject({ kind: 'wire', x: 0, y: 0, x2: 20, y2: 20 }, 'se', { x: 30, y: 30 }), false);
  assert.equal(engine.resizeGraphicObject(rectangle, 'center', { x: 20, y: 20 }), false);
  assert.equal(engine.resizeGraphicObject(rectangle, 'se', { x: NaN, y: 50 }), false);
});

test('catalog contains only source-backed engineering components', () => {
  const items = engine.catalog();
  assert.equal(items.length, 19);
  assert.deepEqual(items.map(item => [item.componentId, item.family, item.tag]), [
    [componentId, 'feedthrough-terminal', 'X'],
    [relayId, 'relay-module', 'K'],
    [contactorId, 'contactor', 'KM'],
    ['siemens-3rt2026-2kb40', 'contactor', 'KM'],
    ['siemens-3ru2126-4ab0', 'motor-overload-relay', 'Q'],
    ['siemens-3rp2576-2nw30', 'star-delta-timer', 'K'],
    [startPushButtonId, 'pushbutton', 'S'],
    [stopPushButtonId, 'pushbutton', 'S'],
    [motorProtectionBreakerId, 'motor-protection-breaker', 'Q'],
    [lowRangeMotorProtectionBreakerId, 'motor-protection-breaker', 'Q'],
    ['siemens-3rv2021-4aa10', 'motor-protection-breaker', 'Q'],
    ['siemens-3rm1201-1aa04', 'motor-starter-reversing', 'Q'],
    ['sew-eurodrive-drn63ms4', 'motor-induction', 'M'],
    ['sew-eurodrive-drn132m4', 'motor-induction', 'M'],
    ['siemens-6es7212-1ae40-0xb0', 'plc-cpu', 'A'],
    ['ifm-ifs204', 'sensor-inductive-pnp', 'B'],
    ['ifm-pn2070', 'sensor-pressure-analog', 'B'],
    ['siemens-sitop-psu100c-6ep1332-5ba00', 'power-supply-ac-dc', 'PS'],
    ['phoenix-contact-3212147', 'protective-earth-terminal', 'X']
  ]);
});
test('Siemens CPU 1212C and ifm IFS204 expose manufacturer terminal identities and source-backed behavior', () => {
  const cpu = engine.component('siemens-6es7212-1ae40-0xb0');
  const sensor = engine.component('ifm-ifs204');
  assert.equal(cpu.manufacturerPartNumber, '6ES7212-1AE40-0XB0');
  assert.equal(cpu.symbol.pins.length, 25);
  assert.deepEqual(cpu.symbol.pins.filter(pin => pin.localNumber.startsWith('X10:')).map(pin => pin.name), [
    'L+ / 24 V DC', 'M / 24 V DC', 'Functional Earth', 'L+ / 24 V DC Sensor Out', 'M / 24 V DC Sensor Out', '1M',
    'DI a.0', 'DI a.1', 'DI a.2', 'DI a.3', 'DI a.4', 'DI a.5', 'DI a.6', 'DI a.7'
  ]);
  assert.ok(cpu.symbol.pins.every(pin => Number.isFinite(pin.x) && Number.isFinite(pin.y)));
  assert.match(cpu.sources[0].url, /s71200_system_manual/);
  assert.match(cpu.sources[0].url,/^https:\/\/support\.industry\.siemens\.com\/cs\/attachments\/109977302\//);
  assert.match(cpu.sources[0].documentRevision,/V4\.7/);
  assert.equal(sensor.manufacturerPartNumber, 'IFB3004BBPKG/US-104');
  assert.deepEqual(sensor.symbol.pins.map(pin => [pin.localNumber, pin.name]), [['1', 'L+ · brown'], ['3', 'L− · blue'], ['4', 'Switching output · black']]);
  assert.equal(sensor.electricalFunctions.output.type, 'PNP');
  assert.equal(sensor.electricalFunctions.output.normalState, 'open');
  assert.match(sensor.sources[0].url, /IFS204-02_EN-GB.pdf/);
  for (const [id, ref] of [['siemens-6es7212-1ae40-0xb0', 'A1'], ['ifm-ifs204', 'B1']]) {
    const instance = engine.createInstance(id, 200, 300, ref);
    assert.equal(engine.validateInstance(instance).valid, true);
    assert.equal(engine.moveInstance(instance, 225, 325).x, 225);
    assert.equal(engine.rotateInstance(instance, 90).rotation, 90);
  }
});

test('PLC and inductive sensor use dedicated schematic glyphs and verified inspector data in the existing shell', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  assert.ok(html.includes("case'plc-cpu':"));
  assert.ok(html.includes("case'sensor-inductive-pnp':"));
  assert.ok(html.includes("def.family==='plc-cpu'"));
  assert.ok(html.includes("def.family==='sensor-inductive-pnp'"));
  assert.ok(html.includes('data-component-property="sensingTarget"'));
  assert.ok(html.includes('manufacturer circuit diagram'));
  assert.ok(html.includes('grid-template-columns:36px minmax(210px,250px) minmax(0,1fr) 36px'));
});

test('off-page connector references navigate to their target components with mouse and keyboard', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  assert.ok(html.includes("group.setAttribute('role','link')"));
  assert.ok(html.includes("group.setAttribute('tabindex','0')"));
  assert.ok(html.includes("group.dataset.layer='connections'"));
  assert.ok(html.includes('.wire,.wire-blue,.wire-dark,.cross-sheet-connector'));
  assert.ok(html.includes("event.key==='Enter'||event.key===' '"));
  assert.ok(html.includes('openCrossSheetConnector(connector)'));
  assert.ok(html.includes('setSheet(connector.targetSheetId)'));
  assert.ok(html.includes('object.ref===connector.targetRef'));
  assert.ok(html.includes('state.selectedObjectIds=[target.id]'));
});

test('Siemens SITOP PSU100C keeps source-backed terminals, ratings and a dedicated existing-shell symbol', () => {
  const psu = engine.component('siemens-sitop-psu100c-6ep1332-5ba00');
  assert.equal(psu.manufacturer, 'Siemens');
  assert.equal(psu.manufacturerPartNumber, '6EP1332-5BA00');
  assert.deepEqual(psu.symbol.pins.map(pin => pin.localNumber), ['L', 'N', 'PE', '+', '-']);
  assert.deepEqual([psu.specifications.acInputVoltage.minimum, psu.specifications.acInputVoltage.maximum], [85, 264]);
  assert.deepEqual([psu.specifications.dcInputVoltage.minimum, psu.specifications.dcInputVoltage.maximum], [110, 300]);
  assert.deepEqual([psu.specifications.outputVoltage.value, psu.specifications.ratedOutputCurrent.value], [24, 2.5]);
  assert.match(psu.symbol.numberingNote, /two physical − output screw terminals/);
  assert.match(psu.sources[0].url, /PSU100C_Handbuch_englisch/);
  assert.match(psu.electricalFunctions.supply.simulation, /not simulated/);
  const instance = engine.createInstance(psu.id, 400, 300, 'PS1');
  assert.equal(engine.validateInstance(instance).valid, true);
  assert.equal(engine.worldPins(instance).length, 5);
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  assert.ok(html.includes("case'power-supply-ac-dc':"));
  assert.ok(html.includes("def.family==='power-supply-ac-dc'"));
  assert.ok(html.includes('data-component-property="marking"'));
  assert.ok(html.includes('grid-template-columns:36px minmax(210px,250px) minmax(0,1fr) 36px'));
});

test('Phoenix Contact PT 16 N-PE exposes its two grounded terminal paths without invented pin numbers', () => {
  const terminal = engine.component('phoenix-contact-3212147');
  assert.equal(terminal.manufacturerPartNumber, '3212147');
  assert.equal(terminal.specifications.ratedCrossSection.value, 16);
  assert.equal(terminal.specifications.groundingFoot.value, true);
  assert.deepEqual(terminal.symbol.pins.map(pin => pin.localNumber), ['1', '2']);
  assert.deepEqual(terminal.symbol.internalConnections, [['connection-1', 'connection-2']]);
  assert.match(terminal.symbol.numberingNote, /model-local connection indexes/);
  assert.match(terminal.sources[0].url, /ground-terminal-pt-16-n-pe-3212147/);
  const instance = engine.createInstance(terminal.id, 400, 300, 'X11');
  assert.equal(engine.validateInstance(instance).valid, true);
  assert.equal(engine.analyze([instance]).unconnectedPinCount, 2);
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  assert.ok(html.includes("case'protective-earth-terminal':"));
  assert.ok(html.includes("def.family==='protective-earth-terminal'"));
  assert.ok(html.includes('grid-template-columns:36px minmax(210px,250px) minmax(0,1fr) 36px'));
});


test('Schneider XB5 start and stop push-buttons keep manufacturer terminal identities and contact semantics', () => {
  const start = engine.component(startPushButtonId);
  const stop = engine.component(stopPushButtonId);
  assert.equal(start.manufacturerPartNumber, 'XB5AA31');
  assert.equal(start.electricalFunctions.pushButton.normalContactState, 'open');
  assert.equal(start.electricalFunctions.pushButton.pressedContactState, 'closed');
  assert.equal(stop.manufacturerPartNumber, 'XB5AA42');
  assert.equal(stop.electricalFunctions.pushButton.normalContactState, 'closed');
  assert.equal(stop.electricalFunctions.pushButton.pressedContactState, 'open');
  assert.equal(stop.specifications.positiveOpening.value, true);
  assert.deepEqual(start.symbol.pins.map(pin => pin.localNumber), ['13','14']);
  assert.deepEqual(stop.symbol.pins.map(pin => pin.localNumber), ['21','22']);
  assert.deepEqual(start.symbol.internalConnections, []);
  assert.deepEqual(stop.symbol.internalConnections, []);
  assert.match(start.sources[0].url, /XB5AA31_DATA/);
  assert.match(stop.sources[0].url, /XB5AA42/);
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  assert.ok(html.includes("case'pushbutton':"));
  assert.ok(html.includes("item.electricalFunctions.pushButton.normalContactState==='open'"));
  assert.ok(html.includes("def.family==='pushbutton'"));

  const instances = [
    engine.createInstance(startPushButtonId, 400, 500, 'S1'),
    engine.createInstance(stopPushButtonId, 600, 500, 'S0')
  ];
  assert.equal(engine.validateInstance(instances[0]).valid, true);
  assert.equal(engine.validateInstance(instances[1]).valid, true);
  const reopened = engine.parseProject(engine.serializeProject({
    product: 'Adigun AI AutoCAD', project: 'Momentary control device test', activeSheet: 'main',
    zoom: 100, view: { x: 0, y: 0, w: 1200, h: 760 }, objects: instances, sheets: []
  }));
  assert.equal(reopened.valid, true, reopened.errors.join(' '));
  assert.deepEqual(reopened.project.objects.map(item => item.componentId), [startPushButtonId, stopPushButtonId]);
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

test('BOM rows and CSV come from valid component instances and include exact part provenance', () => {
  const terminalB = engine.createInstance(componentId, 100, 100, 'X2');
  const terminalA = engine.createInstance(componentId, 50, 100, 'X1');
  const relay = engine.createInstance(relayId, 200, 100, 'K1');
  const objects = [terminalB, relay, terminalA];
  const report = engine.billOfMaterials(objects);
  assert.equal(report.valid, true);
  assert.deepEqual(report.rows.map(row => [row.partNumber, row.quantity, row.references]), [
    ['2966171', 1, ['K1']],
    ['3212144', 2, ['X1', 'X2']]
  ]);
  assert.ok(report.rows.every(row => row.sourcePublisher && row.sourceTitle && row.sourceUrl && row.sourceRetrievedAt));
  const csv = engine.billOfMaterialsCsv(objects);
  assert.ok(csv.startsWith('\uFEFF'));
  assert.match(csv, /"Source URL"/);
  assert.match(csv, /"3212144"/);
  assert.match(csv, /"https:\/\/www\.phoenixcontact\.com\//);
  assert.equal(csv, engine.billOfMaterialsCsv([terminalA, terminalB, relay]));
});

test('BOM CSV refuses malformed or unverified component instances rather than omitting them', () => {
  const terminal = engine.createInstance(componentId, 100, 100, 'X1');
  const invalid = { ...terminal, componentId: 'unverified-part' };
  const report = engine.billOfMaterials([terminal, invalid]);
  assert.equal(report.valid, false);
  assert.ok(report.errors.some(error => error.includes('verified definition')));
  assert.throws(() => engine.billOfMaterialsCsv([terminal, invalid]), /BOM export blocked/);
});

test('BOM refuses legacy visual-only engineering glyphs', () => {
  const visualOnly = { id: 'legacy-diode', kind: 'catalog-symbol', symbolId: 'diode', x: 0, y: 0 };
  const report = engine.billOfMaterials([visualOnly]);
  assert.equal(report.valid, false);
  assert.match(report.errors[0], /unverified legacy symbol/);
  assert.throws(() => engine.billOfMaterialsCsv([visualOnly]), /BOM export blocked/);
});


test('wire list derives IDs, pin references, nets and orthogonal route lengths from model geometry', () => {
  const terminal = engine.createInstance(componentId, 580, 415, 'X1');
  const wires = [
    { id: 'W2', kind: 'wire', x1: 615, y1: 415, x2: 660, y2: 425 },
    { id: 'W1', kind: 'wire', x1: 500, y1: 415, x2: 545, y2: 415 }
  ];
  const report = engine.wireList([terminal, ...wires]);
  assert.equal(report.valid, true);
  assert.deepEqual(report.rows.map(row => [row.wireId, row.netId, row.lengthMm]), [
    ['W1', 'net-1', 45],
    ['W2', 'net-1', 55]
  ]);
  assert.deepEqual(report.rows[0].endPinRefs, ['X1:1']);
  assert.deepEqual(report.rows[1].startPinRefs, ['X1:2']);
  assert.deepEqual(report.rows[0].netPinRefs, ['X1:1', 'X1:2']);
  assert.equal('wireNumber' in report.rows[0], false);
});

test('wire list CSV is deterministic and protects spreadsheet formula prefixes', () => {
  const terminal = engine.createInstance(componentId, 580, 415, 'X1');
  const objects = [
    terminal,
    { id: '=1+1', kind: 'wire', x1: 0, y1: 0, x2: 10, y2: 0 },
    { id: 'W2', kind: 'wire', x1: 615, y1: 415, x2: 660, y2: 425 },
    { id: 'W1', kind: 'wire', x1: 500, y1: 415, x2: 545, y2: 415 }
  ];
  const csv = engine.wireListCsv(objects);
  assert.ok(csv.startsWith('\uFEFF'));
  assert.match(csv, /"Wire ID"/);
  assert.match(csv, /"'=1\+1"/);
  assert.equal(csv, engine.wireListCsv([...objects].reverse()));
});

test('wire list blocks duplicate IDs, invalid geometry and unverified legacy symbols', () => {
  const duplicate = engine.wireList([
    { id: 'W1', kind: 'wire', x1: 0, y1: 0, x2: 10, y2: 0 },
    { id: 'W1', kind: 'wire', x1: 20, y1: 0, x2: 30, y2: 0 }
  ]);
  assert.equal(duplicate.valid, false);
  assert.throws(() => engine.wireListCsv([
    { id: 'bad', kind: 'wire', x1: 1, y1: 1, x2: 1, y2: 1 }
  ]), /Wire list export blocked/);
  assert.throws(() => engine.wireListCsv([
    { id: 'legacy-diode', kind: 'catalog-symbol', symbolId: 'diode', x: 0, y: 0 }
  ]), /Wire list export blocked/);
});


test('selecting component type selects all component instances on the active sheet', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const script = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
    .find(match => !/\bsrc\s*=/.test(match[1]))[2];
  const start = script.indexOf('function selectComponentsByType(id)');
  const end = script.indexOf('\n  function ', start);
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  const source = script.slice(start, end);
  const selected = [];
  const notices = [];
  const context = {
    state: { objects: [
      { id: 'component-a', kind: 'component-instance' },
      { id: 'line-a', kind: 'line' },
      { id: 'component-b', kind: 'component-instance' }
    ] },
    setSelection(ids) { selected.splice(0, selected.length, ...ids); },
    notify(message) { notices.push(message); }
  };
  vm.runInNewContext(source, context);
  vm.runInNewContext("selectComponentsByType('component-a')", context);
  assert.deepEqual(selected, ['component-a', 'component-b']);
  assert.match(notices[0], /2 components selected on this sheet/);
});


test('drawing layer visibility categories and same-layer selection use object data', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const script = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
    .find(match => !/\bsrc\s*=/.test(match[1]))[2];
  const start = script.indexOf('function drawingLayerForObject(obj)');
  const end = script.indexOf('\n  function selectComponentsByType(id)', start);
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  const source = script.slice(start, end);
  const selected = [];
  const context = {
    state: { objects: [
      { id: 'wire-a', kind: 'wire' },
      { id: 'component-a', kind: 'component-instance' },
      { id: 'component-b', kind: 'component-instance' },
      { id: 'note-a', kind: 'text' }
    ] },
    setSelection(ids) { selected.splice(0, selected.length, ...ids); },
    notify() {}
  };
  vm.runInNewContext(source, context);
  assert.equal(vm.runInNewContext("drawingLayerForObject({kind:'wire'})", context), 'connections');
  assert.equal(vm.runInNewContext("drawingLayerForObject({kind:'component-instance'})", context), 'devices');
  assert.equal(vm.runInNewContext("drawingLayerForObject({kind:'text'})", context), 'annotations');
  vm.runInNewContext("selectObjectsOnSameLayer('component-a')", context);
  assert.deepEqual(selected, ['component-a', 'component-b']);
});


test('double-click selects an object and opens its properties in select mode only', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const script = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
    .find(match => !/\bsrc\s*=/.test(match[1]))[2];
  const start = script.indexOf('function handleObjectDoubleClick(event,id)');
  const end = script.indexOf('\n  function drawingLayerForObject(obj)', start);
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  const source = script.slice(start, end);
  const selected = [];
  const opened = [];
  const context = {
    state: { tool: 'select', objects: [{ id: 'text-1', kind: 'text' }] },
    setSelection(ids) { selected.splice(0, selected.length, ...ids); },
    openInspector(name) { opened.push(name); }
  };
  vm.runInNewContext(source, context);
  const event = { preventDefault() {}, stopPropagation() {} };
  vm.runInNewContext('handleObjectDoubleClick(event, "text-1")', { ...context, event });
  assert.deepEqual(selected, ['text-1']);
  assert.deepEqual(opened, ['Properties']);
  context.state.tool = 'wire';
  vm.runInNewContext('handleObjectDoubleClick(event, "text-1")', { ...context, event });
  assert.deepEqual(opened, ['Properties']);
});


test('Delete shortcut removes the whole selection and preserves editor inputs', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const script = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
    .find(match => !/\bsrc\s*=/.test(match[1]))[2];
  const start = script.indexOf('function handleDeleteShortcut(event)');
  const end = script.indexOf('\n  document.addEventListener(\'keydown\',e=>', start);
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  const source = script.slice(start, end);
  const deleted = [];
  const context = {
    state: { selected: 'b', selectedObjectIds: ['a', 'b'] },
    deleteSelection() { deleted.push('selection'); },
    deleteObject(id) { deleted.push(id); }
  };
  vm.runInNewContext(source, context);
  let prevented = false;
  const event = { key: 'Delete', target: { closest: () => null }, preventDefault() { prevented = true; } };
  assert.equal(vm.runInNewContext('handleDeleteShortcut(event)', { ...context, event }), true);
  assert.deepEqual(deleted, ['selection']);
  assert.equal(prevented, true);
  context.state.selectedObjectIds = [];
  context.state.selected = 'single';
  vm.runInNewContext('handleDeleteShortcut(event)', { ...context, event: { ...event, key: 'Backspace' } });
  assert.deepEqual(deleted, ['selection', 'single']);
  const inputEvent = { ...event, target: { closest: () => ({ tagName: 'INPUT' }) } };
  assert.equal(vm.runInNewContext('handleDeleteShortcut(event)', { ...context, event: inputEvent }), false);
  assert.deepEqual(deleted, ['selection', 'single']);
});

test('24 V DC relay-contactor example round-trips with source-backed parts and connected pin nets', () => {
  const examplePath = path.join(__dirname, 'examples', 'real-projects', '24v-relay-contactor-control.adigun.json');
  const source = fs.readFileSync(examplePath, 'utf8');
  const parsed = engine.parseProject(source);
  assert.equal(parsed.valid, true, parsed.errors.join(' '));

  const project = parsed.project;
  const analysis = engine.analyze(project.objects);
  assert.deepEqual(
    [analysis.componentCount, analysis.wireCount, analysis.openEndpointCount, analysis.errors.length],
    [5, 13, 0, 0]
  );
  const netPins = analysis.nets.map(net => net.pins.map(pin => pin.ref + ':' + pin.number).sort().join(',')).sort();
  assert.deepEqual(netPins, [
    'K1:11,X2:1,X2:2',
    'K1:14,KM1:A1',
    'K1:A1,X1:1,X1:2',
    'K1:A2,KM1:A2,X3:1,X3:2'
  ]);

  const bom = engine.billOfMaterials(project.objects);
  assert.equal(bom.valid, true, bom.errors.join(' '));
  assert.deepEqual(
    bom.rows.map(row => [row.partNumber, row.quantity]).sort((a, b) => a[0].localeCompare(b[0])),
    [['2966171', 1], ['3212144', 3], ['LC1D09BD', 1]].sort((a, b) => a[0].localeCompare(b[0]))
  );
  const wireList = engine.wireList(project.objects);
  assert.equal(wireList.valid, true, wireList.errors.join(' '));
  assert.equal(wireList.rows.length, 13);

  const savedAgain = engine.serializeProject(project);
  const reopened = engine.parseProject(savedAgain);
  assert.equal(reopened.valid, true, reopened.errors.join(' '));
  assert.equal(engine.analyze(reopened.project.objects).nets.length, 4);
});

const starterId = 'siemens-3rm1201-1aa04';

test('Siemens 3RM1201-1AA04 records manufacturer terminals, rating, and source provenance', () => {
  const def = engine.component(starterId);
  assert.equal(def.manufacturer, 'Siemens');
  assert.equal(def.manufacturerPartNumber, '3RM1201-1AA04');
  assert.equal(def.specifications.controlSupplyVoltage.value, 24);
  assert.equal(def.specifications.adjustableRatedOperationalCurrent.minimum, 0.1);
  assert.equal(def.specifications.adjustableRatedOperationalCurrent.maximum, 0.5);
  assert.deepEqual(def.symbol.pins.map(pin => pin.localNumber), [
    '1/L1', '3/L2', '5/L3', '2/T1', '4/T2', '6/T3',
    'A1', 'IN1', 'IN2', 'IN3', 'A2', 'OUT', '95', '96', '98'
  ]);
  assert.equal(def.symbol.pins.length, 15);
  assert.deepEqual(def.symbol.internalConnections, []);
  assert.match(def.sources[0].url, /^https:\/\/mall\.industry\.siemens\.com\//);
  assert.match(def.sources[1].url, /^https:\/\/cache\.industry\.siemens\.com\//);
  const instance = engine.createInstance(starterId, 600, 380, 'Q1');
  instance.properties.position = 'DIN rail 1';
  assert.equal(engine.validateInstance(instance).valid, true);
  assert.deepEqual(engine.worldPins(instance).map(pin => pin.number), [
    '1/L1','3/L2','5/L3','2/T1','4/T2','6/T3','A1','IN1','IN2','IN3','A2','OUT','95','96','98'
  ]);
});

const motorId = 'sew-eurodrive-drn63ms4';

test('SEW DRN63MS4 records source-backed motor ratings and all seven real terminals', () => {
  const def = engine.component(motorId);
  assert.equal(def.manufacturer, 'SEW-EURODRIVE');
  assert.equal(def.manufacturerPartNumber, 'DRN63MS4');
  assert.equal(def.specifications.ratedOutputPower.value, 0.12);
  assert.equal(def.specifications.ratedLineCurrentAt400V50Hz.value, 0.405);
  assert.equal(def.specifications.ratedSpeed.value, 1380);
  assert.deepEqual(def.symbol.pins.map(pin => pin.localNumber), ['U1','V1','W1','U2','V2','W2','PE']);
  assert.deepEqual(def.symbol.internalConnections, []);
  assert.equal(def.electricalFunctions.statorWindings.length, 3);
  assert.ok(def.sources[0].url.startsWith('https://download.sew-eurodrive.com/'));
  const instance = engine.createInstance(motorId, 600, 600, 'M1');
  assert.equal(engine.validateInstance(instance).valid, true);
  assert.deepEqual(engine.worldPins(instance).map(pin => [pin.number, pin.x, pin.y]), [
    ['U1',550,540],['V1',600,540],['W1',650,540],['U2',550,660],['V2',600,660],['W2',650,660],['PE',660,600]
  ]);
});

test('motor symbol and inspector render as a real seven-pin component without changing workstation layout', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  assert.ok(html.includes("case'motor-induction':"));
  assert.ok(html.includes("def.family==='motor-induction'"));
  assert.ok(html.includes("def.family==='motor-starter-reversing'"));
});

test('Siemens 3RV2011-1JA10 preserves six real terminals and manufacturer-backed settings', () => {
  const def = engine.component(motorProtectionBreakerId);
  assert.equal(def.manufacturer, 'Siemens');
  assert.equal(def.manufacturerPartNumber, '3RV2011-1JA10');
  assert.equal(def.specifications.frameSize.value, 'S00');
  assert.equal(def.specifications.overloadTripClass.value, 10);
  assert.deepEqual(def.specifications.adjustableOverloadRelease, { minimum: 7, maximum: 10, unit: 'A' });
  assert.equal(def.specifications.instantaneousShortCircuitRelease.value, 130);
  assert.equal(def.specifications.mainPoleCount.value, 3);
  assert.equal(def.specifications.ratedOperationalVoltage.maximum, 690);
  assert.deepEqual(def.symbol.pins.map(pin => pin.localNumber), ['1/L1','3/L2','5/L3','2/T1','4/T2','6/T3']);
  assert.deepEqual(def.symbol.internalConnections, []);
  assert.deepEqual(def.electricalFunctions.motorProtection.poles, [['line-l1','load-t1'],['line-l2','load-t2'],['line-l3','load-t3']]);
  assert.match(def.sources[0].url, /support\.industry\.siemens\.com.*3RV2011-1JA10/);

  const instance = engine.createInstance(motorProtectionBreakerId, 600, 400, 'Q3');
  assert.equal(instance.properties.overloadSettingA, null);
  assert.equal(engine.validateInstance(instance).valid, true);
  assert.deepEqual(engine.worldPins(instance).map(pin => [pin.number,pin.x,pin.y]), [
    ['1/L1',550,310],['3/L2',600,310],['5/L3',650,310],
    ['2/T1',550,490],['4/T2',600,490],['6/T3',650,490]
  ]);
  instance.properties.overloadSettingA = 8.5;
  assert.equal(engine.validateInstance(instance).valid, true);
  instance.properties.overloadSettingA = 10.1;
  assert.equal(engine.validateInstance(instance).valid, false);
  instance.properties.overloadSettingA = 7;
  engine.rotateInstance(instance, 90);
  assert.deepEqual(engine.worldPins(instance).map(pin => [pin.number,pin.x,pin.y]), [
    ['1/L1',690,350],['3/L2',690,400],['5/L3',690,450],
    ['2/T1',510,350],['4/T2',510,400],['6/T3',510,450]
  ]);
  const report = engine.analyze([instance]);
  assert.deepEqual([report.componentPinCount, report.netCount, report.connectedPinCount, report.unconnectedPinCount], [6,0,0,6]);
  assert.deepEqual(engine.component(motorProtectionBreakerId).symbol.internalConnections, []);
  const reopened = engine.parseProject(engine.serializeProject({
    product: 'Adigun AI AutoCAD', project: 'Motor protector test', activeSheet: 'main',
    zoom: 100, view: { x: 0, y: 0, w: 1200, h: 760 }, objects: [instance], sheets: []
  }));
  assert.equal(reopened.valid, true, reopened.errors.join(' '));
  assert.equal(reopened.project.objects[0].properties.overloadSettingA, 7);
});

test('Siemens 3RV2011-0FA10 records the real low-current adjustment range for later motor examples', () => {
  const def = engine.component(lowRangeMotorProtectionBreakerId);
  assert.equal(def.manufacturer, 'Siemens');
  assert.equal(def.manufacturerPartNumber, '3RV2011-0FA10');
  assert.equal(def.specifications.frameSize.value, 'S00');
  assert.equal(def.specifications.overloadTripClass.value, 10);
  assert.deepEqual(def.specifications.adjustableOverloadRelease, { minimum: 0.35, maximum: 0.5, unit: 'A' });
  assert.equal(def.specifications.instantaneousShortCircuitRelease.value, 6.5);
  assert.equal(def.specifications.ratedOperationalCurrent.value, 0.5);
  assert.equal(def.specifications.ratedMotorPower400V.value, 0.12);
  assert.deepEqual(def.symbol.pins.map(pin => pin.localNumber), ['1/L1','3/L2','5/L3','2/T1','4/T2','6/T3']);
  assert.deepEqual(def.symbol.internalConnections, []);
  assert.match(def.sources[0].url, /support\.industry\.siemens\.com.*3RV2011-0FA10/);
  assert.match(def.sources[0].revisionNote, /0\.35–0\.5 A.*6\.5 A.*0\.12 kW/);

  const instance = engine.createInstance(lowRangeMotorProtectionBreakerId, 600, 400, 'Q4');
  assert.equal(engine.validateInstance(instance).valid, true);
  instance.properties.overloadSettingA = 0.405;
  assert.equal(engine.validateInstance(instance).valid, true);
  instance.properties.overloadSettingA = 0.34;
  assert.equal(engine.validateInstance(instance).valid, false);
  instance.properties.overloadSettingA = 0.51;
  assert.equal(engine.validateInstance(instance).valid, false);
  instance.properties.overloadSettingA = 0.405;
  const reopened = engine.parseProject(engine.serializeProject({
    product: 'Adigun AI AutoCAD', project: 'Low-current motor protector test', activeSheet: 'main',
    zoom: 100, view: { x: 0, y: 0, w: 1200, h: 760 }, objects: [instance], sheets: []
  }));
  assert.equal(reopened.valid, true, reopened.errors.join(' '));
  assert.equal(reopened.project.objects[0].properties.overloadSettingA, 0.405);
});

test('motor-protection symbol and numeric inspector setting preserve the workstation shell', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  assert.ok(html.includes("case'motor-protection-breaker':"));
  assert.ok(html.includes("def.family==='motor-protection-breaker'"));
  assert.ok(html.includes('data-component-property="overloadSettingA"'));
  assert.ok(html.includes("escapeHtml(overloadRule.minimum)"));
  assert.ok(html.includes("escapeHtml(overloadRule.maximum)"));
  assert.ok(html.includes('rule.type===\'number\''));
  assert.ok(html.includes('.topbar{position:relative'));
  assert.ok(html.includes('.toolbar{display:flex'));
});

test('Siemens reversing-starter example imports with every real terminal wired and a source-backed BOM', () => {
  const file = path.join(__dirname, 'examples', 'real-projects', 'siemens-3rm12-reversing-starter.adigun.json');
  const parsed = engine.parseProject(fs.readFileSync(file, 'utf8'));
  assert.equal(parsed.valid, true, parsed.errors.join(' '));
  const analysis = engine.analyze(parsed.project.objects);
  assert.deepEqual([analysis.componentCount, analysis.wireCount, analysis.openEndpointCount, analysis.errors.length], [15, 33, 0, 0]);
  assert.equal(analysis.componentPinCount, 48);
  const wiredStarterPins = analysis.nets.flatMap(net => net.pins)
    .filter(pin => pin.ref === 'Q1').map(pin => pin.number).sort();
  assert.deepEqual(wiredStarterPins, ['1/L1','2/T1','3/L2','4/T2','5/L3','6/T3','95','96','98','A1','A2','IN1','IN2','IN3','OUT']);
  assert.equal(analysis.netCount, 17);
  const motorPins = analysis.nets.flatMap(net => net.pins).filter(pin => pin.ref === 'M1').map(pin => pin.number).sort();
  assert.deepEqual(motorPins, ['PE','U1','U2','V1','V2','W1','W2']);
  for (const [starterPin, motorPin] of [['2/T1','U1'],['4/T2','V1'],['6/T3','W1']]) {
    const net = analysis.nets.find(item => item.pins.some(pin => pin.ref === 'Q1' && pin.number === starterPin));
    assert.ok(net.pins.some(pin => pin.ref === 'M1' && pin.number === motorPin));
    assert.equal(net.pins.filter(pin => /^M1:(U1|V1|W1)$/.test(pin.ref + ':' + pin.number)).length, 1);
  }
  const starNet = analysis.nets.find(net => net.pins.some(pin => pin.ref === 'M1' && pin.number === 'U2'));
  assert.deepEqual(starNet.pins.filter(pin => pin.ref === 'M1').map(pin => pin.number).sort(), ['U2','V2','W2']);
  const wireList = engine.wireList(parsed.project.objects);
  assert.equal(wireList.valid, true, wireList.errors.join(' '));
  assert.equal(wireList.rows.length, 33);
  const bom = engine.billOfMaterials(parsed.project.objects);
  assert.equal(bom.valid, true, bom.errors.join(' '));
  assert.deepEqual(bom.rows.map(row => [row.partNumber, row.quantity]).sort((a,b)=>a[0].localeCompare(b[0])), [
    ['3212144', 13], ['3RM1201-1AA04', 1], ['DRN63MS4', 1]
  ]);
  const reopened = engine.parseProject(engine.serializeProject(parsed.project));
  assert.equal(reopened.valid, true, reopened.errors.join(' '));
  assert.equal(engine.analyze(reopened.project.objects).netCount, 17);
});

test('source-backed DOL motor-feeder example preserves its power, PE, star and control nets', () => {
  const file = path.join(__dirname, 'examples', 'real-projects', 'siemens-schneider-sew-dol-starter.adigun.json');
  const parsed = engine.parseProject(fs.readFileSync(file, 'utf8'));
  assert.equal(parsed.valid, true, parsed.errors.join(' '));
  const project = parsed.project;
  const analysis = engine.analyze(project.objects);
  assert.deepEqual(
    [analysis.componentCount, analysis.wireCount, analysis.componentPinCount, analysis.connectedPinCount, analysis.unconnectedPinCount, analysis.netCount, analysis.openEndpointCount, analysis.errors.length],
    [11, 38, 41, 33, 8, 15, 0, 0]
  );
  const pinNet = (ref, number) => {
    const net = analysis.nets.find(item => item.pins.some(pin => pin.ref === ref && pin.number === number));
    assert.ok(net, `missing connected pin ${ref}:${number}`);
    return net.pins.map(pin => `${pin.ref}:${pin.number}`).sort();
  };
  for (const [breaker, contactor, motor] of [
    ['1/L1','1/L1','U1'], ['3/L2','3/L2','V1'], ['5/L3','5/L3','W1']
  ]) {
    assert.ok(pinNet('Q1', breaker).includes(`X${breaker === '1/L1' ? 1 : breaker === '3/L2' ? 2 : 3}:1`));
    assert.ok(pinNet('Q1', breaker).includes(`X${breaker === '1/L1' ? 1 : breaker === '3/L2' ? 2 : 3}:2`));
    assert.ok(pinNet('Q1', breaker === '1/L1' ? '2/T1' : breaker === '3/L2' ? '4/T2' : '6/T3').includes(`KM1:${contactor}`));
    assert.ok(pinNet('KM1', `${breaker === '1/L1' ? '2/T1' : breaker === '3/L2' ? '4/T2' : '6/T3'}`).includes(`M1:${motor}`));
  }
  assert.deepEqual(pinNet('M1','U2').filter(pin => pin.startsWith('M1:')), ['M1:U2','M1:V2','M1:W2']);
  assert.deepEqual(pinNet('M1','PE'), ['M1:PE','X4:1','X4:2']);
  assert.deepEqual(pinNet('S0','21'), ['S0:21','X5:1','X5:2']);
  assert.deepEqual(pinNet('S0','22'), ['KM1:13','S0:22','S1:13']);
  assert.deepEqual(pinNet('S1','14'), ['KM1:14','KM1:A1','S1:14']);
  assert.deepEqual(pinNet('KM1','A2'), ['KM1:A2','X6:1','X6:2']);
  assert.equal(engine.component('siemens-3rv2011-0fa10').manufacturerPartNumber, '3RV2011-0FA10');
  assert.equal(engine.component('schneider-electric-lc1d09bd').manufacturerPartNumber, 'LC1D09BD');
  assert.equal(engine.component('schneider-electric-xb5aa31').manufacturerPartNumber, 'XB5AA31');
  assert.equal(engine.component('schneider-electric-xb5aa42').manufacturerPartNumber, 'XB5AA42');
  const wireList = engine.wireList(project.objects);
  assert.equal(wireList.valid, true, wireList.errors.join(' '));
  assert.equal(wireList.rows.length, 38);
  const bom = engine.billOfMaterials(project.objects);
  assert.equal(bom.valid, true, bom.errors.join(' '));
  assert.deepEqual(bom.rows.map(row => [row.partNumber, row.quantity]).sort((a,b) => a[0].localeCompare(b[0])), [
    ['3212144',6], ['3RV2011-0FA10',1], ['DRN63MS4',1], ['LC1D09BD',1], ['XB5AA31',1], ['XB5AA42',1]
  ]);
  const reopened = engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid, true, reopened.errors.join(' '));
  assert.equal(engine.analyze(reopened.project.objects).netCount, 15);

test('IFM IFS204 to Siemens CPU 1212C example preserves pin-accurate sensor, supply and input nets', () => {
  const file = path.join(__dirname, 'examples', 'real-projects', 'ifm-ifs204-siemens-s7-1200-sensor-input.adigun.json');
  const parsed = engine.parseProject(fs.readFileSync(file, 'utf8'));
  assert.equal(parsed.valid, true, parsed.errors.join(' '));
  const project = parsed.project;
  const analysis = engine.analyze(project.objects);
  assert.deepEqual(
    [analysis.componentCount, analysis.wireCount, analysis.componentPinCount, analysis.connectedPinCount, analysis.unconnectedPinCount, analysis.netCount, analysis.openEndpointCount, analysis.errors.length],
    [4, 10, 32, 11, 21, 5, 0, 0]
  );
  const pinNet = (ref, number) => {
    const net = analysis.nets.find(item => item.pins.some(pin => pin.ref === ref && pin.number === number));
    assert.ok(net, `missing connected pin ${ref}:${number}`);
    return net.pins.map(pin => `${pin.ref}:${pin.number}`).sort();
  };
  assert.deepEqual(pinNet('A1', 'X10:1'), ['A1:X10:1','X1:1','X1:2']);
  assert.deepEqual(pinNet('A1', 'X10:2'), ['A1:X10:2','A1:X10:6','X2:1','X2:2']);
  assert.deepEqual(pinNet('A1', 'X10:4'), ['A1:X10:4','B1:1']);
  assert.deepEqual(pinNet('A1', 'X10:5'), ['A1:X10:5','B1:3']);
  assert.deepEqual(pinNet('A1', 'X10:7'), ['A1:X10:7','B1:4']);
  const wireList = engine.wireList(project.objects);
  assert.equal(wireList.valid, true, wireList.errors.join(' '));
  assert.equal(wireList.rows.length, 10);
  const bom = engine.billOfMaterials(project.objects);
  assert.equal(bom.valid, true, bom.errors.join(' '));
  assert.deepEqual(bom.rows.map(row => [row.partNumber,row.quantity]).sort((a,b) => a[0].localeCompare(b[0])), [
    ['3212144',2], ['6ES7212-1AE40-0XB0',1], ['IFB3004BBPKG/US-104',1]
  ]);
  const reopened = engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid, true, reopened.errors.join(' '));
  assert.equal(engine.analyze(reopened.project.objects).netCount, 5);
});
});
test('star-delta catalog additions preserve source-backed Siemens and SEW terminal identities', () => {
  const contactor = engine.component('siemens-3rt2026-2kb40');
  assert.equal(contactor.manufacturerPartNumber, '3RT2026-2KB40');
  assert.equal(contactor.specifications.ratedOperationalCurrentAC3At400V.value, 25);
  assert.deepEqual(contactor.symbol.pins.map(pin => pin.localNumber), ['A1','A2','1/L1','2/T1','3/L2','4/T2','5/L3','6/T3','13','14','21','22']);
  assert.match(contactor.sources[0].url, /3RT2026-2KB40/);

  const overload = engine.component('siemens-3ru2126-4ab0');
  assert.deepEqual(overload.specifications.adjustableOverloadRelease, { minimum: 11, maximum: 16, unit: 'A' });
  assert.deepEqual(overload.symbol.pins.map(pin => pin.localNumber), ['1/L1','3/L2','5/L3','2/T1','4/T2','6/T3','95','96','97','98']);
  const relay = engine.createInstance(overload.id, 500, 300, 'F1');
  assert.equal(engine.validateInstance(relay).valid, true);
  relay.properties.overloadSettingA = 15.2;
  assert.equal(engine.validateInstance(relay).valid, true);
  relay.properties.overloadSettingA = 16.1;
  assert.equal(engine.validateInstance(relay).valid, false);

  const breaker = engine.component('siemens-3rv2021-4aa10');
  assert.deepEqual(breaker.specifications.adjustableOverloadRelease, { minimum: 10, maximum: 16, unit: 'A' });
  assert.equal(breaker.specifications.instantaneousShortCircuitRelease.value, 208);
  assert.deepEqual(breaker.symbol.pins.map(pin => pin.localNumber), ['1/L1','3/L2','5/L3','2/T1','4/T2','6/T3']);
  assert.match(breaker.sources[0].url, /3RV2021-4AA10/);

  const timer = engine.component('siemens-3rp2576-2nw30');
  assert.deepEqual(timer.symbol.pins.map(pin => pin.localNumber), ['A1','A2','17','18','28']);
  assert.deepEqual(timer.electricalFunctions.starDeltaTiming, {
    supplyPins: ['supply-a1','supply-a2'], sharedOutputCommon: 'contact-common-17', instantaneousStarOutput: 'star-output-18',
    delayedDeltaOutput: 'delta-output-28', timeRangeSeconds: { minimum: 3, maximum: 60 }, changeoverDelayMilliseconds: 50,
    note: 'Siemens specifies a 50 ms star-to-delta changeover delay to prevent phase-to-phase shorts. Relay switching is not simulated.'
  });
  const timed = engine.createInstance(timer.id, 800, 300, 'K1');
  timed.properties.delaySeconds = 12;
  assert.equal(engine.validateInstance(timed).valid, true);
  timed.properties.delaySeconds = 61;
  assert.equal(engine.validateInstance(timed).valid, false);

  const motor = engine.component('sew-eurodrive-drn132m4');
  assert.equal(motor.specifications.ratedVoltage.value, '400 V Δ / 690 V Y');
  assert.equal(motor.specifications.ratedLineCurrentAt400V50Hz.value, 15.2);
  assert.deepEqual(motor.symbol.pins.map(pin => pin.localNumber), ['U1','V1','W1','U2','V2','W2','PE']);
  assert.ok(motor.sources.every(source => source.publisher === 'SEW-EURODRIVE'));
});

test('star-delta components render in the existing workstation shell with editable settings', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  assert.ok(html.includes("case'star-delta-timer':"));
  assert.ok(html.includes("case'motor-overload-relay':"));
  assert.ok(html.includes('data-component-property="delaySeconds"'));
  assert.ok(html.includes('data-component-property="overloadSettingA"'));
  assert.ok(html.includes('.toolbar{display:flex'));
  assert.ok(html.includes('.topbar{position:relative'));
});
test('SEW and Siemens star-delta example preserves separate power, control, star, delta, and interlock nets', () => {
  const file = path.join(__dirname, 'examples', 'real-projects', 'siemens-sew-star-delta-starter.adigun.json');
  const parsed = engine.parseProject(fs.readFileSync(file, 'utf8'));
  assert.equal(parsed.valid, true, parsed.errors.join(' '));
  const project = parsed.project;
  const analysis = engine.analyze(project.objects);
  assert.deepEqual(
    [analysis.componentCount, analysis.wireCount, analysis.componentPinCount, analysis.connectedPinCount, analysis.unconnectedPinCount, analysis.netCount, analysis.openEndpointCount, analysis.errors.length],
    [15, 242, 80, 72, 8, 26, 0, 0]
  );
  const actual = analysis.nets.map(net => net.pins.map(pin => pin.ref + ':' + pin.number).sort()).sort((a,b) => a[0].localeCompare(b[0]));
  const expected = [
    ['Q1:1/L1','X1:1','X1:2'],
    ['KM2:1/L1','KM3:1/L1','M1:U2'],
    ['KM1:1/L1','Q1:2/T1'],
    ['KM2:3/L2','KM3:3/L2','M1:V2'],
    ['KM2:5/L3','KM3:5/L3','M1:W2'],
    ['KM3:2/T1','KM3:4/T2','KM3:6/T3'],
    ['M1:PE','X4:1','X4:2'],
    ['K1:17','S0:21','X5:1','X5:2'],
    ['KM1:13','S0:22','S1:13'],
    ['F1:95','KM1:14','S1:14'],
    ['Q1:3/L2','X2:1','X2:2'],
    ['F1:96','K1:A1','KM1:A1'],
    ['K1:A2','KM1:A2','KM2:A2','KM3:A2','X6:1','X6:2'],
    ['K1:18','KM2:21'],
    ['KM2:22','KM3:A1'],
    ['K1:28','KM3:21'],
    ['KM2:A1','KM3:22'],
    ['KM1:3/L2','Q1:4/T2'],
    ['Q1:5/L3','X3:1','X3:2'],
    ['KM1:5/L3','Q1:6/T3'],
    ['F1:1/L1','KM1:2/T1'],
    ['F1:3/L2','KM1:4/T2'],
    ['F1:5/L3','KM1:6/T3'],
    ['F1:2/T1','KM2:6/T3','M1:U1'],
    ['F1:4/T2','KM2:2/T1','M1:V1'],
    ['F1:6/T3','KM2:4/T2','M1:W1']
  ].map(net => net.sort()).sort((a,b) => a[0].localeCompare(b[0]));
  assert.deepEqual(actual, expected);
  const components = project.objects.filter(object => object.kind === 'component-instance');
  assert.equal(components.find(object => object.ref === 'K1').properties.delaySeconds, null);
  assert.equal(components.find(object => object.ref === 'F1').properties.overloadSettingA, null);
  assert.equal(components.find(object => object.ref === 'Q1').properties.overloadSettingA, null);
  assert.equal(project.zoom, 50);
  assert.ok(project.view.h >= 1500);
  const wires = engine.wireList(project.objects);
  assert.equal(wires.valid, true, wires.errors.join(' '));
  assert.equal(wires.rows.length, 242);
  const bom = engine.billOfMaterials(project.objects);
  assert.equal(bom.valid, true, bom.errors.join(' '));
  assert.deepEqual(bom.rows.map(row => [row.partNumber,row.quantity]).sort((a,b) => a[0].localeCompare(b[0])), [
    ['3212144',6], ['3RP2576-2NW30',1], ['3RT2026-2KB40',3], ['3RU2126-4AB0',1], ['3RV2021-4AA10',1],
    ['DRN132M4',1], ['XB5AA31',1], ['XB5AA42',1]
  ]);
  const reopened = engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid, true, reopened.errors.join(' '));
  assert.deepEqual(
    engine.analyze(reopened.project.objects).nets.map(net => net.pins.map(pin => pin.ref + ':' + pin.number).sort()).sort((a,b) => a[0].localeCompare(b[0])),
    expected
  );
});


test('multi-sheet project analysis isolates coincident geometry and rejects ambiguous sheet membership', () => {
  const terminal = engine.createInstance('phoenix-contact-3212144', 500, 260, 'X1');
  const objects = [];
  ['sheet-power', 'sheet-control'].forEach((sheetId, index) => {
    const instance = JSON.parse(JSON.stringify(terminal));
    instance.id = 'multi-sheet-terminal-' + index;
    instance.sheetId = sheetId;
    objects.push(instance);
    objects.push({
      kind: 'wire',
      id: 'multi-sheet-wire-' + index,
      sheetId,
      x1: 465,
      y1: 260,
      x2: 535,
      y2: 260
    });
  });
  const project = {
    format: engine.projectFormat,
    version: engine.projectVersion,
    componentSchemaVersion: engine.componentSchemaVersion,
    netSchemaVersion: engine.netSchemaVersion,
    activeSheet: 'sheet-power',
    sheets: [
      { id: 'sheet-power', number: 'A1/006', name: 'Power distribution' },
      { id: 'sheet-control', number: 'A1/007', name: 'Control supply' }
    ],
    objects
  };
  const parsed = engine.parseProject(engine.serializeProject(project));
  assert.equal(parsed.valid, true, parsed.errors.join(' '));
  const report = engine.analyzeProject(parsed.project);
  assert.equal(report.valid, true);
  assert.deepEqual([report.sheetCount, report.wireCount, report.componentCount, report.netCount, report.openEndpointCount], [2, 2, 2, 2, 0]);
  assert.deepEqual(report.sheets.map(sheet => sheet.analysis.nets[0].pins.map(pin => pin.ref + ':' + pin.number)), [
    ['X1:1', 'X1:2'], ['X1:1', 'X1:2']
  ]);
  assert.deepEqual(report.sheets.map(sheet => sheet.analysis.nets[0].id), ['sheet-power:net-1', 'sheet-control:net-1']);
  const missingSheet = JSON.parse(JSON.stringify(project));
  delete missingSheet.objects[0].sheetId;
  assert.equal(engine.validateProject(missingSheet).valid, false);
  const unknownSheet = JSON.parse(JSON.stringify(project));
  unknownSheet.objects[0].sheetId = 'missing-sheet';
  assert.equal(engine.validateProject(unknownSheet).valid, false);
  const duplicateSheet = JSON.parse(JSON.stringify(project));
  duplicateSheet.sheets[1].id = duplicateSheet.sheets[0].id;
  assert.equal(engine.validateProject(duplicateSheet).valid, false);
});


test('sixty-four-sheet connected reference opening set preserves the starter and source-backed PLC interfaces', () => {
  const file = path.join(__dirname, 'examples', 'real-projects', 'siemens-sew-star-delta-reference.adigun.json');
  const parsed = engine.parseProject(fs.readFileSync(file, 'utf8'));
  assert.equal(parsed.valid, true, parsed.errors.join(' '));
  const project = parsed.project;
  assert.equal(project.sheets.length, 64);
  assert.equal(project.activeSheet, 'ref-006');
  assert.ok(project.status.includes('A1/065–A1/100 not authored'));
  const ids = new Set(project.objects.map(object => object.id));
  assert.equal(ids.size, project.objects.length);
  for (const sheet of project.sheets) {
    const pageObjects = project.objects.filter(object => object.sheetId === sheet.id);
    assert.ok(pageObjects.length >= 2, sheet.id + ' must contain native editable content');
    if (sheet.id !== 'ref-006') assert.ok(pageObjects.some(object => object.kind === 'text'), sheet.id + ' must contain editable text');
  }
  const report = engine.analyzeProject(project);
  assert.deepEqual([report.sheetCount, report.componentCount, report.wireCount, report.netCount, report.openEndpointCount], [64,32,335, 67, 0]);
  assert.deepEqual([report.crossSheetConnectionCount,report.globalNetCount,report.localOpenEndpointCount],[21,43,47]);
  assert.deepEqual(report.sheets.slice(0, 5).map(sheet => [sheet.analysis.componentCount, sheet.analysis.wireCount, sheet.analysis.netCount]), [
    [0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0]
  ]);
  const electrical = report.sheets[5].analysis;
  assert.deepEqual([electrical.componentCount, electrical.wireCount, electrical.netCount], [15,244,28]);
  const sensorPage = report.sheets[6].analysis;
  assert.deepEqual([sensorPage.componentCount, sensorPage.wireCount, sensorPage.netCount, sensorPage.openEndpointCount, sensorPage.unconnectedPinCount], [4,25,16,13,8]);
  const supplyPage = report.sheets[7].analysis;
  assert.deepEqual([supplyPage.componentCount, supplyPage.wireCount, supplyPage.netCount, supplyPage.openEndpointCount], [6,7,5,2]);
  const distributionPage = report.sheets[8].analysis;
  assert.deepEqual([distributionPage.componentCount, distributionPage.wireCount, distributionPage.netCount, distributionPage.openEndpointCount], [2,22,2,12]);
  const outputPage = report.sheets[9].analysis;
  assert.deepEqual([outputPage.componentCount,outputPage.wireCount,outputPage.netCount,outputPage.openEndpointCount,outputPage.unconnectedPinCount],[1,13,5,6,0]);
  const contactorPage = report.sheets[10].analysis;
  assert.deepEqual([contactorPage.componentCount,contactorPage.wireCount,contactorPage.netCount,contactorPage.openEndpointCount,contactorPage.unconnectedPinCount],[1,9,5,5,6]);
  const operatorPage = report.sheets[11].analysis;
  assert.deepEqual([operatorPage.componentCount,operatorPage.wireCount,operatorPage.netCount,operatorPage.openEndpointCount,operatorPage.unconnectedPinCount],[2,10,3,4,0]);
  assert.deepEqual([report.sheets[12].analysis.componentCount,report.sheets[12].analysis.wireCount,report.sheets[12].analysis.netCount],[0,0,0]);
  assert.deepEqual([report.sheets[13].analysis.componentCount,report.sheets[13].analysis.wireCount,report.sheets[13].analysis.netCount],[0,0,0]);
  assert.deepEqual([report.sheets[14].analysis.componentCount,report.sheets[14].analysis.wireCount,report.sheets[14].analysis.netCount],[0,0,0]);
  assert.deepEqual([report.sheets[15].analysis.componentCount,report.sheets[15].analysis.wireCount,report.sheets[15].analysis.netCount],[0,0,0]);
  assert.ok(project.objects.some(object=>object.id==='doc-ref-015-input-05'&&/CPU X10:12 \/ DI a\.5.*K2 NC contact 11–12/.test(object.text)));
  assert.ok(project.objects.some(object=>object.id==='doc-ref-016-input-06'&&/CPU X10:13 \/ DI a\.6.*K2 NO output 14/.test(object.text)));
  assert.ok(project.objects.some(object=>object.id==='doc-ref-002-line-14'&&/A1\/014.*KM4 auxiliary NC.*DI a\.4/.test(object.text)));
  assert.ok(project.objects.some(object=>object.id==='doc-ref-002-line-15'&&/A1\/015.*K2 NC.*DI a\.5/.test(object.text)));
  assert.ok(project.objects.some(object=>object.id==='doc-ref-002-line-16'&&/A1\/016.*K2 NO.*DI a\.6/.test(object.text)));
  assert.ok(project.objects.some(object=>object.id==='doc-ref-014-input-04'&&/CPU X10:11 \/ DI a\.4.*KM4 NC auxiliary contact 21–22/.test(object.text)));
  const bom = engine.billOfMaterials(project.objects);
  assert.equal(bom.valid, true, bom.errors.join(' '));
  assert.deepEqual(bom.rows.map(row => [row.partNumber,row.quantity]).sort((a,b)=>a[0].localeCompare(b[0])), [
    ['2966171',1], ['3212144',14], ['3212147',1], ['3RP2576-2NW30',1], ['3RT2026-2KB40',3], ['3RU2126-4AB0',1],
    ['3RV2021-4AA10',1], ['6EP1332-5BA00',1], ['6ES7212-1AE40-0XB0',1], ['DRN132M4',1], ['IFB3004BBPKG/US-104',1], ['LC1D09BD',1], ['PN-400-SER14-MFRKG/US/ /V',1], ['XB5AA31',2], ['XB5AA42',2]
  ]);
  const reopened = engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid, true, reopened.errors.join(' '));
  assert.deepEqual(engine.analyzeProject(reopened.project).sheets.map(sheet => sheet.analysis.netCount), [0,0,0,0,0,28,16,5,2,5,5,3,0,0,0,0,0,0,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]);
});


test('project-level cross-sheet links merge only explicitly referenced wire nets', () => {
  const objects = [];
  ['sheet-power', 'sheet-control'].forEach((sheetId, index) => {
    const terminal = engine.createInstance('phoenix-contact-3212144', 500, 260, index === 0 ? 'X1' : 'X2');
    terminal.id = 'cross-sheet-terminal-' + index;
    terminal.sheetId = sheetId;
    objects.push(terminal);
    objects.push({kind:'wire',id:'cross-sheet-wire-' + index,sheetId,x1:400,y1:260,x2:465,y2:260});
  });
  const project = {
    format: engine.projectFormat, version: engine.projectVersion,
    componentSchemaVersion: engine.componentSchemaVersion, netSchemaVersion: engine.netSchemaVersion,
    activeSheet:'sheet-power',
    sheets:[
      {id:'sheet-power',number:'A1/006',name:'Power distribution'},
      {id:'sheet-control',number:'A1/007',name:'Control supply'}
    ],
    objects,
    crossSheetConnections:[{
      id:'ref-L1',name:'L1',
      endpoints:[
        {sheetId:'sheet-power',wireId:'cross-sheet-wire-0',point:{x:400,y:260},connector:{direction:'left',targetSheetId:'sheet-control',targetRef:'X2'}},
        {sheetId:'sheet-control',wireId:'cross-sheet-wire-1',point:{x:400,y:260},connector:{direction:'right',targetSheetId:'sheet-power',targetRef:'X1'}}
      ]
    }]
  };
  const parsed=engine.parseProject(engine.serializeProject(project));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const report=engine.analyzeProject(parsed.project);
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.deepEqual([report.sheetCount,report.netCount,report.globalNetCount,report.crossSheetConnectionCount],[2,2,1,1]);
  assert.deepEqual([report.localOpenEndpointCount,report.openEndpointCount],[2,0]);
  assert.deepEqual(report.globalNets[0].sheetIds,['sheet-control','sheet-power']);
  assert.deepEqual(report.globalNets[0].pins.map(pin=>pin.sheetId+':'+pin.ref+':'+pin.number),[
    'sheet-control:X2:1','sheet-control:X2:2','sheet-power:X1:1','sheet-power:X1:2'
  ]);
  assert.deepEqual(engine.crossSheetConnectors(project,'sheet-power').map(item=>[item.name,item.targetSheetId,item.targetRef,item.direction]),[
    ['L1','sheet-control','X2','left']
  ]);
  const invalid=JSON.parse(JSON.stringify(project));
  invalid.crossSheetConnections[0].endpoints[1].wireId='missing-wire';
  assert.equal(engine.validateProject(invalid).valid,false);
  const sameSheet=JSON.parse(JSON.stringify(project));
  sameSheet.crossSheetConnections[0].endpoints[1].sheetId='sheet-power';
  assert.equal(engine.validateProject(sameSheet).valid,false);
  const closedEndpoint=JSON.parse(JSON.stringify(project));
  closedEndpoint.crossSheetConnections[0].endpoints[0].point={x:465,y:260};
  assert.equal(engine.analyzeProject(closedEndpoint).valid,false);
  const reopened=engine.parseProject(engine.serializeProject(parsed.project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  assert.equal(engine.analyzeProject(reopened.project).globalNetCount,1);
});


test('A1/007 preserves the source-backed IFM sensor and Siemens PLC example with linked source-backed power through A1/027', () => {
  const file = path.join(__dirname, 'examples', 'real-projects', 'siemens-sew-star-delta-reference.adigun.json');
  const parsed = engine.parseProject(fs.readFileSync(file, 'utf8'));
  assert.equal(parsed.valid, true, parsed.errors.join(' '));
  const project = parsed.project;
  const report = engine.analyzeProject(project);
  assert.equal(report.valid, true, report.errors.join(' '));
  assert.deepEqual([report.sheetCount, report.componentCount, report.wireCount, report.netCount, report.crossSheetConnectionCount, report.openEndpointCount], [64,32,335,67,21,0]);
  assert.deepEqual(report.sheets.slice(-54,-34).map(sheet => [sheet.analysis.componentCount,sheet.analysis.wireCount,sheet.analysis.netCount,sheet.analysis.openEndpointCount]), [[1,9,5,5],[2,10,3,4],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[1,5,3,3],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]]);
  assert.equal(report.globalNetCount,43);
  assert.deepEqual(report.globalNets.filter(net=>net.sheetIds.includes('ref-007')&&net.sheetIds.includes('ref-008')).map(net=>net.pins.map(pin=>pin.sheetId+':'+pin.ref+':'+pin.number).sort()).sort((a,b)=>a[0].localeCompare(b[0])),[
    ['ref-006:F1:97','ref-007:A1:X10:1','ref-007:A1:X12:1','ref-007:X7:1','ref-007:X7:2','ref-008:PS1:+','ref-008:X12:1','ref-008:X12:2','ref-009:X14:1','ref-009:X14:2','ref-010:K2:11','ref-011:KM4:13','ref-011:KM4:21','ref-012:S2:13','ref-012:S3:21','ref-022:B2:1'],
    ['ref-007:A1:X10:2','ref-007:A1:X10:6','ref-007:A1:X11:1','ref-007:X8:1','ref-007:X8:2','ref-008:PS1:-','ref-008:X13:1','ref-008:X13:2','ref-009:X15:1','ref-009:X15:2','ref-010:K2:A2','ref-011:KM4:A2','ref-022:B2:3']
  ]);
  const coilCommand=report.globalNets.find(net=>net.pins.some(pin=>pin.sheetId==='ref-007'&&pin.ref==='A1'&&pin.number==='X12:2'));
  assert.deepEqual(coilCommand.pins.map(pin=>pin.sheetId+':'+pin.ref+':'+pin.number),['ref-007:A1:X12:2','ref-010:K2:A1']);
  const outputSupply=report.globalNets.find(net=>net.pins.some(pin=>pin.sheetId==='ref-007'&&pin.ref==='A1'&&pin.number==='X12:1'));
  assert.ok(outputSupply.pins.some(pin=>pin.sheetId==='ref-009'&&pin.ref==='X14'));
  assert.ok(project.objects.some(object => object.sheetId === 'ref-007' && object.ref === 'B1' && object.componentId === 'ifm-ifs204'));
  assert.ok(project.objects.some(object => object.sheetId === 'ref-007' && object.ref === 'A1' && object.componentId === 'siemens-6es7212-1ae40-0xb0'));
  const saved = engine.parseProject(engine.serializeProject(project));
  assert.equal(saved.valid, true, saved.errors.join(' '));
  const switchedContactorNet=report.globalNets.find(net=>net.pins.some(pin=>pin.sheetId==='ref-010'&&pin.ref==='K2'&&pin.number==='14'));
  assert.deepEqual(switchedContactorNet.pins.map(pin=>pin.sheetId+':'+pin.ref+':'+pin.number),['ref-007:A1:X10:13','ref-010:K2:14','ref-011:KM4:A1']);
  assert.deepEqual(engine.analyzeProject(saved.project).sheets.map(sheet => sheet.analysis.netCount), [0,0,0,0,0,28,16,5,2,5,5,3,0,0,0,0,0,0,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]);
  const relayNcInput=report.globalNets.find(net=>net.pins.some(pin=>pin.sheetId==='ref-010'&&pin.ref==='K2'&&pin.number==='12'));
  assert.deepEqual(relayNcInput.pins.map(pin=>pin.sheetId+':'+pin.ref+':'+pin.number),['ref-007:A1:X10:12','ref-010:K2:12']);
  assert.deepEqual(engine.analyzeProject(saved.project).sheets.map(sheet => sheet.analysis.netCount), [0,0,0,0,0,28,16,5,2,5,5,3,0,0,0,0,0,0,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]);
});


test('A1/008 keeps explicit AC/PE/DC nets and visibly links SITOP outputs to the PLC supply pins', () => {
  const file = path.join(__dirname, 'examples', 'real-projects', 'siemens-sew-star-delta-reference.adigun.json');
  const parsed = engine.parseProject(fs.readFileSync(file, 'utf8'));
  assert.equal(parsed.valid, true, parsed.errors.join(' '));
  const project = parsed.project;
  const report = engine.analyzeProject(project);
  assert.equal(report.valid, true, report.errors.join(' '));
  const page = report.sheets.find(sheet => sheet.id === 'ref-008').analysis;
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.openEndpointCount], [6,7,5,2]);
  assert.deepEqual([report.crossSheetConnectionCount,report.localOpenEndpointCount,report.openEndpointCount],[21,47,0]);
  const pinNet = (ref, number) => {
    const net = page.nets.find(item => item.pins.some(pin => pin.ref === ref && pin.number === number));
    assert.ok(net, `missing connected pin ${ref}:${number}`);
    return net.pins.map(pin => `${pin.ref}:${pin.number}`).sort();
  };
  assert.deepEqual(pinNet('PS1','L'), ['PS1:L','X9:1','X9:2']);
  assert.deepEqual(pinNet('PS1','N'), ['PS1:N','X10:1','X10:2']);
  assert.deepEqual(pinNet('PS1','PE'), ['PS1:PE','X11:1','X11:2']);
  assert.deepEqual(pinNet('PS1','+'), ['PS1:+','X12:1','X12:2']);
  assert.deepEqual(pinNet('PS1','-'), ['PS1:-','X13:1','X13:2']);
  assert.ok(project.objects.some(object => object.sheetId === 'ref-008' && object.ref === 'PS1' && object.componentId === 'siemens-sitop-psu100c-6ep1332-5ba00'));
  assert.ok(project.objects.some(object => object.sheetId === 'ref-008' && object.ref === 'X11' && object.componentId === 'phoenix-contact-3212147'));
  assert.match(project.objects.find(object => object.id === 'doc-ref-008-note-02').text, /A1\/009 X14\/X15/i);
  assert.deepEqual(engine.crossSheetConnectors(project,'ref-008').map(item=>[item.name,item.targetSheetNumber,item.targetRef]),[
    ['+24 V DC','A1/009','X14'],['0 V DC','A1/009','X15']
  ]);
  const saved = engine.parseProject(engine.serializeProject(project));
  assert.equal(saved.valid, true, saved.errors.join(' '));
  assert.deepEqual(engine.analyzeProject(saved.project).globalNets.filter(net=>net.sheetIds.includes('ref-007')&&net.sheetIds.includes('ref-008')&&net.sheetIds.includes('ref-009')).length,2);
});

test('A1/009 adds source-backed feed-through terminals to the PSU-to-PLC cross-sheet circuit', () => {
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(project),page=report.sheets.find(sheet=>sheet.id==='ref-009').analysis;
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.openEndpointCount],[2,22,2,12]);
  assert.match(project.objects.find(object=>object.id==='doc-ref-009-plus').text,/X14 supplies CPU L\+\/1L, K2:11, S2\/S3 and F1:97 via A1\/018; A1\/019 leaves the output topology unchanged/);
  const terminalNet=ref=>page.nets.find(net=>net.pins.some(pin=>pin.ref===ref)).pins.map(pin=>ref+':'+pin.number).sort();
  assert.deepEqual(terminalNet('X14'),['X14:1','X14:2']);
  assert.deepEqual(terminalNet('X15'),['X15:1','X15:2']);
  assert.deepEqual(engine.crossSheetConnectors(project,'ref-009').map(item=>[item.name,item.targetSheetNumber,item.targetRef]),[
    ['+24 V DC','A1/008','X12'],['+24 V DC','A1/007','X7'],['0 V DC','A1/008','X13'],['0 V DC','A1/007','X8'],
    ['+24 V DC · output group 1L','A1/007','A1'],['0 V DC · relay coil return','A1/010','K2'],
    ['+24 V DC · K2 common','A1/010','K2'],['0 V DC · KM4 coil return','A1/011','KM4'],
    ['+24 V DC · operator inputs','A1/012','S2'],['X14 +24 V DC · F1 overload trip contact 97','A1/006','F1'],['+24 V DC · X14 to PN2070 B2 L+','A1/022','B2'],['PN2070 B2 L− · CPU 2M · X15 0 V DC','A1/022','B2']
  ]);
  const roundTrip=engine.parseProject(engine.serializeProject(project));
  assert.equal(roundTrip.valid,true,roundTrip.errors.join(' '));
  assert.equal(engine.analyzeProject(roundTrip.project).openEndpointCount,0);
});

test('A1/010 wires the source-backed PLC transistor output to the Phoenix Contact relay coil', () => {
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(project),page=report.sheets.find(sheet=>sheet.id==='ref-010').analysis;
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.openEndpointCount,page.unconnectedPinCount],[1,13,5,6,0]);
  const relay=project.objects.find(object=>object.sheetId==='ref-010'&&object.ref==='K2');
  assert.equal(relay.componentId,'phoenix-contact-2966171');
  const definition=engine.component(relay.componentId);
  assert.deepEqual(definition.symbol.pins.map(pin=>pin.localNumber),['A2','A1','11','12','14']);
  assert.equal(definition.specifications.typicalInputCurrent.value,9);
  assert.equal(definition.specifications.nominalCoilVoltage.value,24);
  const coilNet=pin=>report.globalNets.find(net=>net.pins.some(item=>item.sheetId==='ref-010'&&item.ref==='K2'&&item.number===pin));
  assert.deepEqual(coilNet('A1').pins.map(pin=>pin.sheetId+':'+pin.ref+':'+pin.number),['ref-007:A1:X12:2','ref-010:K2:A1']);
  assert.ok(coilNet('A2').pins.some(pin=>pin.sheetId==='ref-009'&&pin.ref==='X15'));
  assert.match(project.objects.find(object=>object.id==='doc-ref-010-limit').text,/K2:11\/14 route to the KM4 coil on A1\/011.*DI a\.6.*K2:12 routes to DI a\.5/i);
  const routed=project.objects.filter(object=>object.sheetId==='ref-007'&&object.kind==='wire'&&object.id.startsWith('a1-010-w07-'));
  assert.equal(routed.length,4);
  assert.ok(routed.every(wire=>wire.x1===wire.x2||wire.y1===wire.y2),'A1/010 PLC supply and output paths must stay orthogonal');
  assert.match(project.description,/A1\/065–A1\/100 are not authored/);
  assert.match(project.objects.find(object=>object.id==='doc-ref-003-line-19').text,/2966171.*K2/);
  const roundTrip=engine.parseProject(engine.serializeProject(project));
  assert.equal(roundTrip.valid,true,roundTrip.errors.join(' '));
  assert.equal(engine.analyzeProject(roundTrip.project).globalNetCount,43);
});

test('A1/011 routes the rated PLC relay contact to the source-backed 24 V DC contactor coil', () => {
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(project),page=report.sheets.find(sheet=>sheet.id==='ref-011').analysis;
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.openEndpointCount,page.unconnectedPinCount],[1,9,5,5,6]);
  const km4=project.objects.find(object=>object.sheetId==='ref-011'&&object.ref==='KM4');
  assert.equal(km4.componentId,'schneider-electric-lc1d09bd');
  const definition=engine.component(km4.componentId);
  assert.equal(definition.manufacturerPartNumber,'LC1D09BD');
  assert.equal(definition.electricalFunctions.contactor.coil.nominalVoltage.value,24);
  assert.match(definition.electricalFunctions.contactor.coil.suppression,/bidirectional peak-limiting diode suppressor/i);
  const net=pin=>report.globalNets.find(item=>item.pins.some(p=>p.sheetId==='ref-011'&&p.ref==='KM4'&&p.number===pin));
  assert.deepEqual(net('A1').pins.map(pin=>pin.sheetId+':'+pin.ref+':'+pin.number),['ref-007:A1:X10:13','ref-010:K2:14','ref-011:KM4:A1']);
  assert.ok(net('A2').pins.some(pin=>pin.sheetId==='ref-009'&&pin.ref==='X15'));
  assert.ok(net('13').pins.some(pin=>pin.sheetId==='ref-009'&&pin.ref==='X14'));
  assert.ok(net('13').pins.some(pin=>pin.sheetId==='ref-010'&&pin.ref==='K2'&&pin.number==='11'));
  assert.ok(net('13').pins.some(pin=>pin.sheetId==='ref-011'&&pin.ref==='KM4'&&pin.number==='13'));
  assert.ok(net('21').pins.some(pin=>pin.sheetId==='ref-009'&&pin.ref==='X14'));
  assert.ok(net('21').pins.some(pin=>pin.sheetId==='ref-011'&&pin.ref==='KM4'&&pin.number==='13'));
  assert.ok(net('21').pins.some(pin=>pin.sheetId==='ref-011'&&pin.ref==='KM4'&&pin.number==='21'));
  assert.ok(net('13').pins.some(pin=>pin.sheetId==='ref-012'&&pin.ref==='S2'&&pin.number==='13'));
  assert.deepEqual(net('22').pins.map(pin=>pin.sheetId+':'+pin.ref+':'+pin.number),['ref-007:A1:X10:11','ref-011:KM4:22']);
  assert.deepEqual(net('14').pins.map(pin=>pin.sheetId+':'+pin.ref+':'+pin.number),['ref-007:A1:X10:10','ref-011:KM4:14']);
  const plus=report.globalNets.find(item=>item.pins.some(p=>p.sheetId==='ref-010'&&p.ref==='K2'&&p.number==='11'));
  assert.ok(plus.pins.some(pin=>pin.sheetId==='ref-009'&&pin.ref==='X14'));
  assert.match(project.objects.find(object=>object.id==='doc-ref-011-coil-spec').text,/100 mA average/i);
  assert.match(fs.readFileSync(path.join(__dirname,'docs','components','schneider-electric-lc1d09bd.md'),'utf8'),/FA33405.*100 mA/);
  assert.match(project.objects.find(object=>object.id==='doc-ref-011-limit').text,/main poles remain open.*NC 21–22 routes I0\.4.*NO 13–14 routes I0\.3/i);
  assert.deepEqual(engine.crossSheetConnectors(project,'ref-011').map(item=>[item.name,item.targetSheetNumber,item.targetRef]),[
    ['K2 NO output → KM4 coil','A1/010','K2'],['0 V DC · KM4 coil return','A1/009','X15'],['+24 V DC · KM4 status input','A1/012','S2'],['KM4 auxiliary NO 14 · contact status','A1/007','A1'],['KM4 auxiliary NC 22 · PLC DI a.4','A1/007','A1']
  ]);
  const routed=project.objects.filter(object=>object.kind==='wire'&&['ref-007','ref-011'].includes(object.sheetId)&&object.id.startsWith('a1-014'));
  assert.equal(routed.length,4);
  assert.ok(routed.every(wire=>wire.x1===wire.x2||wire.y1===wire.y2),'A1/014 routes must stay orthogonal');
  const roundTrip=engine.parseProject(engine.serializeProject(project));
  assert.equal(roundTrip.valid,true,roundTrip.errors.join(' '));
  assert.equal(engine.analyzeProject(roundTrip.project).globalNetCount,43);
});

test('A1/012 connects source-backed NO/NC operator contacts to unused Siemens PLC digital inputs', () => {
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(project),page=report.sheets.find(sheet=>sheet.id==='ref-012').analysis;
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.openEndpointCount,page.unconnectedPinCount],[2,10,3,4,0]);
  const s2=project.objects.find(object=>object.sheetId==='ref-012'&&object.ref==='S2');
  const s3=project.objects.find(object=>object.sheetId==='ref-012'&&object.ref==='S3');
  assert.equal(s2.componentId,'schneider-electric-xb5aa31');
  assert.equal(s3.componentId,'schneider-electric-xb5aa42');
  assert.deepEqual(engine.component(s2.componentId).symbol.pins.map(pin=>pin.localNumber),['13','14']);
  assert.deepEqual(engine.component(s3.componentId).symbol.pins.map(pin=>pin.localNumber),['21','22']);
  assert.equal(engine.component(s2.componentId).electricalFunctions.pushButton.normalContactState,'open');
  assert.equal(engine.component(s3.componentId).electricalFunctions.pushButton.normalContactState,'closed');
  const globalFor=(ref,pinNumber)=>report.globalNets.find(net=>net.pins.some(pin=>pin.sheetId==='ref-012'&&pin.ref===ref&&pin.number===pinNumber));
  assert.deepEqual(globalFor('S2','14').pins.map(pin=>pin.sheetId+':'+pin.ref+':'+pin.number).sort(),['ref-007:A1:X10:8','ref-012:S2:14']);
  assert.deepEqual(globalFor('S3','22').pins.map(pin=>pin.sheetId+':'+pin.ref+':'+pin.number).sort(),['ref-007:A1:X10:9','ref-012:S3:22']);
  const controlSupply=report.globalNets.find(net=>net.pins.some(pin=>pin.sheetId==='ref-012'&&pin.ref==='S2'&&pin.number==='13'));
  assert.ok(controlSupply.pins.some(pin=>pin.sheetId==='ref-012'&&pin.ref==='S3'&&pin.number==='21'));
  assert.ok(controlSupply.pins.some(pin=>pin.sheetId==='ref-009'&&pin.ref==='X14'));
  assert.match(project.objects.find(object=>object.id==='doc-ref-012-limit').text,/PLC program.*safety function are not modeled/i);
  assert.deepEqual(engine.crossSheetConnectors(project,'ref-012').map(item=>[item.name,item.targetSheetNumber,item.targetRef]),[
    ['+24 V DC · operator inputs','A1/009','X14'],['S2 NO · PLC DI a.1','A1/007','A1'],['S3 NC · PLC DI a.2','A1/007','A1'],['+24 V DC · KM4 status input','A1/011','KM4']
  ]);
  const routed=project.objects.filter(object=>['ref-009','ref-012'].includes(object.sheetId)&&object.kind==='wire'&&object.id.includes('a1-012'));
  assert.ok(routed.every(wire=>wire.x1===wire.x2||wire.y1===wire.y2),'A1/012 routes must stay orthogonal');
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  assert.equal(engine.analyzeProject(reopened.project).globalNetCount,43);
});

test('A1/013 documents PLC I/O assignments without claiming logic or feedback interpretation', () => {
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project;
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-013').number,'A1/013');
  const text=project.objects.filter(object=>object.sheetId==='ref-013'&&object.kind==='text').map(object=>object.text);
  assert.ok(text.some(line=>/I0\.3.*X10:10.*KM4 NO auxiliary contact 13–14/.test(line)));
  assert.ok(text.some(line=>/Q0\.0.*DQ a\.0.*K2 coil A1/.test(line)));
  assert.ok(text.some(line=>/PLC program and contact feedback interpretation are not defined/.test(line)));
  assert.equal(project.objects.some(object=>object.sheetId==='ref-013'&&object.kind==='component'),false);
  const report=engine.analyzeProject(project);
  assert.equal(report.valid,true,report.errors.join(' '));
  const returned=engine.parseProject(engine.serializeProject(project));
  assert.equal(returned.valid,true,returned.errors.join(' '));
  assert.equal(engine.analyzeProject(returned.project).globalNetCount,43);
});

test('A1/014 wires source-backed KM4 NC auxiliary contact 21–22 to PLC DI a.4', () => {
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(project),page=report.sheets.find(sheet=>sheet.id==='ref-014').analysis;
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.openEndpointCount],[0,0,0,0]);
  const km4=project.objects.find(object=>object.sheetId==='ref-011'&&object.ref==='KM4');
  const cpu=project.objects.find(object=>object.sheetId==='ref-007'&&object.ref==='A1');
  assert.deepEqual(engine.worldPins(cpu).filter(pin=>pin.number==='X10:11').map(pin=>[pin.number,pin.name,pin.x,pin.y]),[['X10:11','DI a.4',670,454]]);
  assert.equal(engine.component(km4.componentId).electricalFunctions.contactor.auxiliaryContacts.find(contact=>contact.first==='aux-21').normalState,'closed');
  const contactNet=pin=>report.globalNets.find(net=>net.pins.some(item=>item.sheetId==='ref-011'&&item.ref==='KM4'&&item.number===pin));
  assert.ok(contactNet('21').pins.some(pin=>pin.sheetId==='ref-009'&&pin.ref==='X14'));
  assert.deepEqual(contactNet('22').pins.map(pin=>pin.sheetId+':'+pin.ref+':'+pin.number),['ref-007:A1:X10:11','ref-011:KM4:22']);
  assert.deepEqual(engine.crossSheetConnectors(project,'ref-007').filter(item=>item.name.includes('KM4 auxiliary NC')).map(item=>[item.name,item.targetSheetNumber,item.targetRef]),[['KM4 auxiliary NC 22 · PLC DI a.4','A1/011','KM4']]);
  assert.match(fs.readFileSync(path.join(__dirname,'docs','components','siemens-s7-1200-cpu-1212c.md'),'utf8'),/Table A-49.*X10:11.*DI a\.4/s);
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  assert.deepEqual([engine.analyzeProject(reopened.project).crossSheetConnectionCount,engine.analyzeProject(reopened.project).globalNetCount,engine.analyzeProject(reopened.project).openEndpointCount],[21,43,0]);
});

test('A1/015 routes the source-backed Phoenix Contact K2 NC output to PLC DI a.5', () => {
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(project);
  const page=report.sheets.find(sheet=>sheet.id==='ref-015').analysis;
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.openEndpointCount],[0,0,0,0]);
  const k2=project.objects.find(object=>object.sheetId==='ref-010'&&object.ref==='K2');
  const cpu=project.objects.find(object=>object.sheetId==='ref-007'&&object.ref==='A1');
  assert.deepEqual(engine.worldPins(cpu).filter(pin=>pin.number==='X10:12').map(pin=>[pin.number,pin.name,pin.x,pin.y]),[['X10:12','DI a.5',670,472]]);
  assert.deepEqual(engine.worldPins(k2).filter(pin=>pin.number==='12').map(pin=>[pin.number,pin.x,pin.y]),[['12',670,355]]);
  const net=report.globalNets.find(item=>item.pins.some(pin=>pin.sheetId==='ref-010'&&pin.ref==='K2'&&pin.number==='12'));
  assert.deepEqual(net.pins.map(pin=>pin.sheetId+':'+pin.ref+':'+pin.number),['ref-007:A1:X10:12','ref-010:K2:12']);
  assert.equal(engine.component(k2.componentId).electricalFunctions.changeoverContact.normallyClosed,'contact-12');
  assert.match(fs.readFileSync(path.join(__dirname,'docs','components','phoenix-contact-2966171.md'),'utf8'),/12 \| Contact \| Normally closed contact/);
  assert.ok(project.objects.some(object=>object.id==='doc-ref-015-input-05'&&/I0\.5.*X10:12.*K2 NC contact 11–12/.test(object.text)));
  assert.match(project.objects.find(object=>object.id==='doc-ref-015-limit').text,/relay state, PLC logic and diagnostic interpretation are not modeled/i);
  const routed=project.objects.filter(object=>object.kind==='wire'&&['ref-007','ref-010'].includes(object.sheetId)&&object.id.startsWith('a1-015'));
  assert.equal(routed.length,3);
  assert.ok(routed.every(wire=>wire.x1===wire.x2||wire.y1===wire.y2),'A1/015 routes must stay orthogonal');
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  assert.deepEqual([engine.analyzeProject(reopened.project).crossSheetConnectionCount,engine.analyzeProject(reopened.project).globalNetCount,engine.analyzeProject(reopened.project).openEndpointCount],[21,43,0]);
});

test('A1/016 documents K2 NO output 14 on PLC DI a.6 without simulating the relay state', () => {
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(project);
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-016').number,'A1/016');
  const page=report.sheets.find(sheet=>sheet.id==='ref-016').analysis;
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.openEndpointCount],[0,0,0,0]);
  const k2=project.objects.find(object=>object.sheetId==='ref-010'&&object.ref==='K2');
  const cpu=project.objects.find(object=>object.sheetId==='ref-007'&&object.ref==='A1');
  assert.equal(engine.component(k2.componentId).electricalFunctions.changeoverContact.normallyOpen,'contact-14');
  assert.deepEqual(engine.worldPins(cpu).filter(pin=>pin.number==='X10:13').map(pin=>[pin.number,pin.name,pin.x,pin.y]),[['X10:13','DI a.6',670,490]]);
  assert.deepEqual(engine.worldPins(k2).filter(pin=>pin.number==='14').map(pin=>[pin.number,pin.x,pin.y]),[['14',670,405]]);
  const net=report.globalNets.find(item=>item.pins.some(pin=>pin.sheetId==='ref-010'&&pin.ref==='K2'&&pin.number==='14'));
  assert.deepEqual(net.pins.map(pin=>pin.sheetId+':'+pin.ref+':'+pin.number),['ref-007:A1:X10:13','ref-010:K2:14','ref-011:KM4:A1']);
  assert.deepEqual(engine.crossSheetConnectors(project,'ref-010').filter(item=>item.name==='K2 NO output 14 · PLC DI a.6').map(item=>[item.name,item.targetSheetNumber,item.targetRef]),[['K2 NO output 14 · PLC DI a.6','A1/007','A1']]);
  assert.match(fs.readFileSync(path.join(__dirname,'docs','components','phoenix-contact-2966171.md'),'utf8'),/14 \| Contact \| Normally open contact/);
  assert.ok(project.objects.some(object=>object.id==='doc-ref-016-input-06'&&/I0\.6.*X10:13.*K2 NO output 14/.test(object.text)));
  assert.match(project.objects.find(object=>object.id==='doc-ref-016-limit').text,/relay switching, PLC logic and diagnostic interpretation are not modeled/i);
  const routed=project.objects.filter(object=>object.kind==='wire'&&['ref-007','ref-010'].includes(object.sheetId)&&object.id.startsWith('a1-016'));
  assert.equal(routed.length,4);
  assert.ok(routed.every(wire=>wire.x1===wire.x2||wire.y1===wire.y2),'A1/016 routes must stay orthogonal');
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  assert.deepEqual([engine.analyzeProject(reopened.project).sheetCount,engine.analyzeProject(reopened.project).crossSheetConnectionCount,engine.analyzeProject(reopened.project).globalNetCount,engine.analyzeProject(reopened.project).openEndpointCount],[64,21,43,0]);
});

test('A1/017 summarizes modeled PLC I/O allocations and the current I0.7 assignment', () => {
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(project);
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-017').number,'A1/017');
  const page=report.sheets.find(sheet=>sheet.id==='ref-017').analysis;
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.openEndpointCount],[0,0,0,0]);
  const texts=project.objects.filter(object=>object.sheetId==='ref-017'&&object.kind==='text').map(object=>object.text);
  for (const assignment of [
    /I0\.0.*X10:7.*B1:4/, /I0\.1.*X10:8.*S2 NO contact 13–14/,
    /I0\.2.*X10:9.*S3 NC contact 21–22/, /I0\.3.*X10:10.*KM4 NO auxiliary 13–14/,
    /I0\.4.*X10:11.*KM4 NC auxiliary 21–22/, /I0\.5.*X10:12.*K2 NC contact 11–12/,
    /I0\.6.*X10:13.*K2 NO contact 14 \/ KM4 coil A1 net/,
    /I0\.7.*X10:14.*F1 NO trip contact 97–98.*A1\/018/,
    /Q0\.0.*X12:2 \/ DQ a\.0.*K2 coil A1/
  ]) assert.ok(texts.some(text=>assignment.test(text)),`Missing allocation ${assignment}`);
  assert.match(texts.at(-1),/PLC address configuration, trip\/reset behavior and signal interpretation are not modeled/i);
  assert.ok(project.objects.some(object=>object.id==='doc-ref-002-line-17'&&/A1\/017.*PLC I\/O allocation summary.*I0\.7 overload trip.*F1:97–98/.test(object.text)));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  assert.deepEqual([engine.analyzeProject(reopened.project).sheetCount,engine.analyzeProject(reopened.project).componentCount,engine.analyzeProject(reopened.project).wireCount,engine.analyzeProject(reopened.project).crossSheetConnectionCount,engine.analyzeProject(reopened.project).globalNetCount,engine.analyzeProject(reopened.project).openEndpointCount],[64,32,335,21,43,0]);
});

test('A1/018 routes Siemens F1 NO trip contact 97–98 to CPU DI a.7 through the existing 24 V supply', () => {
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(project);
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-018').number,'A1/018');
  const page=report.sheets.find(sheet=>sheet.id==='ref-018').analysis;
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.openEndpointCount],[0,0,0,0]);
  const f1=project.objects.find(object=>object.sheetId==='ref-006'&&object.ref==='F1');
  const cpu=project.objects.find(object=>object.sheetId==='ref-007'&&object.ref==='A1');
  assert.deepEqual(engine.worldPins(f1).filter(pin=>['97','98'].includes(pin.number)).map(pin=>[pin.number,pin.x,pin.y]),[['97',970,415],['98',970,430]]);
  assert.deepEqual(engine.worldPins(cpu).filter(pin=>pin.number==='X10:14').map(pin=>[pin.number,pin.name,pin.x,pin.y]),[['X10:14','DI a.7',670,508]]);
  const tripSignal=report.globalNets.find(net=>net.pins.some(pin=>pin.sheetId==='ref-006'&&pin.ref==='F1'&&pin.number==='98'));
  assert.deepEqual(tripSignal.pins.map(pin=>pin.sheetId+':'+pin.ref+':'+pin.number),['ref-006:F1:98','ref-007:A1:X10:14']);
  const supply=report.globalNets.find(net=>net.pins.some(pin=>pin.sheetId==='ref-006'&&pin.ref==='F1'&&pin.number==='97'));
  assert.ok(supply.pins.some(pin=>pin.sheetId==='ref-009'&&pin.ref==='X14'&&pin.number==='1'));
  assert.ok(supply.pins.some(pin=>pin.sheetId==='ref-009'&&pin.ref==='X14'&&pin.number==='2'));
  const contactorControl=report.globalNets.find(net=>net.pins.some(pin=>pin.sheetId==='ref-006'&&pin.ref==='F1'&&pin.number==='96'));
  assert.ok(!contactorControl.pins.some(pin=>pin.sheetId==='ref-007'&&pin.ref==='A1'&&pin.number==='X10:14'));
  assert.deepEqual(project.crossSheetConnections.filter(connection=>connection.id.startsWith('a1-018-')).map(connection=>connection.id),['a1-018-f1-trip-supply','a1-018-f1-trip-input']);
  const routes=project.objects.filter(object=>object.kind==='wire'&&object.id.startsWith('a1-018-'));
  assert.equal(routes.length,5);
  assert.ok(routes.every(wire=>wire.x1===wire.x2||wire.y1===wire.y2),'A1/018 routes must stay orthogonal');
  const source=fs.readFileSync(path.join(__dirname,'docs','components','siemens-3ru2126-4ab0.md'),'utf8');
  assert.match(source,/97–98 as an NO auxiliary contact/);
  assert.match(source,/suitable for PLCs/);
  assert.ok(project.objects.some(object=>object.id==='doc-ref-017-input-07'&&/I0\.7.*F1 NO trip contact 97–98.*A1\/018/.test(object.text)));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  assert.deepEqual([engine.analyzeProject(reopened.project).sheetCount,engine.analyzeProject(reopened.project).componentCount,engine.analyzeProject(reopened.project).wireCount,engine.analyzeProject(reopened.project).crossSheetConnectionCount,engine.analyzeProject(reopened.project).globalNetCount,engine.analyzeProject(reopened.project).openEndpointCount],[64,32,335,21,43,0]);
});

test('A1/019 documents Siemens CPU 1212C digital-output allocation without changing topology', () => {
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(project);
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-019').number,'A1/019');
  const page=report.sheets.find(sheet=>sheet.id==='ref-019').analysis;
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.openEndpointCount],[0,0,0,0]);
  const texts=project.objects.filter(object=>object.sheetId==='ref-019'&&object.kind==='text').map(object=>object.text);
  for(const assignment of [
    /X12:1.*1L.*\+24 V DC.*A1\/009/,
    /Q0\.0.*X12:2 \/ DQ a\.0.*K2 coil A1.*A1\/007–A1\/010/,
    /Q0\.1.*X12:3 \/ DQ a\.1.*Unassigned in the modeled project scope/,
    /Q0\.2.*X12:4 \/ DQ a\.2.*Unassigned in the modeled project scope/,
    /Q0\.3.*X12:5 \/ DQ a\.3.*Unassigned in the modeled project scope/,
    /X12:6.*2L.*not a digital output channel/,
    /Q0\.4.*X12:7 \/ DQ a\.4.*Unassigned in the modeled project scope/,
    /Q0\.5.*X12:8 \/ DQ a\.5.*Unassigned in the modeled project scope/
  ]) assert.ok(texts.some(text=>assignment.test(text)),`Missing output allocation ${assignment}`);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','siemens-s7-1200-cpu-1212c.md'),'utf8');
  assert.match(source,/System Manual, V4\.7/);
  assert.match(source,/pins 2–5 to DQ a\.0–a\.3, pin 6 to 2L, and pins 7–8 to DQ a\.4–a\.5/);
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  assert.deepEqual([engine.analyzeProject(reopened.project).sheetCount,engine.analyzeProject(reopened.project).componentCount,engine.analyzeProject(reopened.project).wireCount,engine.analyzeProject(reopened.project).crossSheetConnectionCount,engine.analyzeProject(reopened.project).globalNetCount,engine.analyzeProject(reopened.project).openEndpointCount],[64,32,335,21,43,0]);
});

test('A1/020 documents CPU 1212C analog-input allocation without adding components or wiring', () => {
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(project);
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-020').number,'A1/020');
  const page=report.sheets.find(sheet=>sheet.id==='ref-020').analysis;
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.openEndpointCount],[0,0,0,0]);
  const texts=project.objects.filter(object=>object.sheetId==='ref-020'&&object.kind==='text').map(object=>object.text);
  for(const assignment of [
    /X11:1.*2M.*analog common.*not an analog input channel/,
    /AI0.*X11:2.*0–10 V DC.*connected to B2 OUT2 on A1\/022/,
    /AI1.*X11:3.*0–10 V DC.*Unassigned in the modeled project scope/
  ]) assert.ok(texts.some(text=>assignment.test(text)),`Missing analog-input allocation ${assignment}`);
  assert.ok(texts.some(text=>/No analog sensor or signal source is assigned/.test(text)));
  const source=fs.readFileSync(path.join(__dirname,'docs','components','siemens-s7-1200-cpu-1212c.md'),'utf8');
  assert.match(source,/System Manual, V4\.7/);
  assert.match(source,/X11:1 is 2M, X11:2 is AI0, and X11:3 is AI1/);
  assert.match(source,/two onboard 0–10 V DC analog inputs/);
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  assert.deepEqual([engine.analyzeProject(reopened.project).sheetCount,engine.analyzeProject(reopened.project).componentCount,engine.analyzeProject(reopened.project).wireCount,engine.analyzeProject(reopened.project).crossSheetConnectionCount,engine.analyzeProject(reopened.project).globalNetCount,engine.analyzeProject(reopened.project).openEndpointCount],[64,32,335,21,43,0]);
});




test('A1/021 records a source-backed pressure-sensor interface proposal without inventing wiring', () => {
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(project);
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-021').number,'A1/021');
  const page=report.sheets.find(sheet=>sheet.id==='ref-021').analysis;
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.openEndpointCount],[0,0,0,0]);
  const texts=project.objects.filter(object=>object.sheetId==='ref-021'&&object.kind==='text').map(object=>object.text);
  for(const required of [
    'PN-400-SER14-MFRKG/US/ /V',
    '0...400 bar · relative pressure',
    'Pin 1 · BN brown · L+',
    '18–30 V DC',
    'Pin 2 · WH white · OUT2',
    '0–10 V DC analog voltage output',
    'Pin 3 · BU blue · L−',
    'Pin 4 · BK black · OUT1 switching / IO-Link',
    'AI0 / X11:2 · 0–10 V DC; OUT2 connection and channel assignment are shown on A1/022',
    'factory default as 4–20 mA',
    'This proposal sheet adds no instance or wiring; B2 and its AI0 connection are modeled on A1/022'
  ]) assert.ok(texts.some(text=>text.includes(required)),`Missing pressure-sensor interface note: ${required}`);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('PN-400-SER14-MFRKG/US/ /V'));
  assert.ok(source.includes('OUT2 is factory configured for 4–20 mA'));
  assert.ok(source.includes('CPU 1212C')&&source.includes('0–10 V DC'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  assert.deepEqual([engine.analyzeProject(reopened.project).sheetCount,engine.analyzeProject(reopened.project).componentCount,engine.analyzeProject(reopened.project).wireCount,engine.analyzeProject(reopened.project).crossSheetConnectionCount,engine.analyzeProject(reopened.project).globalNetCount,engine.analyzeProject(reopened.project).openEndpointCount],[64,32,335,21,43,0]);
});

test('ifm PN2070 exposes its exact M12 pins, configurable analog outputs, provenance, and editable instance notes', () => {
  const sensor=engine.component('ifm-pn2070');
  assert.equal(sensor.manufacturerPartNumber,'PN-400-SER14-MFRKG/US/ /V');
  assert.deepEqual(sensor.symbol.pins.map(pin=>[pin.localNumber,pin.name]),[
    ['1','L+ · BN brown'],['2','OUT2 · WH white · analog output'],['3','L− · BU blue'],['4','OUT1 · BK black · switching / IO-Link']
  ]);
  assert.deepEqual(sensor.symbol.pins.map(pin=>[pin.x,pin.y]),[[-65,-25],[65,-25],[-65,25],[65,25]]);
  assert.equal(sensor.specifications.measuringRange.maximum,400);
  assert.equal(sensor.specifications.operatingVoltage.minimum,18);
  assert.equal(sensor.electricalFunctions.analogOutput.factoryConfiguration,'4–20 mA; verify actual device setting');
  assert.equal(sensor.electricalFunctions.analogOutput.outputPin,'pin-2-out2');
  assert.equal(sensor.electricalFunctions.analogOutput.digitalOutputPin,'pin-4-out1');
  assert.ok(sensor.sources.some(source=>source.url.includes('PN2070-02_EN-GB.pdf')));
  assert.ok(sensor.sources.some(source=>source.url.includes('/pressure/pn/programming')));
  const instance=engine.createInstance(sensor.id,240,320,'B2');
  assert.equal(instance.properties.processPoint,'');
  instance.properties.processPoint='Hydraulic manifold outlet';
  instance.properties.signalConfigurationNote='4–20 mA factory setting; verify before connection';
  assert.equal(engine.validateInstance(instance).valid,true);
  instance.properties.processPoint='x'.repeat(61);
  assert.equal(engine.validateInstance(instance).valid,false);
});

test('PN2070 has a dedicated analog pressure-sensor glyph and editable notes without changing the workspace shell', () => {
  const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
  assert.ok(html.includes("case'sensor-pressure-analog':"));
  assert.ok(html.includes("def.family==='sensor-pressure-analog'"));
  assert.ok(html.includes('data-component-property="processPoint"'));
  assert.ok(html.includes('data-component-property="signalConfigurationNote"'));
  assert.ok(html.includes('grid-template-columns:36px minmax(210px,250px) minmax(0,1fr) 36px'));
});



test('A1/022 connects ifm PN2070 B2 OUT2 to CPU AI0 with source-backed power and analog common', () => {
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(project),page=report.sheets.find(sheet=>sheet.id==='ref-022').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-022').number,'A1/022');
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.componentPinCount,page.connectedPinCount,page.unconnectedPinCount,page.geometryErrorCount],[1,5,3,4,3,1,0]);
  const connected=report.globalNets.filter(net=>net.pins.some(pin=>pin.sheetId==='ref-022'&&pin.ref==='B2'));
  const pinNet=(ref,number)=>connected.find(net=>net.pins.some(pin=>pin.sheetId==='ref-022'&&pin.ref===ref&&pin.number===number));
  assert.ok(pinNet('B2','1').pins.some(pin=>pin.sheetId==='ref-009'&&pin.ref==='X14'));
  assert.deepEqual(pinNet('B2','2').pins.filter(pin=>pin.sheetId==='ref-007'||pin.sheetId==='ref-022').map(pin=>pin.sheetId+':'+pin.ref+':'+pin.number).sort(),['ref-007:A1:X11:2','ref-022:B2:2']);
  assert.ok(pinNet('B2','3').pins.some(pin=>pin.sheetId==='ref-007'&&pin.ref==='A1'&&pin.number==='X11:1'));
  assert.ok(pinNet('B2','3').pins.some(pin=>pin.sheetId==='ref-009'&&pin.ref==='X15'));
  assert.ok(page.nets.every(net=>!net.pins.some(pin=>pin.number==='4')),'OUT1 remains intentionally unused.');
  const texts=project.objects.filter(object=>object.sheetId==='ref-022'&&object.kind==='text').map(object=>object.text);
  for(const requirement of [/factory default.*4–20 mA/i,/set voltage mode U.*verify ASP2\/AEP2/i,/No process point.*PLC logic.*modeled/i])
    assert.ok(texts.some(text=>requirement.test(text)),`Missing commissioning or modeling boundary ${requirement}`);
  assert.equal(report.openEndpointCount,0);
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  assert.deepEqual([engine.analyzeProject(reopened.project).sheetCount,engine.analyzeProject(reopened.project).componentCount,engine.analyzeProject(reopened.project).wireCount,engine.analyzeProject(reopened.project).crossSheetConnectionCount,engine.analyzeProject(reopened.project).globalNetCount,engine.analyzeProject(reopened.project).openEndpointCount],[64,32,335,21,43,0]);
});


test('A1/023 records conditional PN2070-to-CPU AI0 scaling without assigning device endpoints', () => {
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(project),page=report.sheets.find(sheet=>sheet.id==='ref-023').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-023').number,'A1/023');
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  const texts=project.objects.filter(object=>object.sheetId==='ref-023'&&object.kind==='text').map(object=>object.text);
  for(const required of ['0–10 V rated range','raw value 0–27648','ASP2 / AEP2','AI0raw / 27648','P = ASP2 + (AI0raw / 27648) × (AEP2 − ASP2)','10-bit resolution','no uncertainty budget','No active PLC block'])
    assert.ok(texts.some(text=>text.includes(required)),`Missing source-backed scaling boundary: ${required}`);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','siemens-s7-1200-cpu-1212c.md'),'utf8');
  assert.ok(source.includes('Table A-41')&&source.includes('0–27648'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  assert.deepEqual([engine.analyzeProject(reopened.project).sheetCount,engine.analyzeProject(reopened.project).componentCount,engine.analyzeProject(reopened.project).wireCount,engine.analyzeProject(reopened.project).crossSheetConnectionCount,engine.analyzeProject(reopened.project).globalNetCount,engine.analyzeProject(reopened.project).openEndpointCount],[64,32,335,21,43,0]);
});

test('A1/024 documents PN2070 B2 load allocation against the exact SITOP variant without claiming supply adequacy', () => {
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(project),page=report.sheets.find(sheet=>sheet.id==='ref-024').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-024').number,'A1/024');
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  const texts=project.objects.filter(object=>object.sheetId==='ref-024'&&object.kind==='text').map(object=>object.text);
  for(const required of ['<35 mA','<0.84 W','23.28–24.72 V','18–30 V DC','<1.4%','<4.67%','startup demand','supply adequacy'])
    assert.ok(texts.some(text=>text.includes(required)),`Missing load calculation or boundary: ${required}`);
  assert.equal((0.035/2.5*100).toFixed(2),'1.40');
  assert.equal((0.035/0.75*100).toFixed(2),'4.67');
  const ifm=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  const sitop=fs.readFileSync(path.join(__dirname,'docs','components','siemens-sitop-psu100c-6ep1332-5ba00.md'),'utf8');
  assert.ok(ifm.includes('current consumption')&&ifm.includes('18–30 V DC'));
  assert.ok(sitop.includes('0.75 A at +70 °C')&&sitop.includes('±3%'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  assert.deepEqual([engine.analyzeProject(reopened.project).sheetCount,engine.analyzeProject(reopened.project).componentCount,engine.analyzeProject(reopened.project).wireCount,engine.analyzeProject(reopened.project).crossSheetConnectionCount,engine.analyzeProject(reopened.project).globalNetCount,engine.analyzeProject(reopened.project).openEndpointCount],[64,32,335,21,43,0]);
});


test('A1/025 records a conditional partial PN2070 / CPU AI0 accuracy stack without claiming calibrated system accuracy', () => {
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(project),page=report.sheets.find(sheet=>sheet.id==='ref-025').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-025').number,'A1/025');
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  const texts=project.objects.filter(object=>object.sheetId==='ref-025'&&object.kind==='text').map(object=>object.text);
  for(const required of ['0–400 bar','ASP2 = 0 bar','AEP2 = 400 bar','<±0.5%','<±2 bar','3.0% FS','3.5% FS','<±14 bar','<±16 bar','not a complete uncertainty budget'])
    assert.ok(texts.some(text=>text.includes(required)),`Missing accuracy assumption or limit: ${required}`);
  assert.equal(((0.5+3.0)/100*400).toFixed(1),'14.0');
  assert.equal(((0.5+3.5)/100*400).toFixed(1),'16.0');
  const ifm=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  const cpu=fs.readFileSync(path.join(__dirname,'docs','components','siemens-s7-1200-cpu-1212c.md'),'utf8');
  assert.ok(ifm.includes('characteristic deviation')&&ifm.includes('0.5%'));
  assert.ok(cpu.includes('3.0% of full scale')&&cpu.includes('3.5% over −20…60 °C'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  assert.deepEqual([engine.analyzeProject(reopened.project).sheetCount,engine.analyzeProject(reopened.project).componentCount,engine.analyzeProject(reopened.project).wireCount,engine.analyzeProject(reopened.project).crossSheetConnectionCount,engine.analyzeProject(reopened.project).globalNetCount,engine.analyzeProject(reopened.project).openEndpointCount],[64,32,335,21,43,0]);
});


test('A1/026 documents idealized CPU 1212C AI0 quantization without claiming measured resolution', () => {
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(project),page=report.sheets.find(sheet=>sheet.id==='ref-026').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-026').number,'A1/026');
  assert.equal(project.status,'Authored opening set: A1/001–A1/064; A1/065–A1/100 not authored.');
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  for(const [id,required] of [['doc-ref-002-line-27','A1/028  CPU 1212C AI0 rated, overshoot and overflow ranges'],['doc-ref-002-line-28','A1/029  CPU 1212C AI0 cable length'],['doc-ref-002-line-29','A1/030  ifm PN2070 analog output'],['doc-ref-004-line-19','Revision 2.4 | 2026-11-13 | A1/028'],['doc-ref-004-line-20','Revision 2.5 | 2026-11-13 | A1/029'],['doc-ref-004-line-21','Revision 2.6 | 2026-11-13 | A1/030']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),`Incorrect drawing index or revision record: ${id}`);
  const texts=project.objects.filter(object=>object.sheetId==='ref-026'&&object.kind==='text').map(object=>object.text);
  for(const required of ['0–400 bar','0–10 V','10-bit','9.765625 mV','0.390625 bar','±0.1953125 bar','not a Siemens accuracy specification','0–27648','does not imply 15-bit','effective resolution','±14 bar'])
    assert.ok(texts.some(text=>text.includes(required)),`Missing resolution assumption or limitation: ${required}`);
  assert.equal((10/2**10*1000).toFixed(6),'9.765625');
  assert.equal((400/2**10).toFixed(6),'0.390625');
  assert.equal((400/2**11).toFixed(7),'0.1953125');
  const cpu=fs.readFileSync(path.join(__dirname,'docs','components','siemens-s7-1200-cpu-1212c.md'),'utf8');
  const guide=fs.readFileSync(path.join(__dirname,'examples','real-projects','README.md'),'utf8');
  assert.ok(cpu.includes('10-bit resolution')&&cpu.includes('0.390625 bar')&&cpu.includes('not a Siemens accuracy specification'));
  assert.ok(guide.includes('A1/026')&&guide.includes('idealized CPU 1212C 10-bit analog quantization'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  assert.deepEqual([engine.analyzeProject(reopened.project).sheetCount,engine.analyzeProject(reopened.project).componentCount,engine.analyzeProject(reopened.project).wireCount,engine.analyzeProject(reopened.project).crossSheetConnectionCount,engine.analyzeProject(reopened.project).globalNetCount,engine.analyzeProject(reopened.project).openEndpointCount],[64,32,335,21,43,0]);
});


test('A1/027 records CPU 1212C AI input response without assigning smoothing or claiming system response', () => {
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(project),page=report.sheets.find(sheet=>sheet.id==='ref-027').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-027').number,'A1/027');
  assert.equal(project.status,'Authored opening set: A1/001–A1/064; A1/065–A1/100 not authored.');
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  const texts=project.objects.filter(object=>object.sheetId==='ref-027'&&object.kind==='text').map(object=>object.text);
  for(const required of ['4.17 ms','5 ms','25 ms','95%','None (1 cycle; no averaging)','50 ms at 60 Hz','Weak smoothing (4 samples)','200 ms at 10 Hz','Medium smoothing (16 samples)','1,150 ms','Strong smoothing (32 samples)','2,300 ms','not established','remain unassigned','Tables A-42/A-43'])
    assert.ok(texts.some(text=>text.includes(required)),`Missing CPU response data or boundary: ${required}`);
  const cpu=fs.readFileSync(path.join(__dirname,'docs','components','siemens-s7-1200-cpu-1212c.md'),'utf8');
  const guide=fs.readFileSync(path.join(__dirname,'examples','real-projects','README.md'),'utf8');
  assert.ok(cpu.includes('Table A-42')&&cpu.includes('2,300 ms')&&cpu.includes('not end-to-end sensor-to-PLC response'));
  assert.ok(guide.includes('A1/027')&&guide.includes('95% step response'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  assert.deepEqual([engine.analyzeProject(reopened.project).sheetCount,engine.analyzeProject(reopened.project).componentCount,engine.analyzeProject(reopened.project).wireCount,engine.analyzeProject(reopened.project).crossSheetConnectionCount,engine.analyzeProject(reopened.project).globalNetCount,engine.analyzeProject(reopened.project).openEndpointCount],[64,32,335,21,43,0]);
});

test('A1/028 documents CPU 1212C rated, overshoot and overflow codes without assigning diagnostics', () => {
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(project),page=report.sheets.find(sheet=>sheet.id==='ref-028').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-028').number,'A1/028');
  assert.equal(project.status,'Authored opening set: A1/001–A1/064; A1/065–A1/100 not authored.');
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  const texts=project.objects.filter(object=>object.sheetId==='ref-028'&&object.kind==='text').map(object=>object.text);
  for(const required of ['0–10 V','0–27648','10.001–11.759 V','27649–32511','11.760–11.852 V','32512–32767','27648 / 6C00','32511 / 7EFF','32512 / 7F00','32767 / 7FFF','35 V DC','Negative input values are not supported','does not assign overshoot or overflow values to sensor faults or alarms','No channel diagnostic','Tables A-41/A-44'])
    assert.ok(texts.some(text=>text.includes(required)),`Missing CPU range data or boundary: ${required}`);
  const cpu=fs.readFileSync(path.join(__dirname,'docs','components','siemens-s7-1200-cpu-1212c.md'),'utf8');
  const guide=fs.readFileSync(path.join(__dirname,'examples','real-projects','README.md'),'utf8');
  assert.ok(cpu.includes('Table A-44')&&cpu.includes('27649–32511')&&cpu.includes('do not assign sensor faults'));
  assert.ok(guide.includes('A1/028')&&guide.includes('rated, overshoot and overflow'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  assert.deepEqual([engine.analyzeProject(reopened.project).sheetCount,engine.analyzeProject(reopened.project).componentCount,engine.analyzeProject(reopened.project).wireCount,engine.analyzeProject(reopened.project).crossSheetConnectionCount,engine.analyzeProject(reopened.project).globalNetCount,engine.analyzeProject(reopened.project).openEndpointCount],[64,32,335,21,43,0]);
});


test('A1/029 records CPU 1212C analog cable limit without assigning an installed cable', () => {
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(project),page=report.sheets.find(sheet=>sheet.id==='ref-029').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-029').number,'A1/029');
  assert.equal(project.status,'Authored opening set: A1/001–A1/064; A1/065–A1/100 not authored.');
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  const texts=project.objects.filter(object=>object.sheetId==='ref-029'&&object.kind==='text').map(object=>object.text);
  for(const required of ['100 m','shielded twisted pair','assigns no cable length','No installed route','does not verify installation compliance','Table A-41'])
    assert.ok(texts.some(text=>text.includes(required)),`Missing cable limit or scope boundary: ${required}`);
  const cpu=fs.readFileSync(path.join(__dirname,'docs','components','siemens-s7-1200-cpu-1212c.md'),'utf8');
  const guide=fs.readFileSync(path.join(__dirname,'examples','real-projects','README.md'),'utf8');
  assert.ok(cpu.includes('maximum cable length of 100 m using shielded twisted pair'));
  assert.ok(guide.includes('A1/029')&&guide.includes('without assigning installed cable details'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  assert.deepEqual([engine.analyzeProject(reopened.project).sheetCount,engine.analyzeProject(reopened.project).componentCount,engine.analyzeProject(reopened.project).wireCount,engine.analyzeProject(reopened.project).crossSheetConnectionCount,engine.analyzeProject(reopened.project).globalNetCount,engine.analyzeProject(reopened.project).openEndpointCount],[64,32,335,21,43,0]);
});


test('A1/030 records PN2070 output parameter ranges without assigning configured endpoints', () => {
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(project),page=report.sheets.find(sheet=>sheet.id==='ref-030').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-030').number,'A1/030');
  assert.equal(project.revision,'Opening set 6.1');
  assert.equal(project.status,'Authored opening set: A1/001–A1/064; A1/065–A1/100 not authored.');
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  const texts=project.objects.filter(object=>object.sheetId==='ref-030'&&object.kind==='text').map(object=>object.text);
  for(const required of ['0–10 V','1:5','2,000 Ω','0–320 bar','80–400 bar','manufacturer-listed parameter ranges','assigns no ASP2/AEP2','ifm PN2070-02'])
    assert.ok(texts.some(text=>text.includes(required)),`Missing PN2070 parameter range or scope boundary: ${required}`);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('analog start point 0–320 bar and analog end point 80–400 bar'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  assert.deepEqual([engine.analyzeProject(reopened.project).sheetCount,engine.analyzeProject(reopened.project).componentCount,engine.analyzeProject(reopened.project).wireCount,engine.analyzeProject(reopened.project).crossSheetConnectionCount,engine.analyzeProject(reopened.project).globalNetCount,engine.analyzeProject(reopened.project).openEndpointCount],[64,32,335,21,43,0]);
});


test('A1/031 PN2070 pressure limits remain manufacturer ratings rather than selected operating conditions',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(project),page=report.sheets.find(sheet=>sheet.id==='ref-031').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-031').number,'A1/031');
  assert.equal(project.revision,'Opening set 6.1');
  assert.equal(project.status,'Authored opening set: A1/001–A1/064; A1/065–A1/100 not authored.');
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  for(const [id,required] of [['doc-ref-002-line-30','A1/031  ifm PN2070 pressure rating'],['doc-ref-004-line-22','Revision 2.7 | 2026-11-13 | A1/031']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/031 index or revision record: '+id);
  const texts=project.objects.filter(object=>object.sheetId==='ref-031'&&object.kind==='text').map(object=>object.text);
  for(const required of ['0–400 bar','800 bar','1,700 bar','manufacturer limits','not a selected operating pressure','ifm PN2070-02'])
    assert.ok(texts.some(text=>text.includes(required)),'Missing pressure rating or scope boundary: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('800 bar pressure rating and a minimum burst pressure of 1,700 bar'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[64,32,335,21,43,0]);
});


test('A1/032 records the PN2070 medium temperature range without assigning process conditions',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(project),page=report.sheets.find(sheet=>sheet.id==='ref-032').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-032').number,'A1/032');
  assert.equal(project.revision,'Opening set 6.1');
  assert.equal(project.status,'Authored opening set: A1/001–A1/064; A1/065–A1/100 not authored.');
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  for(const [id,required] of [['doc-ref-002-line-31','A1/032  ifm PN2070 medium temperature'],['doc-ref-004-line-23','Revision 2.8 | 2026-11-13 | A1/032']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/032 index or revision record: '+id);
  const texts=project.objects.filter(object=>object.sheetId==='ref-032'&&object.kind==='text').map(object=>object.text);
  for(const required of ['liquids and gases','−25 to 80 °C','medium temperature specification','not an ambient-temperature rating','ifm PN2070-02'])
    assert.ok(texts.some(text=>text.includes(required)),'Missing medium-temperature fact or scope boundary: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('medium temperature range of −25 to 80 °C'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[64,32,335,21,43,0]);
});

 
test('A1/033 records PN2070 electrical ratings without claiming supply adequacy',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(project),page=report.sheets.find(sheet=>sheet.id==='ref-033').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-033').number,'A1/033');
  assert.equal(project.revision,'Opening set 6.1');
  assert.equal(project.status,'Authored opening set: A1/001–A1/064; A1/065–A1/100 not authored.');
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  for(const [id,required] of [['doc-ref-002-line-32','A1/033  ifm PN2070 electrical supply data'],['doc-ref-004-line-24','Revision 3.0 | 2026-11-13 | A1/033']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/033 index or revision record: '+id);
  const texts=project.objects.filter(object=>object.sheetId==='ref-033'&&object.kind==='text').map(object=>object.text);
  for(const required of ['18–30 V DC','SELV/PELV','<35 mA','manufacturer ratings','does not verify the installed supply','No total project load current or PSU headroom','ifm PN2070-02'])
    assert.ok(texts.some(text=>text.includes(required)),'Missing PN2070 electrical rating or scope boundary: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('operating voltage of 18–30 V DC (to SELV/PELV) and current consumption below 35 mA'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[64,32,335,21,43,0]);
});


test('A1/034 records the PN2070 power-on delay without assigning system response',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(project),page=report.sheets.find(sheet=>sheet.id==='ref-034').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-034').number,'A1/034');
  assert.equal(project.revision,'Opening set 6.1');
  assert.equal(project.status,'Authored opening set: A1/001–A1/064; A1/065–A1/100 not authored.');
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  for(const [id,required] of [['doc-ref-002-line-33','A1/034  ifm PN2070 power-on delay time'],['doc-ref-004-line-25','Revision 3.1 | 2026-11-13 | A1/034']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/034 index or revision record: '+id);
  const texts=project.objects.filter(object=>object.sheetId==='ref-034'&&object.kind==='text').map(object=>object.text);
  for(const required of ['0.3 s','power-on delay specification','does not describe total PLC or machine response time','No startup sequence','ifm PN2070-02'])
    assert.ok(texts.some(text=>text.includes(required)),'Missing PN2070 delay fact or scope boundary: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('power-on delay time of 0.3 s'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[64,32,335,21,43,0]);
});


test('A1/035 records PN2070 electrical protection characteristics without making installation claims',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(project),page=report.sheets.find(sheet=>sheet.id==='ref-035').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-035').number,'A1/035');
  assert.equal(project.revision,'Opening set 6.1');
  assert.equal(project.status,'Authored opening set: A1/001–A1/064; A1/065–A1/100 not authored.');
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  for(const [id,required] of [['doc-ref-002-line-34','A1/035  ifm PN2070 electrical protection characteristics'],['doc-ref-004-line-26','Revision 3.2 | 2026-11-13 | A1/035']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/035 index or revision record: '+id);
  const texts=project.objects.filter(object=>object.sheetId==='ref-035'&&object.kind==='text').map(object=>object.text);
  for(const required of ['protection class III','reverse-polarity protection: yes','manufacturer product specifications','do not certify project installation or safety performance','No wiring fault','ifm PN2070-02'])
    assert.ok(texts.some(text=>text.includes(required)),'Missing PN2070 protection fact or scope boundary: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('protection class III and reverse-polarity protection as “yes”'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[64,32,335,21,43,0]);
});


test('A1/036 records PN2070 minimum insulation resistance without implying a project test',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(project),page=report.sheets.find(sheet=>sheet.id==='ref-036').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-036').number,'A1/036');
  assert.equal(project.revision,'Opening set 6.1');
  assert.equal(project.status,'Authored opening set: A1/001–A1/064; A1/065–A1/100 not authored.');
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  for(const [id,required] of [['doc-ref-002-line-35','A1/036  ifm PN2070 minimum insulation resistance'],['doc-ref-004-line-27','Revision 3.3 | 2026-11-13 | A1/036']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/036 index or revision record: '+id);
  const texts=project.objects.filter(object=>object.sheetId==='ref-036'&&object.kind==='text').map(object=>object.text);
  for(const required of ['100 MΩ','500 V DC','no project insulation measurement','not an instruction to test installed wiring','No installation test','ifm PN2070-02'])
    assert.ok(texts.some(text=>text.includes(required)),'Missing insulation-resistance fact or scope boundary: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('minimum insulation resistance as 100 MΩ with “500 V DC”'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[64,32,335,21,43,0]);
});


test('A1/037 records PN2070 switching-output specifications without assigning a load',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(project),page=report.sheets.find(sheet=>sheet.id==='ref-037').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-037').number,'A1/037');
  assert.equal(project.revision,'Opening set 6.1');
  assert.equal(project.status,'Authored opening set: A1/001–A1/064; A1/065–A1/100 not authored.');
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  for(const [id,required] of [['doc-ref-002-line-36','A1/037  ifm PN2070 switching-output ratings'],['doc-ref-004-line-28','Revision 3.4 | 2026-11-13 | A1/037']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/037 index or revision record: '+id);
  const texts=project.objects.filter(object=>object.sheetId==='ref-037'&&object.kind==='text').map(object=>object.text);
  for(const required of ['250 mA','2 V maximum voltage drop','<500 Hz','short-circuit protection (pulsed)','overload protection: yes','assigns no switching-output channel','not a load-suitability','ifm PN2070-02'])
    assert.ok(texts.some(text=>text.includes(required)),'Missing switching-output fact or scope boundary: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('permanent switching-output current rating of 250 mA'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[64,32,335,21,43,0]);
});


test('A1/038 records PN2070 CMPT 2 switching-point ranges without configuring thresholds',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(project),page=report.sheets.find(sheet=>sheet.id==='ref-038').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-038').number,'A1/038');
  assert.equal(project.revision,'Opening set 6.1');
  assert.equal(project.status,'Authored opening set: A1/001–A1/064; A1/065–A1/100 not authored.');
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  for(const [id,required] of [['doc-ref-002-line-37','A1/038  ifm PN2070 switching-point ranges · CMPT 2'],['doc-ref-004-line-29','Revision 3.5 | 2026-11-13 | A1/038']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/038 index or revision record: '+id);
  const texts=project.objects.filter(object=>object.sheetId==='ref-038'&&object.kind==='text').map(object=>object.text);
  for(const required of ['Factory setting / CMPT = 2','2.5–400 bar','1–398.5 bar','2 bar','setting step: 0.5 bar','no threshold','CMPT mode is configured','does not establish operating limits','ifm PN2070-02'])
    assert.ok(texts.some(text=>text.includes(required)),'Missing CMPT=2 range or scope boundary: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('SP from 2.5 to 400 bar, rP from 1 to 398.5 bar'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[64,32,335,21,43,0]);
});


test('A1/039 records PN2070 CMPT 3 switching-point ranges without configuring thresholds',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(project),page=report.sheets.find(sheet=>sheet.id==='ref-039').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-039').number,'A1/039');
  assert.equal(project.revision,'Opening set 6.1');
  assert.equal(project.status,'Authored opening set: A1/001–A1/064; A1/065–A1/100 not authored.');
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  for(const [id,required] of [['doc-ref-002-line-38','A1/039  ifm PN2070 switching-point ranges · CMPT 3'],['doc-ref-004-line-30','Revision 3.6 | 2026-11-13 | A1/039']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/039 index or revision record: '+id);
  const texts=project.objects.filter(object=>object.sheetId==='ref-039'&&object.kind==='text').map(object=>object.text);
  for(const required of ['Status_B High Resolution / CMPT = 3','2.5–400 bar','0.9–398.4 bar','1.7 bar','setting step: 0.1 bar','no threshold','CMPT mode is configured','does not establish operating limits','ifm PN2070-02'])
    assert.ok(texts.some(text=>text.includes(required)),'Missing CMPT=3 range or scope boundary: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('SP from 2.5 to 400 bar, rP from 0.9 to 398.4 bar'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[64,32,335,21,43,0]);
});


test('A1/040 records the PN2070 manufacturer tightening-torque recommendation without selecting an installation value',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(project),page=report.sheets.find(sheet=>sheet.id==='ref-040').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-040').number,'A1/040');
  assert.equal(project.revision,'Opening set 6.1');
  assert.equal(project.status,'Authored opening set: A1/001–A1/064; A1/065–A1/100 not authored.');
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  for(const [id,required] of [['doc-ref-002-line-39','A1/040  ifm PN2070 recommended tightening torque'],['doc-ref-004-line-31','Revision 3.7 | 2026-11-13 | A1/040']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/040 index or revision record: '+id);
  const texts=project.objects.filter(object=>object.sheetId==='ref-040'&&object.kind==='text').map(object=>object.text);
  for(const required of ['G 1/4 internal thread','25–35 N·m','lubrication','the seal','pressure load','does not specify the installed seal','does not select an installation torque','ifm PN2070-02'])
    assert.ok(texts.some(text=>text.includes(required)),'Missing torque fact or scope boundary: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('recommended tightening torque of 25 to 35 N·m'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[64,32,335,21,43,0]);
});


test('A1/041 records PN2070 ambient and storage temperature ratings without assigning site conditions',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(project),page=report.sheets.find(sheet=>sheet.id==='ref-041').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-041').number,'A1/041');
  assert.equal(project.revision,'Opening set 6.1');
  assert.equal(project.status,'Authored opening set: A1/001–A1/064; A1/065–A1/100 not authored.');
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  for(const [id,required] of [['doc-ref-002-line-40','A1/041  ifm PN2070 ambient and storage temperatures'],['doc-ref-004-line-32','Revision 3.8 | 2026-11-13 | A1/041']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/041 index or revision record: '+id);
  const texts=project.objects.filter(object=>object.sheetId==='ref-041'&&object.kind==='text').map(object=>object.text);
  for(const required of ['−25 to 80 °C','−40 to 100 °C','ambient or storage conditions','does not assess site suitability','ifm PN2070-02'])
    assert.ok(texts.some(text=>text.includes(required)),'Missing temperature rating or scope boundary: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('ambient temperature of −25 to 80 °C and a storage temperature of −40 to 100 °C'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[64,32,335,21,43,0]);
});


test('A1/042 records the PN2070 minimum pressure-cycle datum without claiming project life',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(project),page=report.sheets.find(sheet=>sheet.id==='ref-042').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-042').number,'A1/042');
  assert.equal(project.revision,'Opening set 6.1');
  assert.equal(project.status,'Authored opening set: A1/001–A1/064; A1/065–A1/100 not authored.');
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  for(const [id,required] of [['doc-ref-002-line-41','A1/042  ifm PN2070 minimum pressure cycles'],['doc-ref-004-line-33','Revision 3.9 | 2026-11-13 | A1/042']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/042 index or revision record: '+id);
  const texts=project.objects.filter(object=>object.sheetId==='ref-042'&&object.kind==='text').map(object=>object.text);
  for(const required of ['minimum of 100 million pressure cycles','does not define a pressure-cycle profile','does not establish project service life','ifm PN2070-02'])
    assert.ok(texts.some(text=>text.includes(required)),'Missing pressure-cycle datum or scope boundary: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('minimum pressure cycles as 100 million'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[64,32,335,21,43,0]);
});


test('A1/043 records PN2070 product dimensions and weight without assigning installation geometry',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(project),page=report.sheets.find(sheet=>sheet.id==='ref-043').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-043').number,'A1/043');
  assert.equal(project.revision,'Opening set 6.1');
  assert.equal(project.status,'Authored opening set: A1/001–A1/064; A1/065–A1/100 not authored.');
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  for(const [id,required] of [['doc-ref-002-line-42','A1/043  ifm PN2070 dimensions and weight'],['doc-ref-004-line-34','Revision 4.0 | 2026-11-13 | A1/043']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/043 index or revision record: '+id);
  const texts=project.objects.filter(object=>object.sheetId==='ref-043'&&object.kind==='text').map(object=>object.text);
  for(const required of ['Ø 34 mm × L 90.7 mm','238.5 g','do not define a scaled drawing','total assembly mass','ifm PN2070-02'])
    assert.ok(texts.some(text=>text.includes(required)),'Missing mechanical datum or scope boundary: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('dimensions as Ø 34 mm / L 90.7 mm and weight as 238.5 g'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[64,32,335,21,43,0]);
});


test('A1/044 records the PN2070 restrictor product datum without assigning a retrofit',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(project),page=report.sheets.find(sheet=>sheet.id==='ref-044').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-044').number,'A1/044');
  assert.equal(project.revision,'Opening set 6.1');
  assert.equal(project.status,'Authored opening set: A1/001–A1/064; A1/065–A1/100 not authored.');
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  for(const [id,required] of [['doc-ref-002-line-43','A1/044  ifm PN2070 integrated restrictor datum'],['doc-ref-004-line-35','Revision 4.1 | 2026-11-13 | A1/044']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/044 index or revision record: '+id);
  const texts=project.objects.filter(object=>object.sheetId==='ref-044'&&object.kind==='text').map(object=>object.text);
  for(const required of ['no integrated restrictor element','can be retrofitted','no restrictor installation or retrofit','does not assess retrofit suitability','ifm PN2070-02'])
    assert.ok(texts.some(text=>text.includes(required)),'Missing restrictor datum or scope boundary: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('no integrated restrictor element and states that one can be retrofitted'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[64,32,335,21,43,0]);
});


test('A1/045 records PN2070 manufacturer IP ratings without claiming assembly protection',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(project),page=report.sheets.find(sheet=>sheet.id==='ref-045').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-045').number,'A1/045');
  assert.equal(project.revision,'Opening set 6.1');
  assert.equal(project.status,'Authored opening set: A1/001–A1/064; A1/065–A1/100 not authored.');
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  for(const [id,required] of [['doc-ref-002-line-44','A1/045  ifm PN2070 listed protection ratings'],['doc-ref-004-line-36','Revision 4.2 | 2026-11-13 | A1/045']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/045 index or revision record: '+id);
  const texts=project.objects.filter(object=>object.sheetId==='ref-045'&&object.kind==='text').map(object=>object.text);
  for(const required of ['protection ratings IP 65 and IP 67','does not verify the installed connector','No ingress-protection rating is claimed','ifm PN2070-02'])
    assert.ok(texts.some(text=>text.includes(required)),'Missing IP product datum or scope boundary: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('lists protection ratings IP 65 and IP 67'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[64,32,335,21,43,0]);
});


test('A1/046 records PN2070 shock and vibration data without claiming application qualification',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(project),page=report.sheets.find(sheet=>sheet.id==='ref-046').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-046').number,'A1/046');
  assert.equal(project.revision,'Opening set 6.1');
  assert.equal(project.status,'Authored opening set: A1/001–A1/064; A1/065–A1/100 not authored.');
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  for(const [id,required] of [['doc-ref-002-line-45','A1/046  ifm PN2070 shock and vibration data'],['doc-ref-004-line-37','Revision 4.3 | 2026-11-13 | A1/046']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/046 index or revision record: '+id);
  const texts=project.objects.filter(object=>object.sheetId==='ref-046'&&object.kind==='text').map(object=>object.text);
  for(const required of ['DIN EN 60068-2-27, 50 g (11 ms)','DIN EN 60068-2-6, 20 g (10–2000 Hz)','does not assess installed machine vibration or shock','No mounting condition','ifm PN2070-02'])
    assert.ok(texts.some(text=>text.includes(required)),'Missing test data or scope boundary: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('shock resistance DIN EN 60068-2-27 at 50 g (11 ms)'));
  assert.ok(source.includes('vibration resistance DIN EN 60068-2-6 at 20 g (10 to 2000 Hz)'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[64,32,335,21,43,0]);
});


test('A1/047 records PN2070 wetted-parts material without assigning chemical compatibility',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(project),page=report.sheets.find(sheet=>sheet.id==='ref-047').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-047').number,'A1/047');
  assert.equal(project.revision,'Opening set 6.1');
  assert.equal(project.status,'Authored opening set: A1/001–A1/064; A1/065–A1/100 not authored.');
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  for(const [id,required] of [['doc-ref-002-line-46','A1/047  ifm PN2070 wetted-parts material'],['doc-ref-004-line-38','Revision 4.4 | 2026-11-13 | A1/047']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/047 index or revision record: '+id);
  const texts=project.objects.filter(object=>object.sheetId==='ref-047'&&object.kind==='text').map(object=>object.text);
  for(const required of ['stainless steel (630 / 1.4542 / 17-4 PH)','no process medium or chemical exposure','does not establish chemical compatibility','ifm PN2070-02'])
    assert.ok(texts.some(text=>text.includes(required)),'Missing wetted-material datum or scope boundary: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('wetted-parts material as stainless steel (630 / 1.4542 / 17-4 PH)'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[64,32,335,21,43,0]);
});


test('A1/048 records PN2070 listed materials without assigning part locations or compatibility',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(project),page=report.sheets.find(sheet=>sheet.id==='ref-048').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-048').number,'A1/048');
  assert.equal(project.revision,'Opening set 6.1');
  assert.equal(project.status,'Authored opening set: A1/001–A1/064; A1/065–A1/100 not authored.');
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  for(const [id,required] of [['doc-ref-002-line-47','A1/048  ifm PN2070 listed materials'],['doc-ref-004-line-39','Revision 4.5 | 2026-11-13 | A1/048']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/048 index or revision record: '+id);
  const texts=project.objects.filter(object=>object.sheetId==='ref-048'&&object.kind==='text').map(object=>object.text);
  for(const required of ['Stainless steel (630 / 1.4542 / 17-4 PH)','stainless steel (316L / 1.4404)','PBT+PC-GF30, PBT-GF20 and PC','does not map every material to a specific sensor part','does not establish material locations','ifm PN2070-02'])
    assert.ok(texts.some(text=>text.includes(required)),'Missing materials datum or scope boundary: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('lists materials as stainless steel (630 / 1.4542 / 17-4 PH), stainless steel (316L / 1.4404), PBT+PC-GF30, PBT-GF20 and PC'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[64,32,335,21,43,0]);
});



test('A1/049 records PN2070 M12 connector details without selecting cable hardware',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(parsed.project),page=report.sheets.find(sheet=>sheet.id==='ref-049').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  assert.equal(project.revision,'Opening set 6.1');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-049').number,'A1/049');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-049').name,'ifm PN2070 M12 connector details');
  assert.equal(project.status,'Authored opening set: A1/001–A1/064; A1/065–A1/100 not authored.');
  for(const [id,required] of [['doc-ref-002-line-48','A1/049  ifm PN2070 M12 connector details'],['doc-ref-004-line-40','Revision 4.6 | 2026-11-13 | A1/049']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/049 index or revision record: '+id);
  for(const required of ['1 × M12 connector','A-coded','4 gold-plated contacts','pin functions are documented separately on A1/021','No cable or mating connector is selected','physical fit','ifm PN2070-02'])
    assert.ok(project.objects.some(object=>object.sheetId==='ref-049'&&object.text.includes(required)),'Missing connector fact or scope: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('one M12 connector, A-coded, with four gold-plated contacts'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[64,32,335,21,43,0]);
});


test('A1/050 records PN2070 display indicators without inferring their behavior',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(parsed.project),page=report.sheets.find(sheet=>sheet.id==='ref-050').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  assert.equal(project.revision,'Opening set 6.1');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-050').number,'A1/050');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-050').name,'ifm PN2070 display indicators');
  assert.equal(project.status,'Authored opening set: A1/001–A1/064; A1/065–A1/100 not authored.');
  for(const [id,required] of [['doc-ref-002-line-49','A1/050  ifm PN2070 display indicators'],['doc-ref-004-line-41','Revision 4.7 | 2026-11-13 | A1/050']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/050 index or revision record: '+id);
  for(const required of ['3 green LEDs','bar, psi and MPa','2 yellow LEDs','alphanumeric, red/green, 4-digit display','do not assign display-unit selection','the meaning of an indicator state','ifm PN2070-02'])
    assert.ok(project.objects.some(object=>object.sheetId==='ref-050'&&object.text.includes(required)),'Missing display datum or scope: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('three green LEDs for display units bar, psi and MPa'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[64,32,335,21,43,0]);
});


test('A1/051 records the PN2070 process connection designation without selecting mating hardware',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(parsed.project),page=report.sheets.find(sheet=>sheet.id==='ref-051').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  assert.equal(project.revision,'Opening set 6.1');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-051').number,'A1/051');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-051').name,'ifm PN2070 process connection designation');
  assert.equal(project.status,'Authored opening set: A1/001–A1/064; A1/065–A1/100 not authored.');
  for(const [id,required] of [['doc-ref-002-line-50','A1/051  ifm PN2070 process connection designation'],['doc-ref-004-line-42','Revision 4.8 | 2026-11-13 | A1/051']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/051 index or revision record: '+id);
  for(const required of ['G 1/4 internal thread','DIN EN ISO 1179-2','No mating fitting or seal is selected','does not establish mechanical compatibility or installation suitability','ifm PN2070-02'])
    assert.ok(project.objects.some(object=>object.sheetId==='ref-051'&&object.text.includes(required)),'Missing process-connection datum or limit: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('G 1/4 internal thread, listed as DIN EN ISO 1179-2'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[64,32,335,21,43,0]);
});


test('A1/052 records PN2070 upper-housing rotation without assigning installation geometry',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(parsed.project),page=report.sheets.find(sheet=>sheet.id==='ref-052').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  assert.equal(project.revision,'Opening set 6.1');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-052').number,'A1/052');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-052').name,'ifm PN2070 upper-housing rotation');
  assert.equal(project.status,'Authored opening set: A1/001–A1/064; A1/065–A1/100 not authored.');
  for(const [id,required] of [['doc-ref-002-line-51','A1/052  ifm PN2070 upper-housing rotation'],['doc-ref-004-line-43','Revision 4.9 | 2026-11-13 | A1/052']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/052 index or revision record: '+id);
  for(const required of ['upper housing portion rotation: up to 345°','does not specify the installed rotation angle','mounting clearance or installation suitability','ifm PN2070-02'])
    assert.ok(project.objects.some(object=>object.sheetId==='ref-052'&&object.text.includes(required)),'Missing rotation datum or limit: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('upper housing portion can be rotated 345°'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[64,32,335,21,43,0]);
});


test('A1/053 records the PN2070 programming-button callout without inferring button behavior',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(parsed.project),page=report.sheets.find(sheet=>sheet.id==='ref-053').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  assert.equal(project.revision,'Opening set 6.1');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-053').number,'A1/053');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-053').name,'ifm PN2070 programming-button callout');
  assert.equal(project.status,'Authored opening set: A1/001–A1/064; A1/065–A1/100 not authored.');
  for(const [id,required] of [['doc-ref-002-line-52','A1/053  ifm PN2070 programming-button callout'],['doc-ref-004-line-44','Revision 5.0 | 2026-11-13 | A1/053']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/053 index or revision record: '+id);
  for(const required of ['labels a programming button as callout 3','does not document its function','does not assign an operating sequence','ifm PN2070-02'])
    assert.ok(project.objects.some(object=>object.sheetId==='ref-053'&&object.text.includes(required)),'Missing button callout or scope: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('labels a programming button as callout 3'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[64,32,335,21,43,0]);
});


test('A1/054 records the PN2070 relative-pressure classification without deriving a pressure reference',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(parsed.project),page=report.sheets.find(sheet=>sheet.id==='ref-054').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  assert.equal(project.revision,'Opening set 6.1');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-054').number,'A1/054');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-054').name,'ifm PN2070 pressure type');
  assert.equal(project.status,'Authored opening set: A1/001–A1/064; A1/065–A1/100 not authored.');
  for(const [id,required] of [['doc-ref-002-line-53','A1/054  ifm PN2070 pressure type'],['doc-ref-004-line-45','Revision 5.1 | 2026-11-13 | A1/054']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/054 index or revision record: '+id);
  for(const required of ['Type of pressure: relative pressure','does not specify a project pressure reference','does not derive an absolute-pressure conversion','ifm PN2070-02'])
    assert.ok(project.objects.some(object=>object.sheetId==='ref-054'&&object.text.includes(required)),'Missing pressure-type datum or limit: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('lists type of pressure as relative pressure'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[64,32,335,21,43,0]);
});


test('A1/055 records PN2070 vacuum resistance without assigning project conditions',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(parsed.project),page=report.sheets.find(sheet=>sheet.id==='ref-055').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  assert.equal(project.revision,'Opening set 6.1');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-055').number,'A1/055');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-055').name,'ifm PN2070 vacuum resistance');
  assert.equal(project.status,'Authored opening set: A1/001–A1/064; A1/065–A1/100 not authored.');
  for(const [id,required] of [['doc-ref-002-line-54','A1/055  ifm PN2070 vacuum resistance'],['doc-ref-004-line-46','Revision 5.2 | 2026-11-13 | A1/055']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/055 index or revision record: '+id);
  for(const required of ['Vacuum resistance: −1000 mbar (−0.1 MPa)','does not assign a project vacuum condition','application suitability','ifm PN2070-02'])
    assert.ok(project.objects.some(object=>object.sheetId==='ref-055'&&object.text.includes(required)),'Missing vacuum datum or scope: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('lists vacuum resistance as −1000 mbar (−0.1 MPa)'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[64,32,335,21,43,0]);
});

test('A1/056 records PN2070 switching output options without selecting a configuration',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(parsed.project),page=report.sheets.find(sheet=>sheet.id==='ref-056').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  assert.equal(project.revision,'Opening set 6.1');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-056').number,'A1/056');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-056').name,'ifm PN2070 switching output options');
  assert.equal(project.status,'Authored opening set: A1/001–A1/064; A1/065–A1/100 not authored.');
  for(const [id,required] of [['doc-ref-002-line-55','A1/056  ifm PN2070 switching output options'],['doc-ref-004-line-47','Revision 5.3 | 2026-11-13 | A1/056']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/056 index or revision record: '+id);
  for(const required of ['Switching outputs: PNP/NPN.','Output function: normally open / normally closed (parameterisable).','does not select a project polarity or output function','ifm PN2070-02'])
    assert.ok(project.objects.some(object=>object.sheetId==='ref-056'&&object.text.includes(required)),'Missing output option or scope: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('lists PNP/NPN switching outputs and a parameterisable normally open/normally closed output function'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[64,32,335,21,43,0]);
});

test('A1/057 records PN2070 output protection specifications without claiming project protection',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(parsed.project),page=report.sheets.find(sheet=>sheet.id==='ref-057').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  assert.equal(project.revision,'Opening set 6.1');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-057').number,'A1/057');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-057').name,'ifm PN2070 output protection');
  assert.equal(project.status,'Authored opening set: A1/001–A1/064; A1/065–A1/100 not authored.');
  for(const [id,required] of [['doc-ref-002-line-56','A1/057  ifm PN2070 output protection'],['doc-ref-004-line-48','Revision 5.4 | 2026-11-13 | A1/057']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/057 index or revision record: '+id);
  for(const required of ['Short-circuit protection: yes (pulsed).','Overload protection: yes.','does not establish project protection performance','ifm PN2070-02'])
    assert.ok(project.objects.some(object=>object.sheetId==='ref-057'&&object.text.includes(required)),'Missing protection datum or scope: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('lists pulsed short-circuit protection and overload protection for the output'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[64,32,335,21,43,0]);
});

test('A1/058 records PN2070 analogue-output response rating without assigning system response',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(parsed.project),page=report.sheets.find(sheet=>sheet.id==='ref-058').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  assert.equal(project.revision,'Opening set 6.1');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-058').number,'A1/058');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-058').name,'ifm PN2070 analogue-output response');
  assert.equal(project.status,'Authored opening set: A1/001–A1/064; A1/065–A1/100 not authored.');
  for(const [id,required] of [['doc-ref-002-line-57','A1/058  ifm PN2070 analogue-output response'],['doc-ref-004-line-49','Revision 5.5 | 2026-11-13 | A1/058']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/058 index or revision record: '+id);
  for(const required of ['Maximum analogue-output response time: 3 ms.','does not define configured damping or system response','ifm PN2070-02'])
    assert.ok(project.objects.some(object=>object.sheetId==='ref-058'&&object.text.includes(required)),'Missing response rating or scope: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('lists a maximum analogue-output response time of 3 ms'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[64,32,335,21,43,0]);
});

test('A1/059 records PN2070 analogue-output damping range without selecting a setting',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(parsed.project),page=report.sheets.find(sheet=>sheet.id==='ref-059').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  assert.equal(project.revision,'Opening set 6.1');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-059').number,'A1/059');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-059').name,'ifm PN2070 analogue-output damping');
  assert.equal(project.status,'Authored opening set: A1/001–A1/064; A1/065–A1/100 not authored.');
  for(const [id,required] of [['doc-ref-002-line-58','A1/059  ifm PN2070 analogue-output damping'],['doc-ref-004-line-50','Revision 5.6 | 2026-11-13 | A1/059']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/059 index or revision record: '+id);
  for(const required of ['Analogue-output damping dAA: 0–4 s.','does not select a device setting','ifm PN2070-02'])
    assert.ok(project.objects.some(object=>object.sheetId==='ref-059'&&object.text.includes(required)),'Missing damping range or scope: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('lists the analogue-output damping parameter dAA as 0...4 s'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[64,32,335,21,43,0]);
});

test('A1/060 records PN2070 process-value damping range without selecting a setting',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(parsed.project),page=report.sheets.find(sheet=>sheet.id==='ref-060').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  assert.equal(project.revision,'Opening set 6.1');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-060').number,'A1/060');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-060').name,'ifm PN2070 process-value damping');
  assert.equal(project.status,'Authored opening set: A1/001–A1/064; A1/065–A1/100 not authored.');
  for(const [id,required] of [['doc-ref-002-line-59','A1/060  ifm PN2070 process-value damping'],['doc-ref-004-line-51','Revision 5.7 | 2026-11-13 | A1/060']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/060 index or revision record: '+id);
  for(const required of ['Process-value damping dAP: 0–4 s.','does not select a sensor setting','ifm PN2070-02'])
    assert.ok(project.objects.some(object=>object.sheetId==='ref-060'&&object.text.includes(required)),'Missing damping range or scope: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('lists the process-value damping parameter dAP as 0...4 s'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[64,32,335,21,43,0]);
});

test('A1/061 records PN2070 programmable delay range without selecting a delay',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(parsed.project),page=report.sheets.find(sheet=>sheet.id==='ref-061').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  assert.equal(project.revision,'Opening set 6.1');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-061').number,'A1/061');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-061').name,'ifm PN2070 programmable output delay');
  assert.equal(project.status,'Authored opening set: A1/001–A1/064; A1/065–A1/100 not authored.');
  for(const [id,required] of [['doc-ref-002-line-60','A1/061  ifm PN2070 programmable output delay'],['doc-ref-004-line-52','Revision 5.8 | 2026-11-13 | A1/061']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/061 index or revision record: '+id);
  for(const required of ['Programmable delay dS/dr: 0–50 s.','does not select a switch-on or switch-off delay','ifm PN2070-02'])
    assert.ok(project.objects.some(object=>object.sheetId==='ref-061'&&object.text.includes(required)),'Missing delay range or scope: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('lists the programmable delay parameters dS and dr as 0...50 s'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[64,32,335,21,43,0]);
});

test('A1/062 records PN2070 response-time rating without assigning system behavior',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(parsed.project),page=report.sheets.find(sheet=>sheet.id==='ref-062').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  assert.equal(project.revision,'Opening set 6.1');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-062').number,'A1/062');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-062').name,'ifm PN2070 response time');
  assert.equal(project.status,'Authored opening set: A1/001–A1/064; A1/065–A1/100 not authored.');
  for(const [id,required] of [['doc-ref-002-line-61','A1/062  ifm PN2070 response time'],['doc-ref-004-line-53','Revision 5.9 | 2026-11-13 | A1/062']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/062 index or revision record: '+id);
  for(const required of ['Response time: <1.5 ms.','does not establish project or system response time','ifm PN2070-02'])
    assert.ok(project.objects.some(object=>object.sheetId==='ref-062'&&object.text.includes(required)),'Missing response rating or scope: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('lists the response time as <1.5 ms'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[64,32,335,21,43,0]);
});

test('A1/063 records PN2070 IO-Link process cycle time for CMPT 2 without assigning a configuration',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(parsed.project),page=report.sheets.find(sheet=>sheet.id==='ref-063').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  assert.equal(project.revision,'Opening set 6.1');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-063').number,'A1/063');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-063').name,'ifm PN2070 IO-Link cycle time');
  assert.equal(project.status,'Authored opening set: A1/001–A1/064; A1/065–A1/100 not authored.');
  for(const [id,required] of [['doc-ref-002-line-62','A1/063  ifm PN2070 IO-Link cycle time'],['doc-ref-004-line-54','Revision 6.0 | 2026-11-13 | A1/063']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/063 index or revision record: '+id);
  for(const required of ['CMPT=2 minimum process cycle time: 2.3 ms.','does not assign device or master configuration','ifm PN2070-02'])
    assert.ok(project.objects.some(object=>object.sheetId==='ref-063'&&object.text.includes(required)),'Missing cycle-time datum or scope: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('lists the minimum IO-Link process cycle time as 2.3 ms for factory setting / CMPT=2'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[64,32,335,21,43,0]);
});

test('A1/064 records PN2070 IO-Link cycle time for CMPT 3 without assigning a configuration',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(parsed.project),page=report.sheets.find(sheet=>sheet.id==='ref-064').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  assert.equal(project.revision,'Opening set 6.1');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-064').number,'A1/064');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-064').name,'ifm PN2070 IO-Link cycle time CMPT 3');
  assert.equal(project.status,'Authored opening set: A1/001–A1/064; A1/065–A1/100 not authored.');
  for(const [id,required] of [['doc-ref-002-line-63','A1/064  ifm PN2070 IO-Link cycle time CMPT 3'],['doc-ref-004-line-55','Revision 6.1 | 2026-11-13 | A1/064']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/064 index or revision record: '+id);
  for(const required of ['CMPT=3 minimum process cycle time: 3 ms.','does not assign this device profile, master cycle','ifm PN2070-02'])
    assert.ok(project.objects.some(object=>object.sheetId==='ref-064'&&object.text.includes(required)),'Missing cycle-time datum or scope: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('lists the minimum IO-Link process cycle time as 3 ms for Status_B High Resolution / CMPT=3'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[64,32,335,21,43,0]);
});
