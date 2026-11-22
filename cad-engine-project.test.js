'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
require('./cad-engine.js');

const engine = globalThis.AdigunCADEngine;
const { electricalStructureHash, summarizeSheetContent } = require('./scripts/project-library-validation.js');

test('library sheet audit finds copied content and hidden-only sheets', () => {
  const note = (sheetId, text, extra) => ({ kind: 'text', id: sheetId + text, sheetId, x: 10, y: 20, text, ...extra });
  const result = summarizeSheetContent({
    sheets: ['original', 'copy', 'distinct', 'hidden'].map(id => ({ id })),
    objects: [note('original', 'Supply sizing'), note('original', 'Terminal map'),
      note('copy', 'Terminal map', { groupId: 'copy-group' }), note('copy', 'Supply sizing'),
      note('distinct', 'Supply sizing'), note('distinct', 'Installation clearances'),
      note('hidden', 'Supply sizing', { hidden: true })]
  });
  assert.equal(result.authoredSheetCount, 3);
  assert.equal(result.contentObjectCount, 6);
  assert.deepEqual(result.emptyContentSheetIds, ['hidden']);
  assert.deepEqual(result.repeatedContentSheets, [{ id: 'copy', matches: 'original' }]);
});

test('library structure fingerprint distinguishes terminal changes from renamed copies', () => {
  const project = { objects: [
    { kind: 'component-instance', componentId: 'relay', sheetId: 'control', ref: 'K1' },
    { kind: 'component-instance', componentId: 'terminal', sheetId: 'field', ref: 'X1' }
  ] };
  const nets = [{ wireIds: ['wire-a'], pins: [
    { sheetId: 'control', ref: 'K1', number: '14' }, { sheetId: 'field', ref: 'X1', number: '1' }
  ] }];
  const renamedProject = { objects: project.objects.map(device => ({ ...device, ref: device.ref + '0', sheetId: 'renamed-' + device.sheetId })).reverse() };
  const routedNets = [{ wireIds: ['new-segment-1', 'new-segment-2'], pins: nets[0].pins
    .map(pin => ({ ...pin, ref: pin.ref + '0', sheetId: 'renamed-' + pin.sheetId })).reverse() }];
  const fingerprint = electricalStructureHash(project, nets);
  assert.equal(electricalStructureHash(renamedProject, routedNets), fingerprint);
  routedNets[0].pins.find(pin => pin.ref === 'K10').number = '12';
  assert.notEqual(electricalStructureHash(renamedProject, routedNets), fingerprint);
});
test('DXF preserves disconnect knife position and symbol transform as geometry', async () => {
  globalThis.DxfParser = require('./vendor/dxf-parser-1.1.2');
  require('./cad-dxf');
  const disconnect = engine.createInstance('phoenix-contact-3210156', 100, 200, 'X1');
  disconnect.rotation = 90;
  disconnect.symbolScale = 2;
  for (const [position, expected] of [['open', 122], ['closed', 100]]) {
    disconnect.properties.knifePosition = position;
    const exported = await globalThis.AdigunDXF.exportDrawing([disconnect]);
    assert.deepEqual(exported.unsupported, []);
    const { project } = globalThis.AdigunDXF.importDrawing(exported.text, 'Disconnect geometry', 'disconnect-dxf');
    const lines = project.objects.filter(object => object.kind === 'line');
    assert.equal(lines.length, 3);
    assert.ok(lines.some(line => Math.abs(line.x1 - 100) < 1e-7 && Math.abs(line.y1 - 176) < 1e-7
      && Math.abs(line.x2 - expected) < 1e-7 && Math.abs(line.y2 - 224) < 1e-7));
    assert.equal(project.objects.filter(object => object.kind === 'circle').length, 4);
  }
});

test('DXF exports editable custom symbol shapes and transformed terminal marks', async () => {
  globalThis.DxfParser = require('./vendor/dxf-parser-1.1.2');
  require('./cad-dxf');
  const symbol = {
    id: 'user-symbol-test', name: 'Test fixture',
    geometry: [
      { kind: 'rect', x: -10, y: -8, x2: 10, y2: 8 },
      { kind: 'line', x: -18, y: 0, x2: -10, y2: 0 },
      { kind: 'circle', x: 0, y: 0, x2: 4, y2: 0 }
    ],
    pins: [{ number: '1', x: -18, y: 0 }]
  };
  const instance = engine.createInstance(symbol.id, 100, 200, 'X1', symbol);
  instance.rotation = 180;
  instance.symbolScale = 2;
  const exported = await globalThis.AdigunDXF.exportDrawing([instance]);
  assert.deepEqual(exported.unsupported, []);
  const { project } = globalThis.AdigunDXF.importDrawing(exported.text, 'Custom geometry', 'custom-dxf');
  assert.equal(project.objects.filter(object => object.kind === 'line').length, 5);
  const circles = project.objects.filter(object => object.kind === 'circle');
  assert.equal(circles.length, 2);
  assert.ok(circles.some(circle => Math.abs(circle.x - 136) < 1e-7 && Math.abs(circle.y - 200) < 1e-7
    && Math.abs(circle.x2 - circle.x - 6) < 1e-7 && circle.dxfLayer === 'devices'));
});

const sampleDxf = [
  '0', 'SECTION', '2', 'HEADER', '9', '$INSUNITS', '70', '1', '0', 'ENDSEC',
  '0', 'SECTION', '2', 'ENTITIES',
  '0', 'LINE', '8', 'OUTLINE', '10', '1', '20', '2', '11', '3', '21', '4',
  '0', 'CIRCLE', '8', 'CUTOUTS', '10', '6', '20', '4', '40', '1',
  '0', 'ARC', '8', '0', '10', '10', '20', '2', '40', '1', '50', '0', '51', '90',
  '0', 'ENDSEC', '0', 'EOF', ''
].join('\n');

test('DXF imports and exports supported planar geometry and reports skipped entities', async () => {
  globalThis.DxfParser = require('./vendor/dxf-parser-1.1.2');
  require('./cad-dxf');
  const { project, unsupported } = globalThis.AdigunDXF.importDrawing(sampleDxf, 'Drawing outline', 'dxf-regression');
  assert.deepEqual(unsupported, ['ARC × 1']);
  const [line, circle] = project.objects;
  assert.equal(project.objects.length, 2);
  assert.deepEqual([line.kind, line.dxfLayer, line.x1, line.y1, line.x2, line.y2], ['line', 'OUTLINE', 25.4, -50.8, 3 * 25.4, -101.6]);
  assert.equal(circle.kind, 'circle');
  assert.ok(Math.abs(circle.x2 - circle.x - 25.4) < 1e-9);
  assert.deepEqual(engine.parseProject(engine.serializeProject(project)).project.objects, project.objects);
  const exported = await globalThis.AdigunDXF.exportDrawing([line, { ...circle, lineType: 'dotted' },
    { kind: 'wire', x1: 0, y1: 0, x2: 50, y2: 30, stroke: '#164eac', lineType: 'dashed' }, { kind: 'component-instance' }]);
  assert.deepEqual(exported.unsupported, ['component-instance × 1']);
  assert.equal(new globalThis.DxfParser().parseSync(exported.text).header.$INSUNITS, 4);
  const reopened = globalThis.AdigunDXF.importDrawing(exported.text, 'Round trip', 'dxf-round-trip');
  const [restoredLine, restoredCircle, horizontal, vertical] = reopened.project.objects;
  assert.deepEqual([restoredLine.lineType, restoredCircle.lineType, horizontal.lineType, vertical.lineType],
    [undefined, 'dotted', 'dashed', 'dashed']);
  assert.deepEqual(restoredLine, line);
  assert.deepEqual(restoredCircle, { ...circle, lineType: 'dotted' });
  assert.deepEqual([horizontal.x1, horizontal.y1, horizontal.x2, horizontal.y2, vertical.x1, vertical.y1, vertical.x2, vertical.y2],
    [0, 0, 50, 0, 50, 0, 50, 30]);
});

function makeLargeDrawingFixture(pageCount = 10, rowsPerSheet = 5) {
  const sheets = [];
  const objects = [];
  const crossSheetConnections = [];
  for (let page = 0; page < pageCount; page += 1) {
    const sheetId = 'scale-' + page;
    sheets.push({ id: sheetId, number: 'A2/' + String(page + 1).padStart(3, '0'), name: 'Terminal routes ' + (page + 1), projectSectionId: 'A2' });
    for (let row = 0; row < rowsPerSheet; row += 1) {
      const y = 150 + row * 100;
      const addWire = (id, x1, x2) => objects.push({ id, kind: 'wire', sheetId, x1, y1: y, x2, y2: y });
      for (let column = 0; column < 5; column += 1) {
        const x = 180 + column * 180;
        const position = page * rowsPerSheet * 5 + row * 5 + column + 1;
        objects.push({ id: 'scale-terminal-' + position, kind: 'component-instance', schemaVersion: 1,
          ref: 'X' + position, componentId: 'phoenix-contact-3212144', sheetId, x, y, rotation: 0,
          properties: { terminalStrip: 'XT1', position: String(position), marking: '', comment: '' } });
        if (column === 4) continue;
        for (let segment = 0; segment < 6; segment += 1) {
          const from = x + 35 + segment * 18;
          addWire('scale-wire-' + position + '-' + segment, from, segment === 5 ? x + 145 : from + 18);
        }
      }
      if (page > 0) addWire(sheetId + '-receive-' + row, 80, 145);
      if (page === pageCount - 1) continue;
      const send = sheetId + '-send-' + row;
      const nextSheet = 'scale-' + (page + 1);
      addWire(send, 935, 1020);
      crossSheetConnections.push({ id: send, name: 'Route ' + (row + 1), endpoints: [
        { sheetId, wireId: send, point: { x: 1020, y } },
        { sheetId: nextSheet, wireId: nextSheet + '-receive-' + row, point: { x: 80, y } }
      ] });
    }
  }
  const project = 'Large drawing regression';
  return engine.copyExampleProject({ format: engine.projectFormat, version: engine.projectVersion,
    componentSchemaVersion: engine.componentSchemaVersion, netSchemaVersion: engine.netSchemaVersion,
    project, activeSheet: sheets[0].id, sheets, objects, crossSheetConnections }, 'large-drawing-regression', project);
}

test('workspace boot always starts with no active project, drawing tab, or automatic example', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const inline = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].find(match => !/\bsrc\s*=/.test(match[1]))[2];
  assert.match(inline, /state\.projectModel=null;state\.projectName='';state\.sheet=null;/);
  assert.match(inline, /projectTree'\)\.replaceChildren\(emptyProject\)/);
  assert.match(inline, /sheetTabs \.document-tab\[data-sheet\].*?tab\.remove\(\)/);
  assert.match(inline, /\$\$\('#sheetTabs \.document-tab\[data-sheet\]'\)\.forEach/);
  assert.match(inline, /\$\('#newSheet'\)\.hidden=true/);
  assert.match(inline, /window\.addEventListener\('beforeunload'/);
  assert.match(inline, /setProjectSheetDrawingScale\(sheet,input\.value\)/);
  assert.doesNotMatch(inline.slice(inline.lastIndexOf('state.projectModel=null;')), /copyExampleProject\(/);
});

test('Save As uses a local project file picker and subsequent Save writes to that chosen file', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const inline = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].find(match => !/\bsrc\s*=/.test(match[1]))[2];
  assert.match(inline, /\['Save project as…','save-as','Ctrl Shift S'\]/);
  assert.match(inline, /window\.showSaveFilePicker/);
  assert.match(inline, /projectSaveHandle\.createWritable\(\)/);
  assert.match(inline, /if\(e\.ctrlKey&&e\.shiftKey&&e\.key\.toLowerCase\(\)==='s'\)\{e\.preventDefault\(\);saveProjectAs\(\);return;\}/);
  assert.match(inline, /openNativeProject\(parsed\.project,f\.name\)/);
  assert.match(inline, /function openNativeProject[\s\S]*?projectSaveHandle=null;state\.projectName/);
});

test('canvas audit reflects the current local Save As and reopen limits', () => {
  const audit = fs.readFileSync(path.join(__dirname, 'docs/specs/canvas-behavior-implementation-audit.md'), 'utf8');
  assert.match(audit, /Save As uses the browser file picker when available/);
  assert.match(audit, /Save writes to the selected file handle during the current page session/);
  assert.match(audit, /Recover browser draft/);
  assert.match(audit, /CI Chromium verifies clean project creation, section sheet selection, canvas editing, and Save As\/reopen/);
  assert.match(audit, /opens a 100-sheet example as an A1–A4 native copy/);
  assert.match(audit, /source isolation and resolvable cross-sheet wire endpoints/);
  assert.match(audit, /native file picker is mocked/);
});

