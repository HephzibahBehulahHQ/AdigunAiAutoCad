'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
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

test('Save As uses a local project file picker and subsequent Save writes to that chosen file', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const inline = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].find(match => !/\bsrc\s*=/.test(match[1]))[2];
  assert.match(inline, /\['Save project as…','save-as','Ctrl Shift S'\]/);
  assert.match(inline, /window\.showSaveFilePicker/);
  assert.match(inline, /projectSaveHandle\.createWritable\(\)/);
  assert.match(inline, /if\(e\.ctrlKey&&e\.shiftKey&&e\.key\.toLowerCase\(\)==='s'\)\{e\.preventDefault\(\);saveProjectAs\(\);return;\}/);
  assert.match(inline, /projectSaveHandle=null;const payload=parsed\.project/);
});

test('canvas audit reflects the current local Save As and reopen limits', () => {
  const audit = fs.readFileSync(path.join(__dirname, 'docs/specs/canvas-behavior-implementation-audit.md'), 'utf8');
  assert.match(audit, /Save As uses the browser file picker when available/);
  assert.match(audit, /Save writes to the selected file handle during the current page session/);
  assert.match(audit, /not durable browser-local autosave/);
  assert.match(audit, /CI Chromium verifies clean project creation, section sheet selection, canvas editing, and Save As\/reopen/);
  assert.match(audit, /opens a 100-sheet example as an A1–A4 native copy/);
  assert.match(audit, /source isolation and cross-sheet connections/);
  assert.match(audit, /native file picker is mocked/);
});

