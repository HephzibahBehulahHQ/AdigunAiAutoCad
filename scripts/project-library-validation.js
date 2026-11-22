'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { isDeepStrictEqual } = require('node:util');

const repositoryRoot = path.resolve(__dirname, '..');
const manifestPath = path.join(repositoryRoot, 'examples', 'real-projects', 'library.json');
const reportPath = path.join(repositoryRoot, 'docs', 'reports', 'project-library-validation.json');

require(path.join(repositoryRoot, 'cad-engine.js'));
const engine = globalThis.AdigunCADEngine;

function readManifest() {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (manifest.schemaVersion !== 1 || !Array.isArray(manifest.projects)) {
    throw new Error('Unsupported project-library manifest.');
  }
  const ids = new Set();
  const paths = new Set();
  const briefIds = new Set();
  if (!Array.isArray(manifest.briefs) || manifest.briefs.length !== manifest.scaleTarget.fullLibraryProjects) {
    throw new Error('The manifest must define every required project brief.');
  }
  for (const brief of manifest.briefs) {
    if (!brief || !/^\d{2}$/.test(brief.id) || briefIds.has(brief.id) || !brief.title || !brief.category) {
      throw new Error('Project briefs need unique two-digit IDs, titles and categories.');
    }
    briefIds.add(brief.id);
  }
  for (const project of manifest.projects) {
    if (!project || !project.id || !project.title || !project.topologyId || !project.path) {
      throw new Error('Every manifest entry needs an id, title, topologyId, and path.');
    }
    if (ids.has(project.id)) throw new Error('Duplicate project id: ' + project.id);
    if (paths.has(project.path)) throw new Error('Duplicate project path: ' + project.path);
    if (project.briefId !== undefined && !briefIds.has(project.briefId)) throw new Error('Unknown project brief: ' + project.briefId);
    ids.add(project.id);
    paths.add(project.path);
    const absolutePath = path.resolve(repositoryRoot, project.path);
    if (!absolutePath.startsWith(repositoryRoot + path.sep)) {
      throw new Error('Project path escapes the repository: ' + project.path);
    }
  }
  return manifest;
}

function summarizeSheetContent(project) {
  const sheets = Array.isArray(project.sheets) && project.sheets.length
    ? project.sheets
    : [{ id: project.activeSheet || 'main' }];
  const objects = Array.isArray(project.objects) ? project.objects : [];
  const content = new Map(sheets.map(sheet => [sheet.id, []]));
  const defaultSheet = sheets.length === 1 ? sheets[0].id : undefined;
  for (const object of objects) {
    if (!object || object.hidden) continue;
    const id = object.sheetId || defaultSheet;
    if (!content.has(id)) continue;
    const meaningful = object.kind === 'component-instance' || object.kind === 'wire' || object.kind === 'dimension'
      || (object.kind === 'text' && typeof object.text === 'string' && object.text.trim().length > 0
        && !/\b(?:TODO|TBD|PLACEHOLDER|LOREM IPSUM)\b/i.test(object.text));
    if (meaningful) {
      const { id: objectId, sheetId, groupId, pinAttachments, ...drawing } = object;
      content.get(id).push(JSON.stringify(stableDrawingValue(drawing)));
    }
  }
  const emptyContentSheetIds = [];
  const repeatedContentSheets = [];
  const firstSheetByContent = new Map();
  for (const [id, drawings] of content) {
    if (!drawings.length) {
      emptyContentSheetIds.push(id);
      continue;
    }
    const signature = JSON.stringify(drawings.sort());
    const firstSheet = firstSheetByContent.get(signature);
    if (firstSheet) repeatedContentSheets.push({ id, matches: firstSheet });
    else firstSheetByContent.set(signature, id);
  }
  return {
    authoredSheetCount: sheets.length - emptyContentSheetIds.length,
    contentObjectCount: [...content.values()].reduce((sum, objects) => sum + objects.length, 0),
    emptyContentSheetIds,
    repeatedContentSheets
  };
}

function stableDrawingValue(value) {
  if (Array.isArray(value)) return value.map(stableDrawingValue);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, stableDrawingValue(value[key])]));
  }
  return value;
}

