/* Versioned, source-backed component and connectivity model for Adigun AI AutoCAD. */
(function (root) {
  'use strict';

  const COMPONENT_SCHEMA_VERSION = 1;
  const PROJECT_FORMAT = 'adigun-ai-autocad-workspace';
  const PROJECT_VERSION = 2;
  const EPSILON = 1e-7;
  const DEFAULT_PROJECT_SECTIONS = deepFreeze([
    { id: 'A1', name: 'General information', purpose: 'Overview, title page, devices, symbols, abbreviations, and design basis.', order: 1, collapsed: false },
    { id: 'A2', name: 'Electrical design', purpose: 'Connected schematics, power and control circuits, terminals, cables, protection, and earthing.', order: 2, collapsed: false },
    { id: 'A3', name: 'Panel layout and installation', purpose: 'Physical arrangement, mounting, cable routing, and installation details.', order: 3, collapsed: false },
    { id: 'A4', name: 'Final documentation', purpose: 'Material lists, connection reports, inspections, commissioning, and handover.', order: 4, collapsed: false }
  ]);
  const PAPER_SIZES_MM = deepFreeze({ A4: [297, 210], A3: [420, 297], A2: [594, 420], A1: [841, 594], A0: [1189, 841] });

  function deepFreeze(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    Object.keys(value).forEach(function (key) { deepFreeze(value[key]); });
    return Object.freeze(value);
  }
  function finite(value) { return typeof value === 'number' && Number.isFinite(value); }
  function viewportViewBox(view, width, height) {
    if (!(width > 0 && height > 0)) return { ...view };
    const aspect = width / height;
    const w = Math.max(view.w, view.h * aspect);
    const h = Math.max(view.h, view.w / aspect);
    return { x: view.x + (view.w - w) / 2, y: view.y + (view.h - h) / 2, w, h };
  }

  function zoomViewAt(view, point, scale) {
    return { x: point.x + (view.x - point.x) * scale, y: point.y + (view.y - point.y) * scale,
      w: view.w * scale, h: view.h * scale };
  }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }

  function fitDrawingToPage(bounds, pageWidth, pageHeight, margin, titleBlockHeight) {
    if (!bounds || ![bounds.left, bounds.top, bounds.right, bounds.bottom, pageWidth, pageHeight].every(finite) || bounds.right < bounds.left || bounds.bottom < bounds.top || pageWidth <= 0 || pageHeight <= 0) {
      throw new Error('Drawing bounds must be ordered and page dimensions must be positive finite values.');
    }
    const inset = finite(margin) && margin >= 0 ? margin : 10;
    const titleHeight = finite(titleBlockHeight) && titleBlockHeight >= 0 ? titleBlockHeight : 60;
    const availableWidth = pageWidth - inset * 2;
    const availableHeight = pageHeight - inset * 2 - titleHeight;
    if (availableWidth <= 0 || availableHeight <= 0) throw new Error('The title block leaves no drawable sheet area.');
    const width = bounds.right - bounds.left, height = bounds.bottom - bounds.top;
    const scale = width || height ? Math.min(availableWidth / width, availableHeight / height) : 1;
    return {
      scale: scale,
      x: inset + (availableWidth - (bounds.right - bounds.left) * scale) / 2 - bounds.left * scale,
      y: inset + (availableHeight - (bounds.bottom - bounds.top) * scale) / 2 - bounds.top * scale
    };
  }

  function invertDrawingTransform(point, transform) {
    if (!point || ![point.x, point.y].every(finite) || !transform || ![transform.scale, transform.x, transform.y].every(finite) || transform.scale <= 0) {
      throw new Error('Drawing point and transform must contain finite coordinates and a positive scale.');
    }
    return { x: (point.x - transform.x) / transform.scale, y: (point.y - transform.y) / transform.scale };
  }

  function createProjectModel(projectId, projectName) {
    if (typeof projectId !== 'string' || !projectId.trim()) throw new Error('Project needs a stable internal ID.');
    const name = String(projectName || '').trim().slice(0, 80);
    if (!name) throw new Error('Project needs a name.');
    return {
      id: projectId,
      name: name,
      metadata: { title: name, jobNumber: '', manager: '', customer: '', site: '', drawnBy: '', designer: '', checkedBy: '', approvedBy: '', drawingDate: '', notes: '', issueStatus: '' },
      sections: clone(DEFAULT_PROJECT_SECTIONS),
      sheets: [],
      activeSheetId: null,
      openTabs: [],
      crossSheetConnections: [],
      diagnostics: []
    };
  }

  function copyExampleProject(source, projectId, projectName) {
    const validation = validateProject(source);
    if (!validation.valid) throw new Error('Example project cannot be copied: ' + validation.errors.join(' '));
    if (typeof projectId !== 'string' || !projectId.trim()) throw new Error('Editable copy needs a unique project ID.');
    const name = String(projectName || '').trim().slice(0, 80);
    if (!name) throw new Error('Editable copy needs a project name.');
    const copy = clone(source);
    let model = copy.projectModel && Array.isArray(copy.projectModel.sections) && Array.isArray(copy.projectModel.sheets)
      ? copy.projectModel
      : null;
    if (!model) {
      copy.id = projectId;
      copy.project = name;
      model = createProjectModel(projectId, name);
      const activeSheetId = copy.sheets.some(function (sheet) { return sheet.id === copy.activeSheet; }) ? copy.activeSheet : (copy.sheets[0]?.id || null);
      const previousNumbers = new Map();
      copy.sheets.forEach(function (sourceSheet) {
        previousNumbers.set(sourceSheet.id, sourceSheet.number);
        const legacySection = /^A([1-4])\//.exec(String(sourceSheet.number || ''));
        const sectionId = sourceSheet.sectionId || sourceSheet.projectSectionId || (copy.sheets.length === 1 ? 'A2' : (legacySection ? 'A' + legacySection[1] : 'A2'));
        const sheet = addProjectSheet(model, sectionId, sourceSheet.name, sourceSheet.id);
        Object.assign(sheet, sourceSheet, { id: sourceSheet.id, projectId: projectId, sectionId: sectionId, drawingFitToPage: true });
      });
      renumberProjectSheets(model);
      copy.sheetViews = clone(copy.sheetViews || {});
      model.sheets.forEach(function (sheet) {
        copy.sheetViews[sheet.id] = { x: 0, y: 0, w: sheet.paperWidthMm || 420, h: sheet.paperHeightMm || 297 };
      });
      copy.view = { x: 0, y: 0, w: 420, h: 297 };
      copy.zoom = 100;
      const numberChanges = Array.from(previousNumbers.entries()).map(function (entry) {
        const sheet = model.sheets.find(function (item) { return item.id === entry[0]; });
        return [entry[1], sheet && sheet.number];
      }).filter(function (entry) { return entry[0] && entry[1] && entry[0] !== entry[1]; }).sort(function (a, b) { return b[0].length - a[0].length; });
      const replacements = new Map(numberChanges);
      const numberPattern = numberChanges.length ? new RegExp('(?:' + numberChanges.map(function (entry) {
        return entry[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      }).join('|') + ')(?!\\d)', 'g') : null;
      model.activeSheetId = activeSheetId;
      model.openTabs = activeSheetId ? [activeSheetId] : [];
      model.crossSheetConnections = clone(copy.crossSheetConnections || []);
      model.metadata.notes = [model.metadata.notes, 'Editable copy of AdigunAiAutoCad example: ' + String(source.project || 'Source-backed project') + '. Legacy drawing coordinates remain editable and are fitted to the paper at display time; manufacturer records remain separate from instance settings.'].filter(Boolean).join('\n');
      copy.projectModel = model;
      copy.sheets = model.sheets;
      copy.activeSheet = activeSheetId;
      copy.crossSheetConnections = model.crossSheetConnections;
      copy.objects = clone(copy.objects || []);
      copy.objects.forEach(function (object) {
        if (!numberPattern || !object || typeof object.text !== 'string') return;
        object.text = object.text.replace(numberPattern, function (number) { return replacements.get(number); });
      });
      copy.sheetLabels = clone(copy.sheetLabels || {});
      copy.sheetViews = clone(copy.sheetViews || {});
      return copy;
    }
    if (model) {
      model.id = projectId;
      model.name = name;
      model.sheets.forEach(function (sheet) { sheet.projectId = projectId; });
      model.metadata = Object.assign(createProjectModel(projectId, name).metadata, model.metadata || {});
      model.metadata.title = name;
    }
    model.crossSheetConnections = clone(copy.crossSheetConnections || model.crossSheetConnections || []);
    model.openTabs = Array.isArray(model.openTabs) ? model.openTabs.filter(function (id) { return model.sheets.some(function (sheet) { return sheet.id === id; }); }) : [];
    model.activeSheetId = model.sheets.some(function (sheet) { return sheet.id === model.activeSheetId; })
      ? model.activeSheetId
      : (model.openTabs[0] || model.sheets[0]?.id || null);
    if (model.activeSheetId && !model.openTabs.includes(model.activeSheetId)) model.openTabs.push(model.activeSheetId);
    model.metadata.notes = [model.metadata.notes, 'Editable copy of AdigunAiAutoCad example: ' + String(source.project || source.projectModel?.name || 'Source-backed project') + '. Instance settings remain separate from source-backed manufacturer records.'].filter(Boolean).join('\n');
    copy.projectModel = model;
    copy.project = name;
    copy.sheets = model.sheets;
    copy.activeSheet = model.activeSheetId;
    copy.crossSheetConnections = model.crossSheetConnections;
    copy.objects = clone(copy.objects || []);
    copy.sheetLabels = clone(copy.sheetLabels || {});
    copy.sheetViews = clone(copy.sheetViews || {});
    return copy;
  }

  function addProjectSection(project, name, purpose) {
    if (!project || !Array.isArray(project.sections) || !Array.isArray(project.sheets)) throw new Error('Project sections are unavailable.');
    const sectionNumber = project.sections.reduce(function (highest, section) {
      const match = /^A(\d+)$/.exec(section && section.id || '');
      return match ? Math.max(highest, Number(match[1])) : highest;
    }, 0) + 1;
    const section = {
      id: 'A' + sectionNumber,
      name: String(name || '').trim().slice(0, 80) || 'New section',
      purpose: String(purpose || '').trim().slice(0, 240),
      order: project.sections.length + 1,
      collapsed: false
    };
    project.sections.push(section);
    return section;
  }

  function renameProjectSection(project, sectionId, name) {
    if (!project || !Array.isArray(project.sections)) throw new Error('Project sections are unavailable.');
    const section = project.sections.find(function (item) { return item.id === sectionId; });
    const value = String(name || '').trim().slice(0, 80);
    if (!section || !value) throw new Error('Choose a section and enter a name.');
    section.name = value;
    return section;
  }

  function renumberProjectSheets(project) {
    if (!project || !Array.isArray(project.sections) || !Array.isArray(project.sheets)) throw new Error('Project sheet structure is unavailable.');
    const sections = new Map(project.sections.map(function (section, index) { return [section.id, section.order || index + 1]; }));
    project.sheets.sort(function (left, right) {
      return (sections.get(left.sectionId) || Number.MAX_SAFE_INTEGER) - (sections.get(right.sectionId) || Number.MAX_SAFE_INTEGER)
        || (left.sectionOrder || 0) - (right.sectionOrder || 0);
    });
    project.sheets.forEach(function (sheet, index) {
      sheet.order = index + 1;
      sheet.number = sheet.sectionId + '/' + String(index + 1).padStart(4, '0');
    });
    return project.sheets;
  }

  function addProjectSheet(project, sectionId, name, sheetId) {
    if (!project || typeof project.id !== 'string' || !Array.isArray(project.sections) || !Array.isArray(project.sheets)) throw new Error('Project sheet structure is unavailable.');
    if (!project.sections.some(function (section) { return section.id === sectionId; })) throw new Error('Choose a section in this project.');
    if (typeof sheetId !== 'string' || !sheetId.trim() || project.sheets.some(function (sheet) { return sheet.id === sheetId; })) throw new Error('Sheet needs a unique stable internal ID.');
    const sectionOrder = project.sheets.filter(function (sheet) { return sheet.sectionId === sectionId; }).reduce(function (highest, sheet) { return Math.max(highest, sheet.sectionOrder || 0); }, 0) + 1;
    const sheet = {
      id: sheetId,
      projectId: project.id,
      sectionId: sectionId,
      sectionOrder: sectionOrder,
      order: 0,
      number: '',
      name: String(name || '').trim().slice(0, 80) || 'New sheet',
      customName: Boolean(String(name || '').trim()),
      revision: '',
      revisionDate: '',
      contentType: 'drawing',
      scope: '',
      description: '',
      drawnBy: '',
      checkedBy: '',
      approvedBy: '',
      scale: '1:1',
      paperSize: 'A3',
      orientation: 'landscape',
      paperWidthMm: 420,
      paperHeightMm: 297,
      issueStatus: '',
      notes: '',
      devices: [],
      terminals: [],
      connections: [],
      crossReferences: []
    };
    project.sheets.push(sheet);
    renumberProjectSheets(project);
    return sheet;
  }

  function projectSheetMargins(sheet) {
    return { top: 10, right: 10, bottom: 10, left: 10, ...sheet?.paperMargins };
  }

  function checkPaperMargins(margins, width, height) {
    if (['top', 'right', 'bottom', 'left'].some(edge => !finite(margins[edge]) || margins[edge] < 0)
      || margins.left + margins.right >= width || margins.top + margins.bottom >= height) {
      throw new Error('Paper margins must be nonnegative and leave a positive drawing area.');
    }
  }

  function setProjectSheetMargin(sheet, edge, value) {
    if (!['top', 'right', 'bottom', 'left'].includes(edge)) throw new Error('Unknown paper margin.');
    const margins = { ...projectSheetMargins(sheet), [edge]: value };
    checkPaperMargins(margins, sheet.paperWidthMm || 420, sheet.paperHeightMm || 297);
    sheet.paperMargins = margins;
    return margins;
  }

  function setProjectSheetPaperFormat(sheet, paperSize, orientation, customSize) {
    if (!sheet || (paperSize !== 'Custom' && !Object.prototype.hasOwnProperty.call(PAPER_SIZES_MM, paperSize))) throw new Error('Choose a standard or custom paper size.');
    let [width, height] = paperSize === 'Custom'
      ? [customSize?.width ?? sheet.paperWidthMm ?? 420, customSize?.height ?? sheet.paperHeightMm ?? 297]
      : PAPER_SIZES_MM[paperSize];
    if (!finite(width) || !finite(height) || width <= 0 || height <= 0) throw new Error('Paper width and height must be positive numbers.');
    if (customSize && paperSize === 'Custom') orientation = width >= height ? 'landscape' : 'portrait';
    if (orientation !== 'landscape' && orientation !== 'portrait') throw new Error('Choose landscape or portrait orientation.');
    if (orientation === 'portrait' && width > height || orientation === 'landscape' && height > width) {
      const swap = width; width = height; height = swap;
    }
    checkPaperMargins(projectSheetMargins(sheet), width, height);
    sheet.paperSize = paperSize;
    sheet.orientation = orientation;
    sheet.paperWidthMm = width;
    sheet.paperHeightMm = height;
    return { width: width, height: height };
  }

  function drawingScaleRatio(value) {
    const match = /^(\d+)\s*:\s*(\d+)$/.exec(String(value ?? '').trim());
    if (!match) return null;
    const drawing = Number(match[1]), world = Number(match[2]);
    return Number.isSafeInteger(drawing) && Number.isSafeInteger(world) && drawing > 0 && world > 0
      ? { label: drawing + ':' + world, factor: drawing / world }
      : null;
  }

  function setProjectSheetDrawingScale(sheet, value) {
    const fit = /^fit to page$/i.test(String(value ?? '').trim());
    const ratio = drawingScaleRatio(value);
    if (!sheet || (!fit && !ratio)) throw new Error('Enter a positive ratio such as 1:2, or Fit to page.');
    sheet.scale = fit ? 'Fit to page' : ratio.label;
    sheet.drawingFitToPage = fit;
    delete sheet.drawingTransform;
    return sheet.scale;
  }

  function projectSheetDrawingScaleFactor(sheet) {
    return sheet?.drawingFitToPage === false ? (drawingScaleRatio(sheet.scale)?.factor ?? 1) : 1;
  }

  function renameProjectSheet(project, sheetId, name) {
    if (!project || !Array.isArray(project.sheets)) throw new Error('Project sheets are unavailable.');
    const sheet = project.sheets.find(function (item) { return item.id === sheetId; });
    const value = String(name || '').trim().slice(0, 80);
    if (!sheet || !value) throw new Error('Choose a sheet and enter a name.');
    sheet.name = value;
    sheet.customName = true;
    return sheet;
  }

  function moveProjectSheet(project, sheetId, sectionId, sectionPosition) {
    if (!project || !Array.isArray(project.sections) || !Array.isArray(project.sheets)) throw new Error('Project sheet structure is unavailable.');
    if (!project.sections.some(function (section) { return section.id === sectionId; })) throw new Error('Choose a section in this project.');
    const sourceIndex = project.sheets.findIndex(function (sheet) { return sheet.id === sheetId; });
    if (sourceIndex < 0) throw new Error('The selected sheet no longer exists.');
    const moved = project.sheets.splice(sourceIndex, 1)[0];
    const previousSectionId = moved.sectionId;
    const targetSheets = project.sheets.filter(function (sheet) { return sheet.sectionId === sectionId; }).sort(function (a, b) { return a.sectionOrder - b.sectionOrder; });
    const targetIndex = Math.max(0, Math.min(targetSheets.length, Number.isInteger(sectionPosition) ? sectionPosition : targetSheets.length));
    moved.sectionId = sectionId;
    targetSheets.splice(targetIndex, 0, moved);
    targetSheets.forEach(function (sheet, index) { sheet.sectionOrder = index + 1; });
    const oldSectionSheets = project.sheets.filter(function (sheet) { return sheet.sectionId === previousSectionId && sheet.sectionId !== sectionId; });
    oldSectionSheets.forEach(function (sheet, index) { sheet.sectionOrder = index + 1; });
    project.sheets.push(moved);
    renumberProjectSheets(project);
    return moved;
  }

  function retireCrossSheetConnections(project, sheetId, isAffected, message) {
    if (!Array.isArray(project.crossSheetConnections)) return 0;
    const linked = project.crossSheetConnections.filter(function (connection) {
      return Array.isArray(connection.endpoints) && connection.endpoints.some(isAffected);
    });
    if (!linked.length) return 0;
    if (!Array.isArray(project.diagnostics)) project.diagnostics = [];
    linked.forEach(function (connection) {
      project.diagnostics.push({
        type: 'unresolved-cross-sheet-reference',
        sheetId: sheetId,
        connectionId: connection.id,
        connection: clone(connection),
        message: 'Connection ' + connection.id + ' ' + message
      });
    });
    const affected = new Set(linked);
    project.crossSheetConnections = project.crossSheetConnections.filter(function (connection) { return !affected.has(connection); });
    return linked.length;
  }

  function detachDeletedDrawingObjects(project, sheetId, objects) {
    const wires = new Set(), components = new Set();
    objects.forEach(function (object) {
      if (object.kind === 'wire') wires.add(object.id);
      if (object.kind === 'component-instance') components.add(object.ref);
    });
    const sheet = project.sheets.find(function (item) { return item.id === sheetId; });
    if (!sheet || (!wires.size && !components.size)) return 0;
    return retireCrossSheetConnections(project, sheetId, function (endpoint) {
      const target = endpoint.connector;
      return (endpoint.sheetId === sheetId && wires.has(endpoint.wireId)) ||
        (target?.targetSheetId === sheetId && components.has(target.targetRef));
    }, 'references a deleted wire or component on sheet ' + (sheet.number || sheetId) + '.');
  }

  function deleteProjectSheet(project, sheetId) {
    if (!project || !Array.isArray(project.sheets)) throw new Error('Project sheets are unavailable.');
    const index = project.sheets.findIndex(function (sheet) { return sheet.id === sheetId; });
    if (index < 0) throw new Error('The selected sheet no longer exists.');
    const removed = project.sheets.splice(index, 1)[0];
    retireCrossSheetConnections(project, sheetId, function (endpoint) {
      return endpoint.sheetId === sheetId || endpoint.connector?.targetSheetId === sheetId;
    }, 'references deleted sheet ' + removed.number + ' (' + removed.name + ').');
    if (Array.isArray(project.openTabs)) project.openTabs = project.openTabs.filter(function (id) { return id !== sheetId; });
    if (project.activeSheetId === sheetId) project.activeSheetId = null;
    const siblings = project.sheets.filter(function (sheet) { return sheet.sectionId === removed.sectionId; }).sort(function (a, b) { return a.sectionOrder - b.sectionOrder; });
    siblings.forEach(function (sheet, siblingIndex) { sheet.sectionOrder = siblingIndex + 1; });
    renumberProjectSheets(project);
    return removed;
  }

  const terminalDefinition = deepFreeze({
    schemaVersion: COMPONENT_SCHEMA_VERSION,
    id: 'phoenix-contact-3212144',
    manufacturer: 'Phoenix Contact',
    manufacturerPartNumber: '3212144',
    model: 'PT 16 N OG',
    name: 'Feed-through terminal block',
    family: 'feedthrough-terminal',
    referencePrefix: 'X',
    category: 'Electrical · Verified DIN-rail terminal',
    symbol: {
      id: 'terminal.feedthrough.2-connection.v1',
      view: 'schematic',
      unit: 'mm',
      width: 70,
      height: 26,
      pins: [
        { id: 'connection-1', localNumber: '1', name: 'Connection 1', x: -35, y: 0, electricalType: 'passive', connectionType: 'push-in' },
        { id: 'connection-2', localNumber: '2', name: 'Connection 2', x: 35, y: 0, electricalType: 'passive', connectionType: 'push-in' }
      ],
      internalConnections: [['connection-1', 'connection-2']],
      numberingNote: 'Terminal numbers 1 and 2 are stable model-local connection IDs. The manufacturer page specifies two connections but does not assign these numbers.'
    },
    specifications: {
      nominalVoltage: { value: 1000, unit: 'V' },
      nominalCurrent: { value: 76, unit: 'A' },
      ratedCrossSection: { value: 16, unit: 'mm²' },
      rigidConductorRange: { minimum: 0.5, maximum: 25, unit: 'mm²' },
      flexibleConductorRange: { minimum: 0.5, maximum: 25, unit: 'mm²' },
      connectionCount: { value: 2, unit: 'connections' },
      connectionMethod: { value: 'Push-in' },
      productStandard: { value: 'IEC 60947-7-1' },
      mountingRails: { value: ['NS 35/7.5', 'NS 35/15'] },
      dimensions: {
        width: { value: 12.2, unit: 'mm' },
        height: { value: 75.4, unit: 'mm' },
        depthOnNS35_7_5: { value: 52.6, unit: 'mm' },
        depthOnNS35_15: { value: 60.1, unit: 'mm' }
      },
      color: { value: 'Orange (RAL 2003)' }
    },
    instanceProperties: {
      terminalStrip: { type: 'string', default: '', maximumLength: 40 },
      position: { type: 'string', default: '', maximumLength: 24 },
      marking: { type: 'string', default: '', maximumLength: 40 },
      comment: { type: 'string', default: '', maximumLength: 160 }
    },
    sources: [{
      publisher: 'Phoenix Contact',
      title: 'PT 16 N OG · Feed-through terminal block · Item 3212144',
      url: 'https://www.phoenixcontact.com/en-lt/products/feed-through-terminal-block-pt-16-n-og-3212144',
      documentRevision: null,
      revisionNote: 'Live manufacturer product page; no document revision was displayed.',
      retrievedAt: '2026-11-12'
    }]
  });
  function compactTerminal(partNumber, model, url, levels, voltage, current, height, railDepths, disconnect = false) {
    const pins = [], internalConnections = [];
    for (let level = 1; level <= levels; level += 1) {
      const y = (level - (levels + 1) / 2) * 30;
      const prefix = levels > 1 ? level + ':' : '';
      const pair = ['level-' + level + '-left', 'level-' + level + '-right'];
      pair.forEach(function (id, index) {
        pins.push({ id: id, localNumber: prefix + (index + 1), name: 'Level ' + level + ', connection ' + (index + 1),
          x: index === 0 ? -35 : 35, y: y, electricalType: 'passive', connectionType: 'push-in' });
      });
      internalConnections.push(pair);
    }
    const name = disconnect ? 'Knife-disconnect terminal block' : levels > 1 ? 'Double-level terminal block' : 'Feed-through terminal block';
    const family = disconnect ? 'disconnect-terminal' : 'feedthrough-terminal';
    return deepFreeze({
      schemaVersion: COMPONENT_SCHEMA_VERSION,
      id: 'phoenix-contact-' + partNumber,
      manufacturer: 'Phoenix Contact',
      manufacturerPartNumber: partNumber,
      model: model,
      name: name,
      family: family,
      referencePrefix: 'X',
      category: disconnect ? 'Electrical · Verified disconnect terminal' : terminalDefinition.category,
      symbol: {
        id: 'terminal.' + (disconnect ? 'disconnect' : 'feedthrough') + '.' + partNumber + '.v1', view: 'schematic', unit: 'mm',
        width: 70, height: levels > 1 ? 56 : 26, pins: pins, internalConnections: internalConnections,
        numberingNote: 'Connection numbers and level prefixes are model-local identifiers.'
      },
      specifications: {
        nominalVoltage: { value: voltage, unit: 'V' },
        nominalCurrent: { value: current, unit: 'A' },
        ratedCrossSection: { value: 2.5, unit: 'mm²' },
        rigidConductorRange: { minimum: 0.14, maximum: 4, unit: 'mm²' },
        flexibleConductorRange: { minimum: 0.14, maximum: 4, unit: 'mm²' },
        connectionCount: { value: levels * 2, unit: 'connections' },
        connectionMethod: { value: 'Push-in' },
        productStandard: { value: 'IEC 60947-7-1' },
        mountingRails: { value: ['NS 35/7.5', 'NS 35/15'] },
        dimensions: {
          width: { value: 5.2, unit: 'mm' },
          height: { value: height, unit: 'mm' },
          depthOnNS35_7_5: { value: railDepths[0], unit: 'mm' },
          depthOnNS35_15: { value: railDepths[1], unit: 'mm' }
        }
      },
      instanceProperties: disconnect ? {
        ...terminalDefinition.instanceProperties,
        knifePosition: { type: 'choice', default: 'open', choices: { open: 'Open', closed: 'Closed' } }
      } : terminalDefinition.instanceProperties,
      sources: [{
        publisher: 'Phoenix Contact', title: model + ' · ' + name + ' · Item ' + partNumber, url: url,
        documentRevision: disconnect ? 'Catalog PDF · 2026-11-09' : null,
        revisionNote: disconnect ? 'Manufacturer data for two push-in connections, rated values and DIN-rail dimensions.' : 'Live manufacturer product catalog.',
        retrievedAt: disconnect ? '2026-11-22' : '2026-11-21'
      }]
    });
  }

  const pt25Terminal = compactTerminal('3209510', 'PT 2,5',
    'https://www.phoenixcontact.com/en-pc/products/feed-through-terminal-block-pt-25-3209510', 1, 800, 24, 48.6, [36.8, 44.3]);
  const pttb25Terminal = compactTerminal('3210567', 'PTTB 2,5',
    'https://www.phoenixcontact.com/en-us/products/multi-level-terminal-block-pttb-25-3210567', 2, 500, 22, 68.2, [47.4, 54.9]);
  const pt25DisconnectTerminal = compactTerminal('3210156', 'PT 2,5-MT',
    'https://www.phoenixcontact.com/en-us/products/disconnect-terminal-block-pt-25-mt-3210156?type=pdf',
    1, 400, 20, 62.2, [36.7, 44.2], true);

  const relayDefinition = deepFreeze({
    schemaVersion: COMPONENT_SCHEMA_VERSION,
    id: 'phoenix-contact-2966171',
    manufacturer: 'Phoenix Contact',
    manufacturerPartNumber: '2966171',
    model: 'PLC-RSC- 24DC/21',
    name: 'PLC-INTERFACE relay module',
    family: 'relay-module',
    referencePrefix: 'K',
    category: 'Electrical · Verified interface relay',
    symbol: {
      id: 'relay.interface.changeover.24vdc.v1',
      view: 'schematic',
      unit: 'mm',
      width: 140,
      height: 60,
      pins: [
        { id: 'coil-a2', localNumber: 'A2', name: 'Coil return', x: -70, y: -20, electricalType: 'passive', connectionType: 'screw' },
        { id: 'coil-a1', localNumber: 'A1', name: 'Coil supply', x: -70, y: 20, electricalType: 'passive', connectionType: 'screw' },
        { id: 'contact-11', localNumber: '11', name: 'Changeover common', x: 70, y: 0, electricalType: 'passive', connectionType: 'screw' },
        { id: 'contact-12', localNumber: '12', name: 'Normally closed', x: 70, y: -25, electricalType: 'passive', connectionType: 'screw' },
        { id: 'contact-14', localNumber: '14', name: 'Normally open', x: 70, y: 25, electricalType: 'passive', connectionType: 'screw' }
      ],
      internalConnections: [],
      numberingNote: 'External terminal designations A1, A2, 11, 12 and 14 follow the manufacturer circuit diagram. Pin coordinates are schematic connection points, not a physical relay footprint.'
    },
    electricalFunctions: {
      coil: { pins: ['coil-a1', 'coil-a2'], nominalVoltage: { value: 24, unit: 'V DC' }, polarity: { positive: 'A1', negative: 'A2' }, suppression: 'Integrated polarity/freewheeling diode and input circuit; preserve A1/A2 polarity.' },
      changeoverContact: { common: 'contact-11', normallyClosed: 'contact-12', normallyOpen: 'contact-14', deenergizedConnections: [['contact-11', 'contact-12']], energizedConnections: [['contact-11', 'contact-14']], actuation: 'coil-a1/coil-a2', simulation: 'Not simulated; static connectivity reports only user-authored wires and does not assume a relay state.' }
    },
    specifications: {
      nominalCoilVoltage: { value: 24, unit: 'V DC' },
      coilInputRangeAt20C: { minimum: 18.5, maximum: 33.6, unit: 'V DC' },
      typicalInputCurrent: { value: 9, unit: 'mA' },
      responseTime: { value: 5, unit: 'ms' },
      releaseTime: { value: 8, unit: 'ms' },
      changeoverContactCount: { value: 1, unit: 'changeover contact' },
      maximumSwitchingVoltage: { value: 250, unit: 'V AC/DC', note: 'Manufacturer installation note applies above 250 V between adjacent identical modules.' },
      limitingContinuousCurrent: { value: 6, unit: 'A', note: 'Manufacturer parameter; temperature and mounting derating apply.' },
      ratedImpulseWithstandVoltage: { value: 6, unit: 'kV' },
      windingContactTestVoltage: { value: 4, unit: 'kV AC' },
      contactStandard: { value: 'IEC 60947-5-1' },
      connectionMethod: { value: 'Screw connection · M3 · 0.6–0.8 Nm' },
      rigidConductorRange: { minimum: 0.14, maximum: 2.5, unit: 'mm²' },
      flexibleConductorRange: { minimum: 0.14, maximum: 2.5, unit: 'mm²' },
      connectionCount: { value: 5, unit: 'external electrical terminals' },
      dimensions: { width: { value: 6.2, unit: 'mm' }, height: { value: 80, unit: 'mm' }, depth: { value: 94, unit: 'mm' } },
      mountingRail: { value: 'NS 35/7.5' }
    },
    instanceProperties: {
      terminalStrip: { type: 'string', default: '', maximumLength: 40 },
      position: { type: 'string', default: '', maximumLength: 24 },
      marking: { type: 'string', default: '', maximumLength: 40 },
      comment: { type: 'string', default: '', maximumLength: 160 }
    },
    sources: [{
      publisher: 'Phoenix Contact',
      title: 'PLC-RSC- 24DC/21 · Relay module · Item 2966171, online catalog PDF',
      url: 'https://www.phoenixcontact.com/en-pc/products/relay-module-plc-rsc-24dc-21-2966171?type=pdf',
      documentRevision: 'Manufacturer catalog PDF generated May 19, 2026 · circuit diagram page 9 of 12',
      revisionNote: 'Manufacturer online catalog PDF; retrieved from Phoenix Contact product page. Circuit diagram supplies external pin identifiers and functional arrangement.',
      retrievedAt: '2026-11-12'
    }]
  });
  const contactorDefinition = deepFreeze({
    schemaVersion: COMPONENT_SCHEMA_VERSION,
    id: 'schneider-electric-lc1d09bd',
    manufacturer: 'Schneider Electric',
    manufacturerPartNumber: 'LC1D09BD',
    model: 'TeSys D LC1D09BD',
    name: '3-pole contactor with 24 V DC coil',
    family: 'contactor',
    referencePrefix: 'KM',
    category: 'Electrical · Verified motor-control contactor',
    symbol: {
      id: 'contactor.tesys-d.lc1d09bd.v1',
      view: 'schematic',
      unit: 'mm',
      width: 280,
      height: 130,
      pins: [
        { id: 'coil-a1', localNumber: 'A1', name: 'DC coil terminal A1', x: -120, y: -25, electricalType: 'passive', connectionType: 'screw-clamp' },
        { id: 'coil-a2', localNumber: 'A2', name: 'DC coil terminal A2', x: -120, y: 25, electricalType: 'passive', connectionType: 'screw-clamp' },
        { id: 'power-l1', localNumber: '1/L1', name: 'Main pole 1 line terminal', x: -50, y: -55, electricalType: 'passive', connectionType: 'screw-clamp' },
        { id: 'power-t1', localNumber: '2/T1', name: 'Main pole 1 load terminal', x: -50, y: 55, electricalType: 'passive', connectionType: 'screw-clamp' },
        { id: 'power-l2', localNumber: '3/L2', name: 'Main pole 2 line terminal', x: 0, y: -55, electricalType: 'passive', connectionType: 'screw-clamp' },
        { id: 'power-t2', localNumber: '4/T2', name: 'Main pole 2 load terminal', x: 0, y: 55, electricalType: 'passive', connectionType: 'screw-clamp' },
        { id: 'power-l3', localNumber: '5/L3', name: 'Main pole 3 line terminal', x: 50, y: -55, electricalType: 'passive', connectionType: 'screw-clamp' },
        { id: 'power-t3', localNumber: '6/T3', name: 'Main pole 3 load terminal', x: 50, y: 55, electricalType: 'passive', connectionType: 'screw-clamp' },
        { id: 'aux-13', localNumber: '13', name: 'Auxiliary normally-open contact terminal', x: 100, y: -55, electricalType: 'passive', connectionType: 'screw-clamp' },
        { id: 'aux-14', localNumber: '14', name: 'Auxiliary normally-open contact terminal', x: 100, y: 55, electricalType: 'passive', connectionType: 'screw-clamp' },
        { id: 'aux-21', localNumber: '21', name: 'Auxiliary normally-closed contact terminal', x: 145, y: -55, electricalType: 'passive', connectionType: 'screw-clamp' },
        { id: 'aux-22', localNumber: '22', name: 'Auxiliary normally-closed contact terminal', x: 145, y: 55, electricalType: 'passive', connectionType: 'screw-clamp' }
      ],
      internalConnections: [],
      numberingNote: 'A1/A2, 1/L1–6/T3, 13/14 and 21/22 are the manufacturer wiring-diagram terminal designations. The schematic pins are electrical connection points, not the contactor physical footprint. Main and auxiliary contacts remain separate nets; contactor state is not simulated.'
    },
    electricalFunctions: {
      contactor: {
        coil: { pins: ['coil-a1', 'coil-a2'], nominalVoltage: { value: 24, unit: 'V DC' }, suppression: 'Built-in bidirectional peak-limiting diode suppressor' },
        mainPoles: [
          { line: 'power-l1', load: 'power-t1', normalState: 'open' },
          { line: 'power-l2', load: 'power-t2', normalState: 'open' },
          { line: 'power-l3', load: 'power-t3', normalState: 'open' }
        ],
        auxiliaryContacts: [
          { first: 'aux-13', second: 'aux-14', normalState: 'open', type: 'mechanically-linked NO' },
          { first: 'aux-21', second: 'aux-22', normalState: 'closed', type: 'mechanically-linked NC' }
        ],
        simulationNote: 'Three main poles and the mechanically-linked auxiliary NO/NC contacts are represented as separate external terminal pairs. Contact actuation and coil-state simulation are not implemented; only user-authored wires establish nets.'
      }
    },
    specifications: {
      poles: { value: '3P, 3 normally-open main poles' },
      ac3RatedCurrent: { value: 9, unit: 'A at ≤440 V AC' },
      ac3RatedOperationalVoltage: { value: 440, unit: 'V AC maximum for 9 A AC-3 rating' },
      ratedOperationalVoltage: { value: 690, unit: 'V AC maximum' },
      nominalCoilVoltage: { value: 24, unit: 'V DC' },
      averageCoilConsumptionAtNominalUc: { value: 2.4, unit: 'W', conditions: 'Average at 20 °C and nominal control voltage (Uc)' },
      averageCoilCurrentAt24V: { value: 100, unit: 'mA', conditions: 'Schneider Electric FAQ states 100 mA at 24 V DC' },
      coilOperationalRangeAt60C: { minimum: 0.7, maximum: 1.25, unit: '× Uc' },
      coilDropOutRangeAt60C: { minimum: 0.1, maximum: 0.25, unit: '× Uc' },
      electricalDurabilityAc3: { value: 2, unit: 'Mcycles', conditions: '9 A AC-3 at Ue ≤440 V AC' },
      operatingRate: { value: 3600, unit: 'cycles/h', conditions: 'At ambient temperature ≤60 °C' },
      ratedInsulationVoltage: {
        iecPowerCircuit: { value: 690, unit: 'V', standard: 'IEC 60947-4-1' },
        iecSignallingCircuit: { value: 690, unit: 'V', standard: 'IEC 60947-1' },
        csaPowerCircuit: { value: 600, unit: 'V' },
        ulPowerCircuit: { value: 600, unit: 'V' },
        csaSignallingCircuit: { value: 600, unit: 'V' },
        ulSignallingCircuit: { value: 600, unit: 'V' }
      },
      ratedImpulseWithstandVoltage: { value: 6, unit: 'kV', standard: 'IEC 60947' },
      auxiliaryContactComposition: { value: '1 mechanically-linked NO + 1 mechanically-linked NC' },
      coilSuppressor: { value: 'Built-in bidirectional peak-limiting diode' },
      standards: { value: ['IEC 60947-4-1', 'IEC 60947-5-1', 'UL 508'] },
      terminalConnection: { value: 'Screw clamp; manufacturer torque 1.7 N·m for power and control terminals; flat Ø6 mm or Philips No. 2 screwdriver' },
      terminalConductorOptions: [{"circuit":"power","cableCount":1,"cableStiffness":"flexible","cableEnd":"with cable end","minimumCrossSectionMm2":1,"maximumCrossSectionMm2":4},{"circuit":"power","cableCount":1,"cableStiffness":"flexible","cableEnd":"without cable end","minimumCrossSectionMm2":1,"maximumCrossSectionMm2":4},{"circuit":"power","cableCount":2,"cableStiffness":"flexible","cableEnd":"without cable end","minimumCrossSectionMm2":1,"maximumCrossSectionMm2":4},{"circuit":"power","cableCount":2,"cableStiffness":"flexible","cableEnd":"with cable end","minimumCrossSectionMm2":1,"maximumCrossSectionMm2":2.5},{"circuit":"power","cableCount":1,"cableStiffness":"solid","cableEnd":"without cable end","minimumCrossSectionMm2":1,"maximumCrossSectionMm2":4},{"circuit":"power","cableCount":2,"cableStiffness":"solid","cableEnd":"without cable end","minimumCrossSectionMm2":1,"maximumCrossSectionMm2":4},{"circuit":"control","cableCount":2,"cableStiffness":"flexible","cableEnd":"with cable end","minimumCrossSectionMm2":1,"maximumCrossSectionMm2":2.5},{"circuit":"control","cableCount":1,"cableStiffness":"flexible","cableEnd":"without cable end","minimumCrossSectionMm2":1,"maximumCrossSectionMm2":4},{"circuit":"control","cableCount":2,"cableStiffness":"flexible","cableEnd":"without cable end","minimumCrossSectionMm2":1,"maximumCrossSectionMm2":4},{"circuit":"control","cableCount":1,"cableStiffness":"flexible","cableEnd":"with cable end","minimumCrossSectionMm2":1,"maximumCrossSectionMm2":4},{"circuit":"control","cableCount":1,"cableStiffness":"solid","cableEnd":"without cable end","minimumCrossSectionMm2":1,"maximumCrossSectionMm2":4},{"circuit":"control","cableCount":2,"cableStiffness":"solid","cableEnd":"without cable end","minimumCrossSectionMm2":1,"maximumCrossSectionMm2":4}],
      dimensions: { width: { value: 45, unit: 'mm' }, height: { value: 77, unit: 'mm' }, depth: { value: 95, unit: 'mm' } },
      mountingSupport: { value: ['Rail', 'Plate'] }
    },
    instanceProperties: {
      terminalStrip: { type: 'string', default: '', maximumLength: 40 },
      position: { type: 'string', default: '', maximumLength: 24 },
      marking: { type: 'string', default: '', maximumLength: 40 },
      comment: { type: 'string', default: '', maximumLength: 160 }
    },
    sources: [{
      publisher: 'Schneider Electric',
      title: 'LC1D09BD · TeSys D contactor · Product data sheet',
      url: 'https://iportal.se.com/Contents/docs/SQD-LC1D09BD.PDF',
      productUrl: 'https://www.se.com/us/en/product/LC1D09BD/iec-contactor-tesys-deca-nonreversing-9a-5hp-at-480vac-up-to-100ka-sccr-3-phase-3-no-24vdc-coil-open-style/',
      documentRevision: 'Manufacturer product data sheet; wiring diagram page 6; source document dated September 8, 2017.',
      revisionNote: 'Manufacturer sheet supplies coil, main and auxiliary terminal identities, contact composition, ratings and dimensions. Verify the exact product and application limits against the current manufacturer documentation before engineering use.',
      retrievedAt: '2026-11-12'
    }, {
      publisher: 'Schneider Electric',
      title: 'FAQ FA33405 · Low-consumption LC1D09–D38 coil current at 24 V DC',
      url: 'https://www.se.com/es/es/faqs/FA33405/',
      modifiedAt: '2025-04-09',
      retrievedAt: '2026-11-14',
      note: 'Average consumption is 2.4 W at 20 °C and nominal Uc; the FAQ states 100 mA at 24 V DC.'
    }]
  });
  const createHarmonyPushButtonDefinition = function (partNumber, color, contactType, terminalA, terminalB, positiveOpening) {
    const normallyOpen = contactType === 'normally-open';
    const id = 'schneider-electric-' + partNumber.toLowerCase();
    return deepFreeze({
      schemaVersion: COMPONENT_SCHEMA_VERSION,
      id: id,
      manufacturer: 'Schneider Electric',
      manufacturerPartNumber: partNumber,
      model: 'Harmony XB5 ' + partNumber,
      name: color + ' spring-return push-button, ' + (normallyOpen ? '1 NO' : '1 NC'),
      family: 'pushbutton',
      referencePrefix: 'S',
      category: 'Electrical · Verified control-station push-button',
      symbol: {
        id: 'pushbutton.harmony-xb5.' + partNumber.toLowerCase() + '.v1',
        view: 'schematic',
        unit: 'mm',
        width: 150,
        height: 90,
        representation: { standard: 'IEC-style functional representation', text: 'S', symbolType: 'momentary spring-return push-button contact; not manufacturer CAD geometry' },
        pins: [
          { id: 'contact-' + terminalA.toLowerCase().replace(/[^a-z0-9]+/g, '-'), localNumber: terminalA, name: 'Push-button contact terminal ' + terminalA, x: -55, y: 0, electricalType: 'passive', connectionType: 'screw-clamp' },
          { id: 'contact-' + terminalB.toLowerCase().replace(/[^a-z0-9]+/g, '-'), localNumber: terminalB, name: 'Push-button contact terminal ' + terminalB, x: 55, y: 0, electricalType: 'passive', connectionType: 'screw-clamp' }
        ],
        internalConnections: [],
        numberingNote: 'Terminal designations and normal contact type follow the exact Schneider Electric product data sheet. The static CAD net model does not change continuity when an operator is pressed.'
      },
      electricalFunctions: {
        pushButton: {
          actuation: 'momentary spring-return',
          normalContactState: normallyOpen ? 'open' : 'closed',
          pressedContactState: normallyOpen ? 'closed' : 'open',
          terminalPair: [terminalA, terminalB],
          simulationNote: 'The model documents momentary contact behavior but does not simulate actuation; pin continuity remains unmodeled and authored wires define nets.'
        }
      },
      specifications: {
        productFamily: { value: 'Harmony XB5' },
        operatorProfile: { value: color + ' flush, unmarked' },
        operatorType: { value: 'Spring return' },
        contactComposition: { value: normallyOpen ? '1 NO' : '1 NC' },
        contactOperation: { value: 'Slow-break' },
        terminalDesignation: { value: '(' + terminalA + '-' + terminalB + ')' + (normallyOpen ? 'NO' : 'NC') },
        terminalConnection: { value: 'Screw clamp' },
        mountingDiameter: { value: 22, unit: 'mm' },
        dimensions: { height: { value: 42, unit: 'mm' }, width: { value: 30, unit: 'mm' }, depth: { value: 52, unit: 'mm' } },
        positiveOpening: { value: positiveOpening }
      },
      instanceProperties: {
        terminalStrip: { type: 'string', default: '', maximumLength: 40 },
        position: { type: 'string', default: '', maximumLength: 24 },
        marking: { type: 'string', default: '', maximumLength: 40 },
        comment: { type: 'string', default: '', maximumLength: 160 }
      },
      sources: [{
        publisher: 'Schneider Electric',
        title: partNumber + ' · product data sheet',
        url: partNumber === 'XB5AA31'
          ? 'https://iportal.se.com/Contents/docs/SQD-XB5AA31_DATA%20SHEET.PDF'
          : 'https://www.se.com/id/id/product/XB5AA42/red-flush-complete-pushbutton-%C3%B822-spring-return-1nc-unmarked/',
        documentRevision: partNumber === 'XB5AA31' ? 'Schneider Electric product data sheet, 09-Jan-2019; retrieved 2026-11-12.' : 'Schneider Electric product page and product data; retrieved 2026-11-12.',
        revisionNote: partNumber === 'XB5AA31'
          ? 'Confirms complete green flush Ø22 spring-return push-button, one slow-break normally-open contact, screw-clamp terminals 13-14, and 42 × 30 × 52 mm overall dimensions.'
          : 'Confirms complete red flush Ø22 spring-return push-button, one slow-break normally-closed contact, screw-clamp terminals 21-22, positive opening per EN/IEC 60947-5-1 Appendix K, and 42 × 30 × 52 mm overall dimensions.',
        retrievedAt: '2026-11-12'
      }]
    });
  };
  const schneiderStartPushButtonDefinition = createHarmonyPushButtonDefinition('XB5AA31', 'Green', 'normally-open', '13', '14', false);
  const schneiderStopPushButtonDefinition = createHarmonyPushButtonDefinition('XB5AA42', 'Red', 'normally-closed', '21', '22', true);
  const schneiderPilotLightDefinition = deepFreeze({
    schemaVersion: COMPONENT_SCHEMA_VERSION,
    id: 'schneider-electric-xb5avb3',
    manufacturer: 'Schneider Electric',
    manufacturerPartNumber: 'XB5AVB3',
    model: 'Harmony XB5 XB5AVB3',
    name: 'Green 24 V AC/DC pilot light',
    family: 'lamp',
    referencePrefix: 'H',
    category: 'Electrical · Verified panel signaling',
    symbol: {
      id: 'lamp.harmony-xb5.xb5avb3.v1', view: 'schematic', unit: 'mm', width: 70, height: 60,
      representation: { standard: 'IEC-style functional representation', text: 'H', symbolType: 'pilot light' },
      pins: [
        { id: 'x1', localNumber: 'X1', name: 'Pilot light terminal X1', x: -27, y: 0, electricalType: 'passive', connectionType: 'screw-clamp' },
        { id: 'x2', localNumber: 'X2', name: 'Pilot light terminal X2', x: 27, y: 0, electricalType: 'passive', connectionType: 'screw-clamp' }
      ],
      internalConnections: [],
      numberingNote: 'Schneider Electric identifies the pilot light terminal pair as X1–X2.'
    },
    electricalFunctions: { simulationNote: 'The CAD model preserves both terminal nets and does not simulate illumination or current draw.' },
    specifications: {
      ratedSupplyVoltage: { value: 24, unit: 'V AC/DC' },
      mountingDiameter: { value: 22, unit: 'mm' },
      lightSource: { value: 'Integral green LED' },
      terminalConnection: { value: 'Screw clamp' }
    },
    instanceProperties: {
      marking: { type: 'string', default: '', maximumLength: 40 },
      comment: { type: 'string', default: '', maximumLength: 160 }
    },
    sources: [{ publisher: 'Schneider Electric', title: 'XB5AVB3 product data sheet',
      url: 'https://iportal.se.com/Contents/docs/SQD-XB5AVB3.PDF', documentRevision: '13-Mar-2018',
      revisionNote: 'Identifies the X1–X2 terminals, 24 V AC/DC rating, mounting diameter and green integral LED.', retrievedAt: '2026-11-21' }]
  });
  const motorStarterDefinition = deepFreeze({
    schemaVersion: COMPONENT_SCHEMA_VERSION,
    id: 'siemens-3rm1201-1aa04',
    manufacturer: 'Siemens',
    manufacturerPartNumber: '3RM1201-1AA04',
    model: 'SIRIUS 3RM1 3RM1201-1AA04',
    name: '24 V DC reversing motor starter',
    family: 'motor-starter-reversing',
    referencePrefix: 'Q',
    category: 'Electrical · Verified reversing motor starter',
    symbol: {
      id: 'motor-starter.sirius-3rm12.3rm1201-1aa04.v1',
      view: 'schematic',
      unit: 'mm',
      width: 240,
      height: 220,
      pins: [
        { id: 'power-l1', localNumber: '1/L1', name: 'Phase L1 line terminal', x: -50, y: -110, electricalType: 'passive', connectionType: 'screw' },
        { id: 'power-l2', localNumber: '3/L2', name: 'Phase L2 line terminal', x: 0, y: -110, electricalType: 'passive', connectionType: 'screw' },
        { id: 'power-l3', localNumber: '5/L3', name: 'Phase L3 line terminal', x: 50, y: -110, electricalType: 'passive', connectionType: 'screw' },
        { id: 'power-t1', localNumber: '2/T1', name: 'Motor phase T1 output', x: -50, y: 110, electricalType: 'passive', connectionType: 'screw' },
        { id: 'power-t2', localNumber: '4/T2', name: 'Motor phase T2 output', x: 0, y: 110, electricalType: 'passive', connectionType: 'screw' },
        { id: 'power-t3', localNumber: '6/T3', name: 'Motor phase T3 output', x: 50, y: 110, electricalType: 'passive', connectionType: 'screw' },
        { id: 'control-a1', localNumber: 'A1', name: '24 V DC control supply positive', x: -120, y: -75, electricalType: 'passive', connectionType: 'screw' },
        { id: 'control-in1', localNumber: 'IN1', name: 'Start input, direction 1', x: -120, y: -45, electricalType: 'passive', connectionType: 'screw' },
        { id: 'control-in2', localNumber: 'IN2', name: 'Start input, direction 2', x: -120, y: -15, electricalType: 'passive', connectionType: 'screw' },
        { id: 'control-in3', localNumber: 'IN3', name: 'Reset input', x: -120, y: 15, electricalType: 'passive', connectionType: 'screw' },
        { id: 'control-a2', localNumber: 'A2', name: '24 V DC control supply return', x: -120, y: 45, electricalType: 'passive', connectionType: 'screw' },
        { id: 'signal-out', localNumber: 'OUT', name: 'Run signaling output, 24 V DC version', x: 120, y: -60, electricalType: 'passive', connectionType: 'screw' },
        { id: 'signal-95', localNumber: '95', name: 'Fault signaling contact common', x: 120, y: -20, electricalType: 'passive', connectionType: 'screw' },
        { id: 'signal-96', localNumber: '96', name: 'Fault signaling contact terminal 96', x: 120, y: 20, electricalType: 'passive', connectionType: 'screw' },
        { id: 'signal-98', localNumber: '98', name: 'Fault signaling contact terminal 98', x: 120, y: 60, electricalType: 'passive', connectionType: 'screw' }
      ],
      internalConnections: [],
      numberingNote: 'Terminal designations and positions follow Siemens SIRIUS 3RM1 equipment manual circuit diagrams. The model preserves each external connection independently; direction switching, protection and signal-contact state are not simulated.'
    },
    electricalFunctions: {
      reversingStarter: {
        lineTerminals: ['power-l1', 'power-l2', 'power-l3'],
        motorTerminals: ['power-t1', 'power-t2', 'power-t3'],
        directionInputs: ['control-in1', 'control-in2'],
        controlSupply: ['control-a1', 'control-a2'],
        resetInput: 'control-in3',
        runSignalOutput: 'signal-out',
        faultSignalContacts: ['signal-95', 'signal-96', 'signal-98'],
        simulationNote: 'The 3RM12 contains a reversing starter. Internal power switching, motor protection response, direction interlocking and signal-contact behavior are not simulated or included as phantom nets.'
      }
    },
    specifications: {
      maximumRatedOperationalVoltage: { value: 500, unit: 'V' },
      ratedMotorPowerAt400V: { value: 0.12, unit: 'kW', note: 'Maximum motor power at 400 V AC per Siemens catalog.' },
      adjustableRatedOperationalCurrent: { minimum: 0.1, maximum: 0.5, unit: 'A' },
      controlSupplyVoltage: { value: 24, unit: 'V DC' },
      connectionMethod: { value: 'Screw terminals' },
      starterType: { value: 'Standard reversing starter, 3RM12' },
      mainCircuitTerminals: { value: ['1/L1', '3/L2', '5/L3', '2/T1', '4/T2', '6/T3'] },
      controlCircuitTerminals: { value: ['A1', 'A2', 'IN1', 'IN2', 'IN3', 'OUT'] },
      faultSignalTerminals: { value: ['95', '96', '98'] }
    },
    instanceProperties: {
      terminalStrip: { type: 'string', default: '', maximumLength: 40 },
      position: { type: 'string', default: '', maximumLength: 24 },
      marking: { type: 'string', default: '', maximumLength: 40 },
      comment: { type: 'string', default: '', maximumLength: 160 }
    },
    sources: [
      {
        publisher: 'Siemens',
        title: '3RM1201-1AA04 · SIRIUS 3RM1 reversing starter · Industry Mall',
        url: 'https://mall.industry.siemens.com/mall/en/en/Catalog/Product/?mlfb=3RM1201-1AA04',
        documentRevision: 'Live manufacturer product catalog; retrieved 2026-11-12.',
        revisionNote: 'Confirms exact active article number, reversing-starter family, 500 V, 0–0.12 kW, 0.1–0.5 A, 24 V DC and screw terminals.',
        retrievedAt: '2026-11-12'
      },
      {
        publisher: 'Siemens',
        title: 'SIRIUS 3RM1 Motor Starter · Equipment Manual',
        url: 'https://cache.industry.siemens.com/dl/files/730/66295730/att_919653/v3/manual_motorstarter_SIRIUS_3RM1_en-US.pdf',
        documentRevision: 'Equipment Manual, 09/2024, A5E0345285095020A/RS-AJ/009.',
        revisionNote: 'Circuit diagrams and terminal-cover layout identify phase, motor, supply, direction, reset, run-signal and fault-signal terminals for the standard 24 V DC 3RM12 reversing starter.',
        retrievedAt: '2026-11-12'
      }
    ]
  });
  const motorProtectionBreakerDefinition = deepFreeze({
    schemaVersion: COMPONENT_SCHEMA_VERSION,
    id: 'siemens-3rv2011-1ja10',
    manufacturer: 'Siemens',
    manufacturerPartNumber: '3RV2011-1JA10',
    model: 'SIRIUS 3RV2 size S00',
    name: 'Motor-protection circuit breaker',
    family: 'motor-protection-breaker',
    referencePrefix: 'Q',
    category: 'Electrical · Verified motor-protection breaker',
    symbol: {
      id: 'breaker.sirius-3rv2.3rv2011-1ja10.v1',
      view: 'schematic',
      unit: 'mm',
      width: 180,
      height: 220,
      representation: { standard: 'IEC-style functional representation', text: 'Q', symbolType: 'three-pole motor-protection circuit breaker; not manufacturer CAD geometry' },
      pins: [
        { id: 'line-l1', localNumber: '1/L1', name: 'Phase L1 line terminal', x: -50, y: -90, electricalType: 'passive', connectionType: 'screw' },
        { id: 'line-l2', localNumber: '3/L2', name: 'Phase L2 line terminal', x: 0, y: -90, electricalType: 'passive', connectionType: 'screw' },
        { id: 'line-l3', localNumber: '5/L3', name: 'Phase L3 line terminal', x: 50, y: -90, electricalType: 'passive', connectionType: 'screw' },
        { id: 'load-t1', localNumber: '2/T1', name: 'Phase T1 load terminal', x: -50, y: 90, electricalType: 'passive', connectionType: 'screw' },
        { id: 'load-t2', localNumber: '4/T2', name: 'Phase T2 load terminal', x: 0, y: 90, electricalType: 'passive', connectionType: 'screw' },
        { id: 'load-t3', localNumber: '6/T3', name: 'Phase T3 load terminal', x: 50, y: 90, electricalType: 'passive', connectionType: 'screw' }
      ],
      internalConnections: [],
      numberingNote: 'Main terminals follow the Siemens SIRIUS 3RV2 equipment manual: 1/L1, 3/L2, 5/L3 line side and 2/T1, 4/T2, 6/T3 load side. The static drawing model does not assume a contact state, trip response, protection coordination or an electrical bridge between poles.'
    },
    electricalFunctions: {
      motorProtection: {
        lineTerminals: ['line-l1', 'line-l2', 'line-l3'],
        loadTerminals: ['load-t1', 'load-t2', 'load-t3'],
        poles: [['line-l1', 'load-t1'], ['line-l2', 'load-t2'], ['line-l3', 'load-t3']],
        simulationNote: 'Three-pole motor-protection function is documented. Set the overload release against the actual motor nameplate and application review; the adjustment range alone does not establish suitability. Switching state, thermal/magnetic trip behavior, fault interruption and coordination are not simulated; connect only the external terminals with authored wires.'
      }
    },
    specifications: {
      productFamily: { value: 'SIRIUS 3RV2' },
      frameSize: { value: 'S00' },
      overloadTripClass: { value: 10, unit: 'Class' },
      adjustableOverloadRelease: { minimum: 7, maximum: 10, unit: 'A' },
      instantaneousShortCircuitRelease: { value: 130, unit: 'A' },
      mainPoleCount: { value: 3 },
      ratedOperationalVoltage: { minimum: 20, maximum: 690, unit: 'V AC' },
      connectionMethod: { value: 'Screw terminals' },
      referenceCode: { value: 'Q' }
    },
    instanceProperties: {
      overloadSettingA: { type: 'number', default: null, minimum: 7, maximum: 10, step: 'any' },
      terminalStrip: { type: 'string', default: '', maximumLength: 40 },
      position: { type: 'string', default: '', maximumLength: 24 },
      marking: { type: 'string', default: '', maximumLength: 40 },
      comment: { type: 'string', default: '', maximumLength: 160 }
    },
    sources: [
      {
        publisher: 'Siemens',
        title: '3RV2011-1JA10 · product data sheet',
        url: 'https://support.industry.siemens.com/teddatasheet/?caller=SIOS&format=pdf&language=en&mlfbs=3RV2011-1JA10',
        documentRevision: 'Siemens product data sheet, 6 pages; retrieved 2026-11-12.',
        revisionNote: 'Confirms S00 size, Class 10, adjustable overload release 7–10 A, instantaneous N-release 130 A, three main poles and screw terminals.',
        retrievedAt: '2026-11-12'
      },
      {
        publisher: 'Siemens',
        title: 'SIRIUS 3RV Motor Starter Protectors · Equipment Manual',
        url: 'https://support.industry.siemens.com/cs/attachments/60279172/manual_SIRIUS_circuit_breaker_3RV_en-US.pdf',
        documentRevision: 'Equipment Manual, 05/2025, A5E03656507320A/RS-AM/013.',
        revisionNote: 'Identifies the 3RV2 main terminal designations and line/load sides; explains the S00 motor-setting control and connection guidance.',
        retrievedAt: '2026-11-12'
      }
    ]
  });
  const lowRangeMotorProtectionBreakerDefinition = deepFreeze(Object.assign({}, motorProtectionBreakerDefinition, {
    id: 'siemens-3rv2011-0fa10',
    manufacturerPartNumber: '3RV2011-0FA10',
    model: 'SIRIUS 3RV2 size S00',
    name: 'Low-range motor-protection circuit breaker',
    category: 'Electrical · Verified motor-protection breaker',
    symbol: Object.assign({}, motorProtectionBreakerDefinition.symbol, {
      id: 'breaker.sirius-3rv2.3rv2011-0fa10.v1'
    }),
    specifications: Object.assign({}, motorProtectionBreakerDefinition.specifications, {
      adjustableOverloadRelease: { minimum: 0.35, maximum: 0.5, unit: 'A' },
      instantaneousShortCircuitRelease: { value: 6.5, unit: 'A' },
      ratedOperationalCurrent: { value: 0.5, unit: 'A' },
      ratedMotorPower400V: { value: 0.12, unit: 'kW' }
    }),
    instanceProperties: Object.assign({}, motorProtectionBreakerDefinition.instanceProperties, {
      overloadSettingA: { type: 'number', default: null, minimum: 0.35, maximum: 0.5, step: 'any' }
    }),
    sources: [
      {
        publisher: 'Siemens',
        title: '3RV2011-0FA10 · product data sheet',
        url: 'https://support.industry.siemens.com/teddatasheet/?caller=SIOS&format=pdf&language=en&mlfbs=3RV2011-0FA10',
        documentRevision: 'Siemens product data sheet, 6 pages; retrieved 2026-11-12.',
        revisionNote: 'Confirms S00 size, Class 10, adjustable overload release 0.35–0.5 A, instantaneous magnetic release 6.5 A, three main poles, 0.5 A rated operational current, 0.12 kW at 400 V and screw terminals.',
        retrievedAt: '2026-11-12'
      },
      motorProtectionBreakerDefinition.sources[1]
    ]
  }));
  const motorDefinition = deepFreeze({
    schemaVersion: COMPONENT_SCHEMA_VERSION,
    id: 'sew-eurodrive-drn63ms4',
    manufacturer: 'SEW-EURODRIVE',
    manufacturerPartNumber: 'DRN63MS4',
    model: 'DRN63MS4',
    name: 'Three-phase AC induction motor',
    family: 'motor-induction',
    referencePrefix: 'M',
    category: 'Electrical · Verified 3-phase motor',
    symbol: {
      id: 'motor.induction.drn63ms4.v1',
      view: 'schematic',
      unit: 'mm',
      width: 120,
      height: 120,
      representation: { standard: 'IEC', text: 'M 3~', symbolType: 'three-phase induction motor' },
      pins: [
        { id: 'winding-u1', localNumber: 'U1', name: 'Winding U line end', x: -50, y: -60, electricalType: 'passive', connectionType: 'terminal-block' },
        { id: 'winding-v1', localNumber: 'V1', name: 'Winding V line end', x: 0, y: -60, electricalType: 'passive', connectionType: 'terminal-block' },
        { id: 'winding-w1', localNumber: 'W1', name: 'Winding W line end', x: 50, y: -60, electricalType: 'passive', connectionType: 'terminal-block' },
        { id: 'winding-u2', localNumber: 'U2', name: 'Winding U star end', x: -50, y: 60, electricalType: 'passive', connectionType: 'terminal-block' },
        { id: 'winding-v2', localNumber: 'V2', name: 'Winding V star end', x: 0, y: 60, electricalType: 'passive', connectionType: 'terminal-block' },
        { id: 'winding-w2', localNumber: 'W2', name: 'Winding W star end', x: 50, y: 60, electricalType: 'passive', connectionType: 'terminal-block' },
        { id: 'protective-earth', localNumber: 'PE', name: 'Protective earth connection', x: 60, y: 0, electricalType: 'passive', connectionType: 'protective-earth' }
      ],
      internalConnections: [],
      numberingNote: 'U1/V1/W1 and U2/V2/W2 are the manufacturer winding-terminal designations; PE is the motor protective-earth terminal. Winding pairs are electrical coils, not galvanically shorted nets. The example wires the high-voltage star point externally.'
    },
    electricalFunctions: {
      statorWindings: [
        { lineEnd: 'winding-u1', starEnd: 'winding-u2', nominalPower: { value: 0.12, unit: 'kW' } },
        { lineEnd: 'winding-v1', starEnd: 'winding-v2', nominalPower: { value: 0.12, unit: 'kW' } },
        { lineEnd: 'winding-w1', starEnd: 'winding-w2', nominalPower: { value: 0.12, unit: 'kW' } }
      ],
      terminalBoard: {
        connection: 'Star (Y) for 400 V, 50 Hz operation',
        phaseInputs: ['winding-u1', 'winding-v1', 'winding-w1'],
        starPoint: ['winding-u2', 'winding-v2', 'winding-w2'],
        protectiveEarth: 'protective-earth'
      },
      simulationNote: 'This component records source-backed winding and PE terminals. Motor torque, speed, rotation, load, thermal behavior and electrical dynamics are not simulated.'
    },
    specifications: {
      frame: { value: '63M' },
      ratedOutputPower: { value: 0.12, unit: 'kW' },
      ratedLineCurrentAt400V50Hz: { value: 0.405, unit: 'A' },
      ratedVoltage: { value: '230 V Δ / 400 V Y' },
      ratedFrequency: { value: 50, unit: 'Hz' },
      ratedSpeed: { value: 1380, unit: 'rpm' },
      ratedTorque: { value: 0.83, unit: 'Nm' },
      powerFactor: { value: 0.64 },
      phaseCount: { value: 3 },
      mountingMethod: { value: 'IEC foot-mounted IM B3' },
      connectionMethod: { value: 'Six-terminal motor board; bolted winding connections' },
      supplyConnectionAt400V: { value: 'Star (Y); U2/V2/W2 linked together' }
    },
    instanceProperties: {
      terminalStrip: { type: 'string', default: '', maximumLength: 40 },
      position: { type: 'string', default: '', maximumLength: 24 },
      marking: { type: 'string', default: '', maximumLength: 40 },
      comment: { type: 'string', default: '', maximumLength: 160 }
    },
    documentation: {
      manufacturerCatalog: 'https://download.sew-eurodrive.com/download/pdf/30590116.pdf',
      installationManual: 'https://download.sew-eurodrive.com/download/pdf/25957074.pdf',
      wiringDiagram: 'https://download.sew-eurodrive.com/download/pdf/25957074.pdf',
      connectionDiagram: 'https://download.sew-eurodrive.com/download/pdf/25957074.pdf',
      diagramReference: 'Star connection for high voltage: U2/V2/W2 linked; L1/L2/L3 on U1/V1/W1.',
      ansiNfpaRepresentation: 'Not included in this IEC-oriented component record; no ANSI/NFPA-specific source representation was verified.',
      compatibleAccessories: [],
      compatibilityNote: 'No motor-specific accessory list is recorded; do not infer accessories from this base motor record.'
    },
    sources: [
      {
        publisher: 'SEW-EURODRIVE',
        title: 'DRN.. AC motors · motor data table, 400 V, 50 Hz, 4-pole',
        url: 'https://download.sew-eurodrive.com/download/pdf/30590116.pdf',
        documentRevision: 'Manufacturer catalog/document 30590116/EN, 03/2023.',
        revisionNote: 'Manufacturer table identifies DRN63MS4, 0.12 kW, 0.405 A, 1380 rpm, 0.83 Nm and power factor 0.64 for 400 V / 50 Hz operation.',
        retrievedAt: '2026-11-12'
      },
      {
        publisher: 'SEW-EURODRIVE',
        title: 'Operating Instructions · AC Motors DR..71–315, DRN63–315, DR2..56–80',
        url: 'https://download.sew-eurodrive.com/download/pdf/25957074.pdf',
        documentRevision: 'Manufacturer operating instructions 25957074/EN, 06/2019.',
        revisionNote: 'Manufacturer wiring diagrams identify U1/V1/W1, U2/V2/W2, the 400 V star connection, terminal-board wiring and PE connection.',
        retrievedAt: '2026-11-12'
      }
    ]
  });
  const siemensPowerContactorDefinition = deepFreeze(Object.assign({}, contactorDefinition, {
    id: 'siemens-3rt2026-2kb40', manufacturer: 'Siemens', manufacturerPartNumber: '3RT2026-2KB40',
    model: 'SIRIUS 3RT2026-2KB40', name: 'Three-pole power contactor · 24 V DC coil', category: 'Electrical · Verified Siemens motor-control contactor',
    symbol: Object.assign({}, contactorDefinition.symbol, { id: 'contactor.siemens-3rt2.3rt2026-2kb40.v1', numberingNote: 'A1+/A2−, 1/L1–6/T3, 13/14 (NO), and 21/22 (NC) follow the Siemens model-specific circuit diagram. Schematic terminal coordinates are connection points, not a physical footprint; contact and coil states are not simulated.' }),
    electricalFunctions: Object.assign({}, contactorDefinition.electricalFunctions, { contactor: Object.assign({}, contactorDefinition.electricalFunctions.contactor, {
      coil: { pins: ['coil-a1','coil-a2'], nominalVoltage: { value: 24, unit: 'V DC' }, polarity: { positive: 'A1', negative: 'A2' }, suppression: 'Plug-in varistor per Siemens product data sheet' },
      simulationNote: 'Main poles, auxiliary contacts, coil actuation and interlocking are not simulated. Only explicitly wired external terminals are joined in the static net model.'
    }) }),
    specifications: Object.assign({}, contactorDefinition.specifications, { ac3RatedCurrent: { value: 25, unit: 'A' }, ratedOperationalCurrentAC3At400V: { value: 25, unit: 'A' }, ratedMotorPowerAt400V: { value: 11, unit: 'kW' }, auxiliaryContactComposition: { value: '1 NO + 1 NC' }, frameSize: { value: 'S0' }, connectionMethod: { value: 'Spring-loaded terminal' }, coilSuppression: { value: 'Plugged-in varistor' } }),
    sources: [{ publisher: 'Siemens', title: 'SIRIUS 3RT2026-2KB40 product data sheet', url: 'https://support.industry.siemens.com/teddatasheet/?caller=SIOS&format=pdf&language=en&mlfbs=3RT2026-2KB40', documentRevision: 'Data sheet, 8 pages; retrieved 2026-11-12.', revisionNote: 'Confirms 25 A AC-3, 11 kW at 400 V, 24 V DC coil, 1 NO + 1 NC auxiliary contacts, spring terminals, S0 frame, and circuit diagram terminal labels A1+/A2−, 1/L1–6/T3, 13/14 and 21/22.', retrievedAt: '2026-11-12' }]
  }));
  const siemensOverloadRelayDefinition = deepFreeze(Object.assign({}, motorProtectionBreakerDefinition, {
    id: 'siemens-3ru2126-4ab0', manufacturerPartNumber: '3RU2126-4AB0', model: 'SIRIUS 3RU2126-4AB0',
    name: 'Thermal overload relay · 11–16 A', family: 'motor-overload-relay', category: 'Electrical · Verified thermal overload relay',
    symbol: Object.assign({}, motorProtectionBreakerDefinition.symbol, { id: 'overload.siemens-3ru2.3ru2126-4ab0.v1', width: 280,
      pins: motorProtectionBreakerDefinition.symbol.pins.concat([
        { id: 'aux-95', localNumber: '95', name: 'Normally-closed trip contact common', x: 90, y: -20, electricalType: 'passive', connectionType: 'screw' },
        { id: 'aux-96', localNumber: '96', name: 'Normally-closed trip contact output', x: 90, y: -5, electricalType: 'passive', connectionType: 'screw' },
        { id: 'aux-97', localNumber: '97', name: 'Normally-open trip contact common', x: 90, y: 15, electricalType: 'passive', connectionType: 'screw' },
        { id: 'aux-98', localNumber: '98', name: 'Normally-open trip contact output', x: 90, y: 30, electricalType: 'passive', connectionType: 'screw' }
      ]),
      numberingNote: 'Main circuit terminals 1/L1, 3/L2, 5/L3 and 2/T1, 4/T2, 6/T3; auxiliary trip contact 95/96 (NC) and 97/98 (NO) follow Siemens SIRIUS 3RU2 wiring diagrams. The model does not infer internal conductive links or trip state.'
    }),
    electricalFunctions: { motorOverloadProtection: { lineTerminals: ['line-l1','line-l2','line-l3'], loadTerminals: ['load-t1','load-t2','load-t3'], tripContacts: [{ pins: ['aux-95','aux-96'], type: 'NC' }, { pins: ['aux-97','aux-98'], type: 'NO' }], simulationNote: 'Thermal response, reset, trip timing and motor protection are not simulated. The adjustable range alone does not establish application suitability or a selected setting.' } },
    specifications: { productFamily: { value: 'SIRIUS 3RU2' }, frameSize: { value: 'S0' }, overloadTripClass: { value: 10, unit: 'Class' }, adjustableOverloadRelease: { minimum: 11, maximum: 16, unit: 'A' }, mainPoleCount: { value: 3 }, ratedOperationalVoltage: { minimum: 20, maximum: 690, unit: 'V AC' }, connectionMethod: { value: 'Screw terminals' }, resetMode: { value: 'Manual / automatic selectable' }, referenceCode: { value: 'F' } },
    instanceProperties: Object.assign({}, motorProtectionBreakerDefinition.instanceProperties, { overloadSettingA: { type: 'number', default: null, minimum: 11, maximum: 16, step: 'any' } }),
    sources: [
      { publisher: 'Siemens', title: 'SIRIUS 3RU2126-4AB0 product data sheet', url: 'https://support.industry.siemens.com/teddatasheet/?caller=SIOS&format=pdf&language=en&mlfbs=3RU2126-4AB0', documentRevision: 'Data sheet, 5 pages; retrieved 2026-11-12.', revisionNote: 'Confirms thermal overload relay, 11–16 A adjustable range, three poles, S0, Class 10, screw terminals, contactor mounting and manual/automatic reset.', retrievedAt: '2026-11-12' },
      { publisher: 'Siemens', title: 'SIRIUS 3RU / 3RB overload relays · Equipment Manual', url: 'https://support.industry.siemens.com/cs/attachments/60298164/manual_SIRIUS_overload_relay_3RU_3RB_en-US.pdf', documentRevision: 'Equipment Manual, 07/2024, A5E03656507420A/RS-AF/007.', revisionNote: 'Figure 13-3 identifies the S0 3RU2 main terminals and 95/96 and 97/98 auxiliary contacts.', retrievedAt: '2026-11-12' }
    ]
  }));
  const starDeltaMotorProtectionBreakerDefinition = deepFreeze(Object.assign({}, motorProtectionBreakerDefinition, {
    id: 'siemens-3rv2021-4aa10', manufacturerPartNumber: '3RV2021-4AA10', model: 'SIRIUS 3RV2021-4AA10', name: 'Motor-protection circuit breaker · 10–16 A',
    symbol: Object.assign({}, motorProtectionBreakerDefinition.symbol, { id: 'breaker.sirius-3rv2.3rv2021-4aa10.v1' }),
    specifications: Object.assign({}, motorProtectionBreakerDefinition.specifications, { adjustableOverloadRelease: { minimum: 10, maximum: 16, unit: 'A' }, instantaneousShortCircuitRelease: { value: 208, unit: 'A' }, ratedOperationalCurrent: { value: 16, unit: 'A' } }),
    instanceProperties: Object.assign({}, motorProtectionBreakerDefinition.instanceProperties, { overloadSettingA: { type: 'number', default: null, minimum: 10, maximum: 16, step: 'any' } }),
    sources: [
      { publisher: 'Siemens', title: 'SIRIUS 3RV2021-4AA10 product data sheet', url: 'https://support.industry.siemens.com/teddatasheet/?caller=SIOS&format=pdf&language=en&mlfbs=3RV2021-4AA10', documentRevision: 'Product data sheet, 6 pages; retrieved 2026-11-12.', revisionNote: 'Confirms size S0, Class 10, 10–16 A adjustable overload release, 208 A instantaneous N-release, three poles and 690 V rated insulation.', retrievedAt: '2026-11-12' },
      motorProtectionBreakerDefinition.sources[1]
    ]
  }));
  const sewStarDeltaMotorDefinition = deepFreeze(Object.assign({}, motorDefinition, {
    id: 'sew-eurodrive-drn132m4', manufacturerPartNumber: 'DRN132M4', model: 'DRN132M4', name: 'Three-phase AC induction motor · 400 V Δ / 690 V Y',
    category: 'Electrical · Verified 3-phase star-delta motor',
    symbol: Object.assign({}, motorDefinition.symbol, { id: 'motor.induction.drn132m4.v1', numberingNote: 'U1/V1/W1 and U2/V2/W2 are the six winding ends; PE is protective earth. SEW standard-voltage table specifies 400 V Δ / 690 V Y for DRN132M–DRN315 at 50 Hz.' }),
    electricalFunctions: Object.assign({}, motorDefinition.electricalFunctions, {
      statorWindings: [{ lineEnd: 'winding-u1', starEnd: 'winding-u2' }, { lineEnd: 'winding-v1', starEnd: 'winding-v2' }, { lineEnd: 'winding-w1', starEnd: 'winding-w2' }],
      terminalBoard: { connection: '400 V Δ / 690 V Y at 50 Hz', phaseInputs: ['winding-u1','winding-v1','winding-w1'], starPoint: ['winding-u2','winding-v2','winding-w2'], protectiveEarth: 'protective-earth' }
    }),
    specifications: { frame: { value: '132M' }, ratedOutputPower: { value: 7.5, unit: 'kW' }, ratedLineCurrentAt400V50Hz: { value: 15.2, unit: 'A' }, ratedVoltage: { value: '400 V Δ / 690 V Y' }, ratedFrequency: { value: 50, unit: 'Hz' }, ratedSpeed: { value: 1468, unit: 'rpm' }, ratedTorque: { value: 49, unit: 'Nm' }, powerFactor: { value: 0.78 }, phaseCount: { value: 3 }, mountingMethod: { value: 'IEC frame 132M; mounting variant not specified' }, connectionMethod: { value: 'Six-terminal motor board; bolted winding connections' }, supplyConnectionAt400V: { value: 'Delta (Δ) after star-delta transition' } },
    sources: [
      { publisher: 'SEW-EURODRIVE', title: 'DRN.. motor data table · 400 V / 50 Hz / 4-pole', url: 'https://download.sew-eurodrive.com/download/pdf/30590116.pdf', documentRevision: 'Manufacturer document 30590116/EN, 03/2023.', revisionNote: 'Motor table records DRN132M4, 7.5 kW, 15.2 A, 1468 rpm, 49 Nm and power factor 0.78 at 400 V / 50 Hz.', retrievedAt: '2026-11-12' },
      { publisher: 'SEW-EURODRIVE', title: 'DRN.. AC motors · standard-voltage table', url: 'https://download.sew-eurodrive.com/download/pdf/30590116.pdf', documentRevision: 'Manufacturer document 30590116/EN, 03/2023.', revisionNote: 'Standard voltage table assigns 400 V Δ / 690 V Y at 50 Hz to DRN132M–DRN315 (7.5–200 kW).', retrievedAt: '2026-11-12' },
      { publisher: 'SEW-EURODRIVE', title: 'AC Motors DR..71–315, DRN63–315 · Operating Instructions', url: 'https://download.sew-eurodrive.com/download/pdf/25957074.pdf', documentRevision: 'Manufacturer operating instructions 25957074/EN, 06/2019.', revisionNote: 'Wiring diagrams identify the six winding ends U1/V1/W1, U2/V2/W2 and PE.', retrievedAt: '2026-11-12' }
    ]
  }));
  const siemensStarDeltaTimerDefinition = deepFreeze({
    schemaVersion: COMPONENT_SCHEMA_VERSION, id: 'siemens-3rp2576-2nw30', manufacturer: 'Siemens', manufacturerPartNumber: '3RP2576-2NW30',
    model: 'SIRIUS 3RP2576-2NW30', name: 'Star-delta timing relay · 3–60 s', family: 'star-delta-timer', referencePrefix: 'K', category: 'Electrical · Verified star-delta timing relay',
    symbol: { id: 'timer.siemens.3rp2576-2nw30.v1', view: 'schematic', unit: 'mm', width: 150, height: 90, representation: { standard: 'IEC functional relay diagram', text: 'Y / Δ', symbolType: 'star-delta timing relay with shared output common' }, pins: [
      { id: 'supply-a1', localNumber: 'A1', name: 'Control supply A1', x: -75, y: -25, electricalType: 'passive', connectionType: 'push-in' },
      { id: 'supply-a2', localNumber: 'A2', name: 'Control supply A2', x: -75, y: 25, electricalType: 'passive', connectionType: 'push-in' },
      { id: 'contact-common-17', localNumber: '17', name: 'Shared output contact common', x: 75, y: -25, electricalType: 'passive', connectionType: 'push-in' },
      { id: 'star-output-18', localNumber: '18', name: 'Instantaneous star output', x: 75, y: 0, electricalType: 'passive', connectionType: 'push-in' },
      { id: 'delta-output-28', localNumber: '28', name: 'Time-delayed delta output', x: 75, y: 25, electricalType: 'passive', connectionType: 'push-in' }
    ], internalConnections: [], numberingNote: 'A1/A2 supply and 17 shared common with 18 instantaneous star and 28 delayed delta follow the Siemens model-specific data sheet. These external pins do not imply simulated contact state.' },
    electricalFunctions: { starDeltaTiming: { supplyPins: ['supply-a1','supply-a2'], sharedOutputCommon: 'contact-common-17', instantaneousStarOutput: 'star-output-18', delayedDeltaOutput: 'delta-output-28', timeRangeSeconds: { minimum: 3, maximum: 60 }, changeoverDelayMilliseconds: 50, note: 'Siemens specifies a 50 ms star-to-delta changeover delay to prevent phase-to-phase shorts. Relay switching is not simulated.' } },
    specifications: { function: { value: 'Star-delta (wye-delta) timing relay' }, outputContacts: { value: '2 NO with shared root' }, timeRangeSeconds: { minimum: 3, maximum: 60, unit: 's' }, controlSupply: { minimum: 12, maximum: 240, unit: 'V AC/DC' }, changeoverDelay: { value: 50, unit: 'ms' }, connectionMethod: { value: 'Spring-type push-in terminal' } },
    instanceProperties: { delaySeconds: { type: 'number', default: null, minimum: 3, maximum: 60, step: 'any' }, terminalStrip: { type: 'string', default: '', maximumLength: 40 }, position: { type: 'string', default: '', maximumLength: 24 }, marking: { type: 'string', default: '', maximumLength: 40 }, comment: { type: 'string', default: '', maximumLength: 160 } },
    sources: [
      { publisher: 'Siemens', title: 'SIRIUS 3RP2576-2NW30 product data sheet', url: 'https://support.industry.siemens.com/teddatasheet/?caller=SIOS&format=pdf&language=en&mlfbs=3RP25762NW30', documentRevision: 'Data sheet, 6 pages; retrieved 2026-11-12.', revisionNote: 'Confirms 3–60 s star-delta function, 12–240 V AC/DC supply, two NO contacts and terminal identifiers A1, A2, 17, 18 and 28.', retrievedAt: '2026-11-12' },
      { publisher: 'Siemens', title: 'SIRIUS 3RP25 Time Relays · Equipment Manual', url: 'https://support.industry.siemens.com/cs/attachments/103532830/manual_3RP25_time_relay_en-US.pdf', documentRevision: 'Equipment Manual, 09/2019, A5E31947765002A/RS-AC/003.', revisionNote: 'Section 6.6 documents shared-root instantaneous star and delayed delta outputs and the 50 ms transition pause.', retrievedAt: '2026-11-12' }
    ]
  });
  const siemensCpuPinRows = [
    ['X10', '1', 'L+ / 24 V DC'], ['X10', '2', 'M / 24 V DC'], ['X10', '3', 'Functional Earth'],
    ['X10', '4', 'L+ / 24 V DC Sensor Out'], ['X10', '5', 'M / 24 V DC Sensor Out'], ['X10', '6', '1M'],
    ['X10', '7', 'DI a.0'], ['X10', '8', 'DI a.1'], ['X10', '9', 'DI a.2'], ['X10', '10', 'DI a.3'],
    ['X10', '11', 'DI a.4'], ['X10', '12', 'DI a.5'], ['X10', '13', 'DI a.6'], ['X10', '14', 'DI a.7'],
    ['X11', '1', '2M'], ['X11', '2', 'AI 0'], ['X11', '3', 'AI 1'],
    ['X12', '1', '3L+'], ['X12', '2', '3M'], ['X12', '3', 'DQ a.0'], ['X12', '4', 'DQ a.1'],
    ['X12', '5', 'DQ a.2'], ['X12', '6', 'DQ a.3'], ['X12', '7', 'DQ a.4'], ['X12', '8', 'DQ a.5']
  ];
  const siemensCpuPins = siemensCpuPinRows.map(function (row, index) {
    const group = row[0], groupIndex = siemensCpuPinRows.slice(0, index).filter(function (item) { return item[0] === group; }).length;
    const y = group === 'X10' ? -126 + groupIndex * 18 : group === 'X11' ? -126 + groupIndex * 18 : -8 + groupIndex * 16;
    return { id: group.toLowerCase() + '-' + row[1], localNumber: group + ':' + row[1], name: row[2], x: group === 'X10' ? -130 : 130, y: y, electricalType: 'passive', connectionType: 'plug-in terminal' };
  });
  const siemensCpuDefinition = deepFreeze({
    schemaVersion: COMPONENT_SCHEMA_VERSION, id: 'siemens-6es7212-1ae40-0xb0', manufacturer: 'Siemens', manufacturerPartNumber: '6ES7212-1AE40-0XB0',
    model: 'SIMATIC S7-1200 CPU 1212C DC/DC/DC', name: 'Compact PLC CPU', family: 'plc-cpu', referencePrefix: 'A', category: 'Automation · Verified PLC CPU',
    symbol: { id: 'plc.siemens.cpu-1212c.dcdcdc.v2', view: 'schematic', unit: 'mm', width: 260, height: 290, pins: siemensCpuPins, internalConnections: [], numberingNote: 'Terminal group and pin identities X10, X11 and X12 match Siemens System Manual V4.7, Table A-50. Pin coordinates are schematic connection points, not physical connector geometry.' },
    specifications: {
      onboardDigitalInputs: { value: 8, unit: '24 V DC DI' }, onboardDigitalOutputs: { value: 6, unit: '24 V DC transistor DQ' }, onboardAnalogInputs: { value: 2, unit: '0–10 V DC AI' },
      supplyVoltage: { minimum: 20.4, maximum: 28.8, unit: 'V DC' }, programDataMemory: { value: 100, unit: 'KB' },
      terminalGroups: { value: ['X10 · power, sensor supply and 8 DI', 'X11 · 2 AI and 2M', 'X12 · 6 DQ and load supplies'] }
    },
    instanceProperties: { marking: { type: 'string', default: '', maximumLength: 40 }, position: { type: 'string', default: '', maximumLength: 24 }, comment: { type: 'string', default: '', maximumLength: 160 } },
    sources: [
      { publisher: 'Siemens', title: 'SIMATIC S7-1200 System Manual V4.7 · CPU 1212C DC/DC/DC · Tables A-49 and A-50', url: 'https://support.industry.siemens.com/cs/attachments/109977302/s71200_system_manual_en-US.pdf', documentRevision: 'V4.7 · 12/2024 · A5E02486680-AQ', revisionNote: 'Manufacturer manual supplies exact connector pin assignments for X10, X11 and X12.' , retrievedAt: '2026-11-12' },
      { publisher: 'Siemens', title: 'SIMATIC S7-1200 CPU 1212C product record', url: 'https://mall.industry.siemens.com/mall/en/gb/Catalog/Product/6ES72121AE400XB0', documentRevision: 'Live manufacturer product record', revisionNote: 'Confirms onboard I/O counts and DC supply range.', retrievedAt: '2026-11-12' }
    ]
  });
  const ifmInductiveSensorDefinition = deepFreeze({
    schemaVersion: COMPONENT_SCHEMA_VERSION, id: 'ifm-ifs204', manufacturer: 'ifm', manufacturerPartNumber: 'IFB3004BBPKG/US-104', model: 'IFS204', name: 'Inductive proximity sensor · PNP NO · 4 mm', family: 'sensor-inductive-pnp', referencePrefix: 'B', category: 'Automation · Verified inductive sensor',
    symbol: { id: 'sensor.ifm.ifs204.pnp-no.v1', view: 'schematic', unit: 'mm', width: 100, height: 70, pins: [
      { id: 'pin-1-lplus', localNumber: '1', name: 'L+ · brown', x: -50, y: -20, electricalType: 'passive', connectionType: 'M12 A-coded' },
      { id: 'pin-3-lminus', localNumber: '3', name: 'L− · blue', x: -50, y: 20, electricalType: 'passive', connectionType: 'M12 A-coded' },
      { id: 'pin-4-output', localNumber: '4', name: 'Switching output · black', x: 50, y: 0, electricalType: 'passive', connectionType: 'M12 A-coded' }
    ], internalConnections: [], numberingNote: 'Pin numbers and wire colors follow the ifm connection diagram. Pin 2 is not a populated contact on this 3-contact connector.' },
    electricalFunctions: { output: { type: 'PNP', normalState: 'open', outputPin: 'pin-4-output', positiveSupplyPin: 'pin-1-lplus', returnPin: 'pin-3-lminus', actuation: 'Object detection within the specified sensing range', simulation: 'Sensor actuation and PLC logic are not simulated; the drawing represents wiring and published device behavior only.' } },
    specifications: { operatingVoltage: { minimum: 10, maximum: 30, unit: 'V DC' }, nominalSensingRange: { value: 4, unit: 'mm' }, outputFunction: { value: 'PNP normally open' }, maximumOutputCurrent: { value: 100, unit: 'mA' }, maximumSwitchingFrequency: { value: 700, unit: 'Hz' }, connection: { value: 'M12 × 1 · A-coded · 3 gold-plated contacts' }, protection: { value: 'IP67' } },
    instanceProperties: { marking: { type: 'string', default: '', maximumLength: 40 }, position: { type: 'string', default: '', maximumLength: 24 }, sensingTarget: { type: 'string', default: '', maximumLength: 60 }, comment: { type: 'string', default: '', maximumLength: 160 } },
    sources: [{ publisher: 'ifm electronic', title: 'IFS204 inductive sensor data sheet · IFB3004BBPKG/US-104', url: 'https://media.ifm.com/dam/546f88cf-4cdf-47ac-b6ee-bee685c33458/Original/IFS204-02_EN-GB.pdf', documentRevision: 'EN-GB · IFS204-02 · 26.06.2025', revisionNote: 'Manufacturer data sheet verifies PNP normally-open output, 4 mm nominal sensing range, 10–30 V DC and the 3-contact M12 connection. Pin 1=L+, pin 3=L−, pin 4=output per manufacturer connection drawing.', retrievedAt: '2026-11-12' }]
  });
  const ifmPressureSensorDefinition = deepFreeze({
    schemaVersion: COMPONENT_SCHEMA_VERSION, id: 'ifm-pn2070', manufacturer: 'ifm electronic', manufacturerPartNumber: 'PN-400-SER14-MFRKG/US/ /V', model: 'PN2070', name: 'Pressure sensor · 0–400 bar · configurable analog output', family: 'sensor-pressure-analog', referencePrefix: 'B', category: 'Automation · Verified pressure sensor',
    symbol: { id: 'sensor.ifm.pn2070.analog.v1', view: 'schematic', unit: 'mm', width: 130, height: 100, pins: [
      { id: 'pin-1-lplus', localNumber: '1', name: 'L+ · BN brown', x: -65, y: -25, electricalType: 'passive', connectionType: 'M12 × 1 · A-coded · 4-pin' },
      { id: 'pin-2-out2', localNumber: '2', name: 'OUT2 · WH white · analog output', x: 65, y: -25, electricalType: 'passive', connectionType: 'M12 × 1 · A-coded · 4-pin' },
      { id: 'pin-3-lminus', localNumber: '3', name: 'L− · BU blue', x: -65, y: 25, electricalType: 'passive', connectionType: 'M12 × 1 · A-coded · 4-pin' },
      { id: 'pin-4-out1', localNumber: '4', name: 'OUT1 · BK black · switching / IO-Link', x: 65, y: 25, electricalType: 'passive', connectionType: 'M12 × 1 · A-coded · 4-pin' }
    ], internalConnections: [], numberingNote: 'ifm connection diagram: pin 1 BN=L+, pin 2 WH=OUT2, pin 4 BK=OUT1, pin 3 BU=L−. OUT2 is configurable as 4–20 mA or 0–10 V; ifm lists 4–20 mA as factory default. Pin coordinates are schematic points, not physical connector geometry.' },
    electricalFunctions: { analogOutput: { outputPin: 'pin-2-out2', supplyPin: 'pin-1-lplus', returnPin: 'pin-3-lminus', digitalOutputPin: 'pin-4-out1', factoryConfiguration: '4–20 mA; verify actual device setting', voltageRange: '0–10 V DC · scalable 1:5', currentRange: '4–20 mA · scalable 1:5', simulation: 'Pressure sensing, analog conversion, calibration and device configuration are not simulated.' } },
    specifications: {
      measuringRange: { minimum: 0, maximum: 400, unit: 'bar relative pressure' }, operatingVoltage: { minimum: 18, maximum: 30, unit: 'V DC' },
      analogVoltageOutput: { minimum: 0, maximum: 10, unit: 'V DC · scalable 1:5' }, analogCurrentOutput: { minimum: 4, maximum: 20, unit: 'mA · scalable 1:5' },
      voltageOutputMinimumLoad: { value: 2000, unit: 'Ω' }, currentOutputMaximumLoad: { value: 500, unit: 'Ω' }, processConnection: { value: 'G 1/4 internal thread' },
      electricalConnection: { value: 'M12 × 1 · A-coded · 4-pin' }, currentConsumption: { value: '<35', unit: 'mA' }
    },
    instanceProperties: { marking: { type: 'string', default: '', maximumLength: 40 }, position: { type: 'string', default: '', maximumLength: 24 }, processPoint: { type: 'string', default: '', maximumLength: 60 }, signalConfigurationNote: { type: 'string', default: '', maximumLength: 100 }, comment: { type: 'string', default: '', maximumLength: 160 } },
    sources: [
      { publisher: 'ifm electronic', title: 'PN2070 · PN-400-SER14-MFRKG/US/ /V product data', url: 'https://www.ifm.com/ae/en/product/PN2070', documentRevision: 'PN2070-02 · 2024-03-01', revisionNote: 'Manufacturer lists the exact product variant, 0–400 bar relative range, 18–30 V DC supply, configurable 0–10 V / 4–20 mA output, G 1/4 process connection and M12 connector.', retrievedAt: '2026-11-12' },
      { publisher: 'ifm electronic', title: 'PN2070 data sheet and connection diagram', url: 'https://media.ifm.com/dam/d61b3c6f-dc2b-4fe0-af49-278f0521b2d6/Original/PN2070-02_EN-GB.pdf', documentRevision: 'PN2070-02 · 2024-03-01', revisionNote: 'Connection diagram maps pins 1/BN=L+, 2/WH=OUT2, 4/BK=OUT1 and 3/BU=L−. Voltage output minimum load is 2000 Ω; current output maximum load is 500 Ω.', retrievedAt: '2026-11-12' },
      { publisher: 'ifm electronic', title: 'PN pressure sensor programming guide', url: 'https://www.ifm.com/us/en/us/learn-more/pressure/pn/programming', documentRevision: 'Current manufacturer web guide', revisionNote: 'ifm states OUT2 is factory-configured for current; output mode and analog endpoints require device configuration.', retrievedAt: '2026-11-12' }
    ]
  });
  const siemensSitopPsuDefinition = deepFreeze({
    schemaVersion: COMPONENT_SCHEMA_VERSION, id: 'siemens-sitop-psu100c-6ep1332-5ba00', manufacturer: 'Siemens', manufacturerPartNumber: '6EP1332-5BA00',
    model: 'SITOP PSU100C · 24 V/2.5 A', name: 'Single-phase AC/DC power supply', family: 'power-supply-ac-dc', referencePrefix: 'PS', category: 'Power · Verified supply',
    symbol: { id: 'power.siemens.sitop-psu100c.v1', view: 'schematic', unit: 'mm', width: 180, height: 160, pins: [
      { id: 'line-l', localNumber: 'L', name: 'Line input L', x: -90, y: -30, electricalType: 'passive', connectionType: 'screw terminal' },
      { id: 'line-n', localNumber: 'N', name: 'Line input N', x: -90, y: 0, electricalType: 'passive', connectionType: 'screw terminal' },
      { id: 'line-pe', localNumber: 'PE', name: 'Protective earth input', x: -90, y: 30, electricalType: 'passive', connectionType: 'screw terminal' },
      { id: 'output-positive', localNumber: '+', name: '24 V DC positive output', x: 90, y: -30, electricalType: 'passive', connectionType: 'screw terminal' },
      { id: 'output-negative', localNumber: '-', name: 'DC return output', x: 90, y: 30, electricalType: 'passive', connectionType: 'screw terminal' }
    ], internalConnections: [], numberingNote: 'Manufacturer terminal designations L, N, PE, + and − are retained. Siemens specifies two physical − output screw terminals; this schematic symbol represents their shared return as one functional pin. Pin coordinates are schematic connection points, not physical terminal geometry.' },
    electricalFunctions: { supply: { input: 'Single-phase AC or DC', output: '24 V DC', ratedOutputCurrent: '2.5 A', simulation: 'Power conversion, startup, protection response and isolation behavior are not simulated; input and output pins remain separate electrical endpoints.' } },
    specifications: {
      acInputVoltage: { minimum: 85, maximum: 264, unit: 'V AC' }, dcInputVoltage: { minimum: 110, maximum: 300, unit: 'V DC' },
      outputVoltage: { value: 24, unit: 'V DC' }, ratedOutputCurrent: { value: 2.5, unit: 'A' },
      inputConnections: { value: 'L, N, PE · one screw terminal each' }, outputConnections: { value: '+ · one screw terminal; − · two screw terminals' },
      connectionSystem: { value: 'Screw terminal' }, mounting: { value: 'EN 60715 35 × 7.5/15 mm rail' }, degreeOfProtection: { value: 'IP20' }
    },
    instanceProperties: { marking: { type: 'string', default: '', maximumLength: 40 }, position: { type: 'string', default: '', maximumLength: 24 }, comment: { type: 'string', default: '', maximumLength: 160 } },
    sources: [{ publisher: 'Siemens', title: 'SITOP PSU100C operating instructions · 6EP1332-5BA00', url: 'https://support.industry.siemens.com/cs/attachments/65647808/PSU100C_Handbuch_englisch_en-US.pdf', documentRevision: 'C98130-A7599-A1-2-762937 · 06/2013', revisionNote: 'Manufacturer sections 2.2 and 6.1–6.7 identify L/N/PE line input, + and − DC output, 85–264 V AC / 110–300 V DC input ranges, 24 V/2.5 A output and two physical − output screw terminals. Schematic coordinates are not physical geometry.', retrievedAt: '2026-11-12' }]
  });
  const phoenixProtectiveEarthTerminalDefinition = deepFreeze({
    schemaVersion: COMPONENT_SCHEMA_VERSION, id: 'phoenix-contact-3212147', manufacturer: 'Phoenix Contact', manufacturerPartNumber: '3212147',
    model: 'PT 16 N-PE', name: 'Protective-conductor terminal block', family: 'protective-earth-terminal', referencePrefix: 'X', category: 'Electrical · Verified protective-earth terminal',
    symbol: { id: 'terminal.phoenix.pt16npe.2-connection.v1', view: 'schematic', unit: 'mm', width: 70, height: 36, pins: [
      { id: 'connection-1', localNumber: '1', name: 'PE connection 1 · model-local index', x: -35, y: 0, electricalType: 'passive', connectionType: 'push-in' },
      { id: 'connection-2', localNumber: '2', name: 'PE connection 2 · model-local index', x: 35, y: 0, electricalType: 'passive', connectionType: 'push-in' }
    ], internalConnections: [['connection-1', 'connection-2']], numberingNote: 'Phoenix Contact specifies two connections and a grounding foot but does not assign terminal numbers; 1 and 2 are model-local connection indexes. The rail bonding foot is not modeled as a separate pin.' },
    specifications: {
      ratedCrossSection: { value: 16, unit: 'mm²' }, rigidConductorRange: { minimum: 0.5, maximum: 25, unit: 'mm²' },
      flexibleConductorRange: { minimum: 0.5, maximum: 25, unit: 'mm²' }, connectionCount: { value: 2, unit: 'connections' },
      connectionMethod: { value: 'Push-in' }, productStandard: { value: 'IEC 60947-7-2' }, groundingFoot: { value: true },
      mountingRails: { value: ['NS 35/7.5', 'NS 35/15'] }, color: { value: 'Green-yellow' }
    },
    instanceProperties: { terminalStrip: { type: 'string', default: '', maximumLength: 40 }, position: { type: 'string', default: '', maximumLength: 24 }, marking: { type: 'string', default: '', maximumLength: 40 }, comment: { type: 'string', default: '', maximumLength: 160 } },
    sources: [{ publisher: 'Phoenix Contact', title: 'PT 16 N-PE · Protective conductor terminal block · Item 3212147', url: 'https://www.phoenixcontact.com/en-nl/products/ground-terminal-pt-16-n-pe-3212147', documentRevision: 'Live manufacturer product data · retrieved 2026-11-12', revisionNote: 'Manufacturer specifies two push-in connections, 16 mm² rated cross-section, 0.5–25 mm² conductor range, IEC 60947-7-2, green-yellow color and a grounding foot. It does not number the connection points.' , retrievedAt: '2026-11-12' }]
  });
  const pt25ProtectiveEarthTerminal = deepFreeze({
    ...phoenixProtectiveEarthTerminalDefinition,
    id: 'phoenix-contact-3209536', manufacturerPartNumber: '3209536', model: 'PT 2,5-PE',
    symbol: { ...phoenixProtectiveEarthTerminalDefinition.symbol, id: 'terminal.phoenix.pt25pe.2-connection.v1' },
    specifications: {
      ...phoenixProtectiveEarthTerminalDefinition.specifications,
      ratedCrossSection: { value: 2.5, unit: 'mm²' },
      rigidConductorRange: { minimum: 0.14, maximum: 4, unit: 'mm²' },
      flexibleConductorRange: { minimum: 0.14, maximum: 4, unit: 'mm²' },
      strippingLength: { minimum: 8, maximum: 10, unit: 'mm' },
      dimensions: {
        width: { value: 5.2, unit: 'mm' }, height: { value: 48.5, unit: 'mm' },
        depthOnNS35_7_5: { value: 36.8, unit: 'mm' }, depthOnNS35_15: { value: 44.3, unit: 'mm' }
      }
    },
    sources: [{
      publisher: 'Phoenix Contact', title: 'PT 2,5-PE · Protective conductor terminal block · Item 3209536',
      url: 'https://www.phoenixcontact.com/en-be/products/ground-terminal-pt-25-pe-3209536',
      documentRevision: null, revisionNote: 'Live manufacturer product catalog and connection data.', retrievedAt: '2026-11-21'
    }]
  });
  const COMPONENTS = Object.freeze({ [terminalDefinition.id]: terminalDefinition, [pt25Terminal.id]: pt25Terminal, [pttb25Terminal.id]: pttb25Terminal, [pt25DisconnectTerminal.id]: pt25DisconnectTerminal, [relayDefinition.id]: relayDefinition, [contactorDefinition.id]: contactorDefinition, [siemensPowerContactorDefinition.id]: siemensPowerContactorDefinition, [siemensOverloadRelayDefinition.id]: siemensOverloadRelayDefinition, [siemensStarDeltaTimerDefinition.id]: siemensStarDeltaTimerDefinition, [schneiderStartPushButtonDefinition.id]: schneiderStartPushButtonDefinition, [schneiderStopPushButtonDefinition.id]: schneiderStopPushButtonDefinition, [schneiderPilotLightDefinition.id]: schneiderPilotLightDefinition, [motorProtectionBreakerDefinition.id]: motorProtectionBreakerDefinition, [lowRangeMotorProtectionBreakerDefinition.id]: lowRangeMotorProtectionBreakerDefinition, [starDeltaMotorProtectionBreakerDefinition.id]: starDeltaMotorProtectionBreakerDefinition, [motorStarterDefinition.id]: motorStarterDefinition, [motorDefinition.id]: motorDefinition, [sewStarDeltaMotorDefinition.id]: sewStarDeltaMotorDefinition, [siemensCpuDefinition.id]: siemensCpuDefinition, [ifmInductiveSensorDefinition.id]: ifmInductiveSensorDefinition, [ifmPressureSensorDefinition.id]: ifmPressureSensorDefinition, [siemensSitopPsuDefinition.id]: siemensSitopPsuDefinition, [phoenixProtectiveEarthTerminalDefinition.id]: phoenixProtectiveEarthTerminalDefinition, [pt25ProtectiveEarthTerminal.id]: pt25ProtectiveEarthTerminal });

  function reorderObject(objects,id,direction) {
    if (!Array.isArray(objects) || (direction !== 1 && direction !== -1)) return false;
    const index = objects.findIndex(function (object) { return object && object.id === id; });
    const target = index + direction;
    if (index < 0 || target < 0 || target >= objects.length) return false;
    const moved = objects.splice(index, 1)[0];
    objects.splice(target, 0, moved);
    return true;
  }

  function resizeGraphicObject(object, corner, point) {
    if (!object || !['rect', 'ellipse', 'triangle', 'circle'].includes(object.kind) ||
        !['nw', 'ne', 'sw', 'se'].includes(corner) || !point ||
        !finite(point.x) || !finite(point.y) ||
        !finite(object.x) || !finite(object.y) || !finite(object.x2) || !finite(object.y2)) return false;
    const minimum = 8; // 2 mm in the workspace's 4 SVG units per mm.
    if (object.kind === 'circle') {
      const radius = Math.hypot(point.x - object.x, point.y - object.y) / Math.SQRT2;
      if (radius < minimum) return false;
      object.x2 = object.x + radius;
      object.y2 = object.y;
      if (Object.prototype.hasOwnProperty.call(object, 'x1')) {
        object.x1 = object.x;
        object.y1 = object.y;
      }
      return true;
    }
    const left = Math.min(object.x, object.x2);
    const right = Math.max(object.x, object.x2);
    const top = Math.min(object.y, object.y2);
    const bottom = Math.max(object.y, object.y2);
    const fixedX = corner.endsWith('w') ? right : left;
    const fixedY = corner.startsWith('n') ? bottom : top;
    const nextLeft = Math.min(point.x, fixedX);
    const nextRight = Math.max(point.x, fixedX);
    const nextTop = Math.min(point.y, fixedY);
    const nextBottom = Math.max(point.y, fixedY);
    if (nextRight - nextLeft < minimum || nextBottom - nextTop < minimum) return false;
    object.x = nextLeft;
    object.y = nextTop;
    object.x2 = nextRight;
    object.y2 = nextBottom;
    if (Object.prototype.hasOwnProperty.call(object, 'x1')) {
      object.x1 = nextLeft;
      object.y1 = nextTop;
    }
    return true;
  }

  function customSymbolDefinition(symbol) {
    if (!symbol || typeof symbol.id !== 'string' || !/^user-symbol-[a-z0-9-]+$/i.test(symbol.id)
      || typeof symbol.name !== 'string' || !symbol.name.trim() || symbol.name.length > 80
      || !Array.isArray(symbol.geometry) || !symbol.geometry.length || symbol.geometry.length > 500
      || !symbol.geometry.every(shape => shape && ['line', 'rect', 'circle'].includes(shape.kind) && [shape.x, shape.y, shape.x2, shape.y2].every(finite))
      || !Array.isArray(symbol.pins) || !symbol.pins.length || symbol.pins.length > 100
      || !symbol.pins.every(pin => pin && typeof pin.number === 'string' && /^[a-z0-9:/._-]{1,24}$/i.test(pin.number) && finite(pin.x) && finite(pin.y))
      || new Set(symbol.pins.map(pin => pin.number)).size !== symbol.pins.length) return null;
    const points = symbol.geometry.flatMap(shape => [{ x: shape.x, y: shape.y }, { x: shape.x2, y: shape.y2 }]).concat(symbol.pins);
    return {
      id: symbol.id, name: symbol.name, model: symbol.name, manufacturer: '', manufacturerPartNumber: '',
      family: 'user-authored', category: 'Project symbols', referencePrefix: 'X', instanceProperties: {}, sources: [],
      symbol: { internalConnections: [], width: Math.max(...points.map(point => point.x)) - Math.min(...points.map(point => point.x)),
        height: Math.max(...points.map(point => point.y)) - Math.min(...points.map(point => point.y)),
        pins: symbol.pins.map(pin => ({ id: 'terminal-' + pin.number, localNumber: pin.number, name: 'Terminal ' + pin.number,
          electricalType: 'passive', x: pin.x, y: pin.y })) }
    };
  }

  function component(id, customSymbol) {
    return Object.hasOwn(COMPONENTS, id) ? COMPONENTS[id] : customSymbol?.id === id ? customSymbolDefinition(customSymbol) : null;
  }
  function isTerminalDefinition(definition) {
    return ['feedthrough-terminal', 'protective-earth-terminal', 'disconnect-terminal'].includes(definition?.family);
  }
  function disconnectTerminalGeometry(instance) {
    return {
      segments: [[-35, 0, -12, 0], [12, 0, 35, 0], [-12, 0, 12, instance.properties?.knifePosition === 'closed' ? 0 : -11]],
      circles: [[-35, 0, 3], [35, 0, 3], [-12, 0, 2], [12, 0, 2]]
    };
  }
  function plcChannelType(pin) {
    return /^(DI|DQ|AI) /.exec(pin.name)?.[1];
  }
  function catalog(query = '') {
    const normalize = value => value.normalize('NFKD').toLowerCase().replace(/[^a-z0-9]/g, '');
    const terms = String(query).trim().split(/\s+/).map(normalize).filter(Boolean);
    return Object.values(COMPONENTS).filter(function (def) {
      if (!terms.length) return true;
      const fields = [def.id, def.name, def.model, def.manufacturerPartNumber, def.manufacturer, def.category, def.family].map(normalize);
      return terms.every(term => fields.some(field => field.includes(term)));
    }).map(function (def) {
      return { id: def.id, componentId: def.id, name: def.model + ' · ' + def.manufacturerPartNumber, category: def.category, family: def.family, tag: def.referencePrefix || 'X' };
    });
  }
  function createInstance(componentId, x, y, ref, customSymbol) {
    const def = component(componentId, customSymbol);
    if (!def) throw new Error('Unknown verified component: ' + componentId);
    if (!finite(x) || !finite(y)) throw new TypeError('Component coordinates must be finite numbers.');
    const properties = {};
    Object.keys(def.instanceProperties).forEach(function (name) {
      properties[name] = def.instanceProperties[name].default;
    });
    return {
      schemaVersion: COMPONENT_SCHEMA_VERSION,
      kind: 'component-instance',
      id: 'cmp-' + (root.crypto && typeof root.crypto.randomUUID === 'function'
        ? root.crypto.randomUUID()
        : Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 11)),
      componentId: componentId,
      ref: typeof ref === 'string' && ref.trim() ? ref.trim().slice(0, 32) : (def.referencePrefix || 'X') + '1',
      x: x,
      y: y,
      rotation: 0,
      ...(def.family === 'user-authored' ? { customSymbol: clone(customSymbol) } : {}),
      properties: properties
    };
  }
  function validateInstance(instance) {
    const errors = [];
    if (!instance || typeof instance !== 'object') return { valid: false, errors: ['Component instance must be an object.'] };
    const def = component(instance.componentId, instance.customSymbol);
    if (instance.kind !== 'component-instance') errors.push('Object is not a component instance.');
    if (instance.schemaVersion !== COMPONENT_SCHEMA_VERSION) errors.push('Unsupported component schema version.');
    if (!def) errors.push('Component ID has no verified definition.');
    if (!finite(instance.x) || !finite(instance.y)) errors.push('Component position is invalid.');
    if (instance.symbolScale !== undefined && (!finite(instance.symbolScale) || instance.symbolScale < 0.25 || instance.symbolScale > 4)) {
      errors.push('Component symbol scale must be between 0.25 and 4.');
    }
    if (![0, 90, 180, 270].includes(instance.rotation)) errors.push('Component rotation must be 0, 90, 180, or 270 degrees.');
    if (typeof instance.id !== 'string' || !instance.id || instance.id.length > 100) errors.push('Component instance ID is invalid.');
    if (typeof instance.ref !== 'string' || !instance.ref.trim() || instance.ref.length > 32) errors.push('Component reference is invalid.');
    if (!instance.properties || typeof instance.properties !== 'object' || Array.isArray(instance.properties)) errors.push('Component instance properties are missing.');
    if (def && instance.properties && typeof instance.properties === 'object' && !Array.isArray(instance.properties)) {
      Object.keys(def.instanceProperties).forEach(function (name) {
        const value = instance.properties[name];
        const rule = def.instanceProperties[name];
        const invalidNumber = rule.type === 'number' && value !== undefined && value !== null &&
          (!finite(value) || value < rule.minimum || value > rule.maximum);
        const invalidString = rule.type === 'string' && value !== undefined &&
          (typeof value !== 'string' || value.length > rule.maximumLength);
        const invalidChoice = rule.type === 'choice' && value !== undefined &&
          (typeof value !== 'string' || !Object.hasOwn(rule.choices, value));
        if (invalidNumber || invalidString || invalidChoice) {
          errors.push('Component property "' + name + '" is invalid.');
        }
      });
      Object.keys(instance.properties).forEach(function (name) {
        if (!Object.prototype.hasOwnProperty.call(def.instanceProperties, name)) errors.push('Unknown editable component property "' + name + '".');
      });
    }
    return { valid: errors.length === 0, errors: errors, definition: def };
  }

  function moveInstance(instance, x, y) {
    const result = validateInstance(instance);
    if (!result.valid) throw new Error(result.errors.join(' '));
    if (!finite(x) || !finite(y)) throw new TypeError('Component coordinates must be finite numbers.');
    instance.x = x;
    instance.y = y;
    return instance;
  }
  function rotateInstance(instance, degrees) {
    const result = validateInstance(instance);
    if (!result.valid) throw new Error(result.errors.join(' '));
    if (!finite(degrees) || degrees % 90 !== 0) throw new TypeError('Component rotation must use 90-degree increments.');
    const next = ((instance.rotation + degrees) % 360 + 360) % 360;
    if (![0, 90, 180, 270].includes(next)) throw new TypeError('Component rotation must be 0, 90, 180, or 270 degrees.');
    instance.rotation = next;
    return instance;
  }
  function worldPins(instance) {
    const result = validateInstance(instance);
    if (!result.valid) return [];
    const angle = instance.rotation * Math.PI / 180;
    const scale = instance.symbolScale ?? 1;
    const cos = Math.cos(angle) * scale, sin = Math.sin(angle) * scale;
    return result.definition.symbol.pins.map(function (pin) {
      return {
        id: pin.id,
        number: pin.localNumber,
        name: pin.name,
        electricalType: pin.electricalType,
        x: instance.x + pin.x * cos - pin.y * sin,
        y: instance.y + pin.x * sin + pin.y * cos
      };
    });
  }
  function validateProject(project) {
    const errors = [];
    if (!project || typeof project !== 'object') return { valid: false, errors: ['Project must be a JSON object.'] };
    if (project.format !== PROJECT_FORMAT) errors.push('Unsupported Adigun project format.');
    if (![1, PROJECT_VERSION].includes(project.version)) errors.push('Unsupported project version.');
    if (!Array.isArray(project.objects) || !Array.isArray(project.sheets)) errors.push('Project objects and sheets must be arrays.');
    if (project.projectModel?.userSymbols !== undefined) {
      const symbols = project.projectModel.userSymbols;
      if (!Array.isArray(symbols) || symbols.some(symbol => !customSymbolDefinition(symbol))
        || new Set(symbols.map(symbol => symbol.id)).size !== symbols.length) errors.push('Project symbol definitions are invalid.');
    }
    if (Array.isArray(project.sheets)) {
      const sheetIds = new Set();
      project.sheets.forEach(function (sheet, index) {
        if (!sheet || typeof sheet !== 'object' || typeof sheet.id !== 'string' || !sheet.id.trim()) {
          errors.push('Sheet ' + (index + 1) + ' must have a non-empty string ID.');
          return;
        }
        if (sheetIds.has(sheet.id)) errors.push('Duplicate sheet ID: ' + sheet.id + '.');
        sheetIds.add(sheet.id);
        if (sheet.paperSize === 'Custom' && (!finite(sheet.paperWidthMm) || !finite(sheet.paperHeightMm)
          || sheet.paperWidthMm <= 0 || sheet.paperHeightMm <= 0)) errors.push('Sheet ' + sheet.id + ' has invalid custom paper dimensions.');
        if (sheet.paperMargins !== undefined || sheet.paperSize === 'Custom') {
          try { checkPaperMargins(projectSheetMargins(sheet), sheet.paperWidthMm || 420, sheet.paperHeightMm || 297); }
          catch (error) { errors.push('Sheet ' + sheet.id + ': ' + error.message); }
        }
        for (const key of ['gridIntervalMm', 'snapIntervalMm']) {
          if (sheet[key] !== undefined && (!finite(sheet[key]) || sheet[key] < 0.001 || sheet[key] > 10000)) {
            errors.push('Sheet ' + sheet.id + ' has an invalid ' + key + '.');
          }
        }
        if (sheet.guides !== undefined && (!Array.isArray(sheet.guides) || sheet.guides.some(guide => !guide
          || !['x', 'y'].includes(guide.axis) || !finite(guide.position)))) errors.push('Sheet ' + sheet.id + ' has invalid guides.');
      });
      if (Array.isArray(project.objects)) {
        project.objects.forEach(function (object, index) {
          if (!object || typeof object !== 'object') return;
          if (object.sheetId && !sheetIds.has(object.sheetId)) {
            errors.push('Drawing object ' + (object.id || index + 1) + ' refers to unknown sheet ' + object.sheetId + '.');
          } else if (project.sheets.length > 1 && !object.sheetId) {
            errors.push('Drawing object ' + (object.id || index + 1) + ' must identify its sheet in a multi-sheet project.');
          }
        });
      }
    }
    if (Array.isArray(project.objects)) {
      const componentsById = new Map(project.objects.filter(object => object?.kind === 'component-instance').map(object => [object.id, object]));
      project.objects.forEach(function (object, index) {
        if (!object || typeof object !== 'object') {
          errors.push('Drawing object ' + (index + 1) + ' is invalid.');
          return;
        }
        if (object.kind === 'component-instance') {
          const validation = validateInstance(object);
          validation.errors.forEach(function (error) { errors.push('Object ' + (object.ref || index + 1) + ': ' + error); });
        } else if (object.kind === 'catalog-symbol' || ['terminal', 'plc', 'motor', 'ground'].includes(object.kind)) {
          errors.push('Project contains a legacy visual-only component. It must be replaced with a verified component before import.');
        } else if (object.kind === 'dimension') {
          if (![object.x1, object.y1, object.x2, object.y2].every(finite)
            || (object.x1 === object.x2 && object.y1 === object.y2)) errors.push('Dimension ' + (object.id || index + 1) + ' needs two distinct points.');
        } else if (object.kind === 'wire') {
          const label = 'Wire ' + (object.id || index + 1);
          if (![object.x1, object.y1, object.x2, object.y2].every(finite)) errors.push(label + ' has invalid coordinates.');
          if (object.bends !== undefined && !validWireBends(object.bends)) errors.push(label + ' has invalid route bends.');
          if (object.pinAttachments !== undefined) {
            if (!object.pinAttachments || typeof object.pinAttachments !== 'object' || Array.isArray(object.pinAttachments)) {
              errors.push(label + ' has invalid terminal attachments.');
            } else for (const [end, index] of [['start', 1], ['end', 2]]) {
              const attachment = object.pinAttachments[end];
              if (attachment == null) continue;
              const instance = componentsById.get(attachment.instanceId);
              const pin = instance && instance.sheetId === object.sheetId && worldPins(instance).find(item => item.id === attachment.pinId);
              if (!pin || Math.abs(pin.x - object['x' + index]) > EPSILON || Math.abs(pin.y - object['y' + index]) > EPSILON) {
                errors.push(label + ' has an invalid ' + end + ' terminal reference or anchor.');
              }
            }
          }
          for (const field of ['cableId', 'coreId']) {
            const value = object[field];
            if (value !== undefined && (typeof value !== 'string' || value.length > 80)) {
              errors.push(label + ' has an invalid ' + field + '. Expected text up to 80 characters.');
            }
          }
        }
      });
    }
    if (project.crossSheetConnections !== undefined && !Array.isArray(project.crossSheetConnections)) {
      errors.push('Project cross-sheet connections must be an array.');
    }

    if (Array.isArray(project.crossSheetConnections)) {
      const knownSheetIds = new Set((Array.isArray(project.sheets) ? project.sheets : []).filter(function (sheet) {
        return sheet && typeof sheet.id === 'string';
      }).map(function (sheet) { return sheet.id; }));
      const connectionIds = new Set();
      const globallyUsedEndpoints = new Set();
      const wiresBySheet = new Map();
      const refsBySheet = new Map();
      for (const object of (Array.isArray(project.objects) ? project.objects : [])) {
        if (object?.kind === 'wire') {
          if (!wiresBySheet.has(object.sheetId)) wiresBySheet.set(object.sheetId, new Map());
          const wires = wiresBySheet.get(object.sheetId);
          if (!wires.has(object.id)) wires.set(object.id, object);
        } else if (object?.kind === 'component-instance') {
          if (!refsBySheet.has(object.sheetId)) refsBySheet.set(object.sheetId, new Set());
          refsBySheet.get(object.sheetId).add(object.ref);
        }
      }
      project.crossSheetConnections.forEach(function (connection, index) {
        const label = 'Cross-sheet connection ' + (connection && connection.id || index + 1);
        if (!connection || typeof connection !== 'object' || typeof connection.id !== 'string' ||
            !connection.id.trim() || typeof connection.name !== 'string' || !connection.name.trim()) {
          errors.push(label + ' must have a non-empty ID and name.');
          return;
        }
        if (connectionIds.has(connection.id)) errors.push('Duplicate cross-sheet connection ID: ' + connection.id + '.');
        connectionIds.add(connection.id);
        if (!Array.isArray(connection.endpoints) || connection.endpoints.length < 2) {
          errors.push(label + ' must link at least two sheet-local wire endpoints.');
          return;
        }
        const endpointKeys = new Set();
        const endpointSheets = new Set();
        connection.endpoints.forEach(function (endpoint) {
          if (!endpoint || typeof endpoint !== 'object' || typeof endpoint.sheetId !== 'string' ||
              typeof endpoint.wireId !== 'string' || !endpoint.sheetId.trim() || !endpoint.wireId.trim() ||
              !endpoint.point || !finite(endpoint.point.x) || !finite(endpoint.point.y)) {
            errors.push(label + ' has an invalid endpoint; sheetId, wireId, and finite endpoint coordinates are required.');
            return;
          }
          const key = endpoint.sheetId + '\u0000' + endpoint.wireId + '\u0000' + endpoint.point.x + ',' + endpoint.point.y;
          if (endpointKeys.has(key) || globallyUsedEndpoints.has(key)) errors.push(label + ' repeats a linked wire endpoint.');
          endpointKeys.add(key);
          globallyUsedEndpoints.add(key);
          endpointSheets.add(endpoint.sheetId);
          if (!knownSheetIds.has(endpoint.sheetId)) errors.push(label + ' refers to unknown sheet ' + endpoint.sheetId + '.');
          const wire = wiresBySheet.get(endpoint.sheetId)?.get(endpoint.wireId);
          if (!wire) errors.push(label + ' refers to missing wire ' + endpoint.wireId + ' on sheet ' + endpoint.sheetId + '.');
          else if (!((endpoint.point.x === wire.x1 && endpoint.point.y === wire.y1) ||
                     (endpoint.point.x === wire.x2 && endpoint.point.y === wire.y2))) {
            errors.push(label + ' point is not an endpoint of wire ' + endpoint.wireId + '.');
          }
          if (endpoint.connector !== undefined) {
            const graphic = endpoint.connector;
            if (!graphic || typeof graphic !== 'object' ||
                !['left', 'right'].includes(graphic.direction) ||
                typeof graphic.targetSheetId !== 'string' || !graphic.targetSheetId.trim() ||
                (graphic.targetRef !== undefined && (typeof graphic.targetRef !== 'string' || !graphic.targetRef.trim()))) {
              errors.push(label + ' has an invalid off-page connector graphic.');
            } else if (graphic.targetSheetId === endpoint.sheetId || !knownSheetIds.has(graphic.targetSheetId)) {
              errors.push(label + ' off-page connector must reference a different known sheet.');
            } else if (graphic.targetRef !== undefined && !refsBySheet.get(graphic.targetSheetId)?.has(graphic.targetRef)) {
              errors.push(label + ' off-page connector target ' + graphic.targetRef + ' does not exist on sheet ' + graphic.targetSheetId + '.');
            }
          }
        });
        if (endpointSheets.size < 2) errors.push(label + ' must connect at least two different sheets.');
      });
    }
    if (project.version === PROJECT_VERSION && (project.componentSchemaVersion !== COMPONENT_SCHEMA_VERSION || project.netSchemaVersion !== 1)) {
      errors.push('Project component or net schema version is unsupported.');
    }
    return { valid: errors.length === 0, errors: errors };
  }
  function serializeProject(project) {
    const payload = Object.assign({}, project, {
      format: PROJECT_FORMAT,
      version: PROJECT_VERSION,
      componentSchemaVersion: COMPONENT_SCHEMA_VERSION,
      netSchemaVersion: 1
    });
    const validation = validateProject(payload);
    if (!validation.valid) throw new Error(validation.errors.join(' '));
    return JSON.stringify(payload, null, 2);
  }
  function parseProject(text) {
    let project;
    try { project = JSON.parse(text); }
    catch (error) { return { valid: false, errors: ['Project file is not valid JSON.'] }; }
    const validation = validateProject(project);
    return { valid: validation.valid, errors: validation.errors, project: validation.valid ? project : null };
  }

  function validWireBends(bends) {
    return Array.isArray(bends) && bends.every(point => point && finite(point.x) && finite(point.y));
  }

  function wireRoutePoints(wire) {
    const start = { x: wire.x1, y: wire.y1 };
    const end = { x: wire.x2, y: wire.y2 };
    if (!wire.bends?.length) return [start, { x: end.x, y: start.y }, end];

    const route = [start];
    const waypoints = [...wire.bends, end];
    waypoints.forEach(function (point, index) {
      const previous = route.at(-1);
      if (previous.x !== point.x && previous.y !== point.y) {
        const beforePrevious = route.at(-2);
        // Avoid folding the route back over its last segment when approaching the terminal.
        const reversesVertical = beforePrevious?.x === previous.x
          && (previous.y - beforePrevious.y) * (point.y - previous.y) < 0;
        route.push(index === waypoints.length - 1 && !reversesVertical
          ? { x: previous.x, y: point.y }
          : { x: point.x, y: previous.y });
      }
      route.push(point);
    });
    return route;
  }

  function pointOnSegment(point, segment) {
    const cross = (point.x - segment.a.x) * (segment.b.y - segment.a.y)
      - (point.y - segment.a.y) * (segment.b.x - segment.a.x);
    if (Math.abs(cross) > EPSILON) return false;
    return point.x >= Math.min(segment.a.x, segment.b.x) - EPSILON
      && point.x <= Math.max(segment.a.x, segment.b.x) + EPSILON
      && point.y >= Math.min(segment.a.y, segment.b.y) - EPSILON
      && point.y <= Math.max(segment.a.y, segment.b.y) + EPSILON;
  }
  function analyze(objects) {
    const source = Array.isArray(objects) ? objects : [];
    const wires = [];
    const pins = [];
    const errors = [];
    const validInstances = [];

    source.forEach(function (object, index) {
      if (!object || object.kind !== 'wire') return;
      const coords = [object.x1, object.y1, object.x2, object.y2];
      if (!coords.every(finite) || (object.bends !== undefined && !validWireBends(object.bends))) {
        errors.push({ code: 'invalid-coordinate', objectId: object.id || null, message: 'A wire has a missing or non-finite endpoint.' });
        return;
      }
      const points = wireRoutePoints(object);
      const segments = points.slice(1).map((point, index) => [points[index], point])
        .filter(function (pair) { return Math.abs(pair[0].x - pair[1].x) > EPSILON || Math.abs(pair[0].y - pair[1].y) > EPSILON; })
        .map(function (pair) { return { a: pair[0], b: pair[1] }; });
      if (!segments.length) {
        errors.push({ code: 'zero-length-wire', objectId: object.id || null, message: 'A wire has zero length.' });
        return;
      }
      wires.push({ id: object.id || 'wire-' + (index + 1), points, start: points[0], end: points.at(-1), segments });
    });

    source.forEach(function (object) {
      if (!object || object.kind !== 'component-instance') return;
      const validation = validateInstance(object);
      if (!validation.valid) {
        validation.errors.forEach(function (message) {
          errors.push({ code: 'invalid-component-instance', objectId: object.id || null, message: message });
        });
        return;
      }
      validInstances.push(object);
      worldPins(object).forEach(function (pin) {
        pins.push({ instanceId: object.id, ref: object.ref, pinId: pin.id, number: pin.number, name: pin.name, point: { x: pin.x, y: pin.y } });
      });
    });

    const parents = [];
    const addNode = function () { const id = parents.length; parents.push(id); return id; };
    const find = function (id) {
      while (parents[id] !== id) { parents[id] = parents[parents[id]]; id = parents[id]; }
      return id;
    };
    const join = function (a, b) {
      const rootA = find(a), rootB = find(b);
      if (rootA !== rootB) parents[rootB] = rootA;
    };
    wires.forEach(function (wire) { wire.node = addNode(); });
    pins.forEach(function (pin) { pin.node = addNode(); });

    for (let i = 0; i < wires.length; i += 1) {
      for (let j = i + 1; j < wires.length; j += 1) {
        const touches = wires[i].points.some(function (point) {
          return wires[j].segments.some(function (segment) { return pointOnSegment(point, segment); });
        }) || wires[j].points.some(function (point) {
          return wires[i].segments.some(function (segment) { return pointOnSegment(point, segment); });
        });
        if (touches) join(wires[i].node, wires[j].node);
      }
    }
    let connectedPinCount = 0;
    const unconnectedPins = [];
    pins.forEach(function (pin) {
      const attachedWires = wires.filter(function (wire) {
        return wire.segments.some(function (segment) { return pointOnSegment(pin.point, segment); });
      });
      if (attachedWires.length) connectedPinCount += 1;
      else unconnectedPins.push({ instanceId: pin.instanceId, ref: pin.ref, pinId: pin.pinId, number: pin.number, point: pin.point });
      attachedWires.forEach(function (wire) { join(pin.node, wire.node); });
    });

    validInstances.forEach(function (instance) {
      const def = component(instance.componentId, instance.customSymbol);
      if (def.family === 'disconnect-terminal' && instance.properties.knifePosition !== 'closed') return;
      def.symbol.internalConnections.forEach(function (pair) {
        const first = pins.find(function (pin) { return pin.instanceId === instance.id && pin.pinId === pair[0]; });
        const second = pins.find(function (pin) { return pin.instanceId === instance.id && pin.pinId === pair[1]; });
        if (first && second) join(first.node, second.node);
      });
    });

    const openEndpoints = [];
    wires.forEach(function (wire) {
      [wire.start, wire.end].forEach(function (endpoint) {
        const connectedToWire = wires.some(function (other) {
          return other !== wire && other.segments.some(function (segment) { return pointOnSegment(endpoint, segment); });
        });
        const connectedToPin = pins.some(function (pin) {
          return Math.abs(pin.point.x - endpoint.x) <= EPSILON && Math.abs(pin.point.y - endpoint.y) <= EPSILON;
        });
        if (!connectedToWire && !connectedToPin) openEndpoints.push({ wireId: wire.id, point: endpoint });
      });
    });

    const groups = new Map();
    wires.forEach(function (wire) {
      const key = find(wire.node);
      if (!groups.has(key)) groups.set(key, { wires: [], pins: [] });
      groups.get(key).wires.push(wire.id);
    });
    pins.forEach(function (pin) {
      const key = find(pin.node);
      if (!groups.has(key)) groups.set(key, { wires: [], pins: [] });
      groups.get(key).pins.push({ instanceId: pin.instanceId, ref: pin.ref, pinId: pin.pinId, number: pin.number, name: pin.name });
    });
    const nets = [];
    groups.forEach(function (group) {
      if (group.wires.length) nets.push(group);
    });
    nets.sort(function (a, b) {
      const aKey = a.wires[0] || a.pins[0].instanceId + ':' + a.pins[0].pinId;
      const bKey = b.wires[0] || b.pins[0].instanceId + ':' + b.pins[0].pinId;
      return aKey.localeCompare(bKey);
    });
    const serializedNets = nets.map(function (net, index) {
      return { id: 'net-' + (index + 1), wireIds: net.wires.slice().sort(), pins: net.pins.slice().sort(function (a, b) { return a.ref.localeCompare(b.ref) || a.number.localeCompare(b.number); }) };
    });

    return {
      componentSchemaVersion: COMPONENT_SCHEMA_VERSION,
      netSchemaVersion: 1,
      wireCount: wires.length,
      componentCount: validInstances.length,
      componentPinCount: pins.length,
      connectedPinCount: connectedPinCount,
      unconnectedPinCount: pins.length - connectedPinCount,
      unconnectedPins: unconnectedPins,
      netCount: serializedNets.length,
      nets: serializedNets,
      openEndpointCount: openEndpoints.length,
      openEndpoints: openEndpoints,
      geometryErrorCount: errors.length,
      errors: errors,
      scope: 'source-backed component instances and user-authored orthogonal wire geometry; imported/embedded reference artwork is excluded'
    };
  }


  function electricalFindings(reports, objects, openEndpoints, diagnostics, endpointToNet, globalNets) {
    const findings = [];
    function add(ruleId, severity, message, suggestedFix, locations) {
      findings.push({ ruleId: ruleId, severity: severity, message: message, suggestedFix: suggestedFix,
        editionMapping: null, humanReviewStatus: 'pending', locations: locations });
    }
    const devicesByTag = new Map();
    const terminalsByPosition = new Map();
    objects.filter(function (object) { return object.kind === 'component-instance'; }).forEach(function (object) {
      const tag = object.ref.trim().toUpperCase();
      if (!devicesByTag.has(tag)) devicesByTag.set(tag, []);
      const location = { sheetId: object.sheetId || reports[0].id, objectId: object.id, ref: object.ref };
      devicesByTag.get(tag).push(location);
      if (!isTerminalDefinition(component(object.componentId, object.customSymbol))) return;
      const strip = object.properties?.terminalStrip?.trim();
      const position = object.properties?.position?.trim();
      if (!strip || !position) return;
      const key = JSON.stringify([strip.toUpperCase(), position.toUpperCase()]);
      if (!terminalsByPosition.has(key)) terminalsByPosition.set(key, { strip, position, locations: [] });
      terminalsByPosition.get(key).locations.push(location);
    });
    devicesByTag.forEach(function (locations, tag) {
      if (locations.length < 2) return;
      add('ERC-DUPLICATE-DEVICE-TAG', 'error', 'Device tag ' + tag + ' is used by ' + locations.length + ' components.',
        'Assign a unique device tag to each instance and verify related references.', locations);
    });
    terminalsByPosition.forEach(function ({ strip, position, locations }) {
      if (locations.length < 2) return;
      add('ERC-TERMINAL-POSITION-CONFLICT', 'error', 'Terminal strip ' + strip + ' position ' + position + ' is assigned to multiple blocks.',
        'Give each physical terminal block a distinct position within its strip.', locations);
    });
    openEndpoints.forEach(function (endpoint) {
      add('ERC-OPEN-WIRE-ENDPOINT', 'warning', 'Wire endpoint has no connection.',
        'Connect it to a pin, wire, or valid cross-sheet link, or confirm the open end is intentional.',
        [{ sheetId: endpoint.sheetId, objectId: endpoint.wireId, point: endpoint.point }]);
    });
    reports.forEach(function (sheet) {
      sheet.analysis.errors.forEach(function (error) {
        add('ERC-DRAWING-GEOMETRY', 'error', error.message,
          'Inspect the affected geometry or component and correct its coordinates or definition.',
          error.objectId ? [{ sheetId: sheet.id, objectId: error.objectId }] : []);
      });
      sheet.analysis.unconnectedPins.forEach(function (pin) {
        add('ERC-PIN-WITHOUT-WIRE', 'info', pin.ref + ':' + pin.number + ' has no attached wire.',
          'Check the intended terminal use before adding a connection.',
          [{ sheetId: sheet.id, objectId: pin.instanceId, ref: pin.ref, pinNumber: pin.number, point: pin.point }]);
      });
    });
    const wiresBySheet = new Map();
    const localToGlobal = new Map();
    globalNets.forEach(function (net) {
      net.localNetIds.forEach(function (id) { localToGlobal.set(id, net.id); });
    });
    const signalRolesByComponent = new Map();
    const earthPinsByComponent = new Map();
    for (const object of objects) {
      if (object.kind !== 'component-instance') continue;
      const definition = component(object.componentId, object.customSymbol);
      const earthPins = definition.symbol.pins.filter(pin => definition.family === 'protective-earth-terminal'
        || pin.connectionType === 'protective-earth' || pin.localNumber.toUpperCase() === 'PE');
      if (earthPins.length) earthPinsByComponent.set(object.id, new Set(earthPins.map(pin => pin.id)));
      if (definition.family === 'plc-cpu') {
        signalRolesByComponent.set(object.id, new Map(definition.symbol.pins.map(pin => [pin.id, plcChannelType(pin)])));
      } else if (definition.family === 'sensor-inductive-pnp') {
        signalRolesByComponent.set(object.id, new Map([[definition.electricalFunctions.output.outputPin, 'digital-output']]));
      } else if (definition.family === 'sensor-pressure-analog') {
        const output = definition.electricalFunctions.analogOutput;
        signalRolesByComponent.set(object.id, new Map([[output.outputPin, 'analog-output'], [output.digitalOutputPin, 'digital-output']]));
      }
    }
    const signalsByNet = new Map();
    const earthByNet = new Map();
    const openDisconnects = new Set(objects.filter(object => object.kind === 'component-instance'
      && object.properties?.knifePosition !== 'closed'
      && component(object.componentId, object.customSymbol)?.family === 'disconnect-terminal').map(object => object.id));
    const wiredDisconnectPins = new Map();
    const wiredNetIds = new Set(globalNets.filter(net => net.wireIds.length).map(net => net.id));
    for (const sheet of reports) {
      for (const net of sheet.analysis.nets) {
        const netId = localToGlobal.get(net.id);
        for (const pin of net.pins) {
          const location = { sheetId: sheet.id, objectId: pin.instanceId, ref: pin.ref, pinNumber: pin.number };
          if (net.wireIds.length && openDisconnects.has(pin.instanceId)) {
            const pins = wiredDisconnectPins.get(pin.instanceId) || [];
            pins.push({ location, netId });
            wiredDisconnectPins.set(pin.instanceId, pins);
          }
          if (wiredNetIds.has(netId) && earthPinsByComponent.get(pin.instanceId)?.has(pin.pinId)) {
            if (!earthByNet.has(netId)) earthByNet.set(netId, []);
            earthByNet.get(netId).push(location);
          }
          const role = signalRolesByComponent.get(pin.instanceId)?.get(pin.pinId);
          if (!role) continue;
          if (!signalsByNet.has(netId)) signalsByNet.set(netId, []);
          signalsByNet.get(netId).push({ role, location });
        }
      }
    }
    for (const pins of wiredDisconnectPins.values()) {
      if (pins.length !== 2) continue;
      const [first, second] = pins;
      if (first.netId && first.netId === second.netId) {
        add('ERC-BYPASSED-DISCONNECT', 'warning', first.location.ref + ' is modeled open, but both terminals remain on the same project net.',
          'Trace the alternate connection before relying on the knife position to separate the two sides.', [first.location]);
      } else {
        add('ERC-OPEN-DISCONNECT', 'info', first.location.ref + ' is modeled with its knife open.',
          'Review the intended knife position in Properties. This finding describes the drawing model.', [first.location]);
      }
    }
    for (const signals of signalsByNet.values()) {
      for (const [outputRole, wrongInputRole] of [['analog-output', 'DI'], ['digital-output', 'AI']]) {
        const outputs = signals.filter(signal => signal.role === outputRole);
        const inputs = signals.filter(signal => signal.role === wrongInputRole);
        if (!outputs.length || !inputs.length) continue;
        add('ERC-PLC-INPUT-TYPE-MISMATCH', 'error',
          (outputRole === 'analog-output' ? 'An analog' : 'A switching') + ' sensor output is wired to a ' + wrongInputRole + ' channel.',
          'Check the sensor output mode and wire it to a compatible input channel.',
          outputs.concat(inputs).map(signal => signal.location));
      }
    }
    const potentialsByNet = new Map();
    const netsByWireNumber = new Map();
    const netsByCableCore = new Map();
    objects.forEach(function (object) {
      if (object.kind !== 'wire') return;
      const sheetId = object.sheetId || reports[0].id;
      if (!wiresBySheet.has(sheetId)) wiresBySheet.set(sheetId, new Set());
      wiresBySheet.get(sheetId).add(object.id);
      const netId = localToGlobal.get(endpointToNet.get(sheetId + '\u0000' + object.id));
      const cable = (object.cableId || '').trim();
      const core = (object.coreId || '').trim();
      const location = { sheetId: sheetId, objectId: object.id };
      if (Boolean(cable) !== Boolean(core)) {
        add('ERC-INCOMPLETE-CABLE-CORE', 'warning', 'Cable or core ID is missing from this wire assignment.',
          'Assign both identifiers or clear the incomplete assignment.', [location]);
      }
      if (!netId) return;
      const potential = typeof object.potential === 'string' ? object.potential.trim() : '';
      const wireNumber = typeof object.wireNumber === 'string' ? object.wireNumber.trim() : '';
      if (potential) {
        if (!potentialsByNet.has(netId)) potentialsByNet.set(netId, []);
        potentialsByNet.get(netId).push(Object.assign({ potential: potential }, location));
      }
      if (wireNumber) {
        const key = wireNumber.toUpperCase();
        if (!netsByWireNumber.has(key)) netsByWireNumber.set(key, []);
        netsByWireNumber.get(key).push({ netId: netId, location: location });
      }
      if (cable && core) {
        const key = JSON.stringify([cable.toUpperCase(), core.toUpperCase()]);
        if (!netsByCableCore.has(key)) netsByCableCore.set(key, []);
        netsByCableCore.get(key).push({ netId: netId, location: location, cable: cable, core: core });
      }
    });
    for (const [netId, locations] of earthByNet) {
      const assignments = potentialsByNet.get(netId) || [];
      if (assignments.some(item => /^(?:PE|protective earth|protective conductor)$/i.test(item.potential))) continue;
      add('ERC-PE-DESIGNATION-MISSING', 'warning', 'A net connected to a protective-earth terminal has no explicit PE potential designation.',
        'Review the intended conductor and assign PE in the wire’s Potential field if appropriate.', locations);
    }
    potentialsByNet.forEach(function (locations) {
      const names = new Set(locations.map(function (location) { return location.potential.toUpperCase(); }));
      if (names.size < 2) return;
      add('ERC-CONFLICTING-POTENTIALS', 'error', 'One connected net has conflicting potential assignments: ' + Array.from(names).join(', ') + '.',
        'Review the assigned potentials and verify the wiring and cross-sheet connections.', locations);
    });
    netsByWireNumber.forEach(function (assignments, number) {
      const nets = new Set(assignments.map(function (assignment) { return assignment.netId; }));
      if (nets.size < 2) return;
      add('ERC-WIRE-NUMBER-DISCONNECTED', 'warning', 'Wire number ' + number + ' is assigned to disconnected nets.',
        'Check whether the number should identify one continuous net and correct the labels or connectivity as needed.',
        assignments.map(function (assignment) { return assignment.location; }));
    });
    netsByCableCore.forEach(function (assignments) {
      const nets = new Set(assignments.map(assignment => assignment.netId));
      if (nets.size < 2) return;
      const { cable, core } = assignments[0];
      add('ERC-CABLE-CORE-DISCONNECTED', 'error', 'Cable ' + cable + ' core ' + core + ' is assigned to disconnected nets.',
        'Use a different core identifier or correct the intended conductor continuity.',
        assignments.map(assignment => assignment.location));
    });
    diagnostics.forEach(function (issue) {
      if (issue?.type !== 'unresolved-cross-sheet-reference') return;
      const endpoints = Array.isArray(issue.connection?.endpoints) ? issue.connection.endpoints : [];
      const locations = endpoints
        .filter(function (endpoint) { return endpoint && wiresBySheet.get(endpoint.sheetId)?.has(endpoint.wireId); })
        .map(function (endpoint) { return { sheetId: endpoint.sheetId, objectId: endpoint.wireId }; });
      add('ERC-UNRESOLVED-CROSS-SHEET-REFERENCE', 'error',
        typeof issue.message === 'string' ? issue.message : 'A cross-sheet reference requires review.',
        'Check the surviving endpoint and recreate the reference if the connection is still required.', locations);
    });
    return findings;
  }

  function analyzeProject(project) {
    const validation = validateProject(project);
    if (!validation.valid) return { valid: false, errors: validation.errors, sheetCount: 0, sheets: [] };
    const objects = Array.isArray(project.objects) ? project.objects : [];
    const definitions = Array.isArray(project.sheets) ? project.sheets : [];
    const sheets = definitions.length ? definitions : [{ id: project.activeSheet || 'main', number: '', name: 'Main sheet' }];
    const objectsBySheet = new Map(sheets.map(sheet => [sheet.id, []]));
    const defaultSheet = sheets.length === 1 ? sheets[0].id : undefined;
    for (const object of objects) {
      if (object) objectsBySheet.get(object.sheetId || defaultSheet)?.push(object);
    }
    const reports = sheets.map(function (sheet) {
      const analysis = analyze(objectsBySheet.get(sheet.id));
      analysis.nets.forEach(function (net) { net.id = sheet.id + ':' + net.id; });
      return { id: sheet.id, number: sheet.number || '', name: sheet.name || '', analysis: analysis };
    });
    const localNets = [];
    const endpointToNet = new Map();
    reports.forEach(function (sheet) {
      sheet.analysis.nets.forEach(function (net) {
        localNets.push({ key: net.id, sheetId: sheet.id, net: net });
        net.wireIds.forEach(function (wireId) { endpointToNet.set(sheet.id + '\u0000' + wireId, net.id); });
      });
    });
    const parents = new Map();
    localNets.forEach(function (entry) { parents.set(entry.key, entry.key); });
    function find(key) {
      let parent = parents.get(key);
      while (parent !== parents.get(parent)) {
        parents.set(parent, parents.get(parents.get(parent)));
        parent = parents.get(parent);
      }
      return parent;
    }
    function join(a, b) {
      const rootA = find(a), rootB = find(b);
      if (rootA !== rootB) parents.set(rootB, rootA);
    }
    const linkedOpenEndpointKeys = new Set();
    function endpointKey(sheetId, endpoint) {
      return sheetId + '\u0000' + endpoint.wireId + '\u0000' + endpoint.point.x + ',' + endpoint.point.y;
    }
    const links = (Array.isArray(project.crossSheetConnections) ? project.crossSheetConnections : []).map(function (connection) {
      const endpointNets = connection.endpoints.map(function (endpoint) {
        return endpointToNet.get(endpoint.sheetId + '\u0000' + endpoint.wireId);
      });
      const open = connection.endpoints.map(function (endpoint, index) {
        const sheet = reports.find(function (entry) { return entry.id === endpoint.sheetId; });
        const key = endpointKey(endpoint.sheetId, endpoint);
        const isOpen = sheet && sheet.analysis.openEndpoints.some(function (candidate) {
          return candidate.wireId === endpoint.wireId &&
            candidate.point.x === endpoint.point.x && candidate.point.y === endpoint.point.y;
        });
        return { key: key, isOpen: Boolean(isOpen), netId: endpointNets[index] };
      });
      if (endpointNets.some(function (key) { return !key; }) || open.some(function (entry) { return !entry.isOpen; })) {
        return { id: connection.id, name: connection.name, valid: false, errors: ['Every link must terminate at a real open endpoint on a valid sheet-local net.'] };
      }
      for (let i = 1; i < endpointNets.length; i += 1) join(endpointNets[0], endpointNets[i]);
      open.forEach(function (endpoint) { linkedOpenEndpointKeys.add(endpoint.key); });
      return {
        id: connection.id,
        name: connection.name,
        valid: true,
        endpoints: connection.endpoints.map(function (endpoint, index) {
          return { sheetId: endpoint.sheetId, wireId: endpoint.wireId, point: endpoint.point, netId: endpointNets[index] };
        })
      };
    });
    const linkErrors = links.filter(function (link) { return !link.valid; }).flatMap(function (link) {
      return link.errors.map(function (message) { return link.id + ': ' + message; });
    });
    if (linkErrors.length) return { valid: false, errors: linkErrors, sheetCount: reports.length, sheets: reports };
    const groups = new Map();
    localNets.forEach(function (entry) {
      const root = find(entry.key);
      if (!groups.has(root)) groups.set(root, { localNetIds: [], sheetIds: [], wireIds: [], pins: [] });
      const group = groups.get(root);
      group.localNetIds.push(entry.key);
      group.sheetIds.push(entry.sheetId);
      entry.net.wireIds.forEach(function (wireId) { group.wireIds.push(entry.sheetId + ':' + wireId); });
      entry.net.pins.forEach(function (pin) { group.pins.push({ sheetId: entry.sheetId, ref: pin.ref, number: pin.number, pinId: pin.pinId }); });
    });
    const globalNets = Array.from(groups.values()).map(function (group) {
      group.localNetIds.sort();
      group.sheetIds = Array.from(new Set(group.sheetIds)).sort();
      group.wireIds.sort();
      group.pins.sort(function (x, y) {
        return x.sheetId.localeCompare(y.sheetId) || x.ref.localeCompare(y.ref) || x.number.localeCompare(y.number);
      });
      return group;
    }).sort(function (x, y) { return x.localNetIds[0].localeCompare(y.localNetIds[0]); })
      .map(function (group, index) { return Object.assign({ id: 'global-net-' + (index + 1) }, group); });
    const localOpenEndpointCount = reports.reduce(function (sum, sheet) { return sum + sheet.analysis.openEndpointCount; }, 0);
    const openEndpoints = reports.flatMap(function (sheet) {
      return sheet.analysis.openEndpoints
        .filter(function (endpoint) { return !linkedOpenEndpointKeys.has(endpointKey(sheet.id, endpoint)); })
        .map(function (endpoint) { return Object.assign({ sheetId: sheet.id }, endpoint); });
    });
    return {
      valid: true,
      errors: [],
      sheetCount: reports.length,
      wireCount: reports.reduce(function (sum, sheet) { return sum + sheet.analysis.wireCount; }, 0),
      componentCount: reports.reduce(function (sum, sheet) { return sum + sheet.analysis.componentCount; }, 0),
      netCount: reports.reduce(function (sum, sheet) { return sum + sheet.analysis.netCount; }, 0),
      globalNetCount: globalNets.length,
      crossSheetConnectionCount: links.length,
      crossSheetConnections: links,
      globalNets: globalNets,
      localOpenEndpointCount: localOpenEndpointCount,
      openEndpointCount: openEndpoints.length,
      openEndpoints: openEndpoints,
      findings: electricalFindings(reports, objects, openEndpoints,
        Array.isArray(project.projectModel?.diagnostics) ? project.projectModel.diagnostics : [], endpointToNet, globalNets),
      geometryErrorCount: reports.reduce(function (sum, sheet) { return sum + sheet.analysis.geometryErrorCount; }, 0),
      sheets: reports,
      scope: 'Sheet-local nets are joined only at exact, validated open endpoints.'
    };
  }

  function projectElectricalReport(project) {
    const result = analyzeProject(project);
    return {
      format: 'adigun-electrical-check-report',
      version: 1,
      project: typeof project?.project === 'string' ? project.project : '',
      analysisComplete: result.valid,
      analysisErrors: result.errors,
      sheets: result.sheets.map(function (sheet) { return { id: sheet.id, number: sheet.number, name: sheet.name }; }),
      summary: result.valid ? {
        projectNets: result.globalNetCount,
        resolvedCrossSheetLinks: result.crossSheetConnectionCount,
        unresolvedWireEndpoints: result.openEndpointCount,
        geometryErrors: result.geometryErrorCount,
        findings: result.findings.length
      } : null,
      globalNets: result.globalNets || [],
      crossSheetConnections: result.crossSheetConnections || [],
      openEndpoints: result.openEndpoints || [],
      findings: result.findings || [],
      scope: 'Authored geometry and electrical connectivity checks.'
    };
  }

  function crossSheetConnectors(project, sheetId) {
    const sheets = new Map((Array.isArray(project && project.sheets) ? project.sheets : []).map(function (sheet) {
      return [sheet.id, sheet];
    }));
    return (Array.isArray(project && project.crossSheetConnections) ? project.crossSheetConnections : []).flatMap(function (connection) {
      return (Array.isArray(connection.endpoints) ? connection.endpoints : []).filter(function (endpoint) {
        return endpoint.sheetId === sheetId && endpoint.connector;
      }).map(function (endpoint) {
        const target = sheets.get(endpoint.connector.targetSheetId);
        return {
          id: connection.id + ':' + endpoint.sheetId,
          name: connection.name,
          point: { x: endpoint.point.x, y: endpoint.point.y },
          direction: endpoint.connector.direction,
          targetSheetId: endpoint.connector.targetSheetId,
          targetSheetNumber: target && target.number || endpoint.connector.targetSheetId,
          targetRef: endpoint.connector.targetRef
        };
      });
    });
  }

  function billOfMaterials(objects) {
    const groups = new Map();
    const errors = [];
    (Array.isArray(objects) ? objects : []).forEach(function (instance, index) {
      if (!instance) return;
      if (instance.kind !== 'component-instance') {
        if (['catalog-symbol', 'terminal', 'plc', 'motor', 'ground'].includes(instance.kind)) errors.push('Object ' + (instance.ref || index + 1) + ': unverified legacy symbol cannot be included in a verified BOM.');
        return;
      }
      const validation = validateInstance(instance);
      if (!validation.valid) {
        errors.push('Object ' + (instance.ref || index + 1) + ': ' + validation.errors.join(' '));
        return;
      }
      const definition = validation.definition;
      if (definition.family !== 'user-authored' && (!Array.isArray(definition.sources) || !definition.sources.length)) {
        errors.push('Object ' + instance.ref + ': verified source provenance is missing.');
        return;
      }
      if (!groups.has(definition.id)) groups.set(definition.id, { definition: definition, references: [] });
      groups.get(definition.id).references.push(instance.ref);
    });
    const rows = Array.from(groups.values()).map(function (group) {
      const definition = group.definition;
      const source = definition.sources[0] || { title: 'Project-authored symbol' };
      return {
        componentId: definition.id, manufacturer: definition.manufacturer, model: definition.model,
        partNumber: definition.manufacturerPartNumber, description: definition.name,
        quantity: group.references.length,
        references: group.references.slice().sort(function (a, b) { return a.localeCompare(b); }),
        sourcePublisher: source.publisher || '', sourceTitle: source.title || '',
        sourceDocumentRevision: source.documentRevision || '', sourceRevisionNote: source.revisionNote || '',
        sourceUrl: source.url || '', sourceRetrievedAt: source.retrievedAt || ''
      };
    }).sort(function (a, b) { return a.componentId.localeCompare(b.componentId); });
    return { valid: errors.length === 0, errors: errors, rows: rows };
  }
  function billOfMaterialsCsv(objects) {
    const report = billOfMaterials(objects);
    if (!report.valid) throw new Error('BOM export blocked: ' + report.errors.join(' '));
    const columns = [
      ['Manufacturer', 'manufacturer'], ['Model', 'model'], ['Part number', 'partNumber'],
      ['Description', 'description'], ['Quantity', 'quantity'], ['References', 'references'],
      ['Source publisher', 'sourcePublisher'], ['Source title', 'sourceTitle'],
      ['Source document revision', 'sourceDocumentRevision'], ['Source revision note', 'sourceRevisionNote'],
      ['Source URL', 'sourceUrl'], ['Source retrieved date', 'sourceRetrievedAt']
    ];
    function cell(value) {
      return spreadsheetCsvCell(value, ', ');
    }
    const lines = [columns.map(function (column) { return cell(column[0]); }).join(',')];
    report.rows.forEach(function (row) { lines.push(columns.map(function (column) { return cell(row[column[1]]); }).join(',')); });
    return '\uFEFF' + lines.join('\r\n') + '\r\n';
  }


  function wireList(input) {
    const project = !Array.isArray(input) && input && typeof input === 'object' ? input : null;
    const objects = project ? project.objects : input;
    const source = Array.isArray(objects) ? objects : [];
    const wires = source.filter(function (object) { return object && object.kind === 'wire'; });
    const errors = [];
    const seen = new Set();
    wires.forEach(function (wire, index) {
      if (typeof wire.id !== 'string' || !wire.id.trim()) errors.push('Wire ' + (index + 1) + ' has no stable object ID.');
      else if (seen.has(wire.id)) errors.push('Wire ID "' + wire.id + '" is duplicated.');
      else seen.add(wire.id);
    });
    source.forEach(function (object, index) {
      if (object && ['catalog-symbol', 'terminal', 'plc', 'motor', 'ground'].includes(object.kind)) {
        errors.push('Object ' + (object.ref || object.id || index + 1) + ': unverified legacy symbols cannot be used for a connected wire list.');
      }
    });
    const analysis = project ? analyzeProject(project) : analyze(source);
    const sheets = project ? analysis.sheets : [{ id: '', analysis: analysis }];
    if (project && !analysis.valid) errors.push(...analysis.errors);
    sheets.forEach(function (sheet) {
      sheet.analysis.errors.forEach(function (issue) {
        errors.push((issue.objectId ? issue.objectId + ': ' : '') + issue.message);
      });
    });
    if (errors.length) return { valid: false, errors: errors, rows: [] };

    const netByWire = new Map();
    const globalByLocal = new Map();
    if (project) analysis.globalNets.forEach(function (net) {
      net.localNetIds.forEach(function (id) { globalByLocal.set(id, net); });
    });
    sheets.forEach(function (sheet) {
      sheet.analysis.nets.forEach(function (net) {
        net.wireIds.forEach(function (id) { netByWire.set(id, project ? globalByLocal.get(net.id) : net); });
      });
    });
    const pinsBySheet = new Map();
    function sheetId(object) {
      return project ? (object.sheetId || sheets[0]?.id || '') : '';
    }
    source.forEach(function (instance) {
      if (!instance || instance.kind !== 'component-instance') return;
      const validation = validateInstance(instance);
      if (!validation.valid) return;
      const id = sheetId(instance);
      if (!pinsBySheet.has(id)) pinsBySheet.set(id, []);
      pinsBySheet.get(id).push(...worldPins(instance).map(function (pin) {
        return { ref: instance.ref, number: pin.number, x: pin.x, y: pin.y };
      }));
    });
    function refsAt(id, x, y) {
      return (pinsBySheet.get(id) || []).filter(function (pin) {
        return Math.abs(pin.x - x) <= EPSILON && Math.abs(pin.y - y) <= EPSILON;
      }).map(function (pin) { return pin.ref + ':' + pin.number; }).sort();
    }
    const rows = wires.map(function (wire) {
      const id = sheetId(wire);
      const net = netByWire.get(wire.id);
      const netPins = net ? net.pins.map(function (pin) { return pin.ref + ':' + pin.number; }).sort() : [];
      return {
        wireId: wire.id,
        ...(project ? { sheetId: id } : {}),
        ...(typeof wire.wireNumber === 'string' && wire.wireNumber.trim() ? { wireNumber: wire.wireNumber.trim() } : {}),
        ...(typeof wire.potential === 'string' && wire.potential.trim() ? { potential: wire.potential.trim() } : {}),
        ...(typeof wire.cableId === 'string' && wire.cableId ? { cableId: wire.cableId } : {}),
        ...(typeof wire.coreId === 'string' && wire.coreId ? { coreId: wire.coreId } : {}),
        netId: net ? net.id : '',
        startX: wire.x1,
        startY: wire.y1,
        bendX: wire.bends ? null : wire.x2,
        endX: wire.x2,
        endY: wire.y2,
        lengthMm: Number(wireRoutePoints(wire).reduce((length, point, index, points) => index
          ? length + Math.hypot(point.x - points[index - 1].x, point.y - points[index - 1].y) : length, 0).toFixed(6)),
        ...(wire.bends?.length ? { bends: wire.bends.map(point => point.x + ', ' + point.y) } : {}),
        startPinRefs: refsAt(id, wire.x1, wire.y1),
        endPinRefs: refsAt(id, wire.x2, wire.y2),
        netPinRefs: netPins
      };
    }).sort(function (a, b) { return a.wireId.localeCompare(b.wireId); });
    return { valid: true, errors: [], rows: rows };
  }

  function wireListCsv(input) {
    const report = wireList(input);
    if (!report.valid) throw new Error('Wire list export blocked: ' + report.errors.join(' '));
    const columns = [
      ['Wire ID', 'wireId'], ['Net ID', 'netId'], ['Start X (mm)', 'startX'],
      ['Start Y (mm)', 'startY'], ['Bend X (mm)', 'bendX'], ['End X (mm)', 'endX'],
      ['End Y (mm)', 'endY'], ['Route length (mm)', 'lengthMm'],
      ['Start pin references', 'startPinRefs'], ['End pin references', 'endPinRefs'],
      ['Connected pin references on net', 'netPinRefs']
    ];
    if (!Array.isArray(input) && input && typeof input === 'object') columns.unshift(['Sheet ID', 'sheetId']);
    if (report.rows.some(row => row.bends)) columns.push(['Route bends (X, Y mm)', 'bends']);
    if (report.rows.some(row => row.cableId || row.coreId)) columns.push(['Cable ID', 'cableId'], ['Core ID', 'coreId']);
    if (report.rows.some(row => row.wireNumber)) columns.push(['Wire number', 'wireNumber']);
    if (report.rows.some(row => row.potential)) columns.push(['Potential', 'potential']);
    return connectionReportCsv(columns, report.rows);
  }

  function cableScheduleCsv(project) {
    const report = wireList(project);
    if (!report.valid) throw new Error('Cable schedule export blocked: ' + report.errors.join(' '));
    const rows = report.rows.filter(row => row.cableId).sort((a, b) => a.cableId.localeCompare(b.cableId)
      || (a.coreId || '').localeCompare(b.coreId || '') || a.wireId.localeCompare(b.wireId));
    return connectionReportCsv([
      ['Cable ID', 'cableId'], ['Core ID', 'coreId'], ['Sheet ID', 'sheetId'],
      ['Wire ID', 'wireId'], ['Net ID', 'netId'], ['Connected pin references on net', 'netPinRefs']
    ], rows);
  }

  function projectPinIndex(analysis) {
    const pinKey = (instanceId, pinId) => JSON.stringify([instanceId, pinId]);
    const netByPin = new Map();
    const pinsByLocalNet = new Map(analysis.sheets.flatMap(sheet => sheet.analysis.nets.map(net => [
      net.id, net.pins.map(pin => ({ ...pin, sheetId: sheet.id }))
    ])));
    for (const net of analysis.globalNets) {
      const pins = net.localNetIds.flatMap(id => pinsByLocalNet.get(id));
      const indexedNet = { id: net.id, pins: pins };
      for (const pin of pins) netByPin.set(pinKey(pin.instanceId, pin.pinId), indexedNet);
    }
    const sheetNumbers = new Map(analysis.sheets.map(sheet => [sheet.id, sheet.number || sheet.id]));
    return { pinKey, netByPin, sheetNumbers };
  }

  function terminalList(project) {
    const analysis = analyzeProject(project);
    if (!analysis.valid) return { valid: false, errors: analysis.errors, rows: [] };
    const { pinKey, netByPin, sheetNumbers } = projectPinIndex(analysis);
    const rows = (project.objects || []).flatMap(function (object) {
      if (object?.kind !== 'component-instance') return [];
      const definition = component(object.componentId, object.customSymbol);
      if (!isTerminalDefinition(definition)) return [];
      const sheetId = object.sheetId || analysis.sheets[0].id;
      const properties = object.properties || {};
      return definition.symbol.pins.map(function (pin) {
        const key = pinKey(object.id, pin.id);
        const net = netByPin.get(key);
        return {
          sheet: sheetNumbers.get(sheetId), ref: object.ref, pin: pin.localNumber,
          strip: properties.terminalStrip || '', position: properties.position || '',
          marking: properties.marking || '', partNumber: definition.manufacturerPartNumber,
          netId: net?.id || '',
          connectedPins: (net?.pins || []).filter(other => pinKey(other.instanceId, other.pinId) !== key)
            .map(other => sheetNumbers.get(other.sheetId) + ' ' + other.ref + ':' + other.number).sort()
        };
      });
    }).sort((a, b) => a.sheet.localeCompare(b.sheet) || a.ref.localeCompare(b.ref) || a.pin.localeCompare(b.pin));
    return { valid: true, errors: [], rows: rows };
  }

  function terminalListCsv(project) {
    const report = terminalList(project);
    if (!report.valid) throw new Error('Terminal list export blocked: ' + report.errors.join(' '));
    return connectionReportCsv([
      ['Sheet', 'sheet'], ['Terminal reference', 'ref'], ['Pin', 'pin'], ['Strip', 'strip'],
      ['Position', 'position'], ['Marking', 'marking'], ['Part number', 'partNumber'],
      ['Net ID', 'netId'], ['Other pin references on net', 'connectedPins']
    ], report.rows);
  }

  function plcIoList(project) {
    const analysis = analyzeProject(project);
    if (!analysis.valid) return { valid: false, errors: analysis.errors, rows: [] };
    const { pinKey, netByPin, sheetNumbers } = projectPinIndex(analysis);
    const rows = [];
    for (const object of project.objects) {
      if (object?.kind !== 'component-instance') continue;
      const definition = component(object.componentId, object.customSymbol);
      if (definition?.family !== 'plc-cpu') continue;
      const sheet = sheetNumbers.get(object.sheetId || analysis.sheets[0].id);
      for (const pin of definition.symbol.pins) {
        const type = plcChannelType(pin);
        if (!type) continue;
        const key = pinKey(object.id, pin.id);
        const net = netByPin.get(key);
        const connectedPins = (net?.pins || []).filter(other => pinKey(other.instanceId, other.pinId) !== key)
          .map(other => sheetNumbers.get(other.sheetId) + ' ' + other.ref + ':' + other.number).sort();
        rows.push({
          sheet, ref: object.ref, partNumber: definition.manufacturerPartNumber, terminal: pin.localNumber,
          channel: pin.name, type, netId: net?.id || '', connectedPins
        });
      }
    }
    return { valid: true, errors: [], rows };
  }

  function plcIoListCsv(project) {
    const report = plcIoList(project);
    if (!report.valid) throw new Error('PLC I/O list export blocked: ' + report.errors.join(' '));
    return connectionReportCsv([
      ['Sheet', 'sheet'], ['PLC reference', 'ref'], ['Part number', 'partNumber'],
      ['Terminal', 'terminal'], ['Hardware channel', 'channel'], ['Channel type', 'type'],
      ['Net ID', 'netId'], ['Other pin references on net', 'connectedPins']
    ], report.rows);
  }

  function deviceIndexCsv(project) {
    const validation = validateProject(project);
    if (!validation.valid) throw new Error('Device index export blocked: ' + validation.errors.join(' '));
    const sheets = project.projectModel?.sheets || project.sheets || [];
    const sheetNumbers = new Map(sheets.map(sheet => [sheet.id, sheet.number || sheet.name || sheet.id]));
    const sheetOrder = new Map(sheets.map((sheet, index) => [sheet.id, index]));
    const rows = project.objects.filter(object => object.kind === 'component-instance').map(object => {
      const definition = component(object.componentId, object.customSymbol);
      const sheetId = object.sheetId || project.activeSheet || sheets[0]?.id;
      return {
        sheetId,
        sheet: sheetNumbers.get(sheetId) || sheetId,
        ref: object.ref,
        manufacturer: definition.manufacturer,
        partNumber: definition.manufacturerPartNumber,
        model: definition.model,
        description: definition.name
      };
    }).sort((a, b) => (sheetOrder.get(a.sheetId) ?? 0) - (sheetOrder.get(b.sheetId) ?? 0)
      || a.ref.localeCompare(b.ref, 'en', { numeric: true }));
    return connectionReportCsv([
      ['Sheet', 'sheet'], ['Reference', 'ref'], ['Manufacturer', 'manufacturer'],
      ['Part number', 'partNumber'], ['Model', 'model'], ['Description', 'description']
    ], rows);
  }

  function sheetIndexCsv(project) {
    const validation = validateProject(project);
    if (!validation.valid) throw new Error('Sheet index export blocked: ' + validation.errors.join(' '));
    const sections = new Map((project.projectModel?.sections || []).map(section => [section.id, section.name]));
    const sheets = project.projectModel?.sheets || project.sheets || [];
    const rows = sheets.map(sheet => {
      const sectionId = sheet.sectionId || sheet.projectSectionId;
      return { ...sheet, section: sections.get(sectionId) || sectionId };
    });
    return connectionReportCsv([
      ['Sheet', 'number'], ['Title', 'name'], ['Section', 'section'], ['Description', 'description'],
      ['Paper size', 'paperSize'], ['Orientation', 'orientation'], ['Scale', 'scale'], ['Revision', 'revision']
    ], rows);
  }

  function spreadsheetCsvCell(value, listSeparator) {
    let text = Array.isArray(value) ? value.join(listSeparator) : String(value ?? '');
    if (typeof value !== 'number' && /^[\s\uFEFF]*(?:[=+\-@\t\r\n])/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  }

  function connectionReportCsv(columns, rows) {
    function cell(value) {
      return spreadsheetCsvCell(value, '; ');
    }
    const lines = [columns.map(function (column) { return cell(column[0]); }).join(',')];
    rows.forEach(function (row) {
      lines.push(columns.map(function (column) { return cell(row[column[1]]); }).join(','));
    });
    return '\uFEFF' + lines.join('\r\n') + '\r\n';
  }

  root.AdigunCADEngine = Object.freeze({
    componentSchemaVersion: COMPONENT_SCHEMA_VERSION,
    netSchemaVersion: 1,
    projectFormat: PROJECT_FORMAT,
    projectVersion: PROJECT_VERSION,
    component: component,
    customSymbolDefinition: customSymbolDefinition,
    catalog: catalog,
    createInstance: createInstance,
    createProjectModel: createProjectModel,
    copyExampleProject: copyExampleProject,
    fitDrawingToPage: fitDrawingToPage,
    invertDrawingTransform: invertDrawingTransform,
    viewportViewBox: viewportViewBox,
    zoomViewAt: zoomViewAt,
    defaultProjectSections: function () { return clone(DEFAULT_PROJECT_SECTIONS); },
    addProjectSection: addProjectSection,
    renameProjectSection: renameProjectSection,
    addProjectSheet: addProjectSheet,
    setProjectSheetPaperFormat: setProjectSheetPaperFormat,
    projectSheetMargins: projectSheetMargins,
    setProjectSheetMargin: setProjectSheetMargin,
    setProjectSheetDrawingScale: setProjectSheetDrawingScale,
    projectSheetDrawingScaleFactor: projectSheetDrawingScaleFactor,
    renameProjectSheet: renameProjectSheet,
    moveProjectSheet: moveProjectSheet,
    deleteProjectSheet: deleteProjectSheet,
    detachDeletedDrawingObjects: detachDeletedDrawingObjects,
    renumberProjectSheets: renumberProjectSheets,
    moveInstance: moveInstance,
    reorderObject: reorderObject,
    resizeGraphicObject: resizeGraphicObject,
    rotateInstance: rotateInstance,
    validateInstance: validateInstance,
    worldPins: worldPins,
    validateProject: validateProject,
    serializeProject: serializeProject,
    parseProject: parseProject,
    analyze: analyze,
    analyzeProject: analyzeProject,
    projectElectricalReport: projectElectricalReport,
    crossSheetConnectors: crossSheetConnectors,
    billOfMaterials: billOfMaterials,
    billOfMaterialsCsv: billOfMaterialsCsv,
    wireList: wireList,
    wireListCsv: wireListCsv,
    wireRoutePoints: wireRoutePoints,
    disconnectTerminalGeometry: disconnectTerminalGeometry,
    cableScheduleCsv: cableScheduleCsv,
    terminalList: terminalList,
    terminalListCsv: terminalListCsv,
    plcIoList: plcIoList,
    plcIoListCsv: plcIoListCsv,
    deviceIndexCsv: deviceIndexCsv,
    sheetIndexCsv: sheetIndexCsv
  });
})(typeof window !== 'undefined' ? window : globalThis);


