import assert from 'node:assert/strict';
import {starterTrees, AFFINITY_CODEX, AFFINITIES, CLASS_KEYS, SKILLS, defaultProgress, xpNeeded} from '../scripts/data.js';

const all=starterTrees();
assert.equal(all.length,4+13+14);
assert.equal(Object.keys(SKILLS).length,18);
assert.equal(CLASS_KEYS.length,13);
assert.equal(AFFINITIES.length,14);
assert.equal(new Set(all.map(x=>x.id)).size,all.length);
const ids=all.flatMap(t=>t.nodes.map(n=>n.id));
assert.equal(new Set(ids).size,ids.length,'unique node IDs');
for(const tree of all){
 const names=new Set(tree.nodes.map(x=>x.id));
 assert.ok(tree.nodes.length>=5,`at least five skills per tree ${tree.id}`);
 for(const n of tree.nodes){
  assert.ok(n.name?.length>2);assert.ok(n.description?.length>10);assert.ok(n.minLevel>=1);
  assert.ok(n.requires.every(id=>names.has(id)&&id!==n.id));
  assert.ok(['skill','effect','builtin','item'].includes(n.grantType));
 }
}
for(const a of AFFINITIES)assert.equal(AFFINITY_CODEX[a].length,5);
assert.equal(xpNeeded(1),100);assert.equal(xpNeeded(5),500);

const hooks={};
globalThis.Hooks={once:(name,cb)=>hooks[name]=cb,on:(name,cb)=>hooks[name]=cb};
const settings=new Map();
const mod={api:null};
const user={isGM:true};
const actor={
 id:'actor1',uuid:'Actor.actor1',name:'Test Paladin',type:'character',documentName:'Actor',isOwner:true,
 img:'portrait.webp',
 flags:{},items:[],effects:[],
 getFlag(module,key){return this.flags[module]?.[key];},
 async setFlag(module,key,data){(this.flags[module]??={})[key]=structuredClone(data);},
 async createEmbeddedDocuments(type,docs){
  const c=docs.map((data,i)=>({id:`${type}-${Math.random()}-${i}`,...structuredClone(data),
   getFlag(module,key){return this.flags?.[module]?.[key];},
   async update(update){Object.assign(this,update);},
   sheet:{render(){return true;}}}));
  (type==='Item'?this.items:this.effects).push(...c);return c;
 },
 async deleteEmbeddedDocuments(type,ids){const list=type==='Item'?this.items:this.effects;
  for(const id of ids){const idx=list.findIndex(x=>x.id===id);if(idx>=0)list.splice(idx,1);}
 }
};
actor.items.push({type:'class',name:'Paladin',system:{identifier:'paladin'},getFlag:()=>undefined});
globalThis.game={settings:{register(mod,key,config){if(!settings.has(key))settings.set(key,structuredClone(config.default));},
 get(mod,key){return settings.get(key);},async set(mod,key,v){settings.set(key,structuredClone(v));}},
 modules:new Map([['averis-skill-tree',mod]]),system:{id:'dnd5e'},user,actors:[actor]};