function topologyHash(analysis) {
  return createHash('sha256').update(JSON.stringify({
    nets: analysis.globalNets,
    crossSheetConnections: analysis.crossSheetConnections,
    openEndpoints: analysis.openEndpoints
  })).digest('hex');
}

function electricalStructureHash(project, globalNets) {
  const defaultSheet = project.sheets?.[0]?.id;
  const deviceKey = device => JSON.stringify([device.sheetId || defaultSheet, device.ref]);
  const devices = new Map(project.objects.filter(object => object.kind === 'component-instance')
    .map(object => [deviceKey(object), { label: JSON.stringify(['device', object.componentId]), neighbors: [] }]));
  const vertices = [...devices.values()];
  for (const net of globalNets) {
    if (!net.wireIds.length || net.pins.length < 2) continue;
    const vertex = { label: 'net', neighbors: [] };
    for (const pin of net.pins) {
      const device = devices.get(deviceKey(pin));
      if (!device) throw new Error('Unknown device in electrical net: ' + pin.ref);
      device.neighbors.push({ vertex, terminal: pin.number });
      vertex.neighbors.push({ vertex: device, terminal: pin.number });
    }
    vertices.push(vertex);
  }
  const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
  let labels = new Map(vertices.map(vertex => [vertex, digest(vertex.label)]));
  // Refine device and net labels together. Routing, sheet names, tags and order do not affect the result.
  for (let round = 0; round < 4; round++) {
    labels = new Map(vertices.map(vertex => [vertex, digest([labels.get(vertex), vertex.neighbors
      .map(edge => JSON.stringify([edge.terminal, labels.get(edge.vertex)])).sort()])]));
  }
  return digest([...labels.values()].sort());
}

function checkNativeRoundTrip(project, analysis) {
  if (!analysis.valid) return { valid: false, hash: null, errors: [] };
  const hash = topologyHash(analysis);
  try {
    const reopened = engine.parseProject(engine.serializeProject(project));
    if (!reopened.valid) return { valid: false, hash, errors: reopened.errors };
    const reopenedAnalysis = engine.analyzeProject(reopened.project);
    if (!reopenedAnalysis.valid) return { valid: false, hash, errors: reopenedAnalysis.errors };
    const expected = {
      ...project,
      format: engine.projectFormat,
      version: engine.projectVersion,
      componentSchemaVersion: engine.componentSchemaVersion,
      netSchemaVersion: engine.netSchemaVersion
    };
    const errors = [];
    if (!isDeepStrictEqual(expected, reopened.project)) errors.push('Native save and reopen changed project data.');
    if (hash !== topologyHash(reopenedAnalysis)) errors.push('Native save and reopen changed electrical topology.');
    return { valid: errors.length === 0, hash, errors, reopened: reopened.project };
  } catch (error) {
    return { valid: false, hash, errors: ['Native save and reopen failed: ' + error.message] };
  }
}

function checkCsvExports(project, reopened) {
  const exporters = {
    bom: input => engine.billOfMaterialsCsv(input.objects),
    wires: engine.wireListCsv,
    terminals: engine.terminalListCsv,
    plcIo: engine.plcIoListCsv,
    cables: engine.cableScheduleCsv,
    devices: engine.deviceIndexCsv,
    sheets: engine.sheetIndexCsv
  };
  const fingerprints = {};
  const errors = [];
  if (!reopened) return { valid: false, fingerprints, errors };

  for (const [name, exportCsv] of Object.entries(exporters)) {
    try {
      const csv = exportCsv(project);
      if (csv !== exportCsv(reopened)) {
        errors.push(name + ' CSV changed after native save and reopen.');
        continue;
      }
      fingerprints[name] = createHash('sha256').update(csv).digest('hex');
    } catch (error) {
      errors.push(name + ' CSV export failed: ' + error.message);
    }
  }
  return { valid: errors.length === 0, fingerprints, errors };
}

