import assert from 'node:assert/strict';
import test from 'node:test';
import {PRESETS, CATEGORY_META, TIER_LEVELS} from '../scripts/catalog.mjs';
import {normalizeTemplate, defaultLedger, normalizeLedger, failureReason, commitBound, resolveBonus, oppositeSides} from '../scripts/rules.mjs';
import {XP_ON_BOUND, levelForXp, totalXpForLevel, xpForNext, bondRank, addXp, awardBound, normalizeProgress, unlockReason} from '../scripts/progression.mjs';
const base=()=>({used:{},entries:[]});
test('exactly 60 unique, varied, rules-grounded techniques across 10 categories',()=>{
 assert.equal(PRESETS.length,60);assert.equal(new Set(PRESETS.map(p=>p.id)).size,60);
 const categories=new Set(PRESETS.map(p=>p.category));assert.equal(categories.size,10);
 for(const cat of categories){const set=PRESETS.filter(v=>v.category===cat);assert.equal(set.length,6,cat);assert.deepEqual(set.map(x=>x.level),TIER_LEVELS);}
 for(const x of PRESETS){assert.ok(x.title.length>3&&x.rules.length>40&&x.trigger.length>14);assert.ok(['damage','healing','check','penalty','temp','none'].includes(x.bonusKind));assert.ok(x.action.length>8);assert.ok(x.requiredBondRank>=1&&x.requiredBondRank<=3);assert.ok(CATEGORY_META[x.category]);}
 for(const id of ['twin-strike','crossfire','spell-weave','healing-chorus','guardian-link','tactical-feint','skill-synergy','evasive-relay','rallying-call']) assert.equal(PRESETS.find(x=>x.id===id).level,1,`${id} remains available to v0.1 users`);
});
test('XP strictly monotonic; can reach Lv 20 and cannot overflow',()=>{
 for(let l=1;l<20;l++){assert.equal(totalXpForLevel(l+1)-totalXpForLevel(l),xpForNext(l));assert.equal(levelForXp(totalXpForLevel(l)),l);assert.equal(levelForXp(totalXpForLevel(l+1)-1),l);}
 assert.equal(levelForXp(999999),20);
 const p=addXp({},120);assert.equal(p.level,2);assert.equal(p.xp,120);
 assert.equal(addXp(p,-999).xp,0);assert.throws(()=>addXp(p,NaN));assert.throws(()=>addXp(p,'12.1'));
});
test('migration from v0.1 actor without progress and preservation of unknown old flags',()=>{
 const actor={oldPrivateData:{x:1},ledger:{version:1,used:{}}};const p=normalizeProgress(actor.boundProgress);
 assert.equal(p.level,1);assert.equal(p.xp,0);assert.equal(p.version,2);
 assert.equal(actor.oldPrivateData.x,1);
});
test('bond ranks and automatic double-gated unlocks',()=>{
 for(const [count,rank] of [[0,1],[2,1],[3,2],[5,2],[6,3],[9,3],[10,4]])assert.equal(bondRank(count),rank);
 const tier5=PRESETS.find(x=>x.id==='final-crosscut'), p={xp:totalXpForLevel(12)};
 assert.match(unlockReason(tier5,p,0),/Bond Rank/);
 assert.equal(unlockReason(tier5,p,6),null);
 assert.match(unlockReason(tier5,{xp:totalXpForLevel(3)},100),/Bound Level/);
});
test('auto-awards are idempotent and increment both independent pair and XP',()=>{
 const a=awardBound({},'id_123456789','Actor.B',XP_ON_BOUND);
 assert.equal(a.awarded,true);assert.equal(a.progress.xp,15);assert.equal(a.progress.pairs['Actor.B'],1);
 const repeated=awardBound(a.progress,'id_123456789','Actor.B',15);assert.equal(repeated.awarded,false);assert.equal(repeated.progress.xp,15);
 const next=awardBound(a.progress,'id_123456780','Actor.B',25);assert.equal(next.progress.xp,40);assert.equal(next.progress.pairs['Actor.B'],2);
});
test('v0.1 encounter ledger migrates and does not corrupt old entries',()=>{
 const old={version:1,revision:5,used:{A:{count:1,lastRound:1,partners:['B']}},entries:[{id:'old',templateId:'twin-strike'}]};
 const l=normalizeLedger(old);assert.equal(l.version,2);assert.equal(l.used.A.count,1);assert.equal(l.entries[0].id,'old');
 assert.match(failureReason({ledger:l,a:'A',b:'B',round:5,combat:true}),/already used/);
 const n=commitBound(l,{id:'id_123456789',a:'A',b:'C',round:5,combat:true,templateId:'crossfire',gmId:'gm',sceneId:'sc',at:5});
 assert.equal(n.used.A.count,2);assert.equal(n.entries.length,2);assert.throws(()=>commitBound(n,{id:'id_123456789',a:'A',b:'C'}),/Duplicate/);
 const rolled=resolveBonus(n,'id_123456789');assert.equal(rolled.entries.at(-1).bonusResolved,true);assert.throws(()=>resolveBonus(rolled,'id_123456789'),/already rolled/);
});
test('30 simulated rounds and pair cooldown/anti-repeat safeguards',()=>{
 let l=defaultLedger();const heroes=['A','B','C','D','E'];let successes=0;
 for(let round=1;round<=30;round++)for(let k=1;k<heroes.length;k++){
  const a='A',b=heroes[k];const reason=failureReason({ledger:l,a,b,round,combat:true});if(reason)continue;
  l=commitBound(l,{id:`request_${round}_${k}_ok`,a,b,round,combat:true,templateId:'twin-strike',gmId:'gm',sceneId:'s',at:round});successes++;
 }
 assert.ok(successes<=2);assert.equal(l.used.A.count,2);assert.ok(l.entries.every(e=>e.actorA==='A'));
});
test('opposite-side positions and custom template unlock validation',()=>{
 assert.equal(oppositeSides({x:0,y:0},{x:100,y:0},{x:50,y:0}),true);
 assert.equal(oppositeSides({x:0,y:0},{x:10,y:0},{x:50,y:0}),false);
 const t=normalizeTemplate({id:'custom-tactic',title:'Custom Tactic',rules:'Both roll existing D&D actions with adjudicated DC.',trigger:'Both act',category:'utility',reach:20,level:5,requiredBondRank:2});
 assert.equal(t.level,5);assert.equal(t.requiredBondRank,2);assert.throws(()=>normalizeTemplate({...t,level:21}));
});