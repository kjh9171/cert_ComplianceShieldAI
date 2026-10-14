const fs = require('fs');
const src = fs.readFileSync('lib/catalog.ts', 'utf8');

// crude extraction of PII ids from the catalog block
const piiBlock = src.slice(src.indexOf('export const PII_CATALOG'), src.indexOf('export const PII_MAP'));
const piiIds = new Set([...piiBlock.matchAll(/id:\s*'([a-z_]+)'/g)].map((m) => m[1]));

const sgBlock = src.slice(src.indexOf('export const SAFEGUARD_CATALOG'), src.indexOf('export const SAFEGUARD_MAP'));
const sgIds = new Set([...sgBlock.matchAll(/id:\s*'([a-z_]+)'/g)].map((m) => m[1]));

const presetBlock = src.slice(src.indexOf('export const INDUSTRY_PRESETS'), src.indexOf('/* ====', src.indexOf('export const INDUSTRY_PRESETS')));

const missing = [];
for (const m of presetBlock.matchAll(/(defaultPiiIds|extraPiiIds|defaultSafeguardIds|extraSafeguardIds):\s*\[([\s\S]*?)\]/g)) {
  const kind = m[1].includes('Pii') ? 'PII' : 'SAFEGUARD';
  const ids = [...m[2].matchAll(/'([a-z_]+)'/g)].map((x) => x[1]);
  const set = kind === 'PII' ? piiIds : sgIds;
  for (const id of ids) if (!set.has(id)) missing.push(`${kind} missing: ${id}`);
}

// unused pii / safeguards (informational)
const allPresetIds = new Set(
  [...presetBlock.matchAll(/'([a-z_]+)'/g)].map((m) => m[1]),
);
const unusedPii = [...piiIds].filter((id) => !allPresetIds.has(id));
const unusedSg = [...sgIds].filter((id) => !allPresetIds.has(id));

console.log('PII catalog size:', piiIds.size);
console.log('SAFEGUARD catalog size:', sgIds.size);
console.log('--- MISSING (errors) ---');
console.log(missing.length ? [...new Set(missing)].join('\n') : '(none)');
console.log('--- unused PII (info) ---');
console.log(unusedPii.join(', ') || '(none)');
console.log('--- unused SAFEGUARD (info) ---');
console.log(unusedSg.join(', ') || '(none)');