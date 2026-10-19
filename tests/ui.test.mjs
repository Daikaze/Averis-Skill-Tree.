import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
const base = new URL('../', import.meta.url);
const main = readFileSync(new URL('scripts/main.js', base),'utf8');
const css = readFileSync(new URL('styles/bound.css', base),'utf8');
const manifest = JSON.parse(readFileSync(new URL('module.json', base),'utf8'));

test('every Bound dashboard source label is English', () => {
  assert.doesNotMatch(main, /[\u0400-\u04FF]/u, 'Unexpected Cyrillic UI text');
  for (const text of ['Initiator','Partner','Target','Library','Favorites','History','Details','Grant Bound XP','Select a target','Request Bound'])
    assert.ok(main.includes(text), `Missing translated UI label: ${text}`);
});

test('Bound cards are protected against V14 global button flex/height defaults', () => {
  assert.match(css, /\.ab-grid\s*>\s*button\.ab-card\s*\{/);
  const rules=css.split('.ab-grid > button.ab-card {').at(-1).split('}')[0];
  for(const text of ['display: flex !important','flex-direction: column !important','min-height: 174px !important','height: auto !important','align-items: stretch !important'])
    assert.ok(rules.includes(text),`Missing V14 card protection: ${text}`);
  assert.match(css,/minmax\(min\(100%, 188px\), 1fr\)/);
});

test('tabs are accessible and native dropdown choices have readable contrast',()=>{
  assert.match(css,/\.ab-tab-row\s*>\s*button\[data-a="tab"\]/);
  assert.match(css,/color-scheme:\s*dark\s*!important/);
  assert.match(css,/\.ab-shell option,/);
  assert.match(css,/\.averis-bound-form option,/);
});

test('updated manifest points to the v0.2.2 isolated Bound release',()=>{
  assert.equal(manifest.version,'0.2.2');
  assert.equal(manifest.id,'averis-bound-system');
  assert.ok(manifest.download.includes('/bound-v0.2.2/'));
  assert.equal(manifest.compatibility.verified,'14');
  assert.equal(manifest.relationships.systems[0].compatibility.minimum,'5.3.3');
});