function buildWirePreview(project) {
  const sheets = Array.isArray(project.sheets) ? project.sheets : [];
  const routes = new Map();
  for (const wire of project.objects) {
    if (wire.kind !== 'wire' || wire.hidden) continue;
    const points = [wire.x1, wire.y1, wire.x2, wire.y2];
    if (!points.every(Number.isFinite)) continue;
    const sheetId = wire.sheetId || project.activeSheet || sheets[0]?.id || 'main';
    if (!routes.has(sheetId)) routes.set(sheetId, []);
    if (wire.bends) {
      const route = engine.wireRoutePoints(wire);
      for (let index = 1; index < route.length; index += 1) {
        routes.get(sheetId).push([route[index - 1].x, route[index - 1].y, route[index].x, route[index].y]);
      }
    } else routes.get(sheetId).push(points);
  }
  const ordered = [...routes].sort((a, b) => b[1].length - a[1].length);
  const selected = routes.has(project.activeSheet) ? [project.activeSheet, routes.get(project.activeSheet)] : ordered[0];
  if (!selected) return null;
  const [sheetId, segments] = selected;
  const min = [Infinity, Infinity];
  const max = [-Infinity, -Infinity];
  for (const [x1, y1, x2, y2] of segments) {
    min[0] = Math.min(min[0], x1, x2);
    min[1] = Math.min(min[1], y1, y2);
    max[0] = Math.max(max[0], x1, x2);
    max[1] = Math.max(max[1], y1, y2);
  }
  const scale = 100 / Math.max(1, max[0] - min[0], max[1] - min[1]);
  return {
    sheetId,
    sheetName: sheets.find(sheet => sheet.id === sheetId)?.name || sheetId,
    segments: segments.map(points => points.map((coordinate, index) => Math.round((coordinate - min[index % 2]) * scale)).join(',')).join(' ')
  };
}

