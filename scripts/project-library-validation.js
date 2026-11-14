'use strict';

const fs = require('node:fs');
const path = require('node:path');

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

function buildReport() {
  const manifest = readManifest();
  const projects = manifest.projects.map(entry => {
    const projectFile = path.resolve(repositoryRoot, entry.path);
    const project = JSON.parse(fs.readFileSync(projectFile, 'utf8'));
    const parsed = engine.parseProject(JSON.stringify(project));
    const analysis = engine.analyzeProject(project);
    const bom = engine.billOfMaterials(project.objects);
    const wireList = engine.wireList(project.objects);
    const checks = {
      projectSchema: parsed.valid && analysis.valid,
      sourceBackedBom: bom.valid,
      connectedWireList: wireList.valid,
      zeroGeometryErrors: analysis.geometryErrorCount === 0
    };
    const errors = [
      ...parsed.errors,
      ...analysis.errors,
      ...bom.errors,
      ...wireList.errors
    ];
    if (analysis.geometryErrorCount !== 0) errors.push('Project contains geometry errors.');
    return {
      id: entry.id,
      title: entry.title,
      topologyId: entry.topologyId,
      role: entry.role,
      path: entry.path,
      revision: project.revision || null,
      status: Object.values(checks).every(Boolean) ? 'passed' : 'failed',
      checks,
      metrics: {
        sheetCount: analysis.sheetCount,
        componentCount: analysis.componentCount,
        wireCount: analysis.wireCount,
        netCount: analysis.netCount,
        globalNetCount: analysis.globalNetCount,
        crossSheetConnectionCount: analysis.crossSheetConnectionCount,
        openEndpointCount: analysis.openEndpointCount,
        geometryErrorCount: analysis.geometryErrorCount,
        bomRowCount: bom.rows.length,
        wireListRowCount: wireList.rows.length
      },
      errors
    };
  });

  const validProjects = projects.filter(project => project.status === 'passed');
  const scaleQualifiedTopologies = new Set(validProjects
    .filter(project => project.metrics.sheetCount >= manifest.scaleTarget.minimumSheetsPerProject)
    .map(project => project.topologyId));
  const distinctTopologies = new Set(projects.map(project => project.topologyId));
  const completedScaleProjects = scaleQualifiedTopologies.size;
  const requiredScaleProjects = manifest.scaleTarget.firstGateDistinctProjects;

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
      fullLibraryTarget: manifest.scaleTarget.fullLibraryProjects
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
      process.exitCode = 1;
    }
  } else {
    process.stdout.write(rendered);
  }
  if (report.status !== 'passed') process.exitCode = 1;
}

if (require.main === module) run();

module.exports = { buildReport, manifestPath, reportPath };
