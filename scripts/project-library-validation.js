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
  for (const project of manifest.projects) {
    if (!project || !project.id || !project.title || !project.topologyId || !project.path) {
      throw new Error('Every manifest entry needs an id, title, topologyId, and path.');
    }
    if (ids.has(project.id)) throw new Error('Duplicate project id: ' + project.id);
    if (paths.has(project.path)) throw new Error('Duplicate project path: ' + project.path);
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
  const counts = new Map(sheets.map(sheet => [sheet.id, 0]));
  const defaultSheet = sheets.length === 1 ? sheets[0].id : undefined;
  for (const object of objects) {
    if (!object) continue;
    const id = object.sheetId || defaultSheet;
    if (!counts.has(id)) continue;
    const meaningful = object.kind === 'component-instance' || object.kind === 'wire'
      || (object.kind === 'text' && typeof object.text === 'string' && object.text.trim().length > 0
        && !/\b(?:TODO|TBD|PLACEHOLDER|LOREM IPSUM)\b/i.test(object.text));
    if (meaningful) counts.set(id, counts.get(id) + 1);
  }
  const emptyContentSheetIds = sheets.filter(sheet => counts.get(sheet.id) === 0).map(sheet => sheet.id);
  return {
    authoredSheetCount: sheets.length - emptyContentSheetIds.length,
    contentObjectCount: [...counts.values()].reduce((sum, count) => sum + count, 0),
    emptyContentSheetIds
  };
}

function topologyHash(analysis) {
  return createHash('sha256').update(JSON.stringify({
    nets: analysis.globalNets,
    crossSheetConnections: analysis.crossSheetConnections,
    openEndpoints: analysis.openEndpoints
  })).digest('hex');
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
    terminals: engine.terminalListCsv
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

function buildReport() {
  const manifest = readManifest();
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
    const sheetContent = summarizeSheetContent(project);
    const checks = {
      projectSchema: parsed.valid && analysis.valid,
      nativeRoundTrip: roundTrip.valid,
      csvExportRoundTrip: csv.valid,
      allSheetsHaveEditableContent: sheetContent.emptyContentSheetIds.length === 0,
      sourceBackedBom: bom.valid,
      connectedWireList: wireList.valid && analysis.openEndpointCount === 0,
      terminalList: terminals.valid,
      zeroGeometryErrors: analysis.geometryErrorCount === 0
    };
    const errors = [
      ...parsed.errors,
      ...analysis.errors,
      ...roundTrip.errors,
      ...csv.errors,
      ...bom.errors,
      ...wireList.errors,
      ...terminals.errors
    ];
    if (analysis.geometryErrorCount !== 0) errors.push('Project contains geometry errors.');
    if (analysis.openEndpointCount > 0) errors.push('Project contains unresolved wire endpoints.');
    const connectedSheets = new Set((analysis.globalNets || [])
      .filter(net => net.wireIds.length > 0 && net.pins.length >= 2)
      .flatMap(net => net.sheetIds));
    return {
      id: entry.id,
      title: entry.title,
      topologyId: entry.topologyId,
      role: entry.role,
      path: entry.path,
      revision: project.revision || null,
      status: Object.values(checks).every(Boolean) ? 'passed' : 'failed',
      checks,
      topologySha256: roundTrip.hash,
      csvSha256: csv.fingerprints,
      metrics: {
        sheetCount: analysis.sheetCount,
        authoredSheetCount: sheetContent.authoredSheetCount,
        connectedSheetCount: connectedSheets.size,
        contentObjectCount: sheetContent.contentObjectCount,
        emptyContentSheetIds: sheetContent.emptyContentSheetIds,
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
      errors
    };
  });

  const validProjects = projects.filter(project => project.status === 'passed');
  const scaleQualifiedTopologies = new Set(validProjects
    .filter(project => project.metrics.sheetCount >= manifest.scaleTarget.minimumSheetsPerProject
      && project.metrics.authoredSheetCount === project.metrics.sheetCount)
    .map(project => project.topologyId));
  const distinctTopologies = new Set(projects.map(project => project.topologyId));
  const completedScaleProjects = scaleQualifiedTopologies.size;
  const requiredScaleProjects = manifest.scaleTarget.firstGateDistinctProjects;
  const releaseTopologies = new Map();
  for (const project of validProjects) {
    const { sheetCount, authoredSheetCount, connectedSheetCount } = project.metrics;
    if (sheetCount < manifest.scaleTarget.minimumSheetsPerProject
      || authoredSheetCount !== sheetCount
      || connectedSheetCount < manifest.scaleTarget.minimumConnectedSheetsPerProject) continue;
    releaseTopologies.set(project.topologyId, Math.max(sheetCount, releaseTopologies.get(project.topologyId) || 0));
  }
  const releaseSheetCount = [...releaseTopologies.values()].reduce((total, count) => total + count, 0);
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
        complete: releaseTopologies.size >= manifest.scaleTarget.fullLibraryProjects
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
    process.exitCode = 1;
  }
}

if (require.main === module) run();

module.exports = { buildReport, manifestPath, reportPath };