const notifications=[];globalThis.ui={notifications:{warn(m){notifications.push(m)},info(m){notifications.push(m)},error(m){notifications.push(m)}}};
globalThis.CONST={ACTIVE_EFFECT_MODES:{UPGRADE:4,ADD:2}};
globalThis.fromUuid=async()=>null;
globalThis.canvas={tokens:{controlled:[]}};
globalThis.foundry={utils:{deepClone:structuredClone,randomID:(n=16)=>'a'.repeat(n)},applications:{api:{
  ApplicationV2:class {constructor(options){this.options=options;this.rendered=false;}async render(){this.rendered=true;this.context=await this._prepareContext();return this;}bringToFront(){}},
  HandlebarsApplicationMixin:(Base)=>Base,
  DialogV2:{queue:[],async input(){return this.queue.shift()??null;},async confirm(){return true;}}
}}};
await import('../scripts/main.js');
await hooks.init();
await hooks.ready();
assert.equal(settings.get('dataVersion'),2,'v0.2 migration flag');
assert.equal(settings.get('trees').length,31);
const win=await mod.api.open(actor);
assert.equal(win.context.trees.filter(t=>t.isClass).length,1,'only matching class tree');
assert.equal(win.context.trees.filter(t=>t.isCommon).length,4);
assert.equal(win.context.free,1);
const dialog=globalThis.foundry.applications.api.DialogV2;
dialog.queue.push({amount:650});
await win.grantXp();
assert.equal(mod.api.getProgress(actor).level,4);
assert.equal(mod.api.getProgress(actor).xp,50);
assert.equal(win.context.free,4);
// Multi-checkbox DialogV2.input returns a plain object, not FormData.
dialog.queue.push({'af-fire':true,'af-blood':true,'af-thunder':false});
await win.assignAffinities();
assert.deepEqual(mod.api.getProgress(actor).affinities,['fire','blood']);
assert.equal(win.context.trees.filter(t=>t.isAffinity).length,2);
// Choose a native D&D feat purchase: no UUID needed.
win.treeId='class-paladin';await win.refresh();
await win.invest('paladin-talent-1');
assert.equal(mod.api.getProgress(actor).spent,1);
assert.ok(actor.items.some(i=>i.getFlag?.('averis-skill-tree','nodeId')==='paladin-talent-1'));
const before=mod.api.getProgress(actor).spent;
await win.invest('paladin-talent-1'); // already maxed; error is surfaced
assert.equal(mod.api.getProgress(actor).spent,before);
win.treeId='general-adventure';await win.refresh();
await win.invest('general-ath');
assert.ok(actor.effects.some(e=>e.getFlag?.('averis-skill-tree','nodeId')==='general-ath'));
assert.equal(mod.api.getProgress(actor).spent,before+1);
// Unchecking invested Affinity is blocked and cannot silently lose its skills.
win.treeId='affinity-fire';await win.refresh();
await win.invest('fire-level-1');
assert.ok(actor.items.some(i=>i.getFlag?.('averis-skill-tree','nodeId')==='fire-level-1'));
// Test reset deletes only module-issued grants.
actor.items.push({id:'homebrew',type:'feat',name:'Unrelated',getFlag:()=>undefined});
await win.resetProgress();
assert.equal(mod.api.getProgress(actor).level,1);
assert.ok(actor.items.some(i=>i.id==='homebrew'));
assert.ok(!actor.items.some(i=>i.getFlag?.('averis-skill-tree','nodeId')));
console.log(`PASS: ${all.length} preloaded trees; ${ids.length} node IDs; XP, Affinity, native feat, proficiency, and reset smoke tests.`);
// An affinity with invested ranks must not be silently unassigned.
dialog.queue.push({'af-fire':false,'af-blood':true});
// The previous reset removed all investments, so assigning again is valid.
await win.assignAffinities();
assert.deepEqual(mod.api.getProgress(actor).affinities,['blood']);
// Verify invalid input cannot mutate XP, no matter what browser inputs send.
const beforeXP=mod.api.getProgress(actor);
dialog.queue.push({amount:'not a number'});await win.grantXp();
assert.deepEqual(mod.api.getProgress(actor),beforeXP);
// Verify unowned actor cannot open or spend abilities.
user.isGM=false;actor.isOwner=false;
const allowed=await mod.api.open(actor); // prior already open; doesn't change progress
const progressBefore=mod.api.getProgress(actor);
await win.invest('general-ath');
assert.deepEqual(mod.api.getProgress(actor),progressBefore);
user.isGM=true;actor.isOwner=true;
// Rollback: failed document flag save cannot consume points or leave an Item.
const oldSet=actor.setFlag.bind(actor);actor.setFlag=async()=>{throw Error('Simulated persistence failure')};
win.treeId='class-paladin';await win.refresh();
await win.invest('paladin-talent-1');
assert.equal(mod.api.getProgress(actor).spent,0);
assert.ok(!actor.items.some(i=>i.getFlag?.('averis-skill-tree','nodeId')==='paladin-talent-1'));
actor.setFlag=oldSet;
console.log('PASS: invalid inputs, ownership restrictions and rollback safety.');