function buildReport() {
  const manifest = readManifest();
  const { minimumSheetsPerProject, minimumConnectedSheetsPerProject } = manifest.scaleTarget;
  const projects = manifest.projects.map(entry => {
    const projectFile = path.resolve(repositoryRoot, entry.path);
    const source = fs.readFileSync(projectFile, 'utf8');
    const project = JSON.parse(source);
    const parsed = engine.parseProject(source);
    const analysis = engine.analyzeProject(project);
    const roundTrip = checkNativeRoundTrip(project, analysis);
    const csv = checkCsvExports(project, roundTrip.reopened);
    const bom = engine.billOfMaterials(project.objects);
    const wireList = engine.wireList(project);
    const terminals = engine.terminalList(project);
    const cableFindings = (analysis.findings || []).filter(finding =>
      finding.ruleId === 'ERC-INCOMPLETE-CABLE-CORE' || finding.ruleId === 'ERC-CABLE-CORE-DISCONNECTED');
    const terminalConflicts = (analysis.findings || []).filter(finding => finding.ruleId === 'ERC-TERMINAL-POSITION-CONFLICT');
    const electricalErrors = (analysis.findings || []).filter(finding => finding.severity === 'error');
    const sheetContent = summarizeSheetContent(project);
    const checks = {
      projectSchema: parsed.valid && analysis.valid,
      nativeRoundTrip: roundTrip.valid,
      csvExportRoundTrip: csv.valid,
      allSheetsHaveEditableContent: sheetContent.emptyContentSheetIds.length === 0,
      sourceBackedBom: bom.valid,
      connectedWireList: wireList.valid && analysis.openEndpointCount === 0,
      terminalList: terminals.valid,
      uniqueTerminalPositions: terminalConflicts.length === 0,
      cableAssignments: cableFindings.length === 0,
      noElectricalRuleErrors: electricalErrors.length === 0,
      zeroGeometryErrors: analysis.geometryErrorCount === 0
    };
    const errors = [
      ...parsed.errors,
      ...analysis.errors,
      ...roundTrip.errors,
      ...csv.errors,
      ...bom.errors,
      ...wireList.errors,
      ...terminals.errors,
      ...cableFindings.map(finding => finding.message),
      ...electricalErrors.map(finding => finding.message)
    ];
    if (analysis.geometryErrorCount !== 0) errors.push('Project contains geometry errors.');
    if (analysis.openEndpointCount > 0) errors.push('Project contains unresolved wire endpoints.');
    const connectedSheets = new Set((analysis.globalNets || [])
      .filter(net => net.wireIds.length > 0 && net.pins.length >= 2)
      .flatMap(net => net.sheetIds));
    const connectedSheetCount = connectedSheets.size;
    const sheetCount = analysis.sheetCount;
    const passed = Object.values(checks).every(Boolean);
    const releaseScale = {
      qualified: passed && sheetCount >= minimumSheetsPerProject
        && sheetContent.authoredSheetCount === sheetCount
        && sheetContent.repeatedContentSheets.length === 0
        && connectedSheetCount >= minimumConnectedSheetsPerProject,
      additionalAuthoredSheetsRequired: Math.max(0, minimumSheetsPerProject - sheetContent.authoredSheetCount),
      additionalConnectedSheetsRequired: Math.max(0, minimumConnectedSheetsPerProject - connectedSheetCount),
      sheetIdsWithoutElectricalConnectivity: (Array.isArray(project.sheets) ? project.sheets : [])
        .filter(sheet => !connectedSheets.has(sheet.id))
        .map(sheet => sheet.id)
    };
    return {
      id: entry.id,
      title: entry.title,
      topologyId: entry.topologyId,
      briefId: entry.briefId || null,
      role: entry.role,
      path: entry.path,
      revision: project.revision || null,
      status: passed ? 'passed' : 'failed',
      checks,
      releaseScale,
      wirePreview: buildWirePreview(project),
      topologySha256: roundTrip.hash,
      electricalStructureSha256: analysis.valid ? electricalStructureHash(project, analysis.globalNets) : null,
      csvSha256: csv.fingerprints,
      metrics: {
        sheetCount,
        authoredSheetCount: sheetContent.authoredSheetCount,
        connectedSheetCount,
        contentObjectCount: sheetContent.contentObjectCount,
        emptyContentSheetIds: sheetContent.emptyContentSheetIds,
        repeatedContentSheets: sheetContent.repeatedContentSheets,
        componentCount: analysis.componentCount,
        wireCount: analysis.wireCount,
        netCount: analysis.netCount,
        globalNetCount: analysis.globalNetCount,
        crossSheetConnectionCount: analysis.crossSheetConnectionCount,
        openEndpointCount: analysis.openEndpointCount,
        geometryErrorCount: analysis.geometryErrorCount,
        bomRowCount: bom.rows.length,
        wireListRowCount: wireList.rows.length,
        terminalListRowCount: terminals.rows.length
      },
      errors: [...new Set(errors)]
    };
  });

  const validProjects = projects.filter(project => project.status === 'passed');
  const scaleQualifiedTopologies = new Set(validProjects
    .filter(project => project.metrics.sheetCount >= manifest.scaleTarget.minimumSheetsPerProject
      && project.metrics.authoredSheetCount === project.metrics.sheetCount
      && project.metrics.repeatedContentSheets.length === 0)
    .map(project => project.topologyId));
  const distinctTopologies = new Set(projects.map(project => project.topologyId));
  const completedScaleProjects = scaleQualifiedTopologies.size;
  const requiredScaleProjects = manifest.scaleTarget.firstGateDistinctProjects;
  const releaseTopologies = new Map();
  const releaseStructures = new Map();
  const releaseBriefs = new Map();
  const duplicateReleaseProjects = [];
  const candidates = validProjects.filter(project => project.briefId && project.releaseScale.qualified)
    .sort((first, second) => second.metrics.sheetCount - first.metrics.sheetCount);
  for (const project of candidates) {
    const duplicate = releaseTopologies.get(project.topologyId) || releaseStructures.get(project.electricalStructureSha256)
      || releaseBriefs.get(project.briefId);
    if (duplicate) {
      duplicateReleaseProjects.push({ id: project.id, matches: duplicate.id });
      continue;
    }
    releaseTopologies.set(project.topologyId, project);
    releaseStructures.set(project.electricalStructureSha256, project);
    releaseBriefs.set(project.briefId, project);
  }
  const briefCoverage = manifest.briefs.map(brief => ({ ...brief,
    projectIds: projects.filter(project => project.briefId === brief.id).map(project => project.id),
    qualifiedProjectId: releaseBriefs.get(brief.id)?.id || null
  }));
  const releaseSheetCount = [...releaseTopologies.values()].reduce((total, project) => total + project.metrics.sheetCount, 0);
  const requiredReleaseSheetCount = manifest.scaleTarget.fullLibraryProjects * manifest.scaleTarget.minimumSheetsPerProject;

  return {
    schemaVersion: 1,
    status: validProjects.length === projects.length ? 'passed' : 'failed',
    summary: {
      projectArtifactCount: projects.length,
      validatedArtifactCount: validProjects.length,
      distinctTopologyCount: distinctTopologies.size,
      distinct100SheetTopologyCount: completedScaleProjects,
      firstScaleGate: {
        requiredDistinct100SheetProjects: requiredScaleProjects,
        completedDistinct100SheetProjects: completedScaleProjects,
        complete: completedScaleProjects >= requiredScaleProjects
      },
      fullLibraryTarget: manifest.scaleTarget.fullLibraryProjects,
      releaseScaleGate: {
        minimumSheetsPerProject: manifest.scaleTarget.minimumSheetsPerProject,
        minimumConnectedSheetsPerProject: manifest.scaleTarget.minimumConnectedSheetsPerProject,
        requiredDistinctProjects: manifest.scaleTarget.fullLibraryProjects,
        qualifiedDistinctProjects: releaseTopologies.size,
        requiredSheetCount: requiredReleaseSheetCount,
        qualifiedSheetCount: releaseSheetCount,
        duplicateReleaseProjects,
        briefCoverage,
        complete: briefCoverage.every(brief => brief.qualifiedProjectId)
          && releaseSheetCount >= requiredReleaseSheetCount
      }
    },
    projects
  };
}

