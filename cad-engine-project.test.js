'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
require('./cad-engine.js');

const engine = globalThis.AdigunCADEngine;

test('workspace boot always starts with no active project, drawing tab, or automatic example', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const inline = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].find(match => !/\bsrc\s*=/.test(match[1]))[2];
  assert.match(inline, /state\.projectModel=null;state\.projectName='';state\.sheet=null;/);
  assert.match(inline, /projectTree'\)\.replaceChildren\(emptyProject\)/);
  assert.match(inline, /sheetTabs \.document-tab\[data-sheet\].*?tab\.remove\(\)/);
  assert.match(inline, /\$\$\('#sheetTabs \.document-tab\[data-sheet\]'\)\.forEach/);
  assert.match(inline, /\$\('#newSheet'\)\.hidden=true/);
  assert.match(inline, /window\.addEventListener\('beforeunload'/);
  assert.doesNotMatch(inline.slice(inline.lastIndexOf('state.projectModel=null;')), /copyExampleProject\(/);
});

test('new project has empty A1–A4 sections and supports uncapped continuous numbering and paper formats', () => {
  const project = engine.createProjectModel('project-test-1', 'Motor control reference');
  assert.equal(project.name, 'Motor control reference');
  assert.equal(project.sheets.length, 0);
  assert.deepEqual(project.sections.map(section => section.id), ['A1', 'A2', 'A3', 'A4']);
  assert.equal(project.activeSheetId, null);
  assert.deepEqual(project.openTabs, []);

  const power = engine.addProjectSheet(project, 'A2', '', 'sheet-power');
  assert.deepEqual([power.paperSize, power.orientation, power.paperWidthMm, power.paperHeightMm], ['A3', 'landscape', 420, 297]);
  assert.deepEqual(engine.setProjectSheetPaperFormat(power, 'A4', 'portrait'), { width: 210, height: 297 });
  assert.deepEqual([power.paperSize, power.orientation], ['A4', 'portrait']);
  engine.setProjectSheetPaperFormat(power, 'A3', 'landscape');

  const overview = engine.addProjectSheet(project, 'A1', '', 'sheet-overview');
  assert.equal(overview.number, 'A1/0001');
  assert.equal(power.number, 'A2/0002');
  assert.equal(power.customName, false);
  engine.renameProjectSheet(project, power.id, 'Power');
  assert.equal(power.customName, true);

  const a5 = engine.addProjectSection(project, 'Field wiring', 'External equipment and installation wiring.');
  assert.equal(a5.id, 'A5');
  const field = engine.addProjectSheet(project, 'A5', '', 'sheet-field');
  assert.equal(field.number, 'A5/0003');
  for (let index = 0; index < 205; index += 1) engine.addProjectSheet(project, 'A4', 'Record ' + (index + 1), 'sheet-record-' + index);
  assert.equal(project.sheets.length, 208);
  assert.equal(project.sheets[0].id, overview.id);
  assert.equal(project.sheets.find(sheet => sheet.id === 'sheet-record-204').order, 207);
  assert.equal(project.sheets.at(-1).id, field.id);
});

test('sheets can be renamed, moved, reordered, and deleted without changing link targets', () => {
  const project = engine.createProjectModel('project-edit-1', 'Pump station controls');
  const overview = engine.addProjectSheet(project, 'A1', 'Overview', 'sheet-overview-edit');
  const power = engine.addProjectSheet(project, 'A2', 'Sheet', 'sheet-power-edit');
  const layout = engine.addProjectSheet(project, 'A3', 'Panel layout', 'sheet-layout-edit');
  power.devices.push({ id: 'device-k1' });
  project.openTabs = [power.id, layout.id];
  project.activeSheetId = power.id;
  project.crossSheetConnections = [{ id: 'link-1', endpoints: [{ sheetId: power.id }, { sheetId: layout.id }] }];

  engine.renameProjectSheet(project, power.id, 'Power');
  engine.renameProjectSection(project, 'A3', 'Installation layout');
  engine.moveProjectSheet(project, power.id, 'A4', 0);
  assert.equal(power.id, 'sheet-power-edit');
  assert.equal(power.name, 'Power');
  assert.deepEqual(power.devices, [{ id: 'device-k1' }]);
  assert.equal(project.sections.find(section => section.id === 'A3').name, 'Installation layout');
  assert.deepEqual([overview.number, layout.number, power.number], ['A1/0001', 'A3/0002', 'A4/0003']);
  assert.deepEqual(project.openTabs, [power.id, layout.id]);
  assert.equal(project.crossSheetConnections[0].endpoints[0].sheetId, power.id);

  engine.deleteProjectSheet(project, layout.id);
  assert.equal(project.sheets.some(sheet => sheet.id === layout.id), false);
  assert.equal(project.openTabs.includes(layout.id), false);
  assert.equal(project.activeSheetId, power.id);
  assert.equal(project.crossSheetConnections[0].endpoints[1].sheetId, layout.id);
  assert.equal(project.diagnostics[0].type, 'unresolved-cross-sheet-reference');
  assert.equal(project.diagnostics[0].connectionId, 'link-1');
  assert.equal(power.number, 'A4/0002');
});

test('project metadata, open views, sheets, links, and independent example copies survive JSON save/reopen', () => {
  const projectModel = engine.createProjectModel('project-roundtrip-1', 'Local editable copy');
  engine.addProjectSection(projectModel, 'Field wiring', 'External field conductors.');
  const source = engine.addProjectSheet(projectModel, 'A2', 'Power', 'sheet-source');
  const target = engine.addProjectSheet(projectModel, 'A5', 'Field wiring', 'sheet-target');
  projectModel.metadata.manager = 'Project manager';
  projectModel.metadata.customer = 'Example client';
  source.revision = 'B';
  source.description = '24 V DC distribution';
  projectModel.activeSheetId = source.id;
  projectModel.openTabs = [source.id, target.id];
  projectModel.crossSheetConnections = [{ id: 'net-24v-1', name: '+24VDC', endpoints: [
    { sheetId: source.id, wireId: 'wire-source', point: { x: 10, y: 0 } },
    { sheetId: target.id, wireId: 'wire-target', point: { x: 30, y: 0 } }
  ] }];
  const payload = {
    product: 'AdigunAiAutoCad', project: projectModel.name, projectModel,
    activeSheet: projectModel.activeSheetId, sheets: projectModel.sheets,
    objects: [
      { id: 'wire-source', kind: 'wire', sheetId: source.id, x1: 0, y1: 0, x2: 10, y2: 0 },
      { id: 'wire-target', kind: 'wire', sheetId: target.id, x1: 20, y1: 0, x2: 30, y2: 0 }
    ],
    crossSheetConnections: projectModel.crossSheetConnections
  };
  const first = engine.parseProject(engine.serializeProject(payload));
  const second = engine.parseProject(engine.serializeProject(payload));
  assert.equal(first.valid, true);
  assert.equal(second.valid, true);
  assert.equal(first.project.projectModel.metadata.manager, 'Project manager');
  assert.equal(first.project.projectModel.sheets.find(sheet => sheet.id === source.id).revision, 'B');
  assert.equal(first.project.projectModel.sheets.find(sheet => sheet.id === target.id).sectionId, 'A5');
  assert.deepEqual(first.project.projectModel.openTabs, [source.id, target.id]);
  assert.deepEqual(first.project.crossSheetConnections, payload.crossSheetConnections);
  first.project.projectModel.metadata.manager = 'Changed copy';
  assert.equal(second.project.projectModel.metadata.manager, 'Project manager');
  const nativeCopy = engine.copyExampleProject(first.project, 'project-roundtrip-copy', 'Named native copy');
  assert.equal(nativeCopy.projectModel.id, 'project-roundtrip-copy');
  assert.equal(nativeCopy.projectModel.name, 'Named native copy');
  assert.ok(nativeCopy.projectModel.sheets.every(sheet => sheet.projectId === 'project-roundtrip-copy'));
  assert.equal(engine.parseProject(engine.serializeProject(nativeCopy)).valid, true);
});


test('legacy drawing content fits the page while edits map back to native coordinates', () => {
  const transform = engine.fitDrawingToPage({ left: 100, top: 50, right: 1100, bottom: 650 }, 420, 297, 10, 60);
  assert.ok(transform.scale > 0);
  assert.ok(transform.x + transform.scale * 100 >= 10 - 1e-9);
  assert.ok(transform.y + transform.scale * 50 >= 10 - 1e-9);
  assert.ok(transform.y + transform.scale * 650 <= 227 + 1e-9);
  const sourcePoint = { x: 480, y: 255 };
  const pagePoint = { x: transform.x + sourcePoint.x * transform.scale, y: transform.y + sourcePoint.y * transform.scale };
  const restored = engine.invertDrawingTransform(pagePoint, transform);
  assert.ok(Math.abs(restored.x - sourcePoint.x) < 1e-9);
  assert.ok(Math.abs(restored.y - sourcePoint.y) < 1e-9);
});

test('every published catalog example opens as an independent sectioned native copy', () => {
  const catalog = JSON.parse(fs.readFileSync(path.join(__dirname, 'examples/real-projects/library.json'), 'utf8'));
  assert.equal(catalog.projects.length, 7);
  for (const entry of catalog.projects) {
    const file = path.join(__dirname, entry.path);
    const parsed = engine.parseProject(fs.readFileSync(file, 'utf8'));
    assert.equal(parsed.valid, true, entry.title + ': ' + parsed.errors.join(' '));
    const sourceSnapshot = JSON.stringify(parsed.project);
    const copy = engine.copyExampleProject(parsed.project, 'catalog-copy-' + entry.id, 'Editable ' + entry.title);
    assert.deepEqual(copy.projectModel.sections.map(section => section.id), ['A1', 'A2', 'A3', 'A4']);
    assert.equal(copy.projectModel.sheets.length, parsed.project.sheets.length);
    assert.ok(copy.projectModel.sheets.every(sheet => sheet.drawingFitToPage));
    assert.ok(copy.projectModel.sheets.some(sheet => sheet.id === parsed.project.sheets[0].id));
    assert.notEqual(copy.objects, parsed.project.objects);
    assert.equal(JSON.stringify(parsed.project), sourceSnapshot);
    assert.equal(engine.parseProject(engine.serializeProject(copy)).valid, true);
  }
});

test('multi-sheet reference examples classify overview, circuits, installation, and reports by section', () => {
  const cases = [
    { file: 'siemens-schneider-sew-dol-reference.adigun.json', counts: { A1: 6, A2: 14, A3: 5, A4: 70 }, sections: { 'dol-reference-001': 'A2', 'dol-reference-002': 'A1', 'dol-reference-021': 'A3', 'dol-reference-panel-layout': 'A3', 'dol-reference-024': 'A4' } },
    { file: 'siemens-sew-star-delta-reference.adigun.json', counts: { A1: 5, A2: 19, A3: 4, A4: 72 }, sections: { 'ref-001': 'A1', 'ref-006': 'A2', 'ref-040': 'A3', 'ref-025': 'A4' } }
  ];
  for (const [index, item] of cases.entries()) {
    const file = path.join(__dirname, 'examples/real-projects', item.file);
    const parsed = engine.parseProject(fs.readFileSync(file, 'utf8'));
    assert.equal(parsed.valid, true, item.file + ': ' + parsed.errors.join(' '));
    const snapshot = JSON.stringify(parsed.project);
    const copy = engine.copyExampleProject(parsed.project, 'sectioned-reference-' + index, 'Editable sectioned reference');
    const counts = Object.fromEntries(['A1', 'A2', 'A3', 'A4'].map(section => [section, copy.projectModel.sheets.filter(sheet => sheet.sectionId === section).length]));
    assert.deepEqual(counts, item.counts, item.file);
    for (const [sheetId, sectionId] of Object.entries(item.sections)) {
      assert.equal(copy.projectModel.sheets.find(sheet => sheet.id === sheetId)?.sectionId, sectionId, item.file + ' ' + sheetId);
    }
    assert.equal(copy.projectModel.sheets.length, parsed.project.sheets.length);
    if (item.file.startsWith('siemens-schneider-sew-dol-reference')) {
      const layoutSheet = parsed.project.sheets.find(sheet => sheet.id === 'dol-reference-panel-layout');
      assert.equal(layoutSheet.projectSectionId, 'A3');
      const layoutObjects = parsed.project.objects.filter(object => object.sheetId === layoutSheet.id);
      assert.ok(layoutObjects.some(object => object.id === 'dol-layout-enclosure' && object.kind === 'rect' && object.projectAssumption === true));
      assert.ok(layoutObjects.some(object => object.deviceTag === 'Q1' && object.manufacturerPartNumber === '3RV2011-0FA10'));
      assert.ok(layoutObjects.some(object => object.deviceTag === 'KM1' && object.manufacturerPartNumber === 'LC1D09BD'));
      assert.equal(layoutObjects.filter(object => object.kind === 'rect' && object.deviceTag && object.deviceTag.startsWith('X')).length, 6);
      assert.ok(layoutObjects.every(object => !object.locked));
      assert.match(layoutObjects.find(object => object.id === 'dol-layout-note-limitations').text, /not.*construction-ready/i);
      const sourceLayoutSnapshot = layoutObjects.find(object => object.id === 'dol-layout-q1-footprint');
      const editableCopyFootprint = copy.objects.find(object => object.id === sourceLayoutSnapshot.id);
      editableCopyFootprint.x += 14;
      editableCopyFootprint.stroke = '#dc2626';
      const reopened = engine.parseProject(engine.serializeProject(copy));
      assert.equal(reopened.valid, true, reopened.errors.join(' '));
      const reopenedFootprint = reopened.project.objects.find(object => object.id === editableCopyFootprint.id);
      assert.equal(reopenedFootprint.x, sourceLayoutSnapshot.x + 14);
      assert.equal(reopenedFootprint.stroke, '#dc2626');
      assert.equal(sourceLayoutSnapshot.x, 245, 'editing a copied layout must leave the library template unchanged');
    }
    assert.equal(engine.analyzeProject(copy).componentCount, engine.analyzeProject(parsed.project).componentCount);
    assert.equal(engine.analyzeProject(copy).wireCount, engine.analyzeProject(parsed.project).wireCount);
    assert.equal(engine.parseProject(engine.serializeProject(copy)).valid, true);
    assert.equal(JSON.stringify(parsed.project), snapshot, 'copying must leave the source library example unchanged');
  }
});

test('source-backed examples open as isolated native projects and retain editable engineering data through save and reopen', () => {
  const file = path.join(__dirname, 'examples/real-projects/siemens-sew-star-delta-reference.adigun.json');
  const sourceResult = engine.parseProject(fs.readFileSync(file, 'utf8'));
  assert.equal(sourceResult.valid, true, sourceResult.errors.join(' '));
  const source = sourceResult.project;
  const sourceSnapshot = JSON.stringify(source);
  const firstCopy = engine.copyExampleProject(source, 'example-copy-one', 'Editable star-delta design');
  const secondCopy = engine.copyExampleProject(source, 'example-copy-two', 'Independent star-delta design');

  assert.ok(firstCopy.projectModel);
  assert.deepEqual(firstCopy.projectModel.sections.map(section => section.id), ['A1', 'A2', 'A3', 'A4']);
  assert.equal(firstCopy.projectModel.sheets[0].id, 'ref-001');
  assert.equal(firstCopy.projectModel.sheets[0].drawingFitToPage, true);
  assert.deepEqual(firstCopy.sheetViews['ref-006'], { x: 0, y: 0, w: 420, h: 297 });
  assert.equal(firstCopy.id, 'example-copy-one');
  assert.equal(firstCopy.project, 'Editable star-delta design');
  assert.notEqual(firstCopy.id, secondCopy.id);
  assert.equal(firstCopy.sheets.length, 100);
  assert.notEqual(firstCopy.sheets, secondCopy.sheets);
  assert.notEqual(firstCopy.objects, secondCopy.objects);
  assert.equal(firstCopy.objects.filter(object => object.kind === 'component-instance').length, 32);
  assert.equal(firstCopy.objects.filter(object => object.kind === 'wire').length, 335);
  assert.ok(firstCopy.crossSheetConnections.length > 0);

  const q1 = firstCopy.objects.find(object => object.kind === 'component-instance' && object.ref === 'Q1');
  assert.ok(q1);
  q1.ref = 'Q1_EDIT';
  q1.properties.overloadSettingA = 12;
  q1.stroke = '#22d3ee';
  const motor = firstCopy.objects.find(object => object.kind === 'component-instance' && object.ref === 'M1');
  motor.properties.marking = 'Owner instance note';
  const changedWire = firstCopy.objects.find(object => object.kind === 'wire' && object.sheetId === 'ref-009');
  assert.ok(changedWire);
  const wireStart = { x: changedWire.x1, y: changedWire.y1 };
  changedWire.x2 += 2.5;
  const link = firstCopy.crossSheetConnections.find(connection => connection.endpoints.some(endpoint => endpoint.wireId === changedWire.id));
  assert.ok(link);
  const endpoint = link.endpoints.find(item => item.wireId === changedWire.id);
  if (endpoint.point.x === wireStart.x && endpoint.point.y === wireStart.y) endpoint.point.x = changedWire.x1;
  else endpoint.point.x = changedWire.x2;
  const addedLabel = { id: 'owner-copy-label', kind: 'text', sheetId: 'ref-009', x: 300, y: 700, text: 'Owner field connection', stroke: '#be123c' };
  firstCopy.objects.push(addedLabel);
  const topologyAfterEdit = engine.analyzeProject(firstCopy);
  assert.equal(topologyAfterEdit.valid, true, topologyAfterEdit.errors.join(' '));

  const saved = engine.serializeProject(firstCopy);
  const reopened = engine.parseProject(saved);
  assert.equal(reopened.valid, true, reopened.errors.join(' '));
  const restored = reopened.project;
  assert.equal(restored.project, 'Editable star-delta design');
  assert.ok(restored.projectModel);
  assert.equal(restored.sheets.length, 100);
  assert.equal(restored.objects.find(object => object.id === q1.id).ref, 'Q1_EDIT');
  assert.equal(restored.objects.find(object => object.id === q1.id).properties.overloadSettingA, 12);
  assert.equal(restored.objects.find(object => object.id === q1.id).stroke, '#22d3ee');
  assert.equal(restored.objects.find(object => object.ref === 'M1').properties.marking, 'Owner instance note');
  assert.equal(restored.objects.find(object => object.id === changedWire.id).x2, changedWire.x2);
  assert.deepEqual(restored.crossSheetConnections, firstCopy.crossSheetConnections);
  assert.equal(restored.objects.find(object => object.id === addedLabel.id).text, addedLabel.text);
  assert.equal(engine.analyzeProject(restored).valid, true);
  assert.notEqual(secondCopy.objects.find(object => object.ref === 'Q1').properties.overloadSettingA, 12);
  assert.equal(JSON.stringify(source), sourceSnapshot);
});

test('sectioned project interface wires inline rename, section drag, title block, print/export, and separate close behavior', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  assert.match(html, /\.tree-row>span:not\(\.caret\):not\(\.folder\):not\(\.file\),\.tree-row>b\{min-width:0;overflow:hidden;text-overflow:ellipsis\}/);
  assert.match(html, /\.tree-row \.detail\{margin-left:auto\}/);
  const inline = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].find(match => !/\bsrc\s*=/.test(match[1]))[2];
  assert.match(inline, /function beginInlineSheetRename\(id\)/);
  assert.match(inline, /function applyProjectDrawingTransform\(forceFit\)/);
  assert.match(inline, /fitDrawingToPage\(bounds,page\.width,page\.height,10,60\)/);
  assert.match(inline, /invertDrawingTransform\(\{x:point\.x,y:point\.y\},transform\)/);
  assert.match(inline, /const anchor=svgViewPoint\(e\)/);
  assert.match(inline, /addEventListener\('dblclick'/);
  assert.match(inline, /data-sheet-name/);
  assert.match(inline, /data-section-row/);
  assert.match(inline, /moveProjectSheet\(state\.projectModel/);
  assert.match(inline, /function renderProjectMetadataEditor\(\)/);
  assert.match(inline, /function renderProjectTitleBlock\(\)/);
  assert.match(inline, /setProjectSheetPaperFormat\(sheet,sheet\.paperSize/);
  assert.match(inline, /function printActiveSheet\(\)/);
  assert.match(inline, /exportSheet\.paperWidthMm/);
  assert.match(inline, /function closeSheetTab\(id\)/);
  assert.match(inline, /unresolved connection diagnostic/);
  assert.match(inline, /function renderEditableExampleProjects\(\)/);
  assert.match(inline, /copyExampleProject\(parsed\.project/);
  assert.match(inline, /state\.projectName\|\|'Untitled electrical project'/);
  assert.match(inline, /state\.projectName\|\|'Adigun-AutoCAD-project'/);
  assert.match(inline, /examples\/real-projects\/library\.json/);
  assert.match(html, /Open as copy/);
  assert.match(html, />Hephzibah Behulah<\/text>/);
  assert.match(html, />AdigunAiAutoCad<\/text>/);
});
