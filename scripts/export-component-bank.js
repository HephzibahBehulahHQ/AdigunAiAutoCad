'use strict';

const fs = require('node:fs');
const path = require('node:path');
require('../cad-engine.js');

const engine = globalThis.AdigunCADEngine;
const seen = new Set();
const parts = engine.catalog().map(item => {
  const part = engine.component(item.componentId);
  const identity = [part.manufacturer, part.manufacturerPartNumber]
    .map(value => String(value || '').normalize('NFKC').trim().toLowerCase()).join('\u0000');
  if (!part.manufacturer || !part.manufacturerPartNumber || seen.has(identity)) {
    throw new Error('Missing or duplicate manufacturer identity: ' + item.componentId);
  }
  seen.add(identity);
  const { symbol } = part;
  const terminals = symbol.pins;
  const anchors = new Set(terminals.map(pin => pin.id));
  const numbers = new Set(terminals.map(pin => pin.localNumber));
  const positions = new Set(terminals.map(pin => JSON.stringify([pin.x, pin.y])));
  const groups = symbol.internalConnections;
  const groupedAnchors = groups.flat();
  if (!terminals.length || anchors.size !== terminals.length || numbers.size !== terminals.length ||
      positions.size !== terminals.length ||
      terminals.some(pin => !pin.id?.trim() || !pin.localNumber?.trim() || !Number.isFinite(pin.x) || !Number.isFinite(pin.y)) ||
      groups.some(group => !Array.isArray(group) || group.length < 2) ||
      new Set(groupedAnchors).size !== groupedAnchors.length || groupedAnchors.some(id => !anchors.has(id))) {
    throw new Error('Invalid terminal map: ' + part.id);
  }
  if (symbol.view !== 'schematic' || symbol.unit !== 'mm' || !symbol.id?.trim() ||
      ![symbol.width, symbol.height].every(value => Number.isFinite(value) && value > 0)) {
    throw new Error('Invalid schematic geometry: ' + part.id);
  }
  if (!part.sources.length || part.sources.some(source => {
    const url = URL.canParse(source.url) && new URL(source.url);
    return !url || url.protocol !== 'https:' || url.username || url.password ||
      !source.publisher?.trim() || !source.title?.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(source.retrievedAt);
  })) {
    throw new Error('Missing manufacturer source evidence: ' + part.id);
  }
  const physicalRepresentations = part.physicalRepresentations ?? [];
  if (new Set(physicalRepresentations.map(view => view.id)).size !== physicalRepresentations.length ||
      physicalRepresentations.some(view => !view.id?.trim() || view.unit !== 'mm' ||
        !Number.isInteger(view.sourceIndex) || !part.sources[view.sourceIndex] ||
        ![view.width, view.height].every(value => Number.isFinite(value) && value > 0))) {
    throw new Error('Invalid physical representation: ' + part.id);
  }
  for (const view of physicalRepresentations) {
    if (view.view !== 'panel-front-envelope') continue;
    const dimensions = part.specifications?.dimensions;
    const documentedMeasurements = [
      [view.width, dimensions?.width],
      [view.height, dimensions?.height]
    ];
    if (view.depth !== undefined || dimensions?.depth) {
      documentedMeasurements.push([view.depth, dimensions?.depth]);
    }
    if (view.depthIncludingDINRail !== undefined || dimensions?.depthIncludingDINRail) {
      documentedMeasurements.push([view.depthIncludingDINRail, dimensions?.depthIncludingDINRail]);
    }
    if (dimensions?.depthOnNS35_7_5 || dimensions?.depthOnNS35_15 ||
        view.railDepths?.['NS 35/7.5'] !== undefined || view.railDepths?.['NS 35/15'] !== undefined) {
      documentedMeasurements.push([view.railDepths?.['NS 35/7.5'], dimensions?.depthOnNS35_7_5],
        [view.railDepths?.['NS 35/15'], dimensions?.depthOnNS35_15]);
    }
    if (view.railDepths?.['NS 32'] !== undefined || dimensions?.depthOnNS32) {
      documentedMeasurements.push([view.railDepths?.['NS 32'], dimensions?.depthOnNS32]);
    }
    if (!view.scope?.trim() || documentedMeasurements.some(([value, dimension]) =>
      !Number.isFinite(value) || value <= 0 || dimension?.unit !== 'mm' || value !== dimension.value)) {
      throw new Error('Panel envelope differs from documented dimensions: ' + part.id);
    }
  }
  return {
    componentId: part.id,
    schemaVersion: part.schemaVersion,
    category: part.category,
    family: part.family,
    manufacturer: part.manufacturer,
    orderCode: part.manufacturerPartNumber,
    model: part.model,
    function: part.name,
    aliases: part.aliases || [],
    terminals,
    nodeGroups: groups,
    electricalFunctions: part.electricalFunctions || null,
    geometry: { id: symbol.id, view: symbol.view, unit: symbol.unit, width: symbol.width, height: symbol.height },
    specifications: part.specifications || null,
    physicalDimensions: part.specifications?.dimensions || null,
    physicalRepresentations,
    editableProperties: part.instanceProperties,
    sourceEvidence: part.sources,
    status: 'source-backed native part'
  };
});
const summary = {
  manufacturerParts: parts.length,
  symbolFamilies: new Set(parts.map(part => part.family)).size,
  partsWithTerminalMaps: parts.filter(part => part.terminals.length).length,
  partsWithPhysicalDimensions: parts.filter(part => part.physicalDimensions).length,
  partsWithPhysicalRepresentations: parts.filter(part => part.physicalRepresentations.length).length,
  customDefinitions: 0,
  importOnlyOrLegacyRecords: 0
};
const columns = Object.keys(parts[0]);
const escapeCsv = value => '"' + String(value == null ? '' : typeof value === 'object' ? JSON.stringify(value) : value)
  .replaceAll('"', '""') + '"';
const inventoryJson = [
  '{',
  '  "summary": ' + JSON.stringify(summary) + ',',
  '  "parts": [',
  parts.map(part => '    ' + JSON.stringify(part)).join(',\n'),
  '  ]',
  '}',
  ''
].join('\n');
const files = {
  'component-bank.json': inventoryJson,
  'component-bank.csv': [columns.join(','), ...parts.map(part => columns.map(column => escapeCsv(part[column])).join(','))].join('\n') + '\n'
};
for (const [name, contents] of Object.entries(files)) {
  const output = path.join(__dirname, '../docs/reports', name);
  if (process.argv.includes('--write')) fs.writeFileSync(output, contents);
  else if (fs.readFileSync(output, 'utf8').replaceAll('\r\n', '\n') !== contents) {
    throw new Error(name + ' is out of date. Run node scripts/export-component-bank.js --write.');
  }
}
console.log(JSON.stringify(summary));
