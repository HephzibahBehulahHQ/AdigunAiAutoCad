'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
require('./cad-engine.js');

const engine = globalThis.AdigunCADEngine;

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
});

test('sectioned project interface wires inline rename, section drag, title block, print/export, and separate close behavior', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const inline = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].find(match => !/\bsrc\s*=/.test(match[1]))[2];
  assert.match(inline, /function beginInlineSheetRename\(id\)/);
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
  assert.match(html, />Hephzibah Behulah<\/text>/);
  assert.match(html, />AdigunAiAutoCad<\/text>/);
});
