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
  const positions = new Set(terminals.map(pin => JSON.stringify([pin.x, pin.y])));
  if (anchors.size !== terminals.length || positions.size !== terminals.length ||
      terminals.some(pin => !pin.id || !pin.localNumber || !Number.isFinite(pin.x) || !Number.isFinite(pin.y)) ||
      symbol.internalConnections.some(group => group.some(id => !anchors.has(id)))) {
    throw new Error('Invalid terminal map: ' + part.id);
  }
  if (!part.sources.length || part.sources.some(source => !source.url?.startsWith('https://') || !source.retrievedAt)) {
    throw new Error('Missing manufacturer source evidence: ' + part.id);
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
    nodeGroups: symbol.internalConnections,
    electricalFunctions: part.electricalFunctions || null,
    geometry: { id: symbol.id, view: symbol.view, unit: symbol.unit, width: symbol.width, height: symbol.height },
    physicalDimensions: part.specifications?.dimensions || null,
    physicalRepresentations: part.physicalRepresentations || [],
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
const files = {
  'component-bank.json': JSON.stringify({ summary, parts }, null, 2) + '\n',
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
