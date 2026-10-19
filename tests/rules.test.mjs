import assert from "node:assert/strict";
import { PRESETS, DEFAULT_CONFIG, normalizeTemplate, defaultLedger, normalizeLedger, failureReason, commitBound, resolveBonus, oppositeSides, distanceFeet, validFormula } from "../scripts/rules.mjs";

assert.equal(PRESETS.length,9);
assert.equal(new Set(PRESETS.map(x=>x.id)).size,9);
for(const p of PRESETS){
 assert.ok(p.title.length>=4 && p.rules.length>50 && p.trigger.length>9);
 assert.ok(validFormula(p.formula));
 assert.ok(Number.isInteger(p.reach)&&p.reach>=0);
 if(p.category==="melee"||p.category==="ranged")assert.ok(p.opposite&&p.target);
}
const sample={id:"custom-pair",title:"Linked Mana",category:"spell",action:"Action + Bonus Action",reach:60,formula:"2d6 + 3",target:true,opposite:false,trigger:"success",rules:"Participants cast their own spells with native D&D 5e Activities"};
assert.equal(normalizeTemplate(sample).id,"custom-pair");
for(const bad of ["1d3","99d1000","1d6+1d6","1d6*10","@prof","0d6","100d6","Math.random()"]){assert.equal(validFormula(bad),false,bad);}
assert.throws(()=>normalizeTemplate({...sample,id:"__bad"}),/template ID/);
assert.throws(()=>normalizeTemplate({...sample,formula:"1d6 + @prof"}),/dice/);
assert.throws(()=>normalizeTemplate({...sample,reach:1000}),/Reach/);
assert.equal(failureReason({ledger:null,a:"a",b:"a",round:1,combat:true}),"Choose two DIFFERENT characters.");
const begin=defaultLedger();
assert.equal(failureReason({ledger:begin,a:"A",b:"B",round:1,combat:true}),null);
const a=commitBound(begin,{id:"req1",a:"A",b:"B",round:1,combat:true,templateId:"twin-strike",targetId:"T",gmId:"g",sceneId:"s",at:123});
assert.equal(a.used.A.count,1);assert.equal(a.used.B.count,1);
assert.equal(a.used.A.lastRound,1);assert.equal(a.entries.length,1);
assert.match(failureReason({ledger:a,a:"A",b:"B",round:10,combat:true}),/already used/);
assert.match(failureReason({ledger:a,a:"A",b:"C",round:2,combat:true}),/Cooldown/);
assert.match(failureReason({ledger:a,a:"C",b:"B",round:3,combat:true}),/Cooldown/);
assert.equal(failureReason({ledger:a,a:"A",b:"C",round:4,combat:true}),null);
const b=commitBound(a,{id:"req2",a:"A",b:"C",round:4,combat:true,templateId:"spell-weave",gmId:"g",sceneId:"s",at:124});
assert.equal(b.used.A.count,2);
assert.match(failureReason({ledger:b,a:"A",b:"D",round:99,combat:true}),/no Bound uses left/);
assert.throws(()=>commitBound(b,{id:"req2",a:"D",b:"E",round:8,combat:true}),/Duplicate/);
const c=resolveBonus(b,"req1");assert.equal(c.entries[0].bonusResolved,true);
assert.throws(()=>resolveBonus(c,"req1"),/already rolled/);
assert.throws(()=>resolveBonus(c,"missing"),/longer exists/);
const out=commitBound(begin,{id:"o1",a:"A",b:"D",combat:false,round:null,gmId:"g",sceneId:"s",at:125});
assert.equal(out.used.A.lastRound,null);
assert.equal(failureReason({ledger:out,a:"A",b:"E",combat:false,round:null}),null);
assert.equal(normalizeLedger({entries:new Array(500).fill({id:"foo"})}).entries.length,200);
assert.equal(oppositeSides({x:0,y:0},{x:20,y:0},{x:10,y:0}),true);
assert.equal(oppositeSides({x:0,y:0},{x:2,y:0},{x:10,y:0}),false);
assert.equal(oppositeSides({x:10,y:0},{x:20,y:0},{x:10,y:0}),false);
assert.equal(distanceFeet({x:0,y:0},{x:200,y:0},100,5),10);
assert.equal(distanceFeet({x:0,y:0},{x:100,y:0},0,5),Infinity);
// Stress: 250 combat encounters with two different actors, varied rounds.
for(let i=0;i<250;i++){
 let ledger=defaultLedger();
 for(let j=0;j<2;j++){
  const a1=`A${i}`,b1=`B${i}-${j}`;
  const round=1+j*3;
  assert.equal(failureReason({ledger,a:a1,b:b1,round,combat:true,config:DEFAULT_CONFIG}),null);
  ledger=commitBound(ledger,{id:`test${i}-${j}`,a:a1,b:b1,round,combat:true,templateId:"skill-synergy",gmId:"GM",sceneId:"scene",at:0});
 }
 assert.equal(ledger.used[`A${i}`].count,2);
 assert.ok(failureReason({ledger,a:`A${i}`,b:"something",round:99,combat:true}));
}
console.log("PASS: 9 mode templates; cooldown, both participants' uses, anti-repeat, duplicate IDs, bonus-once, out-of-combat, positional geometry and 250 randomized scenarios.");