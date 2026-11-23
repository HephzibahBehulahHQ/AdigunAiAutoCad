'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
require('./cad-engine.js');

const engine = globalThis.AdigunCADEngine;

test('manual wire bends stay fixed and orthogonal when attached ends move', () => {
  const bends = [{ x: 30, y: 40 }, { x: 30, y: 60 }, { x: 80, y: 60 }];
  const wire = { x1: 10, y1: 20, x2: 100, y2: 75, bends };
  assert.deepEqual(engine.wireRoutePoints(wire), [
    { x: 10, y: 20 }, { x: 30, y: 20 }, ...bends, { x: 80, y: 75 }, { x: 100, y: 75 }
  ]);
  assert.deepEqual(wire.bends, [{ x: 30, y: 40 }, { x: 30, y: 60 }, { x: 80, y: 60 }]);
});

test('viewport expansion and cursor zoom keep one uniform coordinate scale', () => {
  const camera = { x: -110, y: -40, w: 420, h: 297 };
  const viewport = engine.viewportViewBox(camera, 1200, 500);
  assert.deepEqual(viewport, { x: -256.4, y: -40, w: 712.8, h: 297 });
  const cursor = { x: -125, y: 20 };
  const zoomed = engine.viewportViewBox(engine.zoomViewAt(camera, cursor, 0.5), 1200, 500);
  assert.ok(Math.abs((cursor.x - zoomed.x) / zoomed.w - (cursor.x - viewport.x) / viewport.w) < 1e-12);
  assert.ok(Math.abs((cursor.y - zoomed.y) / zoomed.h - (cursor.y - viewport.y) / viewport.h) < 1e-12);
  assert.deepEqual(camera, { x: -110, y: -40, w: 420, h: 297 });
});
const componentId = 'phoenix-contact-3212144';
const relayId = 'phoenix-contact-2966171';
const contactorId = 'schneider-electric-lc1d09bd';

test('catalog placement allocates a unique tag from existing components on every sheet', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const start = html.indexOf('  function nextComponentReference(');
  const end = html.indexOf('  function updatePlacementPreview(', start);
  assert.ok(start >= 0 && end > start);
  const objects = [
    { kind: 'component-instance', ref: 'x1', sheetId: 'power', componentId: 'phoenix-contact-3210567' },
    { kind: 'component-instance', ref: 'X3', sheetId: 'power', componentId: 'phoenix-contact-3209510' }
  ];
  const next = vm.runInNewContext(html.slice(start, end) + '\nnextComponentReference', {
    collectProjectObjects: () => objects
  });
  assert.equal(next('X'), 'X2');
  objects.push({ kind: 'component-instance', ref: 'X2', sheetId: 'control' });
  assert.equal(next('X'), 'X4');
});

test('moving an off-page wire remaps endpoints only on that exact sheet and wire', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const start = html.indexOf('  function remapOffPageWireEndpoints(');
  const end = html.indexOf('  function remapConnectedWireEnds(', start);
  assert.ok(start >= 0 && end > start);
  const endpoints = [
    { sheetId: 'a', wireId: 'w', point: { x: 10, y: 20 } },
    { sheetId: 'b', wireId: 'w', point: { x: 10, y: 20 } },
    { sheetId: 'a', wireId: 'other', point: { x: 10, y: 20 } }
  ];
  const state = { sheet: 'a', crossSheetConnections: [{ endpoints }] };
  const remap = vm.runInNewContext(html.slice(start, end) + '\nremapOffPageWireEndpoints', { state });
  remap({ id: 'w', x1: 50, y1: 25, x2: 70, y2: 25 }, { x1: 0, y1: 20, x2: 10, y2: 20 });
  assert.deepEqual(endpoints.map(endpoint => [endpoint.point.x, endpoint.point.y]), [[70, 25], [10, 20], [10, 20]]);
});

test('project electrical checks locate duplicate tags and pins without attached wires across sheets', () => {
  const first = { ...engine.createInstance(componentId, 50, 50, 'X1'), id: 'first-terminal', sheetId: 'first' };
  const second = { ...engine.createInstance(componentId, 60, 50, 'x1'), id: 'second-terminal', sheetId: 'second' };
  const project = engine.parseProject(engine.serializeProject({
    sheets: [{ id: 'first' }, { id: 'second' }],
    objects: [first, second]
  })).project;
  const report = engine.analyzeProject(project);
  assert.equal(report.valid, true);
  const duplicate = report.findings.find(finding => finding.ruleId === 'ERC-DUPLICATE-DEVICE-TAG');
  assert.equal(duplicate.severity, 'error');
  assert.deepEqual(duplicate.locations, [
    { sheetId: 'first', objectId: 'first-terminal', ref: 'X1' },
    { sheetId: 'second', objectId: 'second-terminal', ref: 'x1' }
  ]);
  const disconnected = report.findings.filter(finding => finding.ruleId === 'ERC-PIN-WITHOUT-WIRE');
  assert.equal(disconnected.length, 4);
  assert.ok(disconnected.every(finding => finding.severity === 'info' && finding.locations[0].pinNumber));
  project.objects[1].ref = 'X2';
  assert.ok(engine.analyzeProject(project).findings.every(finding => finding.ruleId !== duplicate.ruleId));
});
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
  assert.match(inlineScripts[0][2], /if\(!drawingObjectVisible\(obj\)\)el\.style\.display='none'/);
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
  assert.match(inlineScripts[0][2], /\.rotate\(object\.rotation\|\|0\)\.scale\(scale\)/);
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
  assert.deepEqual(engine.catalog('Siemens 6EP13325BA00').map(item => item.id),
    ['siemens-sitop-psu100c-6ep1332-5ba00']);
  assert.ok(engine.catalog('phoenix PT 2.5').some(item => item.id === 'phoenix-contact-3209510'));
  assert.deepEqual(engine.catalog('unlisted manufacturer 987654321'), []);
  assert.equal(items.length, 8241);
  assert.deepEqual(items.filter(item => !/^(finder|eti)-/.test(item.id)).map(item => [item.componentId, item.family, item.tag]), [
    [componentId, 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3209510', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3209523', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3212330', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3209512', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3209513', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3209514', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3209511', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-1233142', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-1176299', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3212329', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-1233140', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3211757', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3211760', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3211813', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3211819', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3212120', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3212123', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3211776', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3211777', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3211758', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-1182209', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3211814', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3211815', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3211820', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-1322453', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3208100', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3208126', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3208128', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3208127', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-1230474', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3208129', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3212138', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3212142', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3212124', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3211778', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-1637251', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3211019', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3211022', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3209578', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3209581', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3211797', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3211802', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-1110405', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3209549', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3211252', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3209552', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3211775', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3211255', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3211254', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3210567', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3211786', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3211793', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3211794', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3211792', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3210570', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-1467082', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3208524', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3210499', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3210509', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3214259', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3002389', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3036042', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3038710', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3044076', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3045088', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3044089', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3045046', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3044102', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3046281', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3031212', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3037122', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3037106', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3031364', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3044131', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3045185', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3044160', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3044188', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3046320', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3047468', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3044238', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3044226', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3047727', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3031076', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3031089', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3031490', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3036149', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3036152', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3031377', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3031487', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3036110', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3036123', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3031225', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3045143', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3045224', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3044115', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3045101', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3045127', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3044144', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3044199', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3044209', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-1179676', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3044225', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3037135', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3044197', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3045169', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3045198', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3045156', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3045075', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3045062', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3037151', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3044207', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3003347', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3001514', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3006056', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3006043', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3000571', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3005073', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3001501', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3004524', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3007327', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3003952', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3002908', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3005086', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-0711344', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3004362', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3003350', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-0719074', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3007330', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3004388', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3004977', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3038011', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-0719139', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3031241', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3031393', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3036466', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3031306', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3031319', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3031445', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-1002940', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3044513', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3044364', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-1079167', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3044542', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3044555', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3044636', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3044649', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3044637', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3044639', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3044814', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3044791', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3044815', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3072637', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3046786', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3031270', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3031283', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3035373', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3031429', 'feedthrough-terminal', 'X'],
    ['phoenix-contact-3210156', 'disconnect-terminal', 'X'],
    [relayId, 'relay-module', 'K'],
    [contactorId, 'contactor', 'KM'],
    ['siemens-3rt2026-2kb40', 'contactor', 'KM'],
    ['siemens-3ru2126-4ab0', 'motor-overload-relay', 'Q'],
    ['siemens-3rp2576-2nw30', 'star-delta-timer', 'K'],
    [startPushButtonId, 'pushbutton', 'S'],
    [stopPushButtonId, 'pushbutton', 'S'],
    ['schneider-electric-xb5avb3', 'lamp', 'H'],
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
    ['phoenix-contact-3212147', 'protective-earth-terminal', 'X'],
    ['phoenix-contact-3209536', 'protective-earth-terminal', 'X'],
    ['phoenix-contact-3211766', 'protective-earth-terminal', 'X'],
    ['phoenix-contact-3211822', 'protective-earth-terminal', 'X'],
    ['phoenix-contact-3212131', 'protective-earth-terminal', 'X'],
    ['phoenix-contact-3044092', 'protective-earth-terminal', 'X'],
    ['phoenix-contact-3044128', 'protective-earth-terminal', 'X'],
    ['phoenix-contact-3044157', 'protective-earth-terminal', 'X'],
    ['phoenix-contact-3031238', 'protective-earth-terminal', 'X'],
    ['phoenix-contact-3031500', 'protective-earth-terminal', 'X'],
    ['phoenix-contact-3031380', 'protective-earth-terminal', 'X'],
    ['phoenix-contact-3036136', 'protective-earth-terminal', 'X'],
    ['phoenix-contact-3036165', 'protective-earth-terminal', 'X'],
    ['phoenix-contact-3044173', 'protective-earth-terminal', 'X'],
    ['phoenix-contact-3044212', 'protective-earth-terminal', 'X'],
    ['phoenix-contact-3215915', 'protective-earth-terminal', 'X'],
    ['phoenix-contact-3044241', 'protective-earth-terminal', 'X'],
    ['phoenix-contact-3215928', 'protective-earth-terminal', 'X'],
    ['phoenix-contact-3209565', 'protective-earth-terminal', 'X'],
    ['phoenix-contact-3211780', 'protective-earth-terminal', 'X'],
    ['phoenix-contact-3211809', 'protective-earth-terminal', 'X'],
    ['phoenix-contact-3212950', 'protective-earth-terminal', 'X'],
    ['phoenix-contact-3208745', 'protective-earth-terminal', 'X'],
    ['phoenix-contact-3044539', 'protective-earth-terminal', 'X'],
    ['phoenix-contact-3031322', 'protective-earth-terminal', 'X'],
    ['phoenix-contact-3031416', 'protective-earth-terminal', 'X'],
    ['weidmuller-1020000000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1020080000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1020100000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1020180000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1020200000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1020280000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1020300000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1020380000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1020400000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1020480000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1020060000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1020010000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1037720000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1020040000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1036800000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1020110000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1037800000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1020260000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1020210000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1020360000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1020500000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1020580000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1024500000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1802780000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1020020000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1037710000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1020140000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1020240000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1039600000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1020340000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1833400000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1020510000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1024650000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1024600000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1422440000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1820550000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1820560000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1028800000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1552790000', 'feedthrough-terminal', 'X'],
    ['weidmuller-2508170000', 'feedthrough-terminal', 'X'],
    ['weidmuller-2508020000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1552830000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1552820000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1521850000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1521880000', 'feedthrough-terminal', 'X'],
    ['weidmuller-2051180000', 'feedthrough-terminal', 'X'],
    ['weidmuller-2051310000', 'feedthrough-terminal', 'X'],
    ['weidmuller-2534380000', 'feedthrough-terminal', 'X'],
    ['weidmuller-2051210000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1991790000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1992110000', 'feedthrough-terminal', 'X'],
    ['weidmuller-2490360000', 'feedthrough-terminal', 'X'],
    ['weidmuller-2490370000', 'feedthrough-terminal', 'X'],
    ['weidmuller-2876670000', 'feedthrough-terminal', 'X'],
    ['weidmuller-2876660000', 'feedthrough-terminal', 'X'],
    ['weidmuller-2494000000', 'feedthrough-terminal', 'X'],
    ['weidmuller-2862830000', 'feedthrough-terminal', 'X'],
    ['weidmuller-2494100000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1521980000', 'feedthrough-terminal', 'X'],
    ['weidmuller-2876690000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1521900000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1521930000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1521970000', 'feedthrough-terminal', 'X'],
    ['weidmuller-2508210000', 'feedthrough-terminal', 'X'],
    ['weidmuller-2508160000', 'feedthrough-terminal', 'X'],
    ['weidmuller-2508200000', 'feedthrough-terminal', 'X'],
    ['weidmuller-2508220000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1521950000', 'feedthrough-terminal', 'X'],
    ['weidmuller-2003110000', 'feedthrough-terminal', 'X'],
    ['weidmuller-2508000000', 'feedthrough-terminal', 'X'],
    ['weidmuller-2051290000', 'feedthrough-terminal', 'X'],
    ['weidmuller-2051230000', 'feedthrough-terminal', 'X'],
    ['weidmuller-2051220000', 'feedthrough-terminal', 'X'],
    ['weidmuller-2534370000', 'feedthrough-terminal', 'X'],
    ['weidmuller-2051330000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1991800000', 'feedthrough-terminal', 'X'],
    ['weidmuller-2697900000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1552740000', 'feedthrough-terminal', 'X'],
    ['weidmuller-2534480000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1552780000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1552770000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1521740000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1521830000', 'feedthrough-terminal', 'X'],
    ['weidmuller-2003120000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1521800000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1521780000', 'feedthrough-terminal', 'X'],
    ['weidmuller-2051240000', 'feedthrough-terminal', 'X'],
    ['weidmuller-2051320000', 'feedthrough-terminal', 'X'],
    ['weidmuller-2051280000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1521870000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1991830000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1552720000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1552700000', 'feedthrough-terminal', 'X'],
    ['weidmuller-2534470000', 'feedthrough-terminal', 'X'],
    ['weidmuller-2534260000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1521690000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1521720000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1521820000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1521770000', 'feedthrough-terminal', 'X'],
    ['weidmuller-2051500000', 'feedthrough-terminal', 'X'],
    ['weidmuller-2051540000', 'feedthrough-terminal', 'X'],
    ['weidmuller-2051660000', 'feedthrough-terminal', 'X'],
    ['weidmuller-2051610000', 'feedthrough-terminal', 'X'],
    ['weidmuller-2051520000', 'feedthrough-terminal', 'X'],
    ['weidmuller-2881450000', 'feedthrough-terminal', 'X'],
    ['weidmuller-2881470000', 'feedthrough-terminal', 'X'],
    ['weidmuller-2881460000', 'feedthrough-terminal', 'X'],
    ['weidmuller-2051400000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1521920000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1521890000', 'feedthrough-terminal', 'X'],
    ['weidmuller-2534690000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1521710000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1521790000', 'feedthrough-terminal', 'X'],
    ['weidmuller-2051530000', 'feedthrough-terminal', 'X'],
    ['weidmuller-2534390000', 'feedthrough-terminal', 'X'],
    ['weidmuller-2051670000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1991820000', 'feedthrough-terminal', 'X'],
    ['weidmuller-2876650000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1521700000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1775490000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1775500000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1768320000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1608520000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1632050000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1683590000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1608630000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1746750000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1683650000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1745230000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1745240000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1608550000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1683460000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1636830000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1683630000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1683390000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1739620000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1775550000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1608540000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1683340000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1683400000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1608570000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1683440000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1683430000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1683420000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1683320000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1683330000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1683260000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1683270000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1683620000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1636820000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1772060000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1772070000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1772080000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1770370000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1770840000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1775480000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1775540000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1608510000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1683640000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1608620000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1746760000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1767690000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1683300000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1683290000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1636780000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1933700000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1739630000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1775610000', 'feedthrough-terminal', 'X'],
    ['weidmuller-7907420000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1683280000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1683360000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1683480000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1608580000', 'feedthrough-terminal', 'X'],
    ['weidmuller-7904180000', 'feedthrough-terminal', 'X'],
    ['weidmuller-7904290000', 'feedthrough-terminal', 'X'],
    ['weidmuller-7904300000', 'feedthrough-terminal', 'X'],
    ['weidmuller-7907410000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1767700000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1768330000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1933710000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1933730000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1933750000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1933740000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1316890000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1021500000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1021580000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1021560000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1255280000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1041100000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1068030000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1067990000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1041900000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1186740000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1547610000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1547620000', 'feedthrough-terminal', 'X'],
    ['weidmuller-1547630000', 'feedthrough-terminal', 'X'],
    ['weidmuller-2744270000', 'feedthrough-terminal', 'X'],
    ['weidmuller-2744240000', 'feedthrough-terminal', 'X'],
    ['weidmuller-2744230000', 'feedthrough-terminal', 'X'],
    ['weidmuller-3025940000', 'feedthrough-terminal', 'X'],
    ['weidmuller-2539970000', 'feedthrough-terminal', 'X'],
    ['weidmuller-2540040000', 'feedthrough-terminal', 'X'],
    ['weidmuller-2552480000', 'feedthrough-terminal', 'X']
  ]);
  assert.deepEqual(engine.catalog('phoenix blue ral5015').map(item => item.id), ['phoenix-contact-3209523', 'phoenix-contact-3211760', 'phoenix-contact-3211819', 'phoenix-contact-3212123', 'phoenix-contact-3208126', 'phoenix-contact-3212142', 'phoenix-contact-3211022', 'phoenix-contact-3209581', 'phoenix-contact-3211802', 'phoenix-contact-3209552', 'phoenix-contact-3211775', 'phoenix-contact-3211793', 'phoenix-contact-3210570', 'phoenix-contact-3208524', 'phoenix-contact-3210509', 'phoenix-contact-3002389', 'phoenix-contact-3038710', 'phoenix-contact-3044089', 'phoenix-contact-3044188', 'phoenix-contact-3044238', 'phoenix-contact-3031089', 'phoenix-contact-3031490', 'phoenix-contact-3036152', 'phoenix-contact-3031377', 'phoenix-contact-3036123', 'phoenix-contact-3031225', 'phoenix-contact-3044115', 'phoenix-contact-3044144', 'phoenix-contact-3044209', 'phoenix-contact-3001514', 'phoenix-contact-3006056', 'phoenix-contact-3005086', 'phoenix-contact-3003350', 'phoenix-contact-3004388', 'phoenix-contact-3004977', 'phoenix-contact-3031319', 'phoenix-contact-3044555', 'phoenix-contact-3044649', 'phoenix-contact-3044791', 'phoenix-contact-3031283']);
  for (const [id, height] of [
    ['3209523', 48.5],
    ['3212330', 48.5],
    ['3209512', 48.5],
    ['3209513', 48.5],
    ['3209514', 48.5],
    ['3209511', 48.5],
    ['1233142', 48.6],
    ['1176299', 48.5],
    ['3212329', 48.5],
    ['1233140', 48.6]
  ]) {
    const terminal = engine.component('phoenix-contact-' + id);
    assert.equal(terminal.manufacturerPartNumber, id);
    assert.equal(terminal.specifications.dimensions.height.value, height);
    assert.ok(terminal.sources[0].url.endsWith(id));
    assert.deepEqual(terminal.symbol.internalConnections, [['level-1-left', 'level-1-right']]);
  }
  const compactPe = engine.component('phoenix-contact-3209536');
  assert.deepEqual(compactPe.specifications.ratedCrossSection, { value: 2.5, unit: 'mm²' });
  assert.deepEqual(compactPe.symbol.internalConnections, [['connection-1', 'connection-2']]);
});
test('larger PT terminals use their specific ratings and share the verified feed-through topology', () => {
  for (const [number, crossSection, width, current, voltage, minimum, maximum] of [
    ['3211757', 4, 6.2, 32, 800, 0.2, 6], ['3211760', 4, 6.2, 32, 800, 0.2, 6],
    ['3211813', 6, 8.2, 41, 1000, 0.5, 10], ['3211819', 6, 8.2, 41, 1000, 0.5, 10],
    ['3212120', 10, 10.2, 57, 1000, 0.5, 16], ['3212123', 10, 10.2, 57, 1000, 0.5, 16],
    ['3211776', 4, 6.2, 32, 800, 0.2, 6],
    ['3211777', 4, 6.2, 32, 800, 0.2, 6],
    ['3211758', 4, 6.2, 32, 800, 0.2, 6],
    ['1182209', 4, 6.2, 32, 800, 0.2, 6],
    ['3211814', 6, 8.2, 41, 1000, 0.5, 10],
    ['3211815', 6, 8.2, 41, 1000, 0.5, 10],
    ['3211820', 6, 8.2, 41, 1000, 0.5, 10],
    ['1322453', 10, 10.2, 57, 1000, 0.5, 16]
  ]) {
    const part = engine.component('phoenix-contact-' + number);
    const spec = part.specifications;
    assert.deepEqual([spec.ratedCrossSection.value, spec.dimensions.width.value, spec.nominalCurrent.value, spec.nominalVoltage.value],
      [crossSection, width, current, voltage]);
    assert.deepEqual(spec.rigidConductorRange, { minimum, maximum, unit: 'mm²' });
    assert.deepEqual(spec.flexibleConductorRange, spec.rigidConductorRange);
    assert.deepEqual(part.symbol.internalConnections, [part.symbol.pins.map(pin => pin.id)]);
    assert.ok(part.sources[0].url.endsWith(number));
  }
});
test('verified multi-conductor terminals connect all distinct anchors on one net', () => {
  for (const [orderCode, voltage, current, height, connectionCount = 4] of [
    ['3211019', 500, 17.5, 48.6], ['3211022', 500, 17.5, 48.6],
    ['3209578', 800, 24, 72.2], ['3209581', 800, 24, 72.2],
    ['3211797', 800, 32, 77], ['3211802', 800, 32, 77], ['1110405', 800, 32, 77],
    ['3209549', 800, 24, 60.4, 3], ['3211252', 800, 24, 60.5, 3], ['3209552', 800, 24, 60.5, 3],
    ['3211775', 800, 32, 66.5, 3], ['3211255', 800, 32, 66.5, 3], ['3211254', 800, 32, 66.5, 3]
  ]) {
    const id = 'phoenix-contact-' + orderCode;
    const definition = engine.component(id);
    const specification = definition.specifications;
    assert.deepEqual([specification.nominalVoltage.value, specification.nominalCurrent.value, specification.dimensions.height.value],
      [voltage, current, height]);
    assert.equal(specification.connectionCount.value, connectionCount);
    assert.ok(definition.sources[0].url.endsWith(orderCode));
    const terminal = engine.createInstance(id, 100, 100, 'X1');
    const pins = engine.worldPins(terminal);
    assert.equal(new Set(pins.map(pin => pin.id)).size, connectionCount);
    const wires = pins.map((pin, index) => ({
      id: 'w' + index, kind: 'wire', x: pin.x, y: pin.y, x1: pin.x, y1: pin.y,
      x2: pin.x + (pin.x < terminal.x ? -25 : 25), y2: pin.y,
      pinAttachments: { start: { instanceId: terminal.id, pinId: pin.id }, end: null }
    }));
    const result = engine.analyze([terminal, ...wires]);
    assert.equal(result.nets.length, 1);
    assert.deepEqual(result.nets[0].wireIds, wires.map(wire => wire.id));
    assert.deepEqual(result.nets[0].pins.map(pin => pin.pinId), pins.map(pin => pin.id));
  }
});
test('verified PTTB terminal blocks keep their two levels electrically isolated', () => {
  const variants = [
    ['3211786', 4, 28, 6.2, 83.7, 0.2, 6, 47.3, 54.8],
    ['3211793', 4, 28, 6.2, 83.5, 0.2, 6, 47.5, 55],
    ['3211794', 4, 28, 6.2, 83.5, 0.2, 6, 47.5, 55],
    ['3211792', 4, 28, 6.2, 83.5, 0.2, 6, 47.5, 55],
    ['3210570', 2.5, 22, 5.2, 68, 0.14, 4, 47.5, 55],
    ['1467082', 2.5, 22, 5.2, 68, 0.14, 4, 47.5, 55],
    ['3208524', 1.5, 16, 3.5, 65.4, 0.14, 1.5, 42.6, 50.1]
  ];
  for (const [orderCode, crossSection, current, width, height, minimum, maximum, depthOnLowRail, depthOnHighRail] of variants) {
    const id = 'phoenix-contact-' + orderCode;
    const part = engine.component(id);
    const { specifications: spec } = part;
    assert.deepEqual([spec.nominalVoltage.value, spec.nominalCurrent.value, spec.ratedCrossSection.value, spec.connectionCount.value],
      [500, current, crossSection, 4]);
    assert.deepEqual([spec.dimensions.width.value, spec.dimensions.height.value,
      spec.dimensions.depthOnNS35_7_5.value, spec.dimensions.depthOnNS35_15.value], [width, height, depthOnLowRail, depthOnHighRail]);
    assert.deepEqual(spec.rigidConductorRange, { minimum, maximum, unit: 'mm²' });
    assert.deepEqual(spec.flexibleConductorRange, spec.rigidConductorRange);
    assert.ok(part.sources[0].url.endsWith(orderCode));
    const terminal = engine.createInstance(id, 100, 100, 'X1');
    const pins = engine.worldPins(terminal);
    assert.deepEqual(pins.map(pin => pin.number), ['1:1', '1:2', '2:1', '2:2']);
    const wires = pins.map((pin, index) => ({
      id: 'w' + index, kind: 'wire', x: pin.x, y: pin.y, x1: pin.x, y1: pin.y,
      x2: pin.x + (pin.x < terminal.x ? -25 : 25), y2: pin.y,
      pinAttachments: { start: { instanceId: terminal.id, pinId: pin.id }, end: null }
    }));
    const nets = engine.analyze([terminal, ...wires]).nets;
    assert.deepEqual(nets.map(net => net.wireIds), [['w0', 'w1'], ['w2', 'w3']]);
    assert.deepEqual(nets.map(net => net.pins.map(pin => pin.number)), [['1:1', '1:2'], ['2:1', '2:2']]);
  }
});
test('verified triple-level terminal blocks keep all three levels electrically isolated', () => {
  const variants = [
    ['3210499', 'push-in', 20, 102.2, 4], ['3210509', 'push-in', 20, 102, 4],
    ['3214259', 'screw', 19, 90, 4], ['3002389', 'screw', 19, 90, 4],
    ['3036042', 'spring-cage', 20, 99.5, 2.5], ['3038710', 'spring-cage', 20, 99.5, 2.5]
  ];
  for (const [orderCode, method, current, height, maximumFlexible] of variants) {
    const id = 'phoenix-contact-' + orderCode;
    const part = engine.component(id);
    const spec = part.specifications;
    assert.ok(part.sources[0].url.endsWith(orderCode));
    assert.deepEqual([spec.nominalVoltage.value, spec.nominalCurrent.value, spec.connectionCount.value], [500, current, 6]);
    assert.deepEqual([spec.dimensions.height.value, spec.flexibleConductorRange.maximum], [height, maximumFlexible]);
    assert.ok(part.symbol.pins.every(pin => pin.connectionType === method));
    const terminal = engine.createInstance(id, 100, 100, 'X1');
    const pins = engine.worldPins(terminal);
    assert.deepEqual(pins.map(pin => pin.number), ['1:1', '1:2', '2:1', '2:2', '3:1', '3:2']);
    const wires = pins.map((pin, index) => ({
      id: 'w' + index, kind: 'wire', x: pin.x, y: pin.y, x1: pin.x, y1: pin.y,
      x2: pin.x + (pin.x < terminal.x ? -25 : 25), y2: pin.y,
      pinAttachments: { start: { instanceId: terminal.id, pinId: pin.id }, end: null }
    }));
    assert.deepEqual(engine.analyze([terminal, ...wires]).nets.map(net => net.wireIds),
      [['w0', 'w1'], ['w2', 'w3'], ['w4', 'w5']]);
  }
});
test('UT and ST feed-through order codes carry their verified connection methods and common potential', () => {
  const variants = [
    ['3044076', 'screw', 1000, 4], ['3045088', 'screw', 1000, 4], ['3044089', 'screw', 1000, 4],
    ['3045046', 'screw', 1000, 4], ['3044102', 'screw', 1000, 6], ['3046281', 'screw', 1000, 16],
    ['3031212', 'spring-cage', 800, 2.5], ['3037122', 'spring-cage', 800, 2.5],
    ['3037106', 'spring-cage', 800, 2.5], ['3031364', 'spring-cage', 800, 4],
    ['3044131', 'screw', 1000, 10, 8.2, 47.7, [47.5, 55]],
    ['3045185', 'screw', 1000, 10, 8.2, 47.7, [47.5, 55]],
    ['3044160', 'screw', 1000, 16, 10.2, 47.7, [47.5, 55]],
    ['3044188', 'screw', 1000, 16, 10.2, 47.7, [47.5, 55]],
    ['3046320', 'screw', 1000, 16, 10.2, 47.7, [47.5, 55]],
    ['3047468', 'screw', 1000, 25, 12.2, 55.5, [55, 62.5]],
    ['3044238', 'screw', 1000, 50, 16, 61.2, [65.7, 73.2]],
    ['3044226', 'screw', 1000, 50, 16, 61.2, [65.7, 73.2]],
    ['3047727', 'screw', 1000, 50, 16, 61.2, [65.7, 73.2]],
    ['3031076', 'spring-cage', 500, 1.5, 4.2, 48.5, [36.5, 44]],
    ['3031089', 'spring-cage', 500, 1.5, 4.2, 48.5, [36.5, 44]],
    ['3031490', 'spring-cage', 1000, 6, 8.2, 69.5, [43.5, 51]],
    ['3036149', 'spring-cage', 1000, 16, 12.2, 80, [51.5, 59]],
    ['3036152', 'spring-cage', 1000, 16, 12.2, 80, [51.5, 59]],
    ['3031377', 'spring-cage', 800, 4, 6.2, 56, [36.5, 44]],
    ['3031487', 'spring-cage', 1000, 6, 8.2, 69.5, [43.5, 51]],
    ['3036110', 'spring-cage', 1000, 10, 10.2, 71.5, [50.3, 57.8]],
    ['3036123', 'spring-cage', 1000, 10, 10.2, 71.5, [50.3, 57.8]],
    ['3031225', 'spring-cage', 800, 2.5, 5.2, 48.5, [36.5, 44]],
    ['3045143', 'screw', 1000, 6, 6.2, 47.7, [47.5, 55]],
    ['3045224', 'screw', 1000, 6, 6.2, 47.7, [47.5, 55]],
    ['3044115', 'screw', 1000, 6, 6.2, 47.7, [47.5, 55]],
    ['3045101', 'screw', 1000, 6, 6.2, 47.7, [47.5, 55]],
    ['3045127', 'screw', 1000, 6, 6.2, 47.7, [47.5, 55]],
    ['3044144', 'screw', 1000, 10, 8.2, 47.7, [47.5, 55]],
    ['3044199', 'screw', 1000, 25, 12.2, 55.5, [55, 62.5]],
    ['3044209', 'screw', 1000, 25, 12.2, 55.5, [55, 62.5]],
    ['1179676', 'screw', 1000, 25, 12.2, 55.5, [55, 62.5]],
    ['3037135', 'spring-cage', 800, 4, 6.2, 56, [36.5, 44]],
    ['3044197', 'screw', 1000, 25, 12.2, 55.5, [55, 62.5]],
    ['3045169', 'screw', 1000, 10, 8.2, 47.7, [47.5, 55]],
    ['3045198', 'screw', 1000, 10, 8.2, 47.7, [47.5, 55]],
    ['3045156', 'screw', 1000, 6, 6.2, 47.7, [47.5, 55]],
    ['3045075', 'screw', 1000, 4, 5.2, 47.7, [47.5, 55]],
    ['3045062', 'screw', 1000, 4, 5.2, 47.7, [47.5, 55]],
    ['3037151', 'spring-cage', 800, 4, 6.2, 56, [36.5, 44]],
    ['3044207', 'screw', 1000, 25, 12.2, 55.5, [55, 62.5]],
    ['3044225', 'screw', 1000, 50, 16, 61.2, [65.7, 73.2]]
  ];
  for (const [orderCode, method, voltage, maximumFlexible, width, height, railDepths] of variants) {
    const part = engine.component('phoenix-contact-' + orderCode);
    assert.ok(part.sources[0].url.endsWith(orderCode));
    assert.deepEqual(part.symbol.pins.map(pin => pin.connectionType), [method, method]);
    assert.deepEqual(part.symbol.internalConnections, [['level-1-left', 'level-1-right']]);
    assert.equal(part.specifications.nominalVoltage.value, voltage);
    assert.equal(part.specifications.flexibleConductorRange.maximum, maximumFlexible);
    const [panel] = part.physicalRepresentations;
    assert.equal(panel.width, part.specifications.dimensions.width.value);
    if (railDepths) assert.deepEqual([panel.width, panel.height, ...Object.values(panel.railDepths)], [width, height, ...railDepths]);
  }
});

test('UK terminal blocks preserve separate conductor ranges and three documented rails', () => {
  for (const [orderCode, area, minimumFlexible, maximumFlexible, depthOnNS32] of [
    ['3003347', 2.5, 0.2, 2.5, 47],
    ['3001514', 2.5, 0.2, 2.5, 52],
    ['3006056', 16, 4, 16, 59],
    ['3006043', 16, 4, 16, 59],
    ['3000571', 16, 4, 16, 59],
    ['3005073', 10, 0.5, 10, 52.3],
    ['3001501', 2.5, 0.2, 2.5, 52],
    ['3004524', 6, 0.2, 6, 52],
    ['3007327', 4, 0.2, 4, 52],
    ['3003952', 4, 0.2, 4, 52],
    ['3002908', 4, 0.2, 4, 52],
    ['3005086', 10, 0.5, 10, 52.3],
    ['0711344', 4, 0.2, 4, 52],
    ['3004362', 4, 0.2, 4, 52],
    ['3003350', 2.5, 0.2, 2.5, 47],
    ['0719074', 2.5, 0.2, 2.5, 47],
    ['3007330', 4, 0.2, 4, 52],
    ['3004388', 4, 0.2, 4, 52],
    ['3004977', 6, 0.2, 6, 52],
    ['3038011', 2.5, 0.2, 2.5, 47],
    ['0719139', 2.5, 0.2, 2.5, 52]
  ]) {
    const part = engine.component('phoenix-contact-' + orderCode);
    assert.ok(part.sources[0].url.endsWith(orderCode));
    assert.deepEqual(part.symbol.pins.map(pin => pin.connectionType), ['screw', 'screw']);
    assert.deepEqual(part.symbol.internalConnections, [['level-1-left', 'level-1-right']]);
    assert.equal(part.specifications.ratedCrossSection.value, area);
    assert.deepEqual(part.specifications.flexibleConductorRange, { minimum: minimumFlexible, maximum: maximumFlexible, unit: 'mm²' });
    assert.deepEqual(part.specifications.mountingRails.value, ['NS 35/7.5', 'NS 35/15', 'NS 32']);
    assert.equal(part.physicalRepresentations[0].railDepths['NS 32'], depthOnNS32);
  }
});

test('new protective conductor terminals retain the common PE potential and documented grounding foot', () => {
  for (const [id, connectionType, area, maximumFlexible, mountingScrew] of [
    ['3211766', 'push-in', 4, 6],
    ['3211822', 'push-in', 6, 10],
    ['3212131', 'push-in', 10, 16],
    ['3044092', 'screw', 2.5, 4],
    ['3044128', 'screw', 4, 6],
    ['3044157', 'screw', 6, 10],
    ['3031238', 'spring-cage', 2.5, 2.5],
    ['3031500', 'spring-cage', 6, 6],
    ['3031380', 'spring-cage', 4, 4],
    ['3036136', 'spring-cage', 10, 10],
    ['3036165', 'spring-cage', 16, 16],
    ['3044173', 'screw', 10, 16],
    ['3044212', 'screw', 16, 25],
    ['3215915', 'screw', 16, 25, 'M4'],
    ['3044241', 'screw', 35, 35],
    ['3215928', 'screw', 35, 35, 'M5']
  ]) {
    const part = engine.component('phoenix-contact-' + id);
    assert.ok(part.sources[0].url.endsWith(id));
    assert.deepEqual(part.symbol.pins.map(pin => pin.connectionType), [connectionType, connectionType]);
    assert.deepEqual(part.symbol.internalConnections, [['connection-1', 'connection-2']]);
    assert.equal(part.specifications.groundingFoot.value, true);
    assert.equal(part.specifications.groundingFootMountingScrew?.value, mountingScrew);
    assert.equal(part.specifications.productStandard.value, 'IEC 60947-7-2');
    assert.equal(part.specifications.ratedCrossSection.value, area);
    assert.equal(part.specifications.flexibleConductorRange.maximum, maximumFlexible);
  }
});

test('multi-conductor protective-earth blocks connect all manufacturer-specified conductors', () => {
  for (const [id, count, method] of [
    ['3209565', 3, 'push-in'],
    ['3211780', 3, 'push-in'],
    ['3211809', 4, 'push-in'],
    ['3212950', 4, 'push-in'],
    ['3208745', 3, 'push-in'],
    ['3044539', 3, 'screw'],
    ['3031322', 4, 'spring-cage'],
    ['3031416', 3, 'spring-cage']
  ]) {
    const part = engine.component('phoenix-contact-' + id);
    assert.ok(part.sources[0].url.endsWith(id));
    assert.equal(part.specifications.connectionCount.value, count);
    const terminal = engine.createInstance(part.id, 100, 100, 'X1');
    const pins = engine.worldPins(terminal);
    assert.equal(pins.length, count);
    assert.ok(part.symbol.pins.every(pin => pin.connectionType === method));
    const wires = pins.map((pin, index) => ({
      id: 'pe-' + index, kind: 'wire', x: pin.x, y: pin.y, x1: pin.x, y1: pin.y,
      x2: pin.x + (pin.x < terminal.x ? -25 : 25), y2: pin.y,
      pinAttachments: { start: { instanceId: terminal.id, pinId: pin.id }, end: null }
    }));
    assert.deepEqual(engine.analyze([terminal, ...wires]).nets.map(net => net.wireIds), [wires.map(wire => wire.id)]);
  }
});

test('ST and UT multi-conductor terminal blocks share one potential across every terminal', () => {
  for (const [id, method, count, voltage, maximumFlexible] of [
    ['3031241', 'spring-cage', 3, 800, 2.5],
    ['3031393', 'spring-cage', 3, 800, 4],
    ['3036466', 'spring-cage', 3, 1000, 6],
    ['3031306', 'spring-cage', 4, 800, 2.5],
    ['3031319', 'spring-cage', 4, 800, 2.5],
    ['3031445', 'spring-cage', 4, 800, 4],
    ['1002940', 'spring-cage', 4, 800, 4],
    ['3044513', 'screw', 3, 500, 4],
    ['3044364', 'screw', 3, 500, 6],
    ['1079167', 'screw', 3, 500, 6],
    ['3044542', 'screw', 4, 500, 4],
    ['3044555', 'screw', 4, 500, 4]
  ]) {
    const part = engine.component('phoenix-contact-' + id);
    assert.ok(part.sources[0].url.endsWith(id));
    assert.equal(part.specifications.nominalVoltage.value, voltage);
    assert.equal(part.specifications.flexibleConductorRange.maximum, maximumFlexible);
    const block = engine.createInstance(part.id, 100, 100, 'X1');
    const pins = engine.worldPins(block);
    assert.equal(pins.length, count);
    assert.ok(part.symbol.pins.every(pin => pin.connectionType === method));
    const wires = pins.map((pin, index) => ({
      id: 'signal-' + index, kind: 'wire', x: pin.x, y: pin.y, x1: pin.x, y1: pin.y,
      x2: pin.x + (pin.x < block.x ? -25 : 25), y2: pin.y,
      pinAttachments: { start: { instanceId: block.id, pinId: pin.id }, end: null }
    }));
    assert.deepEqual(engine.analyze([block, ...wires]).nets.map(net => net.wireIds), [wires.map(wire => wire.id)]);
  }
});

test('STTB and UTTB terminal blocks maintain two separate electrical potentials', () => {
  for (const [id, method, voltage, current, maxFlexible] of [
    ['3044636', 'screw', 500, 24, 4],
    ['3044649', 'screw', 500, 24, 4],
    ['3044637', 'screw', 500, 24, 4],
    ['3044639', 'screw', 500, 24, 4],
    ['3044814', 'screw', 800, 30, 6],
    ['3044791', 'screw', 800, 30, 6],
    ['3044815', 'screw', 800, 30, 6],
    ['3072637', 'screw', 800, 30, 6],
    ['3046786', 'screw', 800, 30, 6],
    ['3031270', 'spring-cage', 500, 22, 2.5],
    ['3031283', 'spring-cage', 500, 22, 2.5],
    ['3035373', 'spring-cage', 500, 22, 2.5],
    ['3031429', 'spring-cage', 500, 30, 4]
  ]) {
    const part = engine.component('phoenix-contact-' + id);
    assert.ok(part.sources[0].url.endsWith(id));
    assert.equal(part.specifications.nominalVoltage.value, voltage);
    assert.equal(part.specifications.nominalCurrent.value, current);
    assert.equal(part.specifications.flexibleConductorRange.maximum, maxFlexible);
    const block = engine.createInstance(part.id, 100, 100, 'X1');
    const pins = engine.worldPins(block);
    assert.equal(pins.length, 4);
    assert.ok(part.symbol.pins.every(pin => pin.connectionType === method));
    const wires = pins.map((pin, index) => ({
      id: 'level-' + index, kind: 'wire', x: pin.x, y: pin.y, x1: pin.x, y1: pin.y,
      x2: pin.x + (pin.x < block.x ? -25 : 25), y2: pin.y,
      pinAttachments: { start: { instanceId: block.id, pinId: pin.id }, end: null }
    }));
    assert.deepEqual(engine.analyze([block, ...wires]).nets.map(net => net.wireIds), [['level-0', 'level-1'], ['level-2', 'level-3']]);
  }
});

test('PT miniature and power feed-through blocks preserve ratings and panel widths', () => {
  for (const [id, voltage, current, width, height] of [
    ['3208100', 500, 17.5, 3.5, 45],
    ['3208126', 500, 17.5, 3.5, 45],
    ['3208128', 500, 17.5, 3.5, 45],
    ['3208127', 500, 17.5, 3.5, 45],
    ['1230474', 500, 17.5, 3.5, 45],
    ['3208129', 500, 17.5, 3.5, 45],
    ['3212138', 1000, 76, 12.2, 75.4],
    ['3212142', 1000, 76, 12.2, 75.4],
    ['3212124', 1000, 57, 10.2, 67.7],
    ['3211778', 800, 32, 6.2, 56],
    ['1637251', 800, 32, 6.2, 56]
  ]) {
    const part = engine.component('phoenix-contact-' + id);
    assert.ok(part.sources[0].url.endsWith(id));
    assert.deepEqual(part.symbol.pins.map(pin => pin.connectionType), ['push-in', 'push-in']);
    assert.deepEqual(part.symbol.internalConnections, [['level-1-left', 'level-1-right']]);
    assert.deepEqual([part.specifications.nominalVoltage.value, part.specifications.nominalCurrent.value], [voltage, current]);
    const [outline] = part.physicalRepresentations;
    assert.deepEqual([outline.width, outline.height], [width, height]);
  }
});

test('Weidmüller WDU blocks preserve the manufacturer identity, wire limits and TS 35 dimensions', () => {
  for (const [id, width, depth, minimumRigid, maximumRigid, maximumFlexible, depthIncludingDINRail,
    endCoverRequired = true, rails = ['TS 35'], voltage, current] of [
    ['1020000000', 5.1, 46.5, 0.05, 4, 4],
    ['1020080000', 5.1, 46.5, 0.5, 4, 4],
    ['1020100000', 6.1, 46.5, 0.13, 6, 6, 47],
    ['1020180000', 6.1, 46.5, 0.13, 6, 6, 47],
    ['1020200000', 7.9, 46.5, 0.5, 10, 10, 47],
    ['1020280000', 7.9, 46.5, 0.22, 10, 10, 47],
    ['1020300000', 9.9, 46.5, 1.31, 16, 16, 47],
    ['1020380000', 9.9, 46.5, 1.31, 16, 16, 47],
    ['1020400000', 11.9, 62.5, 0.82, 16, 25, 63],
    ['1020480000', 11.9, 62.5, 0.82, 16, 25, 63],
    ['1020060000', 5.1, 46.5, 0.05, 4, 4],
    ['1020010000', 5.1, 46.5, 0.05, 4, 4],
    ['1037720000', 5.1, 46.5, 0.05, 4, 4],
    ['1020040000', 5.1, 46.5, 0.5, 4, 4],
    ['1036800000', 5.1, 46.5, 0.05, 4, 4],
    ['1020110000', 6.1, 46.5, 0.13, 6, 6, 47],
    ['1037800000', 6.1, 46.5, 0.5, 6, 6, 47],
    ['1020260000', 7.9, 46.5, 0.22, 10, 10, 47],
    ['1020210000', 7.9, 46.5, 0.5, 10, 10, 47],
    ['1020360000', 9.9, 46.5, 1.31, 16, 16, 47],
    ['1020500000', 16, 62.5, 2.5, 16, 35, 63],
    ['1020580000', 16, 62.5, 2.5, 16, 35, 63],
    ['1024500000', 32, 117, 35, 150, 150, 125.5, false, ['TS 35'], 1000, 269],
    ['1802780000', 36, 123.7, 70, 185, 240, 124, false, ['TS 32', 'TS 35'], 1000, 415],
    ['1020020000', 5.1, 46.5, 0.05, 4, 4, null, true, ['TS 35'], 800, 24],
    ['1037710000', 5.1, 46.5, 0.05, 4, 4, null, true, ['TS 35'], 800, 24],
    ['1020140000', 6.1, 46.5, 0.13, 6, 6, 47, true, ['TS 35'], 800, 32],
    ['1020240000', 7.9, 46.5, 0.22, 10, 10, 47, true, ['TS 35'], 800, 41],
    ['1039600000', 7.9, 46.5, 0.22, 10, 10, 47, true, ['TS 35'], 800, 41],
    ['1020340000', 9.9, 46.5, 1.31, 16, 16, 47, true, ['TS 35'], 1000, 57],
    ['1833400000', 11.9, 62.5, 0.82, 16, 25, 63, true, ['TS 35'], 1000, 76],
    ['1020510000', 16, 62.5, 2.5, 16, 35, 63, true, ['TS 35'], 1000, 125],
    ['1024650000', 27, 107, 13.3, 16, 95, 115.5, false, ['TS 35'], 1000, 232],
    ['1024600000', 27, 107, 13.3, 16, 95, 115.5, false, ['TS 35'], 1000, 232],
    ['1422440000', 18.5, 69.6, 10, 16, 50, 70.6, false, ['TS 35'], 1000, 150],
    ['1820550000', 27, 90, 16, 16, 120, 91, false, ['TS 35', 'TS 32 offset'], 1000, 269],
    ['1820560000', 27, 90, 16, 16, 120, 91, false, ['TS 35'], 1000, 269],
    ['1028800000', 16, 62.5, 2.5, 16, 35, 63, true, ['TS 35'], 1000, 125]
  ]) {
    const [result] = engine.catalog('weidmueller ' + id);
    const part = engine.component(result.id);
    assert.equal(part.manufacturer, 'Weidmüller');
    assert.ok(part.sources[0].url.endsWith(id));
    assert.deepEqual(part.symbol.pins.map(pin => pin.connectionType), ['screw', 'screw']);
    assert.deepEqual(part.symbol.internalConnections, [['level-1-left', 'level-1-right']]);
    assert.deepEqual(part.specifications.mountingRails.value, rails);
    assert.deepEqual(part.specifications.rigidConductorRange, { minimum: minimumRigid, maximum: maximumRigid, unit: 'mm²' });
    assert.equal(part.specifications.flexibleConductorRange.maximum, maximumFlexible);
    assert.equal(part.specifications.endCoverRequired.value, endCoverRequired);
    if (voltage !== undefined) assert.deepEqual([part.specifications.nominalVoltage.value, part.specifications.nominalCurrent.value], [voltage, current]);
    const [outline] = part.physicalRepresentations;
    assert.deepEqual([outline.width, outline.depth, outline.depthIncludingDINRail], [width, depth, depthIncludingDINRail ?? undefined]);
    assert.deepEqual(outline.railDepths, {});
  }
});

test('Weidmüller A2C variants retain push-in terminals and each documented conductor range', () => {
  for (const [id, voltage, current, solidLimit, flexibleLimit, width, depth] of [
    ['1552790000', 500, 17.5, 1.5, 1.5, 3.5, 33.5],
    ['2508170000', 500, 17.5, 1.5, 1.5, 3.5, 33.5],
    ['2508020000', 500, 17.5, 1.5, 1.5, 3.5, 33.5],
    ['1552830000', 500, 17.5, 1.5, 1.5, 3.5, 33.5],
    ['1552820000', 500, 17.5, 1.5, 1.5, 3.5, 33.5],
    ['1521850000', 800, 24, 2.5, 4, 5.1, 36.5],
    ['1521880000', 800, 24, 2.5, 4, 5.1, 36.5],
    ['2051180000', 800, 32, 4, 6, 6.1, 39.5],
    ['2051310000', 800, 32, 4, 6, 6.1, 39.5],
    ['2534380000', 800, 32, 4, 6, 6.1, 39.5],
    ['2051210000', 800, 32, 4, 6, 6.1, 39.5],
    ['1991790000', 800, 41, 6, 10, 8.1, 45.5],
    ['1992110000', 800, 41, 6, 10, 8.1, 45.5],
    ['2490360000', 1000, 57, 10, 16, 10, 51.5],
    ['2490370000', 1000, 57, 10, 16, 10, 51.5],
    ['2876670000', 1000, 57, 10, 16, 10, 51.5],
    ['2876660000', 1000, 57, 10, 16, 10, 51.5],
    ['2494000000', 1000, 76, 16, 25, 12, 51.5],
    ['2862830000', 1000, 76, 16, 25, 12, 51.5],
    ['2494100000', 1000, 76, 16, 25, 12, 51.5],
    ['1521980000', 800, 24, 2.5, 4, 5.1, 36.5],
    ['2876690000', 1000, 57, 10, 16, 10, 51.5],
    ['1521900000', 800, 24, 2.5, 4, 5.1, 36.5],
    ['1521930000', 800, 24, 2.5, 4, 5.1, 36.5],
    ['1521970000', 800, 24, 2.5, 4, 5.1, 36.5],
    ['2508210000', 500, 17.5, 1.5, 1.5, 3.5, 33.5],
    ['2508160000', 500, 17.5, 1.5, 1.5, 3.5, 33.5],
    ['2508200000', 500, 17.5, 1.5, 1.5, 3.5, 33.5],
    ['2508220000', 500, 17.5, 1.5, 1.5, 3.5, 33.5],
    ['1521950000', 800, 24, 2.5, 4, 5.1, 36.5],
    ['2003110000', 800, 24, 2.5, 4, 5.1, 36.5],
    ['2508000000', 800, 24, 2.5, 4, 5.1, 36.5],
    ['2051290000', 800, 32, 4, 6, 6.1, 39.5],
    ['2051230000', 800, 32, 4, 6, 6.1, 39.5],
    ['2051220000', 800, 32, 4, 6, 6.1, 39.5],
    ['2534370000', 800, 32, 4, 6, 6.1, 39.5],
    ['2051330000', 800, 32, 4, 6, 6.1, 39.5],
    ['1991800000', 800, 41, 6, 10, 8.1, 45.5],
    ['2697900000', 1000, 57, 10, 16, 10, 51.5]
  ]) {
    const [item] = engine.catalog('weidmueller ' + id);
    const part = engine.component(item.id);
    const specs = part.specifications;
    assert.ok(part.sources[0].url.endsWith(id));
    assert.deepEqual(part.symbol.pins.map(pin => pin.connectionType), ['push-in', 'push-in']);
    assert.deepEqual(part.symbol.internalConnections, [['level-1-left', 'level-1-right']]);
    assert.deepEqual([specs.nominalVoltage.value, specs.nominalCurrent.value], [voltage, current]);
    assert.deepEqual([specs.rigidConductorRange.maximum, specs.flexibleConductorRange.maximum], [solidLimit, flexibleLimit]);
    assert.equal(specs.endCoverRequired.value, true);
    const [outline] = part.physicalRepresentations;
    assert.deepEqual([outline.width, outline.depth], [width, depth]);
  }
});

test('Weidmüller A3C and A4C terminal blocks connect every documented anchor to the same net', () => {
  for (const [id, count, solidLimit, flexibleLimit] of [
    ['1552740000', 3, 1.5, 1.5],
    ['2534480000', 3, 1.5, 1.5],
    ['1552780000', 3, 1.5, 1.5],
    ['1552770000', 3, 1.5, 1.5],
    ['1521740000', 3, 2.5, 4],
    ['1521830000', 3, 2.5, 4],
    ['2003120000', 3, 2.5, 4],
    ['1521800000', 3, 2.5, 4],
    ['1521780000', 3, 2.5, 4],
    ['2051240000', 3, 4, 6],
    ['2051320000', 3, 4, 6],
    ['2051280000', 3, 4, 6],
    ['1521870000', 3, 2.5, 4],
    ['1991830000', 3, 6, 10],
    ['1552720000', 4, 1.5, 1.5],
    ['1552700000', 4, 1.5, 1.5],
    ['2534470000', 4, 1.5, 1.5],
    ['2534260000', 4, 1.5, 1.5],
    ['1521690000', 4, 2.5, 4],
    ['1521720000', 4, 2.5, 4],
    ['1521820000', 4, 2.5, 4],
    ['1521770000', 4, 2.5, 4],
    ['2051500000', 4, 4, 6],
    ['2051540000', 4, 4, 6],
    ['2051660000', 4, 4, 6],
    ['2051610000', 4, 4, 6],
    ['2051520000', 4, 4, 6],
    ['2881450000', 4, 6, 10],
    ['2881470000', 4, 6, 10],
    ['2881460000', 4, 6, 10],
    ['2051400000', 3, 4, 6],
    ['1521920000', 3, 2.5, 4],
    ['1521890000', 3, 2.5, 4],
    ['2534690000', 3, 2.5, 4],
    ['1521710000', 4, 2.5, 4],
    ['1521790000', 4, 2.5, 4],
    ['2051530000', 4, 4, 6],
    ['2534390000', 4, 4, 6],
    ['2051670000', 4, 4, 6],
    ['1991820000', 3, 6, 10],
    ['2876650000', 3, 6, 10],
    ['1521700000', 4, 2.5, 4]
  ]) {
    const part = engine.component('weidmuller-' + id);
    assert.ok(part.sources[0].url.endsWith(id));
    assert.equal(part.specifications.connectionCount.value, count);
    assert.equal(part.specifications.rigidConductorRange.maximum, solidLimit);
    assert.equal(part.specifications.flexibleConductorRange.maximum, flexibleLimit);
    const block = engine.createInstance(part.id, 100, 100, 'X1');
    const pins = engine.worldPins(block);
    assert.equal(pins.length, count);
    assert.ok(part.symbol.pins.every(pin => pin.connectionType === 'push-in'));
    const wires = pins.map((pin, index) => ({
      id: 'wdu-' + index, kind: 'wire', x: pin.x, y: pin.y, x1: pin.x, y1: pin.y,
      x2: pin.x + (pin.x < block.x ? -25 : 25), y2: pin.y,
      pinAttachments: { start: { instanceId: block.id, pinId: pin.id }, end: null }
    }));
    assert.deepEqual(engine.analyze([block, ...wires]).nets.map(net => net.wireIds), [wires.map(wire => wire.id)]);
  }
});

test('Weidmüller ZDU blocks preserve the tension-clamp method and specified end-cover requirements', () => {
  for (const [id, count, voltage, current, maxFlexible, endCoverRequired] of [
    ['1775490000', 2, 500, 17.5, 1.5, true],
    ['1775500000', 2, 500, 17.5, 1.5, true],
    ['1768320000', 3, 800, 76, 16, true],
    ['1608520000', 2, 800, 24, 4, true],
    ['1632050000', 2, 800, 32, 6, true],
    ['1683590000', 2, 800, 32, 6, true],
    ['1608630000', 2, 800, 41, 6, true],
    ['1746750000', 2, 1000, 57, 10, true],
    ['1683650000', 2, 800, 32, 6, true],
    ['1745230000', 2, 1000, 76, 16, true],
    ['1745240000', 2, 1000, 76, 16, true],
    ['1608550000', 3, 800, 24, 4, true],
    ['1683460000', 4, 800, 24, 4, true],
    ['1636830000', 2, 800, 32, 6, true],
    ['1683630000', 2, 800, 32, 6, true],
    ['1683390000', 3, 800, 24, 4, true],
    ['1739620000', 2, 800, 125, 35, false],
    ['1775550000', 3, 500, 17.5, 1.5, true],
    ['1608540000', 3, 800, 24, 4, true],
    ['1683340000', 3, 800, 24, 4, true],
    ['1683400000', 3, 800, 24, 4, true],
    ['1608570000', 4, 800, 24, 4, true],
    ['1683440000', 4, 800, 24, 4, true],
    ['1683430000', 4, 800, 24, 4, true],
    ['1683420000', 4, 800, 24, 4, true],
    ['1683320000', 2, 800, 24, 4, true],
    ['1683330000', 2, 800, 24, 4, true],
    ['1683260000', 2, 800, 24, 4, true],
    ['1683270000', 2, 800, 24, 4, true],
    ['1683620000', 2, 800, 32, 6, true],
    ['1636820000', 2, 800, 41, 6, true],
    ['1772060000', 2, 800, 24, 2.5, true],
    ['1772070000', 2, 800, 24, 2.5, true],
    ['1772080000', 2, 800, 24, 2.5, true],
    ['1770370000', 2, 800, 32, 4, true],
    ['1770840000', 2, 800, 32, 4, true],
    ['1775480000', 2, 500, 17.5, 1.5, true],
    ['1775540000', 3, 500, 17.5, 1.5, true],
    ['1608510000', 2, 800, 24, 4, true],
    ['1683640000', 2, 800, 32, 6, true],
    ['1608620000', 2, 800, 41, 10, true],
    ['1746760000', 2, 1000, 57, 10, true],
    ['1767690000', 3, 800, 57, 10, true],
    ['1683300000', 2, 800, 24, 4, true],
    ['1683290000', 2, 800, 24, 4, true],
    ['1636780000', 2, 800, 24, 4, true],
    ['1933700000', 2, 800, 24, 2.5, true],
    ['1739630000', 2, 800, 125, 35, false],
    ['1775610000', 4, 500, 17.5, 1.5, true],
    ['7907420000', 3, 800, 41, 6, true],
    ['1683280000', 2, 800, 24, 4, true],
    ['1683360000', 3, 800, 24, 4, true],
    ['1683480000', 4, 800, 24, 4, true],
    ['1608580000', 4, 800, 24, 4, true],
    ['7904180000', 3, 800, 32, 6, true],
    ['7904290000', 4, 800, 32, 6, true],
    ['7904300000', 4, 800, 32, 6, true],
    ['7907410000', 3, 800, 41, 6, true],
    ['1767700000', 3, 800, 57, 10, true],
    ['1768330000', 3, 800, 76, 16, true],
    ['1933710000', 2, 800, 24, 2.5, true],
    ['1933730000', 3, 800, 24, 2.5, true],
    ['1933750000', 4, 800, 24, 2.5, true],
    ['1933740000', 4, 800, 24, 2.5, true],
    ['1316890000', 4, 800, 24, 2.5, true]
  ]) {
    const part = engine.component('weidmuller-' + id);
    const specs = part.specifications;
    assert.ok(part.sources[0].url.endsWith(id));
    assert.deepEqual([specs.nominalVoltage.value, specs.nominalCurrent.value], [voltage, current]);
    assert.equal(specs.flexibleConductorRange.maximum, maxFlexible);
    assert.equal(specs.endCoverRequired.value, endCoverRequired);
    assert.equal(specs.connectionCount.value, count);
    assert.ok(part.symbol.pins.every(pin => pin.connectionType === 'tension-clamp'));
    assert.deepEqual(part.symbol.internalConnections, [part.symbol.pins.map(pin => pin.id)]);
  }
});

test('Weidmüller WDK and A2T terminal blocks preserve two isolated levels', () => {
  for (const [id, method, voltage, current, maxFlexible] of [
    ['1021500000', 'screw', 400, 24, 4],
    ['1021580000', 'screw', 400, 24, 4],
    ['1021560000', 'screw', 400, 24, 4],
    ['1255280000', 'screw', 400, 24, 4],
    ['1041100000', 'screw', 400, 24, 4],
    ['1068030000', 'screw', 400, 24, 4],
    ['1067990000', 'screw', 400, 24, 4],
    ['1041900000', 'screw', 800, 32, 4],
    ['1186740000', 'screw', 800, 57, 16],
    ['1547610000', 'push-in', 800, 24, 4],
    ['1547620000', 'push-in', 800, 24, 4],
    ['1547630000', 'push-in', 800, 24, 4],
    ['2744270000', 'push-in', 800, 24, 4],
    ['2744240000', 'push-in', 800, 24, 4],
    ['2744230000', 'push-in', 800, 24, 4],
    ['3025940000', 'push-in', 800, 24, 4],
    ['2539970000', 'push-in', 800, 32, 6],
    ['2540040000', 'push-in', 800, 32, 6],
    ['2552480000', 'push-in', 800, 32, 6]
  ]) {
    const part = engine.component('weidmuller-' + id);
    const specs = part.specifications;
    assert.ok(part.sources[0].url.endsWith(id));
    assert.deepEqual([specs.nominalVoltage.value, specs.nominalCurrent.value], [voltage, current]);
    assert.equal(specs.flexibleConductorRange.maximum, maxFlexible);
    assert.equal(specs.connectionCount.value, 4);
    assert.ok(part.symbol.pins.every(pin => pin.connectionType === method));
    const block = engine.createInstance(part.id, 100, 100, 'X1');
    const wires = engine.worldPins(block).map((pin, index) => ({
      id: 'level-wire-' + index, kind: 'wire', x: pin.x, y: pin.y, x1: pin.x, y1: pin.y,
      x2: pin.x + (pin.x < block.x ? -25 : 25), y2: pin.y,
      pinAttachments: { start: { instanceId: block.id, pinId: pin.id }, end: null }
    }));
    assert.deepEqual(engine.analyze([block, ...wires]).nets.map(net => net.wireIds),
      [['level-wire-0', 'level-wire-1'], ['level-wire-2', 'level-wire-3']]);
  }
});

test('Finder Series 40 catalog order codes carry five distinct schematic pins and source-backed dimensions', () => {
  const parts = engine.catalog('Finder Series 40').filter(item => /^finder-4031[789]/.test(item.id));
  assert.equal(parts.length, 135);
  assert.equal(new Set(parts.map(part => part.id)).size, parts.length);
  const coilTypes = new Set();
  for (const item of parts) {
    const part = engine.component(item.id);
    const orderCode = part.manufacturerPartNumber.replaceAll('.', '');
    assert.equal(item.tag, 'K');
    assert.equal(part.model, part.manufacturerPartNumber);
    assert.equal(part.sources[0].title, 'Finder BMEcat · Order ' + orderCode);
    assert.equal(part.sources[2].url, 'https://www.findernet.com/en/p/' + orderCode);
    assert.deepEqual(part.symbol.pins.map(pin => pin.localNumber), ['A2', 'A1', '11', '12', '14']);
    assert.equal(new Set(part.symbol.pins.map(pin => pin.id)).size, 5);
    assert.deepEqual(part.symbol.internalConnections, []);
    assert.deepEqual(part.electricalFunctions.changeoverContact.deenergizedConnections, [['contact-11', 'contact-12']]);
    assert.deepEqual(part.electricalFunctions.changeoverContact.energizedConnections, [['contact-11', 'contact-14']]);
    const coilVoltage = part.specifications.nominalCoilVoltage;
    assert.equal(coilVoltage.value, Number(orderCode.slice(5, 8)));
    assert.equal(coilVoltage.unit, orderCode[4] === '8' ? 'V AC' : 'V DC');
    coilTypes.add(coilVoltage.unit);
    assert.deepEqual(part.physicalRepresentations.map(view => [view.width, view.height, view.depth]), [[12.4, 25, 29]]);
  }
  assert.equal(coilTypes.size, 2);
});

test('Finder 46.61 relays expose the verified Faston blade map and changeover states', () => {
  const parts = engine.catalog('Finder Series 46').filter(item => item.id.startsWith('finder-4661'));
  assert.equal(parts.length, 39);
  for (const item of parts) {
    const part = engine.component(item.id);
    assert.deepEqual(part.symbol.pins.map(pin => [pin.localNumber, pin.physicalNumber, pin.connectionType]), [
      ['A2', '1', 'faston-187'], ['A1', '5', 'faston-187'], ['11', '4', 'faston-187'],
      ['12', '2', 'faston-187'], ['14', '3', 'faston-187']
    ]);
    assert.equal(part.specifications.ratedContactCurrent.value, 16);
    assert.ok(part.specifications.options.value);
    assert.deepEqual(part.symbol.internalConnections, []);
    assert.deepEqual(part.electricalFunctions.changeoverContact.deenergizedConnections, [['contact-11', 'contact-12']]);
    assert.deepEqual(part.electricalFunctions.changeoverContact.energizedConnections, [['contact-11', 'contact-14']]);
    const [outline] = part.physicalRepresentations;
    assert.deepEqual([outline.width, outline.height, outline.depth], [12.4, 32.8, 29]);
  }
});

test('Finder 46.52 relays expose separate, correctly mapped changeover poles', () => {
  const parts = engine.catalog('Finder Series 46').filter(item => item.id.startsWith('finder-4652'));
  assert.equal(parts.length, 55);
  for (const item of parts) {
    const part = engine.component(item.id);
    assert.deepEqual(part.symbol.pins.map(pin => [pin.localNumber, pin.physicalNumber]), [
      ['A2', '1'], ['A1', '8'], ['11', '3'], ['12', '2'], ['14', '4'], ['21', '6'], ['22', '7'], ['24', '5']
    ]);
    assert.equal(new Set(part.symbol.pins.map(pin => [pin.x, pin.y].join(','))).size, 8);
    assert.equal(part.specifications.ratedContactCurrent.value, 8);
    assert.deepEqual(part.symbol.internalConnections, []);
    const contacts = part.electricalFunctions.changeoverContacts;
    assert.deepEqual(contacts.flatMap(contact => contact.deenergizedConnections), [
      ['contact-11', 'contact-12'], ['contact-21', 'contact-22']
    ]);
    assert.deepEqual(contacts.flatMap(contact => contact.energizedConnections), [
      ['contact-11', 'contact-14'], ['contact-21', 'contact-24']
    ]);
  }
});

test('Finder 40.52 and 40.62 PCB relays have eight terminals and two distinct switch poles', () => {
  const series = engine.catalog('Finder Series 40');
  const eightAmp = series.filter(item => /^finder-4052[789]/.test(item.id));
  const tenAmp = series.filter(item => item.id.startsWith('finder-4062'));
  assert.equal(eightAmp.length, 177);
  assert.equal(tenAmp.length, 32);
  const parts = [...eightAmp, ...tenAmp];
  for (const item of parts) {
    const part = engine.component(item.id);
    assert.deepEqual(part.symbol.pins.map(pin => pin.localNumber), ['A2', 'A1', '11', '12', '14', '21', '22', '24']);
    assert.ok(part.symbol.pins.every(pin => pin.connectionType === 'pcb-pin'));
    assert.equal(part.specifications.ratedContactCurrent.value, item.id.startsWith('finder-4062') ? 10 : 8);
    assert.equal(part.specifications.terminalPinLength.value, 5.2);
    assert.deepEqual(part.symbol.internalConnections, []);
    assert.deepEqual(part.electricalFunctions.changeoverContacts.map(contact => contact.common), ['contact-11', 'contact-21']);
    assert.deepEqual(part.physicalRepresentations.map(view => [view.width, view.height, view.depth]), [[12.4, 25, 29]]);
  }
});

test('Finder 40.61 relays permanently join paired terminals without joining the switched contacts', () => {
  const parts = engine.catalog('Finder Series 40').filter(item => /^finder-4061[789]/.test(item.id));
  assert.equal(parts.length, 111);
  for (const item of parts) {
    const part = engine.component(item.id);
    assert.equal(part.symbol.pins.length, 8);
    assert.equal(part.specifications.ratedContactCurrent.value, 16);
    assert.deepEqual(part.symbol.internalConnections, [
      ['contact-11', 'contact-21'], ['contact-12', 'contact-22'], ['contact-14', 'contact-24']
    ]);
  }
  const relay = engine.createInstance(parts[0].id, 100, 100, 'K1');
  const wires = engine.worldPins(relay).filter(pin => pin.id.startsWith('contact-')).map(pin => ({
    id: pin.id, kind: 'wire', x: pin.x, y: pin.y, x1: pin.x, y1: pin.y,
    x2: pin.x, y2: pin.y + (pin.y < relay.y ? -20 : 20),
    pinAttachments: { start: { instanceId: relay.id, pinId: pin.id }, end: null }
  }));
  assert.deepEqual(engine.analyze([relay, ...wires]).nets.map(net => net.wireIds), [
    ['contact-11', 'contact-21'], ['contact-12', 'contact-22'], ['contact-14', 'contact-24']
  ]);
});

test('Finder bistable relays describe latched set and reset paths separately from static connectivity', () => {
  const parts = engine.catalog('Finder Series 40').filter(item => /^finder-40\d{2}6/.test(item.id));
  assert.equal(parts.length, 21);
  for (const item of parts) {
    const part = engine.component(item.id);
    assert.equal(part.electricalFunctions.coil.nominalVoltage.unit, 'V AC/DC');
    assert.equal(part.electricalFunctions.coil.minimumSetResetPulseMs, 20);
    const contacts = part.electricalFunctions.changeoverContacts || [part.electricalFunctions.changeoverContact];
    for (const contact of contacts) {
      assert.deepEqual(contact.resetConnections, [[contact.common, contact.normallyClosed]]);
      assert.deepEqual(contact.setConnections, [[contact.common, contact.normallyOpen]]);
      assert.equal(contact.deenergizedConnections, undefined);
      assert.ok(part.symbol.internalConnections.every(pair => !pair.includes(contact.common) || !pair.includes(contact.normallyClosed)));
    }
  }
});

test('Finder 40.51 variants expose terminal 21 as their only common terminal', () => {
  const parts = engine.catalog('Finder Series 40').filter(item => item.id.startsWith('finder-4051'));
  assert.equal(parts.length, 126);
  for (const item of parts) {
    const part = engine.component(item.id);
    assert.deepEqual(part.symbol.pins.map(pin => pin.localNumber), ['A2', 'A1', '21', '12', '14']);
    assert.equal(part.electricalFunctions.changeoverContact.common, 'contact-21');
    assert.equal(part.specifications.socketContactCurrentLimit.value, 10);
    assert.deepEqual(part.symbol.internalConnections, []);
  }
});

test('Finder Series 55 variants preserve PCB and socket pin assignments for each pole count', () => {
  const parts = engine.catalog('Finder Series 55').filter(item => item.id.startsWith('finder-55'));
  assert.equal(parts.length, 534);
  const maps = {
    2: [['11', '9'], ['12', '1'], ['14', '5'], ['41', '12'], ['42', '4'], ['44', '8']],
    3: [['11', '7'], ['12', '1'], ['14', '4'], ['21', '8'], ['22', '2'], ['24', '5'], ['31', '9'], ['32', '3'], ['34', '6']],
    4: [['11', '9'], ['12', '1'], ['14', '5'], ['21', '10'], ['22', '2'], ['24', '6'], ['31', '11'], ['32', '3'], ['34', '7'],
      ['41', '12'], ['42', '4'], ['44', '8']]
  };
  for (const item of parts) {
    const part = engine.component(item.id);
    const poles = part.specifications.changeoverContactCount.value;
    assert.deepEqual(part.symbol.pins.map(pin => [pin.localNumber, pin.physicalNumber]), [['A2', '14'], ['A1', '13'], ...maps[poles]]);
    assert.equal(part.electricalFunctions.changeoverContacts.length, poles);
    assert.equal(part.specifications.ratedContactCurrent.value, poles === 4 ? 7 : 10);
    assert.ok(part.specifications.options.value);
    assert.deepEqual(part.symbol.internalConnections, []);
    const polarity = part.electricalFunctions.coil.polarity;
    assert.deepEqual(polarity, /(?:80|90|94)$/.test(item.id) ? { positive: 'A1', negative: 'A2' } : undefined);
  }
});

test('Finder Series 60 variants carry exact socket and blade terminal assignments', () => {
  const parts = engine.catalog('Finder Series 60').filter(item => item.id.startsWith('finder-60'));
  assert.equal(parts.length, 294);
  const physicalNumbers = {
    '12': ['7', '2', '1', '4', '3', '8', '5', '6'],
    '13': ['10', '2', '1', '4', '3', '6', '5', '7', '11', '8', '9'],
    '62': ['B', 'A', '7', '1', '4', '9', '3', '6'],
    '63': ['B', 'A', '7', '1', '4', '8', '2', '5', '9', '3', '6']
  };
  for (const item of parts) {
    const part = engine.component(item.id);
    const orderCode = part.manufacturerPartNumber.replaceAll('.', '');
    assert.deepEqual(part.symbol.pins.map(pin => pin.physicalNumber), physicalNumbers[orderCode.slice(2, 4)]);
    assert.equal(part.electricalFunctions.changeoverContacts.length, Number(orderCode[3]));
    assert.deepEqual(part.symbol.internalConnections, []);
    assert.equal(part.specifications.ratedContactCurrent.value, orderCode[9] === '2' ? 6 : 10);
    assert.deepEqual(part.electricalFunctions.coil.polarity,
      /(?:60|70|74)$/.test(orderCode) ? { positive: 'A1', negative: 'A2' } : undefined);
  }
});

test('Finder Series 62 variants use their documented outer poles and omit unpopulated NC terminals', () => {
  const parts = engine.catalog('Finder Series 62').filter(item => item.id.startsWith('finder-62'));
  assert.equal(parts.length, 131);
  let normallyOpenCount = 0;
  for (const item of parts) {
    const part = engine.component(item.id);
    const twoPoles = part.manufacturerPartNumber[4] === '2';
    const normallyOpen = Boolean(part.electricalFunctions.normallyOpenContacts);
    if (normallyOpen) normallyOpenCount++;
    const ends = normallyOpen ? ['7', '4', '8', '5', '9', '6'] : ['7', '1', '4', '8', '2', '5', '9', '3', '6'];
    if (twoPoles) ends.splice(normallyOpen ? 2 : 3, normallyOpen ? 2 : 3);
    assert.deepEqual(part.symbol.pins.map(pin => pin.physicalNumber), ['B', 'A', ...ends]);
    assert.deepEqual(part.symbol.internalConnections, []);
    assert.equal(part.specifications.ratedContactCurrent.value, 16);
    assert.ok(part.specifications.options.value);
    if (normallyOpen) {
      assert.equal(part.specifications.minimumContactGap.value, 3);
      for (const contact of part.electricalFunctions.normallyOpenContacts)
        assert.deepEqual(contact.deenergizedConnections, []);
    }
  }
  assert.equal(normallyOpenCount, 30);
});

test('Finder Series 56 variants use the documented coil pins and contact positions', () => {
  const parts = engine.catalog('Finder Series 56').filter(item => item.id.startsWith('finder-56'));
  assert.equal(parts.length, 193);
  assert.equal(parts.filter(item => engine.component(item.id).electricalFunctions.normallyOpenContacts).length, 16);
  for (const item of parts) {
    const part = engine.component(item.id);
    const twoPoles = item.id[10] === '2';
    const normallyOpen = Boolean(part.electricalFunctions.normallyOpenContacts);
    const expected = twoPoles
      ? normallyOpen ? ['8', '7', '5', '3', '6', '4'] : ['8', '7', '5', '1', '3', '6', '2', '4']
      : ['14', '13', '9', '1', '5', '10', '2', '6', '11', '3', '7', '12', '4', '8'];
    assert.deepEqual(part.symbol.pins.map(pin => pin.physicalNumber), expected);
    assert.equal(part.specifications.ratedContactCurrent.value, 12);
    if (normallyOpen) assert.equal(part.specifications.minimumContactGap.value, 1.5);
    if (part.specifications.coilPolarity) assert.match(part.specifications.coilPolarity.value, /pin 7 positive/);
  }
});

test('Finder Series 41 low-profile relays preserve single, dual and paired-terminal topologies', () => {
  const parts = engine.catalog('Finder Series 41').filter(item => item.id.startsWith('finder-41'));
  assert.equal(parts.length, 111);
  for (const item of parts) {
    const part = engine.component(item.id);
    const type = item.id.slice(7, 11);
    const single = type === '4131';
    assert.deepEqual(part.symbol.pins.map(pin => pin.localNumber),
      single ? ['A2', 'A1', '11', '12', '14'] : ['A2', 'A1', '11', '12', '14', '21', '22', '24']);
    assert.deepEqual(part.symbol.internalConnections,
      type === '4161' ? [['contact-11', 'contact-21'], ['contact-12', 'contact-22'], ['contact-14', 'contact-24']] : []);
    assert.equal(part.specifications.contactPinPitch.value, single ? 3.5 : 5);
    assert.equal(part.specifications.dimensions.height.value, 15.7);
  }
});

test('Finder Series 43 variants use the correct SPST and SPDT terminals and outlines', () => {
  const items = engine.catalog('Finder Series 43').filter(item => item.id.startsWith('finder-43'));
  assert.equal(items.length, 48);
  const noParts = items.filter(item => engine.component(item.id).electricalFunctions.normallyOpenContacts);
  assert.equal(noParts.length, 7);
  for (const item of items) {
    const part = engine.component(item.id);
    const normallyOpen = Boolean(part.electricalFunctions.normallyOpenContacts);
    assert.deepEqual(part.symbol.pins.map(pin => pin.localNumber),
      normallyOpen ? ['A2', 'A1', '11', '14'] : ['A2', 'A1', '11', '12', '14']);
    assert.equal(part.specifications.contactPinPitch.value, normallyOpen ? 5 : 3.2);
    assert.equal(part.physicalRepresentations[0].depth, normallyOpen ? 28.6 : 30.2);
    assert.equal(part.physicalRepresentations[0].sourceIndex, 1);
  }
});

test('Finder Series 66 variants carry distinct throw ratings and physical terminal positions', () => {
  const parts = engine.catalog('Finder Series 66').filter(item => item.id.startsWith('finder-66'));
  assert.equal(parts.length, 57);
  for (const item of parts) {
    const part = engine.component(item.id);
    const normallyOpen = Boolean(part.electricalFunctions.normallyOpenContacts);
    assert.deepEqual(part.symbol.pins.map(pin => pin.physicalNumber),
      normallyOpen ? ['1', '0', '4', '2', '8', '6'] : ['1', '0', '4', '3', '2', '8', '7', '6']);
    assert.equal(part.specifications.ratedContactCurrent.value, normallyOpen ? 30 : 10);
    if (!normallyOpen) assert.equal(part.specifications.normallyOpenRatedCurrent.value, 30);
    assert.equal(part.specifications.minimumContactGap?.value, item.id[16] === '6' ? 1.5 : undefined);
    assert.equal(part.physicalRepresentations[0].depth, item.id.startsWith('finder-662') ? 51.5 : 68.5);
  }
});

test('Finder Series 45 relays expose only their fitted throw and match the documented contact gap', () => {
  const parts = engine.catalog('Finder Series 45').filter(item => item.id.startsWith('finder-45'));
  assert.equal(parts.length, 24);
  for (const item of parts) {
    const part = engine.component(item.id);
    const circuit = item.id[16];
    const closed = circuit === '4';
    const contacts = part.electricalFunctions[closed ? 'normallyClosedContacts' : 'normallyOpenContacts'];
    assert.deepEqual(part.symbol.pins.map(pin => pin.localNumber), ['A2', 'A1', '11', closed ? '12' : '14']);
    assert.deepEqual(contacts[0].deenergizedConnections, closed ? [['contact-11', 'contact-12']] : []);
    assert.deepEqual(contacts[0].energizedConnections, closed ? [] : [['contact-11', 'contact-14']]);
    assert.equal(part.specifications.minimumContactGap?.value, item.id.startsWith('finder-4571') ? undefined : circuit === '6' ? 3.6 : 3);
    assert.equal(part.symbol.pins[2].connectionType, item.id.startsWith('finder-4531') ? 'pcb-pin' : 'faston-250');
  }
});

test('Finder short-pin PCB variants report the documented 3.5 mm terminal length', () => {
  const parts = engine.catalog('Finder Series 40').filter(item => /^finder-40\d{8}2[01]$/.test(item.id));
  assert.equal(parts.length, 11);
  for (const item of parts) {
    const part = engine.component(item.id);
    assert.equal(part.specifications.terminalPinLength.value, 3.5);
    assert.equal(part.specifications.ratedContactCurrent.value, item.id.startsWith('finder-4061') ? 16 : 12);
  }
});

test('terminal panel envelopes use manufacturer dimensions independently of schematic scale', () => {
  const id = 'phoenix-contact-3210499';
  const part = engine.component(id);
  const [view] = part.physicalRepresentations;
  assert.deepEqual([view.unit, view.width, view.height, view.railDepths], ['mm', 5.2, 102.2, { 'NS 35/7.5': 58, 'NS 35/15': 65.5 }]);
  assert.ok(part.sources[view.sourceIndex].url.endsWith('3210499'));
  const envelope = engine.createPanelEnvelope(id, 'front-1', 20, 40);
  assert.deepEqual(envelope, {
    id: 'front-1', kind: 'rect', x: 20, y: 40, x1: 20, y1: 40, x2: 25.2, y2: 142.2,
    manufacturerPartNumber: '3210499', physicalRepresentationId: view.id
  });
  envelope.sheetId = 'panel';
  const reopened = engine.parseProject(engine.serializeProject({
    project: 'Panel envelope', sheets: [{ id: 'panel', name: 'Panel' }], objects: [envelope]
  }));
  assert.equal(reopened.valid, true, reopened.errors.join(' '));
  assert.deepEqual(reopened.project.objects, [envelope]);
  assert.notEqual(part.symbol.width, view.width);
  assert.equal(engine.createPanelEnvelope('unknown', 'missing', 0, 0), null);
});

test('direct catalog lookup matches searchable entries and protects the index', () => {
  for (const item of engine.catalog()) {
    const direct = engine.catalogItem(item.id);
    assert.deepEqual(direct, item);
    direct.name = 'Edited result';
    assert.equal(engine.catalogItem(item.id).name, item.name);
  }
  assert.equal(engine.catalogItem('missing-component'), null);
  assert.equal(engine.catalogItem('constructor'), null);
});

test('ETITRAFO transformer orders preserve primary taps and the secondary winding layout', () => {
  const items = engine.catalog('ETITRAFO').filter(item => item.family === 'single-phase-transformer');
  assert.equal(items.length, 197);
  for (const { id } of items) {
    const part = engine.component(id);
    const { primaryWinding, secondaryWindings } = part.electricalFunctions;
    assert.deepEqual([...primaryWinding, ...secondaryWindings.flat()], part.symbol.pins.map(pin => pin.id));
    assert.deepEqual(part.symbol.internalConnections, []);
    assert.ok(engine.transformerGeometry(part).segments.flat().every(Number.isFinite));
  }
  const tapped = engine.component('eti-003801121');
  assert.deepEqual(tapped.symbol.pins.map(pin => pin.manufacturerMarking), ['0', '230', '400', '12', '0', '12']);
  assert.deepEqual(tapped.specifications.apparentPower, { value: 40, unit: 'VA' });
  const dual = engine.component('eti-003801812');
  assert.deepEqual(dual.electricalFunctions.primaryWinding, ['primary-minus15', 'primary-0', 'primary-plus15', 'primary-230', 'primary-400']);
  assert.deepEqual(dual.electricalFunctions.secondaryWindings, [
    ['secondary-1-1', 'secondary-1-2'], ['secondary-2-1', 'secondary-2-2']
  ]);
  assert.deepEqual(dual.specifications.secondaryVoltage, { value: '2 × 12', unit: 'V AC' });
  assert.equal(dual.specifications.enclosureRating.value, 'IP20');
  const single = engine.component('eti-003801862');
  assert.equal(single.specifications.secondaryWindingArrangement.value, 'Single secondary winding');
  assert.equal(engine.component('eti-003801831').specifications.transformerClassification.value, 'Insulating transformer');
});

test('ETIBREAK EB2 order codes retain separate switched pairs and voltage-specific breaking capacities', () => {
  const items = engine.catalog('ETIBREAK').filter(item => item.family === 'molded-case-circuit-breaker' && item.name.includes('EB2 '));
  assert.equal(items.length, 145);
  for (const { id } of items) {
    const part = engine.component(id);
    const poles = part.specifications.poleCount.value;
    const pairs = Array.from({ length: poles }, (_, index) => ['line-' + (index + 1), 'load-' + (index + 1)]);
    assert.ok([3, 4].includes(poles));
    assert.deepEqual(part.symbol.pins.map(pin => pin.id), pairs.flat());
    assert.deepEqual(part.electricalFunctions.switchedPolePairs, pairs);
    assert.deepEqual(part.symbol.internalConnections, []);
    const { ratedBreakingCapacity: icu, ratedServiceBreakingCapacity: ics } = part.specifications;
    assert.equal(icu.unit, 'kA at 415 V AC');
    assert.equal(ics.unit, icu.unit);
    assert.ok(icu.value >= ics.value);
  }
  const sample = engine.component('eti-004671027');
  assert.equal(sample.specifications.ratedBreakingCapacity.value, 25);
  assert.equal(sample.specifications.ratedServiceBreakingCapacity.value, 19);
  const view = sample.physicalRepresentations[0];
  assert.deepEqual([view.width, view.height, view.depth], [120, 155, 92]);
});

test('ETIBREAK EB2S preserves fixed and adjustable trips and distinct capacity test voltages', () => {
  const entries = engine.catalog('EB2S').filter(item => item.family === 'molded-case-circuit-breaker');
  assert.equal(entries.length, 132);
  for (const { id } of entries) {
    const part = engine.component(id);
    const spec = part.specifications;
    assert.equal(spec.ratedBreakingCapacity.unit, 'kA at 400 V AC');
    assert.equal(spec.ratedServiceBreakingCapacity.unit, 'kA at 400 V AC');
    assert.equal(part.symbol.pins.length, spec.poleCount.value * 2);
    assert.equal(part.electricalFunctions.switchedPolePairs.length, spec.poleCount.value);
    assert.deepEqual(part.symbol.internalConnections, []);
  }
  const fixed = engine.component('eti-004671814');
  assert.equal(fixed.specifications.thermalAdjustment.value, 'Fixed');
  assert.equal(fixed.specifications.magneticAdjustment.value, 'Fixed');
  const adjustable = engine.component('eti-004671917');
  assert.equal(adjustable.specifications.ratedServiceBreakingCapacity.value, 19);
  assert.deepEqual(adjustable.specifications.ratedBreakingCapacityAt415, { value: '25/13', unit: 'kA at 415 V AC' });
  assert.equal(adjustable.specifications.thermalAdjustment.value, '0.63–1 × In');
  assert.equal(adjustable.specifications.magneticAdjustment.value, '5–11 × In');
  const { width, height, depth } = adjustable.physicalRepresentations[0];
  assert.deepEqual([width, height, depth], [140, 165, 92]);
});

test('ETIMAT 6 breakers expose documented protected and switched neutral poles', () => {
  const items = engine.catalog('ETI ETIMAT 6').filter(item => item.name.startsWith('ETIMAT 6 '));
  assert.equal(items.length, 127);
  for (const item of items) {
    const definition = engine.component(item.id);
    const { protectedPoles, switchedNeutral, ratedBreakingCapacity } = definition.specifications;
    const numbers = Array.from({ length: protectedPoles.value }, (_, index) => [String(2 * index + 2), String(2 * index + 1)]);
    if (switchedNeutral.value) numbers.push(['02', '01']);
    assert.deepEqual(definition.symbol.pins.map(pin => pin.localNumber), numbers.flat());
    assert.deepEqual(definition.electricalFunctions.switchedPolePairs, numbers.map(pair => pair.map(number => 'terminal-' + number)));
    assert.deepEqual(definition.symbol.internalConnections, []);
    assert.equal(ratedBreakingCapacity.value, 6);
  }
});

test('ETIMAT P-series breakers follow their separate terminal numbering and breaking capacities', () => {
  for (const [series, count, capacity] of [['P6', 135, 6], ['P10', 338, 10]]) {
    const items = engine.catalog('ETI ETIMAT ' + series).filter(item => item.name.startsWith('ETIMAT ' + series + ' '));
    assert.equal(items.length, count);
    for (const item of items) {
      const part = engine.component(item.id);
      const { protectedPoles, switchedNeutral, ratedBreakingCapacity, dimensions } = part.specifications;
      const terminals = Array.from({ length: protectedPoles.value }, (_, index) => [String(2 * index + 1), String(2 * index + 2)]).flat();
      if (switchedNeutral.value) terminals.push('01', '02');
      assert.deepEqual(part.symbol.pins.map(pin => pin.localNumber), terminals);
      assert.equal(ratedBreakingCapacity.value, capacity);
      assert.deepEqual([dimensions.height.value, dimensions.depth.value], [88, 69.5]);
    }
  }
});

test('ETIMAT 10 breakers follow the ASTI wiring and panel diagrams for both current ranges', () => {
  const items = engine.catalog('ETI ETIMAT 10').filter(item => item.name.startsWith('ETIMAT 10 '));
  assert.equal(items.length, 116);
  let highCurrentCount = 0;
  for (const item of items) {
    const part = engine.component(item.id);
    const { protectedPoles, switchedNeutral, nominalCurrent, ratedBreakingCapacity, dimensions } = part.specifications;
    const terminals = Array.from({ length: protectedPoles.value }, (_, index) => [String(2 * index + 2), String(2 * index + 1)]).flat();
    if (switchedNeutral.value) terminals.push('02', '01');
    assert.deepEqual(part.symbol.pins.map(pin => pin.localNumber), terminals);
    if (nominalCurrent.value >= 80) {
      highCurrentCount++;
      const capacity = nominalCurrent.value === 125 || (part.specifications.tripCurve.value === 'D' && nominalCurrent.value === 100) ? 15 : 20;
      assert.equal(ratedBreakingCapacity.value, capacity);
      assert.equal(part.specifications.breakingCapacityStandard.value, 'EN 60947-2');
      assert.deepEqual([dimensions.width.value, dimensions.height.value], [27 * terminals.length / 2, 90]);
      continue;
    }
    assert.ok(nominalCurrent.value <= 40);
    assert.equal(ratedBreakingCapacity.value, 10);
    assert.ok(Math.abs(dimensions.width.value - 17.6 * terminals.length / 2) < 1e-9);
    assert.deepEqual([dimensions.height.value, dimensions.depth.value], [85, 67.7]);
  }
  assert.equal(highCurrentCount, 38);
});

test('ETIMAT P10-DC exposes documented polarity for one- and two-pole breakers', () => {
  const items = engine.catalog('ETI ETIMAT P10-DC');
  assert.equal(items.length, 72);
  for (const item of items) {
    const part = engine.component(item.id);
    const { protectedPoles, nominalVoltage, ratedBreakingCapacity, dimensions } = part.specifications;
    const onePole = protectedPoles.value === 1;
    assert.deepEqual(part.symbol.pins.map(pin => pin.localNumber), onePole ? ['1', '2'] : ['1', '2', '3', '4']);
    assert.deepEqual(part.symbol.pins.map(pin => pin.name.slice(-3)), onePole ? ['(−)', '(+)'] : ['(−)', '(+)', '(+)', '(−)']);
    assert.deepEqual(nominalVoltage, { value: onePole ? '220' : '440', unit: 'V DC' });
    assert.equal(ratedBreakingCapacity.value, 10);
    assert.deepEqual([dimensions.width.value, dimensions.height.value, dimensions.depth.value], [onePole ? 17.8 : 35.6, 89, 74.74]);
  }
});

test('ETIMAT P10-QC uses the Quick Connect terminal diagram', () => {
  const items = engine.catalog('ETI ETIMAT P10-QC');
  assert.equal(items.length, 22);
  for (const item of items) {
    const part = engine.component(item.id);
    assert.deepEqual(part.symbol.pins.map(pin => pin.localNumber), ['2', '1', '4', '3', '6', '5', '02', '01']);
    assert.equal(part.specifications.connectionMethod.value, 'Quick Connect');
    assert.equal(part.specifications.ratedBreakingCapacity.value, 10);
    assert.deepEqual([part.specifications.dimensions.width.value, part.specifications.dimensions.height.value, part.specifications.dimensions.depth.value], [72, 90.1, 74.47]);
  }
});

test('ETI CH cartridge dimensions and fuse terminals follow the manufacturer drawing', () => {
  const items = engine.catalog().filter(item => item.family === 'cylindrical-fuse-link' && / (gG|aM) /.test(item.name));
  assert.equal(items.length, 106);
  const envelopes = { '8x32': [31.5, 8.5], '10x38': [38, 10.3], '14x51': [51, 14.3], '22x58': [58, 22.2] };
  for (const item of items) {
    const part = engine.component(item.id);
    const { dimensions, cartridgeSize, ratedBreakingCapacity } = part.specifications;
    assert.deepEqual([dimensions.width.value, dimensions.height.value], envelopes[cartridgeSize.value]);
    assert.deepEqual(part.symbol.pins.map(pin => pin.id), ['cap-left', 'cap-right']);
    assert.deepEqual(part.electricalFunctions.protectedTerminalPair, ['cap-left', 'cap-right']);
    assert.deepEqual(part.symbol.internalConnections, []);
    assert.equal(ratedBreakingCapacity.value, cartridgeSize.value === '8x32' ? 20 : 120);
  }
});

test('ETI miniature fuses preserve table ratings and end-cap terminals across both sizes', () => {
  const items = engine.catalog('minifuse');
  assert.equal(items.length, 224);
  for (const item of items) {
    const part = engine.component(item.id);
    const size = part.specifications.cartridgeSize.value;
    const { width, height, depth } = part.physicalRepresentations[0];
    assert.deepEqual([width, height, depth], size === '5x20' ? [20, 5, 5] : [32, 6.3, 6.3]);
    assert.deepEqual(part.electricalFunctions.protectedTerminalPair, ['cap-left', 'cap-right']);
    assert.deepEqual(part.symbol.internalConnections, []);
  }
  const fast = engine.component('eti-006710009').specifications;
  assert.equal(fast.nominalCurrent.value, 0.1);
  assert.equal(fast.ratedBreakingCapacity.value, 0.035);
  assert.equal(engine.component('eti-006710319').specifications.ratedBreakingCapacity.value, 1.5);
});

test('ETI NH gG fuse links preserve blade contacts and AC ratings across ten case sizes', () => {
  const items = engine.catalog().filter(item => item.family === 'knife-blade-fuse-link' &&
    !item.name.includes('/I') && item.name.includes(' gG ') && !engine.component(item.id).specifications.coverMaterial);
  assert.equal(items.length, 295);
  const envelopes = {
    NH000: [78.6, 51.9, 21], NH00: [79, 56, 28], NH0: [125, 56, 28],
    NH1C: [135, 61, 28], NH1: [135, 65, 46], NH2C: [150, 73, 46], NH2: [150, 73, 54],
    NH3C: [150, 84, 54], NH3: [150, 84, 65], NH4a: [200, 121, 95]
  };
  assert.deepEqual([...new Set(items.map(item => engine.component(item.id).specifications.cartridgeSize.value))].sort(), Object.keys(envelopes).sort());
  for (const item of items) {
    const part = engine.component(item.id);
    const { dimensions, cartridgeSize, nominalVoltage, utilizationCategory, ratedBreakingCapacity } = part.specifications;
    assert.deepEqual([dimensions.width.value, dimensions.height.value, dimensions.depth.value], envelopes[cartridgeSize.value]);
    assert.deepEqual(part.symbol.pins.map(pin => pin.id), ['blade-left', 'blade-right']);
    assert.deepEqual(part.electricalFunctions.protectedTerminalPair, ['blade-left', 'blade-right']);
    assert.deepEqual(part.symbol.internalConnections, []);
    assert.equal(utilizationCategory.value, 'gG');
    assert.equal(nominalVoltage.unit, 'V AC');
    assert.ok([50, 100, 120].includes(ratedBreakingCapacity.value));
  }
});

test('ETI NH fuse variants preserve insulated grips and aM utilization ratings', () => {
  const parts = engine.catalog().filter(item => item.family === 'knife-blade-fuse-link').map(item => engine.component(item.id));
  const insulated = parts.filter(part => part.model.includes('/I'));
  const motor = parts.filter(part => part.specifications.utilizationCategory.value === 'aM');
  assert.equal(insulated.filter(part => part.specifications.utilizationCategory.value === 'gG').length, 226);
  assert.equal(motor.length, 78);
  assert.deepEqual([...new Set(motor.map(part => part.specifications.cartridgeSize.value))].sort(),
    ['NH0', 'NH00', 'NH000', 'NH1', 'NH2', 'NH2C', 'NH3', 'NH4a']);
  for (const part of insulated) {
    assert.equal(part.specifications.insulatedGrippingLugs.value, true);
    assert.deepEqual(part.symbol.pins.map(pin => pin.id), ['blade-left', 'blade-right']);
  }
  for (const part of motor) {
    const voltage = part.specifications.nominalVoltage.value;
    assert.ok([500, 690].includes(voltage));
    assert.equal(part.specifications.ratedBreakingCapacity.value, voltage === 690 ? 100 : 120);
  }
  const wiring = parts.filter(part => part.specifications.utilizationCategory.value === 'gF' && !part.specifications.coverMaterial);
  const transformers = parts.filter(part => part.specifications.utilizationCategory.value === 'gTr');
  assert.equal(wiring.length, 22);
  assert.equal(transformers.length, 47);
  for (const part of [...wiring, ...transformers]) {
    assert.equal(part.specifications.ratedBreakingCapacity.value, 100);
    assert.equal(part.specifications.nominalVoltage.value, 400);
    assert.deepEqual(part.electricalFunctions.protectedTerminalPair, ['blade-left', 'blade-right']);
    assert.deepEqual(part.symbol.internalConnections, []);
  }
  const transformer = engine.component('eti-004116400');
  assert.deepEqual(transformer.specifications.ratedTransformerPower, { value: 50, unit: 'kVA' });
  assert.equal(transformer.specifications.nominalCurrent.value, 72);
});

test('ETI NH steel-cover fuse links retain order-specific dimensions and distinct gG and gF ratings', () => {
  const items = engine.catalog('NH-Fe');
  assert.equal(items.length, 94);
  const envelopes = {
    NH00: [78.8, 56.3, 29.5], NH1C: [136, 64.5, 29], NH1: [135.6, 64.5, 46],
    NH2C: [150.2, 72.5, 46], NH2: [150.2, 72.5, 54]
  };
  for (const { id } of items) {
    const part = engine.component(id);
    const { coverMaterial, cartridgeSize, nominalVoltage, utilizationCategory, ratedBreakingCapacity } = part.specifications;
    const { width, height, depth } = part.physicalRepresentations[0];
    assert.equal(coverMaterial.value, 'Steel');
    assert.deepEqual(nominalVoltage, { value: 500, unit: 'V AC' });
    assert.equal(ratedBreakingCapacity.value, utilizationCategory.value === 'gF' ? 110 : 120);
    assert.deepEqual([width, height, depth], envelopes[cartridgeSize.value]);
    assert.deepEqual(part.electricalFunctions.protectedTerminalPair, ['blade-left', 'blade-right']);
    assert.deepEqual(part.symbol.internalConnections, []);
    assert.ok(part.sources[1].url.includes(part.manufacturerPartNumber));
  }
});

test('ETI photovoltaic fuses expose DC ratings and distinct cartridge outlines', () => {
  const items = engine.catalog().filter(item => item.family === 'cylindrical-fuse-link' && item.name.includes(' gPV '));
  assert.equal(items.length, 45);
  const dimensionsBySize = { '10x38': [38.2, 10.2], '10x85': [85, 10], '14x51': [51, 14.3] };
  for (const item of items) {
    const part = engine.component(item.id);
    const { nominalVoltage, ratedBreakingCapacity, cartridgeSize, dimensions } = part.specifications;
    assert.equal(nominalVoltage.unit, 'V DC');
    assert.ok([10, 30, 50].includes(ratedBreakingCapacity.value));
    assert.deepEqual([dimensions.width.value, dimensions.height.value], dimensionsBySize[cartridgeSize.value]);
    assert.deepEqual(part.symbol.pins.map(pin => pin.id), ['cap-left', 'cap-right']);
  }
  assert.equal(engine.component('eti-002625103').specifications.ratedBreakingCapacity.value, 10);
  assert.equal(engine.component('eti-002625085').specifications.ratedBreakingCapacity.value, 30);
  assert.equal(engine.component('eti-002625200').specifications.ratedBreakingCapacity.value, 50);
});

test('ETI NH battery fuses retain DC ratings and the contacts of each mounting format', () => {
  const items = engine.catalog().filter(item => item.family === 'knife-blade-fuse-link' && item.name.includes(' gBat '));
  assert.equal(items.length, 230);
  for (const item of items) {
    const part = engine.component(item.id);
    const { cartridgeSize, nominalVoltage, ratedBreakingCapacity, ratedDcTimeConstant } = part.specifications;
    assert.equal(nominalVoltage.unit, 'V DC');
    assert.equal(ratedBreakingCapacity.value, nominalVoltage.value === 80 ? 50 : 30);
    assert.ok(ratedDcTimeConstant.value > 0);
    assert.deepEqual(part.electricalFunctions.protectedTerminalPair, ['blade-left', 'blade-right']);
    assert.deepEqual(part.symbol.internalConnections, []);
    const contactType = cartridgeSize.value.endsWith('/110') ? 'slotted-blade' : 'knife-blade';
    assert.deepEqual(part.symbol.pins.map(pin => pin.connectionType), [contactType, contactType]);
    assert.equal(part.specifications.indicator?.value, cartridgeSize.value.endsWith('/K') ? 'Striker pin' : undefined);
  }
  const envelope = engine.component('eti-004723305').physicalRepresentations[0];
  assert.deepEqual([envelope.width, envelope.height, envelope.depth], [140, 51, 46]);
});

test('ETI NH photovoltaic fuses retain the DC time constant and slotted contact forms', () => {
  const items = engine.catalog().filter(item => item.family === 'knife-blade-fuse-link' && item.name.includes(' gPV '));
  assert.equal(items.length, 132);
  const caseDimensions = {
    NH1XL: [192, 67, 51], NH2XL: [208, 71, 61], NH3L: [208, 87, 73],
    NHS1XL: [200, 51, 51], NHS2XL: [200, 61, 61], NHS3L: [200, 73, 73],
    NHU1XL: [200, 51, 51], NHU2XL: [200, 61, 61], NHU3L: [200, 73, 73]
  };
  for (const item of items) {
    const part = engine.component(item.id);
    const { nominalVoltage, ratedDcTimeConstant, ratedBreakingCapacity, cartridgeSize, dimensions } = part.specifications;
    assert.equal(nominalVoltage.unit, 'V DC');
    assert.ok([2, 3, 5].includes(ratedDcTimeConstant.value));
    assert.ok([10, 30, 50, 70].includes(ratedBreakingCapacity.value));
    assert.deepEqual([dimensions.width.value, dimensions.height.value, dimensions.depth.value], caseDimensions[cartridgeSize.value]);
    const contactType = /^NH[SU]/.test(cartridgeSize.value) ? 'slotted-blade' : 'knife-blade';
    assert.deepEqual(part.symbol.pins.map(pin => [pin.id, pin.connectionType]), [['blade-left', contactType], ['blade-right', contactType]]);
  }
  const rated70kA = engine.component('eti-004110714');
  assert.deepEqual(rated70kA.specifications.ratedBreakingCapacity, { value: 70, unit: 'kA' });
  assert.deepEqual(rated70kA.specifications.ratedDcTimeConstant, { value: 3, unit: 'ms' });
});

test('ETI VV fuses distinguish fitting length, end-cap span and striker variants', () => {
  const items = engine.catalog().filter(item => item.family === 'medium-voltage-fuse-link');
  assert.equal(items.length, 427);
  for (const item of items) {
    const part = engine.component(item.id);
    const { nominalVoltage, nominalCurrent, minimumBreakingCurrent, cartridgeSize, dimensions, thermalStriker, strikerForce } = part.specifications;
    assert.equal(nominalVoltage.unit, 'kV AC');
    assert.equal(dimensions.width.value, cartridgeSize.value + 66);
    assert.ok([53, 68, 83.5].includes(dimensions.height.value));
    assert.ok(minimumBreakingCurrent.value >= nominalCurrent.value);
    assert.equal(thermalStriker.value, item.name.startsWith('VVT-D3 '));
    assert.equal(strikerForce.value, thermalStriker.value ? 80 : 50);
    assert.deepEqual(part.symbol.pins.map(pin => pin.id), ['cap-left', 'cap-right']);
    assert.deepEqual(part.symbol.internalConnections, []);
  }
  const part = engine.component('eti-004220503');
  assert.equal(part.physicalRepresentations[0].width, 358);
  assert.deepEqual(part.specifications.ratedBreakingCapacity, { value: 63, unit: 'kA' });
});

test('ETI D and D0 bottle fuses retain separate AC and DC ratings and contact geometry', () => {
  const items = engine.catalog().filter(item => item.family === 'bottle-fuse-link');
  assert.equal(items.length, 90);
  for (const item of items) {
    const part = engine.component(item.id);
    assert.deepEqual(part.symbol.pins.map(pin => pin.id), ['cap-head', 'cap-foot']);
    assert.deepEqual(part.electricalFunctions.protectedTerminalPair, ['cap-head', 'cap-foot']);
    assert.deepEqual(part.symbol.internalConnections, []);
    assert.equal(part.specifications.nominalVoltage.unit, 'V AC');
  }
  const d02 = engine.component('eti-002212005');
  assert.equal(d02.specifications.fuseBase.value, 'E18');
  assert.deepEqual(d02.specifications.ratedDcVoltage, { value: 250, unit: 'V DC' });
  assert.deepEqual(d02.specifications.ratedDcBreakingCapacity, { value: 8, unit: 'kA' });
  assert.equal(d02.specifications.dimensions.height.value, 15.9);
  const longDiii = engine.component('eti-002313501');
  assert.equal(longDiii.specifications.dimensions.width.value, 70);
  assert.equal(longDiii.specifications.ratedDcVoltage.value, 600);
});

test('ETI EFH DC fuse holders retain separate fuse poles and exact net dimensions', () => {
  const items = engine.catalog().filter(item => item.family === 'cylindrical-fuse-holder');
  assert.equal(items.length, 20);
  for (const item of items) {
    const part = engine.component(item.id);
    const { poles, nominalVoltage, cartridgeSize } = part.specifications;
    const pairs = poles.value === 1 ? [['terminal-2', 'terminal-1']] : [['terminal-2', 'terminal-1'], ['terminal-4', 'terminal-3']];
    assert.deepEqual(part.symbol.pins.map(pin => pin.id), pairs.flat());
    assert.deepEqual(part.electricalFunctions.protectedTerminalPairs, pairs);
    assert.deepEqual(part.symbol.internalConnections, []);
    assert.ok(['10x38', '14x51', '22x58'].includes(cartridgeSize.value));
    assert.equal(nominalVoltage.unit, 'V DC');
  }
  const adapter = engine.component('eti-002540501');
  assert.equal(adapter.specifications.adapter.value, true);
  assert.equal(adapter.specifications.dimensions.depth.value, 71.25);
  const led = engine.component('eti-002560215');
  assert.equal(led.specifications.indicator.value, 'LED');
  assert.equal(led.specifications.nominalVoltage.value, 1100);
  assert.equal(led.physicalRepresentations[0].width, 54);
});

test('ETI KZS-4M RCBOs preserve terminal order and residual release ratings', () => {
  const items = engine.catalog().filter(item => item.family === 'residual-current-circuit-breaker' && item.name.startsWith('KZS-4M '));
  assert.equal(items.length, 143);
  for (const item of items) {
    const part = engine.component(item.id);
    const { residualCurrentType, ratedResidualCurrent, protectedPoles, switchedNeutral, ratedBreakingCapacity } = part.specifications;
    const pins = protectedPoles.value === 2 ? ['4', '3', '2', '1'] : ['6', '5', '4', '3', '2', '1'];
    if (switchedNeutral.value) pins.push('N-upper', 'N-lower');
    assert.deepEqual(part.symbol.pins.map(pin => pin.id), pins.map(pin => 'terminal-' + pin));
    assert.deepEqual(part.symbol.internalConnections, []);
    assert.ok(['A', 'AC', 'B'].includes(residualCurrentType.value));
    assert.ok([30, 100, 300, 500].includes(ratedResidualCurrent.value));
    assert.equal(ratedBreakingCapacity.value, switchedNeutral.value ? 6 : 10);
  }
  const neutral = engine.component('eti-002174625');
  assert.equal(neutral.specifications.ratedResidualCurrent.value, 500);
  assert.deepEqual(neutral.symbol.pins.slice(-2).map(pin => [pin.localNumber, pin.manufacturerMarking]), [['N-upper', 'N'], ['N-lower', 'N']]);
});

test('ETI KZS-2M variants use the separate neutral and two-protected-pole diagrams', () => {
  for (const [series, count, terminals, dimensions] of [
    ['KZS-2M', 110, ['2', '1', 'N-upper', 'N-lower'], [35, 88]],
    ['KZS-2M2p', 30, ['4', '3', '2', '1'], [35.6, 88.4]]
  ]) {
    const items = engine.catalog().filter(item => item.family === 'residual-current-circuit-breaker' && item.name.startsWith(series + ' '));
    assert.equal(items.length, count);
    for (const item of items) {
      const part = engine.component(item.id);
      const specs = part.specifications;
      assert.deepEqual(part.symbol.pins.map(pin => pin.id), terminals.map(terminal => 'terminal-' + terminal));
      assert.deepEqual(part.symbol.internalConnections, []);
      assert.equal(specs.protectedPoles.value, series === 'KZS-2M' ? 1 : 2);
      assert.equal(specs.switchedNeutral.value, series === 'KZS-2M');
      assert.equal(specs.ratedBreakingCapacity.value, 10);
      assert.deepEqual([specs.dimensions.width.value, specs.dimensions.height.value], dimensions);
    }
  }
});

test('ETI KZS-1M UNI breakers have distinct line and neutral attachment IDs', () => {
  const items = engine.catalog().filter(item => item.name.startsWith('KZS-1M-UNI '));
  assert.equal(items.length, 72);
  for (const item of items) {
    const part = engine.component(item.id);
    const specs = part.specifications;
    assert.deepEqual(part.symbol.pins.map(pin => [pin.id, pin.manufacturerMarking || pin.localNumber]),
      [['terminal-2', '2'], ['terminal-1', '1'], ['terminal-N-upper', 'N'], ['terminal-N-lower', 'N']]);
    assert.equal(specs.supplyConnection.value, 'Top or bottom');
    assert.equal(specs.ratedBreakingCapacity.value, 6);
    assert.ok([10, 30, 100].includes(specs.ratedResidualCurrent.value));
    assert.deepEqual([specs.dimensions.width.value, specs.dimensions.height.value, specs.dimensions.depth.value], [17.9, 88.2, 73.97]);
    assert.equal(part.physicalRepresentations[0].sourceIndex, 2);
  }
});

test('ETI KZS-1M-FN breakers retain continuous neutral and separate functional earth', () => {
  const items = engine.catalog().filter(item => item.name.startsWith('KZS-1M-FN '));
  assert.equal(items.length, 44);
  for (const item of items) {
    const part = engine.component(item.id);
    assert.deepEqual(part.symbol.pins.map(pin => pin.id),
      ['terminal-2', 'terminal-1', 'terminal-N-upper', 'lead-N-blue', 'lead-FE-white']);
    assert.deepEqual(part.electricalFunctions.switchedPolePairs, [['terminal-2', 'terminal-1']]);
    assert.deepEqual(part.symbol.internalConnections, [['terminal-N-upper', 'lead-N-blue']]);
    assert.equal(part.specifications.switchedNeutral.value, false);
    assert.equal(part.specifications.ratedBreakingCapacity.value, 10);
    assert.ok(part.sources[1].url.endsWith('#page=1'));
  }
});

test('Modular ETITEC surge protectors preserve hybrid, fuse and gas branches and their terminal buses', () => {
  const items = engine.catalog('modular AC SPD').filter(item => item.family === 'surge-protective-device');
  assert.equal(items.length, 63);
  for (const { id } of items) {
    const part = engine.component(id);
    const pins = new Set(part.symbol.pins.map(pin => pin.id));
    for (const branch of part.electricalFunctions.surgeBranches) {
      assert.ok(pins.has(branch.from) && pins.has(branch.to));
      assert.notEqual(branch.from, branch.to);
    }
    assert.ok(engine.modularSurgeGeometry(part).segments.flat().every(Number.isFinite));
  }
  const hybrid = engine.component('eti-002440551');
  assert.deepEqual(hybrid.electricalFunctions.surgeBranches[0], {
    from: 'power-l1', to: 'power-n', technology: 'GDT and MOV in series'
  });
  assert.deepEqual(hybrid.electricalFunctions.surgeBranches.at(-1), {
    from: 'power-n', to: 'pe', technology: 'Gas discharge tube'
  });
  const fused = engine.component('eti-002440709');
  assert.deepEqual(fused.symbol.internalConnections, [['pe-1', 'pe-2']]);
  assert.equal(fused.electricalFunctions.surgeBranches[0].technology, 'Fused MOV');
  const twin = engine.component('eti-002440563');
  assert.equal(twin.symbol.pins.find(pin => pin.id === 'pe-1').y, -56);
  assert.equal(twin.symbol.pins.find(pin => pin.id === 'power-n-1').y, 56);
  assert.ok(twin.symbol.internalConnections.some(bus => bus.join() === 'power-l1-1,power-l1-2'));
  assert.deepEqual(twin.electricalFunctions.surgeBranches.at(-1), {
    from: 'pe-1', to: 'power-n-1', technology: 'Gas discharge tube'
  });
});

test('ETITEC A retains distinct line and earth connections and order-specific surge ratings', () => {
  const items = engine.catalog('Overhead line SPD').filter(item => item.family === 'surge-protective-device');
  assert.equal(items.length, 269);
  for (const { id } of items) {
    const part = engine.component(id);
    const { specifications, symbol } = part;
    assert.deepEqual(symbol.pins.map(pin => pin.id), ['power-l', 'pe']);
    assert.deepEqual(symbol.internalConnections, []);
    assert.deepEqual(part.electricalFunctions.surgeBranches, [{ from: 'power-l', to: 'pe', technology: 'MOV' }]);
    assert.equal(specifications.maximumDischargeCurrent.value, specifications.nominalDischargeCurrent.value === 5 ? 40 : 50);
    assert.equal(specifications.localDisconnector.value, part.model.endsWith('-NO'));
    assert.equal(specifications.remoteSignalling.value, false);
  }
  const stud = engine.component('eti-002441104');
  assert.equal(stud.symbol.pins[0].connectionType, 'threaded-stud');
  const lead = engine.component('eti-002442830');
  assert.deepEqual(lead.symbol.pins.map(pin => pin.connectionType), ['insulation-piercing', 'pigtail']);
  assert.equal(lead.specifications.voltageProtectionLevel.value, 1.9);
  assert.equal(lead.specifications.earthLeadLength.value, 700);
  assert.match(lead.physicalRepresentations[0].scope, /outside this envelope/);
});

test('ETITEC V retains distinct surge branches, common earth and isolated alarm contacts', () => {
  const items = engine.catalog().filter(item => item.family === 'surge-protective-device' && item.name.startsWith('ETITEC V '));
  assert.equal(items.length, 60);
  for (const item of items) {
    const part = engine.component(item.id);
    const pins = new Map(part.symbol.pins.map(pin => [pin.id, pin]));
    const branches = part.electricalFunctions.surgeBranches;
    assert.ok(branches.every(branch => pins.has(branch.from) && pins.has(branch.to)));
    assert.equal(branches.filter(branch => branch.technology === 'Gas discharge tube').length,
      Number(part.specifications.protectionConfiguration.value.endsWith('+1')));
    assert.equal(part.symbol.internalConnections.length, Number(pins.has('pe-2')));
    assert.ok(part.symbol.internalConnections.flat().every(pin => pin.startsWith('pe')));
    assert.equal(pins.has('alarm-11'), part.model.endsWith(' RC'));
  }
  const part = engine.component('eti-002442918');
  assert.deepEqual(part.electricalFunctions.surgeBranches.map(({from,to}) => [from,to]),
    [['power-l1','power-n'],['power-l2','power-n'],['power-l3','power-n'],['power-n','pe-1']]);
});

test('ETITEC C and CM preserve their single earth terminal and compact housing dimensions', () => {
  const c = engine.catalog().filter(item => item.name.startsWith('ETITEC C T2 '));
  const cm = engine.catalog().filter(item => item.name.startsWith('ETITEC CM T23 '));
  assert.equal(c.length, 21);
  assert.equal(cm.length, 8);
  for (const item of [...c, ...cm]) {
    const part = engine.component(item.id);
    assert.deepEqual(part.symbol.internalConnections, []);
    assert.equal(part.symbol.pins.filter(pin => ['pe','pen'].includes(pin.id)).length, 1);
    assert.equal(part.symbol.pins.some(pin => pin.id === 'alarm-11'), part.model.endsWith(' RC'));
    assert.equal(part.specifications.maximumDischargeCurrent.value, 40);
  }
  const g = engine.component('eti-002440413');
  assert.deepEqual(g.electricalFunctions.surgeBranches, [{from:'power-n',to:'pe',technology:'Gas discharge tube'}]);
  const pen = engine.component('eti-002440399');
  assert.ok(pen.symbol.pins.some(pin => pin.localNumber === 'PEN'));
  const compact = engine.component('eti-002440655').physicalRepresentations[0];
  assert.deepEqual([compact.width, compact.height, compact.depth], [18, 105, 70]);
});

test('ETI EFI-P RCCBs preserve left and right neutral terminal positions and conditional ratings', () => {
  const items = engine.catalog().filter(item => item.family === 'residual-current-switch');
  assert.equal(items.length, 206);
  for (const item of items) {
    const part = engine.component(item.id);
    const { poleCount, neutralPosition, switchedNeutral, conditionalShortCircuitCurrent } = part.specifications;
    assert.equal(part.symbol.pins.length, poleCount.value * 2);
    assert.equal(part.electricalFunctions.switchedPolePairs.length, poleCount.value);
    assert.deepEqual(part.symbol.internalConnections, []);
    const offset = neutralPosition.value === 'Left' ? 0 : part.symbol.pins.length - 2;
    assert.deepEqual(part.symbol.pins.slice(offset, offset + 2).map(pin => pin.id), ['terminal-N-upper','terminal-N-lower']);
    assert.equal(switchedNeutral.value, true);
    assert.equal(conditionalShortCircuitCurrent.value, part.model.startsWith('EFI6-') ? 6 : 10);
    assert.equal(part.specifications.tripCurve, undefined);
  }
  const nl = engine.component('eti-002061843');
  assert.deepEqual(nl.symbol.pins.filter(pin => pin.y < 0).map(pin => pin.localNumber), ['N-upper','2','4','6']);
  const lowVoltage = engine.component('eti-002061750');
  assert.equal(lowVoltage.specifications.nominalVoltage.value, '190/230');
  assert.equal(lowVoltage.specifications.systemVoltageDesignation.value, 127);
});

test('ETI CEM contactors keep coil, line/load and optional auxiliary terminals distinct', () => {
  const items = engine.catalog('CEM motor contactor').filter(item => item.family === 'industrial-motor-contactor');
  assert.equal(items.length, 98);
  for (const { id } of items) {
    const part = engine.component(id);
    const { coilTerminals, contactPoles } = part.electricalFunctions;
    assert.deepEqual(coilTerminals, ['coil-a1', 'coil-a2']);
    assert.deepEqual(contactPoles.slice(0, 3).map(pole => pole.terminals), [
      ['terminal-1', 'terminal-2'], ['terminal-3', 'terminal-4'], ['terminal-5', 'terminal-6']
    ]);
    assert.ok(contactPoles.slice(0, 3).every(pole => !pole.normallyClosed));
    const auxiliary = part.model.match(/\.(\d\d)-/)[1];
    assert.deepEqual(contactPoles.slice(3), auxiliary === '01' ? [{ terminals: ['terminal-21', 'terminal-22'], normallyClosed: true }]
      : auxiliary === '10' ? [{ terminals: ['terminal-13', 'terminal-14'], normallyClosed: false }] : []);
    assert.deepEqual(part.symbol.internalConnections, []);
  }
  const ac = engine.component('eti-004642110');
  assert.deepEqual(ac.specifications.nominalCoilVoltage, { value: 24, unit: 'V AC' });
  const dc = engine.component('eti-004652201');
  assert.deepEqual(dc.specifications.nominalCoilVoltage, { value: 220, unit: 'V DC' });
  assert.equal(dc.physicalRepresentations[0].depth, 126);
});

test('ETI CE and CEC miniature contactors retain their distinct contact layouts', () => {
  const items = engine.catalog('miniature motor contactor').filter(item => item.family === 'industrial-motor-contactor');
  assert.equal(items.length, 108);
  const cases = [
    ['eti-004641020', [45, 42, 44], [['terminal-13', 'terminal-14']], [false, false, false, false], 3],
    ['eti-004641056', [45, 58, 52], [['terminal-21', 'terminal-22']], [false, false, false, true], 3],
    ['eti-004641210', [45, 58, 52], [['terminal-7', 'terminal-8']], [false, false, false, false], 4],
    ['eti-004641214', [45, 58, 52], [['terminal-r1', 'terminal-r2'], ['terminal-r3', 'terminal-r4']], [false, false, true, true], 4]
  ];
  for (const [id, dimensions, distinctPairs, states, count] of cases) {
    const part = engine.component(id);
    const { contactPoles, coilTerminals } = part.electricalFunctions;
    assert.deepEqual(coilTerminals, ['coil-a1', 'coil-a2']);
    assert.deepEqual(contactPoles.map(pole => pole.normallyClosed), states);
    assert.deepEqual(contactPoles.slice(-distinctPairs.length).map(pole => pole.terminals), distinctPairs);
    assert.deepEqual(part.symbol.internalConnections, []);
    assert.equal(part.specifications.poleCount.value, count);
    const view = part.physicalRepresentations[0];
    assert.deepEqual([view.width, view.height, view.depth], dimensions);
  }
});

test('Finder Series 22 represents manufacturer-specific mixed and mirror contact order', () => {
  const items = engine.catalog().filter(item => item.family === 'modular-contactor');
  assert.equal(items.length, 157);
  for (const item of items) {
    const part = engine.component(item.id);
    const { contactPoles, coilTerminals } = part.electricalFunctions;
    assert.equal(contactPoles.length, part.specifications.poleCount.value);
    assert.deepEqual(coilTerminals, ['coil-a1','coil-a2']);
    assert.equal(part.symbol.pins.length, (contactPoles.length + 1) * 2);
    assert.deepEqual(part.symbol.internalConnections, []);
    const mirrors = contactPoles.filter(pole => pole.mirror);
    assert.equal(mirrors.length, Number(part.manufacturerPartNumber.endsWith('17')));
    assert.ok(mirrors.every(pole => pole.normallyClosed && pole.terminals.join('/') === 'terminal-11/terminal-12'));
    if (part.model.startsWith('22.44.')) assert.equal(part.specifications.ratedContactCurrent.value, 40);
    if (part.model.startsWith('22.64.')) assert.equal(part.specifications.ratedContactCurrent.value, part.model.endsWith('4410') ? 50 : 63);
  }
  const mixed25A = items.find(item => /^22\.34\..*\.[14]6[24]0\b/.test(item.name));
  const mixed40A = items.find(item => /^22\.44\..*\.4610\b/.test(item.name));
  assert.deepEqual(engine.component(mixed25A.id).electricalFunctions.contactPoles.map(pole=>pole.normallyClosed), [true,false,false,true]);
  assert.deepEqual(engine.component(mixed40A.id).electricalFunctions.contactPoles.map(pole=>pole.normallyClosed), [false,true,true,false]);
});

test('Finder Series 20 step selection updates continuity and survives a project round-trip', () => {
  const items = engine.catalog().filter(item => item.family === 'modular-step-relay');
  assert.equal(items.length, 123);
  const partId = 'finder-202882300000';
  const part = engine.component(partId);
  const firstPole = ['terminal-1', 'terminal-2'];
  const secondPole = ['terminal-3', 'terminal-4'];
  assert.deepEqual(part.electricalFunctions.switchingSequence, [[], [firstPole], [], [secondPole]]);
  const sheetId = 'step-check';
  const instance = { ...engine.createInstance(partId, 100, 100, 'K1'), sheetId };
  const joined = (drawing, terminals) => {
    const pin = engine.worldPins(drawing).find(point => point.id === terminals[0]);
    const wire = { id: 'test-wire', kind: 'wire', sheetId, x: pin.x, y: pin.y,
      x1: pin.x, y1: pin.y, x2: pin.x, y2: pin.y - 10,
      pinAttachments: { start: { instanceId: drawing.id, pinId: pin.id }, end: null } };
    return engine.analyze([drawing, wire]).nets.some(net => terminals.every(
      id => net.pins.some(terminal => terminal.pinId === id)
    ));
  };
  assert.equal(joined(instance, firstPole), false);
  const initialGeometry = engine.coilAndContactGeometry(instance);
  instance.properties.switchingStep = '4';
  assert.equal(joined(instance, firstPole), false);
  assert.equal(joined(instance, secondPole), true);
  assert.notDeepEqual(engine.coilAndContactGeometry(instance), initialGeometry);
  const saved = engine.serializeProject({ project: 'Step check', sheets: [{ id: sheetId, name: 'Wiring' }], objects: [instance] });
  const reopened = engine.parseProject(saved);
  assert.equal(reopened.valid, true);
  assert.equal(reopened.project.objects[0].properties.switchingStep, '4');
});

test('Finder interface assemblies retain socket terminal designations, coil polarity and real parallel contacts', () => {
  const items = engine.catalog().filter(item => /^finder-(48|58)/.test(item.id));
  assert.equal(items.length, 87);
  const baseCodes = items.map(item => item.id.slice(0, -3));
  assert.equal(new Set(baseCodes).size, 87);
  const box = engine.component('finder-583290240050spa');
  assert.deepEqual(box.symbol.pins.map(pin => pin.localNumber), ['A2','A1','11','12','14','41','42','44']);
  assert.equal(box.symbol.pins.find(pin => pin.localNumber === '41').socketPosition, 12);
  assert.deepEqual(box.electricalFunctions.coil.polarity, { positive: 'A1', negative: 'A2' });
  const pushIn = engine.component('finder-48p290245007sma');
  assert.ok(pushIn.symbol.pins.every(pin => pin.connectionType === 'push-in'));
  assert.equal(pushIn.electricalFunctions.coil.polarity, undefined);
  const highCurrent = engine.component('finder-486180244060sma');
  assert.deepEqual(highCurrent.symbol.internalConnections, [
    ['contact-11','contact-21'], ['contact-12','contact-22'], ['contact-14','contact-24']
  ]);
  assert.equal(highCurrent.specifications.ratedContactCurrent.value, 16);
});

test('ETI Ultra Quick aR fuses preserve four distinct terminal styles and nominal dimensions', () => {
  const items = engine.catalog().filter(item => item.family === 'semiconductor-fuse-link' && item.name.includes(' aR ') && item.id.startsWith('eti-004'));
  assert.equal(items.length, 393);
  assert.equal(new Set(items.map(item => item.id)).size, items.length);
  const samples = [
    ['eti-004371204', 'knife-blade', [78,51,30]],
    ['eti-004393113', 'slotted-blade', [140,51,51]],
    ['eti-004393713', 'slotted-blade', [140,56,51]],
    ['eti-004373513', 'threaded-stud', [53,51,51]],
    ['eti-004303514', 'threaded-stud', [75,51,51]],
    ['eti-004362217', 'bolted-lug', [128,44,27]]
  ];
  for (const [id, type, dimensions] of samples) {
    const part = engine.component(id);
    const view = part.physicalRepresentations[0];
    assert.deepEqual(part.symbol.pins.map(pin => pin.connectionType), [type,type]);
    assert.deepEqual([view.width,view.height,view.depth], dimensions);
  }
  for (const item of items) {
    const part = engine.component(item.id);
    assert.deepEqual(part.electricalFunctions.protectedTerminalPair, ['contact-left','contact-right']);
    assert.deepEqual(part.symbol.internalConnections, []);
    assert.equal(part.specifications.ratedBreakingCapacity.value, 200);
    assert.equal(part.specifications.nominalVoltage.unit, 'V AC');
  }
});

test('ETI cylindrical aR fuse links preserve electrical caps and mechanical striker variants', () => {
  const items = engine.catalog().filter(item => item.family === 'semiconductor-fuse-link' && item.name.includes(' aR ') && item.id.startsWith('eti-002'));
  assert.equal(items.length, 40);
  for (const item of items) {
    const part = engine.component(item.id);
    assert.deepEqual(part.electricalFunctions.protectedTerminalPair, ['cap-left', 'cap-right']);
    assert.deepEqual(part.symbol.pins.map(pin => pin.connectionType), ['end-cap', 'end-cap']);
    assert.deepEqual(part.symbol.internalConnections, []);
    assert.equal(part.specifications.ratedBreakingCapacity.value, 200);
    assert.equal(part.specifications.indicator?.value, item.name.includes('/P ') ? 'Striker pin' : undefined);
  }
  const view = engine.component('eti-002645125').physicalRepresentations[0];
  assert.deepEqual([view.width, view.height, view.depth], [58, 22.3, 22.3]);
});

test('ETI cylindrical gR fuses retain the AC and DC ratings and the correct terminal contacts', () => {
  const items = engine.catalog().filter(item => item.family === 'semiconductor-fuse-link' && item.id.startsWith('eti-002') && item.name.includes(' gR '));
  assert.equal(items.length, 54);
  for (const item of items) {
    const part = engine.component(item.id);
    const slotted = item.name.includes('SU ');
    const prefix = slotted ? 'tab-' : 'cap-';
    const connectionType = slotted ? 'slotted-blade' : 'end-cap';
    assert.deepEqual(part.symbol.pins.map(pin => pin.connectionType), [connectionType, connectionType]);
    assert.deepEqual(part.electricalFunctions.protectedTerminalPair, [prefix + 'left', prefix + 'right']);
    assert.deepEqual(part.symbol.internalConnections, []);
    const dcOnly = item.name.includes('1200V');
    assert.equal(part.specifications.ratedBreakingCapacity.value, dcOnly ? 30 : 50);
    assert.equal(part.specifications.ratedDcBreakingCapacity?.value, dcOnly ? undefined : 8);
    assert.equal(part.specifications.ratedDcTimeConstant.value, 2);
  }
  const part = engine.component('eti-002625231');
  const view = part.physicalRepresentations[0];
  assert.deepEqual([view.width, view.height, view.depth], [108, 10.3, 11]);
});

test('ETI Ultra Quick gR and gS retain voltage-specific capacities, indicators and terminals', () => {
  const items = engine.catalog().filter(item => item.family === 'semiconductor-fuse-link' && item.id.startsWith('eti-004') && / (gR|gS) /.test(item.name));
  assert.equal(items.length, 254);
  for (const item of items) {
    const part = engine.component(item.id);
    assert.deepEqual(part.electricalFunctions.protectedTerminalPair, ['contact-left','contact-right']);
    assert.deepEqual(part.symbol.internalConnections, []);
  }
  const dc = engine.component('eti-004110550');
  assert.equal(dc.specifications.indicator.value, 'Striker pin');
  assert.equal(dc.specifications.nominalVoltage.unit, 'V DC');
  assert.equal(dc.specifications.ratedDcTimeConstant.value, 5);
  assert.equal(dc.specifications.ratedBreakingCapacity.value, 10);
  assert.equal(dc.physicalRepresentations[0].height, 61.5);
  assert.equal(engine.component('eti-004110500').specifications.ratedBreakingCapacity.value, 20);
  const gS = engine.component('eti-004184504');
  assert.equal(gS.specifications.utilizationCategory.value, 'gS');
  assert.equal(gS.specifications.nominalVoltage.value, 800);
  assert.equal(gS.specifications.ratedBreakingCapacity.value, 30);
  const threaded = engine.component('eti-004713509');
  assert.equal(threaded.specifications.contactThread.value, 'M10');
  assert.equal(threaded.symbol.pins[0].connectionType, 'threaded-stud');
});

test('every manufacturer part round-trips after placement, movement, rotation and wiring', () => {
  const sheetId = 'catalog-check';
  for (const item of engine.catalog()) {
    const definition = engine.component(item.id);
    const instance = engine.createInstance(item.id, 300, 300, item.tag + '1');
    instance.sheetId = sheetId;
    engine.moveInstance(instance, 350, 400);
    engine.rotateInstance(instance, 90);
    const pins = engine.worldPins(instance);
    assert.equal(pins.length, definition.symbol.pins.length, item.id);
    const wires = pins.map((pin, index) => ({
      id: 'lead-' + index, kind: 'wire', sheetId,
      x: pin.x, y: pin.y, x1: pin.x, y1: pin.y,
      x2: pin.x, y2: pin.y + 10, color: '#1565c0',
      pinAttachments: { start: { instanceId: instance.id, pinId: pin.id }, end: null }
    }));
    const objects = [instance, ...wires];
    if (definition.physicalRepresentations?.some(view => view.view === 'panel-front-envelope')) {
      const envelope = engine.createPanelEnvelope(item.id, 'component-envelope', 650, 400);
      assert.equal(envelope.manufacturerPartNumber, definition.manufacturerPartNumber, item.id);
      objects.push({ ...envelope, sheetId });
    }
    const saved = engine.serializeProject({ project: 'Catalog check', sheets: [{ id: sheetId, name: 'Wiring' }], objects });
    const reopened = engine.parseProject(saved);
    assert.equal(reopened.valid, true, item.id + ': ' + reopened.errors.join(' '));
    assert.deepEqual(reopened.project.objects, objects, item.id);
    assert.deepEqual(engine.worldPins(reopened.project.objects[0]), pins, item.id);
    const analyzed = engine.analyze(reopened.project.objects);
    const reportedPins = new Set(analyzed.nets.flatMap(net => net.pins.map(pin => pin.number)));
    for (const pin of pins) assert.ok(reportedPins.has(pin.number), item.id + ' terminal ' + pin.number);
    const bom = engine.billOfMaterials(reopened.project.objects);
    assert.equal(bom.valid, true, item.id);
    assert.deepEqual(bom.rows.map(row => [row.componentId, row.partNumber, row.quantity]),
      [[item.id, definition.manufacturerPartNumber, 1]], item.id);
  }
});

test('every verified catalog part preserves its editable instance and pin anchors through native save', () => {
  for (const item of engine.catalog()) {
    const part = engine.component(item.id);
    const instance = engine.createInstance(item.id, 150, 220, item.tag + '1');
    engine.moveInstance(instance, 151.125, 222.375);
    engine.rotateInstance(instance, 90);
    const pins = engine.worldPins(instance);
    assert.ok(pins.length > 0, item.id);
    assert.equal(new Set(pins.map(pin => JSON.stringify([pin.x, pin.y]))).size, pins.length, item.id);
    assert.deepEqual(pins.map(pin => pin.id), part.symbol.pins.map(pin => pin.id));
    const reopened = engine.parseProject(engine.serializeProject({
      project: item.name, sheets: [{ id: 'catalog-test', name: 'Catalog test' }], objects: [instance]
    }));
    assert.equal(reopened.valid, true, reopened.errors.join(' '));
    assert.deepEqual(reopened.project.objects, [instance]);
    assert.deepEqual(engine.worldPins(reopened.project.objects[0]), pins);
  }
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
  assert.ok(html.includes("sensingTarget:'Sensing target'"));
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
  const navigation = html.slice(html.indexOf('function openCrossSheetConnector'), html.indexOf('const componentPropertyLabels'));
  assert.ok(navigation.includes('setSelection([target.id],true)'));
  assert.ok(navigation.includes("openInspector('Properties')"));
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
  assert.ok(html.includes("marking:'Marking'"));
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
  assert.ok(html.includes("window.AdigunCADEngine.component(item.id)?.electricalFunctions?.pushButton?.normalContactState==='open'"));
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
  assert.deepEqual(def.specifications.ratedImpulseWithstandVoltage, { value: 6, unit: 'kV', standard: 'IEC 60947' });
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
  const numbered = [{ ...objects.find(object => object.kind === 'wire'), wireNumber: 'A-07', potential: 'Return 0 V' }];
  assert.match(engine.wireListCsv(numbered), /"Wire number","Potential"\r\n.*"A-07","Return 0 V"/);
  const csv = engine.wireListCsv(objects);
  assert.ok(csv.startsWith('\uFEFF'));
  assert.match(csv, /"Wire ID"/);
  assert.match(csv, /"'=1\+1"/);
  const offsetWire = { id: '  =1+1', kind: 'wire', x1: -12, y1: -5, x2: 0, y2: -5 };
  const offsetCsv = engine.wireListCsv([offsetWire]);
  assert.match(offsetCsv, /"'  =1\+1"/);
  assert.match(offsetCsv, /"-12","-5"/);
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
  assert.equal(vm.runInNewContext("drawingLayerForObject({kind:'component-instance',layer:'annotations'})", context), 'annotations');
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
  const analysis = engine.analyzeProject(project);
  assert.equal(project.sheets.length, 72);
  assert.deepEqual(
    [analysis.componentCount, analysis.wireCount, analysis.openEndpointCount, analysis.errors.length],
    [4, 15, 0, 0]
  );
  assert.equal(analysis.crossSheetConnectionCount, 3);
  const terminalList = engine.terminalList(project);
  assert.equal(terminalList.valid, true);
  assert.equal(terminalList.rows.length, 6);
  assert.deepEqual(terminalList.rows.find(row => row.ref === 'X3' && row.pin === '1').connectedPins,
    ['A2/001 K1:A2', 'A2/001 KM1:A2', 'A2/004 X3:2']);
  assert.match(engine.terminalListCsv(project), /"A2\/004","X3","1"/);
  assert.equal(engine.analyzeProject({ ...project, crossSheetConnections: [] }).openEndpointCount, 6);
  const netPins = analysis.globalNets.map(net => net.pins.map(pin => pin.ref + ':' + pin.number).sort().join(',')).sort();
  assert.deepEqual(netPins, [
    'K1:11,X1:1:1,X1:1:2',
    'K1:14,KM1:A1',
    'K1:A1,X1:2:1,X1:2:2',
    'K1:A2,KM1:A2,X3:1,X3:2'
  ]);

  const bom = engine.billOfMaterials(project.objects);
  assert.equal(bom.valid, true, bom.errors.join(' '));
  assert.deepEqual(
    bom.rows.map(row => [row.partNumber, row.quantity]).sort((a, b) => a[0].localeCompare(b[0])),
    [['2966171', 1], ['3209510', 1], ['3210567', 1], ['LC1D09BD', 1]].sort((a, b) => a[0].localeCompare(b[0]))
  );
  const wireList = engine.wireList(project.objects);
  assert.equal(wireList.valid, true, wireList.errors.join(' '));
  assert.equal(wireList.rows.length, 15);
  const schedule = project.objects.filter(object => object.sheetId === 'relay-wire-schedule' && object.text?.startsWith('W-'));
  assert.deepEqual(schedule.map(object => object.text.split(' | ')[0]), wireList.rows.map(row => row.wireId));
  const layout = project.objects.filter(object => object.sheetId === 'relay-terminal-layout' && object.deviceTag);
  assert.deepEqual(layout.map(object => [object.deviceTag, object.manufacturerPartNumber]), [['X1', '3210567'], ['X3', '3209510']]);
  const copy = engine.copyExampleProject(project, 'relay-package-copy', 'Editable relay reference');
  const editable = engine.parseProject(engine.serializeProject(copy));
  assert.equal(editable.valid, true, editable.errors.join(' '));
  assert.equal(editable.project.sheets.find(sheet => sheet.id === 'control').number, 'A2/0007');
  assert.deepEqual(engine.analyzeProject(editable.project).globalNets, engine.analyzeProject(project).globalNets);
  const assignedPotentials = new Map(editable.project.objects.filter(object => object.kind === 'wire')
    .map(object => [object.id, object.potential]));
  assert.deepEqual([...new Set(assignedPotentials.values())].sort(), ['+24 V DC', '0 V DC', 'K1 switched feed', 'PLC Q0.0']);
  for (const net of analysis.globalNets) {
    assert.equal(new Set(net.wireIds.map(id => assignedPotentials.get(id.slice(id.indexOf(':') + 1)))).size, 1);
  }
  const electricalReport = engine.projectElectricalReport(editable.project);
  assert.ok(electricalReport.findings.every(finding => finding.ruleId !== 'ERC-CONFLICTING-POTENTIALS'));
  assert.equal(electricalReport.summary.projectNets, 4);
  assert.deepEqual(electricalReport.globalNets, analysis.globalNets);
  assert.equal(electricalReport.crossSheetConnections.length, 3);
  assert.deepEqual(electricalReport.openEndpoints, []);
  const indexedNumbers = new Set(editable.project.objects
    .filter(object => object.sheetId.startsWith('relay-index'))
    .map(object => object.text?.match(/^A[1-4]\/\d+(?= \| )/)?.[0])
    .filter(Boolean));
  assert.deepEqual(indexedNumbers, new Set(editable.project.sheets.map(sheet => sheet.number)));
  const routeTotals = editable.project.objects.filter(object => object.sheetId === 'relay-control-segment-geometry')
    .map(object => object.text).filter(text => text?.startsWith('W-'));
  const branches = ['W-Q0', 'W-24', 'W-K1-KM1', 'W-0V-K1', 'W-0V-KM1'];
  assert.deepEqual(routeTotals, branches.map(prefix => {
    const rows = wireList.rows.filter(row => row.wireId.startsWith(prefix + '-'));
    return prefix + ' | ' + rows.length + ' segments | ' + rows.reduce((sum, row) => sum + row.lengthMm, 0) + ' drawing length units.';
  }));
  const tracedNets = ['relay-trace-plc', 'relay-trace-supply', 'relay-trace-coil', 'relay-trace-return']
    .map(sheetId => editable.project.objects.filter(object => object.sheetId === sheetId && /-member-\d+$/.test(object.id))
      .map(object => object.text).sort().join(',')).sort();
  assert.deepEqual(tracedNets, netPins);
  const deviceLayout = editable.project.objects.filter(object => object.sheetId === 'relay-coil-layout' && object.deviceTag);
  assert.deepEqual(deviceLayout.map(object => [object.deviceTag, object.manufacturerPartNumber]), [['K1', '2966171'], ['KM1', 'LC1D09BD']]);

  const savedAgain = engine.serializeProject(project);
  const reopened = engine.parseProject(savedAgain);
  assert.equal(reopened.valid, true, reopened.errors.join(' '));
  assert.deepEqual(engine.analyzeProject(reopened.project).globalNets, analysis.globalNets);
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
  assert.ok(html.includes("overloadSettingA:'Overload setting (A)'"));
  assert.ok(html.includes("escapeHtml(rule.minimum)"));
  assert.ok(html.includes("escapeHtml(rule.maximum)"));
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
  const copy = engine.copyExampleProject(reopened.project, 'reversing-reference-copy', 'Editable reversing reference');
  const savedCopy = engine.parseProject(engine.serializeProject(copy));
  assert.equal(savedCopy.valid, true, savedCopy.errors.join(' '));
  assert.equal(savedCopy.project.sheets.length, 100);
  const originalIndexNumbers = new Set();
  const copiedIndexNumbers = new Set();
  for (const [workspace, numbers] of [[reopened.project, originalIndexNumbers], [savedCopy.project, copiedIndexNumbers]]) {
    for (const object of workspace.objects) {
      if (!object.sheetId?.startsWith('reversing-index')) continue;
      const number = object.text?.match(/^A[1-4]\/\d+(?= \| )/)?.[0];
      if (number) numbers.add(number);
    }
    assert.deepEqual(numbers, new Set(workspace.sheets.map(sheet => sheet.number)));
  }
  for (const [sheetId, values] of [
    ['reversing-q1-mounting', ['22.5 mm', '100 mm', '141.6 mm']],
    ['reversing-q1-control-window', ['19.2–30 V DC']],
    ['reversing-m1-starting-point', ['0.405 A', '1.458 A']],
    ['reversing-m1-speed-reference', ['1,500 r/min', '8%']],
    ['reversing-q1-overload-class', ['10A', 'no short-circuit protection function']],
    ['reversing-q1-input-thresholds', ['0–5 V', '15–30 V']],
    ['reversing-q1-control-transients', ['300 mA for 80 ms', '140 mA for 80 ms']],
    ['reversing-m1-input-power-check', ['179.6 W', '185.2 W']]
  ]) {
    const content = savedCopy.project.objects.filter(object => object.sheetId === sheetId).map(object => object.text).join(' ');
    for (const value of values) assert.ok(content.includes(value), value);
    assert.match(content, /Source: (Siemens|SEW-EURODRIVE).*https:\/\//);
  }
  const documentationIds = ['reversing-power-nets', 'reversing-control-nets'];
  const documentedNets = savedCopy.project.objects
    .filter(object => documentationIds.includes(object.sheetId) && object.text?.includes('  |  '))
    .map(object => object.text)
    .sort();
  const modeledNets = analysis.nets
    .map(net => net.pins.map(pin => pin.ref + ':' + pin.number).sort().join('  |  '))
    .sort();
  assert.deepEqual(documentedNets, modeledNets);
  const traceLabels = savedCopy.project.objects.filter(object => object.sheetId?.startsWith('reversing-trace-'));
  const tracePeers = new Map(traceLabels.filter(object => /-peers-\d+$/.test(object.id))
    .map(object => [object.id, object.text.split('  ·  ')]));
  const tracedNets = traceLabels.filter(object => /-pin-\d+$/.test(object.id))
    .map(object => [object.text, ...tracePeers.get(object.id.replace('-pin-', '-peers-'))].sort().join('  |  '))
    .sort();
  assert.deepEqual(tracedNets, modeledNets);
  const wireScheduleIds = ['reversing-line-wire-list', 'reversing-motor-wire-list', 'reversing-control-wire-list'];
  const documentedWires = savedCopy.project.objects
    .filter(object => wireScheduleIds.includes(object.sheetId) && object.text?.startsWith('W-'))
    .map(object => object.text.split(' | ')[0])
    .sort();
  assert.deepEqual(documentedWires, wireList.rows.map(row => row.wireId).sort());
  const sourceRecords = savedCopy.project.objects.filter(object => object.sheetId === 'reversing-source-register');
  for (const row of bom.rows) {
    assert.ok(sourceRecords.some(object => object.text === row.sourceUrl));
  }
  const interfaces = [
    ['reversing-power-boundary', 'Q1', ['1/L1', '3/L2', '5/L3']],
    ['reversing-supply-boundary', 'Q1', ['A1', 'A2']],
    ['reversing-command-boundary', 'Q1', ['IN1', 'IN2', 'IN3']],
    ['reversing-signal-boundary', 'Q1', ['OUT', '95', '96', '98']],
    ['reversing-motor-board', 'M1', ['U1', 'V1', 'W1', 'U2']],
    ['reversing-pe-review', 'M1', ['PE']]
  ];
  for (const [sheetId, ref, numbers] of interfaces) {
    const rows = savedCopy.project.objects.filter(object => object.sheetId === sheetId);
    for (const number of numbers) {
      const net = analysis.nets.find(candidate => candidate.pins.some(pin => pin.ref === ref && pin.number === number));
      const expectedPeers = net.pins.filter(pin => pin.ref !== ref || pin.number !== number)
        .map(pin => pin.ref + ':' + pin.number).sort().join(', ');
      const expectedRow = ref + ':' + number + ' | ' + expectedPeers;
      assert.ok(rows.some(row => row.text === expectedRow || row.text?.startsWith(expectedRow + ' | ')), expectedRow);
    }
  }
  const correctedMarks = {
    X8: 'Start direction 1',
    X9: 'Start direction 2',
    X10: 'Reset',
    X11: '0 V DC'
  };
  for (const [ref, marking] of Object.entries(correctedMarks)) {
    const terminal = savedCopy.project.objects.find(object => object.kind === 'component-instance' && object.ref === ref);
    assert.equal(terminal.properties.marking, marking);
    assert.ok(savedCopy.project.objects.some(object => object.sheetId === 'reversing-control-marking'
      && object.text?.startsWith(ref + ' | ' + marking + ' | Q1:')));
  }
  const layoutId = 'reversing-xt1-layout';
  const footprints = savedCopy.project.objects.filter(object => object.sheetId === layoutId && object.deviceTag);
  assert.equal(footprints.length, 13);
  assert.equal(savedCopy.project.sheets.find(sheet => sheet.id === layoutId).sectionId, 'A3');
  const peFootprint = footprints.find(object => object.deviceTag === 'X16');
  assert.equal(peFootprint.projectAssumption, true);
  assert.equal(peFootprint.manufacturerPartNumber, undefined);
  const copyFootprint = copy.objects.find(object => object.id === footprints[0].id);
  copyFootprint.y += 14;
  copyFootprint.y2 += 14;
  const editedCopy = engine.parseProject(engine.serializeProject(copy));
  assert.equal(editedCopy.valid, true, editedCopy.errors.join(' '));
  assert.equal(editedCopy.project.objects.find(object => object.id === copyFootprint.id).y, footprints[0].y + 14);
  assert.equal(reopened.project.objects.find(object => object.id === copyFootprint.id).y, footprints[0].y);
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
  assert.ok(html.includes("delaySeconds:'Transition time (s)'"));
  assert.ok(html.includes("overloadSettingA:'Overload setting (A)'"));
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


test('one-hundred-sheet connected reference opening set preserves the starter and source-backed PLC interfaces', () => {
  const file = path.join(__dirname, 'examples', 'real-projects', 'siemens-sew-star-delta-reference.adigun.json');
  const parsed = engine.parseProject(fs.readFileSync(file, 'utf8'));
  assert.equal(parsed.valid, true, parsed.errors.join(' '));
  const project = parsed.project;
  assert.equal(project.sheets.length, 100);
  assert.equal(project.activeSheet, 'ref-006');
  assert.ok(project.status.includes('A1/001–A1/100'));
  const ids = new Set(project.objects.map(object => object.id));
  assert.equal(ids.size, project.objects.length);
  for (const sheet of project.sheets) {
    const pageObjects = project.objects.filter(object => object.sheetId === sheet.id);
    assert.ok(pageObjects.length >= 2, sheet.id + ' must contain native editable content');
    if (sheet.id !== 'ref-006') assert.ok(pageObjects.some(object => object.kind === 'text'), sheet.id + ' must contain editable text');
  }
  const report = engine.analyzeProject(project);
  assert.deepEqual([report.sheetCount, report.componentCount, report.wireCount, report.netCount, report.openEndpointCount], [100,40,354, 76, 0]);
  assert.deepEqual([report.crossSheetConnectionCount,report.globalNetCount,report.localOpenEndpointCount],[29,44,63]);
  assert.deepEqual(report.sheets.slice(0, 5).map(sheet => [sheet.analysis.componentCount, sheet.analysis.wireCount, sheet.analysis.netCount]), [
    [0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0]
  ]);
  const electrical = report.sheets[5].analysis;
  assert.deepEqual([electrical.componentCount, electrical.wireCount, electrical.netCount], [15,244,28]);
  const sensorPage = report.sheets[6].analysis;
  assert.deepEqual([sensorPage.componentCount, sensorPage.wireCount, sensorPage.netCount, sensorPage.openEndpointCount, sensorPage.unconnectedPinCount], [4,29,17,14,6]);
  const supplyPage = report.sheets[7].analysis;
  assert.deepEqual([supplyPage.componentCount, supplyPage.wireCount, supplyPage.netCount, supplyPage.openEndpointCount], [6,7,5,2]);
  const distributionPage = report.sheets[8].analysis;
  assert.deepEqual([distributionPage.componentCount, distributionPage.wireCount, distributionPage.netCount, distributionPage.openEndpointCount], [2,23,2,13]);
  const outputPage = report.sheets[9].analysis;
  assert.deepEqual([outputPage.componentCount,outputPage.wireCount,outputPage.netCount,outputPage.openEndpointCount,outputPage.unconnectedPinCount],[1,13,5,6,0]);
  const contactorPage = report.sheets[10].analysis;
  assert.deepEqual([contactorPage.componentCount,contactorPage.wireCount,contactorPage.netCount,contactorPage.openEndpointCount,contactorPage.unconnectedPinCount],[1,9,5,5,6]);
  const operatorPage = report.sheets[11].analysis;
  assert.deepEqual([operatorPage.componentCount,operatorPage.wireCount,operatorPage.netCount,operatorPage.openEndpointCount,operatorPage.unconnectedPinCount],[2,10,3,4,0]);
  assert.deepEqual([report.sheets[12].analysis.componentCount,report.sheets[12].analysis.wireCount,report.sheets[12].analysis.netCount],[0,0,0]);
  assert.deepEqual([report.sheets[13].analysis.componentCount,report.sheets[13].analysis.wireCount,report.sheets[13].analysis.netCount],[1,2,1]);
  assert.deepEqual([report.sheets[14].analysis.componentCount,report.sheets[14].analysis.wireCount,report.sheets[14].analysis.netCount],[1,2,1]);
  assert.deepEqual([report.sheets[15].analysis.componentCount,report.sheets[15].analysis.wireCount,report.sheets[15].analysis.netCount],[1,2,1]);
  assert.ok(project.objects.some(object=>object.id==='doc-ref-015-input-05'&&/CPU X10:12 \/ DI a\.5.*K2 NC contact 11–12/.test(object.text)));
  assert.ok(project.objects.some(object=>object.id==='doc-ref-016-input-06'&&/CPU X10:13 \/ DI a\.6.*K2 NO output 14/.test(object.text)));
  assert.ok(project.objects.some(object=>object.id==='doc-ref-002-line-14'&&/A1\/014.*KM4 auxiliary NC.*DI a\.4/.test(object.text)));
  assert.ok(project.objects.some(object=>object.id==='doc-ref-002-line-15'&&/A1\/015.*K2 NC.*DI a\.5/.test(object.text)));
  assert.ok(project.objects.some(object=>object.id==='doc-ref-002-line-16'&&/A1\/016.*K2 NO.*DI a\.6/.test(object.text)));
  assert.ok(project.objects.some(object=>object.id==='doc-ref-014-input-04'&&/CPU X10:11 \/ DI a\.4.*KM4 NC auxiliary contact 21–22/.test(object.text)));
  const bom = engine.billOfMaterials(project.objects);
  assert.equal(bom.valid, true, bom.errors.join(' '));
  assert.deepEqual(bom.rows.map(row => [row.partNumber,row.quantity]).sort((a,b)=>a[0].localeCompare(b[0])), [
    ['2966171',1], ['3212144',22], ['3212147',1], ['3RP2576-2NW30',1], ['3RT2026-2KB40',3], ['3RU2126-4AB0',1],
    ['3RV2021-4AA10',1], ['6EP1332-5BA00',1], ['6ES7212-1AE40-0XB0',1], ['DRN132M4',1], ['IFB3004BBPKG/US-104',1], ['LC1D09BD',1], ['PN-400-SER14-MFRKG/US/ /V',1], ['XB5AA31',2], ['XB5AA42',2]
  ]);
  const reopened = engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid, true, reopened.errors.join(' '));
  assert.deepEqual(engine.analyzeProject(reopened.project).sheets.map(sheet => sheet.analysis.netCount), [0,0,0,0,0,28,17,5,2,5,5,3,0,1,1,1,0,1,2,2,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]);
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
  assert.deepEqual(report.openEndpoints, []);
  const wireReport = engine.wireList(parsed.project);
  assert.equal(wireReport.valid, true, wireReport.errors.join(' '));
  assert.deepEqual(wireReport.rows.map(row => [row.sheetId, row.netId, row.endPinRefs, row.netPinRefs]), [
    ['sheet-power', 'global-net-1', ['X1:1'], ['X1:1', 'X1:2', 'X2:1', 'X2:2']],
    ['sheet-control', 'global-net-1', ['X2:1'], ['X1:1', 'X1:2', 'X2:1', 'X2:2']]
  ]);
  const csv = engine.wireListCsv(parsed.project);
  assert.match(csv, /"Sheet ID","Wire ID","Net ID"/);
  assert.match(csv, /"sheet-control","cross-sheet-wire-1","global-net-1"/);
  const disconnected = engine.analyzeProject({ ...parsed.project, crossSheetConnections: [] });
  assert.deepEqual(disconnected.openEndpoints, [
    { sheetId: 'sheet-power', wireId: 'cross-sheet-wire-0', point: { x: 400, y: 260 } },
    { sheetId: 'sheet-control', wireId: 'cross-sheet-wire-1', point: { x: 400, y: 260 } }
  ]);
  const tagged = parsed.project.objects.map(object => object.kind === 'wire'
    ? { ...object, potential: object.sheetId === 'sheet-power' ? 'L1' : 'N', wireNumber: 'W-101' }
    : object);
  const assigned = engine.parseProject(engine.serializeProject({ ...parsed.project, objects: tagged })).project;
  const linkedFindings = engine.analyzeProject(assigned).findings;
  const conflict = linkedFindings.find(finding => finding.ruleId === 'ERC-CONFLICTING-POTENTIALS');
  assert.deepEqual(conflict.locations.map(location => [location.sheetId, location.potential]), [
    ['sheet-power', 'L1'], ['sheet-control', 'N']
  ]);
  assert.ok(!linkedFindings.some(finding => finding.ruleId === 'ERC-WIRE-NUMBER-DISCONNECTED'));
  const unlinkedFindings = engine.analyzeProject({ ...assigned, crossSheetConnections: [] }).findings;
  assert.ok(!unlinkedFindings.some(finding => finding.ruleId === 'ERC-CONFLICTING-POTENTIALS'));
  assert.ok(unlinkedFindings.some(finding => finding.ruleId === 'ERC-WIRE-NUMBER-DISCONNECTED' && finding.locations.length === 2));
  assert.deepEqual(report.globalNets[0].sheetIds,['sheet-control','sheet-power']);
  assert.deepEqual(report.globalNets[0].pins.map(pin=>pin.sheetId+':'+pin.ref+':'+pin.number),[
    'sheet-control:X2:1','sheet-control:X2:2','sheet-power:X1:1','sheet-power:X1:2'
  ]);
  assert.deepEqual(engine.crossSheetConnectors(project,'sheet-power').map(item=>[item.name,item.targetSheetId,item.targetRef,item.direction]),[
    ['L1','sheet-control','X2','left']
  ]);
  const deletion = { sheets: parsed.project.sheets, crossSheetConnections: structuredClone(parsed.project.crossSheetConnections) };
  const target = parsed.project.objects.find(object => object.kind === 'component-instance' && object.ref === 'X2');
  assert.equal(engine.detachDeletedDrawingObjects(deletion, 'sheet-power', [target]), 0);
  assert.equal(engine.detachDeletedDrawingObjects(deletion, 'sheet-control', [target]), 1);
  assert.deepEqual(deletion.crossSheetConnections, []);
  assert.deepEqual(deletion.diagnostics[0].connection, parsed.project.crossSheetConnections[0]);
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
  assert.deepEqual([report.sheetCount, report.componentCount, report.wireCount, report.netCount, report.crossSheetConnectionCount, report.openEndpointCount], [100,40,354,76,29,0]);
  assert.deepEqual(report.sheets.slice(-90,-70).map(sheet => [sheet.analysis.componentCount,sheet.analysis.wireCount,sheet.analysis.netCount,sheet.analysis.openEndpointCount]), [[1,9,5,5],[2,10,3,4],[0,0,0,0],[1,2,1,2],[1,2,1,2],[1,2,1,2],[0,0,0,0],[1,2,1,2],[2,2,2,2],[2,4,2,4],[0,0,0,0],[1,5,3,3],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]]);
  assert.equal(report.globalNetCount,44);
  assert.deepEqual(report.globalNets.filter(net=>net.sheetIds.includes('ref-007')&&net.sheetIds.includes('ref-008')).map(net=>net.pins.map(pin=>pin.sheetId+':'+pin.ref+':'+pin.number).sort()).sort((a,b)=>a[0].localeCompare(b[0])),[
    ['ref-006:F1:97','ref-007:A1:X10:1','ref-007:A1:X12:1','ref-007:X7:1','ref-007:X7:2','ref-008:PS1:+','ref-008:X12:1','ref-008:X12:2','ref-009:X14:1','ref-009:X14:2','ref-010:K2:11','ref-011:KM4:13','ref-011:KM4:21','ref-012:S2:13','ref-012:S3:21','ref-022:B2:1'],
    ['ref-007:A1:X10:2','ref-007:A1:X10:6','ref-007:A1:X11:1','ref-007:A1:X12:2','ref-007:X8:1','ref-007:X8:2','ref-008:PS1:-','ref-008:X13:1','ref-008:X13:2','ref-009:X15:1','ref-009:X15:2','ref-010:K2:A2','ref-011:KM4:A2','ref-019:X23:1','ref-019:X23:2','ref-020:X21:1','ref-020:X21:2','ref-022:B2:3']
  ]);
  const coilCommand=report.globalNets.find(net=>net.pins.some(pin=>pin.sheetId==='ref-007'&&pin.ref==='A1'&&pin.number==='X12:3'));
  assert.deepEqual(coilCommand.pins.map(pin=>pin.sheetId+':'+pin.ref+':'+pin.number),['ref-007:A1:X12:3','ref-010:K2:A1']);
  const outputSupply=report.globalNets.find(net=>net.pins.some(pin=>pin.sheetId==='ref-007'&&pin.ref==='A1'&&pin.number==='X12:1'));
  assert.ok(outputSupply.pins.some(pin=>pin.sheetId==='ref-009'&&pin.ref==='X14'));
  assert.ok(project.objects.some(object => object.sheetId === 'ref-007' && object.ref === 'B1' && object.componentId === 'ifm-ifs204'));
  assert.ok(project.objects.some(object => object.sheetId === 'ref-007' && object.ref === 'A1' && object.componentId === 'siemens-6es7212-1ae40-0xb0'));
  const saved = engine.parseProject(engine.serializeProject(project));
  assert.equal(saved.valid, true, saved.errors.join(' '));
  const switchedContactorNet=report.globalNets.find(net=>net.pins.some(pin=>pin.sheetId==='ref-010'&&pin.ref==='K2'&&pin.number==='14'));
  assert.deepEqual(switchedContactorNet.pins.map(pin=>pin.sheetId+':'+pin.ref+':'+pin.number),['ref-007:A1:X10:13','ref-010:K2:14','ref-011:KM4:A1','ref-016:X18:1','ref-016:X18:2']);
  assert.deepEqual(engine.analyzeProject(saved.project).sheets.map(sheet => sheet.analysis.netCount), [0,0,0,0,0,28,17,5,2,5,5,3,0,1,1,1,0,1,2,2,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]);
  const relayNcInput=report.globalNets.find(net=>net.pins.some(pin=>pin.sheetId==='ref-010'&&pin.ref==='K2'&&pin.number==='12'));
  assert.deepEqual(relayNcInput.pins.map(pin=>pin.sheetId+':'+pin.ref+':'+pin.number),['ref-007:A1:X10:12','ref-010:K2:12','ref-015:X17:1','ref-015:X17:2']);
  assert.deepEqual(engine.analyzeProject(saved.project).sheets.map(sheet => sheet.analysis.netCount), [0,0,0,0,0,28,17,5,2,5,5,3,0,1,1,1,0,1,2,2,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]);
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
  assert.deepEqual([report.crossSheetConnectionCount,report.localOpenEndpointCount,report.openEndpointCount],[29,63,0]);
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
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.openEndpointCount],[2,23,2,13]);
  assert.match(project.objects.find(object=>object.id==='doc-ref-009-plus').text,/X14 supplies CPU L\+\/3L\+, K2:11, S2\/S3 and F1:97 via A1\/018; A1\/019 leaves the output topology unchanged/);
  const terminalNet=ref=>page.nets.find(net=>net.pins.some(pin=>pin.ref===ref)).pins.map(pin=>ref+':'+pin.number).sort();
  assert.deepEqual(terminalNet('X14'),['X14:1','X14:2']);
  assert.deepEqual(terminalNet('X15'),['X15:1','X15:2']);
  assert.deepEqual(engine.crossSheetConnectors(project,'ref-009').map(item=>[item.name,item.targetSheetNumber,item.targetRef]),[
    ['+24 V DC','A1/008','X12'],['+24 V DC','A1/007','X7'],['0 V DC','A1/008','X13'],['0 V DC','A1/007','X8'],
    ['+24 V DC · output group 3L+','A1/007','A1'],['0 V DC · relay coil return','A1/010','K2'],
    ['+24 V DC · K2 common','A1/010','K2'],['0 V DC · KM4 coil return','A1/011','KM4'],
    ['+24 V DC · operator inputs','A1/012','S2'],['X14 +24 V DC · F1 overload trip contact 97','A1/006','F1'],['+24 V DC · X14 to PN2070 B2 L+','A1/022','B2'],['PN2070 B2 L− · CPU 2M · X15 0 V DC','A1/022','B2'],['XT6 spare interface return','A1/019','X23']
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
  assert.deepEqual(coilNet('A1').pins.map(pin=>pin.sheetId+':'+pin.ref+':'+pin.number),['ref-007:A1:X12:3','ref-010:K2:A1']);
  assert.ok(coilNet('A2').pins.some(pin=>pin.sheetId==='ref-009'&&pin.ref==='X15'));
  assert.match(project.objects.find(object=>object.id==='doc-ref-010-limit').text,/K2:11\/14 route to the KM4 coil on A1\/011.*DI a\.6.*K2:12 routes to DI a\.5/i);
  const routed=project.objects.filter(object=>object.sheetId==='ref-007'&&object.kind==='wire'&&object.id.startsWith('a1-010-w07-'));
  assert.equal(routed.length,5);
  assert.ok(routed.every(wire=>wire.x1===wire.x2||wire.y1===wire.y2),'A1/010 PLC supply and output paths must stay orthogonal');
  assert.match(project.description,/One hundred authored sheets/);
  assert.match(project.objects.find(object=>object.id==='doc-ref-003-line-19').text,/2966171.*K2/);
  const roundTrip=engine.parseProject(engine.serializeProject(project));
  assert.equal(roundTrip.valid,true,roundTrip.errors.join(' '));
  assert.equal(engine.analyzeProject(roundTrip.project).globalNetCount,44);
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
  assert.deepEqual(net('A1').pins.map(pin=>pin.sheetId+':'+pin.ref+':'+pin.number),['ref-007:A1:X10:13','ref-010:K2:14','ref-011:KM4:A1','ref-016:X18:1','ref-016:X18:2']);
  assert.ok(net('A2').pins.some(pin=>pin.sheetId==='ref-009'&&pin.ref==='X15'));
  assert.ok(net('13').pins.some(pin=>pin.sheetId==='ref-009'&&pin.ref==='X14'));
  assert.ok(net('13').pins.some(pin=>pin.sheetId==='ref-010'&&pin.ref==='K2'&&pin.number==='11'));
  assert.ok(net('13').pins.some(pin=>pin.sheetId==='ref-011'&&pin.ref==='KM4'&&pin.number==='13'));
  assert.ok(net('21').pins.some(pin=>pin.sheetId==='ref-009'&&pin.ref==='X14'));
  assert.ok(net('21').pins.some(pin=>pin.sheetId==='ref-011'&&pin.ref==='KM4'&&pin.number==='13'));
  assert.ok(net('21').pins.some(pin=>pin.sheetId==='ref-011'&&pin.ref==='KM4'&&pin.number==='21'));
  assert.ok(net('13').pins.some(pin=>pin.sheetId==='ref-012'&&pin.ref==='S2'&&pin.number==='13'));
  assert.deepEqual(net('22').pins.map(pin=>pin.sheetId+':'+pin.ref+':'+pin.number),['ref-007:A1:X10:11','ref-011:KM4:22','ref-014:X16:1','ref-014:X16:2']);
  assert.deepEqual(net('14').pins.map(pin=>pin.sheetId+':'+pin.ref+':'+pin.number),['ref-007:A1:X10:10','ref-011:KM4:14']);
  const plus=report.globalNets.find(item=>item.pins.some(p=>p.sheetId==='ref-010'&&p.ref==='K2'&&p.number==='11'));
  assert.ok(plus.pins.some(pin=>pin.sheetId==='ref-009'&&pin.ref==='X14'));
  assert.match(project.objects.find(object=>object.id==='doc-ref-011-coil-spec').text,/100 mA average/i);
  assert.match(fs.readFileSync(path.join(__dirname,'docs','components','schneider-electric-lc1d09bd.md'),'utf8'),/FA33405.*100 mA/);
  assert.match(project.objects.find(object=>object.id==='doc-ref-011-limit').text,/main poles remain open.*NC 21–22 routes I0\.4.*NO 13–14 routes I0\.3/i);
  assert.deepEqual(engine.crossSheetConnectors(project,'ref-011').map(item=>[item.name,item.targetSheetNumber,item.targetRef]),[
    ['K2 NO output → KM4 coil','A1/010','K2'],['0 V DC · KM4 coil return','A1/009','X15'],['+24 V DC · KM4 status input','A1/012','S2'],['KM4 auxiliary NO 14 · contact status','A1/007','A1'],['KM4 auxiliary NC 22 · PLC DI a.4','A1/014','X16']
  ]);
  const routed=project.objects.filter(object=>object.kind==='wire'&&['ref-007','ref-011'].includes(object.sheetId)&&object.id.startsWith('a1-014'));
  assert.equal(routed.length,4);
  assert.ok(routed.every(wire=>wire.x1===wire.x2||wire.y1===wire.y2),'A1/014 routes must stay orthogonal');
  const roundTrip=engine.parseProject(engine.serializeProject(project));
  assert.equal(roundTrip.valid,true,roundTrip.errors.join(' '));
  assert.equal(engine.analyzeProject(roundTrip.project).globalNetCount,44);
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
  assert.equal(engine.analyzeProject(reopened.project).globalNetCount,44);
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
  assert.equal(engine.analyzeProject(returned.project).globalNetCount,44);
});

test('A1/014 wires source-backed KM4 NC auxiliary contact 21–22 to PLC DI a.4', () => {
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(project),page=report.sheets.find(sheet=>sheet.id==='ref-014').analysis;
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.openEndpointCount],[1,2,1,2]);
  const km4=project.objects.find(object=>object.sheetId==='ref-011'&&object.ref==='KM4');
  const cpu=project.objects.find(object=>object.sheetId==='ref-007'&&object.ref==='A1');
  assert.deepEqual(engine.worldPins(cpu).filter(pin=>pin.number==='X10:11').map(pin=>[pin.number,pin.name,pin.x,pin.y]),[['X10:11','DI a.4',670,454]]);
  assert.equal(engine.component(km4.componentId).electricalFunctions.contactor.auxiliaryContacts.find(contact=>contact.first==='aux-21').normalState,'closed');
  const contactNet=pin=>report.globalNets.find(net=>net.pins.some(item=>item.sheetId==='ref-011'&&item.ref==='KM4'&&item.number===pin));
  assert.ok(contactNet('21').pins.some(pin=>pin.sheetId==='ref-009'&&pin.ref==='X14'));
  assert.deepEqual(contactNet('22').pins.map(pin=>pin.sheetId+':'+pin.ref+':'+pin.number),['ref-007:A1:X10:11','ref-011:KM4:22','ref-014:X16:1','ref-014:X16:2']);
  assert.deepEqual(engine.crossSheetConnectors(project,'ref-007').filter(item=>item.name.includes('KM4 auxiliary NC')).map(item=>[item.name,item.targetSheetNumber,item.targetRef]),[['KM4 auxiliary NC 22 · PLC DI a.4','A1/014','X16']]);
  assert.match(fs.readFileSync(path.join(__dirname,'docs','components','siemens-s7-1200-cpu-1212c.md'),'utf8'),/Table A-50.*X10:11.*DI a\.4/s);
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  assert.deepEqual([engine.analyzeProject(reopened.project).crossSheetConnectionCount,engine.analyzeProject(reopened.project).globalNetCount,engine.analyzeProject(reopened.project).openEndpointCount],[29,44,0]);
});

test('A1/015 routes the source-backed Phoenix Contact K2 NC output to PLC DI a.5', () => {
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(project);
  const page=report.sheets.find(sheet=>sheet.id==='ref-015').analysis;
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.openEndpointCount],[1,2,1,2]);
  const k2=project.objects.find(object=>object.sheetId==='ref-010'&&object.ref==='K2');
  const cpu=project.objects.find(object=>object.sheetId==='ref-007'&&object.ref==='A1');
  assert.deepEqual(engine.worldPins(cpu).filter(pin=>pin.number==='X10:12').map(pin=>[pin.number,pin.name,pin.x,pin.y]),[['X10:12','DI a.5',670,472]]);
  assert.deepEqual(engine.worldPins(k2).filter(pin=>pin.number==='12').map(pin=>[pin.number,pin.x,pin.y]),[['12',670,355]]);
  const net=report.globalNets.find(item=>item.pins.some(pin=>pin.sheetId==='ref-010'&&pin.ref==='K2'&&pin.number==='12'));
  assert.deepEqual(net.pins.map(pin=>pin.sheetId+':'+pin.ref+':'+pin.number),['ref-007:A1:X10:12','ref-010:K2:12','ref-015:X17:1','ref-015:X17:2']);
  assert.equal(engine.component(k2.componentId).electricalFunctions.changeoverContact.normallyClosed,'contact-12');
  assert.match(fs.readFileSync(path.join(__dirname,'docs','components','phoenix-contact-2966171.md'),'utf8'),/12 \| Contact \| Normally closed contact/);
  assert.ok(project.objects.some(object=>object.id==='doc-ref-015-input-05'&&/I0\.5.*X10:12.*K2 NC contact 11–12/.test(object.text)));
  assert.match(project.objects.find(object=>object.id==='doc-ref-015-limit').text,/relay state, PLC logic and diagnostic interpretation are not modeled/i);
  const routed=project.objects.filter(object=>object.kind==='wire'&&['ref-007','ref-010'].includes(object.sheetId)&&object.id.startsWith('a1-015'));
  assert.equal(routed.length,3);
  assert.ok(routed.every(wire=>wire.x1===wire.x2||wire.y1===wire.y2),'A1/015 routes must stay orthogonal');
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  assert.deepEqual([engine.analyzeProject(reopened.project).crossSheetConnectionCount,engine.analyzeProject(reopened.project).globalNetCount,engine.analyzeProject(reopened.project).openEndpointCount],[29,44,0]);
});

test('A1/016 documents K2 NO output 14 on PLC DI a.6 without simulating the relay state', () => {
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(project);
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-016').number,'A1/016');
  const page=report.sheets.find(sheet=>sheet.id==='ref-016').analysis;
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.openEndpointCount],[1,2,1,2]);
  const k2=project.objects.find(object=>object.sheetId==='ref-010'&&object.ref==='K2');
  const cpu=project.objects.find(object=>object.sheetId==='ref-007'&&object.ref==='A1');
  assert.equal(engine.component(k2.componentId).electricalFunctions.changeoverContact.normallyOpen,'contact-14');
  assert.deepEqual(engine.worldPins(cpu).filter(pin=>pin.number==='X10:13').map(pin=>[pin.number,pin.name,pin.x,pin.y]),[['X10:13','DI a.6',670,490]]);
  assert.deepEqual(engine.worldPins(k2).filter(pin=>pin.number==='14').map(pin=>[pin.number,pin.x,pin.y]),[['14',670,405]]);
  const net=report.globalNets.find(item=>item.pins.some(pin=>pin.sheetId==='ref-010'&&pin.ref==='K2'&&pin.number==='14'));
  assert.deepEqual(net.pins.map(pin=>pin.sheetId+':'+pin.ref+':'+pin.number),['ref-007:A1:X10:13','ref-010:K2:14','ref-011:KM4:A1','ref-016:X18:1','ref-016:X18:2']);
  assert.deepEqual(engine.crossSheetConnectors(project,'ref-010').filter(item=>item.name==='K2 NO output 14 · PLC DI a.6').map(item=>[item.name,item.targetSheetNumber,item.targetRef]),[['K2 NO output 14 · PLC DI a.6','A1/016','X18']]);
  assert.match(fs.readFileSync(path.join(__dirname,'docs','components','phoenix-contact-2966171.md'),'utf8'),/14 \| Contact \| Normally open contact/);
  assert.ok(project.objects.some(object=>object.id==='doc-ref-016-input-06'&&/I0\.6.*X10:13.*K2 NO output 14/.test(object.text)));
  assert.match(project.objects.find(object=>object.id==='doc-ref-016-limit').text,/relay switching, PLC logic and diagnostic interpretation are not modeled/i);
  const routed=project.objects.filter(object=>object.kind==='wire'&&['ref-007','ref-010'].includes(object.sheetId)&&object.id.startsWith('a1-016'));
  assert.equal(routed.length,4);
  assert.ok(routed.every(wire=>wire.x1===wire.x2||wire.y1===wire.y2),'A1/016 routes must stay orthogonal');
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  assert.deepEqual([engine.analyzeProject(reopened.project).sheetCount,engine.analyzeProject(reopened.project).crossSheetConnectionCount,engine.analyzeProject(reopened.project).globalNetCount,engine.analyzeProject(reopened.project).openEndpointCount],[100,29,44,0]);
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
    /Q0\.0.*X12:3 \/ DQ a\.0.*K2 coil A1/
  ]) assert.ok(texts.some(text=>assignment.test(text)),`Missing allocation ${assignment}`);
  assert.match(texts.at(-1),/PLC address configuration, trip\/reset behavior and signal interpretation are not modeled/i);
  assert.ok(project.objects.some(object=>object.id==='doc-ref-002-line-17'&&/A1\/017.*PLC I\/O allocation summary.*I0\.7 overload trip.*F1:97–98/.test(object.text)));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  assert.deepEqual([engine.analyzeProject(reopened.project).sheetCount,engine.analyzeProject(reopened.project).componentCount,engine.analyzeProject(reopened.project).wireCount,engine.analyzeProject(reopened.project).crossSheetConnectionCount,engine.analyzeProject(reopened.project).globalNetCount,engine.analyzeProject(reopened.project).openEndpointCount],[100,40,354,29,44,0]);
});

test('A1/018 routes Siemens F1 NO trip contact 97–98 to CPU DI a.7 through the existing 24 V supply', () => {
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(project);
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-018').number,'A1/018');
  const page=report.sheets.find(sheet=>sheet.id==='ref-018').analysis;
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.openEndpointCount],[1,2,1,2]);
  const f1=project.objects.find(object=>object.sheetId==='ref-006'&&object.ref==='F1');
  const cpu=project.objects.find(object=>object.sheetId==='ref-007'&&object.ref==='A1');
  assert.deepEqual(engine.worldPins(f1).filter(pin=>['97','98'].includes(pin.number)).map(pin=>[pin.number,pin.x,pin.y]),[['97',970,415],['98',970,430]]);
  assert.deepEqual(engine.worldPins(cpu).filter(pin=>pin.number==='X10:14').map(pin=>[pin.number,pin.name,pin.x,pin.y]),[['X10:14','DI a.7',670,508]]);
  const tripSignal=report.globalNets.find(net=>net.pins.some(pin=>pin.sheetId==='ref-006'&&pin.ref==='F1'&&pin.number==='98'));
  assert.deepEqual(tripSignal.pins.map(pin=>pin.sheetId+':'+pin.ref+':'+pin.number),['ref-006:F1:98','ref-007:A1:X10:14','ref-018:X19:1','ref-018:X19:2']);
  const supply=report.globalNets.find(net=>net.pins.some(pin=>pin.sheetId==='ref-006'&&pin.ref==='F1'&&pin.number==='97'));
  assert.ok(supply.pins.some(pin=>pin.sheetId==='ref-009'&&pin.ref==='X14'&&pin.number==='1'));
  assert.ok(supply.pins.some(pin=>pin.sheetId==='ref-009'&&pin.ref==='X14'&&pin.number==='2'));
  const contactorControl=report.globalNets.find(net=>net.pins.some(pin=>pin.sheetId==='ref-006'&&pin.ref==='F1'&&pin.number==='96'));
  assert.ok(!contactorControl.pins.some(pin=>pin.sheetId==='ref-007'&&pin.ref==='A1'&&pin.number==='X10:14'));
  assert.deepEqual(project.crossSheetConnections.filter(connection=>connection.id.startsWith('a1-018-')).map(connection=>connection.id),['a1-018-f1-trip-supply','a1-018-f1-trip-input','a1-018-plc-trip-input']);
  const routes=project.objects.filter(object=>object.kind==='wire'&&object.id.startsWith('a1-018-'));
  assert.equal(routes.length,7);
  assert.ok(routes.every(wire=>wire.x1===wire.x2||wire.y1===wire.y2),'A1/018 routes must stay orthogonal');
  const source=fs.readFileSync(path.join(__dirname,'docs','components','siemens-3ru2126-4ab0.md'),'utf8');
  assert.match(source,/97–98 as an NO auxiliary contact/);
  assert.match(source,/suitable for PLCs/);
  assert.ok(project.objects.some(object=>object.id==='doc-ref-017-input-07'&&/I0\.7.*F1 NO trip contact 97–98.*A1\/018/.test(object.text)));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  assert.deepEqual([engine.analyzeProject(reopened.project).sheetCount,engine.analyzeProject(reopened.project).componentCount,engine.analyzeProject(reopened.project).wireCount,engine.analyzeProject(reopened.project).crossSheetConnectionCount,engine.analyzeProject(reopened.project).globalNetCount,engine.analyzeProject(reopened.project).openEndpointCount],[100,40,354,29,44,0]);
});

test('A1/019 documents Siemens CPU 1212C digital-output allocation and wires the spare interface', () => {
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(project);
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-019').number,'A1/019');
  const page=report.sheets.find(sheet=>sheet.id==='ref-019').analysis;
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.openEndpointCount],[2,2,2,2]);
  const members = ref => report.globalNets.find(net => net.pins.some(pin => pin.ref === ref)).pins.map(pin => pin.ref + ':' + pin.number);
  assert.deepEqual(members('X22').sort(), ['A1:X12:4', 'X22:1', 'X22:2']);
  assert.ok(members('X23').includes('X15:2'));
  assert.ok(members('X23').includes('A1:X12:2'));
  const texts=project.objects.filter(object=>object.sheetId==='ref-019'&&object.kind==='text').map(object=>object.text);
  for(const assignment of [
    /X12:1.*3L\+.*\+24 V DC.*A1\/009/,
    /Q0\.0.*X12:3 \/ DQ a\.0.*K2 coil A1.*A1\/007–A1\/010/,
    /Q0\.1.*X12:4 \/ DQ a\.1.*Routed to XT6/,
    /Q0\.2.*X12:5 \/ DQ a\.2.*Unassigned in the modeled project scope/,
    /Q0\.3.*X12:6 \/ DQ a\.3.*Unassigned in the modeled project scope/,
    /X12:2.*3M.*not a digital output channel/,
    /Q0\.4.*X12:7 \/ DQ a\.4.*Unassigned in the modeled project scope/,
    /Q0\.5.*X12:8 \/ DQ a\.5.*Unassigned in the modeled project scope/
  ]) assert.ok(texts.some(text=>assignment.test(text)),`Missing output allocation ${assignment}`);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','siemens-s7-1200-cpu-1212c.md'),'utf8');
  assert.match(source,/System Manual, V4\.7/);
  assert.match(source,/pins 3–8 to DQ a\.0–a\.5/);
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  assert.deepEqual([engine.analyzeProject(reopened.project).sheetCount,engine.analyzeProject(reopened.project).componentCount,engine.analyzeProject(reopened.project).wireCount,engine.analyzeProject(reopened.project).crossSheetConnectionCount,engine.analyzeProject(reopened.project).globalNetCount,engine.analyzeProject(reopened.project).openEndpointCount],[100,40,354,29,44,0]);
});

test('A1/020 documents CPU 1212C analog-input allocation without adding components or wiring', () => {
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(project);
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-020').number,'A1/020');
  const page=report.sheets.find(sheet=>sheet.id==='ref-020').analysis;
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.openEndpointCount],[2,4,2,4]);
  const analogSignal = report.globalNets.find(net => net.pins.some(pin => pin.ref === 'X20' && pin.sheetId === 'ref-020'));
  assert.deepEqual(analogSignal.pins.map(pin => pin.ref + ':' + pin.number), ['A1:X11:2', 'X20:1', 'X20:2', 'B2:2']);
  const texts=project.objects.filter(object=>object.sheetId==='ref-020'&&object.kind==='text').map(object=>object.text);
  for(const assignment of [
    /X11:1.*2M.*analog common.*not an analog input channel/,
    /AI0.*X11:2.*0–10 V DC.*B2 OUT2 on A1\/022/,
    /AI1.*X11:3.*0–10 V DC.*Unassigned in the modeled project scope/
  ]) assert.ok(texts.some(text=>assignment.test(text)),`Missing analog-input allocation ${assignment}`);
  assert.ok(texts.some(text=>/AI0 wiring is shown/.test(text)));
  const source=fs.readFileSync(path.join(__dirname,'docs','components','siemens-s7-1200-cpu-1212c.md'),'utf8');
  assert.match(source,/System Manual, V4\.7/);
  assert.match(source,/X11:1 is 2M, X11:2 is AI0, and X11:3 is AI1/);
  assert.match(source,/two onboard 0–10 V DC analog inputs/);
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  assert.deepEqual([engine.analyzeProject(reopened.project).sheetCount,engine.analyzeProject(reopened.project).componentCount,engine.analyzeProject(reopened.project).wireCount,engine.analyzeProject(reopened.project).crossSheetConnectionCount,engine.analyzeProject(reopened.project).globalNetCount,engine.analyzeProject(reopened.project).openEndpointCount],[100,40,354,29,44,0]);
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
  assert.deepEqual([engine.analyzeProject(reopened.project).sheetCount,engine.analyzeProject(reopened.project).componentCount,engine.analyzeProject(reopened.project).wireCount,engine.analyzeProject(reopened.project).crossSheetConnectionCount,engine.analyzeProject(reopened.project).globalNetCount,engine.analyzeProject(reopened.project).openEndpointCount],[100,40,354,29,44,0]);
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
  assert.ok(html.includes("processPoint:'Process point'"));
  assert.ok(html.includes("signalConfigurationNote:'Signal configuration note'"));
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
  assert.deepEqual([engine.analyzeProject(reopened.project).sheetCount,engine.analyzeProject(reopened.project).componentCount,engine.analyzeProject(reopened.project).wireCount,engine.analyzeProject(reopened.project).crossSheetConnectionCount,engine.analyzeProject(reopened.project).globalNetCount,engine.analyzeProject(reopened.project).openEndpointCount],[100,40,354,29,44,0]);
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
  assert.deepEqual([engine.analyzeProject(reopened.project).sheetCount,engine.analyzeProject(reopened.project).componentCount,engine.analyzeProject(reopened.project).wireCount,engine.analyzeProject(reopened.project).crossSheetConnectionCount,engine.analyzeProject(reopened.project).globalNetCount,engine.analyzeProject(reopened.project).openEndpointCount],[100,40,354,29,44,0]);
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
  assert.deepEqual([engine.analyzeProject(reopened.project).sheetCount,engine.analyzeProject(reopened.project).componentCount,engine.analyzeProject(reopened.project).wireCount,engine.analyzeProject(reopened.project).crossSheetConnectionCount,engine.analyzeProject(reopened.project).globalNetCount,engine.analyzeProject(reopened.project).openEndpointCount],[100,40,354,29,44,0]);
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
  assert.deepEqual([engine.analyzeProject(reopened.project).sheetCount,engine.analyzeProject(reopened.project).componentCount,engine.analyzeProject(reopened.project).wireCount,engine.analyzeProject(reopened.project).crossSheetConnectionCount,engine.analyzeProject(reopened.project).globalNetCount,engine.analyzeProject(reopened.project).openEndpointCount],[100,40,354,29,44,0]);
});


test('A1/026 documents idealized CPU 1212C AI0 quantization without claiming measured resolution', () => {
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(project),page=report.sheets.find(sheet=>sheet.id==='ref-026').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-026').number,'A1/026');
  assert.equal(project.status,'Authored opening set: A1/001–A1/100.');
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
  assert.deepEqual([engine.analyzeProject(reopened.project).sheetCount,engine.analyzeProject(reopened.project).componentCount,engine.analyzeProject(reopened.project).wireCount,engine.analyzeProject(reopened.project).crossSheetConnectionCount,engine.analyzeProject(reopened.project).globalNetCount,engine.analyzeProject(reopened.project).openEndpointCount],[100,40,354,29,44,0]);
});


test('A1/027 records CPU 1212C AI input response without assigning smoothing or claiming system response', () => {
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(project),page=report.sheets.find(sheet=>sheet.id==='ref-027').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-027').number,'A1/027');
  assert.equal(project.status,'Authored opening set: A1/001–A1/100.');
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
  assert.deepEqual([engine.analyzeProject(reopened.project).sheetCount,engine.analyzeProject(reopened.project).componentCount,engine.analyzeProject(reopened.project).wireCount,engine.analyzeProject(reopened.project).crossSheetConnectionCount,engine.analyzeProject(reopened.project).globalNetCount,engine.analyzeProject(reopened.project).openEndpointCount],[100,40,354,29,44,0]);
});

test('A1/028 documents CPU 1212C rated, overshoot and overflow codes without assigning diagnostics', () => {
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(project),page=report.sheets.find(sheet=>sheet.id==='ref-028').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-028').number,'A1/028');
  assert.equal(project.status,'Authored opening set: A1/001–A1/100.');
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
  assert.deepEqual([engine.analyzeProject(reopened.project).sheetCount,engine.analyzeProject(reopened.project).componentCount,engine.analyzeProject(reopened.project).wireCount,engine.analyzeProject(reopened.project).crossSheetConnectionCount,engine.analyzeProject(reopened.project).globalNetCount,engine.analyzeProject(reopened.project).openEndpointCount],[100,40,354,29,44,0]);
});


test('A1/029 records CPU 1212C analog cable limit without assigning an installed cable', () => {
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(project),page=report.sheets.find(sheet=>sheet.id==='ref-029').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-029').number,'A1/029');
  assert.equal(project.status,'Authored opening set: A1/001–A1/100.');
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
  assert.deepEqual([engine.analyzeProject(reopened.project).sheetCount,engine.analyzeProject(reopened.project).componentCount,engine.analyzeProject(reopened.project).wireCount,engine.analyzeProject(reopened.project).crossSheetConnectionCount,engine.analyzeProject(reopened.project).globalNetCount,engine.analyzeProject(reopened.project).openEndpointCount],[100,40,354,29,44,0]);
});


test('A1/030 records PN2070 output parameter ranges without assigning configured endpoints', () => {
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(project),page=report.sheets.find(sheet=>sheet.id==='ref-030').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-030').number,'A1/030');
  assert.equal(project.revision,'Opening set 9.8');
  assert.equal(project.status,'Authored opening set: A1/001–A1/100.');
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  const texts=project.objects.filter(object=>object.sheetId==='ref-030'&&object.kind==='text').map(object=>object.text);
  for(const required of ['0–10 V','1:5','2,000 Ω','0–320 bar','80–400 bar','manufacturer-listed parameter ranges','assigns no ASP2/AEP2','ifm PN2070-02'])
    assert.ok(texts.some(text=>text.includes(required)),`Missing PN2070 parameter range or scope boundary: ${required}`);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('analog start point 0–320 bar and analog end point 80–400 bar'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  assert.deepEqual([engine.analyzeProject(reopened.project).sheetCount,engine.analyzeProject(reopened.project).componentCount,engine.analyzeProject(reopened.project).wireCount,engine.analyzeProject(reopened.project).crossSheetConnectionCount,engine.analyzeProject(reopened.project).globalNetCount,engine.analyzeProject(reopened.project).openEndpointCount],[100,40,354,29,44,0]);
});


test('A1/031 PN2070 pressure limits remain manufacturer ratings rather than selected operating conditions',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(project),page=report.sheets.find(sheet=>sheet.id==='ref-031').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-031').number,'A1/031');
  assert.equal(project.revision,'Opening set 9.8');
  assert.equal(project.status,'Authored opening set: A1/001–A1/100.');
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
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[100,40,354,29,44,0]);
});


test('A1/032 records the PN2070 medium temperature range without assigning process conditions',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(project),page=report.sheets.find(sheet=>sheet.id==='ref-032').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-032').number,'A1/032');
  assert.equal(project.revision,'Opening set 9.8');
  assert.equal(project.status,'Authored opening set: A1/001–A1/100.');
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
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[100,40,354,29,44,0]);
});

 
test('A1/033 records PN2070 electrical ratings without claiming supply adequacy',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(project),page=report.sheets.find(sheet=>sheet.id==='ref-033').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-033').number,'A1/033');
  assert.equal(project.revision,'Opening set 9.8');
  assert.equal(project.status,'Authored opening set: A1/001–A1/100.');
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
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[100,40,354,29,44,0]);
});


test('A1/034 records the PN2070 power-on delay without assigning system response',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(project),page=report.sheets.find(sheet=>sheet.id==='ref-034').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-034').number,'A1/034');
  assert.equal(project.revision,'Opening set 9.8');
  assert.equal(project.status,'Authored opening set: A1/001–A1/100.');
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
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[100,40,354,29,44,0]);
});


test('A1/035 records PN2070 electrical protection characteristics without making installation claims',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(project),page=report.sheets.find(sheet=>sheet.id==='ref-035').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-035').number,'A1/035');
  assert.equal(project.revision,'Opening set 9.8');
  assert.equal(project.status,'Authored opening set: A1/001–A1/100.');
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
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[100,40,354,29,44,0]);
});


test('A1/036 records PN2070 minimum insulation resistance without implying a project test',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(project),page=report.sheets.find(sheet=>sheet.id==='ref-036').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-036').number,'A1/036');
  assert.equal(project.revision,'Opening set 9.8');
  assert.equal(project.status,'Authored opening set: A1/001–A1/100.');
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
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[100,40,354,29,44,0]);
});


test('A1/037 records PN2070 switching-output specifications without assigning a load',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(project),page=report.sheets.find(sheet=>sheet.id==='ref-037').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-037').number,'A1/037');
  assert.equal(project.revision,'Opening set 9.8');
  assert.equal(project.status,'Authored opening set: A1/001–A1/100.');
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
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[100,40,354,29,44,0]);
});


test('A1/038 records PN2070 CMPT 2 switching-point ranges without configuring thresholds',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(project),page=report.sheets.find(sheet=>sheet.id==='ref-038').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-038').number,'A1/038');
  assert.equal(project.revision,'Opening set 9.8');
  assert.equal(project.status,'Authored opening set: A1/001–A1/100.');
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
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[100,40,354,29,44,0]);
});


test('A1/039 records PN2070 CMPT 3 switching-point ranges without configuring thresholds',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(project),page=report.sheets.find(sheet=>sheet.id==='ref-039').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-039').number,'A1/039');
  assert.equal(project.revision,'Opening set 9.8');
  assert.equal(project.status,'Authored opening set: A1/001–A1/100.');
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
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[100,40,354,29,44,0]);
});


test('A1/040 records the PN2070 manufacturer tightening-torque recommendation without selecting an installation value',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(project),page=report.sheets.find(sheet=>sheet.id==='ref-040').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-040').number,'A1/040');
  assert.equal(project.revision,'Opening set 9.8');
  assert.equal(project.status,'Authored opening set: A1/001–A1/100.');
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
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[100,40,354,29,44,0]);
});


test('A1/041 records PN2070 ambient and storage temperature ratings without assigning site conditions',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(project),page=report.sheets.find(sheet=>sheet.id==='ref-041').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-041').number,'A1/041');
  assert.equal(project.revision,'Opening set 9.8');
  assert.equal(project.status,'Authored opening set: A1/001–A1/100.');
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
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[100,40,354,29,44,0]);
});


test('A1/042 records the PN2070 minimum pressure-cycle datum without claiming project life',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(project),page=report.sheets.find(sheet=>sheet.id==='ref-042').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-042').number,'A1/042');
  assert.equal(project.revision,'Opening set 9.8');
  assert.equal(project.status,'Authored opening set: A1/001–A1/100.');
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
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[100,40,354,29,44,0]);
});


test('A1/043 records PN2070 product dimensions and weight without assigning installation geometry',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(project),page=report.sheets.find(sheet=>sheet.id==='ref-043').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-043').number,'A1/043');
  assert.equal(project.revision,'Opening set 9.8');
  assert.equal(project.status,'Authored opening set: A1/001–A1/100.');
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
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[100,40,354,29,44,0]);
});


test('A1/044 records the PN2070 restrictor product datum without assigning a retrofit',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(project),page=report.sheets.find(sheet=>sheet.id==='ref-044').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-044').number,'A1/044');
  assert.equal(project.revision,'Opening set 9.8');
  assert.equal(project.status,'Authored opening set: A1/001–A1/100.');
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
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[100,40,354,29,44,0]);
});


test('A1/045 records PN2070 manufacturer IP ratings without claiming assembly protection',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(project),page=report.sheets.find(sheet=>sheet.id==='ref-045').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-045').number,'A1/045');
  assert.equal(project.revision,'Opening set 9.8');
  assert.equal(project.status,'Authored opening set: A1/001–A1/100.');
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
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[100,40,354,29,44,0]);
});


test('A1/046 records PN2070 shock and vibration data without claiming application qualification',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(project),page=report.sheets.find(sheet=>sheet.id==='ref-046').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-046').number,'A1/046');
  assert.equal(project.revision,'Opening set 9.8');
  assert.equal(project.status,'Authored opening set: A1/001–A1/100.');
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
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[100,40,354,29,44,0]);
});


test('A1/047 records PN2070 wetted-parts material without assigning chemical compatibility',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(project),page=report.sheets.find(sheet=>sheet.id==='ref-047').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-047').number,'A1/047');
  assert.equal(project.revision,'Opening set 9.8');
  assert.equal(project.status,'Authored opening set: A1/001–A1/100.');
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
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[100,40,354,29,44,0]);
});


test('A1/048 records PN2070 listed materials without assigning part locations or compatibility',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(project),page=report.sheets.find(sheet=>sheet.id==='ref-048').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-048').number,'A1/048');
  assert.equal(project.revision,'Opening set 9.8');
  assert.equal(project.status,'Authored opening set: A1/001–A1/100.');
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
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[100,40,354,29,44,0]);
});



test('A1/049 records PN2070 M12 connector details without selecting cable hardware',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(parsed.project),page=report.sheets.find(sheet=>sheet.id==='ref-049').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  assert.equal(project.revision,'Opening set 9.8');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-049').number,'A1/049');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-049').name,'ifm PN2070 M12 connector details');
  assert.equal(project.status,'Authored opening set: A1/001–A1/100.');
  for(const [id,required] of [['doc-ref-002-line-48','A1/049  ifm PN2070 M12 connector details'],['doc-ref-004-line-40','Revision 4.6 | 2026-11-13 | A1/049']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/049 index or revision record: '+id);
  for(const required of ['1 × M12 connector','A-coded','4 gold-plated contacts','pin functions are documented separately on A1/021','No cable or mating connector is selected','physical fit','ifm PN2070-02'])
    assert.ok(project.objects.some(object=>object.sheetId==='ref-049'&&object.text.includes(required)),'Missing connector fact or scope: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('one M12 connector, A-coded, with four gold-plated contacts'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[100,40,354,29,44,0]);
});


test('A1/050 records PN2070 display indicators without inferring their behavior',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(parsed.project),page=report.sheets.find(sheet=>sheet.id==='ref-050').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  assert.equal(project.revision,'Opening set 9.8');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-050').number,'A1/050');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-050').name,'ifm PN2070 display indicators');
  assert.equal(project.status,'Authored opening set: A1/001–A1/100.');
  for(const [id,required] of [['doc-ref-002-line-49','A1/050  ifm PN2070 display indicators'],['doc-ref-004-line-41','Revision 4.7 | 2026-11-13 | A1/050']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/050 index or revision record: '+id);
  for(const required of ['3 green LEDs','bar, psi and MPa','2 yellow LEDs','alphanumeric, red/green, 4-digit display','do not assign display-unit selection','the meaning of an indicator state','ifm PN2070-02'])
    assert.ok(project.objects.some(object=>object.sheetId==='ref-050'&&object.text.includes(required)),'Missing display datum or scope: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('three green LEDs for display units bar, psi and MPa'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[100,40,354,29,44,0]);
});


test('A1/051 records the PN2070 process connection designation without selecting mating hardware',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(parsed.project),page=report.sheets.find(sheet=>sheet.id==='ref-051').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  assert.equal(project.revision,'Opening set 9.8');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-051').number,'A1/051');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-051').name,'ifm PN2070 process connection designation');
  assert.equal(project.status,'Authored opening set: A1/001–A1/100.');
  for(const [id,required] of [['doc-ref-002-line-50','A1/051  ifm PN2070 process connection designation'],['doc-ref-004-line-42','Revision 4.8 | 2026-11-13 | A1/051']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/051 index or revision record: '+id);
  for(const required of ['G 1/4 internal thread','DIN EN ISO 1179-2','No mating fitting or seal is selected','does not establish mechanical compatibility or installation suitability','ifm PN2070-02'])
    assert.ok(project.objects.some(object=>object.sheetId==='ref-051'&&object.text.includes(required)),'Missing process-connection datum or limit: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('G 1/4 internal thread, listed as DIN EN ISO 1179-2'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[100,40,354,29,44,0]);
});


test('A1/052 records PN2070 upper-housing rotation without assigning installation geometry',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(parsed.project),page=report.sheets.find(sheet=>sheet.id==='ref-052').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  assert.equal(project.revision,'Opening set 9.8');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-052').number,'A1/052');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-052').name,'ifm PN2070 upper-housing rotation');
  assert.equal(project.status,'Authored opening set: A1/001–A1/100.');
  for(const [id,required] of [['doc-ref-002-line-51','A1/052  ifm PN2070 upper-housing rotation'],['doc-ref-004-line-43','Revision 4.9 | 2026-11-13 | A1/052']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/052 index or revision record: '+id);
  for(const required of ['upper housing portion rotation: up to 345°','does not specify the installed rotation angle','mounting clearance or installation suitability','ifm PN2070-02'])
    assert.ok(project.objects.some(object=>object.sheetId==='ref-052'&&object.text.includes(required)),'Missing rotation datum or limit: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('upper housing portion can be rotated 345°'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[100,40,354,29,44,0]);
});


test('A1/053 records the PN2070 programming-button callout without inferring button behavior',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(parsed.project),page=report.sheets.find(sheet=>sheet.id==='ref-053').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  assert.equal(project.revision,'Opening set 9.8');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-053').number,'A1/053');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-053').name,'ifm PN2070 programming-button callout');
  assert.equal(project.status,'Authored opening set: A1/001–A1/100.');
  for(const [id,required] of [['doc-ref-002-line-52','A1/053  ifm PN2070 programming-button callout'],['doc-ref-004-line-44','Revision 5.0 | 2026-11-13 | A1/053']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/053 index or revision record: '+id);
  for(const required of ['labels a programming button as callout 3','does not document its function','does not assign an operating sequence','ifm PN2070-02'])
    assert.ok(project.objects.some(object=>object.sheetId==='ref-053'&&object.text.includes(required)),'Missing button callout or scope: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('labels a programming button as callout 3'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[100,40,354,29,44,0]);
});


test('A1/054 records the PN2070 relative-pressure classification without deriving a pressure reference',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(parsed.project),page=report.sheets.find(sheet=>sheet.id==='ref-054').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  assert.equal(project.revision,'Opening set 9.8');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-054').number,'A1/054');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-054').name,'ifm PN2070 pressure type');
  assert.equal(project.status,'Authored opening set: A1/001–A1/100.');
  for(const [id,required] of [['doc-ref-002-line-53','A1/054  ifm PN2070 pressure type'],['doc-ref-004-line-45','Revision 5.1 | 2026-11-13 | A1/054']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/054 index or revision record: '+id);
  for(const required of ['Type of pressure: relative pressure','does not specify a project pressure reference','does not derive an absolute-pressure conversion','ifm PN2070-02'])
    assert.ok(project.objects.some(object=>object.sheetId==='ref-054'&&object.text.includes(required)),'Missing pressure-type datum or limit: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('lists type of pressure as relative pressure'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[100,40,354,29,44,0]);
});


test('A1/055 records PN2070 vacuum resistance without assigning project conditions',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(parsed.project),page=report.sheets.find(sheet=>sheet.id==='ref-055').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  assert.equal(project.revision,'Opening set 9.8');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-055').number,'A1/055');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-055').name,'ifm PN2070 vacuum resistance');
  assert.equal(project.status,'Authored opening set: A1/001–A1/100.');
  for(const [id,required] of [['doc-ref-002-line-54','A1/055  ifm PN2070 vacuum resistance'],['doc-ref-004-line-46','Revision 5.2 | 2026-11-13 | A1/055']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/055 index or revision record: '+id);
  for(const required of ['Vacuum resistance: −1000 mbar (−0.1 MPa)','does not assign a project vacuum condition','application suitability','ifm PN2070-02'])
    assert.ok(project.objects.some(object=>object.sheetId==='ref-055'&&object.text.includes(required)),'Missing vacuum datum or scope: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('lists vacuum resistance as −1000 mbar (−0.1 MPa)'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[100,40,354,29,44,0]);
});

test('A1/056 records PN2070 switching output options without selecting a configuration',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(parsed.project),page=report.sheets.find(sheet=>sheet.id==='ref-056').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  assert.equal(project.revision,'Opening set 9.8');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-056').number,'A1/056');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-056').name,'ifm PN2070 switching output options');
  assert.equal(project.status,'Authored opening set: A1/001–A1/100.');
  for(const [id,required] of [['doc-ref-002-line-55','A1/056  ifm PN2070 switching output options'],['doc-ref-004-line-47','Revision 5.3 | 2026-11-13 | A1/056']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/056 index or revision record: '+id);
  for(const required of ['Switching outputs: PNP/NPN.','Output function: normally open / normally closed (parameterisable).','does not select a project polarity or output function','ifm PN2070-02'])
    assert.ok(project.objects.some(object=>object.sheetId==='ref-056'&&object.text.includes(required)),'Missing output option or scope: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('lists PNP/NPN switching outputs and a parameterisable normally open/normally closed output function'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[100,40,354,29,44,0]);
});

test('A1/057 records PN2070 output protection specifications without claiming project protection',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(parsed.project),page=report.sheets.find(sheet=>sheet.id==='ref-057').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  assert.equal(project.revision,'Opening set 9.8');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-057').number,'A1/057');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-057').name,'ifm PN2070 output protection');
  assert.equal(project.status,'Authored opening set: A1/001–A1/100.');
  for(const [id,required] of [['doc-ref-002-line-56','A1/057  ifm PN2070 output protection'],['doc-ref-004-line-48','Revision 5.4 | 2026-11-13 | A1/057']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/057 index or revision record: '+id);
  for(const required of ['Short-circuit protection: yes (pulsed).','Overload protection: yes.','does not establish project protection performance','ifm PN2070-02'])
    assert.ok(project.objects.some(object=>object.sheetId==='ref-057'&&object.text.includes(required)),'Missing protection datum or scope: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('lists pulsed short-circuit protection and overload protection for the output'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[100,40,354,29,44,0]);
});

test('A1/058 records PN2070 analogue-output response rating without assigning system response',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(parsed.project),page=report.sheets.find(sheet=>sheet.id==='ref-058').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  assert.equal(project.revision,'Opening set 9.8');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-058').number,'A1/058');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-058').name,'ifm PN2070 analogue-output response');
  assert.equal(project.status,'Authored opening set: A1/001–A1/100.');
  for(const [id,required] of [['doc-ref-002-line-57','A1/058  ifm PN2070 analogue-output response'],['doc-ref-004-line-49','Revision 5.5 | 2026-11-13 | A1/058']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/058 index or revision record: '+id);
  for(const required of ['Maximum analogue-output response time: 3 ms.','does not define configured damping or system response','ifm PN2070-02'])
    assert.ok(project.objects.some(object=>object.sheetId==='ref-058'&&object.text.includes(required)),'Missing response rating or scope: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('lists a maximum analogue-output response time of 3 ms'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[100,40,354,29,44,0]);
});

test('A1/059 records PN2070 analogue-output damping range without selecting a setting',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(parsed.project),page=report.sheets.find(sheet=>sheet.id==='ref-059').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  assert.equal(project.revision,'Opening set 9.8');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-059').number,'A1/059');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-059').name,'ifm PN2070 analogue-output damping');
  assert.equal(project.status,'Authored opening set: A1/001–A1/100.');
  for(const [id,required] of [['doc-ref-002-line-58','A1/059  ifm PN2070 analogue-output damping'],['doc-ref-004-line-50','Revision 5.6 | 2026-11-13 | A1/059']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/059 index or revision record: '+id);
  for(const required of ['Analogue-output damping dAA: 0–4 s.','does not select a device setting','ifm PN2070-02'])
    assert.ok(project.objects.some(object=>object.sheetId==='ref-059'&&object.text.includes(required)),'Missing damping range or scope: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('lists the analogue-output damping parameter dAA as 0...4 s'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[100,40,354,29,44,0]);
});

test('A1/060 records PN2070 process-value damping range without selecting a setting',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(parsed.project),page=report.sheets.find(sheet=>sheet.id==='ref-060').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  assert.equal(project.revision,'Opening set 9.8');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-060').number,'A1/060');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-060').name,'ifm PN2070 process-value damping');
  assert.equal(project.status,'Authored opening set: A1/001–A1/100.');
  for(const [id,required] of [['doc-ref-002-line-59','A1/060  ifm PN2070 process-value damping'],['doc-ref-004-line-51','Revision 5.7 | 2026-11-13 | A1/060']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/060 index or revision record: '+id);
  for(const required of ['Process-value damping dAP: 0–4 s.','does not select a sensor setting','ifm PN2070-02'])
    assert.ok(project.objects.some(object=>object.sheetId==='ref-060'&&object.text.includes(required)),'Missing damping range or scope: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('lists the process-value damping parameter dAP as 0...4 s'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[100,40,354,29,44,0]);
});

test('A1/061 records PN2070 programmable delay range without selecting a delay',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(parsed.project),page=report.sheets.find(sheet=>sheet.id==='ref-061').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  assert.equal(project.revision,'Opening set 9.8');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-061').number,'A1/061');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-061').name,'ifm PN2070 programmable output delay');
  assert.equal(project.status,'Authored opening set: A1/001–A1/100.');
  for(const [id,required] of [['doc-ref-002-line-60','A1/061  ifm PN2070 programmable output delay'],['doc-ref-004-line-52','Revision 5.8 | 2026-11-13 | A1/061']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/061 index or revision record: '+id);
  for(const required of ['Programmable delay dS/dr: 0–50 s.','does not select a switch-on or switch-off delay','ifm PN2070-02'])
    assert.ok(project.objects.some(object=>object.sheetId==='ref-061'&&object.text.includes(required)),'Missing delay range or scope: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('lists the programmable delay parameters dS and dr as 0...50 s'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[100,40,354,29,44,0]);
});

test('A1/062 records PN2070 response-time rating without assigning system behavior',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(parsed.project),page=report.sheets.find(sheet=>sheet.id==='ref-062').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  assert.equal(project.revision,'Opening set 9.8');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-062').number,'A1/062');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-062').name,'ifm PN2070 response time');
  assert.equal(project.status,'Authored opening set: A1/001–A1/100.');
  for(const [id,required] of [['doc-ref-002-line-61','A1/062  ifm PN2070 response time'],['doc-ref-004-line-53','Revision 5.9 | 2026-11-13 | A1/062']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/062 index or revision record: '+id);
  for(const required of ['Response time: <1.5 ms.','does not establish project or system response time','ifm PN2070-02'])
    assert.ok(project.objects.some(object=>object.sheetId==='ref-062'&&object.text.includes(required)),'Missing response rating or scope: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('lists the response time as <1.5 ms'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[100,40,354,29,44,0]);
});

test('A1/063 records PN2070 IO-Link process cycle time for CMPT 2 without assigning a configuration',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(parsed.project),page=report.sheets.find(sheet=>sheet.id==='ref-063').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  assert.equal(project.revision,'Opening set 9.8');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-063').number,'A1/063');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-063').name,'ifm PN2070 IO-Link cycle time');
  assert.equal(project.status,'Authored opening set: A1/001–A1/100.');
  for(const [id,required] of [['doc-ref-002-line-62','A1/063  ifm PN2070 IO-Link cycle time'],['doc-ref-004-line-54','Revision 6.0 | 2026-11-13 | A1/063']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/063 index or revision record: '+id);
  for(const required of ['CMPT=2 minimum process cycle time: 2.3 ms.','does not assign device or master configuration','ifm PN2070-02'])
    assert.ok(project.objects.some(object=>object.sheetId==='ref-063'&&object.text.includes(required)),'Missing cycle-time datum or scope: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('lists the minimum IO-Link process cycle time as 2.3 ms for factory setting / CMPT=2'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[100,40,354,29,44,0]);
});

test('A1/064 records PN2070 IO-Link cycle time for CMPT 3 without assigning a configuration',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(parsed.project),page=report.sheets.find(sheet=>sheet.id==='ref-064').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  assert.equal(project.revision,'Opening set 9.8');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-064').number,'A1/064');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-064').name,'ifm PN2070 IO-Link cycle time CMPT 3');
  assert.equal(project.status,'Authored opening set: A1/001–A1/100.');
  for(const [id,required] of [['doc-ref-002-line-63','A1/064  ifm PN2070 IO-Link cycle time CMPT 3'],['doc-ref-004-line-55','Revision 6.1 | 2026-11-13 | A1/064']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/064 index or revision record: '+id);
  for(const required of ['CMPT=3 minimum process cycle time: 3 ms.','does not assign this device profile, master cycle','ifm PN2070-02'])
    assert.ok(project.objects.some(object=>object.sheetId==='ref-064'&&object.text.includes(required)),'Missing cycle-time datum or scope: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('lists the minimum IO-Link process cycle time as 3 ms for Status_B High Resolution / CMPT=3'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[100,40,354,29,44,0]);
});

test('A1/065 records PN2070 IO-Link pressure resolution for CMPT 2 without assigning a device mode',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(parsed.project),page=report.sheets.find(sheet=>sheet.id==='ref-065').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  assert.equal(project.revision,'Opening set 9.8');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-065').number,'A1/065');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-065').name,'ifm PN2070 IO-Link pressure resolution CMPT 2');
  assert.equal(project.status,'Authored opening set: A1/001–A1/100.');
  for(const [id,required] of [['doc-ref-002-line-64','A1/065  ifm PN2070 IO-Link pressure resolution CMPT 2'],['doc-ref-004-line-56','Revision 6.2 | 2026-11-13 | A1/065']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/065 index or revision record: '+id);
  for(const required of ['CMPT=2 IO-Link pressure resolution: 0.1 bar.','does not assign the device mode','ifm PN2070-02'])
    assert.ok(project.objects.some(object=>object.sheetId==='ref-065'&&object.text.includes(required)),'Missing resolution datum or scope: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('lists IO-Link pressure resolution as 0.1 bar for factory setting / CMPT=2'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[100,40,354,29,44,0]);
});

test('A1/066 records PN2070 IO-Link pressure resolution for CMPT 3 without assigning a device mode',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(parsed.project),page=report.sheets.find(sheet=>sheet.id==='ref-066').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  assert.equal(project.revision,'Opening set 9.8');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-066').number,'A1/066');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-066').name,'ifm PN2070 IO-Link pressure resolution CMPT 3');
  assert.equal(project.status,'Authored opening set: A1/001–A1/100.');
  for(const [id,required] of [['doc-ref-002-line-65','A1/066  ifm PN2070 IO-Link pressure resolution CMPT 3'],['doc-ref-004-line-57','Revision 6.3 | 2026-11-13 | A1/066']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/066 index or revision record: '+id);
  for(const required of ['CMPT=3 IO-Link pressure resolution: 0.2 bar.','does not assign the device mode','ifm PN2070-02'])
    assert.ok(project.objects.some(object=>object.sheetId==='ref-066'&&object.text.includes(required)),'Missing resolution datum or scope: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('lists IO-Link pressure resolution as 0.2 bar for Status_B High Resolution / CMPT=3'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[100,40,354,29,44,0]);
});

test('A1/067 records PN2070 CMPT 2 IO-Link pressure field width without assigning a payload',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(parsed.project),page=report.sheets.find(sheet=>sheet.id==='ref-067').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  assert.equal(project.revision,'Opening set 9.8');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-067').number,'A1/067');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-067').name,'ifm PN2070 IO-Link pressure field CMPT 2');
  assert.equal(project.status,'Authored opening set: A1/001–A1/100.');
  for(const [id,required] of [['doc-ref-002-line-66','A1/067  ifm PN2070 IO-Link pressure field CMPT 2'],['doc-ref-004-line-58','Revision 6.4 | 2026-11-13 | A1/067']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/067 index or revision record: '+id);
  for(const required of ['CMPT=2 cyclical pressure field: 14 bits.','does not assign a profile or decoded payload','ifm PN2070-02'])
    assert.ok(project.objects.some(object=>object.sheetId==='ref-067'&&object.text.includes(required)),'Missing process-data datum or scope: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('lists the CMPT=2 cyclical pressure field as 14 bits'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[100,40,354,29,44,0]);
});

test('A1/068 records PN2070 CMPT 3 IO-Link pressure field width without assigning a payload',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(parsed.project),page=report.sheets.find(sheet=>sheet.id==='ref-068').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  assert.equal(project.revision,'Opening set 9.8');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-068').number,'A1/068');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-068').name,'ifm PN2070 IO-Link pressure field CMPT 3');
  assert.equal(project.status,'Authored opening set: A1/001–A1/100.');
  for(const [id,required] of [['doc-ref-002-line-67','A1/068  ifm PN2070 IO-Link pressure field CMPT 3'],['doc-ref-004-line-59','Revision 6.5 | 2026-11-13 | A1/068']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/068 index or revision record: '+id);
  for(const required of ['CMPT=3 cyclical pressure field: 16 bits.','does not assign a profile or decoded payload','ifm PN2070-02'])
    assert.ok(project.objects.some(object=>object.sheetId==='ref-068'&&object.text.includes(required)),'Missing process-data datum or scope: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('lists the CMPT=3 cyclical pressure field as 16 bits'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[100,40,354,29,44,0]);
});

test('A1/069 records PN2070 CMPT 3 device status field width without inventing diagnostics',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(parsed.project),page=report.sheets.find(sheet=>sheet.id==='ref-069').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  assert.equal(project.revision,'Opening set 9.8');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-069').number,'A1/069');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-069').name,'ifm PN2070 IO-Link device status field CMPT 3');
  assert.equal(project.status,'Authored opening set: A1/001–A1/100.');
  for(const [id,required] of [['doc-ref-002-line-68','A1/069  ifm PN2070 IO-Link device status field CMPT 3'],['doc-ref-004-line-60','Revision 6.6 | 2026-11-13 | A1/069']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/069 index or revision record: '+id);
  for(const required of ['CMPT=3 cyclical device status field: 4 bits.','does not define status codes or diagnostic meaning','ifm PN2070-02'])
    assert.ok(project.objects.some(object=>object.sheetId==='ref-069'&&object.text.includes(required)),'Missing status width or scope: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('lists the CMPT=3 cyclical device status field as 4 bits'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[100,40,354,29,44,0]);
});

test('A1/070 records PN2070 CMPT 3 binary switching information width without assigning signal meaning',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(parsed.project),page=report.sheets.find(sheet=>sheet.id==='ref-070').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  assert.equal(project.revision,'Opening set 9.8');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-070').number,'A1/070');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-070').name,'ifm PN2070 IO-Link binary switching information CMPT 3');
  assert.equal(project.status,'Authored opening set: A1/001–A1/100.');
  for(const [id,required] of [['doc-ref-002-line-69','A1/070  ifm PN2070 IO-Link binary switching information CMPT 3'],['doc-ref-004-line-61','Revision 6.7 | 2026-11-13 | A1/070']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/070 index or revision record: '+id);
  for(const required of ['CMPT=3 cyclical binary switching information: 2 bits.','no state code meaning or project output configuration assigned','ifm PN2070-02'])
    assert.ok(project.objects.some(object=>object.sheetId==='ref-070'&&object.text.includes(required)),'Missing switching information width or scope: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('lists the CMPT=3 cyclical binary switching information field as 2 bits'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[100,40,354,29,44,0]);
});

test('A1/071 records PN2070 CMPT 3 IO-Link DeviceID without inferring device configuration',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(parsed.project),page=report.sheets.find(sheet=>sheet.id==='ref-071').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  assert.equal(project.revision,'Opening set 9.8');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-071').number,'A1/071');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-071').name,'ifm PN2070 IO-Link DeviceID CMPT 3');
  assert.equal(project.status,'Authored opening set: A1/001–A1/100.');
  for(const [id,required] of [['doc-ref-002-line-70','A1/071  ifm PN2070 IO-Link DeviceID CMPT 3'],['doc-ref-004-line-62','Revision 6.8 | 2026-11-13 | A1/071']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/071 index or revision record: '+id);
  for(const required of ['Status_B High Resolution / CMPT=3 DeviceID: 638.','not evidence that this specific device is configured to use CMPT=3','ifm PN2070-02'])
    assert.ok(project.objects.some(object=>object.sheetId==='ref-071'&&object.text.includes(required)),'Missing DeviceID or scope: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('lists DeviceID 638 for Status_B High Resolution / CMPT=3'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[100,40,354,29,44,0]);
});

test('A1/072 records PN2070 CMPT 2 IO-Link DeviceID without inferring device configuration',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(parsed.project),page=report.sheets.find(sheet=>sheet.id==='ref-072').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  assert.equal(project.revision,'Opening set 9.8');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-072').number,'A1/072');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-072').name,'ifm PN2070 IO-Link DeviceID CMPT 2');
  assert.equal(project.status,'Authored opening set: A1/001–A1/100.');
  for(const [id,required] of [['doc-ref-002-line-71','A1/072  ifm PN2070 IO-Link DeviceID CMPT 2'],['doc-ref-004-line-63','Revision 6.9 | 2026-11-13 | A1/072']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/072 index or revision record: '+id);
  for(const required of ['Factory setting / CMPT=2 DeviceID: 459.','not evidence that this specific device is configured to use CMPT=2','ifm PN2070-02'])
    assert.ok(project.objects.some(object=>object.sheetId==='ref-072'&&object.text.includes(required)),'Missing DeviceID or scope: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('lists DeviceID 459 for Factory setting / CMPT=2'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[100,40,354,29,44,0]);
});

test('A1/073 records PN2070 factory-setting SSP 0 profile listing without inferring device configuration',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(parsed.project),page=report.sheets.find(sheet=>sheet.id==='ref-073').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  assert.equal(project.revision,'Opening set 9.8');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-073').number,'A1/073');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-073').name,'ifm PN2070 IO-Link SSP 0 profile CMPT 2');
  assert.equal(project.status,'Authored opening set: A1/001–A1/100.');
  for(const [id,required] of [['doc-ref-002-line-72','A1/073  ifm PN2070 IO-Link SSP 0 profile CMPT 2'],['doc-ref-004-line-64','Revision 7.0 | 2026-11-13 | A1/073']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/073 index or revision record: '+id);
  for(const required of ['Factory setting / CMPT=2 profile: Smart Sensor - SSP 0 Generic Profiled Sensor.','no master port, IODD, or active device configuration is asserted','ifm PN2070-02'])
    assert.ok(project.objects.some(object=>object.sheetId==='ref-073'&&object.text.includes(required)),'Missing profile or scope: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('lists Smart Sensor - SSP 0 Generic Profiled Sensor under Factory setting / CMPT=2'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[100,40,354,29,44,0]);
});

test('A1/074 records PN2070 CMPT 3 SSP 3.1 profile listing without inferring device configuration',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(parsed.project),page=report.sheets.find(sheet=>sheet.id==='ref-074').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  assert.equal(project.revision,'Opening set 9.8');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-074').number,'A1/074');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-074').name,'ifm PN2070 IO-Link SSP 3.1 profile CMPT 3');
  assert.equal(project.status,'Authored opening set: A1/001–A1/100.');
  for(const [id,required] of [['doc-ref-002-line-73','A1/074  ifm PN2070 IO-Link SSP 3.1 profile CMPT 3'],['doc-ref-004-line-65','Revision 7.1 | 2026-11-13 | A1/074']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/074 index or revision record: '+id);
  for(const required of ['Status_B High Resolution / CMPT=3 profile: Smart Sensor - SSP 3.1 Measuring Sensor.','no master port, IODD, or active device configuration is asserted','ifm PN2070-02'])
    assert.ok(project.objects.some(object=>object.sheetId==='ref-074'&&object.text.includes(required)),'Missing profile or scope: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('lists Smart Sensor - SSP 3.1 Measuring Sensor under Status_B High Resolution / CMPT=3'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[100,40,354,29,44,0]);
});

test('A1/075 records PN2070 CMPT 3 Common I&D profile listing without inferring diagnosis',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(parsed.project),page=report.sheets.find(sheet=>sheet.id==='ref-075').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  assert.equal(project.revision,'Opening set 9.8');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-075').number,'A1/075');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-075').name,'ifm PN2070 IO-Link Common I&D profile CMPT 3');
  assert.equal(project.status,'Authored opening set: A1/001–A1/100.');
  for(const [id,required] of [['doc-ref-002-line-74','A1/075  ifm PN2070 IO-Link Common I&D profile CMPT 3'],['doc-ref-004-line-66','Revision 7.2 | 2026-11-13 | A1/075']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/075 index or revision record: '+id);
  for(const required of ['Status_B High Resolution / CMPT=3 profile: Common - I&D Identification and Diagnosis.','no actual diagnosis, event code, or master configuration is asserted','ifm PN2070-02'])
    assert.ok(project.objects.some(object=>object.sheetId==='ref-075'&&object.text.includes(required)),'Missing profile or scope: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('lists Common - I&D Identification and Diagnosis under Status_B High Resolution / CMPT=3'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[100,40,354,29,44,0]);
});

test('A1/076 records PN2070 factory-setting acyclical application tag function without inventing a tag value',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(parsed.project),page=report.sheets.find(sheet=>sheet.id==='ref-076').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  assert.equal(project.revision,'Opening set 9.8');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-076').number,'A1/076');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-076').name,'ifm PN2070 IO-Link application-specific tag CMPT 2');
  assert.equal(project.status,'Authored opening set: A1/001–A1/100.');
  for(const [id,required] of [['doc-ref-002-line-75','A1/076  ifm PN2070 IO-Link application-specific tag CMPT 2'],['doc-ref-004-line-67','Revision 7.3 | 2026-11-13 | A1/076']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/076 index or revision record: '+id);
  for(const required of ['Factory setting / CMPT=2 lists the acyclical function: application-specific tag.','no configured tag value or active device profile is asserted','ifm PN2070-02'])
    assert.ok(project.objects.some(object=>object.sheetId==='ref-076'&&object.text.includes(required)),'Missing tag function or scope: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('lists the acyclical application-specific tag function for Factory setting / CMPT=2'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[100,40,354,29,44,0]);
});

test('A1/077 records PN2070 CMPT 3 acyclical application tag function without inventing a value',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(parsed.project),page=report.sheets.find(sheet=>sheet.id==='ref-077').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  assert.equal(project.revision,'Opening set 9.8');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-077').number,'A1/077');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-077').name,'ifm PN2070 IO-Link application-specific tag CMPT 3');
  assert.equal(project.status,'Authored opening set: A1/001–A1/100.');
  for(const [id,required] of [['doc-ref-002-line-76','A1/077  ifm PN2070 IO-Link application-specific tag CMPT 3'],['doc-ref-004-line-68','Revision 7.4 | 2026-11-13 | A1/077']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/077 index or revision record: '+id);
  for(const required of ['Status_B High Resolution / CMPT=3 lists the acyclical function: application-specific tag.','no configured tag value or active device profile is asserted','ifm PN2070-02'])
    assert.ok(project.objects.some(object=>object.sheetId==='ref-077'&&object.text.includes(required)),'Missing tag function or scope: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('lists the acyclical application-specific tag function for Status_B High Resolution / CMPT=3'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[100,40,354,29,44,0]);
});

test('A1/078 records PN2070 IO-Link master-port note without assigning project wiring',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(parsed.project),page=report.sheets.find(sheet=>sheet.id==='ref-078').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  assert.equal(project.revision,'Opening set 9.8');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-078').number,'A1/078');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-078').name,'ifm PN2070 IO-Link master port note');
  assert.equal(project.status,'Authored opening set: A1/001–A1/100.');
  for(const [id,required] of [['doc-ref-002-line-77','A1/078  ifm PN2070 IO-Link master port note'],['doc-ref-004-line-69','Revision 7.5 | 2026-11-13 | A1/078']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/078 index or revision record: '+id);
  for(const required of ['Required PN2070 IO-Link master port: type A; type B when pin 2 is not connected.','pin 2 wiring and actual master-port selection are not assigned','ifm PN2070-02'])
    assert.ok(project.objects.some(object=>object.sheetId==='ref-078'&&object.text.includes(required)),'Missing master-port note or scope: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('lists master port type A, or B when pin 2 is not connected'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[100,40,354,29,44,0]);
});

test('A1/079 records PN2070 factory-setting IO-Link function listing without claiming configured data',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(parsed.project),page=report.sheets.find(sheet=>sheet.id==='ref-079').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  assert.equal(project.revision,'Opening set 9.8');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-079').number,'A1/079');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-079').name,'ifm PN2070 IO-Link function listing CMPT 2');
  assert.equal(project.status,'Authored opening set: A1/001–A1/100.');
  for(const [id,required] of [['doc-ref-002-line-78','A1/079  ifm PN2070 IO-Link function listing CMPT 2'],['doc-ref-004-line-70','Revision 7.6 | 2026-11-13 | A1/079']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/079 index or revision record: '+id);
  for(const required of ['Factory setting / CMPT=2 lists Device identification, Process data variable, and Device diagnosis.','profile feature list only; no actual device data or diagnosis is asserted','ifm PN2070-02'])
    assert.ok(project.objects.some(object=>object.sheetId==='ref-079'&&object.text.includes(required)),'Missing function list or scope: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('lists Device identification, Process data variable, and Device diagnosis for Factory setting / CMPT=2'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[100,40,354,29,44,0]);
});

test('A1/080 records PN2070 IO-Link transmission type and nominal data rate',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(parsed.project),page=report.sheets.find(sheet=>sheet.id==='ref-080').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  assert.equal(project.revision,'Opening set 9.8');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-080').number,'A1/080');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-080').name,'ifm PN2070 IO-Link COM2 transmission rate');
  assert.equal(project.status,'Authored opening set: A1/001–A1/100.');
  for(const [id,required] of [['doc-ref-002-line-79','A1/080  ifm PN2070 IO-Link COM2 transmission rate'],['doc-ref-004-line-71','Revision 7.7 | 2026-11-13 | A1/080']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/080 index or revision record: '+id);
  for(const required of ['IO-Link transmission type: COM2 (38,4 kBaud).','rated communication value only; no observed or configured link speed is asserted','ifm PN2070-02'])
    assert.ok(project.objects.some(object=>object.sheetId==='ref-080'&&object.text.includes(required)),'Missing transmission specification or scope: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('lists IO-Link transmission type COM2 at 38,4 kBaud'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[100,40,354,29,44,0]);
});

test('A1/081 records PN2070 IO-Link revision without claiming negotiated behavior',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(parsed.project),page=report.sheets.find(sheet=>sheet.id==='ref-081').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  assert.equal(project.revision,'Opening set 9.8');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-081').number,'A1/081');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-081').name,'ifm PN2070 IO-Link revision');
  assert.equal(project.status,'Authored opening set: A1/001–A1/100.');
  for(const [id,required] of [['doc-ref-002-line-80','A1/081  ifm PN2070 IO-Link revision'],['doc-ref-004-line-72','Revision 7.8 | 2026-11-13 | A1/081']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/081 index or revision record: '+id);
  for(const required of ['Manufacturer-listed IO-Link revision: 1.1.','no negotiated master/device behavior is asserted','ifm PN2070-02'])
    assert.ok(project.objects.some(object=>object.sheetId==='ref-081'&&object.text.includes(required)),'Missing protocol revision or scope: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('lists IO-Link revision 1.1'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[100,40,354,29,44,0]);
});

test('A1/082 records PN2070 SIO mode capability without assigning project operation',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(parsed.project),page=report.sheets.find(sheet=>sheet.id==='ref-082').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  assert.equal(project.revision,'Opening set 9.8');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-082').number,'A1/082');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-082').name,'ifm PN2070 SIO mode capability');
  assert.equal(project.status,'Authored opening set: A1/001–A1/100.');
  for(const [id,required] of [['doc-ref-002-line-81','A1/082  ifm PN2070 SIO mode capability'],['doc-ref-004-line-73','Revision 7.9 | 2026-11-13 | A1/082']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/082 index or revision record: '+id);
  for(const required of ['Manufacturer-listed SIO mode capability: yes.','capability only; no project operating mode is selected','ifm PN2070-02'])
    assert.ok(project.objects.some(object=>object.sheetId==='ref-082'&&object.text.includes(required)),'Missing SIO capability or scope: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('lists SIO mode as supported'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[100,40,354,29,44,0]);
});

test('A1/083 records PN2070 SDCI standard reference without claiming compliance',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(parsed.project),page=report.sheets.find(sheet=>sheet.id==='ref-083').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  assert.equal(project.revision,'Opening set 9.8');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-083').number,'A1/083');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-083').name,'ifm PN2070 SDCI standard reference');
  assert.equal(project.status,'Authored opening set: A1/001–A1/100.');
  for(const [id,required] of [['doc-ref-002-line-82','A1/083  ifm PN2070 SDCI standard reference'],['doc-ref-004-line-74','Revision 8.0 | 2026-11-13 | A1/083']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/083 index or revision record: '+id);
  for(const required of ['Manufacturer-listed SDCI standard: IEC 61131-9.','reference only; no compliance assessment or project implementation claim','ifm PN2070-02'])
    assert.ok(project.objects.some(object=>object.sheetId==='ref-083'&&object.text.includes(required)),'Missing standard reference or scope: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('lists SDCI standard IEC 61131-9'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[100,40,354,29,44,0]);
});

test('A1/084 records PN2070 integrated watchdog feature without inventing behavior',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(parsed.project),page=report.sheets.find(sheet=>sheet.id==='ref-084').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  assert.equal(project.revision,'Opening set 9.8');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-084').number,'A1/084');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-084').name,'ifm PN2070 integrated watchdog feature');
  assert.equal(project.status,'Authored opening set: A1/001–A1/100.');
  for(const [id,required] of [['doc-ref-002-line-83','A1/084  ifm PN2070 integrated watchdog feature'],['doc-ref-004-line-75','Revision 8.1 | 2026-11-13 | A1/084']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/084 index or revision record: '+id);
  for(const required of ['Manufacturer-listed integrated watchdog: yes.','no watchdog interval, fault handling, or project safety behavior is assigned','ifm PN2070-02'])
    assert.ok(project.objects.some(object=>object.sheetId==='ref-084'&&object.text.includes(required)),'Missing watchdog feature or scope: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('lists an integrated watchdog'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[100,40,354,29,44,0]);
});

test('A1/085 records PN2070 digital and analogue output counts without assigning channels',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(parsed.project),page=report.sheets.find(sheet=>sheet.id==='ref-085').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  assert.equal(project.revision,'Opening set 9.8');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-085').number,'A1/085');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-085').name,'ifm PN2070 output counts');
  assert.equal(project.status,'Authored opening set: A1/001–A1/100.');
  for(const [id,required] of [['doc-ref-002-line-84','A1/085  ifm PN2070 output counts'],['doc-ref-004-line-76','Revision 8.2 | 2026-11-13 | A1/085']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/085 index or revision record: '+id);
  for(const required of ['Manufacturer-listed outputs: 2 digital and 1 analogue.','Output count only; no channel-to-pin allocation or simultaneous signal usage is assigned','ifm PN2070-02'])
    assert.ok(project.objects.some(object=>object.sheetId==='ref-085'&&object.text.includes(required)),'Missing output counts or scope: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('lists 2 digital outputs and 1 analogue output'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[100,40,354,29,44,0]);
});


test('A1/086 records PN2070 switch-point accuracy without claiming project accuracy',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(parsed.project),page=report.sheets.find(sheet=>sheet.id==='ref-086').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  assert.equal(project.revision,'Opening set 9.8');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-086').number,'A1/086');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-086').name,'ifm PN2070 switch-point accuracy');
  assert.equal(project.status,'Authored opening set: A1/001–A1/100.');
  for(const [id,required] of [['doc-ref-002-line-85','A1/086  ifm PN2070 switch-point accuracy'],['doc-ref-004-line-77','Revision 8.3 | 2026-11-13 | A1/086']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/086 index or revision record: '+id);
  for(const required of ['Switch-point accuracy: < ±0.4% of span (turn-down 1:1).','Manufacturer specification only; no threshold, measuring span selection, or project accuracy is claimed','ifm PN2070-02'])
    assert.ok(project.objects.some(object=>object.sheetId==='ref-086'&&object.text.includes(required)),'Missing switch-point accuracy or scope: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('switch point accuracy below ±0.4% of the span'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[100,40,354,29,44,0]);
});


test('A1/087 records PN2070 repeatability rating with its published condition',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(parsed.project),page=report.sheets.find(sheet=>sheet.id==='ref-087').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  assert.equal(project.revision,'Opening set 9.8');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-087').number,'A1/087');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-087').name,'ifm PN2070 repeatability rating');
  assert.equal(project.status,'Authored opening set: A1/001–A1/100.');
  for(const [id,required] of [['doc-ref-002-line-86','A1/087  ifm PN2070 repeatability rating'],['doc-ref-004-line-78','Revision 8.4 | 2026-11-13 | A1/087']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/087 index or revision record: '+id);
  for(const required of ['Repeatability: < ±0.1% of span; temperature fluctuations < 10 K; turn-down 1:1.','Manufacturer specification only; no measured project repeatability or temperature condition is assigned','ifm PN2070-02'])
    assert.ok(project.objects.some(object=>object.sheetId==='ref-087'&&object.text.includes(required)),'Missing repeatability value or scope: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('repeatability below ±0.1% of the span'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[100,40,354,29,44,0]);
});


test('A1/088 records PN2070 long-term stability without inferring project drift',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(parsed.project),page=report.sheets.find(sheet=>sheet.id==='ref-088').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  assert.equal(project.revision,'Opening set 9.8');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-088').number,'A1/088');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-088').name,'ifm PN2070 long-term stability');
  assert.equal(project.status,'Authored opening set: A1/001–A1/100.');
  for(const [id,required] of [['doc-ref-002-line-87','A1/088  ifm PN2070 long-term stability'],['doc-ref-004-line-79','Revision 8.5 | 2026-11-13 | A1/088']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/088 index or revision record: '+id);
  for(const required of ['Long-term stability: < ±0.05% of span per 6 months (turn-down 1:1).','Manufacturer rating only; no measured project drift, service life, or maintenance interval is claimed','ifm PN2070-02'])
    assert.ok(project.objects.some(object=>object.sheetId==='ref-088'&&object.text.includes(required)),'Missing long-term stability value or scope: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('long-term stability below ±0.05% of the span per 6 months'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[100,40,354,29,44,0]);
});


test('A1/089 records PN2070 zero-point and span temperature coefficients',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(parsed.project),page=report.sheets.find(sheet=>sheet.id==='ref-089').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  assert.equal(project.revision,'Opening set 9.8');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-089').number,'A1/089');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-089').name,'ifm PN2070 temperature coefficients');
  assert.equal(project.status,'Authored opening set: A1/001–A1/100.');
  for(const [id,required] of [['doc-ref-002-line-88','A1/089  ifm PN2070 temperature coefficients'],['doc-ref-004-line-80','Revision 8.6 | 2026-11-13 | A1/089']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/089 index or revision record: '+id);
  for(const required of ['Zero-point coefficient: 0.2% of span/10 K; span coefficient: 0.2% of span/10 K (−25 to 80 °C).','Manufacturer coefficients only; no site temperature, project correction, or measurement is assigned','ifm PN2070-02'])
    assert.ok(project.objects.some(object=>object.sheetId==='ref-089'&&object.text.includes(required)),'Missing temperature coefficients or scope: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('zero-point temperature coefficient as 0.2% of the span per 10 K'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[100,40,354,29,44,0]);
});


test('A1/090 records PN2070 hysteresis deviation without assigning project behavior',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(parsed.project),page=report.sheets.find(sheet=>sheet.id==='ref-090').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  assert.equal(project.revision,'Opening set 9.8');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-090').number,'A1/090');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-090').name,'ifm PN2070 hysteresis deviation');
  assert.equal(project.status,'Authored opening set: A1/001–A1/100.');
  for(const [id,required] of [['doc-ref-002-line-89','A1/090  ifm PN2070 hysteresis deviation'],['doc-ref-004-line-81','Revision 8.7 | 2026-11-13 | A1/090']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/090 index or revision record: '+id);
  for(const required of ['Hysteresis deviation: < ±0.1% of span (turn-down 1:1).','Manufacturer specification only; no hysteresis setting or measured project behavior is assigned','ifm PN2070-02'])
    assert.ok(project.objects.some(object=>object.sheetId==='ref-090'&&object.text.includes(required)),'Missing hysteresis value or scope: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('hysteresis deviation below ±0.1% of the span'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[100,40,354,29,44,0]);
});


test('A1/091 records PN2070 manufacturer MTTF without claiming project lifetime',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(parsed.project),page=report.sheets.find(sheet=>sheet.id==='ref-091').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  assert.equal(project.revision,'Opening set 9.8');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-091').number,'A1/091');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-091').name,'ifm PN2070 mean time to failure');
  assert.equal(project.status,'Authored opening set: A1/001–A1/100.');
  for(const [id,required] of [['doc-ref-002-line-90','A1/091  ifm PN2070 mean time to failure'],['doc-ref-004-line-82','Revision 8.8 | 2026-11-13 | A1/091']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/091 index or revision record: '+id);
  for(const required of ['Manufacturer-listed MTTF: 129 years.','Product datum only; no project reliability, expected service life, or maintenance interval is claimed','ifm PN2070-02'])
    assert.ok(project.objects.some(object=>object.sheetId==='ref-091'&&object.text.includes(required)),'Missing MTTF value or scope: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('lists manufacturer mean time to failure (MTTF) as 129 years'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[100,40,354,29,44,0]);
});


test('A1/092 records PN2070 EMC standard references without claiming compliance',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(parsed.project),page=report.sheets.find(sheet=>sheet.id==='ref-092').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  assert.equal(project.revision,'Opening set 9.8');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-092').number,'A1/092');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-092').name,'ifm PN2070 EMC references');
  assert.equal(project.status,'Authored opening set: A1/001–A1/100.');
  for(const [id,required] of [['doc-ref-002-line-91','A1/092  ifm PN2070 EMC references'],['doc-ref-004-line-83','Revision 8.9 | 2026-11-13 | A1/092']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/092 index or revision record: '+id);
  for(const required of ['EMC references: DIN EN 61000-6-2 and DIN EN 61000-6-3.','Manufacturer-listed references only; no project compliance, installation, or test result is claimed.','ifm PN2070-02'])
    assert.ok(project.objects.some(object=>object.sheetId==='ref-092'&&object.text.includes(required)),'Missing EMC references or scope: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('EMC row references DIN EN 61000-6-2 and DIN EN 61000-6-3'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[100,40,354,29,44,0]);
});


test('A1/093 records PN2070 characteristic deviation without claiming project accuracy',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(project),page=report.sheets.find(sheet=>sheet.id==='ref-093').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  assert.equal(project.revision,'Opening set 9.8');
  assert.equal(project.sheets.length,100);
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-093').number,'A1/093');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-093').name,'ifm PN2070 characteristic deviation');
  assert.equal(project.status,'Authored opening set: A1/001–A1/100.');
  for(const [id,required] of [['doc-ref-002-line-92','A1/093  ifm PN2070 characteristic deviation'],['doc-ref-004-line-84','Revision 9.0 | 2026-11-13 | A1/093']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/093 index or revision record: '+id);
  for(const required of ['Characteristic deviation: < ±0.25% (BFSL) / < ±0.5% (limit value setting); turn-down 1:1.','Manufacturer specification only; no project measurement, selected setting, or application accuracy is claimed.','ifm PN2070-02'])
    assert.ok(project.objects.some(object=>object.sheetId==='ref-093'&&object.text.includes(required)),'Missing characteristic-deviation value or scope: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('characteristic deviation below ±0.25% (BFSL) / below ±0.5% (limit value setting)'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[100,40,354,29,44,0]);
});


test('A1/094 records the PN2070 datasheet UL approval reference without claiming project certification',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(project),page=report.sheets.find(sheet=>sheet.id==='ref-094').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  assert.equal(project.revision,'Opening set 9.8');
  assert.equal(project.sheets.length,100);
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-094').number,'A1/094');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-094').name,'ifm PN2070 UL approval reference');
  assert.equal(project.status,'Authored opening set: A1/001–A1/100.');
  for(const [id,required] of [['doc-ref-002-line-93','A1/094  ifm PN2070 UL approval reference'],['doc-ref-004-line-85','Revision 9.1 | 2026-11-13 | A1/094']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/094 index or revision record: '+id);
  for(const required of ['Data sheet listing: UL approval no. J014.','Manufacturer listing only; this project makes no UL approval, certification, or completed assessment claim.','ifm PN2070-02'])
    assert.ok(project.objects.some(object=>object.sheetId==='ref-094'&&object.text.includes(required)),'Missing UL listing value or scope: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('lists UL approval no. J014'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[100,40,354,29,44,0]);
});


test('A1/095 preserves the PN2070 DNV GL accuracy note without interpreting ambiguous limits',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(project),page=report.sheets.find(sheet=>sheet.id==='ref-095').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  assert.equal(project.revision,'Opening set 9.8');
  assert.equal(project.sheets.length,100);
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-095').number,'A1/095');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-095').name,'ifm PN2070 DNV GL accuracy note');
  assert.equal(project.status,'Authored opening set: A1/001–A1/100.');
  for(const [id,required] of [['doc-ref-002-line-94','A1/095  ifm PN2070 DNV GL accuracy note'],['doc-ref-004-line-86','Revision 9.2 | 2026-11-13 | A1/095']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/095 index or revision record: '+id);
  for(const required of ['Data-sheet note (verbatim): switch point accuracy, linearity error under DNV GL: < ±1%: < ±1%.','The extracted row does not clearly map the two limits to separate metrics. No project test, DNV GL approval, or certification is claimed.','ifm PN2070-02'])
    assert.ok(project.objects.some(object=>object.sheetId==='ref-095'&&object.text.includes(required)),'Missing DNV GL source wording or scope: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','ifm-pn2070.md'),'utf8');
  assert.ok(source.includes('prints: “switch point accuracy, linearity error under DNV GL: < ±1%: < ±1%”'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[100,40,354,29,44,0]);
});


test('A1/096 records Phoenix Contact relay timing ratings without claiming project response',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(project),page=report.sheets.find(sheet=>sheet.id==='ref-096').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  assert.equal(project.revision,'Opening set 9.8');
  assert.equal(project.sheets.length,100);
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-096').number,'A1/096');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-096').name,'Phoenix Contact relay response and release times');
  assert.equal(project.status,'Authored opening set: A1/001–A1/100.');
  for(const [id,required] of [['doc-ref-002-line-95','A1/096  Phoenix Contact relay response and release times'],['doc-ref-004-line-87','Revision 9.3 | 2026-11-13 | A1/096']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/096 index or revision record: '+id);
  for(const required of ['PLC-RSC- 24DC/21 typical response time: 5 ms; typical release time: 8 ms.','Manufacturer ratings only; they do not simulate this relay or establish project/system response or release timing.','Phoenix Contact catalog'])
    assert.ok(project.objects.some(object=>object.sheetId==='ref-096'&&object.text.includes(required)),'Missing relay timing rating or scope: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','phoenix-contact-2966171.md'),'utf8');
  assert.ok(source.includes('typical response time of 5 ms and typical release time of 8 ms'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[100,40,354,29,44,0]);
});


test('A1/097 records the Phoenix Contact relay minimum switching rating without asserting project load',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(project),page=report.sheets.find(sheet=>sheet.id==='ref-097').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  assert.equal(project.revision,'Opening set 9.8');
  assert.equal(project.sheets.length,100);
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-097').number,'A1/097');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-097').name,'Phoenix Contact relay minimum switching rating');
  assert.equal(project.status,'Authored opening set: A1/001–A1/100.');
  for(const [id,required] of [['doc-ref-002-line-96','A1/097  Phoenix Contact relay minimum switching rating'],['doc-ref-004-line-88','Revision 9.4 | 2026-11-13 | A1/097']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/097 index or revision record: '+id);
  for(const required of ['PLC-RSC- 24DC/21 minimum switching voltage: 5 V at 100 mA.','Manufacturer contact specification only; it does not establish the project contact load, actual switching conditions, or circuit suitability.','Phoenix Contact catalog'])
    assert.ok(project.objects.some(object=>object.sheetId==='ref-097'&&object.text.includes(required)),'Missing switching rating or scope: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','phoenix-contact-2966171.md'),'utf8');
  assert.ok(source.includes('minimum switching voltage of 5 V at 100 mA'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[100,40,354,29,44,0]);
});


test('A1/098 records Phoenix Contact mechanical service life without claiming project lifetime',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(project),page=report.sheets.find(sheet=>sheet.id==='ref-098').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  assert.equal(project.revision,'Opening set 9.8');
  assert.equal(project.sheets.length,100);
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-098').number,'A1/098');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-098').name,'Phoenix Contact relay mechanical service life');
  assert.equal(project.status,'Authored opening set: A1/001–A1/100.');
  for(const [id,required] of [['doc-ref-002-line-97','A1/098  Phoenix Contact relay mechanical service life'],['doc-ref-004-line-89','Revision 9.5 | 2026-11-13 | A1/098']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/098 index or revision record: '+id);
  for(const required of ['PLC-RSC- 24DC/21 mechanical service life: 2 × 10⁷ cycles.','Manufacturer mechanical-life rating only; this is not electrical life, expected project operating life, or a project reliability calculation.','Phoenix Contact catalog'])
    assert.ok(project.objects.some(object=>object.sheetId==='ref-098'&&object.text.includes(required)),'Missing mechanical-life value or scope: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','phoenix-contact-2966171.md'),'utf8');
  assert.ok(source.includes('mechanical service life of 2 × 10⁷ cycles'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[100,40,354,29,44,0]);
});


test('A1/099 records the Phoenix Contact relay contact switching limits with derating scope',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(project),page=report.sheets.find(sheet=>sheet.id==='ref-099').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  assert.equal(project.revision,'Opening set 9.8');
  assert.equal(project.sheets.length,100);
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-099').number,'A1/099');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-099').name,'Phoenix Contact relay contact switching limits');
  assert.equal(project.status,'Authored opening set: A1/001–A1/100.');
  for(const [id,required] of [['doc-ref-002-line-98','A1/099  Phoenix Contact relay contact switching limits'],['doc-ref-004-line-90','Revision 9.6 | 2026-11-13 | A1/099']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/099 index or revision record: '+id);
  for(const required of ['PLC-RSC- 24DC/21 maximum switching voltage: 250 V AC/DC; limiting continuous current: 6 A.','Manufacturer limits only; temperature and mounting derating apply. They do not select or validate project contact operating conditions.','Phoenix Contact catalog'])
    assert.ok(project.objects.some(object=>object.sheetId==='ref-099'&&object.text.includes(required)),'Missing contact limits or scope: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','phoenix-contact-2966171.md'),'utf8');
  assert.ok(source.includes('maximum switching voltage of 250 V AC/DC and limiting continuous current of 6 A'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[100,40,354,29,44,0]);
});


test('A1/100 records Phoenix Contact insulation ratings without claiming project verification',()=>{
  const file=path.join(__dirname,'examples','real-projects','siemens-sew-star-delta-reference.adigun.json');
  const parsed=engine.parseProject(fs.readFileSync(file,'utf8'));
  assert.equal(parsed.valid,true,parsed.errors.join(' '));
  const project=parsed.project,report=engine.analyzeProject(project),page=report.sheets.find(sheet=>sheet.id==='ref-100').analysis;
  assert.equal(report.valid,true,report.errors.join(' '));
  assert.deepEqual([page.componentCount,page.wireCount,page.netCount,page.geometryErrorCount],[0,0,0,0]);
  assert.equal(project.revision,'Opening set 9.8');
  assert.equal(project.sheets.length,100);
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-100').number,'A1/100');
  assert.equal(project.sheets.find(sheet=>sheet.id==='ref-100').name,'Phoenix Contact relay insulation ratings');
  assert.equal(project.status,'Authored opening set: A1/001–A1/100.');
  for(const [id,required] of [['doc-ref-002-line-99','A1/100  Phoenix Contact relay insulation ratings'],['doc-ref-004-line-91','Revision 9.7 | 2026-11-13 | A1/100']])
    assert.ok(project.objects.find(object=>object.id===id)?.text.includes(required),'Missing A1/100 index or revision record: '+id);
  for(const required of ['PLC-RSC- 24DC/21: rated insulation voltage 250 V; impulse withstand 6 kV; overvoltage category III; pollution degree 3.','Manufacturer component ratings only; they do not verify project insulation coordination, installation conditions, or assembly suitability.','Phoenix Contact catalog'])
    assert.ok(project.objects.some(object=>object.sheetId==='ref-100'&&object.text.includes(required)),'Missing insulation ratings or scope: '+required);
  const source=fs.readFileSync(path.join(__dirname,'docs','components','phoenix-contact-2966171.md'),'utf8');
  assert.ok(source.includes('rated insulation voltage of 250 V, rated impulse withstand voltage of 6 kV, overvoltage category III and degree of pollution 3'));
  const reopened=engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid,true,reopened.errors.join(' '));
  const roundTrip=engine.analyzeProject(reopened.project);
  assert.deepEqual([roundTrip.sheetCount,roundTrip.componentCount,roundTrip.wireCount,roundTrip.crossSheetConnectionCount,roundTrip.globalNetCount,roundTrip.openEndpointCount],[100,40,354,29,44,0]);
});


test('the project-library manifest and generated validation report match the current engineering models', () => {
  const library = require('./scripts/project-library-validation.js');
  const report = library.buildReport();
  const savedReport = JSON.parse(fs.readFileSync(library.reportPath, 'utf8'));

  assert.equal(report.status, 'passed', JSON.stringify(report.projects.filter(project => project.status !== 'passed')));
  assert.ok(report.summary.projectArtifactCount >= 6);
  assert.equal(report.summary.validatedArtifactCount, report.summary.projectArtifactCount);
  assert.ok(report.projects.every(project => project.checks.nativeRoundTrip && /^[a-f0-9]{64}$/.test(project.topologySha256)));
  assert.ok(report.projects.every(project => project.metrics.authoredSheetCount === project.metrics.sheetCount
    && project.metrics.emptyContentSheetIds.length === 0));
  assert.ok(report.summary.distinctTopologyCount >= 5);
  const relay = report.projects.find(project => project.id === 'relay-contactor-24v');
  assert.equal(relay.metrics.connectedSheetCount, 3);
  assert.equal(relay.wirePreview.sheetId, 'control');
  const previewSegments = relay.wirePreview.segments.split(' ').map(segment => segment.split(',').map(Number));
  assert.equal(previewSegments.length, 12);
  assert.ok(previewSegments.every(segment => segment.length === 4 && segment.every(coordinate => coordinate >= 0 && coordinate <= 100)));
  assert.ok(relay.metrics.authoredSheetCount > relay.metrics.connectedSheetCount);
  assert.equal(relay.releaseScale.qualified, false);
  assert.equal(relay.releaseScale.additionalAuthoredSheetsRequired, 28);
  assert.equal(relay.releaseScale.additionalConnectedSheetsRequired, 67);
  assert.equal(relay.releaseScale.sheetIdsWithoutElectricalConnectivity.length, relay.metrics.sheetCount - 3);
  assert.equal(report.summary.releaseScaleGate.minimumConnectedSheetsPerProject, 70);
  assert.equal(report.summary.releaseScaleGate.requiredSheetCount, 5000);
  assert.ok(report.summary.releaseScaleGate.qualifiedDistinctProjects <= report.summary.distinct100SheetTopologyCount);
  const dolOpening = report.projects.find(project => project.id === 'dol-reference-opening');
  assert.ok(dolOpening);
  assert.equal(dolOpening.metrics.sheetCount, 100);
  assert.equal(dolOpening.metrics.authoredSheetCount, 100);
  assert.equal(dolOpening.releaseScale.additionalAuthoredSheetsRequired, 0);
  assert.equal(dolOpening.releaseScale.additionalConnectedSheetsRequired, 68);
  assert.ok(!dolOpening.releaseScale.sheetIdsWithoutElectricalConnectivity.includes('dol-reference-001'));
  assert.equal(dolOpening.metrics.contentObjectCount, 1061);
  assert.deepEqual(dolOpening.metrics.emptyContentSheetIds, []);
  assert.equal(dolOpening.metrics.componentCount, 11);
  assert.equal(dolOpening.metrics.wireCount, 39);
  const dolProject = JSON.parse(fs.readFileSync(path.join(__dirname, 'examples', 'real-projects', 'siemens-schneider-sew-dol-reference.adigun.json'), 'utf8'));
  assert.equal(new Set(dolProject.objects.map(object => object.id)).size, dolProject.objects.length);
  const revisionText = dolProject.objects.filter(object => object.kind === 'text' && object.sheetId === 'dol-reference-004').map(object => object.text).join(' ');
  for (const revision of ['A2/001', 'A2/002', 'A2/003', 'A2/004', 'A2/005', 'A2/006', 'A2/007', 'A2/008', 'A2/009', 'A2/010', 'A2/011', 'A2/012', 'A2/013', 'A2/014', 'A2/015', 'A2/016', 'A2/017', 'A2/018', 'A2/019', 'A2/020', 'A2/021', 'A2/022', 'A2/023', 'A2/024', 'A2/025', 'A2/026', 'A2/027', 'A2/028', 'A2/029', 'A2/030']) assert.ok(revisionText.includes(revision));
  assert.ok(revisionText.includes('A2/031–A2/041'));
  assert.ok(revisionText.includes('A2/042 | signalling-circuit frequency'));
  assert.ok(revisionText.includes('A2/043 | short-time withstand current'));
  assert.ok(revisionText.includes('A2/044 | associated fuse ratings'));
  assert.ok(revisionText.includes('A2/065 | Q1 Ics'));
  assert.ok(revisionText.includes('A2/066 | instantaneous trip response'));
  assert.ok(revisionText.includes('A2/067 | Q1 AC-3 power'));
  assert.ok(revisionText.includes('A2/068 | Q1 operating frequency'));
  assert.ok(revisionText.includes('A2/069 | Q1 current'));
  assert.ok(revisionText.includes('A2/070 | Q1 phase failure detection'));
  assert.ok(revisionText.includes('A2/071 | Q1 dimensions and mounting'));
  assert.ok(revisionText.includes('A2/072 | Q1 ground-fault detection'));
  const designBasisText = dolProject.objects.filter(object => object.kind === 'text' && object.sheetId === 'dol-reference-005').map(object => object.text).join(' ');
  for (const fact of ['0.405 A', '0.35–0.5 A', 'rating comparison only', 'does not choose or enter a Q1 setting', 'Starting current', 'not simulated', 'download.sew-eurodrive.com', 'support.industry.siemens.com']) assert.ok(designBasisText.includes(fact));
  const indexObjects = dolProject.objects.filter(object => object.kind === 'text' && object.sheetId === 'dol-reference-006');
  assert.equal(new Set(indexObjects.map(object => object.y)).size, indexObjects.length, 'A2/006 index rows must not overlap');
  const indexText = dolProject.objects.filter(object => object.kind === 'text' && object.sheetId === 'dol-reference-006').map(object => object.text).join(' ');
  for (const page of ['A2/001 | DOL motor feeder schematic', 'A2/002 | Project status and scope', 'A2/003 | Component register', 'A2/004 | Revision record', 'A2/005 | Design basis and rating comparison']) assert.ok(indexText.includes(page));
  assert.ok(indexText.includes('A2/004 | Revision record | history through A2/072'));
  assert.ok(indexText.includes('A2/007 | Pin/net connection schedule'));
  assert.ok(indexText.includes('A2/008 | Wire schedule, part 1'));
  assert.ok(indexText.includes('A2/009 | Wire schedule, part 2'));
  assert.ok(indexText.includes('A2/010 | Manufacturer source register'));
  assert.ok(indexText.includes('A2/011 | Q1/KM1 terminal reference'));
  assert.ok(indexText.includes('A2/012 | M1 terminal/net reference'));
  assert.ok(indexText.includes('A2/013 | S0/S1 control-contact reference'));
  assert.ok(indexText.includes('A2/014 | X1–X6 terminal boundary reference'));
  assert.ok(indexText.includes('A2/015 | Static control-path net reference'));
  assert.ok(indexText.includes('A2/016 | Three-phase power-path net reference'));
  assert.ok(indexText.includes('A2/017 | Application input omissions register'));
  assert.ok(indexText.includes('A2/018 | KM1 coil demand reference'));
  assert.ok(indexText.includes('A2/019 | DOL seal-in path'));
  assert.ok(indexText.includes('A2/020 | AC-3 catalog rating'));
  assert.ok(indexText.includes('A2/021 | dimensions/mounting reference'));
  assert.ok(indexText.includes('A2/022 | terminal torque/tool reference'));
  assert.ok(indexText.includes('A2/023 | terminal conductor options'));
  assert.ok(indexText.includes('A2/024 | coil voltage limits'));
  assert.ok(indexText.includes('A2/025 | AC-3 electrical durability'));
  assert.ok(indexText.includes('A2/026 | KM1 rated insulation voltage'));
  assert.ok(indexText.includes('A2/027 | KM1 rated impulse withstand voltage'));
  assert.ok(indexText.includes('A2/028 | KM1 operating-rate reference'));
  assert.ok(indexText.includes('A2/029 | KM1 signalling-circuit minimum switching reference'));
  assert.ok(indexText.includes('A2/030 | KM1 auxiliary-contact non-overlap-time reference'));
  assert.ok(indexText.includes('A2/031 | KM1 front-face IP20 reference'));
  assert.ok(indexText.includes('A2/032 | KM1 ambient-temperature reference'));
  assert.ok(indexText.includes('A2/033 | KM1 operating-altitude reference'));
  assert.ok(indexText.includes('A2/034 | KM1 environmental classification reference'));
  assert.ok(indexText.includes('A2/035 | KM1 vibration and shock ratings reference'));
  assert.ok(indexText.includes('A2/036 | KM1 mechanical durability reference'));
  assert.ok(indexText.includes('A2/037 | KM1 rated breaking capacity reference'));
  assert.ok(indexText.includes('A2/038 | KM1 rated making capacity reference'));
  assert.ok(indexText.includes('A2/039 | KM1 conventional free-air thermal current reference'));
  assert.ok(indexText.includes('A2/040 | KM1 power dissipation reference'));
  assert.ok(indexText.includes('A2/041 | KM1 signalling-circuit rated making capacity'));
  assert.ok(indexText.includes('A2/041 | KM1 signalling-circuit rated making capacity'));
  assert.ok(indexText.includes('A2/042 | KM1 signalling-circuit frequency reference'));
  assert.ok(indexText.includes('A2/043 | KM1 rated short-time withstand current'));
  assert.ok(indexText.includes('A2/044 fuse'));
  assert.ok(indexText.includes('A2/048 mirror'));
  assert.ok(indexText.includes('A2/049 times'));
  assert.ok(indexText.includes('A2/050 coil'));
  assert.ok(indexText.includes('A2/047 B10d'));
  assert.ok(indexText.includes('A2/045 AC-1'));
  assert.ok(indexText.includes('A2/046 dur.'));
  assert.ok(indexText.includes('A2/050 coil'));
  assert.ok(indexText.includes('A2/052 Type 1'));
  assert.ok(dolProject.objects.find(object => object.id === 'dol-ref-006-line-39').text.length <= 110, 'A2/006 final index row must remain concise');
  const scopeProgress = dolProject.objects.filter(object => object.sheetId === 'dol-reference-002').map(object => object.text).join(' ');
  assert.ok(scopeProgress.includes('100 authored sheets. The drawing set meets its 100-sheet target.'));
  assert.ok(scopeProgress.includes('91 complete authored sheets; A2/092–A2/100 are not authored.'));
  const q1InstallationAltitudeSheet = dolProject.sheets.find(sheet => sheet.id === 'dol-reference-061');
  assert.equal(q1InstallationAltitudeSheet.number, 'A2/061');
  const q1InstallationAltitudeText = dolProject.objects.filter(object => object.kind === 'text' && object.sheetId === 'dol-reference-061').map(object => object.text).join(' ');
  for (const fact of ['maximum installation altitude 2 000 m above sea level', 'does not identify the project installation altitude', 'No site elevation, derating, or application suitability is established', '3RV2011-0FA10', 'https://support.industry.siemens.com/teddatasheet/?caller=SIOS&format=pdf&language=en&mlfbs=3RV2011-0FA10']) assert.ok(q1InstallationAltitudeText.includes(fact), 'A2/061 must retain the source-backed Q1 limit and scope: ' + fact);
  assert.equal(dolProject.objects.filter(object => object.sheetId === 'dol-reference-061').length, 9);
  const q1OperatingVoltageSheet = dolProject.sheets.find(sheet => sheet.id === 'dol-reference-062');
  assert.equal(q1OperatingVoltageSheet.number, 'A2/062');
  const q1OperatingVoltageText = dolProject.objects.filter(object => object.kind === 'text' && object.sheetId === 'dol-reference-062').map(object => object.text).join(' ');
  for (const fact of ['rated operating voltage 20…690 V AC', 'not a project supply specification', 'does not establish motor compatibility or protection coordination', '3RV2011-0FA10', 'https://support.industry.siemens.com/teddatasheet/?caller=SIOS&format=pdf&language=en&mlfbs=3RV2011-0FA10']) assert.ok(q1OperatingVoltageText.includes(fact), 'A2/062 must retain the manufacturer rating and its scope: ' + fact);
  assert.equal(dolProject.objects.filter(object => object.sheetId === 'dol-reference-062').length, 9);
  const q1OperatingFrequencySheet = dolProject.sheets.find(sheet => sheet.id === 'dol-reference-063');
  assert.equal(q1OperatingFrequencySheet.number, 'A2/063');
  const q1OperatingFrequencyText = dolProject.objects.filter(object => object.kind === 'text' && object.sheetId === 'dol-reference-063').map(object => object.text).join(' ');
  for (const fact of ['rated operating frequency 50…60 Hz', 'project supply frequency is not assigned', 'does not establish motor compatibility, operating duty, or application suitability', '3RV2011-0FA10', 'https://support.industry.siemens.com/teddatasheet/?caller=SIOS&format=pdf&language=en&mlfbs=3RV2011-0FA10']) assert.ok(q1OperatingFrequencyText.includes(fact), 'A2/063 must retain the source-backed Q1 frequency and scope: ' + fact);
  assert.equal(dolProject.objects.filter(object => object.sheetId === 'dol-reference-063').length, 9);
  const q1BreakingCapacitySheet = dolProject.sheets.find(sheet => sheet.id === 'dol-reference-064');
  assert.equal(q1BreakingCapacitySheet.number, 'A2/064');
  const q1BreakingCapacityText = dolProject.objects.filter(object => object.kind === 'text' && object.sheetId === 'dol-reference-064').map(object => object.text).join(' ');
  for (const fact of ['Ultimate short-circuit breaking capacity (Icu): 100 kA at 400 V AC', 'not the project\'s prospective fault current', 'does not establish assembly short-circuit rating or protective-device coordination', '3RV2011-0FA10', 'https://support.industry.siemens.com/teddatasheet/?caller=SIOS&format=pdf&language=en&mlfbs=3RV2011-0FA10']) assert.ok(q1BreakingCapacityText.includes(fact), 'A2/064 must retain the source-backed Q1 capacity and scope: ' + fact);
  assert.equal(dolProject.objects.filter(object => object.sheetId === 'dol-reference-064').length, 9);
  const q1OperatingBreakingCapacitySheet = dolProject.sheets.find(sheet => sheet.id === 'dol-reference-065');
  assert.equal(q1OperatingBreakingCapacitySheet.number, 'A2/065');
  const q1OperatingBreakingCapacityText = dolProject.objects.filter(object => object.kind === 'text' && object.sheetId === 'dol-reference-065').map(object => object.text).join(' ');
  for (const fact of ['Operating short-circuit current breaking capacity (Ics): 100 kA at AC 400 V', 'rated service breaking capacity', 'recorded separately on A2/064', 'not the project prospective fault current', 'does not establish assembly short-circuit rating or protective-device coordination', '3RV2011-0FA10', 'https://support.industry.siemens.com/teddatasheet/?caller=SIOS&format=pdf&language=en&mlfbs=3RV2011-0FA10']) assert.ok(q1OperatingBreakingCapacityText.includes(fact), 'A2/065 must retain the source-backed Q1 Ics value and its scope: ' + fact);
  assert.equal(dolProject.objects.filter(object => object.sheetId === 'dol-reference-065').length, 9);
  const q1InstantaneousTripSheet = dolProject.sheets.find(sheet => sheet.id === 'dol-reference-066');
  assert.equal(q1InstantaneousTripSheet.number, 'A2/066');
  const q1InstantaneousTripText = dolProject.objects.filter(object => object.kind === 'text' && object.sheetId === 'dol-reference-066').map(object => object.text).join(' ');
  for (const fact of ['response value current of the instantaneous short-circuit trip unit as 6.5 A', 'not a measured project current or project fault level', 'No trip curve, delay, tolerance, or installed protective response is assigned', 'does not establish prospective fault current, protection coordination, or application suitability', '3RV2011-0FA10', 'https://support.industry.siemens.com/teddatasheet/?caller=SIOS&format=pdf&language=en&mlfbs=3RV2011-0FA10']) assert.ok(q1InstantaneousTripText.includes(fact), 'A2/066 must retain the source-backed Q1 trip response value and scope: ' + fact);
  assert.equal(dolProject.objects.filter(object => object.sheetId === 'dol-reference-066').length, 9);
  const q1Ac3PowerSheet = dolProject.sheets.find(sheet => sheet.id === 'dol-reference-067');
  assert.equal(q1Ac3PowerSheet.number, 'A2/067');
  const q1Ac3PowerText = dolProject.objects.filter(object => object.kind === 'text' && object.sheetId === 'dol-reference-067').map(object => object.text).join(' ');
  for (const fact of ['0.1 kW at 230 V', '0.12 kW at 400 V', '0.1 kW at 500 V', '0.2 kW at 690 V AC', 'manufacturer component ratings', 'M1 nameplate on A2/055', 'matching kilowatt value alone does not establish motor compatibility or application suitability', 'No motor selection, project voltage, protection coordination, or fault level is assigned', '3RV2011-0FA10', 'https://support.industry.siemens.com/teddatasheet/?caller=SIOS&format=pdf&language=en&mlfbs=3RV2011-0FA10']) assert.ok(q1Ac3PowerText.includes(fact), 'A2/067 must retain Siemens AC-3 ratings and their scope: ' + fact);
  assert.equal(dolProject.objects.filter(object => object.sheetId === 'dol-reference-067').length, 9);
  const q1Ac3FrequencySheet = dolProject.sheets.find(sheet => sheet.id === 'dol-reference-068');
  assert.equal(q1Ac3FrequencySheet.number, 'A2/068');
  const q1Ac3FrequencyText = dolProject.objects.filter(object => object.kind === 'text' && object.sheetId === 'dol-reference-068').map(object => object.text).join(' ');
  for (const fact of ['15 1/h in AC-3', '15 1/h in AC-3e', 'component rating maxima, not the project switching duty', 'No project duty, operating sequence, or thermal cycle is assigned', 'do not establish application suitability or project performance', '3RV2011-0FA10', 'https://support.industry.siemens.com/teddatasheet/?caller=SIOS&format=pdf&language=en&mlfbs=3RV2011-0FA10']) assert.ok(q1Ac3FrequencyText.includes(fact), 'A2/068 must retain the source-backed Q1 operating frequency and its scope: ' + fact);
  assert.equal(dolProject.objects.filter(object => object.sheetId === 'dol-reference-068').length, 9);
  const q1Ac3CurrentSheet = dolProject.sheets.find(sheet => sheet.id === 'dol-reference-069');
  assert.equal(q1Ac3CurrentSheet.number, 'A2/069');
  const q1Ac3CurrentText = dolProject.objects.filter(object => object.kind === 'text' && object.sheetId === 'dol-reference-069').map(object => object.text).join(' ');
  for (const fact of ['At AC 400 V', 'rated operational current of 0.5 A in AC-3', '0.5 A in AC-3e', 'manufacturer component ratings', 'M1 motor nameplate is recorded separately on A2/055', 'do not set the Q1 overload release or establish motor compatibility', 'No project current, protection coordination, or application suitability is inferred', '3RV2011-0FA10', 'https://support.industry.siemens.com/teddatasheet/?caller=SIOS&format=pdf&language=en&mlfbs=3RV2011-0FA10']) assert.ok(q1Ac3CurrentText.includes(fact), 'A2/069 must retain the source-backed Q1 current ratings and their scope: ' + fact);
  assert.equal(dolProject.objects.filter(object => object.sheetId === 'dol-reference-069').length, 9);
  const q1PhaseFailureSheet = dolProject.sheets.find(sheet => sheet.id === 'dol-reference-070');
  assert.equal(q1PhaseFailureSheet.number, 'A2/070');
  const q1PhaseFailureText = dolProject.objects.filter(object => object.kind === 'text' && object.sheetId === 'dol-reference-070').map(object => object.text).join(' ');
  for (const fact of ['phase failure detection', 'as Yes', 'not a project test result', 'No project phase-loss condition, trip response, motor protection, or control behavior is verified', 'no phase-loss alarm, control response, or safety function', '3RV2011-0FA10', 'https://support.industry.siemens.com/teddatasheet/?caller=SIOS&format=pdf&language=en&mlfbs=3RV2011-0FA10']) assert.ok(q1PhaseFailureText.includes(fact), 'A2/070 must retain the Siemens product function and limits: ' + fact);
  assert.equal(dolProject.objects.filter(object => object.sheetId === 'dol-reference-070').length, 9);
  const q1DimensionsSheet = dolProject.sheets.find(sheet => sheet.id === 'dol-reference-071');
  assert.equal(q1DimensionsSheet.number, 'A2/071');
  const q1DimensionsText = dolProject.objects.filter(object => object.kind === 'text' && object.sheetId === 'dol-reference-071').map(object => object.text).join(' ');
  for (const fact of ['97 mm high × 45 mm wide × 97 mm deep', 'screw fastening or snap-on mounting onto a 35 mm DIN rail', 'At 400 V, Siemens lists 30 mm up/down and 9 mm side spacing', 'project enclosure layout, clearance, and installation are not established', '3RV2011-0FA10', 'https://support.industry.siemens.com/teddatasheet/?caller=SIOS&format=pdf&language=en&mlfbs=3RV2011-0FA10']) assert.ok(q1DimensionsText.includes(fact), 'A2/071 must retain the source-backed Q1 dimensions and their scope: ' + fact);
  assert.equal(dolProject.objects.filter(object => object.sheetId === 'dol-reference-071').length, 9);
  const q1GroundFaultSheet = dolProject.sheets.find(sheet => sheet.id === 'dol-reference-072');
  assert.equal(q1GroundFaultSheet.number, 'A2/072');
  const q1GroundFaultText = dolProject.objects.filter(object => object.kind === 'text' && object.sheetId === 'dol-reference-072').map(object => object.text).join(' ');
  for (const fact of ['ground fault detection” as No', 'not a finding about all project protective devices', 'Project ground-fault current, sensing method, and protective response are not specified or modeled', 'does not establish project ground-fault protection or application suitability', '3RV2011-0FA10', 'https://support.industry.siemens.com/teddatasheet/?caller=SIOS&format=pdf&language=en&mlfbs=3RV2011-0FA10']) assert.ok(q1GroundFaultText.includes(fact), 'A2/072 must retain the Siemens ground-fault limitation and scope: ' + fact);
  assert.equal(dolProject.objects.filter(object => object.sheetId === 'dol-reference-072').length, 9);
  const topologyReport = engine.analyzeProject(dolProject);
  const scheduleText = dolProject.objects.filter(object => object.kind === 'text' && object.sheetId === 'dol-reference-007').map(object => object.text);
  const expectedNetRows = topologyReport.sheets.flatMap(sheet => sheet.analysis.nets.map(net => `${net.id} | ${net.pins.map(pin => `${pin.ref}:${pin.number}`).sort().join('; ')} | Wire segments: ${net.wireIds.length}`));
  assert.equal(expectedNetRows.length, 16);
  for (const row of expectedNetRows) assert.ok(scheduleText.includes(row), 'A2/007 must match engine net analysis: ' + row);
  const pe = topologyReport.globalNets.find(net => net.wireIds.includes('dol-reference-001:W017'));
  assert.deepEqual(pe.pins.map(pin => pin.ref + ':' + pin.number), ['M1:PE', 'X4:1', 'X4:2']);
  assert.deepEqual(pe.wireIds, ['dol-reference-001:W017', 'dol-reference-014:W039']);
  const wireReport = engine.wireList(dolProject);
  const wireScheduleText = dolProject.objects.filter(object => object.kind === 'text' && object.sheetId === 'dol-reference-008').map(object => object.text);
  const expectedWireRows = wireReport.rows.slice(0, 19).map(row => `${row.wireId} | ${row.netId} | ${row.lengthMm} mm | Pin contacts ${row.startPinRefs.length ? row.startPinRefs.join('; ') : '—'} -> ${row.endPinRefs.length ? row.endPinRefs.join('; ') : '—'} | Net pins ${row.netPinRefs.join('; ')}`);
  assert.equal(wireReport.valid, true);
  assert.equal(expectedWireRows.length, 19);
  for (const row of expectedWireRows) assert.ok(wireScheduleText.includes(row), 'A2/008 must match engine wire-list analysis: ' + row);
  const secondWireScheduleText = dolProject.objects.filter(object => object.kind === 'text' && object.sheetId === 'dol-reference-009').map(object => object.text);
  const expectedSecondWireRows = wireReport.rows.slice(19).map(row => row.wireId + ' | ' + row.netId + ' | ' + row.lengthMm + ' mm | Pin contacts ' + (row.startPinRefs.length ? row.startPinRefs.join('; ') : '—') + ' -> ' + (row.endPinRefs.length ? row.endPinRefs.join('; ') : '—') + ' | Net pins ' + row.netPinRefs.join('; '));
  assert.equal(expectedSecondWireRows.length, 20);
  for (const row of expectedSecondWireRows) assert.ok(secondWireScheduleText.includes(row), 'A2/009 must match engine wire-list analysis: ' + row);
  const powerPathText = dolProject.objects.filter(object => object.kind === 'text' && object.sheetId === 'dol-reference-016').map(object => object.text);
  const powerAnalysis = engine.analyzeProject(dolProject).sheets.find(sheet => sheet.id === 'dol-reference-001').analysis;
  const powerLabels = new Map([['dol-reference-001:net-1', 'L1 boundary to Q1 line terminal'], ['dol-reference-001:net-2', 'L2 boundary to Q1 line terminal'], ['dol-reference-001:net-3', 'L3 boundary to Q1 line terminal'], ['dol-reference-001:net-4', 'Q1 T1 to KM1 L1'], ['dol-reference-001:net-5', 'Q1 T2 to KM1 L2'], ['dol-reference-001:net-6', 'Q1 T3 to KM1 L3'], ['dol-reference-001:net-7', 'KM1 T1 to M1 U1'], ['dol-reference-001:net-8', 'KM1 T2 to M1 V1'], ['dol-reference-001:net-9', 'KM1 T3 to M1 W1'], ['dol-reference-001:net-10', 'M1 U2/V2/W2 star point'], ['dol-reference-001:net-11', 'M1 protective earth to X4 boundary']]);
  const expectedPowerRows = powerAnalysis.nets.filter(net => powerLabels.has(net.id)).map(net => powerLabels.get(net.id) + ' | ' + net.id + ' | pins ' + net.pins.map(pin => pin.ref + ':' + pin.number).sort().join('; ') + ' | wires ' + net.wireIds.join(', ') + ' | ' + net.wireIds.length + (net.wireIds.length === 1 ? ' segment' : ' segments'));
  assert.equal(expectedPowerRows.length, 11);
  for (const row of expectedPowerRows) assert.ok(powerPathText.includes(row), 'A2/016 must match engine power-net analysis: ' + row);
  assert.ok(powerPathText.some(row => row.includes('No switching, motor, protection, PE-adequacy, or installation behavior is simulated')));
  assert.equal(dolProject.revision, 'A2/099');
  assert.equal(dolProject.sheets.length, 100);
  const coilTimeConstantSheet = dolProject.sheets.find(sheet => sheet.id === 'dol-reference-050');
  assert.equal(coilTimeConstantSheet.number, 'A2/050');
  const coilTimeConstantText = dolProject.objects.filter(object => object.kind === 'text' && object.sheetId === 'dol-reference-050').map(object => object.text).join(' ');
  for (const fact of ['28 ms', 'bidirectional peak-limiting diode suppressor', 'does not measure project coil transition', 'system response', 'SQD-LC1D09BD.PDF']) assert.ok(coilTimeConstantText.includes(fact));
  const q1ReleaseSheet = dolProject.sheets.find(sheet => sheet.id === 'dol-reference-056');
  assert.equal(q1ReleaseSheet.number, 'A2/056');
  const q1ReleaseText = dolProject.objects.filter(object => object.kind === 'text' && object.sheetId === 'dol-reference-056').map(object => object.text).join(' ');
  for (const fact of ['3RV2011-0FA10', 'class 10', '0.35–0.5 A', '6.5 A', 'setting remains null', 'does not establish project fault current']) assert.ok(q1ReleaseText.includes(fact));
  const motorNameplateSheet = dolProject.sheets.find(sheet => sheet.id === 'dol-reference-055');
  assert.equal(motorNameplateSheet.number, 'A2/055');
  const motorNameplateText = dolProject.objects.filter(object => object.kind === 'text' && object.sheetId === 'dol-reference-055').map(object => object.text).join(' ');
  for (const fact of ['DRN63MS4', '0.12 kW', '0.405 A', '1380 rpm', '0.83 Nm', '0.64', '58.3%', '63.9%', '64.8%', '30590116.pdf']) assert.ok(motorNameplateText.includes(fact));
  const ac3PowerSheet = dolProject.sheets.find(sheet => sheet.id === 'dol-reference-054');
  assert.equal(ac3PowerSheet.number, 'A2/054');
  const ac3PowerText = dolProject.objects.filter(object => object.kind === 'text' && object.sheetId === 'dol-reference-054').map(object => object.text).join(' ');
  for (const fact of ['220–230 V AC', '2.2 kW', '380–400 V AC', '415–440 V AC', '4 kW', '500 V AC', '5.5 kW', '660–690 V AC', '50/60 Hz', 'do not select the project motor']) assert.ok(ac3PowerText.includes(fact));
  const ac4Sheet = dolProject.sheets.find(sheet => sheet.id === 'dol-reference-053');
  assert.equal(ac4Sheet.number, 'A2/053');
  const ac4Text = dolProject.objects.filter(object => object.kind === 'text' && object.sheetId === 'dol-reference-053').map(object => object.text).join(' ');
  for (const fact of ['AC-4 motor power: 2.2 kW at 400 V AC, 50/60 Hz', 'AC-3 rating is 4 kW at 380–400 V AC', 'not interchangeable', 'project motor selection', 'SQD-LC1D09BD.PDF']) assert.ok(ac4Text.includes(fact));
  const coordinationSheet = dolProject.sheets.find(sheet => sheet.id === 'dol-reference-052');
  assert.equal(coordinationSheet.number, 'A2/052');
  const coordinationText = dolProject.objects.filter(object => object.kind === 'text' && object.sheetId === 'dol-reference-052').map(object => object.text).join(' ');
  for (const row of ['0.06 kW | GV2ME02', '0.09 kW | GV2ME03', '0.12–0.18 kW | GV2ME04', '0.25–0.37 kW | GV2ME05', '0.55 kW | GV2ME06', '0.75 kW | GV2ME07', '1.1–1.5 kW | GV2ME08', '2.2 kW | GV2ME10', '3–4 kW | GV2ME14']) assert.ok(coordinationText.includes(row));
  assert.ok(coordinationText.includes('Icu >100 kA'));
  assert.ok(coordinationText.includes('not a project selection'));
  assert.ok(coordinationText.includes('SQD-LC1D09BD.PDF'));
  const b10dSheet = dolProject.sheets.find(sheet => sheet.id === 'dol-reference-047');
  assert.equal(b10dSheet.number, 'A2/047');
  const b10dText = dolProject.objects.filter(object => object.kind === 'text' && object.sheetId === 'dol-reference-047').map(object => object.text).join(' ');
  assert.ok(b10dText.includes('B10d: 1,369,863 cycles for contactor with nominal load'));
  assert.ok(b10dText.includes('B10d: 20,000,000 cycles for contactor with mechanical load'));
  assert.ok(!b10dText.includes('2,000,000 cycles for contactor with mechanical load'));
  const coilPowerSheet = dolProject.sheets.find(sheet => sheet.id === 'dol-reference-051');
  assert.equal(coilPowerSheet.number, 'A2/051');
  const coilPowerText = dolProject.objects.filter(object => object.kind === 'text' && object.sheetId === 'dol-reference-051').map(object => object.text).join(' ');
  for (const fact of ['5.4 W at 20 °C', 'inrush power', 'hold-in power', 'LC1D09–D38', '2.4 W average', 'sources do not reconcile', 'do not combine or substitute', 'supply adequacy', 'SQD-LC1D09BD.PDF']) assert.ok(coilPowerText.includes(fact));
  const impulseSheet = dolProject.sheets.find(sheet => sheet.id === 'dol-reference-027');
  assert.equal(impulseSheet.number, 'A2/027');
  const impulseText = dolProject.objects.filter(object => object.kind === 'text' && object.sheetId === 'dol-reference-027').map(object => object.text).join(' ');
  assert.ok(impulseText.includes('Uimp: 6 kV'));
  assert.ok(impulseText.includes('not an installation transient limit'));
  assert.ok(impulseText.includes('Surge protection, transient exposure'));
  assert.ok(impulseText.includes('SQD-LC1D09BD.PDF'));
  const operatingRateSheet = dolProject.sheets.find(sheet => sheet.id === 'dol-reference-028');
  assert.equal(operatingRateSheet.number, 'A2/028');
  const operatingRateText = dolProject.objects.filter(object => object.kind === 'text' && object.sheetId === 'dol-reference-028').map(object => object.text).join(' ');
  assert.ok(operatingRateText.includes('3,600 cycles per hour'));
  assert.ok(operatingRateText.includes('up to 60 °C'));
  assert.ok(operatingRateText.includes('does not define this project’s switching duty'));
  assert.ok(operatingRateText.includes('SQD-LC1D09BD.PDF'));
  const signallingLimitsSheet = dolProject.sheets.find(sheet => sheet.id === 'dol-reference-029');
  assert.equal(signallingLimitsSheet.number, 'A2/029');
  const signallingLimitsText = dolProject.objects.filter(object => object.kind === 'text' && object.sheetId === 'dol-reference-029').map(object => object.text).join(' ');
  assert.ok(signallingLimitsText.includes('minimum switching current: 5 mA'));
  assert.ok(signallingLimitsText.includes('minimum switching voltage: 17 V'));
  assert.ok(signallingLimitsText.includes('PLC input compatibility'));
  assert.ok(signallingLimitsText.includes('SQD-LC1D09BD.PDF'));
  const nonOverlapSheet = dolProject.sheets.find(sheet => sheet.id === 'dol-reference-030');
  assert.equal(nonOverlapSheet.number, 'A2/030');
  const nonOverlapText = dolProject.objects.filter(object => object.kind === 'text' && object.sheetId === 'dol-reference-030').map(object => object.text).join(' ');
  assert.ok(nonOverlapText.includes('1.5 ms on energisation'));
  assert.ok(nonOverlapText.includes('1.5 ms on de-energisation'));
  assert.ok(nonOverlapText.includes('does not establish project or PLC response timing'));
  assert.ok(nonOverlapText.includes('SQD-LC1D09BD.PDF'));
  const frontFaceSheet = dolProject.sheets.find(sheet => sheet.id === 'dol-reference-031');
  assert.equal(frontFaceSheet.number, 'A2/031');
  const frontFaceText = dolProject.objects.filter(object => object.kind === 'text' && object.sheetId === 'dol-reference-031').map(object => object.text).join(' ');
  assert.ok(frontFaceText.includes('IP20 for the front face'));
  assert.ok(frontFaceText.includes('not an enclosure or complete-assembly rating'));
  assert.ok(frontFaceText.includes('SQD-LC1D09BD.PDF'));
  const ambientSheet = dolProject.sheets.find(sheet => sheet.id === 'dol-reference-032');
  assert.equal(ambientSheet.number, 'A2/032');
  const ambientText = dolProject.objects.filter(object => object.kind === 'text' && object.sheetId === 'dol-reference-032').map(object => object.text).join(' ');
  for (const fact of ['operation: -5 to +60 °C', 'storage: -60 to +80 °C', 'at Uc: -40 to +70 °C', 'distinct data-sheet condition', 'SQD-LC1D09BD.PDF']) assert.ok(ambientText.includes(fact));
  const altitudeSheet = dolProject.sheets.find(sheet => sheet.id === 'dol-reference-033');
  assert.equal(altitudeSheet.number, 'A2/033');
  const altitudeText = dolProject.objects.filter(object => object.kind === 'text' && object.sheetId === 'dol-reference-033').map(object => object.text).join(' ');
  assert.ok(altitudeText.includes('up to 3,000 m without derating in temperature'));
  assert.ok(altitudeText.includes('does not establish the project site altitude'));
  assert.ok(altitudeText.includes('SQD-LC1D09BD.PDF'));
  const environmentalSheet = dolProject.sheets.find(sheet => sheet.id === 'dol-reference-034');
  assert.equal(environmentalSheet.number, 'A2/034');
  const environmentalText = dolProject.objects.filter(object => object.kind === 'text' && object.sheetId === 'dol-reference-034').map(object => object.text).join(' ');
  assert.ok(environmentalText.includes('pollution degree: 3'));
  assert.ok(environmentalText.includes('Protective treatment: TH'));
  assert.ok(environmentalText.includes('Project pollution, condensation, and installation conditions are not assessed'));
  assert.ok(environmentalText.includes('SQD-LC1D09BD.PDF'));
  const robustnessSheet = dolProject.sheets.find(sheet => sheet.id === 'dol-reference-035');
  assert.equal(robustnessSheet.number, 'A2/035');
  const robustnessText = dolProject.objects.filter(object => object.kind === 'text' && object.sheetId === 'dol-reference-035').map(object => object.text).join(' ');
  for (const fact of ['open: 2 Gn', 'closed: 4 Gn', '5–300 Hz', 'open: 10 Gn for 11 ms', 'closed: 15 Gn for 11 ms', 'do not characterize project exposure', 'SQD-LC1D09BD.PDF']) assert.ok(robustnessText.includes(fact));
  const mechanicalDurabilitySheet = dolProject.sheets.find(sheet => sheet.id === 'dol-reference-036');
  assert.equal(mechanicalDurabilitySheet.number, 'A2/036');
  const mechanicalDurabilityText = dolProject.objects.filter(object => object.kind === 'text' && object.sheetId === 'dol-reference-036').map(object => object.text).join(' ');
  assert.ok(mechanicalDurabilityText.includes('30 Mcycles'));
  assert.ok(mechanicalDurabilityText.includes('not an estimate of project service life'));
  assert.ok(mechanicalDurabilityText.includes('SQD-LC1D09BD.PDF'));
  const breakingCapacitySheet = dolProject.sheets.find(sheet => sheet.id === 'dol-reference-037');
  assert.equal(breakingCapacitySheet.number, 'A2/037');
  const breakingCapacityText = dolProject.objects.filter(object => object.kind === 'text' && object.sheetId === 'dol-reference-037').map(object => object.text).join(' ');
  for (const fact of ['250 A at 440 V', 'power circuit', 'conforming to IEC 60947', 'does not establish project prospective fault current', 'assembly short-circuit rating', 'SQD-LC1D09BD.PDF']) assert.ok(breakingCapacityText.includes(fact));
  const makingCapacitySheet = dolProject.sheets.find(sheet => sheet.id === 'dol-reference-038');
  assert.equal(makingCapacitySheet.number, 'A2/038');
  const makingCapacityText = dolProject.objects.filter(object => object.kind === 'text' && object.sheetId === 'dol-reference-038').map(object => object.text).join(' ');
  for (const fact of ['Irms rated making capacity', '250 A at 440 V', 'distinct catalog characteristic from the rated breaking capacity', 'does not establish project fault conditions', 'SQD-LC1D09BD.PDF']) assert.ok(makingCapacityText.includes(fact));
  const thermalCurrentSheet = dolProject.sheets.find(sheet => sheet.id === 'dol-reference-039');
  assert.equal(thermalCurrentSheet.number, 'A2/039');
  const thermalCurrentText = dolProject.objects.filter(object => object.kind === 'text' && object.sheetId === 'dol-reference-039').map(object => object.text).join(' ');
  for (const fact of ['Ith for the power circuit: 25 A', 'signalling circuit: 10 A', 'ambient ≤60 °C', 'distinct from operational-current ratings', 'SQD-LC1D09BD.PDF']) assert.ok(thermalCurrentText.includes(fact));
  const powerDissipationSheet = dolProject.sheets.find(sheet => sheet.id === 'dol-reference-040');
  assert.equal(powerDissipationSheet.number, 'A2/040');
  const powerDissipationText = dolProject.objects.filter(object => object.kind === 'text' && object.sheetId === 'dol-reference-040').map(object => object.text).join(' ');
  for (const fact of ['0.2 W in utilization category AC-3', '1.56 W in utilization category AC-1', 'do not determine project losses', 'enclosure heat rise', 'SQD-LC1D09BD.PDF']) assert.ok(powerDissipationText.includes(fact));
  const signallingMakingSheet = dolProject.sheets.find(sheet => sheet.id === 'dol-reference-041');
  assert.equal(signallingMakingSheet.number, 'A2/041');
  const signallingMakingText = dolProject.objects.filter(object => object.kind === 'text' && object.sheetId === 'dol-reference-041').map(object => object.text).join(' ');
  for (const fact of ['140 A AC', '250 A DC', 'IEC 60947-5-1', 'separate from the power-circuit value on A2/038', 'do not establish connected-load suitability', 'project switching duty', 'field-circuit coordination', 'SQD-LC1D09BD.PDF']) assert.ok(signallingMakingText.includes(fact));
  const signallingFrequencySheet = dolProject.sheets.find(sheet => sheet.id === 'dol-reference-042');
  assert.equal(signallingFrequencySheet.number, 'A2/042');
  const signallingFrequencyText = dolProject.objects.filter(object => object.kind === 'text' && object.sheetId === 'dol-reference-042').map(object => object.text).join(' ');
  for (const fact of ['25–400 Hz', 'frequency supplied to or switched by this project', 'connected-input compatibility', 'SQD-LC1D09BD.PDF']) assert.ok(signallingFrequencyText.includes(fact));
  const shortTimeWithstandSheet = dolProject.sheets.find(sheet => sheet.id === 'dol-reference-043');
  assert.equal(shortTimeWithstandSheet.number, 'A2/043');
  const shortTimeWithstandText = dolProject.objects.filter(object => object.kind === 'text' && object.sheetId === 'dol-reference-043').map(object => object.text).join(' ');
  for (const fact of ['105 A at ≤40 °C for 10 s', '210 A at ≤40 °C for 1 s', '30 A at ≤40 °C for 10 min', '61 A at ≤40 °C for 1 min', '100 A for 1 s', '120 A for 500 ms', '140 A for 100 ms', 'do not give project fault current', 'interruption capability', 'protective-device coordination', 'SQD-LC1D09BD.PDF']) assert.ok(shortTimeWithstandText.includes(fact));
  const associatedFuseSheet = dolProject.sheets.find(sheet => sheet.id === 'dol-reference-044');
  assert.equal(associatedFuseSheet.number, 'A2/044');
  const associatedFuseText = dolProject.objects.filter(object => object.kind === 'text' && object.sheetId === 'dol-reference-044').map(object => object.text).join(' ');
  for (const fact of ['20 A gG at ≤690 V AC', 'coordination type 2', '25 A gG at ≤690 V AC', 'coordination type 1', '10 A gG', 'IEC 60947-5-1', 'do not select the project Q1 breaker', 'prospective fault current', 'assembly short-circuit rating', 'SQD-LC1D09BD.PDF']) assert.ok(associatedFuseText.includes(fact));
  const inputRegisterText = dolProject.objects.filter(object => object.kind === 'text' && object.sheetId === 'dol-reference-017').map(object => object.text);
  const expectedInputRows = [
      "Q1 | overloadSettingA = null; published 0.35–0.5 A range; no trip point is selected.",
      "AC supply | X1–X3 mark 400 V AC boundaries; source impedance and available short-circuit current are not modeled.",
      "Control supply | X5/X6 mark external +24 V / 0 V DC boundaries; source capacity and branch protection are not modeled.",
      "Field conductors | 39 wire records use drawing-path geometry; conductor type, size, and field installation are not represented.",
      "PE installation | A2/016 net-11 maps M1:PE to X4:1/X4:2; conductor sizing and installation-test evidence are not recorded.",
      "Motor application | M1 is rated 0.12 kW / 0.405 A; the driven load and operating duty are unspecified.",
      "Site conditions | ambient, enclosure, and derating inputs are not recorded."
  ];
  for (const row of expectedInputRows) assert.ok(inputRegisterText.includes(row), 'A2/017 must retain the project-data gap: ' + row);
  assert.ok(inputRegisterText.some(row => row.includes('assigns no values or compliance conclusions')));
  assert.ok(inputRegisterText.some(row => row.includes('engineering review remains necessary')));
  const q1Setting = dolProject.objects.find(object => object.kind === 'component-instance' && object.ref === 'Q1').properties.overloadSettingA;
  assert.equal(q1Setting, null, 'A2/017 Q1 entry must reflect the unset model property');
  const boundaryMarkings = dolProject.objects.filter(object => object.kind === 'component-instance' && ['X1', 'X2', 'X3', 'X5', 'X6'].includes(object.ref)).map(object => object.properties.marking);
  for (const marking of ['L1 · 400 V AC', 'L2 · 400 V AC', 'L3 · 400 V AC', '+24 V DC', '0 V DC']) assert.ok(boundaryMarkings.includes(marking));
  assert.equal(wireReport.rows.length, 39);
  const modeledWires = dolProject.objects.filter(object => object.kind === 'wire');
  assert.ok(modeledWires.every(wire => !['conductorMaterial', 'conductorCrossSectionMm2', 'installationMethod'].some(field => Object.hasOwn(wire, field))));
  const peNet = powerAnalysis.nets.find(net => net.id === 'dol-reference-001:net-11');
  assert.ok(peNet.pins.some(pin => pin.ref === 'M1' && pin.number === 'PE'));


  assert.equal(dolProject.revision, 'A2/099');
  assert.equal(dolProject.sheets.length, 100);
  assert.match(dolProject.status, /^100 authored sheets:/);
  assert.match(dolProject.status, /A2\/001–A2\/099.*A3\/001/);
  const lc1d09 = engine.component('schneider-electric-lc1d09bd');
  assert.deepEqual(lc1d09.specifications.averageCoilConsumptionAtNominalUc, { value: 2.4, unit: 'W', conditions: 'Average at 20 °C and nominal control voltage (Uc)' });
  assert.deepEqual(lc1d09.specifications.averageCoilCurrentAt24V, { value: 100, unit: 'mA', conditions: 'Schneider Electric FAQ states 100 mA at 24 V DC' });
  assert.equal(lc1d09.specifications.terminalConnection.value, 'Screw clamp; manufacturer torque 1.7 N·m for power and control terminals; flat Ø6 mm or Philips No. 2 screwdriver');
  assert.deepEqual(lc1d09.specifications.terminalConductorOptions, [{"circuit":"power","cableCount":1,"cableStiffness":"flexible","cableEnd":"with cable end","minimumCrossSectionMm2":1,"maximumCrossSectionMm2":4},{"circuit":"power","cableCount":1,"cableStiffness":"flexible","cableEnd":"without cable end","minimumCrossSectionMm2":1,"maximumCrossSectionMm2":4},{"circuit":"power","cableCount":2,"cableStiffness":"flexible","cableEnd":"without cable end","minimumCrossSectionMm2":1,"maximumCrossSectionMm2":4},{"circuit":"power","cableCount":2,"cableStiffness":"flexible","cableEnd":"with cable end","minimumCrossSectionMm2":1,"maximumCrossSectionMm2":2.5},{"circuit":"power","cableCount":1,"cableStiffness":"solid","cableEnd":"without cable end","minimumCrossSectionMm2":1,"maximumCrossSectionMm2":4},{"circuit":"power","cableCount":2,"cableStiffness":"solid","cableEnd":"without cable end","minimumCrossSectionMm2":1,"maximumCrossSectionMm2":4},{"circuit":"control","cableCount":2,"cableStiffness":"flexible","cableEnd":"with cable end","minimumCrossSectionMm2":1,"maximumCrossSectionMm2":2.5},{"circuit":"control","cableCount":1,"cableStiffness":"flexible","cableEnd":"without cable end","minimumCrossSectionMm2":1,"maximumCrossSectionMm2":4},{"circuit":"control","cableCount":2,"cableStiffness":"flexible","cableEnd":"without cable end","minimumCrossSectionMm2":1,"maximumCrossSectionMm2":4},{"circuit":"control","cableCount":1,"cableStiffness":"flexible","cableEnd":"with cable end","minimumCrossSectionMm2":1,"maximumCrossSectionMm2":4},{"circuit":"control","cableCount":1,"cableStiffness":"solid","cableEnd":"without cable end","minimumCrossSectionMm2":1,"maximumCrossSectionMm2":4},{"circuit":"control","cableCount":2,"cableStiffness":"solid","cableEnd":"without cable end","minimumCrossSectionMm2":1,"maximumCrossSectionMm2":4}]);
  assert.deepEqual(lc1d09.specifications.coilOperationalRangeAt60C, { minimum: 0.7, maximum: 1.25, unit: '× Uc' });
  assert.deepEqual(lc1d09.specifications.coilDropOutRangeAt60C, { minimum: 0.1, maximum: 0.25, unit: '× Uc' });
  assert.deepEqual(lc1d09.specifications.electricalDurabilityAc3, { value: 2, unit: 'Mcycles', conditions: '9 A AC-3 at Ue ≤440 V AC' });
  assert.deepEqual(lc1d09.specifications.ratedInsulationVoltage, {
    iecPowerCircuit: { value: 690, unit: 'V', standard: 'IEC 60947-4-1' },
    iecSignallingCircuit: { value: 690, unit: 'V', standard: 'IEC 60947-1' },
    csaPowerCircuit: { value: 600, unit: 'V' }, ulPowerCircuit: { value: 600, unit: 'V' },
    csaSignallingCircuit: { value: 600, unit: 'V' }, ulSignallingCircuit: { value: 600, unit: 'V' }
  });
  assert.deepEqual(lc1d09.specifications.ratedImpulseWithstandVoltage, { value: 6, unit: 'kV', standard: 'IEC 60947' });
  assert.deepEqual(lc1d09.specifications.operatingRate, { value: 3600, unit: 'cycles/h', conditions: 'At ambient temperature ≤60 °C' });
  assert.ok(lc1d09.sources.some(source => source.url === 'https://www.se.com/es/es/faqs/FA33405/' && source.modifiedAt === '2025-04-09'));
  assert.equal((lc1d09.specifications.averageCoilConsumptionAtNominalUc.value / lc1d09.electricalFunctions.contactor.coil.nominalVoltage.value).toFixed(2), '0.10');
  const contactorDoc = fs.readFileSync(path.join(__dirname, 'docs', 'components', 'schneider-electric-lc1d09bd.md'), 'utf8');
  assert.ok(contactorDoc.includes('FAQ FA33405'));
  assert.ok(contactorDoc.includes('average coil consumption of 2.4 W at 20 °C'));
  assert.ok(contactorDoc.includes('100 mA'));
  assert.ok(contactorDoc.includes('5.4 W inrush and hold-in power'));
  assert.ok(contactorDoc.includes('sources do not reconcile'));
  assert.ok(contactorDoc.includes('LC1D09BD as an example'));
  const coilReferenceText = dolProject.objects.filter(object => object.kind === 'text' && object.sheetId === 'dol-reference-018').map(object => object.text);
  const expectedCoilRows = [
      "KM1 | Schneider Electric LC1D09BD | 24 V DC coil terminals A1/A2.",
      "Source FA33405 | LC1D09–D38 low-consumption coil average: 2.4 W at 20 °C and nominal Uc.",
      "At KM1 nominal Uc = 24 V DC | 2.4 W ÷ 24 V = 0.10 A (100 mA) average per coil.",
      "The 0.10 A value is arithmetic from FAQ FA33405's 2.4 W average at 24 V; it is not a project measurement.",
      "The FAQ's 2.4 W average differs from the LC1D09BD datasheet's 5.4 W inrush and hold-in power; the sources do not reconcile the terms.",
      "These data do not establish total control-circuit demand or 24 V source adequacy; exact coil consumption is unresolved here.",
      "Source: Schneider Electric FAQ FA33405, modified 2025-04-09.",
      "https://www.se.com/es/es/faqs/FA33405/",
      "No coil-state or contactor-actuation behavior is simulated."
  ];
  for (const row of expectedCoilRows) assert.ok(coilReferenceText.includes(row), 'A2/018 must match source-backed coil data and limitations: ' + row);
  const km1ForCoil = dolProject.objects.find(object => object.kind === 'component-instance' && object.ref === 'KM1');
  assert.equal(km1ForCoil.componentId, lc1d09.id);
  assert.ok(km1ForCoil.properties.comment.includes('24 V DC coil'));


  const ac3ReferenceText = dolProject.objects.filter(object => object.kind === 'text' && object.sheetId === 'dol-reference-020').map(object => object.text);
  const expectedAc3Rows = [
    "KM1 | Schneider Electric TeSys D LC1D09BD | three-pole contactor.",
    "Manufacturer rating: 9 A AC-3 at Ue ≤440 V AC and ambient ≤60 °C.",
    "These are the manufacturer’s stated conditions for this catalog rating.",
    "Catalog rating only; it does not establish application suitability or coordination.",
    "Source: Schneider Electric LC1D09BD product data sheet.",
    "https://iportal.se.com/Contents/docs/SQD-LC1D09BD.PDF",
    "Motor duty, starting, protection, coordination, fault level, and site conditions are not assessed.",
    "Contactor switching and protection behavior are not simulated."
  ];
  for (const row of expectedAc3Rows) assert.ok(ac3ReferenceText.includes(row), 'A2/020 must preserve source-backed AC-3 conditions and limitations: ' + row);
  assert.ok(dolProject.sheets.some(sheet => sheet.id === 'dol-reference-020' && sheet.number === 'A2/020'));
  assert.ok(dolProject.sheets.some(sheet => sheet.number === 'A2/019' && sheet.name === 'DOL seal-in path reference'));
  const dimensionsReferenceText = dolProject.objects.filter(object => object.kind === 'text' && object.sheetId === 'dol-reference-021').map(object => object.text);
  const expectedDimensionRows = [
    "Manufacturer envelope: width 45 mm × height 77 mm × depth 95 mm.",
    "Datasheet depth c: 93 mm without cover/add-on blocks; 95 mm with cover and no add-on blocks.",
    "Manufacturer mounting support: rail or plate.",
    "The dimension drawing marks minimum electrical clearance; this page assigns no clearance value.",
    "Catalog dimensions do not define this project's panel layout or component spacing.",
    "Source: Schneider Electric LC1D09BD product data sheet https://iportal.se.com/Contents/docs/SQD-LC1D09BD.PDF",
    "The schematic symbol is not a physical footprint; fit, mounting, and clearances are not modeled or verified."
  ];
  for (const row of expectedDimensionRows) assert.ok(dimensionsReferenceText.includes(row), 'A2/021 must match Schneider data and preserve physical-layout limits: ' + row);
  assert.ok(dolProject.sheets.some(sheet => sheet.id === 'dol-reference-021' && sheet.number === 'A2/021'));
  const km1TorqueReferenceText = dolProject.objects.filter(object => object.kind === 'text' && object.sheetId === 'dol-reference-022').map(object => object.text);
  const expectedKm1TorqueRows = [
    "KM1 | Schneider Electric LC1D09BD.",
    "Power screw-clamp terminal tightening torque: 1.7 N·m.",
    "Control screw-clamp terminal tightening torque: 1.7 N·m.",
    "Manufacturer screwdriver options: flat Ø6 mm or Philips No. 2.",
    "Source data is catalog guidance; this project contains no installed termination or inspection record.",
    "Cable selection, preparation, and field torque verification are not represented by this static drawing.",
    "Source: Schneider Electric LC1D09BD product data sheet https://iportal.se.com/Contents/docs/SQD-LC1D09BD.PDF"
  ];
  for (const row of expectedKm1TorqueRows) assert.ok(km1TorqueReferenceText.includes(row), 'A2/022 must preserve source-backed terminal data and limits: ' + row);
  assert.ok(dolProject.sheets.some(sheet => sheet.id === 'dol-reference-022' && sheet.number === 'A2/022'));
  const km1ConductorPageText = dolProject.objects.filter(object => object.kind === 'text' && object.sheetId === 'dol-reference-023').map(object => object.text);
  const km1ExpectedConductorRows = lc1d09.specifications.terminalConductorOptions.map(option => option.circuit.toUpperCase() + ' | ' + option.cableCount + ' ' + (option.cableCount === 1 ? 'cable' : 'cables') + ' | ' + option.cableStiffness + ' ' + option.cableEnd + ' | ' + option.minimumCrossSectionMm2 + '–' + option.maximumCrossSectionMm2 + ' mm².');
  assert.equal(km1ExpectedConductorRows.length, 12);
  for (const row of km1ExpectedConductorRows) assert.ok(km1ConductorPageText.includes(row), 'A2/023 must match source-backed terminal conductor limits: ' + row);
  assert.ok(km1ConductorPageText.includes('These are manufacturer terminal limits, not project conductor selections.'));
  assert.ok(km1ConductorPageText.includes('The project does not assign cable types, preparation, or cross-sections.'));
  assert.ok(dolProject.sheets.some(sheet => sheet.id === 'dol-reference-023' && sheet.number === 'A2/023'));
  const km1CoilLimitsText = dolProject.objects.filter(object => object.kind === 'text' && object.sheetId === 'dol-reference-024').map(object => object.text);
  const km1CoilVoltageRows = [
    "KM1 | Schneider Electric LC1D09BD | 24 V DC coil.",
    "At 60 °C, DC operational range: 0.7–1.25 × Uc.",
    "At 60 °C, DC drop-out range: 0.1–0.25 × Uc.",
    "These are manufacturer component limits, not measured coil-terminal values in this project.",
    "Supply availability, wiring drop, coil transition, and contactor action are not simulated.",
    "Source: Schneider Electric LC1D09BD data sheet https://iportal.se.com/Contents/docs/SQD-LC1D09BD.PDF"
  ];
  for (const row of km1CoilVoltageRows) assert.ok(km1CoilLimitsText.includes(row), 'A2/024 must preserve manufacturer coil-voltage conditions and limits: ' + row);
  assert.ok(dolProject.sheets.some(sheet => sheet.id === 'dol-reference-024' && sheet.number === 'A2/024'));

  const km1DurabilityText = dolProject.objects.filter(object => object.kind === 'text' && object.sheetId === 'dol-reference-025').map(object => object.text);
  const expectedKm1DurabilityRows = [
    "KM1 | Schneider Electric LC1D09BD | 9 A AC-3 at Ue ≤440 V AC.",
    "Electrical durability: 2 Mcycles at 9 A AC-3 and Ue ≤440 V AC.",
    "This catalog condition does not establish this project's switching duty or service life.",
    "Operating cycles, load profile, environment, maintenance, and contact wear are not assessed or simulated.",
    "Source: Schneider Electric LC1D09BD product data sheet https://iportal.se.com/Contents/docs/SQD-LC1D09BD.PDF"
  ];
  for (const row of expectedKm1DurabilityRows) assert.ok(km1DurabilityText.includes(row), 'A2/025 must preserve the catalog durability condition and scope: ' + row);
  assert.ok(dolProject.sheets.some(sheet => sheet.id === 'dol-reference-025' && sheet.number === 'A2/025'));

  const km1InsulationText = dolProject.objects.filter(object => object.kind === 'text' && object.sheetId === 'dol-reference-026').map(object => object.text);
  const expectedKm1InsulationRows = [
    "KM1 | Schneider Electric LC1D09BD.",
    "IEC 60947-4-1 power circuit | rated insulation voltage Ui: 690 V.",
    "IEC 60947-1 signalling circuit | rated insulation voltage Ui: 690 V.",
    "CSA and UL certification entries | power and signalling circuits: 600 V.",
    "These are product ratings; project insulation coordination and assembly suitability are not established.",
    "This reference does not assess wiring insulation, clearances, or installation conditions.",
    "Source: Schneider Electric LC1D09BD product data sheet https://iportal.se.com/Contents/docs/SQD-LC1D09BD.PDF"
  ];
  for (const row of expectedKm1InsulationRows) assert.ok(km1InsulationText.includes(row), 'A2/026 must distinguish rated insulation values and project limitations: ' + row);
  assert.ok(dolProject.sheets.some(sheet => sheet.id === 'dol-reference-026' && sheet.number === 'A2/026'));




  const history020 = dolProject.objects.find(object => object.id === 'dol-ref-004-line-23');
  const index020 = dolProject.objects.find(object => object.id === 'dol-ref-006-line-23');
  assert.equal(history020.text.startsWith('A2/020 |'), true);
  assert.equal(index020.text.startsWith('A2/020 |'), true);


  const sealInText = dolProject.objects.filter(object => object.kind === 'text' && object.sheetId === 'dol-reference-019').map(object => object.text);
  const expectedSealInRows = [
      "STOP: S0 21–22 | NC series contact | net-12 → net-13.",
      "START: S1 13–14 | NO branch | net-13 → net-14.",
      "Seal-in branch: KM1 auxiliary 13–14 | NO | parallel to START across net-13 and net-14.",
      "Coil route: KM1:A1 is on net-14; KM1:A2 returns on net-15 to X6 0 V DC.",
      "Contact-path condition: closed(S0:21–22) ∧ [closed(S1:13–14) ∨ closed(KM1 aux:13–14)] connects net-12 to KM1:A1.",
      "Normal contacts: S0 21–22 closed; S1 13–14 and KM1 auxiliary 13–14 open.",
      "Terminal roles follow source-backed component definitions; net IDs and pins are checked against A2/001 analysis.",
      "No supply, button action, contact transition, coil actuation, or safety function is simulated or validated.",
      "Static wiring reference only; no safety rating or application-suitability claim."
  ];
  for (const row of expectedSealInRows) assert.ok(sealInText.includes(row), 'A2/019 must preserve the contact-path derivation and limits: ' + row);
  const s0 = dolProject.objects.find(object => object.kind === 'component-instance' && object.ref === 'S0');
  const s1 = dolProject.objects.find(object => object.kind === 'component-instance' && object.ref === 'S1');
  const km1Seal = dolProject.objects.find(object => object.kind === 'component-instance' && object.ref === 'KM1');
  const s0Contact = engine.component(s0.componentId).electricalFunctions.pushButton;
  const s1Contact = engine.component(s1.componentId).electricalFunctions.pushButton;
  const km1Definition = engine.component(km1Seal.componentId).electricalFunctions.contactor;
  const holdIn = km1Definition.auxiliaryContacts.find(contact => contact.first === 'aux-13' && contact.second === 'aux-14');
  assert.equal(s0Contact.normalContactState, 'closed');
  assert.equal(s1Contact.normalContactState, 'open');
  assert.equal(holdIn.type, 'mechanically-linked NO');
  assert.equal(holdIn.normalState, 'open');
  const sealAnalysis = engine.analyzeProject(dolProject).sheets.find(sheet => sheet.id === 'dol-reference-001').analysis;
  const sealNets = new Map(sealAnalysis.nets.map(net => [net.id, net.pins.map(pin => pin.ref + ':' + pin.number).sort()]));
  const expectedSealPins = new Map([
    ['dol-reference-001:net-12', ['S0:21', 'X5:1', 'X5:2']],
    ['dol-reference-001:net-13', ['KM1:13', 'S0:22', 'S1:13']],
    ['dol-reference-001:net-14', ['KM1:14', 'KM1:A1', 'S1:14']],
    ['dol-reference-001:net-15', ['KM1:A2', 'X6:1', 'X6:2']]
  ]);
  for (const [netId, expectedPins] of expectedSealPins) assert.deepEqual(sealNets.get(netId), expectedPins, 'A2/019 must match the analyzed contact and coil path: ' + netId);
  assert.ok(sealInText.some(row => row.includes('No supply, button action, contact transition, coil actuation, or safety function is simulated')));

  const controlPathText = dolProject.objects.filter(object => object.kind === 'text' && object.sheetId === 'dol-reference-015').map(object => object.text);
  const controlAnalysis = engine.analyzeProject(dolProject).sheets.find(sheet => sheet.id === 'dol-reference-001').analysis;
  const controlLabels = new Map([['dol-reference-001:net-12', 'X5 control boundary to S0 NC input'], ['dol-reference-001:net-13', 'S0 NC output to parallel S1/KM1 auxiliary NO inputs'], ['dol-reference-001:net-14', 'Parallel NO outputs to KM1 coil A1'], ['dol-reference-001:net-15', 'KM1 coil A2 return to X6 boundary']]);
  const expectedControlRows = controlAnalysis.nets.filter(net => controlLabels.has(net.id)).map(net => controlLabels.get(net.id) + ' | ' + net.id + ' | pins ' + net.pins.map(pin => pin.ref + ':' + pin.number).sort().join('; ') + ' | wires ' + net.wireIds.join(', ') + ' | ' + net.wireIds.length + (net.wireIds.length === 1 ? ' segment' : ' segments'));
  assert.equal(expectedControlRows.length, 4);
  for (const row of expectedControlRows) assert.ok(controlPathText.includes(row), 'A2/015 must match engine control-net analysis: ' + row);
  assert.ok(controlPathText.some(row => row.includes('No control supply, button/contactor actuation, coil operation, or dynamic behavior is simulated')));
  const boundaryReferenceText = dolProject.objects.filter(object => object.kind === 'text' && object.sheetId === 'dol-reference-014').map(object => object.text);
  const boundaryInstances = dolProject.objects.filter(object => object.kind === 'component-instance' && /^X[1-6]$/.test(object.ref));
  const boundaryPinNets = new Map();
  for (const { analysis } of topologyReport.sheets) for (const net of analysis.nets) for (const pin of net.pins) boundaryPinNets.set(pin.instanceId + ':' + pin.pinId, net.id);
  const directRoutes = new Map();
  for (const wire of wireReport.rows) for (const pinRef of [...wire.startPinRefs, ...wire.endPinRefs]) directRoutes.set(pinRef, [...(directRoutes.get(pinRef) || []), wire.wireId]);
  const expectedBoundaryRows = boundaryInstances.flatMap(instance => engine.worldPins(instance).map(pin => { const routes = directRoutes.get(instance.ref + ':' + pin.number) || []; return instance.ref + ' | ' + pin.number + ' | ' + pin.name + ' | ' + (routes.length ? 'authored route ' + routes.join('; ') : 'external boundary pin; no direct wire') + ' | net ' + (boundaryPinNets.get(instance.id + ':' + pin.id) || 'not in analyzed net'); }));
  assert.equal(boundaryInstances.length, 6);
  assert.ok(boundaryInstances.every(instance => instance.properties.comment.includes('External connection boundary')));
  assert.equal(expectedBoundaryRows.length, 12);
  for (const row of expectedBoundaryRows) assert.ok(boundaryReferenceText.includes(row), 'A2/014 must match terminal pin, route, and net analysis: ' + row);
  for (const instance of boundaryInstances) { const rows = expectedBoundaryRows.filter(row => row.startsWith(instance.ref + ' | ')); assert.equal(rows.filter(row => row.includes('external boundary pin; no direct wire')).length, 1); assert.equal(new Set(rows.map(row => row.slice(row.lastIndexOf(' | net ') + 7))).size, 1); }
  const contactReferenceText = dolProject.objects.filter(object => object.kind === 'text' && object.sheetId === 'dol-reference-013').map(object => object.text);
  const pushButtonInstances = dolProject.objects.filter(object => object.kind === 'component-instance' && ['S0', 'S1'].includes(object.ref));
  const contactNets = new Map();
  const contactAnalysis = engine.analyzeProject(dolProject).sheets.find(sheet => sheet.id === 'dol-reference-001').analysis;
  for (const net of contactAnalysis.nets) for (const pin of net.pins) contactNets.set(pin.instanceId + ':' + pin.pinId, net.id + ' | ' + net.wireIds.length + (net.wireIds.length === 1 ? ' route segment' : ' route segments'));
  const expectedContactRows = pushButtonInstances.flatMap(instance => { const contact = engine.component(instance.componentId).electricalFunctions.pushButton; return engine.worldPins(instance).map(pin => instance.ref + ' | ' + pin.number + ' | ' + pin.name + ' | normal state: ' + contact.normalContactState + ' | ' + (contactNets.get(instance.id + ':' + pin.id) || 'Not wired in this static drawing')); });
  assert.equal(expectedContactRows.length, 4);
  for (const row of expectedContactRows) assert.ok(contactReferenceText.includes(row), 'A2/013 must match component contact and net data: ' + row);
  assert.ok(contactReferenceText.some(row => row.includes('button actuation and continuity are not simulated')));
  const motorReferenceText = dolProject.objects.filter(object => object.kind === 'text' && object.sheetId === 'dol-reference-012').map(object => object.text);
  const motorInstance = dolProject.objects.find(object => object.kind === 'component-instance' && object.ref === 'M1');
  const motorPinNets = new Map();
  const motorAnalysis = engine.analyzeProject(dolProject).sheets.find(sheet => sheet.id === 'dol-reference-001').analysis;
  for (const net of motorAnalysis.nets) for (const pin of net.pins) motorPinNets.set(pin.instanceId + ':' + pin.pinId, net.id + ' | ' + net.wireIds.length + (net.wireIds.length === 1 ? ' route segment' : ' route segments'));
  const expectedMotorRows = engine.worldPins(motorInstance).map(pin => 'M1 | ' + pin.number + ' | ' + pin.name + ' | ' + (motorPinNets.get(motorInstance.id + ':' + pin.id) || 'Not wired in this static drawing'));
  assert.equal(expectedMotorRows.length, 7);
  for (const row of expectedMotorRows) assert.ok(motorReferenceText.includes(row), 'A2/012 must match motor pin and net analysis: ' + row);
  assert.ok(motorReferenceText.some(row => row.includes('Schematic coordinates do not depict physical motor-terminal positions')));
  const terminalReferenceText = dolProject.objects.filter(object => object.kind === 'text' && object.sheetId === 'dol-reference-011').map(object => object.text);
  const q1Km1 = dolProject.objects.filter(object => object.kind === 'component-instance' && ['Q1', 'KM1'].includes(object.ref));
  const pinNets = new Map();
  const pinAnalysis = engine.analyzeProject(dolProject).sheets.find(sheet => sheet.id === 'dol-reference-001').analysis;
  for (const net of pinAnalysis.nets) for (const pin of net.pins) pinNets.set(pin.instanceId + ':' + pin.pinId, net.id + ' | ' + net.wireIds.length + (net.wireIds.length === 1 ? ' segment' : ' segments'));
  const expectedTerminalRows = q1Km1.flatMap(instance => engine.worldPins(instance).map(pin => instance.ref + ' | ' + pin.number + ' | ' + pin.name + ' | ' + (pinNets.get(instance.id + ':' + pin.id) || 'Not wired in this static drawing')));
  assert.equal(expectedTerminalRows.length, 18);
  for (const row of expectedTerminalRows) assert.ok(terminalReferenceText.includes(row), 'A2/011 must match component pin and net analysis: ' + row);
  assert.ok(terminalReferenceText.some(row => row.includes('Not wired in this static drawing')));
  const sourceRegisterText = dolProject.objects.filter(object => object.kind === 'text' && object.sheetId === 'dol-reference-010').map(object => object.text);
  const expectedSourceRows = engine.billOfMaterials(dolProject.objects).rows.map(row => row.sourcePublisher + ' | ' + row.partNumber + ' | References ' + row.references.join(', ') + ' | ' + row.sourceTitle + ' | retrieved ' + row.sourceRetrievedAt);
  assert.equal(expectedSourceRows.length, 6);
  for (const row of expectedSourceRows) assert.ok(sourceRegisterText.includes(row), 'A2/010 must match BOM provenance: ' + row);
  for (const row of engine.billOfMaterials(dolProject.objects).rows) assert.ok(sourceRegisterText.includes('Source URL: ' + row.sourceUrl), 'A2/010 must preserve the BOM manufacturer URL: ' + row.sourceUrl);
  const dolBom = engine.billOfMaterials(dolProject.objects);
  const registerText = dolProject.objects.filter(object => object.kind === 'text' && object.sheetId === 'dol-reference-003').map(object => object.text);
  assert.equal(dolBom.valid, true);
  for (const row of dolBom.rows) {
    const expectedRow = `${row.manufacturer} | ${row.partNumber} | ${row.description} | Qty ${row.quantity} | ${row.references.join(', ')}`;
    assert.ok(registerText.includes(expectedRow), 'A2/003 must match the generated BOM line: ' + expectedRow);
  }
  assert.equal(
    report.summary.firstScaleGate.complete,
    report.summary.firstScaleGate.completedDistinct100SheetProjects >= report.summary.firstScaleGate.requiredDistinct100SheetProjects
  );
  assert.deepEqual(savedReport, report);
});


test('A2/057 records Siemens Q1 typical endurance without estimating project life',()=>{
  const project=JSON.parse(fs.readFileSync(path.join(__dirname,'examples','real-projects','siemens-schneider-sew-dol-reference.adigun.json'),'utf8'));
  const sheet=project.sheets.find(item=>item.id==='dol-reference-057');
  const text=project.objects.filter(object=>object.kind==='text'&&object.sheetId==='dol-reference-057').map(object=>object.text).join(' ');
  assert.equal(sheet.number,'A2/057');
  assert.equal(sheet.name,'Q1 Siemens 3RV2011-0FA10 typical endurance reference');
  assert.match(text,/main contacts.*100,000 operating cycles/i);
  assert.match(text,/auxiliary contacts.*100,000 operating cycles/i);
  assert.match(text,/electrical endurance.*100,000 operating cycles/i);
  assert.match(text,/typical values do not predict project service life or switching duty/i);
  assert.ok(text.includes('https://support.industry.siemens.com/teddatasheet/'));
});


test('A2/058 records Siemens Q1 6 kV surge-voltage resistance without assigning project coordination',()=>{
  const project=JSON.parse(fs.readFileSync(path.join(__dirname,'examples','real-projects','siemens-schneider-sew-dol-reference.adigun.json'),'utf8'));
  const sheet=project.sheets.find(item=>item.id==='dol-reference-058');
  const text=project.objects.filter(object=>object.kind==='text'&&object.sheetId==='dol-reference-058').map(object=>object.text).join(' ');
  assert.equal(sheet.number,'A2/058');
  assert.equal(sheet.name,'Q1 Siemens 3RV2011-0FA10 surge-voltage resistance reference');
  assert.match(text,/surge voltage resistance, rated value: 6 kV/i);
  assert.match(text,/does not establish project insulation coordination/i);
  assert.ok(text.includes('https://support.industry.siemens.com/teddatasheet/'));
});


test('A2/059 records Siemens Q1 ambient conditions without assigning project environment',()=>{
  const project=JSON.parse(fs.readFileSync(path.join(__dirname,'examples','real-projects','siemens-schneider-sew-dol-reference.adigun.json'),'utf8'));
  const sheet=project.sheets.find(item=>item.id==='dol-reference-059');
  const text=project.objects.filter(object=>object.kind==='text'&&object.sheetId==='dol-reference-059').map(object=>object.text).join(' ');
  assert.equal(sheet.number,'A2/059');
  assert.equal(sheet.name,'Q1 Siemens 3RV2011-0FA10 ambient-condition reference');
  assert.ok(text.includes('During operation: ambient temperature −20…+60 °C.'));
  assert.ok(text.includes('During storage: ambient temperature −50…+80 °C.'));
  assert.ok(text.includes('During transport: ambient temperature −50…+80 °C.'));
  assert.ok(text.includes('do not establish project site or enclosure suitability'));
  assert.ok(text.includes('https://support.industry.siemens.com/teddatasheet/'));
});


test('A2/060 records Siemens Q1 operating humidity without assigning project conditions',()=>{
  const project=JSON.parse(fs.readFileSync(path.join(__dirname,'examples','real-projects','siemens-schneider-sew-dol-reference.adigun.json'),'utf8'));
  const sheet=project.sheets.find(item=>item.id==='dol-reference-060');
  const text=project.objects.filter(object=>object.kind==='text'&&object.sheetId==='dol-reference-060').map(object=>object.text).join(' ');
  assert.equal(project.revision, 'A2/099');
  assert.equal(project.sheets.length, 100);
  assert.equal(sheet.number,'A2/060');
  assert.equal(sheet.name,'Q1 Siemens 3RV2011-0FA10 operating-humidity reference');
  assert.ok(text.includes('relative humidity during operation 10…95%'));
  assert.ok(text.includes('does not establish project environment'));
  assert.ok(text.includes('https://support.industry.siemens.com/teddatasheet/'));
});

test('A2/070 records Siemens Q1 phase-failure detection as a product function only',()=>{
  const project=JSON.parse(fs.readFileSync(path.join(__dirname,'examples','real-projects','siemens-schneider-sew-dol-reference.adigun.json'),'utf8'));
  const sheet=project.sheets.find(item=>item.id==='dol-reference-070');
  const text=project.objects.filter(object=>object.kind==='text'&&object.sheetId==='dol-reference-070').map(object=>object.text).join(' ');
  assert.equal(project.revision, 'A2/099');
  assert.equal(project.sheets.length, 100);
  assert.equal(sheet.number,'A2/070');
  assert.equal(sheet.name,'Q1 Siemens 3RV2011-0FA10 phase-failure-detection function reference');
  assert.ok(text.includes('phase failure detection'));
  assert.ok(text.includes('not a project test result'));
  assert.ok(text.includes('No project phase-loss condition, trip response, motor protection, or control behavior is verified'));
  assert.ok(text.includes('https://support.industry.siemens.com/teddatasheet/?caller=SIOS&format=pdf&language=en&mlfbs=3RV2011-0FA10'));
});

test('A2/071 records Siemens Q1 dimensions and mounting data without assigning project installation',()=>{
  const project=JSON.parse(fs.readFileSync(path.join(__dirname,'examples','real-projects','siemens-schneider-sew-dol-reference.adigun.json'),'utf8'));
  const sheet=project.sheets.find(item=>item.id==='dol-reference-071');
  const text=project.objects.filter(object=>object.kind==='text'&&object.sheetId==='dol-reference-071').map(object=>object.text).join(' ');
  assert.equal(project.revision, 'A2/099');
  assert.equal(project.sheets.length, 100);
  assert.equal(sheet.number,'A2/071');
  assert.equal(sheet.name,'Q1 Siemens 3RV2011-0FA10 dimensional and mounting reference');
  assert.ok(text.includes('97 mm high × 45 mm wide × 97 mm deep'));
  assert.ok(text.includes('35 mm DIN rail per DIN EN 60715'));
  assert.ok(text.includes('project enclosure layout, clearance, and installation are not established'));
  assert.ok(text.includes('https://support.industry.siemens.com/teddatasheet/?caller=SIOS&format=pdf&language=en&mlfbs=3RV2011-0FA10'));
});

test('A2/072 records Siemens Q1 ground-fault detection as unavailable on this component',()=>{
  const project=JSON.parse(fs.readFileSync(path.join(__dirname,'examples','real-projects','siemens-schneider-sew-dol-reference.adigun.json'),'utf8'));
  const sheet=project.sheets.find(item=>item.id==='dol-reference-072');
  const text=project.objects.filter(object=>object.kind==='text'&&object.sheetId==='dol-reference-072').map(object=>object.text).join(' ');
  assert.equal(project.revision, 'A2/099');
  assert.equal(project.sheets.length, 100);
  assert.equal(sheet.number,'A2/072');
  assert.equal(sheet.name,'Q1 Siemens 3RV2011-0FA10 ground-fault-detection function reference');
  assert.ok(text.includes('“ground fault detection” as No'));
  assert.ok(text.includes('not a finding about all project protective devices'));
  assert.ok(text.includes('Project ground-fault current, sensing method, and protective response are not specified or modeled'));
  assert.ok(text.includes('https://support.industry.siemens.com/teddatasheet/?caller=SIOS&format=pdf&language=en&mlfbs=3RV2011-0FA10'));
});

test('A2/073 records Siemens Q1 insulation voltage without assigning project coordination',()=>{
  const project=JSON.parse(fs.readFileSync(path.join(__dirname,'examples','real-projects','siemens-schneider-sew-dol-reference.adigun.json'),'utf8'));
  const sheet=project.sheets.find(item=>item.id==='dol-reference-073');
  const text=project.objects.filter(object=>object.kind==='text'&&object.sheetId==='dol-reference-073').map(object=>object.text).join(' ');
  assert.equal(project.revision, 'A2/099');
  assert.equal(project.sheets.length, 100);
  assert.equal(sheet.number,'A2/073');
  assert.equal(sheet.name,'Q1 Siemens 3RV2011-0FA10 insulation-voltage reference');
  assert.ok(text.includes('degree of pollution 3 at AC rated value: 690 V'));
  assert.ok(text.includes('project pollution degree, overvoltage category, and insulation coordination are not specified or modeled'));
  assert.ok(text.includes('does not establish assembly insulation coordination or installation suitability'));
  assert.ok(text.includes('https://support.industry.siemens.com/teddatasheet/?caller=SIOS&format=pdf&language=en&mlfbs=3RV2011-0FA10'));
});

test('A2/074 records Siemens Q1 front-face IP20 without rating the project enclosure',()=>{
  const project=JSON.parse(fs.readFileSync(path.join(__dirname,'examples','real-projects','siemens-schneider-sew-dol-reference.adigun.json'),'utf8'));
  const sheet=project.sheets.find(item=>item.id==='dol-reference-074');
  const text=project.objects.filter(object=>object.kind==='text'&&object.sheetId==='dol-reference-074').map(object=>object.text).join(' ');
  assert.equal(project.revision, 'A2/099');
  assert.equal(project.sheets.length, 100);
  assert.equal(sheet.number,'A2/074');
  assert.equal(sheet.name,'Q1 Siemens 3RV2011-0FA10 front-face protection-class reference');
  assert.ok(text.includes('protection class on the front according to IEC 60529 as IP20'));
  assert.ok(text.includes('does not rate a project enclosure, assembly, or terminal access'));
  assert.ok(text.includes('Project enclosure, installation, and touch-protection conditions are not specified or modeled'));
  assert.ok(text.includes('https://support.industry.siemens.com/teddatasheet/?caller=SIOS&format=pdf&language=en&mlfbs=3RV2011-0FA10'));
});

test('A2/075 records Siemens Q1 terminal IP20 separately from the front-face rating',()=>{
  const project=JSON.parse(fs.readFileSync(path.join(__dirname,'examples','real-projects','siemens-schneider-sew-dol-reference.adigun.json'),'utf8'));
  const sheet=project.sheets.find(item=>item.id==='dol-reference-075');
  const text=project.objects.filter(object=>object.kind==='text'&&object.sheetId==='dol-reference-075').map(object=>object.text).join(' ');
  assert.equal(project.revision, 'A2/099');
  assert.equal(project.sheets.length, 100);
  assert.equal(sheet.number,'A2/075');
  assert.equal(sheet.name,'Q1 Siemens 3RV2011-0FA10 terminal protection-class reference');
  assert.ok(text.includes('protection class IP of the terminal as IP20'));
  assert.ok(text.includes('separate from the front-face IP20 value recorded on A2/074'));
  assert.ok(text.includes('does not rate the project enclosure or assembled equipment'));
  assert.ok(text.includes('https://support.industry.siemens.com/teddatasheet/?caller=SIOS&format=pdf&language=en&mlfbs=3RV2011-0FA10'));
});

test('A2/076 records Siemens Q1 shock resistance without implying a project test',()=>{
  const project=JSON.parse(fs.readFileSync(path.join(__dirname,'examples','real-projects','siemens-schneider-sew-dol-reference.adigun.json'),'utf8'));
  const sheet=project.sheets.find(item=>item.id==='dol-reference-076');
  const text=project.objects.filter(object=>object.kind==='text'&&object.sheetId==='dol-reference-076').map(object=>object.text).join(' ');
  assert.equal(project.revision, 'A2/099');
  assert.equal(project.sheets.length, 100);
  assert.equal(sheet.number,'A2/076');
  assert.equal(sheet.name,'Q1 Siemens 3RV2011-0FA10 shock-resistance reference');
  assert.ok(text.includes('IEC 60068-2-27 as 25 g / 11 ms'));
  assert.ok(text.includes('not a project shock test or installed-equipment result'));
  assert.ok(text.includes('Project shock exposure, mounting conditions, and operating performance under shock are not specified or modeled'));
  assert.ok(text.includes('https://support.industry.siemens.com/teddatasheet/?caller=SIOS&format=pdf&language=en&mlfbs=3RV2011-0FA10'));
});


test('A2/077 records Siemens Q1 ambient temperatures without implying project qualification',()=>{
  const project=JSON.parse(fs.readFileSync(path.join(__dirname,'examples','real-projects','siemens-schneider-sew-dol-reference.adigun.json'),'utf8'));
  const sheet=project.sheets.find(item=>item.id==='dol-reference-077');
  const text=project.objects.filter(object=>object.kind==='text'&&object.sheetId==='dol-reference-077').map(object=>object.text).join(' ');
  assert.equal(project.revision, 'A2/099');
  assert.equal(project.sheets.length, 100);
  assert.equal(sheet.number,'A2/077');
  assert.equal(sheet.name,'Q1 Siemens 3RV2011-0FA10 ambient-temperature reference');
  assert.ok(text.includes('during operation of −20 to +60 °C'));
  assert.ok(text.includes('during storage and transport are −50 to +80 °C'));
  assert.ok(text.includes('not project environmental qualification'));
  assert.ok(text.includes('Project ambient range, enclosure conditions, and any required derating are not specified or modeled'));
  assert.ok(text.includes('https://support.industry.siemens.com/teddatasheet/?caller=SIOS&format=pdf&language=en&mlfbs=3RV2011-0FA10'));
  assert.ok(project.objects.find(object=>object.id==='dol-ref-002-line-05')?.text.includes('100 authored sheets. The drawing set meets its 100-sheet target.'));
  assert.ok(project.objects.find(object=>object.id==='dol-ref-004-line-31')?.text.includes('A2/077 | Q1 ambient temperature'));
  assert.ok(project.objects.find(object=>object.id==='dol-ref-006-line-40')?.text.includes('A2/077 Q1 ambient temperature'));
});

test('A2/078 records Siemens Q1 component net weight without implying assembly mass',()=>{
  const project=JSON.parse(fs.readFileSync(path.join(__dirname,'examples','real-projects','siemens-schneider-sew-dol-reference.adigun.json'),'utf8'));
  const sheet=project.sheets.find(item=>item.id==='dol-reference-078');
  const text=project.objects.filter(object=>object.kind==='text'&&object.sheetId==='dol-reference-078').map(object=>object.text).join(' ');
  assert.equal(project.revision, 'A2/099');
  assert.equal(project.sheets.length, 100);
  assert.equal(sheet.number,'A2/078');
  assert.equal(sheet.name,'Q1 Siemens 3RV2011-0FA10 component net-weight reference');
  assert.ok(text.includes('net weight of 280 g'));
  assert.ok(text.includes('does not include a project assembly mass calculation'));
  assert.ok(text.includes('does not assign an installed mass or verify a weight limit'));
  assert.ok(text.includes('https://support.industry.siemens.com/teddatasheet/?caller=SIOS&format=pdf&language=en&mlfbs=3RV2011-0FA10'));
  assert.ok(project.objects.find(object=>object.id==='dol-ref-002-line-05')?.text.includes('100 authored sheets. The drawing set meets its 100-sheet target.'));
  assert.ok(project.objects.find(object=>object.id==='dol-ref-004-line-31')?.text.includes('A2/078 | Q1 net weight'));
  assert.ok(project.objects.find(object=>object.id==='dol-ref-006-line-40')?.text.includes('A2/078 Q1 net weight'));
});

test('A2/079 records Siemens Q1 global warming potential as component data',()=>{
  const project=JSON.parse(fs.readFileSync(path.join(__dirname,'examples','real-projects','siemens-schneider-sew-dol-reference.adigun.json'),'utf8'));
  const sheet=project.sheets.find(item=>item.id==='dol-reference-079');
  const text=project.objects.filter(object=>object.kind==='text'&&object.sheetId==='dol-reference-079').map(object=>object.text).join(' ');
  assert.equal(project.revision, 'A2/099');
  assert.equal(project.sheets.length, 100);
  assert.equal(sheet.number,'A2/079');
  assert.equal(sheet.name,'Q1 Siemens 3RV2011-0FA10 global-warming-potential reference');
  assert.ok(text.includes('74.698 kg CO₂ equivalent'));
  assert.ok(text.includes('Environmental Product Declaration (EPD)'));
  assert.ok(text.includes('not the environmental footprint of this project or its assembled equipment'));
  assert.ok(text.includes('does not calculate lifecycle impacts or aggregate product environmental data'));
  assert.ok(text.includes('https://support.industry.siemens.com/teddatasheet/?caller=SIOS&format=pdf&language=en&mlfbs=3RV2011-0FA10'));
  assert.ok(project.objects.find(object=>object.id==='dol-ref-002-line-05')?.text.includes('100 authored sheets. The drawing set meets its 100-sheet target.'));
  assert.ok(project.objects.find(object=>object.id==='dol-ref-004-line-31')?.text.includes('A2/079 | Q1 global warming potential'));
  assert.ok(project.objects.find(object=>object.id==='dol-ref-006-line-40')?.text.includes('A2/079 Q1 global warming potential'));
});

test('A2/080 records Siemens Q1 manufacturing GWP as EPD component data',()=>{
  const project=JSON.parse(fs.readFileSync(path.join(__dirname,'examples','real-projects','siemens-schneider-sew-dol-reference.adigun.json'),'utf8'));
  const sheet=project.sheets.find(item=>item.id==='dol-reference-080');
  const text=project.objects.filter(object=>object.kind==='text'&&object.sheetId==='dol-reference-080').map(object=>object.text).join(' ');
  assert.equal(project.revision, 'A2/099');
  assert.equal(project.sheets.length, 100);
  assert.equal(sheet.number,'A2/080');
  assert.equal(sheet.name,'Q1 Siemens 3RV2011-0FA10 manufacturing GWP reference');
  assert.ok(text.includes('1.98 kg CO₂ equivalent'));
  assert.ok(text.includes('not measured project emissions'));
  assert.ok(text.includes('not an assembly footprint'));
  assert.ok(text.includes('https://support.industry.siemens.com/teddatasheet/?caller=SIOS&format=pdf&language=en&mlfbs=3RV2011-0FA10'));
  assert.ok(project.objects.find(object=>object.id==='dol-ref-002-line-05')?.text.includes('100 authored sheets. The drawing set meets its 100-sheet target.'));
  assert.ok(project.objects.find(object=>object.id==='dol-ref-004-line-31')?.text.includes('A2/080 | Q1 manufacturing GWP'));
  assert.ok(project.objects.find(object=>object.id==='dol-ref-006-line-40')?.text.includes('A2/080 Q1 manufacturing GWP'));
});

test('A2/081 records Siemens Q1 sales-stage GWP as EPD component data',()=>{
  const project=JSON.parse(fs.readFileSync(path.join(__dirname,'examples','real-projects','siemens-schneider-sew-dol-reference.adigun.json'),'utf8'));
  const sheet=project.sheets.find(item=>item.id==='dol-reference-081');
  const text=project.objects.filter(object=>object.kind==='text'&&object.sheetId==='dol-reference-081').map(object=>object.text).join(' ');
  assert.equal(project.revision, 'A2/099');
  assert.equal(project.sheets.length, 100);
  assert.equal(sheet.number,'A2/081');
  assert.equal(sheet.name,'Q1 Siemens 3RV2011-0FA10 sales-stage GWP reference');
  assert.ok(text.includes('0.134 kg CO₂ equivalent'));
  assert.ok(text.includes('during sales'));
  assert.ok(text.includes('not measured project emissions'));
  assert.ok(text.includes('not an assembly footprint'));
  assert.ok(text.includes('https://support.industry.siemens.com/teddatasheet/?caller=SIOS&format=pdf&language=en&mlfbs=3RV2011-0FA10'));
  assert.ok(project.objects.find(object=>object.id==='dol-ref-002-line-05')?.text.includes('100 authored sheets. The drawing set meets its 100-sheet target.'));
  assert.ok(project.objects.find(object=>object.id==='dol-ref-004-line-31')?.text.includes('A2/081 | Q1 sales-stage GWP'));
  assert.ok(project.objects.find(object=>object.id==='dol-ref-006-line-40')?.text.includes('A2/081 Q1 sales-stage GWP'));
});

test('A2/082 records Siemens Q1 operation-stage GWP as component EPD data',()=>{
  const project=JSON.parse(fs.readFileSync(path.join(__dirname,'examples','real-projects','siemens-schneider-sew-dol-reference.adigun.json'),'utf8'));
  const sheet=project.sheets.find(item=>item.id==='dol-reference-082');
  const text=project.objects.filter(object=>object.kind==='text'&&object.sheetId==='dol-reference-082').map(object=>object.text).join(' ');
  assert.equal(project.revision, 'A2/099');
  assert.equal(project.sheets.length, 100);
  assert.equal(sheet.number,'A2/082');
  assert.equal(sheet.name,'Q1 Siemens 3RV2011-0FA10 operation-stage GWP reference');
  assert.ok(text.includes('72.7 kg CO₂ equivalent'));
  assert.ok(text.includes('during operation'));
  assert.ok(text.includes('not measured project emissions'));
  assert.ok(text.includes('does not represent this project’s energy use, duty cycle, service life, or assembly footprint'));
  assert.ok(text.includes('https://support.industry.siemens.com/teddatasheet/?caller=SIOS&format=pdf&language=en&mlfbs=3RV2011-0FA10'));
  assert.ok(project.objects.find(object=>object.id==='dol-ref-002-line-05')?.text.includes('100 authored sheets. The drawing set meets its 100-sheet target.'));
  assert.ok(project.objects.find(object=>object.id==='dol-ref-004-line-31')?.text.includes('A2/082 | Q1 operation-stage GWP'));
  assert.ok(project.objects.find(object=>object.id==='dol-ref-006-line-40')?.text.includes('A2/082 Q1 operation-stage GWP'));
});

test('A2/083 records Siemens Q1 end-of-life GWP as EPD data',()=>{
  const project=JSON.parse(fs.readFileSync(path.join(__dirname,'examples','real-projects','siemens-schneider-sew-dol-reference.adigun.json'),'utf8'));
  const sheet=project.sheets.find(item=>item.id==='dol-reference-083');
  const text=project.objects.filter(object=>object.kind==='text'&&object.sheetId==='dol-reference-083').map(object=>object.text).join(' ');
  assert.equal(project.revision, 'A2/099');
  assert.equal(project.sheets.length, 100);
  assert.equal(sheet.number,'A2/083');
  assert.equal(sheet.name,'Q1 Siemens 3RV2011-0FA10 end-of-life GWP reference');
  assert.ok(text.includes('−0.116 kg CO₂ equivalent'));
  assert.ok(text.includes('after end of life'));
  assert.ok(text.includes('not a measured project removal or emissions credit'));
  assert.ok(text.includes('does not establish end-of-life handling, recycling, or environmental performance for the assembled equipment'));
  assert.ok(text.includes('https://support.industry.siemens.com/teddatasheet/?caller=SIOS&format=pdf&language=en&mlfbs=3RV2011-0FA10'));
  assert.ok(project.objects.find(object=>object.id==='dol-ref-002-line-05')?.text.includes('100 authored sheets. The drawing set meets its 100-sheet target.'));
  assert.ok(project.objects.find(object=>object.id==='dol-ref-004-line-31')?.text.includes('A2/083 | Q1 end-of-life GWP'));
  assert.ok(project.objects.find(object=>object.id==='dol-ref-006-line-40')?.text.includes('A2/083 Q1 end-of-life GWP'));
});

test('A2/084 records Siemens Q1 power-loss values without implying a thermal assessment',()=>{
  const project=JSON.parse(fs.readFileSync(path.join(__dirname,'examples','real-projects','siemens-schneider-sew-dol-reference.adigun.json'),'utf8'));
  const sheet=project.sheets.find(item=>item.id==='dol-reference-084');
  const text=project.objects.filter(object=>object.kind==='text'&&object.sheetId==='dol-reference-084').map(object=>object.text).join(' ');
  assert.equal(project.revision, 'A2/099');
  assert.equal(project.sheets.length, 100);
  assert.equal(sheet.number,'A2/084');
  assert.equal(sheet.name,'Q1 Siemens 3RV2011-0FA10 power-loss reference');
  assert.ok(text.includes('5.5 W power loss at AC in the hot operating state'));
  assert.ok(text.includes('1.8 W power loss per pole'));
  assert.ok(text.includes('not a measured project loss or thermal result'));
  assert.ok(text.includes('enclosure temperature rise, ventilation, and thermal assessment are not specified or modeled'));
  assert.ok(text.includes('https://support.industry.siemens.com/teddatasheet/?caller=SIOS&format=pdf&language=en&mlfbs=3RV2011-0FA10'));
  assert.ok(project.objects.find(object=>object.id==='dol-ref-002-line-05')?.text.includes('100 authored sheets. The drawing set meets its 100-sheet target.'));
  assert.ok(project.objects.find(object=>object.id==='dol-ref-004-line-31')?.text.includes('A2/084 | Q1 power loss'));
  assert.ok(project.objects.find(object=>object.id==='dol-ref-006-line-40')?.text.includes('A2/084 Q1 power loss'));
});

test('A2/085 records SEW M1 starting-current ratio without implying installed current',()=>{
  const project=JSON.parse(fs.readFileSync(path.join(__dirname,'examples','real-projects','siemens-schneider-sew-dol-reference.adigun.json'),'utf8'));
  const sheet=project.sheets.find(item=>item.id==='dol-reference-085');
  const text=project.objects.filter(object=>object.kind==='text'&&object.sheetId==='dol-reference-085').map(object=>object.text).join(' ');
  assert.equal(project.revision, 'A2/099');
  assert.equal(project.sheets.length, 100);
  assert.equal(sheet.number,'A2/085');
  assert.equal(sheet.name,'M1 SEW DRN63MS4 starting-current-ratio reference');
  assert.ok(text.includes('400 V, 50 Hz, four-pole motor table'));
  assert.ok(text.includes('I_A/I_N as 3.6'));
  assert.ok(text.includes('not a measured starting current for the installed motor'));
  assert.ok(text.includes('No project starting current, acceleration response, or protection coordination is calculated'));
  assert.ok(text.includes('https://download.sew-eurodrive.com/download/pdf/30590116.pdf'));
  assert.ok(project.objects.find(object=>object.id==='dol-ref-002-line-05')?.text.includes('100 authored sheets. The drawing set meets its 100-sheet target.'));
  assert.ok(project.objects.find(object=>object.id==='dol-ref-004-line-31')?.text.includes('A2/085 | M1 starting-current ratio'));
  assert.ok(project.objects.find(object=>object.id==='dol-ref-006-line-40')?.text.includes('A2/085 M1 starting-current ratio'));
});

test('A2/086 records SEW M1 normalized torque ratios with project scope limits',()=>{
  const project=JSON.parse(fs.readFileSync(path.join(__dirname,'examples','real-projects','siemens-schneider-sew-dol-reference.adigun.json'),'utf8'));
  const sheet=project.sheets.find(item=>item.id==='dol-reference-086');
  const text=project.objects.filter(object=>object.kind==='text'&&object.sheetId==='dol-reference-086').map(object=>object.text).join(' ');
  assert.equal(project.revision, 'A2/099');
  assert.equal(project.sheets.length, 100);
  assert.equal(sheet.number,'A2/086');
  assert.equal(sheet.name,'M1 SEW DRN63MS4 torque-ratio reference');
  assert.ok(text.includes('400 V, 50 Hz, four-pole, duty type S1'));
  assert.ok(text.includes('M_A/M_N = 2.7, M_H/M_N = 2.6, and M_K/M_N = 2.7'));
  assert.ok(text.includes('not project torque outputs or verified motor-load matching'));
  assert.ok(text.includes('https://download.sew-eurodrive.com/download/pdf/30590116.pdf'));
  assert.ok(project.objects.find(object=>object.id==='dol-ref-002-line-05')?.text.includes('100 authored sheets. The drawing set meets its 100-sheet target.'));
  assert.ok(project.objects.find(object=>object.id==='dol-ref-004-line-31')?.text.includes('A2/086 | M1 torque ratios'));
  assert.ok(project.objects.find(object=>object.id==='dol-ref-006-line-40')?.text.includes('A2/086 M1 torque ratios'));
});

test('A2/087 derives a catalog starting-current reference with traceable inputs',()=>{
  const project=JSON.parse(fs.readFileSync(path.join(__dirname,'examples','real-projects','siemens-schneider-sew-dol-reference.adigun.json'),'utf8'));
  const sheet=project.sheets.find(item=>item.id==='dol-reference-087');
  const text=project.objects.filter(object=>object.kind==='text'&&object.sheetId==='dol-reference-087').map(object=>object.text).join(' ');
  assert.equal(project.revision, 'A2/099');
  assert.equal(project.sheets.length, 100);
  assert.equal(sheet.number,'A2/087');
  assert.equal(sheet.name,'M1 catalog-derived starting-current reference');
  assert.ok(text.includes('I_N = 0.405 A and starting-current ratio I_A/I_N = 3.6'));
  assert.ok(text.includes('0.405 A × 3.6 = 1.458 A'));
  assert.ok(text.includes('not a measured or verified current in the project installation'));
  assert.ok(text.includes('30590116.pdf')&&text.includes('23510455.pdf'));
  assert.ok(project.objects.find(object=>object.id==='dol-ref-002-line-05')?.text.includes('100 authored sheets. The drawing set meets its 100-sheet target.'));
  assert.ok(project.objects.find(object=>object.id==='dol-ref-004-line-31')?.text.includes('A2/087 | M1 derived starting current'));
  assert.ok(project.objects.find(object=>object.id==='dol-ref-006-line-40')?.text.includes('A2/087 M1 derived starting current'));
});

test('A2/088 derives M1 torque values from SEW catalog values',()=>{
  const project=JSON.parse(fs.readFileSync(path.join(__dirname,'examples','real-projects','siemens-schneider-sew-dol-reference.adigun.json'),'utf8'));
  const sheet=project.sheets.find(item=>item.id==='dol-reference-088');
  const text=project.objects.filter(object=>object.kind==='text'&&object.sheetId==='dol-reference-088').map(object=>object.text).join(' ');
  assert.equal(project.revision, 'A2/099');
  assert.equal(project.sheets.length, 100);
  assert.equal(sheet.number,'A2/088');
  assert.equal(sheet.name,'M1 catalog-derived torque reference');
  assert.ok(text.includes('M_N = 0.83 Nm'));
  assert.ok(text.includes('M_A = 0.83 × 2.7 = 2.241 Nm'));
  assert.ok(text.includes('M_H = 0.83 × 2.6 = 2.158 Nm'));
  assert.ok(text.includes('M_K = 0.83 × 2.7 = 2.241 Nm'));
  assert.ok(text.includes('not measured project torque or verified load-matching results'));
  assert.ok(text.includes('30590116.pdf')&&text.includes('23510455.pdf'));
  assert.ok(project.objects.find(object=>object.id==='dol-ref-002-line-05')?.text.includes('100 authored sheets. The drawing set meets its 100-sheet target.'));
  assert.ok(project.objects.find(object=>object.id==='dol-ref-004-line-31')?.text.includes('A2/088 | M1 derived torques'));
  assert.ok(project.objects.find(object=>object.id==='dol-ref-006-line-40')?.text.includes('A2/088 M1 derived torques'));
});

test('A2/089 records SEW M1 mass and motor inertia for matching catalog conditions',()=>{
  const project=JSON.parse(fs.readFileSync(path.join(__dirname,'examples','real-projects','siemens-schneider-sew-dol-reference.adigun.json'),'utf8'));
  const sheet=project.sheets.find(item=>item.id==='dol-reference-089');
  const text=project.objects.filter(object=>object.kind==='text'&&object.sheetId==='dol-reference-089').map(object=>object.text).join(' ');
  assert.equal(project.revision, 'A2/099');
  assert.equal(project.sheets.length, 100);
  assert.equal(sheet.number,'A2/089');
  assert.equal(sheet.name,'M1 SEW DRN63MS4 mass and inertia reference');
  assert.ok(text.includes('400 V, 50 Hz, four-pole, duty type S1'));
  assert.ok(text.includes('m_Mot = 4.9 kg'));
  assert.ok(text.includes('J_Mot = 2.95 × 10⁻⁴ kg·m²'));
  assert.ok(text.includes('do not include the driven load, coupling, or other installed parts'));
  assert.ok(text.includes('Total shaft inertia, acceleration time, and dynamic project behavior are not calculated'));
  assert.ok(text.includes('https://download.sew-eurodrive.com/download/pdf/30590116.pdf'));
  assert.ok(project.objects.find(object=>object.id==='dol-ref-002-line-05')?.text.includes('100 authored sheets. The drawing set meets its 100-sheet target.'));
  assert.ok(project.objects.find(object=>object.id==='dol-ref-004-line-31')?.text.includes('A2/089 | M1 mass and inertia'));
  assert.ok(project.objects.find(object=>object.id==='dol-ref-006-line-40')?.text.includes('A2/089 M1 mass and inertia'));
});

test('A2/090 derives M1 rotor kinetic energy at SEW catalog rated speed',()=>{
  const project=JSON.parse(fs.readFileSync(path.join(__dirname,'examples','real-projects','siemens-schneider-sew-dol-reference.adigun.json'),'utf8'));
  const sheet=project.sheets.find(item=>item.id==='dol-reference-090');
  const text=project.objects.filter(object=>object.kind==='text'&&object.sheetId==='dol-reference-090').map(object=>object.text).join(' ');
  assert.equal(project.revision, 'A2/099');
  assert.equal(project.sheets.length, 100);
  assert.equal(sheet.number,'A2/090');
  assert.equal(sheet.name,'M1 catalog-derived rotor kinetic-energy reference');
  assert.ok(text.includes('n_N = 1380 rpm'));
  assert.ok(text.includes('J_Mot = 2.95 × 10⁻⁴ kg·m²'));
  assert.ok(text.includes('ω = 2π × 1380/60 = 144.51 rad/s'));
  assert.ok(text.includes('E = ½Jω² ≈ 3.08 J'));
  assert.ok(text.includes('excludes the driven load'));
  assert.ok(text.includes('https://download.sew-eurodrive.com/download/pdf/30590116.pdf'));
  assert.ok(project.objects.find(object=>object.id==='dol-ref-002-line-05')?.text.includes('100 authored sheets. The drawing set meets its 100-sheet target.'));
  assert.ok(project.objects.find(object=>object.id==='dol-ref-004-line-31')?.text.includes('A2/090 | M1 rotor-energy derivation'));
  assert.ok(project.objects.find(object=>object.id==='dol-ref-006-line-40')?.text.includes('A2/090 M1 rotor energy'));
});

test('A2/091 cross-checks SEW M1 rated output from catalog torque and speed',()=>{
  const project=JSON.parse(fs.readFileSync(path.join(__dirname,'examples','real-projects','siemens-schneider-sew-dol-reference.adigun.json'),'utf8'));
  const sheet=project.sheets.find(item=>item.id==='dol-reference-091');
  const text=project.objects.filter(object=>object.kind==='text'&&object.sheetId==='dol-reference-091').map(object=>object.text).join(' ');
  assert.equal(project.revision,'A2/099');
  assert.equal(project.sheets.length,100);
  assert.equal(sheet.number,'A2/091');
  assert.equal(sheet.name,'M1 rated-output arithmetic cross-check');
  assert.ok(text.includes('M_N = 0.83 Nm')&&text.includes('n_N = 1380 rpm')&&text.includes('P_N = 0.12 kW'));
  assert.ok(text.includes('0.83 × 144.51 ≈ 119.95 W ≈ 0.120 kW'));
  assert.ok(text.includes('within rounding'));
  assert.ok(text.includes('not an independent motor test or project delivered-power measurement'));
  assert.ok(text.includes('https://download.sew-eurodrive.com/download/pdf/30590116.pdf'));
  assert.ok(project.objects.find(object=>object.id==='dol-ref-002-line-05')?.text.includes('100 authored sheets. The drawing set meets its 100-sheet target.'));
  assert.ok(project.objects.find(object=>object.id==='dol-ref-004-line-31')?.text.includes('A2/091 | M1 output arithmetic cross-check'));
  assert.ok(project.objects.find(object=>object.id==='dol-ref-006-line-40')?.text.includes('A2/091 M1 rated output check'));
});

test('A2/092 records the SEW M1 230/400 V winding rating and 400 V star connection',()=>{
  const project=JSON.parse(fs.readFileSync(path.join(__dirname,'examples','real-projects','siemens-schneider-sew-dol-reference.adigun.json'),'utf8'));
  const sheet=project.sheets.find(item=>item.id==='dol-reference-092');
  const text=project.objects.filter(object=>object.kind==='text'&&object.sheetId==='dol-reference-092').map(object=>object.text).join(' ');
  assert.equal(project.revision,'A2/099');
  assert.equal(project.sheets.length, 100);
  assert.equal(sheet.number,'A2/092');
  assert.equal(sheet.name,'M1 230/400 V winding-voltage and star-connection reference');
  assert.ok(text.includes('230 V Δ / 400 V Y, 50 Hz'));
  assert.ok(text.includes('connected in star (Y)'));
  assert.ok(text.includes('400/√3 ≈ 231 V'));
  assert.ok(text.includes('actual nameplate, supply, terminal links, and installation are unverified'));
  assert.ok(text.includes('No internal winding links, six-terminal arrangement, or external wiring change is modeled'));
  assert.ok(text.includes('30590116.pdf'));
  assert.ok(project.objects.find(object=>object.id==='dol-ref-002-line-05')?.text.includes('100 authored sheets. The drawing set meets its 100-sheet target.'));
  assert.ok(project.objects.find(object=>object.id==='dol-ref-004-line-31')?.text.includes('A2/092 | M1 winding voltage and connection'));
});

test('A2/093 records SEW M1 catalog efficiency at 50%, 75%, and 100% load',()=>{
  const project=JSON.parse(fs.readFileSync(path.join(__dirname,'examples','real-projects','siemens-schneider-sew-dol-reference.adigun.json'),'utf8'));
  const sheet=project.sheets.find(item=>item.id==='dol-reference-093');
  const text=project.objects.filter(object=>object.kind==='text'&&object.sheetId==='dol-reference-093').map(object=>object.text).join(' ');
  assert.equal(project.revision,'A2/099');
  assert.equal(project.sheets.length, 100);
  assert.equal(sheet.number,'A2/093');
  assert.equal(sheet.name,'M1 SEW catalog efficiency at three load points');
  assert.ok(text.includes('58.3% at 50% load, 63.9% at 75% load, and 64.8% at 100% load'));
  assert.ok(text.includes('400 V, 50 Hz, four-pole DRN63MS4, duty type S1'));
  assert.ok(text.includes('not measured project efficiencies'));
  assert.ok(text.includes('no interpolation, operating profile, energy use, or annual savings is calculated'));
  assert.ok(text.includes('30590116.pdf'));
  assert.ok(project.objects.find(object=>object.id==='dol-ref-002-line-05')?.text.includes('100 authored sheets. The drawing set meets its 100-sheet target.'));
  assert.ok(project.objects.find(object=>object.id==='dol-ref-004-line-31')?.text.includes('A2/093 | M1 load-point efficiency'));
});

test('A2/094 records SEW rated ambient and installation-altitude basis',()=>{
  const project=JSON.parse(fs.readFileSync(path.join(__dirname,'examples','real-projects','siemens-schneider-sew-dol-reference.adigun.json'),'utf8'));
  const sheet=project.sheets.find(item=>item.id==='dol-reference-094');
  const text=project.objects.filter(object=>object.kind==='text'&&object.sheetId==='dol-reference-094').map(object=>object.text).join(' ');
  assert.equal(project.revision,'A2/099');
  assert.equal(project.sheets.length, 100);
  assert.equal(sheet.number,'A2/094');
  assert.equal(sheet.name,'M1 rated ambient-temperature and installation-altitude basis');
  assert.ok(text.includes('ambient temperature up to 40 °C and installation altitude up to 1000 m'));
  assert.ok(text.includes('not verified conditions at the project site'));
  assert.ok(text.includes('P_N,red = P_N × f_T × f_H'));
  assert.ok(text.includes('no project factor, derated motor output, or suitability is calculated'));
  assert.ok(text.includes('30590116.pdf'));
  assert.ok(project.objects.find(object=>object.id==='dol-ref-002-line-05')?.text.includes('100 authored sheets. The drawing set meets its 100-sheet target.'));
  assert.ok(project.objects.find(object=>object.id==='dol-ref-004-line-31')?.text.includes('A2/094 | rated ambient and altitude basis'));
});

test('A2/096 records SEW motor temperature-sensor options without assigning installed hardware',()=>{
  const project=JSON.parse(fs.readFileSync(path.join(__dirname,'examples','real-projects','siemens-schneider-sew-dol-reference.adigun.json'),'utf8'));
  const sheet=project.sheets.find(item=>item.id==='dol-reference-096');
  const text=project.objects.filter(object=>object.kind==='text'&&object.sheetId==='dol-reference-096').map(object=>object.text).join(' ');
  assert.equal(project.revision,'A2/099');
  assert.equal(project.sheets.length,100);
  assert.equal(sheet.number,'A2/096');
  assert.equal(sheet.projectSectionId,'A2');
  assert.ok(text.includes('/TF — PTC thermistor or PTC resistor; motor sizes 56–315.'));
  assert.ok(text.includes('/TH — Thermostat with bimetallic switch; motor sizes 56–315.'));
  assert.ok(text.includes('/PK — Pt1000 sensor; motor sizes 63–315.'));
  assert.ok(text.includes('/PT — Pt100 sensor; motor sizes 63–315.'));
  assert.ok(text.includes('catalog does not identify an option fitted to this M1'));
  assert.ok(text.includes('section 3.2.2, p. 66'));
  assert.ok(project.objects.find(object=>object.id==='dol-ref-002-line-05')?.text.includes('100 authored sheets. The drawing set meets its 100-sheet target.'));
  assert.ok(project.objects.find(object=>object.id==='dol-ref-004-line-31')?.text.includes('A2/096 | M1 temperature-sensor options'));
});

test('ETI CS cam switches preserve pole isolation and selector continuity after reopening', () => {
  const items = engine.catalog().filter(item => /^eti-004773/.test(item.id));
  assert.equal(items.length, 93);
  const partId = 'eti-004773079';
  const part = engine.component(partId);
  assert.equal(part.specifications.lockableOff.value, true);
  assert.equal(part.physicalRepresentations[0].depth, 182.8);
  assert.deepEqual(part.electricalFunctions.switchingSequence, [[], [
    ['terminal-1', 'terminal-2'], ['terminal-3', 'terminal-4'],
    ['terminal-5', 'terminal-6'], ['terminal-7', 'terminal-8']
  ]]);

  const sheetId = 'cam-check';
  const instance = { ...engine.createInstance(partId, 100, 100, 'S1'), sheetId };
  const pin = engine.worldPins(instance).find(item => item.id === 'terminal-1');
  const lead = { id: 'cam-lead', kind: 'wire', sheetId, x: pin.x, y: pin.y,
    x1: pin.x, y1: pin.y, x2: pin.x, y2: pin.y - 20,
    pinAttachments: { start: { instanceId: instance.id, pinId: pin.id }, end: null } };
  const connected = (drawing) => engine.analyze([drawing, lead]).nets
    .find(net => net.pins.some(terminal => terminal.pinId === pin.id)).pins
    .map(terminal => terminal.pinId).sort();

  assert.deepEqual(connected(instance), ['terminal-1']);
  const offGeometry = engine.camSwitchGeometry(instance);
  instance.properties.switchingStep = '2';
  assert.deepEqual(connected(instance), ['terminal-1', 'terminal-2']);
  assert.notDeepEqual(engine.camSwitchGeometry(instance), offGeometry);
  const saved = engine.serializeProject({ project: 'Cam switch', sheets: [{ id: sheetId, name: 'Wiring' }], objects: [instance] });
  const reopened = engine.parseProject(saved);
  assert.equal(reopened.valid, true);
  const restored = reopened.project.objects[0];
  assert.equal(restored.properties.switchingStep, '2');
  assert.deepEqual(connected(restored), ['terminal-1', 'terminal-2']);
});

test('ETI CS three-position selectors retain common links and alternate throws', () => {
  const partId = 'eti-004773049';
  const part = engine.component(partId);
  assert.deepEqual(part.symbol.internalConnections, [
    ['terminal-2', 'terminal-3'], ['terminal-6', 'terminal-7'], ['terminal-10', 'terminal-11']
  ]);
  assert.equal(engine.component('eti-004773120').specifications.selectorPositions.value, '1–0–2');
  assert.equal(part.specifications.selectorPositions.value, '0–1–2');

  const instance = engine.createInstance(partId, 100, 100, 'S1');
  const pin = engine.worldPins(instance).find(item => item.id === 'terminal-2');
  const wire = { id: 'selector-lead', kind: 'wire', x: pin.x, y: pin.y,
    x1: pin.x, y1: pin.y, x2: pin.x, y2: pin.y + 15,
    pinAttachments: { start: { instanceId: instance.id, pinId: pin.id }, end: null } };
  const connected = () => engine.analyze([instance, wire]).nets
    .find(net => net.pins.some(terminal => terminal.pinId === pin.id)).pins
    .map(terminal => terminal.pinId).sort();

  assert.deepEqual(connected(), ['terminal-2', 'terminal-3']);
  instance.properties.switchingStep = '2';
  assert.deepEqual(connected(), ['terminal-1', 'terminal-2', 'terminal-3']);
  instance.properties.switchingStep = '3';
  assert.deepEqual(connected(), ['terminal-2', 'terminal-3', 'terminal-4']);
});