function run() {
  const report = buildReport();
  const rendered = JSON.stringify(report, null, 2) + '\n';
  if (process.argv.includes('--write')) {
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, rendered);
  } else if (process.argv.includes('--check')) {
    if (!fs.existsSync(reportPath) || fs.readFileSync(reportPath, 'utf8') !== rendered) {
      console.error('Project-library report is missing or stale. Run node scripts/project-library-validation.js --write.');
      const saved = fs.existsSync(reportPath) ? fs.readFileSync(reportPath, 'utf8') : '';
      let offset = 0;
      while (offset < rendered.length && rendered[offset] === saved[offset]) offset += 1;
      const line = rendered.slice(0, offset).split('\n').length;
      console.error(`First difference at line ${line}; expected ${JSON.stringify(rendered.slice(offset, offset + 120))}, saved ${JSON.stringify(saved.slice(offset, offset + 120))}.`);
      process.exitCode = 1;
    }
  } else {
    process.stdout.write(rendered);
  }
  if (report.status !== 'passed') process.exitCode = 1;
  if (process.argv.includes('--require-release-scale') && !report.summary.releaseScaleGate.complete) {
    const gate = report.summary.releaseScaleGate;
    console.error(`Library release scale incomplete: ${gate.qualifiedDistinctProjects}/${gate.requiredDistinctProjects} qualified projects, ${gate.qualifiedSheetCount}/${gate.requiredSheetCount} qualified sheets.`);
    for (const project of report.projects.filter(entry => !entry.releaseScale.qualified)) {
      const { additionalAuthoredSheetsRequired, additionalConnectedSheetsRequired } = project.releaseScale;
      const validation = project.status === 'failed' ? ' Project validation also failed.' : '';
      console.error(`${project.id}: ${additionalAuthoredSheetsRequired} more authored sheets, ${additionalConnectedSheetsRequired} more electrically connected sheets required.${validation}`);
      for (const { id, matches } of project.metrics.repeatedContentSheets) {
        console.error(`  ${id} repeats the visible editable content of ${matches}.`);
      }
    }
    for (const { id, matches } of gate.duplicateReleaseProjects) {
      console.error(id + ': Shares a brief, topology ID or electrical structure fingerprint with ' + matches + '.');
    }
    const missingBriefs = gate.briefCoverage.filter(brief => !brief.projectIds.length);
    if (missingBriefs.length) console.error(`${missingBriefs.length} required briefs have no mapped project yet.`);
    process.exitCode = 1;
  }
}

if (require.main === module) run();

module.exports = { buildReport, electricalStructureHash, summarizeSheetContent, manifestPath, reportPath };