test('browser workflow creates, edits, saves, closes, and reopens a native project', {
  skip: process.env.CAD_BROWSER_WORKFLOW !== '1' ? 'Enable the pinned Chromium workflow in CI.' : false
}, async () => {
  const { chromium } = require('playwright');
  const root = path.resolve(__dirname);
  const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml' };
  let shellOutage = false;
  const outageRequests = new Set();
  const server = http.createServer((request, response) => {
    let pathname;
    try { pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname); }
    catch { response.writeHead(400).end(); return; }
    const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
    if (shellOutage && ['index.html', 'cad-engine.js'].includes(relative)) {
      outageRequests.add(relative);
      response.writeHead(503, { 'Cache-Control': 'no-store' }).end('Editor temporarily unavailable');
      return;
    }
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
    assert.equal(await page.locator('#projectTree').isVisible(), false, 'the clean workspace shows the project catalogue view');
    assert.equal(await page.locator('#sheetTabs .document-tab[data-sheet]').count(), 0);
    await page.locator('#editableExampleProjects [data-example-project]').first().waitFor();
    assert.ok(await page.locator('#editableExampleProjects [data-example-project]').count() > 0, 'Project Explorer lists editable examples at startup');

    await page.getByRole('button', { name: 'New project' }).click();
    assert.equal(await page.locator('#newProjectDialog #editableExampleProjects').count(), 0, 'New Project does not show example projects');
    assert.match(await page.locator('#blankProjectTemplate').innerText(), /A1[\s\S]*A2[\s\S]*A3[\s\S]*A4/);
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
    await sheetRow.locator('[data-sheet-name]').dblclick();
    const sheetNameInput = page.getByRole('textbox', { name: 'Rename sheet' });
    await sheetNameInput.fill('Incoming power');
    await sheetNameInput.press('Enter');
    assert.match(await sheetRow.getAttribute('aria-label'), /^A2\/0001 · Incoming power$/);
    assert.equal(await page.locator('#customSheetFrame').isVisible(), false, 'a new sheet starts in free drafting mode');
    await page.locator('#openCommands').click();
    await page.getByRole('button', { name: 'Toggle print frame' }).click();
    const titleBlock = page.locator('#projectTitleBlockDynamic [data-title-block="frame"]');
    await titleBlock.waitFor();
    const titleBlockRows = await page.locator('#projectTitleBlockDynamic [data-title-block-row]').evaluateAll(nodes => nodes.map(node => node.dataset.titleBlockRow));
    assert.deepEqual(titleBlockRows, ['branding', 'project', 'job-manager', 'customer-site', 'sheet', 'drawing', 'approvals', 'date-status', 'notes']);
    assert.match(await page.locator('#projectTitleBlockDynamic [data-title-block-row="branding"]').textContent(), /Hephzibah Behulah · AdigunAiAutoCad/);
    assert.match(await page.locator('#projectTitleBlockDynamic [data-title-block-row="project"]').textContent(), /Browser local save test/);
    const titleBlockBounds = await titleBlock.evaluate(node => ({ x: Number(node.getAttribute('x')), width: Number(node.getAttribute('width')), sheetWidth: Number(node.ownerSVGElement.querySelector('#sheetBackground').getAttribute('width')) }));
    assert.ok(titleBlockBounds.x > titleBlockBounds.sheetWidth * 0.5, 'title block stays in the lower-right portion of the drawing sheet: ' + JSON.stringify(titleBlockBounds));
    assert.ok(titleBlockBounds.width < titleBlockBounds.sheetWidth * 0.45, 'title block keeps a compact sheet footprint: ' + JSON.stringify(titleBlockBounds));
    await page.locator('[aria-label="Properties"]').click();
    const paperSize = page.getByLabel('Paper size', { exact: true });
    const orientation = page.getByLabel('Orientation', { exact: true });
    const leftMargin = page.getByLabel('Left margin (mm)');
    await leftMargin.fill('18');
    await leftMargin.press('Tab');
    assert.equal(await page.locator('#customSheetFrame > rect').getAttribute('x'), '18');
    for (const size of ['A4', 'A3', 'A2', 'A1', 'A0']) {
      for (const direction of ['landscape', 'portrait']) {
        await paperSize.selectOption(size);
        await orientation.selectOption(direction);
        const frameBounds = await titleBlock.evaluate(node => {
          const bounds = node.getBBox();
          const sheet = node.ownerSVGElement.querySelector('#sheetBackground');
          return { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height, sheetWidth: Number(sheet.getAttribute('width')), sheetHeight: Number(sheet.getAttribute('height')) };
        });
        assert.ok(frameBounds.x + frameBounds.width <= frameBounds.sheetWidth - 9, size + ' ' + direction + ' title block stays inside the right sheet margin: ' + JSON.stringify(frameBounds));
        assert.ok(frameBounds.y + frameBounds.height <= frameBounds.sheetHeight - 9, size + ' ' + direction + ' title block stays inside the bottom sheet margin: ' + JSON.stringify(frameBounds));
        const rowBounds = await page.locator('#projectTitleBlockDynamic [data-title-block-row]').evaluateAll(nodes => nodes.map(node => {
          const bounds = node.getBBox();
          return { key: node.dataset.titleBlockRow, x: bounds.x, y: bounds.y, right: bounds.x + bounds.width, bottom: bounds.y + bounds.height };
        }));
        assert.equal(rowBounds.length, 9, size + ' ' + direction + ' retains all title-block rows');
        assert.ok(rowBounds.every(row => row.x >= frameBounds.x && row.right <= frameBounds.x + frameBounds.width && row.y >= frameBounds.y && row.bottom <= frameBounds.y + frameBounds.height), size + ' ' + direction + ' keeps every title-block field inside the frame: ' + JSON.stringify({ frameBounds, rowBounds }));
      }
    }


    await page.locator('[aria-label="Properties"]').click();

    await page.locator('[aria-label="Draw rectangle"]').click();
    const canvas = await page.locator('#drawing').boundingBox();
    assert.ok(canvas && canvas.width > 100 && canvas.height > 100);
    await page.mouse.move(canvas.x + canvas.width * 0.30, canvas.y + canvas.height * 0.30);
    await page.mouse.down();
    await page.mouse.move(canvas.x + canvas.width * 0.40, canvas.y + canvas.height * 0.40, { steps: 3 });
    await page.mouse.up();
    assert.ok(await page.locator('#userDrawings > *').count() > 0, 'canvas edit should create native vector geometry');

    const nativeObjectCount = await page.locator('#userDrawings > *').count();
    await page.locator('#openFile').setInputFiles({
      name: 'read-only.svg',
      mimeType: 'image/svg+xml',
      buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="60" viewBox="0 0 100 60"><rect id="preview-only" width="100" height="60"/></svg>')
    });
    const preview = page.getByRole('dialog', { name: 'SVG preview' });
    const previewImage = preview.getByRole('img', { name: 'read-only.svg' });
    await previewImage.waitFor();
    assert.equal(await previewImage.evaluate(image => image.naturalWidth), 100);
    assert.equal(await page.locator('#preview-only').count(), 0);
    await preview.getByRole('button', { name: 'Close SVG preview' }).click();
    await preview.waitFor({ state: 'hidden' });
    assert.equal(await page.locator('#userDrawings > *').count(), nativeObjectCount);
    assert.equal(await page.locator('#sheetTabs .document-tab[aria-selected="true"]').getAttribute('data-sheet'), sheetId);

    await page.locator('[aria-label="Properties"]').click();
    const scale = page.getByLabel('Scale', { exact: true });
    await scale.fill('1:2');
    await scale.press('Tab');
    assert.equal(await page.locator('#userDrawings').getAttribute('transform'), 'scale(0.5)');
    await scale.fill('1:0');
    await scale.press('Tab');
    assert.equal(await scale.inputValue(), '1:2');
    assert.equal(await page.locator('#userDrawings').getAttribute('transform'), 'scale(0.5)');
    assert.match(await page.locator('[data-title-block-row="drawing"]').textContent(), /Scale: 1:2/);
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
    assert.equal(saved.projectModel.sheets.find(sheet => sheet.id === sheetId).scale, '1:2');
    assert.equal(saved.projectModel.sheets.find(sheet => sheet.id === sheetId).paperMargins.left, 18);
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
    assert.equal(await reopenedPage.locator('#userDrawings').getAttribute('transform'), 'scale(0.5)');
    assert.equal(await reopenedPage.locator('#customSheetFrame > rect').getAttribute('x'), '18');
    await reopenedPage.locator('[aria-label="Properties"]').click();
    assert.equal(await reopenedPage.getByLabel('Description', { exact: true }).inputValue(), 'Updated with repeat Save');
    assert.ok(await reopenedPage.locator('#userDrawings > *').count() > 0, 'saved canvas geometry survives reopen');
    await reopenedPage.close({ runBeforeUnload: false });

    const wiringPage = await context.newPage();
    await wiringPage.goto(address);
    await wiringPage.getByRole('button', { name: 'New project' }).click();
    await wiringPage.locator('#newProjectName').fill('Component wiring workflow');
    await wiringPage.locator('#createProject').click();
    await wiringPage.getByRole('button', { name: 'Add sheet to A2' }).click();
    await wiringPage.locator('#projectTree [data-sheet]').click();
    const viewportSize = await wiringPage.locator('#drawing').evaluate(node => {
      const drawing = node.getBoundingClientRect(), wrapper = node.closest('#drawingWrap').getBoundingClientRect();
      return { width: drawing.width, height: drawing.height, wrapWidth: wrapper.width, wrapHeight: wrapper.height,
        cameraAspect: node.viewBox.baseVal.width / node.viewBox.baseVal.height };
    });
    assert.equal(viewportSize.width, viewportSize.wrapWidth);
    assert.equal(viewportSize.height, viewportSize.wrapHeight);
    assert.ok(Math.abs(viewportSize.cameraAspect - viewportSize.width / viewportSize.height) < 0.005);
    const clickDrawingPoint = async (x, y) => {
      const point = await wiringPage.locator('#userDrawings').evaluate((node, coordinates) => {
        const transformed = new DOMPoint(...coordinates).matrixTransform(node.getScreenCTM());
        return { x: transformed.x, y: transformed.y };
      }, [x, y]);
      await wiringPage.mouse.click(point.x, point.y);
    };
    const symbol = wiringPage.locator('#symbolList [data-insert="phoenix-contact-3212144"]');
    await symbol.click();
    const pickup = wiringPage.locator('#rightPanel.open #selectionDetails');
    await pickup.getByText('Terminals', { exact: true }).waitFor();
    assert.equal(await wiringPage.locator('#userDrawings [data-object]').count(), 0);
    await wiringPage.keyboard.press('Escape');
    await pickup.getByText('Terminals', { exact: true }).waitFor({ state: 'detached' });
    await wiringPage.locator('#closeRightPanel').click();
    const terminalIds = [];
    let propertiesViewportWidth;
    for (const x of [85, 210, 335]) {
      if (x === 85) {
        await symbol.hover();
        const sourceBounds = await symbol.boundingBox();
        await wiringPage.mouse.down();
        await wiringPage.mouse.move(sourceBounds.x + sourceBounds.width / 2 + 12, sourceBounds.y + sourceBounds.height / 2);
        await pickup.getByText('Terminals', { exact: true }).waitFor();
        await wiringPage.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        const { x, y } = await wiringPage.locator('#userDrawings').evaluate(node => {
          const point = new DOMPoint(85, 110).matrixTransform(node.getScreenCTM());
          return { x: point.x, y: point.y };
        });
        await wiringPage.mouse.move(x, y, { steps: 12 });
        await wiringPage.mouse.move(x + 1, y);
        await wiringPage.mouse.move(x, y);
        await wiringPage.mouse.up();
      } else {
        await symbol.click();
        await clickDrawingPoint(x, 110);
      }
      const selected = wiringPage.locator('#userDrawings [data-object].selected-object');
      await selected.waitFor({ timeout: 5000 }).catch(async () => {
        throw new Error('Terminal was not placed: ' + await wiringPage.locator('#toast').textContent());
      });
      const terminalId = await selected.getAttribute('data-object');
      terminalIds.push(terminalId);
      await wiringPage.locator('#rightPanel.open [data-symbol-scale="' + terminalId + '"]').waitFor();
      const width = (await wiringPage.locator('#drawing').boundingBox()).width;
      propertiesViewportWidth ??= width;
      assert.equal(width, propertiesViewportWidth, 'consecutive placements keep the Properties dock stable');
    }
    const desktopViewport = wiringPage.viewportSize();
    await wiringPage.setViewportSize({ width: 600, height: 800 });
    await wiringPage.locator('#rightPanel.open [data-symbol-scale="' + terminalIds.at(-1) + '"]').waitFor();
    const narrowCanvas = await wiringPage.locator('#drawing').boundingBox();
    const dock = await wiringPage.locator('#rightPanel').boundingBox();
    assert.ok(narrowCanvas.height > 100 && narrowCanvas.y + narrowCanvas.height <= dock.y + 1);
    await wiringPage.setViewportSize(desktopViewport);
    assert.equal(new Set(terminalIds).size, 3);
    const pin = (objectId, number) => wiringPage.locator('#userDrawings [data-object="' + objectId + '"] [data-component-pin="connection-' + number + '"]');
    const terminalClickPoint = async (objectId, number) => {
      const box = await pin(objectId, number).boundingBox();
      return { x: box.x + box.width / 2, y: box.y + box.height / 2 + 8 };
    };
    await wiringPage.getByRole('button', { name: 'Draw wire' }).click();
    const startClick = await terminalClickPoint(terminalIds[0], 2);
    await wiringPage.mouse.move(startClick.x, startClick.y);
    await wiringPage.mouse.down();
    await wiringPage.mouse.move(startClick.x, startClick.y + 4);
    await wiringPage.mouse.up();
    assert.equal(await wiringPage.locator('[data-wire-pin-target]').getAttribute('data-wire-pin-target'), 'connection-2');
    const endClick = await terminalClickPoint(terminalIds[1], 1);
    await wiringPage.mouse.click(endClick.x, endClick.y);
    assert.equal(await wiringPage.locator('#userDrawings path[data-object]').count(), 1);
    await wiringPage.getByRole('button', { name: 'Select and move', exact: true }).click();
    const wire = wiringPage.locator('#userDrawings path[data-object]');
    await wire.dispatchEvent('click', { bubbles: true });
    const wireId = await wire.getAttribute('data-object');
    await wiringPage.locator('[aria-label="Properties"]').click();
    await wiringPage.locator('[data-style-object="' + wireId + '"][data-drawing-style="stroke"]').evaluate(input => {
      input.value = '#4b367c';
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await wiringPage.getByRole('button', { name: 'Reconnect end' }).click();
    await pin(terminalIds[2], 1).click();
    const terminal = wiringPage.locator('#userDrawings [data-object="' + terminalIds[0] + '"]');
    await pin(terminalIds[0], 1).click();
    assert.match(await terminal.getAttribute('class'), /selected-object/);
    await wiringPage.keyboard.press('ArrowDown');
    const symbolScale = wiringPage.locator('[data-symbol-scale="' + terminalIds[0] + '"]');
    await symbolScale.fill('4');
    await symbolScale.press('Tab');
    assert.equal(await symbolScale.inputValue(), '1', 'resize rejects overlap with the next terminal');
    await symbolScale.fill('1.25');
    await symbolScale.press('Tab');
    assert.match(await terminal.getAttribute('transform'), /scale\(1\.25\)/);
    const resizeHandle = wiringPage.locator('[data-resize-object="' + terminalIds[0] + '"][data-resize-handle="se"]');
    const handleBounds = await resizeHandle.boundingBox();
    assert.ok(handleBounds, 'the wired terminal displays a resize handle');
    const handleX = handleBounds.x + handleBounds.width / 2;
    const handleY = handleBounds.y + handleBounds.height / 2;
    await wiringPage.mouse.move(handleX, handleY);
    await wiringPage.mouse.down();
    await wiringPage.mouse.move(handleX + 12, handleY + 8, { steps: 4 });
    await wiringPage.mouse.up();
    const draggedScale = Number(await symbolScale.inputValue());
    assert.ok(draggedScale > 1.25);
    await wiringPage.locator('[data-action="undo"]').click();
    assert.equal(Number(await symbolScale.inputValue()), 1.25);
    await wiringPage.locator('[data-action="redo"]').click();
    assert.equal(Number(await symbolScale.inputValue()), draggedScale);
    const rotation = wiringPage.locator('[data-symbol-rotation="' + terminalIds[0] + '"]');
    await wiringPage.locator('[data-rotation-handle="' + terminalIds[0] + '"]').click();
    assert.equal(await rotation.inputValue(), '90');
    await rotation.selectOption('270');
    assert.match(await terminal.getAttribute('transform'), /rotate\(270\)/);
    await wiringPage.keyboard.press('Control+Shift+S');
    await wiringPage.waitForFunction(() => window.__savedProjectWrites.length === 1);
    const wiringSavedText = await wiringPage.evaluate(() => window.__savedProjectWrites[0]);
    const wiringSaved = engine.parseProject(wiringSavedText);
    assert.equal(wiringSaved.valid, true, wiringSaved.errors.join(' '));
    const savedWire = wiringSaved.project.objects.find(object => object.id === wireId);
    assert.equal(savedWire.stroke, '#4b367c');
    const [movedTerminal, unusedTerminal, newTarget] = terminalIds.map(id => wiringSaved.project.objects.find(object => object.id === id));
    const origin = engine.worldPins(movedTerminal).find(item => item.number === '2');
    const destination = engine.worldPins(newTarget).find(item => item.number === '1');
    assert.ok(movedTerminal.y > unusedTerminal.y, 'keyboard movement nudges the connected terminal');
    assert.equal(movedTerminal.symbolScale, draggedScale);
    assert.equal(movedTerminal.rotation, 270);
    assert.deepEqual([savedWire.x1, savedWire.y1, savedWire.x2, savedWire.y2], [origin.x, origin.y, destination.x, destination.y]);
    assert.deepEqual(savedWire.pinAttachments, {
      start: { instanceId: movedTerminal.id, pinId: origin.id },
      end: { instanceId: newTarget.id, pinId: destination.id }
    });
    const wiringAnalysis = engine.analyzeProject(wiringSaved.project);
    assert.equal(wiringAnalysis.openEndpointCount, 0);
    const savedNet = wiringAnalysis.globalNets.find(net => net.wireIds.includes(savedWire.sheetId + ':' + wireId));
    assert.deepEqual(savedNet.pins.map(item => item.ref + ':' + item.number).sort(),
      [movedTerminal.ref + ':1', movedTerminal.ref + ':2', newTarget.ref + ':1', newTarget.ref + ':2'].sort());
    await wiringPage.reload();
    await wiringPage.locator('#openFile').setInputFiles({
      name: 'Component-wiring.adigun.json', mimeType: 'application/json', buffer: Buffer.from(wiringSavedText)
    });
    const reopenedWire = wiringPage.locator('#userDrawings [data-object="' + wireId + '"]');
    await reopenedWire.waitFor();
    assert.equal(await reopenedWire.getAttribute('stroke'), '#4b367c');
    await wiringPage.getByRole('button', { name: 'Draw wire' }).click();
    await pin(terminalIds[1], 2).click();
    await clickDrawingPoint(250, 165);
    await clickDrawingPoint(380, 190);
    const manualEndClick = await terminalClickPoint(terminalIds[2], 2);
    await wiringPage.mouse.click(manualEndClick.x, manualEndClick.y);
    await wiringPage.getByRole('button', { name: 'Select and move', exact: true }).click();
    await pin(terminalIds[1], 1).click();
    await wiringPage.keyboard.press('ArrowDown');
    await wiringPage.locator('#userDrawings [data-object="' + terminalIds[2] + '"] text').filter({ hasText: 'PT 16 N OG' }).click();
    await wiringPage.keyboard.press('ArrowUp');
    await wiringPage.keyboard.press('Control+Shift+S');
    await wiringPage.waitForFunction(() => window.__savedProjectWrites.length === 1);
    const manualSaved = engine.parseProject(await wiringPage.evaluate(() => window.__savedProjectWrites[0]));
    assert.equal(manualSaved.valid, true, manualSaved.errors.join(' '));
    const manualWire = manualSaved.project.objects.find(object => object.kind === 'wire' && object.id !== wireId);
    assert.deepEqual(manualWire.bends, [{ x: 250, y: 165 }, { x: 380, y: 190 }]);
    const [manualStart, manualEnd] = terminalIds.slice(1).map(id => {
      const component = manualSaved.project.objects.find(object => object.id === id);
      return engine.worldPins(component).find(item => item.number === '2');
    });
    assert.deepEqual([manualWire.x1, manualWire.y1, manualWire.x2, manualWire.y2], [manualStart.x, manualStart.y, manualEnd.x, manualEnd.y]);
    assert.deepEqual(manualWire.pinAttachments, {
      start: { instanceId: terminalIds[1], pinId: manualStart.id },
      end: { instanceId: terminalIds[2], pinId: manualEnd.id }
    });
    assert.equal(engine.analyzeProject(manualSaved.project).openEndpointCount, 0);
    const routedWire = wiringPage.locator('#userDrawings [data-object="' + manualWire.id + '"]');
    const originalRoute = await routedWire.getAttribute('d');
    await wiringPage.getByRole('button', { name: 'Properties', exact: true }).click();
    await routedWire.dispatchEvent('click', { bubbles: true });
    await wiringPage.getByRole('button', { name: 'Reroute wire', exact: true }).click();
    await clickDrawingPoint(280, 200);
    await wiringPage.keyboard.press('Escape');
    assert.equal(await routedWire.getAttribute('d'), originalRoute, 'cancelling leaves the wire intact');
    await routedWire.dispatchEvent('click', { bubbles: true });
    await wiringPage.getByRole('button', { name: 'Reroute wire', exact: true }).click();
    await clickDrawingPoint(280, 200);
    await clickDrawingPoint(375, 225);
    await wiringPage.getByRole('button', { name: 'Apply wire route' }).click();
    const changedRoute = await routedWire.getAttribute('d');
    assert.notEqual(changedRoute, originalRoute);
    await wiringPage.locator('[data-action="undo"]').click();
    assert.equal(await routedWire.getAttribute('d'), originalRoute);
    await wiringPage.locator('[data-action="redo"]').click();
    assert.equal(await routedWire.getAttribute('d'), changedRoute);
    await wiringPage.keyboard.press('Control+Shift+S');
    await wiringPage.waitForFunction(() => window.__savedProjectWrites.length === 2);
    const reroutedProject = engine.parseProject(await wiringPage.evaluate(() => window.__savedProjectWrites[1]));
    assert.equal(reroutedProject.valid, true, reroutedProject.errors.join(' '));
    const reroutedWire = reroutedProject.project.objects.find(object => object.id === manualWire.id);
    assert.deepEqual(reroutedWire.bends, [{ x: 280, y: 200 }, { x: 375, y: 225 }]);
    assert.deepEqual(reroutedWire.pinAttachments, manualWire.pinAttachments);
    assert.deepEqual(engine.analyzeProject(reroutedProject.project).globalNets, engine.analyzeProject(manualSaved.project).globalNets);
    if (process.env.CAD_SCREENSHOT_DIR) await wiringPage.screenshot({ path: path.join(process.env.CAD_SCREENSHOT_DIR, 'connected-terminals.png') });
    await wiringPage.close({ runBeforeUnload: false });

    const touchContext = await browser.newContext({ hasTouch: true, viewport: { width: 1024, height: 768 } });
    const touchPage = await touchContext.newPage();
    await touchPage.goto(address);
    await touchPage.getByRole('button', { name: 'New project' }).tap();
    await touchPage.locator('#createProject').tap();
    await touchPage.getByRole('button', { name: 'Add sheet to A2' }).tap();
    await touchPage.locator('#projectTree [data-sheet]').tap();
    const tapDrawingPoint = async (x, y) => {
      const point = await touchPage.locator('#userDrawings').evaluate((node, [x, y]) => {
        const screen = new DOMPoint(x, y).matrixTransform(node.getScreenCTM());
        return { x: screen.x, y: screen.y };
      }, [x, y]);
      await touchPage.touchscreen.tap(point.x, point.y);
    };
    for (const x of [85, 235, 385]) {
      await touchPage.locator('#symbolList [data-insert="phoenix-contact-3212144"]').tap();
      await tapDrawingPoint(x, 100);
    }
    const touchTerminals = touchPage.locator('#userDrawings [data-object]');
    const touchPin = (index, number) => touchTerminals.nth(index).locator('[data-component-pin="connection-' + number + '"]');
    await touchPage.getByRole('button', { name: 'Draw wire' }).tap();
    await touchPin(0, 2).tap();
    await touchPin(1, 1).tap();
    const touchWires = touchPage.locator('#userDrawings path[data-object]');
    assert.equal(await touchWires.count(), 1, 'touch taps connect two terminal anchors');
    await touchPin(1, 2).tap();
    await tapDrawingPoint(285, 165);
    await tapDrawingPoint(325, 185);
    await touchPin(2, 1).tap();
    assert.equal(await touchWires.count(), 2, 'touch taps finish a second wire with manual bends');
    assert.equal(await touchWires.nth(1).getAttribute('d'), 'M270 100L285 100L285 165L325 165L325 185L350 185L350 100');
    await touchPage.getByRole('button', { name: 'Insert Phoenix Contact PT 2,5-PE terminal' }).tap();
    await tapDrawingPoint(235, 245);
    const placedEarth = touchPage.locator('#userDrawings [data-object].selected-object');
    assert.match(await placedEarth.getAttribute('aria-label'), /3209536/);
    assert.equal(await placedEarth.locator('[data-component-pin]').count(), 2);
    await touchContext.close();

    const freeDraftingPage = await context.newPage();
    await freeDraftingPage.goto(address);
    await freeDraftingPage.getByRole('button', { name: 'New project' }).click();
    await freeDraftingPage.locator('#createProject').click();
    await freeDraftingPage.getByRole('button', { name: 'Add sheet to A2' }).click();
    await freeDraftingPage.locator('#projectTree [data-sheet]').click();
    await freeDraftingPage.locator('#openCommands').click();
    await freeDraftingPage.getByRole('button', { name: 'Go to origin' }).click();
    const freePoint = (x, y) => freeDraftingPage.locator('#userDrawings').evaluate((node, coordinates) => {
      const screen = new DOMPoint(...coordinates).matrixTransform(node.getScreenCTM());
      return { x: screen.x, y: screen.y };
    }, [x, y]);
    for (const [label, x, y] of [['Insert SEW-EURODRIVE DRN63MS4 motor', -125, -35], ['Insert Siemens SIMATIC S7-1200 CPU 1212C', 175, -35]]) {
      await freeDraftingPage.getByRole('button', { name: label, exact: true }).click();
      if (x > 0) {
        const overlap = await freePoint(75, y);
        await freeDraftingPage.mouse.move(overlap.x, overlap.y);
        assert.equal(await freeDraftingPage.locator('[data-component-preview]').getAttribute('data-placement-blocked'), 'true');
        await freeDraftingPage.mouse.click(overlap.x, overlap.y);
        assert.equal(await freeDraftingPage.locator('#userDrawings > [data-object]').count(), 1);
      }
      const point = await freePoint(x, y);
      await freeDraftingPage.mouse.click(point.x, point.y);
    }
    await freeDraftingPage.locator('[data-action="fit"]').click();
    const zoomPoint = await freeDraftingPage.locator('#drawing').evaluate(node => {
      const bounds = node.getBoundingClientRect();
      return { x: Math.round(bounds.left + bounds.width * 0.28), y: Math.round(bounds.top + bounds.height * 0.4) };
    });
    const worldAtZoomPoint = () => freeDraftingPage.locator('#drawing').evaluate((node, point) => {
      const world = new DOMPoint(point.x, point.y).matrixTransform(node.getScreenCTM().inverse());
      return { x: world.x, y: world.y };
    }, zoomPoint);
    const beforeZoom = await worldAtZoomPoint();
    await freeDraftingPage.mouse.move(zoomPoint.x, zoomPoint.y);
    await freeDraftingPage.mouse.wheel(0, -120);
    await freeDraftingPage.waitForFunction(() => document.querySelector('#zoomValue').textContent !== '100%');
    const afterZoom = await worldAtZoomPoint();
    assert.ok(Math.hypot(afterZoom.x - beforeZoom.x, afterZoom.y - beforeZoom.y) < 0.01, JSON.stringify({ beforeZoom, afterZoom }));
    const ruler = await freeDraftingPage.locator('[data-guide-ruler="y"]').boundingBox();
    assert.ok(ruler);
    await freeDraftingPage.mouse.move(ruler.x + ruler.width * 0.35, ruler.y + ruler.height / 2);
    await freeDraftingPage.mouse.down();
    await freeDraftingPage.mouse.move(ruler.x + ruler.width * 0.35, ruler.y + 120);
    await freeDraftingPage.mouse.up();
    await freeDraftingPage.getByRole('button', { name: 'Properties', exact: true }).click();
    const guide = freeDraftingPage.getByLabel('Guide 1 position (mm)');
    const guideBeforeMove = await guide.inputValue();
    const guideHandle = await freeDraftingPage.locator('[data-guide-handle="0"]').boundingBox();
    assert.ok(guideHandle);
    const guideX = guideHandle.x + guideHandle.width / 2, guideY = guideHandle.y + guideHandle.height / 2;
    await freeDraftingPage.mouse.move(guideX, guideY);
    await freeDraftingPage.mouse.down();
    await freeDraftingPage.mouse.move(guideX, guideY + 24);
    await freeDraftingPage.mouse.up();
    assert.ok(Number(await guide.inputValue()) > Number(guideBeforeMove), 'the ruler handle moves the existing guide');
    assert.equal(await freeDraftingPage.locator('[data-guide-position]').count(), 1);
    await guide.fill('92.5');
    await guide.press('Tab');
    await freeDraftingPage.getByRole('button', { name: 'Lock', exact: true }).click();
    assert.equal(await guide.isDisabled(), true);
    await freeDraftingPage.getByLabel('Grid interval (mm)').fill('5');
    await freeDraftingPage.getByLabel('Grid interval (mm)').press('Tab');
    await freeDraftingPage.getByLabel('Snap interval (mm)').fill('0.5');
    await freeDraftingPage.getByLabel('Snap interval (mm)').press('Tab');
    await freeDraftingPage.getByLabel('Display units').selectOption('in');
    assert.match(await freeDraftingPage.locator('#gridSpacing').textContent(), /Grid: 5 mm.*Snap: 0.5 mm/);
    await freeDraftingPage.setViewportSize({ width: 1120, height: 720 });
    await freeDraftingPage.keyboard.press('Control+Shift+S');
    await freeDraftingPage.waitForFunction(() => window.__savedProjectWrites.length === 1);
    const freeText = await freeDraftingPage.evaluate(() => window.__savedProjectWrites[0]);
    const freeProject = engine.parseProject(freeText).project;
    assert.deepEqual(freeProject.objects.map(object => [object.x, object.y]), [[-125, -35], [175, -35]]);
    assert.equal(freeProject.projectModel.sheets[0].showPrintFrame, false);
    assert.deepEqual(freeProject.projectModel.sheets[0].guides, [{ axis: 'y', position: 92.5, locked: true }]);
    assert.equal(freeProject.projectModel.sheets[0].displayUnits, 'in');
    assert.equal(freeProject.projectModel.sheets[0].snapIntervalMm, 0.5);
    await freeDraftingPage.locator('#openCommands').click();
    const svgDownload = freeDraftingPage.waitForEvent('download');
    await freeDraftingPage.getByRole('button', { name: 'Export full drawing as SVG' }).click();
    const fullSvg = fs.readFileSync(await (await svgDownload).path(), 'utf8');
    const fullBounds = /viewBox="([^\"]+)"/.exec(fullSvg)[1].split(' ').map(Number);
    assert.ok(fullBounds[0] < -125 && fullBounds[1] < -35);
    for (const object of freeProject.objects) assert.ok(fullSvg.includes(object.id));
    assert.doesNotMatch(fullSvg, /draftingRulers|viewportGrid|resize-controls|customSheetFrame/);
    const selectedForExport = freeProject.objects.find(object => object.kind === 'component-instance' && object.x < 0);
    await freeDraftingPage.getByRole('button', { name: 'Select and move', exact: true }).click();
    await freeDraftingPage.keyboard.press('Escape');
    await freeDraftingPage.locator('#userDrawings [data-object="' + selectedForExport.id + '"]').dispatchEvent('click', { bubbles: true });
    await freeDraftingPage.locator('#openCommands').click();
    const selectionDownload = freeDraftingPage.waitForEvent('download');
    await freeDraftingPage.locator('#commands').getByRole('button', { name: 'Export selection as SVG' }).click();
    const selectionSvg = fs.readFileSync(await (await selectionDownload).path(), 'utf8');
    assert.ok(selectionSvg.includes(selectedForExport.id));
    for (const object of freeProject.objects.filter(object => object.id !== selectedForExport.id)) {
      assert.ok(!selectionSvg.includes(object.id));
    }
    const selectionBounds = /viewBox="([^"]+)"/.exec(selectionSvg)[1].split(' ').map(Number);
    assert.ok(selectionBounds[0] < selectedForExport.x && selectionBounds[2] < fullBounds[2]);
    assert.doesNotMatch(selectionSvg, /draftingRulers|viewportGrid|resize-controls|customSheetFrame|selected-object/);
    await freeDraftingPage.locator('#openCommands').click();
    await freeDraftingPage.locator('#commands').getByRole('button', { name: 'Export region as SVG' }).click();
    const regionFrom = await freePoint(-130, -55);
    const regionTo = await freePoint(40, 25);
    const regionDownload = freeDraftingPage.waitForEvent('download');
    await freeDraftingPage.mouse.move(regionFrom.x, regionFrom.y);
    await freeDraftingPage.mouse.down();
    await freeDraftingPage.mouse.move(regionTo.x, regionTo.y, { steps: 4 });
    await freeDraftingPage.mouse.up();
    const regionSvg = fs.readFileSync(await (await regionDownload).path(), 'utf8');
    const regionBounds = /viewBox="([^"]+)"/.exec(regionSvg)[1].split(' ').map(Number);
    for (const [actual, expected] of regionBounds.map((value, index) => [value, [-130, -55, 170, 80][index]])) {
      assert.ok(Math.abs(actual - expected) < 0.5, 'region crop is in sheet coordinates');
    }
    assert.match(regionSvg, /overflow="hidden"/);
    assert.doesNotMatch(regionSvg, /draftingRulers|viewportGrid|resize-controls|customSheetFrame|selection-window/);
    await freeDraftingPage.evaluate(() => {
      window.print = () => {};
      window.confirm = message => { window.__frameWarning = message; return true; };
    });
    await freeDraftingPage.locator('#openCommands').click();
    await freeDraftingPage.locator('#commands').getByRole('button', { name: 'Print drawing' }).click();
    assert.match(await freeDraftingPage.evaluate(() => window.__frameWarning), /outside the print frame/);
    const pdf = await freeDraftingPage.pdf({ preferCSSPageSize: true,
      ...(process.env.CAD_SCREENSHOT_DIR ? { path: path.join(process.env.CAD_SCREENSHOT_DIR, 'a3-print-frame.pdf') } : {}) });
    const media = /\/MediaBox\s*\[0 0 ([\d.]+) ([\d.]+)\]/.exec(pdf.toString('latin1'));
    assert.ok(media, 'Chromium PDF contains the physical page dimensions');
    assert.ok(Math.abs(Number(media[1]) * 25.4 / 72 - 420) < 1);
    assert.ok(Math.abs(Number(media[2]) * 25.4 / 72 - 297) < 1);
    await freeDraftingPage.evaluate(() => window.dispatchEvent(new Event('afterprint')));
    const freePaperSize = freeDraftingPage.getByLabel('Paper size', { exact: true });
    await freePaperSize.selectOption('Custom');
    const customWidth = freeDraftingPage.getByLabel('Paper width (mm)');
    const customHeight = freeDraftingPage.getByLabel('Paper height (mm)');
    await customWidth.fill('470');
    await customWidth.press('Tab');
    await customHeight.fill('315');
    await customHeight.press('Tab');
    await customWidth.fill('0');
    await customWidth.press('Tab');
    assert.equal(await customWidth.inputValue(), '470');
    assert.equal(await freeDraftingPage.locator('#sheetBackground').getAttribute('width'), '470');
    await freeDraftingPage.locator('#openCommands').click();
    await freeDraftingPage.locator('#commands').getByRole('button', { name: 'Print drawing' }).click();
    const customPdf = await freeDraftingPage.pdf({ preferCSSPageSize: true });
    const customMedia = /\/MediaBox\s*\[0 0 ([\d.]+) ([\d.]+)\]/.exec(customPdf.toString('latin1'));
    assert.ok(customMedia);
    assert.ok(Math.abs(Number(customMedia[1]) * 25.4 / 72 - 470) < 1);
    assert.ok(Math.abs(Number(customMedia[2]) * 25.4 / 72 - 315) < 1);
    await freeDraftingPage.evaluate(() => window.dispatchEvent(new Event('afterprint')));
    await freePaperSize.selectOption('A3');
    await freeDraftingPage.locator('[data-action="fit"]').click();
    assert.ok(await freeDraftingPage.locator('#draftingRulers text').count() > 3);
    if (process.env.CAD_SCREENSHOT_DIR) await freeDraftingPage.screenshot({ path: path.join(process.env.CAD_SCREENSHOT_DIR, 'free-drafting-canvas.png') });
    const quickInsert = freeDraftingPage.locator('#symbolList [data-insert="phoenix-contact-3212144"]');
    await quickInsert.click({ modifiers: ['Shift'] });
    await freeDraftingPage.locator('#rightPanel.open [data-symbol-scale]').waitFor();
    await quickInsert.click({ modifiers: ['Shift'] });
    const quickBounds = await freeDraftingPage.locator('#userDrawings > [data-object]').evaluateAll(nodes => nodes.slice(-2).map(node => {
      const { left, right, top, bottom } = node.getBoundingClientRect();
      return { left, right, top, bottom };
    }));
    assert.equal(await freeDraftingPage.locator('#userDrawings > [data-object]').count(), 4);
    const [firstQuick, secondQuick] = quickBounds;
    assert.ok(firstQuick.right <= secondQuick.left || secondQuick.right <= firstQuick.left
      || firstQuick.bottom <= secondQuick.top || secondQuick.bottom <= firstQuick.top);
    await freeDraftingPage.getByLabel('Display units').selectOption('mm');
    await freeDraftingPage.locator('#openCommands').click();
    await freeDraftingPage.getByRole('button', { name: 'Draw distance dimension' }).click();
    const dimStart = await freePoint(0, 50), dimEnd = await freePoint(100, 50);
    await freeDraftingPage.mouse.move(dimStart.x, dimStart.y);
    await freeDraftingPage.mouse.down();
    await freeDraftingPage.mouse.move(dimEnd.x, dimEnd.y, { steps: 4 });
    await freeDraftingPage.mouse.up();
    const dimension = freeDraftingPage.locator('#userDrawings [data-object]').filter({ hasText: /^100 mm$/ });
    const dimensionId = await dimension.getAttribute('data-object');
    await freeDraftingPage.getByRole('button', { name: 'Select and move', exact: true }).click();
    await dimension.dispatchEvent('click', { bubbles: true });
    await freeDraftingPage.locator('[data-dimension-coordinate="x2"]').fill('125');
    await freeDraftingPage.locator('[data-dimension-coordinate="x2"]').press('Tab');
    assert.match(await freeDraftingPage.locator('#userDrawings [data-object="' + dimensionId + '"]').textContent(), /125 mm/);
    await freeDraftingPage.getByLabel('Display units').selectOption('in');
    assert.match(await freeDraftingPage.locator('#userDrawings [data-object="' + dimensionId + '"]').textContent(), /4\.921 in/);
    const writesBeforeDimension = await freeDraftingPage.evaluate(() => window.__savedProjectWrites.length);
    await freeDraftingPage.keyboard.press('Control+Shift+S');
    await freeDraftingPage.waitForFunction(count => window.__savedProjectWrites.length > count, writesBeforeDimension);
    const dimensionProject = engine.parseProject(await freeDraftingPage.evaluate(() => window.__savedProjectWrites.at(-1)));
    assert.equal(dimensionProject.valid, true, dimensionProject.errors.join(' '));
    const savedDimension = dimensionProject.project.objects.find(object => object.id === dimensionId);
    assert.deepEqual([savedDimension.x1, savedDimension.x2], [0, 125]);
    await freeDraftingPage.close({ runBeforeUnload: false });

    const symbolPage = await context.newPage();
    await symbolPage.goto(address);
    await symbolPage.getByRole('button', { name: 'New project' }).click();
    await symbolPage.locator('#createProject').click();
    await symbolPage.getByRole('button', { name: 'Add sheet to A2' }).click();
    await symbolPage.locator('#projectTree [data-sheet]').click();
    await symbolPage.getByRole('button', { name: 'Draw rectangle' }).click();
    const drag = await symbolPage.locator('#userDrawings').evaluate(node => [[80, 100], [125, 125]].map(([x, y]) => {
      const point = new DOMPoint(x, y).matrixTransform(node.getScreenCTM());
      return { x: point.x, y: point.y };
    }));
    await symbolPage.mouse.move(drag[0].x, drag[0].y);
    await symbolPage.mouse.down();
    await symbolPage.mouse.move(drag[1].x, drag[1].y, { steps: 3 });
    await symbolPage.mouse.up();
    await symbolPage.getByRole('button', { name: 'Select and move', exact: true }).click();
    await symbolPage.keyboard.press('Control+a');
    symbolPage.on('dialog', dialog => dialog.accept(dialog.message().includes('name') ? 'Field connector' : '1,-22.5,0;2,22.5,0'));
    await symbolPage.locator('#openCommands').click();
    await symbolPage.locator('#commands').getByRole('button', { name: 'Create project symbol from selection' }).click();
    const authoredSymbol = symbolPage.locator('#symbolList [data-insert]').filter({ hasText: 'Field connector' });
    await authoredSymbol.click({ modifiers: ['Shift'] });
    await authoredSymbol.click({ modifiers: ['Shift'] });
    const authoredPins = symbolPage.locator('#userDrawings [data-component-pin="terminal-2"]');
    assert.equal(await authoredPins.count(), 2);
    await symbolPage.getByRole('button', { name: 'Draw wire' }).click();
    await authoredPins.first().click();
    await symbolPage.locator('#userDrawings [data-component-pin="terminal-1"]').last().click();
    await symbolPage.keyboard.press('Control+Shift+S');
    await symbolPage.waitForFunction(() => window.__savedProjectWrites.length === 1);
    const authoredText = await symbolPage.evaluate(() => window.__savedProjectWrites[0]);
    const authoredProject = engine.parseProject(authoredText);
    assert.equal(authoredProject.valid, true, authoredProject.errors.join(' '));
    assert.equal(authoredProject.project.projectModel.userSymbols[0].name, 'Field connector');
    const authoredAnalysis = engine.analyzeProject(authoredProject.project);
    assert.equal(authoredAnalysis.wireCount, 1);
    assert.equal(authoredAnalysis.openEndpointCount, 0);
    await symbolPage.reload();
    await symbolPage.locator('#openFile').setInputFiles({ name: 'Project-symbol.adigun.json', mimeType: 'application/json', buffer: Buffer.from(authoredText) });
    await authoredSymbol.waitFor();
    assert.equal(await authoredPins.count(), 2);
    await symbolPage.close({ runBeforeUnload: false });

    const dxfPage = await context.newPage();
    await dxfPage.goto(address);
    await dxfPage.locator('#openFile').setInputFiles({
      name: 'Drawing-outline.dxf', mimeType: 'application/dxf', buffer: Buffer.from(sampleDxf)
    });
    await dxfPage.locator('#userDrawings [data-object="dxf-1"]').waitFor();
    assert.equal(await dxfPage.locator('#userDrawings circle[data-object="dxf-2"]').count(), 1);
    assert.match(await dxfPage.locator('#toast').textContent(), /Skipped: ARC/);
    await dxfPage.locator('#openCommands').click();
    const pendingDxf = dxfPage.waitForEvent('download');
    await dxfPage.getByRole('button', { name: 'Export current sheet as DXF' }).click();
    const dxfDownload = await pendingDxf;
    assert.match(dxfDownload.suggestedFilename(), /\.dxf$/);
    const roundTripDxf = fs.readFileSync(await dxfDownload.path(), 'utf8');
    await dxfPage.locator('#openFile').setInputFiles({
      name: 'Exported-outline.dxf', mimeType: 'application/dxf', buffer: Buffer.from(roundTripDxf)
    });
    await dxfPage.getByText('Exported-outline', { exact: true }).first().waitFor();
    assert.equal(await dxfPage.locator('#userDrawings circle[data-object="dxf-2"]').count(), 1);
    await dxfPage.close({ runBeforeUnload: false });

    const largeDrawing = makeLargeDrawingFixture();
    const beforeLargeEdit = engine.analyzeProject(largeDrawing);
    assert.equal(beforeLargeEdit.valid, true, beforeLargeEdit.errors.join(' '));
    assert.deepEqual([beforeLargeEdit.sheetCount, beforeLargeEdit.componentCount, beforeLargeEdit.wireCount,
      beforeLargeEdit.crossSheetConnectionCount, beforeLargeEdit.openEndpointCount], [10, 250, 1290, 45, 0]);
    const largePage = await context.newPage();
    await largePage.goto(address);
    const openLargeDrawing = text => largePage.locator('#openFile').setInputFiles({
      name: 'Large-drawing-regression.adigun.json', mimeType: 'application/json', buffer: Buffer.from(text)
    });
    await openLargeDrawing(engine.serializeProject(largeDrawing));
    await largePage.locator('#projectTree [data-sheet="scale-9"]').click();
    const lastTerminal = largePage.locator('#userDrawings [data-object="scale-terminal-250"]');
    const originalColor = await lastTerminal.getAttribute('stroke');
    await lastTerminal.dispatchEvent('click', { bubbles: true });
    await largePage.locator('[data-style-object="scale-terminal-250"][data-drawing-style="stroke"]').evaluate(input => {
      input.value = '#4b367c';
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    assert.equal(await lastTerminal.getAttribute('stroke'), '#4b367c');
    await largePage.locator('[data-action="undo"]').click();
    assert.equal(await lastTerminal.getAttribute('stroke'), originalColor);
    await largePage.locator('[data-action="redo"]').click();
    assert.equal(await lastTerminal.getAttribute('stroke'), '#4b367c');
    await largePage.getByRole('button', { name: 'Electrical checks', exact: true }).click();
    for (const [label, name, content] of [
      ['Export device index CSV', 'device-index', /"A2\/0010","X250","Phoenix Contact","3212144"/],
      ['Export sheet index CSV', 'sheet-index', /"A2\/0010","Terminal routes 10","Electrical design"/]
    ]) {
      const pending = largePage.waitForEvent('download');
      await largePage.getByRole('button', { name: label }).click();
      const download = await pending;
      assert.equal(download.suggestedFilename(), 'adigun-electrical-' + name + '.csv');
      assert.match(fs.readFileSync(await download.path(), 'utf8'), content);
    }
    await largePage.keyboard.press('Control+Shift+S');
    await largePage.waitForFunction(() => window.__savedProjectWrites.length === 1);
    const largeSavedText = await largePage.evaluate(() => window.__savedProjectWrites[0]);
    const largeSaved = engine.parseProject(largeSavedText);
    assert.equal(largeSaved.valid, true, largeSaved.errors.join(' '));
    assert.deepEqual(engine.analyzeProject(largeSaved.project).globalNets, beforeLargeEdit.globalNets);
    await largePage.reload();
    await openLargeDrawing(largeSavedText);
    await largePage.locator('#projectTree [data-sheet="scale-9"]').click();
    assert.equal(await lastTerminal.getAttribute('stroke'), '#4b367c');
    await largePage.close({ runBeforeUnload: false });

    const denseDrawing = makeLargeDrawingFixture(1, 50);
    const densePage = await context.newPage();
    await densePage.goto(address);
    const importStarted = performance.now();
    await densePage.locator('#openFile').setInputFiles({
      name: 'Dense-sheet.adigun.json', mimeType: 'application/json', buffer: Buffer.from(engine.serializeProject(denseDrawing))
    });
    await densePage.locator('#userDrawings [data-object="scale-terminal-250"]').waitFor();
    const openMs = Math.round(performance.now() - importStarted);
    const cameraStats = await densePage.locator('#drawing').evaluate(async svg => {
      const bounds = svg.getBoundingClientRect();
      const geometry = svg.querySelector('#userDrawings');
      const nativeObjects = [...geometry.querySelectorAll(':scope > [data-object]')];
      const intervals = [];
      for (let index = 0; index < 12; index += 1) {
        const start = performance.now();
        svg.dispatchEvent(new WheelEvent('wheel', {
          clientX: Math.round(bounds.left + bounds.width / 2), clientY: Math.round(bounds.top + bounds.height / 2),
          deltaX: index % 2 ? 12 : 0, deltaY: index % 2 ? 0 : (index % 4 ? 100 : -100), cancelable: true
        }));
        await new Promise(resolve => requestAnimationFrame(resolve));
        intervals.push(performance.now() - start);
      }
      return { nativeObjectCount: nativeObjects.length, nativeNodesPreserved: nativeObjects.every(node => node.isConnected),
        medianCameraFrameMs: Number(intervals.sort((a, b) => a - b)[6].toFixed(1)), slowestCameraFrameMs: Number(Math.max(...intervals).toFixed(1)) };
    });
    assert.equal(cameraStats.nativeObjectCount, 1450);
    assert.equal(cameraStats.nativeNodesPreserved, true, 'camera motion does not rebuild the dense drawing');
    const denseTerminal = densePage.locator('#userDrawings [data-object="scale-terminal-125"]');
    await denseTerminal.dispatchEvent('dblclick', { bubbles: true });
    await densePage.locator('#openCommands').click();
    await densePage.locator('#commands').getByRole('button', { name: /Fit selection/ }).click();
    await densePage.getByRole('button', { name: 'Draw wire', exact: true }).click();
    const densePin = denseTerminal.locator('[data-component-pin="connection-2"]');
    const anchor = await densePin.evaluate(marker => {
      const point = new DOMPoint(Number(marker.getAttribute('cx')), Number(marker.getAttribute('cy'))).matrixTransform(marker.getScreenCTM());
      return { x: point.x, y: point.y };
    });
    await densePage.mouse.move(anchor.x, anchor.y + 8);
    const target = densePage.locator('[data-wire-pin-target="connection-2"]');
    const resolved = await target.evaluate(marker => {
      const point = new DOMPoint(Number(marker.getAttribute('cx')), Number(marker.getAttribute('cy'))).matrixTransform(marker.getScreenCTM());
      return { x: point.x, y: point.y };
    });
    assert.ok(Math.hypot(resolved.x - anchor.x, resolved.y - anchor.y) < 0.1,
      'dense sheet resolves the correct nearby terminal after camera changes: ' + JSON.stringify({ anchor, resolved }));
    const denseStats = { sheets: 1, components: 250, wireSegments: 1200, openMs, ...cameraStats };
    console.info('Dense Chromium drawing timings:', JSON.stringify(denseStats));
    if (process.env.CAD_SCREENSHOT_DIR) {
      fs.mkdirSync(process.env.CAD_SCREENSHOT_DIR, { recursive: true });
      fs.writeFileSync(path.join(process.env.CAD_SCREENSHOT_DIR, 'dense-drawing-timings.json'), JSON.stringify(denseStats, null, 2));
    }
    await densePage.close({ runBeforeUnload: false });

    const linkedExample = await context.newPage();
    const exampleLink = new URL(address);
    exampleLink.searchParams.set('example', 'terminal-marshalling');
    exampleLink.searchParams.set('sheet', 'marshalling-analog-pressure');
    await linkedExample.goto(exampleLink.href);
    await linkedExample.locator('#sheetTabs [data-sheet="marshalling-analog-pressure"][aria-selected="true"]').waitFor();
    await linkedExample.locator('#userDrawings [data-object="b2"]').waitFor();
    assert.match(await linkedExample.locator('#projectTree').innerText(), /Copy of Controller-to-field terminal marshalling/);
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: exampleLink.origin });
    await linkedExample.locator('#openCommands').click();
    await linkedExample.locator('#commands').getByRole('button', { name: /Copy source example sheet link/ }).click();
    await linkedExample.getByText('Source example sheet link copied.', { exact: true }).first().waitFor();
    assert.equal(await linkedExample.evaluate(() => navigator.clipboard.readText()), exampleLink.href);
    await context.clearPermissions();
    exampleLink.searchParams.set('sheet', 'missing-sheet');
    await linkedExample.goto(exampleLink.href);
    await linkedExample.getByText(/Example link could not be opened: The linked sheet/).first().waitFor();
    assert.equal(await linkedExample.locator('#sheetTabs .document-tab[data-sheet]').count(), 0);
    exampleLink.searchParams.set('sheet', 'marshalling-analog-pressure');
    await linkedExample.goto(exampleLink.href);
    const feedSegment = linkedExample.locator('#userDrawings [data-object="transducer-feed-1"]');
    const returnSegment = linkedExample.locator('#userDrawings [data-object="transducer-return-1"]');
    await feedSegment.waitFor({ state: 'attached' });
    const originalFeedColor = await feedSegment.getAttribute('stroke');
    const originalReturnColor = await returnSegment.getAttribute('stroke');
    const feedPoint = await feedSegment.evaluate(path => {
      const center = path.getPointAtLength(path.getTotalLength() / 2).matrixTransform(path.getScreenCTM());
      return { x: center.x, y: center.y };
    });
    await feedSegment.dispatchEvent('contextmenu', { bubbles: true, button: 2, clientX: feedPoint.x, clientY: feedPoint.y });
    await linkedExample.getByRole('menuitem', { name: 'Select wires on this net' }).dispatchEvent('click', { bubbles: true });
    const selectedWires = linkedExample.locator('#userDrawings path[data-object].selected-object');
    assert.equal(await selectedWires.count(), 4);
    await linkedExample.locator('[data-action="palette"]').click();
    await linkedExample.locator('#paletteSwatches [data-color="#ed3f38"]').click();
    assert.deepEqual(await selectedWires.evaluateAll(nodes=>nodes.map(node=>node.getAttribute('stroke'))), Array(4).fill('#ed3f38'));
    assert.equal(await returnSegment.getAttribute('stroke'), originalReturnColor);
    await linkedExample.keyboard.press('Control+z');
    assert.equal(await feedSegment.getAttribute('stroke'), originalFeedColor);
    await linkedExample.keyboard.press('Escape');
    const nearFeed = await feedSegment.evaluate(path => {
      const center = path.getPointAtLength(path.getTotalLength() / 2).matrixTransform(path.getScreenCTM());
      return { x: center.x, y: center.y + 3 };
    });
    await linkedExample.mouse.click(nearFeed.x, nearFeed.y);
    await linkedExample.locator('#rightPanel.open [data-style-object="transducer-feed-1"][data-drawing-style="stroke"]').waitFor({ timeout: 5000 });
    await linkedExample.getByRole('button', { name: 'Electrical checks', exact: true }).click();
    const wireSearch = linkedExample.getByRole('searchbox', { name: 'Find wires' });
    await wireSearch.fill('w-03:2 x23:1 sensor return');
    assert.equal(await linkedExample.locator('[data-wire-list-row]:visible').count(), 1);
    await linkedExample.getByRole('button', { name: 'Locate wire w03-core-2-target-1', exact: true }).waitFor();
    await wireSearch.fill('not-a-wire');
    await linkedExample.getByText('No wires match this search on the current sheet.').waitFor();
    await wireSearch.clear();
    await linkedExample.getByRole('button', { name: 'Locate wire transducer-return-1', exact: true }).click();
    assert.match(await returnSegment.getAttribute('class'), /selected-object/);
    await linkedExample.locator('#rightPanel.open [data-style-object="transducer-return-1"][data-drawing-style="stroke"]').waitFor();
    await linkedExample.close({ runBeforeUnload: false });

    const disconnectPage = await context.newPage();
    await disconnectPage.goto(new URL('?example=relay-test-bench', address).href);
    const disconnectGlyph = disconnectPage.locator('#userDrawings [data-object="x14"]');
    await disconnectGlyph.dispatchEvent('dblclick', { bubbles: true });
    const knifePosition = disconnectPage.getByLabel('Knife position', { exact: true });
    assert.equal(await knifePosition.inputValue(), 'closed');
    const initialSymbolTransform = await disconnectGlyph.getAttribute('transform');
    await knifePosition.press('ArrowLeft');
    assert.equal(await disconnectGlyph.getAttribute('transform'), initialSymbolTransform,
      'arrow keys in the properties dropdown do not nudge the selected symbol');
    await knifePosition.selectOption('open');
    await disconnectGlyph.locator('path[d="M-12 0L12 -11"]').waitFor({ state: 'attached' });
    await disconnectPage.getByRole('button', { name: 'Electrical checks', exact: true }).click();
    await disconnectPage.getByText('INFO · ERC-OPEN-DISCONNECT · X14 is modeled with its knife open.', { exact: true }).click();
    await disconnectPage.locator('[data-finding-object="x14"]').click();
    assert.equal(await knifePosition.inputValue(), 'open');
    await disconnectPage.locator('[data-action="undo"]').click();
    await disconnectGlyph.locator('path[d="M-12 0L12 0"]').waitFor({ state: 'attached' });
    await disconnectPage.close({ runBeforeUnload: false });

    const examplePage = await context.newPage();
    await examplePage.goto(address);
    const originalExample = await examplePage.evaluate(async () => fetch('examples/real-projects/siemens-sew-star-delta-reference.adigun.json').then(response => response.text()));
    await examplePage.locator('#editableExampleProjects [data-example-project]').first().waitFor({ timeout: 5000 }).catch(async () => {
      throw new Error('Project Explorer example catalog did not load: ' + await examplePage.locator('#editableExampleProjects').innerText());
    });
    const catalogProjects = JSON.parse(fs.readFileSync(path.join(__dirname, 'examples/real-projects/library.json'), 'utf8')).projects;
    const catalogRows = await examplePage.locator('#editableExampleProjects [data-example-project]').evaluateAll(nodes => nodes.map(node => ({ id: node.dataset.exampleProject, number: node.querySelector('b')?.textContent })));
    assert.deepEqual(catalogRows.map(row => row.id), catalogProjects.map(project => project.id), 'Project Explorer lists every catalog example in order');
    assert.deepEqual(catalogRows.map(row => row.number), catalogProjects.map((project, index) => String(index + 1).padStart(2, '0')));
    const validation = JSON.parse(fs.readFileSync(path.join(root, 'docs/reports/project-library-validation.json'), 'utf8'));
    const { sheetCount, connectedSheetCount, componentCount, wireCount } =
      validation.projects.find(project => project.id === 'sitop-24v-dc-distribution').metrics;
    await examplePage.locator('#projectSearch').fill(`DC distribution IEC-style ${sheetCount} sheets below project sheet targets`);
    const distributionRow = examplePage.locator('#editableExampleProjects [data-example-project="sitop-24v-dc-distribution"]');
    await distributionRow.waitFor();
    assert.equal(await examplePage.locator('#editableExampleProjects [data-example-project]').count(), 1);
    assert.match(await distributionRow.getAttribute('aria-description'), new RegExp(
      `${connectedSheetCount} electrically connected sheets.*${componentCount} components.*${wireCount} wire segments.*Model checks passed.*Below project sheet targets`
    ));
    assert.match(await distributionRow.locator('small').textContent(), /Below project sheet targets/);
    assert.equal(await distributionRow.locator('canvas').evaluate(canvas => {
      const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
      return pixels.some((value, index) => index % 4 === 3 && value > 0);
    }), true, 'the catalog preview draws native wire geometry');
    await examplePage.locator('#projectSearch').clear();
    for (const entry of catalogProjects) {
      const sourceText = fs.readFileSync(path.join(root, entry.path), 'utf8');
      const source = engine.parseProject(sourceText).project;
      const before = engine.analyzeProject(source);
      const component = entry.id === 'sitop-24v-dc-distribution'
        ? source.objects.find(object => object.id === 'b2')
        : source.objects.find(object => object.kind === 'component-instance');
      const sheetId = component.sheetId || source.sheets[0].id;
      const copyPage = await context.newPage();
      await copyPage.goto(address);
      await copyPage.locator('[data-example-project="' + entry.id + '"]').click();
      await copyPage.locator('#projectTree [data-section-row]').first().waitFor({ timeout: 5000 });
      assert.equal(await copyPage.locator('#projectTree [data-section-row]').count(), 4, entry.title + ' opens with the A1–A4 project sections');
      await copyPage.locator('#projectTree [data-sheet="' + sheetId + '"]').click();
      const drawn = copyPage.locator('#userDrawings [data-object="' + component.id + '"]');
      const inheritedGraphics = await copyPage.locator('#sheetDesign > :not(:first-child):not(#userDrawings):not(#customSheetFrame)')
        .evaluateAll(nodes => nodes.filter(node => getComputedStyle(node).display !== 'none').length);
      assert.equal(inheritedGraphics, 0, entry.title + ' shows only its native drawing content');
      await drawn.dispatchEvent('click', { bubbles: true });
      const originalStroke = await drawn.getAttribute('stroke');
      const color = component.stroke === '#4b367c' ? '#21645e' : '#4b367c';
      await copyPage.locator('[data-style-object="' + component.id + '"][data-drawing-style="stroke"]').evaluate((input, value) => {
        input.value = value;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }, color);
      assert.equal(await drawn.getAttribute('stroke'), color, entry.title + ' renders the edited component');
      const otherSheet = source.sheets.find(sheet => sheet.id !== sheetId);
      if (otherSheet) await copyPage.locator('#projectTree [data-sheet="' + otherSheet.id + '"]').click();
      await copyPage.locator('[data-action="undo"]').click();
      assert.equal(await drawn.getAttribute('stroke'), originalStroke, entry.title + ' restores the original component color on undo');
      if (otherSheet) await copyPage.locator('#projectTree [data-sheet="' + otherSheet.id + '"]').click();
      await copyPage.locator('[data-action="redo"]').click();
      assert.equal(await drawn.getAttribute('stroke'), color, entry.title + ' restores the edited component color on redo');
      await copyPage.keyboard.press('Control+Shift+S');
      await copyPage.waitForFunction(() => window.__savedProjectWrites.length === 1);
      const savedText = await copyPage.evaluate(() => window.__savedProjectWrites[0]);
      const saved = engine.parseProject(savedText);
      assert.equal(saved.valid, true, saved.errors.join(' '));
      const after = engine.analyzeProject(saved.project);
      assert.equal(after.valid, true, after.errors.join(' '));
      assert.deepEqual(after.globalNets, before.globalNets, entry.title + ' preserves exact net members');
      assert.equal(after.openEndpointCount, before.openEndpointCount);
      assert.equal(after.wireCount, before.wireCount);
      assert.equal(after.sheetCount, before.sheetCount);
      const fileName = entry.id + '-edited.adigun.json';
      await copyPage.locator('#openFile').setInputFiles({ name: fileName, mimeType: 'application/json', buffer: Buffer.from(savedText) });
      await copyPage.waitForFunction(name => document.querySelector('#toast').textContent.includes(name + ' opened.'), fileName);
      assert.equal(await drawn.getAttribute('stroke'), color, entry.title + ' restores the saved component appearance');

      const reports = [
        ['Bill of materials', '[data-export-bom]', 'bom.csv', engine.billOfMaterialsCsv(saved.project.objects)],
        ['Electrical checks', '[data-export-wire-list]', 'wire-list.csv', engine.wireListCsv(saved.project)],
        [null, '[data-export-terminal-list]', 'terminal-list.csv', engine.terminalListCsv(saved.project)],
        [null, '[data-export-electrical-report]', 'electrical-checks.json', JSON.stringify(engine.projectElectricalReport(saved.project), null, 2)]
      ];
      for (const [inspector, selector, reportName, expected] of reports) {
        if (inspector) await copyPage.getByRole('button', { name: inspector, exact: true }).click();
        const pending = copyPage.waitForEvent('download', { timeout: 10000 });
        await copyPage.locator(selector).click();
        const download = await pending;
        const actual = fs.readFileSync(await download.path(), 'utf8');
        assert.equal(actual, expected, entry.title + ' downloads the same ' + reportName + ' computed from the saved project');
        if (process.env.CAD_SCREENSHOT_DIR) {
          await download.saveAs(path.join(process.env.CAD_SCREENSHOT_DIR, entry.id + '-' + reportName));
        }
      }

      await copyPage.evaluate(() => { window.print = () => {}; });
      await copyPage.keyboard.press('Control+k');
      await copyPage.getByRole('button', { name: /Print project set/ }).click();
      const printSheets = copyPage.locator('#projectPrintSet [data-print-sheet]');
      assert.deepEqual(await printSheets.evaluateAll(pages => pages.map(page => page.dataset.printSheet)),
        saved.project.sheets.map(sheet => sheet.id), entry.title + ' prints the saved project in sheet order');
      assert.equal(await printSheets.locator('[data-title-block-row="sheet"]').count(), source.sheets.length);
      const printedComponent = printSheets.locator('[data-object="' + component.id + '"]');
      assert.equal(await printedComponent.getAttribute('stroke'), color, entry.title + ' prints the edited native component');
      if (entry.id === 'dol-reference-opening') {
        const printedLayout = copyPage.locator('#projectPrintSet [data-print-sheet="dol-reference-panel-layout"]');
        assert.equal(await printedLayout.locator('[data-object="dol-layout-plate-width"] text').textContent(), '400 mm');
        assert.equal(await printedLayout.locator('[data-object="dol-layout-plate-height"] text').textContent(), '300 mm');
      }
      const projectPdf = await copyPage.pdf({ preferCSSPageSize: true,
        ...(process.env.CAD_SCREENSHOT_DIR ? { path: path.join(process.env.CAD_SCREENSHOT_DIR, entry.id + '-print-set.pdf') } : {}) });
      assert.equal(projectPdf.subarray(0, 5).toString(), '%PDF-');
      const pdfPages = projectPdf.toString('latin1').match(/\/Type\s*\/Page\b/g) || [];
      assert.equal(pdfPages.length, source.sheets.length, entry.title + ' emits one PDF page per native sheet');
      await copyPage.evaluate(() => window.dispatchEvent(new Event('afterprint')));
      assert.equal(await copyPage.locator('#projectPrintSet').count(), 0);
      assert.equal(fs.readFileSync(path.join(root, entry.path), 'utf8'), sourceText, entry.title + ' leaves the catalog source unchanged');
      if (entry.id === 'sitop-24v-dc-distribution') {
        await copyPage.locator('#projectTree [data-sheet="field-indicator"]').click();
        await copyPage.locator('#userDrawings [data-object="field-indicator-h1"]').dispatchEvent('click', { bubbles: true });
        assert.match(await copyPage.locator('#inspectorContent').innerText(), /XB5AVB3.*24 V AC\/DC/s);
      }
      await copyPage.close({ runBeforeUnload: false });
    }
    await examplePage.getByRole('listitem', { name: 'Open Star-delta 100-sheet reference package as an editable copy' }).click();
    const componentId = 'cmp-6d8a901d-98ae-4054-88e1-06afaea9ffb0';
    await examplePage.locator('#projectTree [data-sheet="ref-006"]').waitFor();
    assert.equal(await examplePage.locator('#projectTree [data-section-row]').count(), 4, 'example copy keeps the A1–A4 section structure');
    await examplePage.locator('#projectTree [data-sheet="ref-007"]').click();
    const offPageConnector = examplePage.locator('#userDrawings .cross-sheet-connector').first();
    await offPageConnector.waitFor();
    await examplePage.getByRole('button', { name: 'Draw wire' }).click();
    await offPageConnector.locator('path').first().click();
    assert.equal(await examplePage.locator('#sheetTabs [data-sheet="ref-007"][aria-selected="true"]').count(), 1,
      'an off-page connector does not navigate away during wiring');
    await examplePage.keyboard.press('Escape');
    await examplePage.getByRole('button', { name: 'Select and move', exact: true }).click();
    await offPageConnector.locator('path').first().click();
    await examplePage.locator('#sheetTabs .document-tab[data-sheet="ref-009"][aria-selected="true"]').waitFor({ timeout: 5000 }).catch(async () => {
      const diagnostics = await examplePage.evaluate(() => JSON.stringify({ activeTabs: [...document.querySelectorAll('#sheetTabs .document-tab[aria-selected="true"]')].map(tab => tab.dataset.sheet), connectors: [...document.querySelectorAll('#userDrawings .cross-sheet-connector')].map(node => node.getAttribute('aria-label')) }));
      throw new Error('Mouse activation did not open the connector target: ' + diagnostics);
    });
    let selectedTarget = examplePage.locator('#userDrawings [data-object].selected-object').first();
    await selectedTarget.waitFor({ timeout: 5000 });
    assert.equal(await selectedTarget.getAttribute('data-object'), 'distribution-x14', 'mouse activation selects the target component');
    await examplePage.locator('#projectTree [data-sheet="ref-007"]').click();
    const keyboardConnector = examplePage.locator('#userDrawings .cross-sheet-connector').first();
    await keyboardConnector.focus();
    await examplePage.keyboard.press('Enter');
    await examplePage.locator('#sheetTabs .document-tab[data-sheet="ref-009"][aria-selected="true"]').waitFor({ timeout: 5000 });
    selectedTarget = examplePage.locator('#userDrawings [data-object].selected-object').first();
    await selectedTarget.waitFor({ timeout: 5000 });
    assert.equal(await selectedTarget.getAttribute('data-object'), 'distribution-x14', 'keyboard activation selects the target component');
    await examplePage.locator('#projectTree [data-sheet="ref-006"]').click();
    const component = examplePage.locator('#userDrawings [data-object="' + componentId + '"]');
    await component.waitFor();
    await component.dispatchEvent('click', { bubbles: true });
    await examplePage.locator('[aria-label="Properties"]').click();
    const overload = examplePage.locator('[data-component-property="overloadSettingA"][data-component-object="' + componentId + '"]');
    await overload.waitFor({ timeout: 5000 }).catch(async () => {
      const stateDump = await examplePage.evaluate(id => JSON.stringify({ tools: [...document.querySelectorAll('[data-tool]')].map(button => [button.dataset.tool, button.getAttribute('aria-pressed')]), element: document.querySelector('#userDrawings [data-object="' + id + '"]')?.outerHTML.slice(0, 250) }), componentId);
      throw new Error('Component editor did not render: ' + await examplePage.locator('#inspectorContent').innerText() + ' State: ' + stateDump);
    });
    await overload.fill('12.5');
    await examplePage.locator('[data-component-property="position"][data-component-object="' + componentId + '"]').fill('F2');
    await examplePage.locator('[data-action="palette"]').click();
    await examplePage.locator('#paletteSwatches [data-color="#ed3f38"]').click();
    const timerId = 'cmp-26019294-f36c-4d00-80ea-be2fe68ef09d';
    await examplePage.locator('#userDrawings [data-object="' + timerId + '"]').dispatchEvent('click', { bubbles: true });
    await examplePage.locator('[aria-label="Properties"]').click();
    await examplePage.locator('[data-component-property="delaySeconds"][data-component-object="' + timerId + '"]').fill('10');
    await examplePage.locator('[data-component-property="position"][data-component-object="' + timerId + '"]').fill('KT1');
    const sourceProject = JSON.parse(originalExample);
    const sourceWireIds = new Set(sourceProject.objects.filter(object => object.kind === 'wire').map(object => object.id));
    const sourceWireCount = sourceWireIds.size;
    const exampleCanvas = await examplePage.locator('#drawing').boundingBox();
    assert.ok(exampleCanvas && exampleCanvas.width > 100 && exampleCanvas.height > 100);
    const objectCountBeforeWire = await examplePage.locator('#userDrawings [data-object]').count();
    const browserErrors = [];
    examplePage.on('pageerror', error => browserErrors.push(error.stack || error.message));
    await examplePage.evaluate(() => {
      window.__wirePointerEvents = [];
      for (const type of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel']) {
        document.querySelector('#drawing').addEventListener(type, event => window.__wirePointerEvents.push({ type, x: event.clientX, y: event.clientY, button: event.button, target: event.target.tagName, targetClass: event.target.getAttribute('class') }), true);
      }
    });
    const wireTool = examplePage.getByRole('button', { name: 'Draw wire' });
    await wireTool.click();
    assert.equal(await wireTool.getAttribute('aria-pressed'), 'true', 'wire tool is active before drawing');
    await examplePage.mouse.move(exampleCanvas.x + exampleCanvas.width * 0.30, exampleCanvas.y + exampleCanvas.height * 0.30);
    await examplePage.mouse.down();
    await examplePage.mouse.move(exampleCanvas.x + exampleCanvas.width * 0.40, exampleCanvas.y + exampleCanvas.height * 0.40, { steps: 3 });
    await examplePage.mouse.up();
    await examplePage.waitForFunction(count => document.querySelectorAll('#userDrawings [data-object]').length > count, objectCountBeforeWire, { timeout: 5000 }).catch(async () => {
      const diagnostics = await examplePage.evaluate(() => JSON.stringify({ events: window.__wirePointerEvents, drawing: document.querySelector('#drawing').getBoundingClientRect().toJSON(), objects: document.querySelectorAll('#userDrawings [data-object]').length, toolPressed: document.querySelector('[data-draw="wire"]').getAttribute('aria-pressed') }));
      throw new Error('Wire drawing did not add a native object: ' + diagnostics + ' Browser errors: ' + JSON.stringify(browserErrors));
    });
    await examplePage.keyboard.press('Control+Shift+S');
    await examplePage.waitForFunction(() => window.__savedProjectWrites.length === 1);
    const exampleSavedText = await examplePage.evaluate(() => window.__savedProjectWrites[0]);
    const exampleSaved = JSON.parse(exampleSavedText);
    const editedComponent = exampleSaved.objects.find(object => object.id === componentId);
    const editedTimer = exampleSaved.objects.find(object => object.id === timerId);
    const savedWires = exampleSaved.objects.filter(object => object.kind === 'wire');
    const addedWire = savedWires.find(wire => !sourceWireIds.has(wire.id));
    assert.equal(exampleSaved.projectModel.name, ('Copy of '+sourceProject.project).slice(0,80));
    assert.equal(editedComponent.properties.overloadSettingA, 12.5);
    assert.equal(editedComponent.properties.position, 'F2');
    assert.equal(editedComponent.stroke, '#ed3f38');
    assert.equal(editedTimer.properties.delaySeconds, 10);
    assert.equal(editedTimer.properties.position, 'KT1');
    assert.equal(savedWires.length, sourceWireCount + 1, 'new editable wire is included in the native project');
    assert.ok(addedWire && addedWire.sheetId === 'ref-006', 'new wire belongs to the selected A2 sheet');
    assert.ok(exampleSaved.crossSheetConnections.length > 0, 'example electrical relationships remain in the saved copy');
    for (const link of exampleSaved.crossSheetConnections) {
      for (const endpoint of link.endpoints) {
        assert.ok(savedWires.some(wire => wire.id === endpoint.wireId && wire.sheetId === endpoint.sheetId), 'cross-sheet endpoints still resolve to their wires');
      }
    }
    assert.equal(await examplePage.evaluate(async () => fetch('examples/real-projects/siemens-sew-star-delta-reference.adigun.json').then(response => response.text())), originalExample, 'editing the copy must not change its source example');
    await examplePage.close({ runBeforeUnload: false });

    const breakerId = sourceProject.objects.find(object => object.ref === 'Q1').id;
    const offlineLibraryPage = await context.newPage();
    await offlineLibraryPage.goto(address);
    await offlineLibraryPage.waitForFunction(() => !!navigator.serviceWorker.controller);
    shellOutage = true;
    try {
      await offlineLibraryPage.reload();
      await offlineLibraryPage.locator('[data-example-project="star-delta-100-sheet"]').click();
      await offlineLibraryPage.locator('#projectTree [data-sheet="ref-006"]').click();
      await offlineLibraryPage.locator('#userDrawings [data-object="' + breakerId + '"]').waitFor();
      assert.deepEqual([...outageRequests].sort(), ['cad-engine.js', 'index.html'], 'both cached shell resources were needed during the outage');
    } finally {
      shellOutage = false;
    }
    await context.setOffline(true);
    try {
      await offlineLibraryPage.reload();
      await offlineLibraryPage.locator('[data-example-project="star-delta-100-sheet"]').click();
      await offlineLibraryPage.locator('#projectTree [data-sheet="ref-006"]').click();
      await offlineLibraryPage.locator('#userDrawings [data-object="' + breakerId + '"]').waitFor();
    } finally {
      await context.setOffline(false);
      await offlineLibraryPage.close({ runBeforeUnload: false });
    }

    const reopenedExample = await context.newPage();
    await reopenedExample.goto(address);
    await reopenedExample.locator('#openFile').setInputFiles({
      name: 'Editable-star-delta-browser-copy.adigun.json',
      mimeType: 'application/json',
      buffer: Buffer.from(exampleSavedText)
    });
    await reopenedExample.locator('#projectTree [data-sheet="ref-006"]').waitFor();
    await reopenedExample.locator('#userDrawings [data-object="' + componentId + '"]').dispatchEvent('click', { bubbles: true });
    await reopenedExample.locator('[aria-label="Properties"]').click();
    assert.equal(await reopenedExample.locator('[data-component-property="overloadSettingA"][data-component-object="' + componentId + '"]').inputValue(), '12.5');
    assert.equal(await reopenedExample.locator('[data-component-property="position"][data-component-object="' + componentId + '"]').inputValue(), 'F2');
    assert.equal(await reopenedExample.locator('#userDrawings [data-object="' + componentId + '"]').getAttribute('stroke'), '#ed3f38', 'component color survives reopen');
    await reopenedExample.locator('#userDrawings [data-object="' + timerId + '"]').dispatchEvent('click', { bubbles: true });
    await reopenedExample.locator('[aria-label="Properties"]').click();
    assert.equal(await reopenedExample.locator('[data-component-property="delaySeconds"][data-component-object="' + timerId + '"]').inputValue(), '10');
    assert.equal(await reopenedExample.locator('[data-component-property="position"][data-component-object="' + timerId + '"]').inputValue(), 'KT1');
    assert.ok(await reopenedExample.locator('#userDrawings [data-object="' + addedWire.id + '"]').count() > 0, 'added wire geometry survives reopen');
    await reopenedExample.locator('#projectTree [data-sheet="ref-007"]').click();
    const spareOutputLink = reopenedExample.getByRole('link', { name: /Q0\.1 spare field output/ });
    await spareOutputLink.press('Enter');
    await reopenedExample.locator('#sheetTabs [data-sheet="ref-019"][aria-selected="true"]').waitFor();
    const spareTerminal = reopenedExample.locator('#userDrawings [data-object="a1-019-xt6-x22"]');
    assert.match(await spareTerminal.getAttribute('class'), /selected-object/, 'the cross-reference selects X22');
    const spareWire = reopenedExample.locator('#userDrawings [data-object="a1-019-xt6-x22-receive"]');
    const beforeMove = await spareWire.getAttribute('d');
    await reopenedExample.keyboard.press('ArrowDown');
    assert.notEqual(await spareWire.getAttribute('d'), beforeMove, 'moving X22 updates the routed endpoint');
    await reopenedExample.getByRole('link', { name: /Q0\.1 spare field output/ }).press('Enter');
    await reopenedExample.locator('#sheetTabs [data-sheet="ref-007"][aria-selected="true"]').waitFor();
    assert.match(await reopenedExample.locator('#userDrawings [data-object="sensor-plc-a1"]').getAttribute('class'), /selected-object/);
    await reopenedExample.keyboard.press('Control+Shift+S');
    await reopenedExample.waitForFunction(() => window.__savedProjectWrites.length === 1);
    const xt6Copy = engine.parseProject(await reopenedExample.evaluate(() => window.__savedProjectWrites[0]));
    assert.equal(xt6Copy.valid, true, xt6Copy.errors.join(' '));
    const output = engine.analyzeProject(xt6Copy.project).globalNets.find(net => net.pins.some(pin => pin.ref === 'X22'));
    assert.deepEqual(output.pins.map(pin => pin.ref + ':' + pin.number).sort(), ['A1:X12:4', 'X22:1', 'X22:2']);
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
  assert.deepEqual(engine.setProjectSheetPaperFormat(power, 'Custom', 'portrait', { width: 470, height: 315 }), { width: 470, height: 315 });
  assert.equal(power.orientation, 'landscape');
  assert.throws(() => engine.setProjectSheetPaperFormat(power, 'Custom', 'landscape', { width: 0, height: 315 }), /positive numbers/);
  assert.equal(power.paperWidthMm, 470);
  engine.setProjectSheetPaperFormat(power, 'A3', 'landscape');
  assert.equal(engine.setProjectSheetDrawingScale(power, ' 1 : 2 '), '1:2');
  assert.equal(engine.projectSheetDrawingScaleFactor(power), 0.5);
  assert.throws(() => engine.setProjectSheetDrawingScale(power, '1:0'), /positive ratio/);
  assert.equal(engine.projectSheetDrawingScaleFactor(power), 0.5);
  assert.equal(engine.setProjectSheetDrawingScale(power, 'Fit to page'), 'Fit to page');
  assert.equal(power.drawingFitToPage, true);
  assert.equal(engine.projectSheetDrawingScaleFactor({ scale: '1:2' }), 1, 'legacy title labels do not scale drawings');

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

test('moving a sheet before another preserves the requested position within a section', () => {
  const project = engine.createProjectModel('sheet-order', 'Sheet order');
  for (const id of ['first', 'second', 'third']) engine.addProjectSheet(project, 'A2', id, id);
  engine.moveProjectSheet(project, 'first', 'A2', 1);
  assert.deepEqual(project.sheets.map(sheet => [sheet.id, sheet.number]), [
    ['second', 'A2/0001'], ['first', 'A2/0002'], ['third', 'A2/0003']
  ]);
  engine.moveProjectSheet(project, 'first', 'A4');
  assert.deepEqual(project.sheets.map(sheet => [sheet.id, sheet.number]), [
    ['second', 'A2/0001'], ['third', 'A2/0002'], ['first', 'A4/0003']
  ]);
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
  assert.deepEqual(project.crossSheetConnections, []);
  assert.equal(project.diagnostics[0].type, 'unresolved-cross-sheet-reference');
  assert.equal(project.diagnostics[0].connectionId, 'link-1');
  assert.equal(project.diagnostics[0].connection.endpoints[1].sheetId, layout.id);
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
  const edited = engine.copyExampleProject(first.project, 'linked-sheet-removal', 'Linked sheet removal');
  const originalConnection = edited.crossSheetConnections[0];
  engine.deleteProjectSheet(edited.projectModel, target.id);
  edited.sheets = edited.projectModel.sheets;
  edited.objects = edited.objects.filter(object => object.sheetId !== target.id);
  edited.crossSheetConnections = edited.projectModel.crossSheetConnections;
  const afterDeletion = engine.parseProject(engine.serializeProject(edited));
  assert.equal(afterDeletion.valid, true);
  assert.deepEqual(afterDeletion.project.crossSheetConnections, []);
  assert.deepEqual(afterDeletion.project.projectModel.diagnostics[0].connection, originalConnection);
  assert.equal(engine.analyzeProject(afterDeletion.project).openEndpointCount, 2);
  const electrical = engine.projectElectricalReport(afterDeletion.project);
  assert.equal(electrical.analysisComplete, true);
  assert.equal(electrical.summary.resolvedCrossSheetLinks, 0);
  const unresolvedLink = electrical.findings.find(finding => finding.ruleId === 'ERC-UNRESOLVED-CROSS-SHEET-REFERENCE');
  assert.match(unresolvedLink.message, /net-24v-1/);
  assert.deepEqual(unresolvedLink.locations, [{ sheetId: source.id, objectId: 'wire-source' }]);
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
  assert.deepEqual(
    engine.fitDrawingToPage({ left: 0, top: 20, right: 100, bottom: 20 }, 420, 297, 10, 62),
    { scale: 4, x: 10, y: 37.5 }
  );
});

test('every published catalog example opens as an independent sectioned native copy', () => {
  const catalog = JSON.parse(fs.readFileSync(path.join(__dirname, 'examples/real-projects/library.json'), 'utf8'));
  assert.ok(catalog.projects.length >= 8);
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

test('SITOP circuit source reproduces the published sheets', () => {
  execFileSync(process.execPath, [path.join(__dirname, 'scripts/author-sitop-sheets.js')]);
});

test('terminal-marshalling project regenerates and keeps its three field cable cores separate', () => {
  execFileSync(process.execPath, [path.join(__dirname, 'scripts/author-terminal-marshalling.js')]);
  const file = path.join(__dirname, 'examples/real-projects/terminal-marshalling.adigun.json');
  const project = engine.parseProject(fs.readFileSync(file, 'utf8')).project;
  const analysis = engine.analyzeProject(project);
  const nets = ['1', '3', '4'].map(number => analysis.globalNets.find(net => net.pins.some(pin => pin.ref === 'B1' && pin.number === number)));
  assert.equal(new Set(nets.map(net => net.id)).size, 3);
  for (const [net, terminal] of nets.map((net, index) => [net, ['X10:4', 'X10:5', 'X10:7'][index]])) {
    assert.ok(net.pins.some(pin => pin.ref === 'A1' && pin.number === terminal));
    const sheets = ['marshalling-cabinet', 'marshalling-field'];
    if (terminal === 'X10:4') sheets.push('marshalling-operator-station');
    if (terminal === 'X10:5') sheets.push('marshalling-analog-pressure', 'marshalling-field-indicator');
    assert.deepEqual([...net.sheetIds].sort(), sheets.sort());
  }
  const start = analysis.globalNets.find(net => net.pins.some(pin => pin.ref === 'S1' && pin.number === '14'));
  const stop = analysis.globalNets.find(net => net.pins.some(pin => pin.ref === 'S2' && pin.number === '22'));
  assert.notEqual(start.id, stop.id);
  assert.deepEqual(start.pins.map(pin => pin.ref + ':' + pin.number).sort(), ['A1:X10:8', 'S1:14', 'X11:1', 'X11:2', 'X8:1', 'X8:2']);
  assert.deepEqual(stop.pins.map(pin => pin.ref + ':' + pin.number).sort(), ['A1:X10:9', 'S2:22', 'X12:1', 'X12:2', 'X9:1', 'X9:2']);
  const pe = analysis.globalNets.find(net => net.pins.some(pin => pin.ref === 'X13'));
  assert.notEqual(pe.id, nets[1].id, 'PE is separate from the 0 V control return');
  assert.equal(new Set(pe.sheetIds).size, 4);
  assert.deepEqual([...new Set(pe.pins.map(pin => pin.ref))].sort(), ['X13', 'X14', 'X15', 'X16', 'X17', 'X18']);
  assert.ok(!analysis.findings.some(finding => finding.ruleId === 'ERC-PE-DESIGNATION-MISSING'));
  const pressureNets = ['1', '2', '3', '4'].map(number =>
    analysis.globalNets.find(net => net.pins.some(pin => pin.ref === 'B2' && pin.number === number))
  );
  const [feed, signal, reference, unused] = pressureNets;
  assert.equal(new Set([feed.id, signal.id, reference.id]).size, 3);
  assert.ok(feed.pins.some(pin => pin.ref === 'A1' && pin.number === 'X10:1'));
  assert.deepEqual(signal.pins.map(pin => pin.ref + ':' + pin.number).sort(),
    ['A1:X11:2', 'B2:2', 'X21:1', 'X21:2', 'X24:1', 'X24:2']);
  assert.equal(reference.id, nets[1].id);
  assert.ok(reference.pins.some(pin => pin.ref === 'A1' && pin.number === 'X11:1'));
  assert.equal(unused, undefined);
  const lampOutput = analysis.globalNets.find(net => net.pins.some(pin => pin.ref === 'H1' && pin.number === 'X1'));
  assert.deepEqual(lampOutput.pins.map(pin => pin.ref + ':' + pin.number).sort(),
    ['A1:X12:3', 'H1:X1', 'X25:1', 'X25:2', 'X27:1', 'X27:2']);
  assert.ok(feed.pins.some(pin => pin.ref === 'A1' && pin.number === 'X12:1'));
  assert.ok(reference.pins.some(pin => pin.ref === 'A1' && pin.number === 'X12:2'));
  assert.ok(reference.pins.some(pin => pin.ref === 'H1' && pin.number === 'X2'));
  assert.equal(analysis.openEndpointCount, 0);
  assert.equal(engine.cableScheduleCsv(project).trim().split('\r\n').length, 23);
});

test('relay test bench regenerates with separate coil and indication supplies', () => {
  execFileSync(process.execPath, [path.join(__dirname, 'scripts/author-relay-test-bench.js')]);
  const file = path.join(__dirname, 'examples/real-projects/relay-test-bench.adigun.json');
  const project = engine.parseProject(fs.readFileSync(file, 'utf8')).project;
  const report = engine.analyzeProject(project);
  assert.deepEqual([report.sheetCount, report.crossSheetConnectionCount, report.openEndpointCount, report.geometryErrorCount], [11, 19, 0, 0]);
  const matrix = project.objects.filter(object => object.sheetId === 'bench-indication-matrix');
  const matrixRow = row => matrix.filter(object => object.id.startsWith('bench-matrix-' + row + '-')).map(object => object.text);
  assert.deepEqual(matrixRow(2), ['Coil command', 'Closed', 'Pressed', 'Closed', 'On', 'On', 'Off', 'On']);
  assert.deepEqual(matrixRow(5), ['Indicator feed open, commanded', 'Closed', 'Pressed', 'Open', 'On', 'Off', 'Off', 'Off']);
  const membership = analysis => analysis.globalNets.map(net => net.pins.map(pin => pin.ref + ':' + pin.number).sort().join(',')).sort();
  assert.deepEqual(membership(report), [
    'H1:X1,K1:12,X7:1,X7:2', 'H1:X2,H2:X2,H5:X2,H6:X2,X13:1,X13:2,X17:1,X17:2,X25:1,X25:2,X4:1,X4:2,X9:1,X9:2',
    'H2:X1,K1:14,X8:1,X8:2', 'H5:X1,H6:X1,K1:11,X12:1,X12:2,X15:1,X15:2,X16:1,X16:2,X24:1,X24:2,X3:1,X3:2',
    'H3:X1,K1:A1,S1:14,X5:1,X5:2', 'H3:X2,H4:X2,K1:A2,PS1:-,X11:1,X11:2,X2:1,X2:2,X6:1,X6:2',
    'H4:X1,PS1:+,S1:13,X10:1,X10:2,X14:1,X14:2,X1:1,X1:2',
    'PS1:L,X18:1,X18:2', 'PS1:N,X19:1,X19:2',
    'PS1:PE,X20:1,X20:2,X21:1,X21:2,X22:1,X22:2,X23:1,X23:2'
  ].sort());
  const disconnect = project.objects.find(object => object.ref === 'X14');
  disconnect.properties.knifePosition = 'open';
  const reopened = engine.parseProject(engine.serializeProject(project));
  assert.equal(reopened.valid, true);
  const opened = engine.analyzeProject(reopened.project);
  const openedNets = membership(opened);
  assert.ok(!report.findings.some(finding => finding.ruleId === 'ERC-OPEN-DISCONNECT'));
  assert.deepEqual(opened.findings.filter(finding => finding.ruleId === 'ERC-OPEN-DISCONNECT')
    .map(finding => [finding.severity, finding.locations[0].objectId]), [['info', 'x14']]);
  assert.ok(openedNets.includes('S1:13,X14:2'));
  const indicatorOpen = structuredClone(project);
  indicatorOpen.objects.find(object => object.ref === 'X14').properties.knifePosition = 'closed';
  indicatorOpen.objects.find(object => object.ref === 'X15').properties.knifePosition = 'open';
  const indicatorOpenNets = membership(engine.analyzeProject(indicatorOpen));
  assert.ok(indicatorOpenNets.includes('H6:X1,K1:11,X15:2,X16:1,X16:2'));
  assert.ok(indicatorOpenNets.includes('H5:X1,X12:1,X12:2,X15:1,X24:1,X24:2,X3:1,X3:2'));
  assert.ok(indicatorOpenNets.includes('H4:X1,PS1:+,S1:13,X10:1,X10:2,X14:1,X14:2,X1:1,X1:2'));
  const bypassedProject = structuredClone(reopened.project);
  const [left, right] = engine.worldPins(disconnect);
  bypassedProject.objects.push({
    id: 'disconnect-bypass', kind: 'wire', sheetId: disconnect.sheetId, x: left.x, y: left.y,
    x1: left.x, y1: left.y, x2: right.x, y2: right.y,
    bends: [{ x: left.x, y: left.y + 30 }, { x: right.x, y: right.y + 30 }],
    pinAttachments: { start: { instanceId: disconnect.id, pinId: left.id }, end: { instanceId: disconnect.id, pinId: right.id } }
  });
  const bypassed = engine.analyzeProject(bypassedProject);
  assert.equal(bypassed.valid, true);
  assert.deepEqual(bypassed.findings.filter(finding => finding.ruleId === 'ERC-BYPASSED-DISCONNECT')
    .map(finding => [finding.severity, finding.locations[0].objectId]), [['warning', 'x14']]);
  assert.ok(openedNets.includes('H4:X1,PS1:+,X10:1,X10:2,X14:1,X1:1,X1:2'));
  assert.equal(engine.validateInstance({ ...disconnect, properties: { ...disconnect.properties, knifePosition: 'invalid' } }).valid, false);
  const schedule = engine.cableScheduleCsv(project);
  for (const core of ['1', '2', '3']) {
    assert.ok(schedule.includes(`"W-T01","${core}","bench-coil-actuation","fixture-core-${core}-relay"`));
    const destination = core === '1' ? 'bench-indicator-disconnect' : 'bench-contact-indication';
    assert.ok(schedule.includes(`"W-T01","${core}","${destination}","fixture-core-${core}-indicator"`));
  }
});

test('PE designation check follows the connected net across sheets', () => {
  const fixture = path.join(__dirname, 'examples/real-projects/sitop-24v-dc-distribution.adigun.json');
  const project = JSON.parse(fs.readFileSync(fixture, 'utf8'));
  const peFinding = () => engine.analyzeProject(project).findings.find(finding => finding.ruleId === 'ERC-PE-DESIGNATION-MISSING');
  assert.equal(peFinding(), undefined);
  const peWires = project.objects.filter(object => object.kind === 'wire' && object.potential === 'PE');
  assert.equal(new Set(peWires.map(wire => wire.sheetId)).size, 3);
  for (const wire of peWires) delete wire.potential;
  const warning = peFinding();
  assert.equal(warning.severity, 'warning');
  assert.equal(warning.editionMapping, null);
  assert.deepEqual(warning.locations.map(pin => pin.ref + ':' + pin.pinNumber).sort(), ['PS1:PE', 'X21:1', 'X21:2', 'X9:1', 'X9:2']);
  peWires[0].potential = 'Protective earth';
  assert.equal(peFinding(), undefined, 'one designation applies to the complete connected net');
});

test('SITOP distribution keeps both terminal branches on separate supply and return nets', () => {
  const file = path.join(__dirname, 'examples/real-projects/sitop-24v-dc-distribution.adigun.json');
  const source = engine.parseProject(fs.readFileSync(file, 'utf8'));
  assert.equal(source.valid, true, source.errors.join(' '));
  const copy = engine.copyExampleProject(source.project, 'distribution-test', 'Editable distribution');
  const reopened = engine.parseProject(engine.serializeProject(copy));
  const report = engine.analyzeProject(reopened.project);
  assert.deepEqual([report.sheetCount, report.crossSheetConnectionCount, report.openEndpointCount], [32, 78, 0]);
  const membership = groups => groups.map(pins => pins.sort().join(',')).sort();
  assert.deepEqual(membership(report.globalNets.map(net => net.pins.map(pin => pin.ref + ':' + pin.number))), membership([
    ['X7:1', 'X7:2', 'PS1:L'],
    ['X8:1', 'X8:2', 'PS1:N'],
    ['X21:1', 'X21:2', 'X9:1', 'X9:2', 'PS1:PE'],
    ['B1:1', 'B2:1', 'KM1:13', 'KM1:21', 'X1:1', 'X1:2', 'X2:1', 'X2:2', 'X5:1', 'X5:2', 'X13:1', 'X13:2', 'X19:1', 'X19:2', 'A1:X10:1', 'A1:X12:1', 'K1:11', 'S1:13', 'S2:21', 'PS1:+', 'X26:1', 'X26:2', 'H2:X1', 'B3:1', 'K4:A1', 'X42:1', 'X42:2'],
    ['B1:3', 'B2:3', 'KM1:A2', 'X3:1', 'X3:2', 'X4:1', 'X4:2', 'X14:1', 'X14:2', 'A1:X10:2', 'A1:X10:6', 'A1:X11:1', 'A1:X12:2', 'K1:A2', 'K2:A2', 'K3:A2', 'PS1:-', 'X23:1', 'X23:2', 'X27:1', 'X27:2', 'H2:X2', 'B3:3', 'K4:A2', 'X44:1', 'X44:2', 'X47:1', 'X47:2', 'K5:A2'],
    ['B1:4', 'X15:1', 'X15:2', 'A1:X10:7'],
    ['B2:2', 'X11:1', 'X11:2', 'A1:X11:2'],
    ['X22:1', 'X22:2', 'A1:X11:3', 'B3:2', 'X43:1', 'X43:2'],
    ['B2:4', 'X12:1', 'X12:2', 'A1:X10:13'],
    ['B3:4', 'X45:1', 'X45:2', 'X46:1', 'X46:2', 'K5:A1'],
    ['K5:11', 'X48:1', 'X48:2', 'X50:1', 'X50:2'],
    ['K5:14', 'X49:1', 'X49:2', 'H6:X1'],
    ['H6:X2', 'X51:1', 'X51:2'],
    ['KM1:A1', 'K1:14'],
    ['KM1:14', 'A1:X10:8'],
    ['A1:X12:3', 'K1:A1'],
    ['A1:X10:9', 'S1:14'],
    ['A1:X10:10', 'S2:22'],
    ['X6:1', 'X6:2', 'KM1:22', 'A1:X10:11'],
    ['K1:12', 'X10:1', 'X10:2', 'A1:X10:12'],
    ['A1:X12:4', 'K2:A1'],
    ['A1:X12:5', 'K3:A1'],
    ['K3:11', 'X24:1', 'X24:2', 'X28:1', 'X28:2'],
    ['K3:14', 'X25:1', 'X25:2', 'H1:X1'],
    ['H1:X2', 'X29:1', 'X29:2'],
    ['K2:11', 'X16:1', 'X16:2'],
    ['K2:12', 'X17:1', 'X17:2'],
    ['K2:14', 'X18:1', 'X18:2'],
    ['K4:11', 'X30:1', 'X30:2', 'X33:1', 'X33:2', 'X40:1', 'X40:2', 'H5:X1'],
    ['K4:12', 'X31:1', 'X31:2', 'X35:1', 'X35:2', 'X36:1', 'X36:2', 'H3:X1'],
    ['K4:14', 'X32:1', 'X32:2', 'X38:1', 'X38:2', 'X39:1', 'X39:2', 'H4:X1'],
    ['H3:X2', 'H4:X2', 'X34:1', 'X34:2', 'X37:1', 'X37:2', 'X41:1', 'X41:2', 'H5:X2'],
    ['X20:1', 'X20:2', 'A1:X10:14']
  ]));
  const io = engine.plcIoList(reopened.project);
  assert.equal(io.valid, true);
  assert.equal(io.rows.length, 16);
  assert.deepEqual(io.rows.filter(row => row.netId).map(row => row.terminal),
    ['X10:7', 'X10:8', 'X10:9', 'X10:10', 'X10:11', 'X10:12', 'X10:13', 'X10:14', 'X11:2', 'X11:3', 'X12:3', 'X12:4', 'X12:5']);
  assert.match(io.rows.find(row => row.terminal === 'X11:2').connectedPins[0], / B2:2$/);
  const cables = engine.cableScheduleCsv(reopened.project);
  assert.equal(cables.trim().split('\r\n').length, 26);
  for (const core of ['1', '2']) {
    assert.ok(cables.includes(`"W-H6","${core}","b3-switching-relay","b3-pressure-status-lamp-core-${core}-relay"`));
    assert.ok(cables.includes(`"W-H6","${core}","b3-pressure-status-lamp","b3-pressure-status-lamp-core-${core}-indicator"`));
  }
  for (const [core, route] of [['1', 'power'], ['2', 'signal'], ['3', 'return'], ['4', 'switch']]) {
    assert.ok(cables.includes(`"W-B3","${core}","b3-field-terminations","ai1-pressure-sensor-${route}-cable-send"`));
    assert.ok(cables.includes(`"W-B3","${core}","ai1-pressure-sensor","ai1-pressure-sensor-${route}"`));
  }
  for (const core of ['1', '2', '3']) {
    assert.match(cables, new RegExp('"W-H3","' + core + '","branch-b-loss-alert","branch-b-remote-indicator-core-' + core + '-send"'));
    assert.match(cables, new RegExp('"W-H3","' + core + '","branch-b-remote-indicator","branch-b-remote-indicator-core-' + core + '-receive"'));
  }
  assert.match(cables, /"W-B1","4","branch-a","b1-signal-send"/);
  assert.match(cables, /"W-B2","2","branch-b","b2-signal-send"/);
  assert.match(cables, /"W-B2","4","branch-b","b2-switch-send"/);
  assert.ok(report.findings.every(finding => !finding.ruleId.includes('CABLE-CORE')));
  const edited = structuredClone(reopened.project);
  Object.assign(edited.objects.find(object => object.id === 'a-positive-send'), { cableId: 'W-B1', coreId: '1' });
  assert.ok(engine.analyzeProject(edited).findings.every(finding => !finding.ruleId.includes('CABLE-CORE')));
  Object.assign(edited.objects.find(object => object.id === 'a-return-receive'), { cableId: 'w-b1', coreId: '1' });
  delete edited.objects.find(object => object.id === 'b2-signal-send').cableId;
  const findings = engine.analyzeProject(edited).findings;
  const conflict = findings.find(finding => finding.ruleId === 'ERC-CABLE-CORE-DISCONNECTED');
  assert.equal(conflict.severity, 'error');
  assert.deepEqual(conflict.locations.map(location => location.objectId).sort(),
    ['a-positive-receive', 'a-positive-send', 'a-return-receive']);
  assert.ok(findings.some(finding => finding.ruleId === 'ERC-INCOMPLETE-CABLE-CORE'
    && finding.locations[0].objectId === 'b2-signal-send'));
  const terminal = edited.objects.find(object => object.id === 'x6');
  Object.assign(terminal.properties, { terminalStrip: ' xt1 ', position: '1' });
  const positionConflict = engine.analyzeProject(edited).findings.find(finding => finding.ruleId === 'ERC-TERMINAL-POSITION-CONFLICT');
  assert.deepEqual(positionConflict.locations.map(location => [location.sheetId, location.objectId]), [
    ['distribution', 'x1'], ['auxiliary-marshalling', 'x6']
  ]);
  const wrongInputs = structuredClone(reopened.project);
  const ai = wrongInputs.crossSheetConnections.find(link => link.id === 'plc-b2-ai0');
  const di = wrongInputs.crossSheetConnections.find(link => link.id === 'plc-b2-di6');
  [ai.endpoints[0], di.endpoints[0]] = [di.endpoints[0], ai.endpoints[0]];
  const wrongReport = engine.analyzeProject(wrongInputs);
  assert.equal(wrongReport.openEndpointCount, 0);
  const mismatches = wrongReport.findings.filter(finding => finding.ruleId === 'ERC-PLC-INPUT-TYPE-MISMATCH');
  assert.deepEqual(mismatches.map(finding => finding.locations.map(location => location.ref + ':' + location.pinNumber).join(',')).sort(),
    ['B2:2,A1:X10:13', 'B2:4,A1:X11:2']);
});

test('multi-sheet reference examples classify overview, circuits, installation, and reports by section', () => {
  const cases = [
    { file: 'siemens-schneider-sew-dol-reference.adigun.json', counts: { A1: 6, A2: 19, A3: 5, A4: 70 }, sections: { 'dol-reference-001': 'A2', 'dol-reference-002': 'A1', 'dol-reference-021': 'A3', 'dol-reference-panel-layout': 'A3', 'dol-reference-024': 'A4', 'dol-reference-095': 'A2', 'dol-reference-096': 'A2', 'dol-reference-097': 'A2', 'dol-reference-098': 'A2', 'dol-reference-099': 'A2' } },
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
      const thermalSheet = parsed.project.sheets.find(sheet => sheet.id === 'dol-reference-095');
      assert.equal(thermalSheet.number, 'A2/095');
      assert.equal(thermalSheet.projectSectionId, 'A2');
      const copiedThermalSheet = copy.projectModel.sheets.find(sheet => sheet.id === 'dol-reference-095');
      assert.equal(copiedThermalSheet.sectionId, 'A2');
      assert.equal(copiedThermalSheet.number, 'A2/0021', 'source A2/095 keeps the A2 prefix at its project-order position in an editable copy');
      assert.ok(copy.projectModel.sheets.every(sheet => sheet.number.startsWith(sheet.sectionId + '/')), 'editable copies assign sheet numbers within their A1–A4 sections');
      const thermalText = parsed.project.objects.filter(object => object.sheetId === thermalSheet.id && object.kind === 'text').map(object => object.text).join(' ');
      assert.match(thermalText, /thermal class 130 \(B\)/i);
      assert.match(thermalText, /155 \(F\).*180 \(H\).*available on request/i);
      assert.match(thermalText, /does not identify the thermal class ordered/i);
      assert.match(thermalText, /30590116\/EN.*section 5\.7.*p\. 199/);
      const sensorOptionSheet = parsed.project.sheets.find(sheet => sheet.id === 'dol-reference-096');
      assert.equal(sensorOptionSheet.number, 'A2/096');
      assert.equal(sensorOptionSheet.projectSectionId, 'A2');
      const copiedSensorOptionSheet = copy.projectModel.sheets.find(sheet => sheet.id === 'dol-reference-096');
      assert.equal(copiedSensorOptionSheet.sectionId, 'A2');
      assert.equal(copiedSensorOptionSheet.number, 'A2/0022', 'source A2/096 follows A2/095 in A2 project-order numbering');
      const sensorOptionText = parsed.project.objects.filter(object => object.sheetId === sensorOptionSheet.id && object.kind === 'text').map(object => object.text).join(' ');
      assert.match(sensorOptionText, /\/TF.*PTC thermistor.*56–315/i);
      assert.match(sensorOptionText, /\/TH.*bimetallic switch.*56–315/i);
      assert.match(sensorOptionText, /\/PK.*Pt1000.*63–315/i);
      assert.match(sensorOptionText, /\/PT.*Pt100 sensor.*63–315/i);
      assert.match(sensorOptionText, /does not identify an option fitted to this M1/i);
      assert.match(sensorOptionText, /30590116\/EN.*section 3\.2\.2.*p\. 66/);
      const layoutSheet = parsed.project.sheets.find(sheet => sheet.id === 'dol-reference-panel-layout');
      assert.equal(layoutSheet.projectSectionId, 'A3');
      const layoutObjects = parsed.project.objects.filter(object => object.sheetId === layoutSheet.id);
      const plate = layoutObjects.find(object => object.id === 'dol-layout-enclosure');
      const width = layoutObjects.find(object => object.id === 'dol-layout-plate-width');
      const height = layoutObjects.find(object => object.id === 'dol-layout-plate-height');
      assert.deepEqual([plate.x2 - plate.x, plate.y2 - plate.y], [400, 300]);
      assert.deepEqual([width.x1, width.x2, height.y1, height.y2], [plate.x, plate.x2, plate.y, plate.y2]);
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
      const evidenceSheet = parsed.project.sheets.find(sheet => sheet.id === 'dol-reference-097');
      assert.equal(evidenceSheet.number, 'A2/097');
      assert.equal(reopened.project.sheets.find(sheet => sheet.id === evidenceSheet.id).number, 'A2/0023');
      const evidenceObjects = parsed.project.objects.filter(object => object.sheetId === evidenceSheet.id);
      assert.ok(evidenceObjects.every(object => object.kind === 'rect' || object.kind === 'text'));
      const evidenceText = evidenceObjects.map(object => object.text).join(' ');
      assert.match(evidenceText, /A2\/094.*site ambient.*installation altitude/);
      assert.match(evidenceText, /A2\/095.*thermal class/);
      assert.match(evidenceText, /A2\/096.*sensor code.*terminal diagram/);
      const reopenedEvidence = reopened.project.objects.filter(object => object.sheetId === evidenceSheet.id);
      assert.deepEqual(reopenedEvidence, copy.objects.filter(object => object.sheetId === evidenceSheet.id));
      for (const number of ['094', '095', '096']) {
        const target = reopened.project.sheets.find(sheet => sheet.id === 'dol-reference-' + number);
        assert.ok(reopenedEvidence.some(object => object.text?.startsWith(target.number + ' | ')));
      }
      for (const [suffix, copiedNumber, evidence] of [
        ['098', 'A2/0024', /Evidence pending: site fault-current basis/],
        ['099', 'A2/0025', /Evidence pending: total branch load/]
      ]) {
        const id = 'dol-reference-' + suffix;
        assert.equal(parsed.project.sheets.find(sheet => sheet.id === id).number, 'A2/' + suffix);
        assert.equal(reopened.project.sheets.find(sheet => sheet.id === id).number, copiedNumber);
        const objects = reopened.project.objects.filter(object => object.sheetId === id);
        assert.ok(objects.every(object => object.kind === 'rect' || object.kind === 'text'));
        assert.ok(objects.some(object => evidence.test(object.text)));
      }
      const reopenedFootprint = reopened.project.objects.find(object => object.id === editableCopyFootprint.id);
      assert.equal(reopenedFootprint.x, sourceLayoutSnapshot.x + 14);
      assert.equal(reopenedFootprint.stroke, '#dc2626');
      assert.equal(sourceLayoutSnapshot.x, 122.5, 'editing a copied layout must leave the library template unchanged');
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
  assert.equal(firstCopy.objects.filter(object => object.kind === 'component-instance').length, 40);
  assert.equal(firstCopy.objects.filter(object => object.kind === 'wire').length, 354);
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
  assert.match(inline, /fitDrawingToPage\(bounds,page\.width,page\.height,10,projectTitleBlockHeight\(page\.height\)\)/);
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
  assert.match(inline, /function exportSvg\(mode='frame',region\)/);
  assert.match(inline, /function closeSheetTab\(id\)/);
  assert.match(inline, /unresolved connection diagnostic/);
  assert.match(inline, /async function renderEditableExampleProjects\(query\)/);
  assert.match(inline, /copyExampleProject\(source,uniqueId,copyName\)/);
  assert.match(inline, /openNativeProject\(copy,entry\.path\)/);
  assert.match(inline, /state\.projectName\|\|'Untitled electrical project'/);
  assert.match(inline, /state\.projectName\|\|'Adigun-AutoCAD-project'/);
  assert.match(inline, /examples\/real-projects\/library\.json/);
  assert.match(inline, /data-example-project/);
  assert.match(inline, /setProjectExplorerView\('list'\)/);
  assert.match(html, /id="editableExampleProjects"/);
  assert.match(html, /id="blankProjectTemplate"/);
  const newProjectDialog = html.slice(html.indexOf('<dialog id="newProjectDialog"'), html.indexOf('</dialog>', html.indexOf('<dialog id="newProjectDialog"')));
  assert.doesNotMatch(newProjectDialog, /editableExampleProjects|source-backed editable examples/i);
  assert.match(html, />Hephzibah Behulah<\/text>/);
  assert.match(html, />AdigunAiAutoCad<\/text>/);
});

test('irrigation controller preserves separate field signals and an isolated pump demand contact', () => {
  execFileSync(process.execPath, [path.join(__dirname, 'scripts/author-irrigation-controller.js')]);
  const file = path.join(__dirname, 'examples/real-projects/irrigation-controller.adigun.json');
  const project = engine.parseProject(fs.readFileSync(file, 'utf8')).project;
  const report = engine.analyzeProject(project);
  assert.deepEqual([report.sheetCount, report.crossSheetConnectionCount, report.openEndpointCount, report.geometryErrorCount], [8, 16, 0, 0]);
  const nets = report.globalNets.map(net => net.pins.map(pin => pin.ref + ':' + pin.number).sort().join(',')).sort();
  assert.deepEqual(nets, [
    'A1:X10:1,A1:X12:1,B1:1,PS1:+,S1:13,X1:1,X1:2,X5:1,X5:2,X7:1,X7:2', 'A1:X10:10,X8:1,X8:2', 'A1:X10:2,A1:X10:6,A1:X11:1,A1:X12:2,B1:3,H1:X2,K1:A2,PS1:-,X2:1,X2:2',
    'A1:X10:7,B1:4', 'A1:X10:8,S1:14', 'A1:X10:9,X6:1,X6:2', 'A1:X11:2,B1:2', 'A1:X12:3,K1:A1', 'A1:X12:4,H1:X1', 'K1:11,X3:1,X3:2', 'K1:14,X4:1,X4:2', 'PS1:L,X9:1,X9:2', 'PS1:N,X10:1,X10:2', 'PS1:PE,X11:1,X11:2'
  ]);
});
