'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
require('./cad-engine.js');

const engine = globalThis.AdigunCADEngine;
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
  const exported = await globalThis.AdigunDXF.exportDrawing([...project.objects,
    { kind: 'wire', x1: 0, y1: 0, x2: 50, y2: 30, stroke: '#164eac' }, { kind: 'component-instance' }]);
  assert.deepEqual(exported.unsupported, ['component-instance × 1']);
  assert.equal(new globalThis.DxfParser().parseSync(exported.text).header.$INSUNITS, 4);
  const reopened = globalThis.AdigunDXF.importDrawing(exported.text, 'Round trip', 'dxf-round-trip');
  const [restoredLine, restoredCircle, horizontal, vertical] = reopened.project.objects;
  assert.deepEqual(restoredLine, line);
  assert.deepEqual(restoredCircle, circle);
  assert.deepEqual([horizontal.x1, horizontal.y1, horizontal.x2, horizontal.y2, vertical.x1, vertical.y1, vertical.x2, vertical.y2],
    [0, 0, 50, 0, 50, 0, 50, 30]);
});

function makeLargeDrawingFixture() {
  const sheets = [];
  const objects = [];
  const crossSheetConnections = [];
  for (let page = 0; page < 10; page += 1) {
    const sheetId = 'scale-' + page;
    sheets.push({ id: sheetId, number: 'A2/' + String(page + 1).padStart(3, '0'), name: 'Terminal routes ' + (page + 1), projectSectionId: 'A2' });
    for (let row = 0; row < 5; row += 1) {
      const y = 150 + row * 100;
      const addWire = (id, x1, x2) => objects.push({ id, kind: 'wire', sheetId, x1, y1: y, x2, y2: y });
      for (let column = 0; column < 5; column += 1) {
        const x = 180 + column * 180;
        const position = page * 25 + row * 5 + column + 1;
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
      if (page === 9) continue;
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
    const clickDrawingPoint = async (x, y) => {
      const point = await wiringPage.locator('#userDrawings').evaluate((node, coordinates) => {
        const transformed = new DOMPoint(...coordinates).matrixTransform(node.getScreenCTM());
        return { x: transformed.x, y: transformed.y };
      }, [x, y]);
      await wiringPage.mouse.click(point.x, point.y);
    };
    const terminalIds = [];
    for (const x of [85, 210, 335]) {
      await wiringPage.locator('#symbolList [data-insert="phoenix-contact-3212144"]').click();
      await clickDrawingPoint(x, 110);
      const selected = wiringPage.locator('#userDrawings [data-object].selected-object');
      terminalIds.push(await selected.getAttribute('data-object'));
    }
    assert.equal(new Set(terminalIds).size, 3);
    const pin = (objectId, number) => wiringPage.locator('#userDrawings [data-object="' + objectId + '"] [data-component-pin="connection-' + number + '"]');
    await wiringPage.getByRole('button', { name: 'Draw wire' }).click();
    await pin(terminalIds[0], 2).click();
    await pin(terminalIds[1], 1).click();
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
    await pin(terminalIds[2], 2).click();
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
    assert.equal(engine.analyzeProject(manualSaved.project).openEndpointCount, 0);
    await wiringPage.close({ runBeforeUnload: false });

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
    await examplePage.locator('#projectSearch').fill('DC distribution IEC-style 18 sheets');
    const distributionRow = examplePage.locator('#editableExampleProjects [data-example-project="sitop-24v-dc-distribution"]');
    await distributionRow.waitFor();
    assert.equal(await examplePage.locator('#editableExampleProjects [data-example-project]').count(), 1);
    assert.match(await distributionRow.getAttribute('aria-description'), /30 components.*110 wire segments.*Model checks passed/);
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
      if (entry.id === 'sitop-24v-dc-distribution') {
        await copyPage.evaluate(() => { window.print = () => {}; });
        await copyPage.keyboard.press('Control+k');
        await copyPage.getByRole('button', { name: /Print project set/ }).click();
        assert.deepEqual(await copyPage.locator('[data-print-sheet]').evaluateAll(pages => pages.map(page => page.dataset.printSheet)),
          saved.project.sheets.map(sheet => sheet.id));
        assert.equal(await copyPage.locator('#projectPrintSet [data-title-block-row="sheet"]').count(), source.sheets.length);
        await copyPage.evaluate(() => window.dispatchEvent(new Event('afterprint')));
        assert.equal(await copyPage.locator('#projectPrintSet').count(), 0);
      }
      assert.equal(fs.readFileSync(path.join(root, entry.path), 'utf8'), sourceText, entry.title + ' leaves the catalog source unchanged');
      await copyPage.close({ runBeforeUnload: false });
    }
    await examplePage.getByRole('listitem', { name: 'Open Star-delta 100-sheet reference package as an editable copy' }).click();
    const componentId = 'cmp-6d8a901d-98ae-4054-88e1-06afaea9ffb0';
    await examplePage.locator('#projectTree [data-sheet="ref-006"]').waitFor();
    assert.equal(await examplePage.locator('#projectTree [data-section-row]').count(), 4, 'example copy keeps the A1–A4 section structure');
    await examplePage.locator('#projectTree [data-sheet="ref-007"]').click();
    const offPageConnector = examplePage.locator('#userDrawings .cross-sheet-connector').first();
    await offPageConnector.waitFor();
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

test('SITOP distribution keeps both terminal branches on separate supply and return nets', () => {
  const file = path.join(__dirname, 'examples/real-projects/sitop-24v-dc-distribution.adigun.json');
  const source = engine.parseProject(fs.readFileSync(file, 'utf8'));
  assert.equal(source.valid, true, source.errors.join(' '));
  const copy = engine.copyExampleProject(source.project, 'distribution-test', 'Editable distribution');
  const reopened = engine.parseProject(engine.serializeProject(copy));
  const report = engine.analyzeProject(reopened.project);
  assert.deepEqual([report.sheetCount, report.crossSheetConnectionCount, report.openEndpointCount], [18, 45, 0]);
  const membership = groups => groups.map(pins => pins.sort().join(',')).sort();
  assert.deepEqual(membership(report.globalNets.map(net => net.pins.map(pin => pin.ref + ':' + pin.number))), membership([
    ['X7:1', 'X7:2', 'PS1:L'],
    ['X8:1', 'X8:2', 'PS1:N'],
    ['X21:1', 'X21:2', 'X9:1', 'X9:2', 'PS1:PE'],
    ['B1:1', 'B2:1', 'KM1:13', 'KM1:21', 'X1:1', 'X1:2', 'X2:1', 'X2:2', 'X5:1', 'X5:2', 'X13:1', 'X13:2', 'X19:1', 'X19:2', 'A1:X10:1', 'A1:X12:1', 'K1:11', 'S1:13', 'S2:21', 'PS1:+'],
    ['B1:3', 'B2:3', 'KM1:A2', 'X3:1', 'X3:2', 'X4:1', 'X4:2', 'X14:1', 'X14:2', 'A1:X10:2', 'A1:X10:6', 'A1:X11:1', 'A1:X12:2', 'K1:A2', 'K2:A2', 'PS1:-'],
    ['B1:4', 'X15:1', 'X15:2', 'A1:X10:7'],
    ['B2:2', 'X11:1', 'X11:2', 'A1:X11:2'],
    ['B2:4', 'X12:1', 'X12:2', 'A1:X10:13'],
    ['KM1:A1', 'K1:14'],
    ['KM1:14', 'A1:X10:8'],
    ['A1:X12:3', 'K1:A1'],
    ['A1:X10:9', 'S1:14'],
    ['A1:X10:10', 'S2:22'],
    ['X6:1', 'X6:2', 'KM1:22', 'A1:X10:11'],
    ['K1:12', 'X10:1', 'X10:2', 'A1:X10:12'],
    ['A1:X12:4', 'K2:A1'],
    ['K2:11', 'X16:1', 'X16:2'],
    ['K2:12', 'X17:1', 'X17:2'],
    ['K2:14', 'X18:1', 'X18:2'],
    ['X20:1', 'X20:2', 'A1:X10:14']
  ]));
  const io = engine.plcIoList(reopened.project);
  assert.equal(io.valid, true);
  assert.equal(io.rows.length, 16);
  assert.deepEqual(io.rows.filter(row => row.netId).map(row => row.terminal),
    ['X10:7', 'X10:8', 'X10:9', 'X10:10', 'X10:11', 'X10:12', 'X10:13', 'X10:14', 'X11:2', 'X12:3', 'X12:4']);
  assert.match(io.rows.find(row => row.terminal === 'X11:2').connectedPins[0], / B2:2$/);
  const cables = engine.cableScheduleCsv(reopened.project);
  assert.equal(cables.trim().split('\r\n').length, 8);
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
  assert.equal(firstCopy.objects.filter(object => object.kind === 'component-instance').length, 38);
  assert.equal(firstCopy.objects.filter(object => object.kind === 'wire').length, 348);
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
  assert.match(inline, /exportSheet\.paperWidthMm/);
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