test('browser workflow creates, edits, saves, closes, and reopens a native project', {
  skip: process.env.CAD_BROWSER_WORKFLOW !== '1' ? 'Enable the pinned Chromium workflow in CI.' : false
}, async () => {
  const { chromium } = require('playwright');
  const root = path.resolve(__dirname);
  const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml' };
  const server = http.createServer((request, response) => {
    let pathname;
    try { pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname); }
    catch { response.writeHead(400).end(); return; }
    const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
    const file = path.resolve(root, relative);
    if (!file.startsWith(root + path.sep)) { response.writeHead(403).end(); return; }
    fs.readFile(file, (error, data) => {
      if (error) { response.writeHead(404).end(); return; }
      response.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      response.end(data);
    });
  });
  let browser;
  try {
    await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
    browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
    const context = await browser.newContext();
    await context.addInitScript(() => {
      window.__savedProjectWrites = [];
      Object.defineProperty(window, 'showSaveFilePicker', {
        configurable: true,
        value: async options => ({
          name: options.suggestedName,
          createWritable: async () => ({
            write: async value => { window.__savedProjectWrites.push(typeof value === 'string' ? value : await value.text()); },
            close: async () => {}
          })
        })
      });
    });
    const address = 'http://127.0.0.1:' + server.address().port + '/';
    const page = await context.newPage();
    await page.goto(address);
    assert.match(await page.locator('#projectTree').innerText(), /No project open/);
    assert.equal(await page.locator('#sheetTabs .document-tab[data-sheet]').count(), 0);

    await page.getByRole('button', { name: 'New project' }).click();
    await page.locator('#newProjectName').fill('Browser local save test');
    await page.locator('#createProject').click();
    for (const section of ['A1', 'A2', 'A3', 'A4']) {
      assert.equal(await page.locator('#projectTree b').filter({ hasText: new RegExp('^' + section + '$') }).count(), 1);
    }
    assert.equal(await page.locator('#projectTree [data-sheet]').count(), 0);

    await page.getByRole('button', { name: 'Add sheet to A2' }).click();
    const sheetRow = page.locator('#projectTree [data-sheet]').first();
    await sheetRow.waitFor();
    const sheetId = await sheetRow.getAttribute('data-sheet');
    assert.equal(await page.locator('#sheetTabs .document-tab[data-sheet]').count(), 0, 'adding a sheet must not open it');
    await sheetRow.click();
    assert.equal(await page.locator('#sheetTabs .document-tab[data-sheet]').count(), 1, 'selecting a sheet opens its canvas tab');

    await page.locator('[aria-label="Draw rectangle"]').click();
    const canvas = await page.locator('#drawing').boundingBox();
    assert.ok(canvas && canvas.width > 100 && canvas.height > 100);
    await page.mouse.move(canvas.x + canvas.width * 0.30, canvas.y + canvas.height * 0.30);
    await page.mouse.down();
    await page.mouse.move(canvas.x + canvas.width * 0.40, canvas.y + canvas.height * 0.40, { steps: 3 });
    await page.mouse.up();
    assert.ok(await page.locator('#userDrawings > *').count() > 0, 'canvas edit should create native vector geometry');

    await page.locator('[aria-label="Properties"]').click();
    const description = page.getByLabel('Description', { exact: true });
    await description.fill('Saved through local file picker');
    await page.keyboard.press('Control+Shift+S');
    await page.waitForFunction(() => window.__savedProjectWrites.length === 1);
    await description.fill('Updated with repeat Save');
    await page.keyboard.press('Control+S');
    await page.waitForFunction(() => window.__savedProjectWrites.length === 2);
    const savedText = await page.evaluate(() => window.__savedProjectWrites[1]);
    const saved = JSON.parse(savedText);
    assert.equal(saved.projectModel.name, 'Browser local save test');
    assert.equal(saved.projectModel.sheets.find(sheet => sheet.id === sheetId).description, 'Updated with repeat Save');
    assert.ok(saved.objects.length > 0);
    await page.close();

    const reopenedPage = await context.newPage();
    await reopenedPage.goto(address);
    assert.match(await reopenedPage.locator('#projectTree').innerText(), /No project open/);
    await reopenedPage.locator('#openFile').setInputFiles({
      name: 'Browser-local-save-test.adigun.json',
      mimeType: 'application/json',
      buffer: Buffer.from(savedText)
    });
    await reopenedPage.locator('#projectTree [data-sheet]').first().waitFor();
    assert.equal(await reopenedPage.locator('#sheetTabs .document-tab[data-sheet]').count(), 1);
    await reopenedPage.locator('[aria-label="Properties"]').click();
    assert.equal(await reopenedPage.getByLabel('Description', { exact: true }).inputValue(), 'Updated with repeat Save');
    assert.ok(await reopenedPage.locator('#userDrawings > *').count() > 0, 'saved canvas geometry survives reopen');
    await reopenedPage.close({ runBeforeUnload: false });

    const examplePage = await context.newPage();
    await examplePage.goto(address);
    const originalExample = await examplePage.evaluate(async () => fetch('examples/real-projects/siemens-sew-star-delta-reference.adigun.json').then(response => response.text()));
    await examplePage.getByRole('button', { name: 'New project' }).click();
    await examplePage.locator('#newProjectName').fill('Editable star-delta browser copy');
    await examplePage.getByRole('button', { name: 'Open Star-delta 100-sheet reference package as an editable copy' }).click();
    const componentId = 'cmp-6d8a901d-98ae-4054-88e1-06afaea9ffb0';
    await examplePage.locator('#projectTree [data-sheet="ref-006"]').waitFor();
    assert.equal(await examplePage.locator('#projectTree [data-section-row]').count(), 4, 'example copy keeps the A1–A4 section structure');
    await examplePage.locator('#projectTree [data-sheet="ref-006"]').click();
    const component = examplePage.locator('#userDrawings [data-object="' + componentId + '"]');
    await component.waitFor();
    await component.click({ force: true });
    const overload = examplePage.locator('[data-component-property="overloadSettingA"][data-component-object="' + componentId + '"]');
    await overload.fill('4');
    await examplePage.locator('[data-component-property="position"][data-component-object="' + componentId + '"]').fill('F2');
    await examplePage.locator('[data-action="palette"]').click();
    await examplePage.locator('#paletteSwatches [data-color="#ed3f38"]').click();
    await examplePage.keyboard.press('Control+Shift+S');
    await examplePage.waitForFunction(() => window.__savedProjectWrites.length === 1);
    const exampleSavedText = await examplePage.evaluate(() => window.__savedProjectWrites[0]);
    const exampleSaved = JSON.parse(exampleSavedText);
    const editedComponent = exampleSaved.objects.find(object => object.id === componentId);
    assert.equal(exampleSaved.projectModel.name, 'Editable star-delta browser copy');
    assert.equal(editedComponent.properties.overloadSettingA, 4);
    assert.equal(editedComponent.properties.position, 'F2');
    assert.equal(editedComponent.stroke, '#ed3f38');
    assert.ok(exampleSaved.crossSheetConnections.length > 0, 'example electrical relationships remain in the saved copy');
    assert.equal(await examplePage.evaluate(async () => fetch('examples/real-projects/siemens-sew-star-delta-reference.adigun.json').then(response => response.text())), originalExample, 'editing the copy must not change its source example');
    await examplePage.close({ runBeforeUnload: false });

    const reopenedExample = await context.newPage();
    await reopenedExample.goto(address);
    await reopenedExample.locator('#openFile').setInputFiles({
      name: 'Editable-star-delta-browser-copy.adigun.json',
      mimeType: 'application/json',
      buffer: Buffer.from(exampleSavedText)
    });
    await reopenedExample.locator('#projectTree [data-sheet="ref-006"]').waitFor();
    await reopenedExample.locator('#userDrawings [data-object="' + componentId + '"]').click({ force: true });
    assert.equal(await reopenedExample.locator('[data-component-property="overloadSettingA"][data-component-object="' + componentId + '"]').inputValue(), '4');
    assert.equal(await reopenedExample.locator('[data-component-property="position"][data-component-object="' + componentId + '"]').inputValue(), 'F2');
    assert.ok(await reopenedExample.locator('#userDrawings [data-object="' + componentId + '"] [stroke="#ed3f38"]').count() > 0, 'component color survives reopen');
    await reopenedExample.close({ runBeforeUnload: false });
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
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

test('star-delta example opens with a sourced editable A3 layout alongside its A2 wiring sheet', () => {
  const file = path.join(__dirname, 'examples/real-projects/siemens-sew-star-delta-starter.adigun.json');
  const parsed = engine.parseProject(fs.readFileSync(file, 'utf8'));
  assert.equal(parsed.valid, true, parsed.errors.join(' '));
  const source = parsed.project;
  const sourceSnapshot = JSON.stringify(source);
  const copy = engine.copyExampleProject(source, 'star-delta-layout-copy', 'Editable star-delta starter');
  assert.deepEqual(copy.projectModel.sheets.map(sheet => [sheet.id, sheet.sectionId]), [['star-delta', 'A2'], ['star-delta-panel-layout', 'A3']]);
  assert.deepEqual(copy.projectModel.openTabs, ['star-delta']);
  const layout = copy.objects.filter(object => object.sheetId === 'star-delta-panel-layout');
  assert.equal(layout.length, 51);
  assert.equal(layout.filter(object => object.kind === 'rect' && object.deviceTag && /^X[1-6]$/.test(object.deviceTag)).length, 6);
  assert.equal(layout.filter(object => object.kind === 'rect' && ['Q1', 'KM1', 'KM2', 'KM3', 'F1', 'K1'].includes(object.deviceTag)).length, 6);
  assert.ok(layout.every(object => !object.locked));
  assert.match(layout.find(object => object.id === 'star-delta-layout-clearances').text, /not construction-ready/i);
  const before = engine.analyzeProject(copy);
  const footprint = copy.objects.find(object => object.id === 'star-delta-layout-q1-footprint');
  footprint.x += 10;
  footprint.stroke = '#dc2626';
  const reopened = engine.parseProject(engine.serializeProject(copy));
  assert.equal(reopened.valid, true, reopened.errors.join(' '));
  const saved = reopened.project.objects.find(object => object.id === footprint.id);
  assert.equal(saved.x, 160);
  assert.equal(saved.stroke, '#dc2626');
  const after = engine.analyzeProject(reopened.project);
  assert.deepEqual([after.componentCount, after.wireCount, after.netCount], [before.componentCount, before.wireCount, before.netCount]);
  assert.equal(JSON.stringify(source), sourceSnapshot, 'editing the project copy must not change the library source');
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