import test from 'node:test';import assert from 'node:assert/strict';import {redactDC} from '../scripts/redact.mjs';
test('hide explicit and inline save DCs while keeping ordinary numeric mechanics',()=>{
 for(const example of ['Constitution Save — DC 15','Strength Save DC 16','Dex Save 15','Wisdom Saving Throw (14)','Constitution Saving Throw DC 13']){
   const text=redactDC(example);assert.match(text,/GM only/);assert.doesNotMatch(text,/\b(?:DC|Save|Saving Throw)\s*(?:—|\(|-|:)?\s*\d{2}\b/i);
 }
 assert.equal(redactDC('2d8 + PB, speed reduced by 10 ft'),'2d8 + PB, speed reduced by 10 ft');
});
test('source player catalog never publishes numerical save DC labels',async()=>{
 const {AFFINITIES}=await import('../scripts/catalog.mjs');for(const a of AFFINITIES)for(const ability of a.abilities) {
  const x=redactDC(ability.description).replace(/\*\*/g,'');
  assert.doesNotMatch(x,/\bDC\s*[—:()\-\s]*\d{2}\b/i,`${a.name} Lv${ability.level}`);
 }
});