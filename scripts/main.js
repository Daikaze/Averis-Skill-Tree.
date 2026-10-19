import {MODULE_ID as MOD, SKILLS, EFFECT_KEYS, AFFINITIES, CLASS_KEYS, starterTrees, defaultProgress, xpNeeded} from './data.js';

const {ApplicationV2, HandlebarsApplicationMixin, DialogV2}=foundry.applications.api;
const clone=v=>foundry.utils.deepClone(v);
const escapeHtml=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const slug=v=>String(v??'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9-]+/g,'-').replace(/^-+|-+$/g,'');
const number=(v,fallback=0)=>Number.isFinite(Number(v))?Number(v):fallback;
const integer=(v,fallback=0)=>Math.trunc(number(v,fallback));
const alert=(type,message)=>ui.notifications[type](`Averis Skill Tree | ${message}`);
const has=v=>v!==null && v!==undefined;
function trees(){return clone(game.settings.get(MOD,'trees')??[]);}
function getProgress(actor){
  const source=actor.getFlag(MOD,'progress')??{};
  const p={...defaultProgress(),...clone(source)};
  p.level=Math.max(1,Math.min(100,integer(p.level,1)));
  p.xp=Math.max(0,integer(p.xp));
  p.bonusPoints=Math.max(0,integer(p.bonusPoints));
  p.spent=Math.max(0,integer(p.spent));
  p.ranks=typeof p.ranks==='object'&&p.ranks!==null&&!Array.isArray(p.ranks)?{...p.ranks}:{};
  p.affinities=Array.isArray(p.affinities)?[...new Set(p.affinities.map(x=>String(x).toLowerCase()))]:[];
  return p;
}
const freePoints=p=>Math.max(0,p.level+p.bonusPoints-p.spent);
const canEdit=actor=>!!(game.user.isGM||actor.isOwner);
function permittedTrees(actor,p){
  const classes=new Set(actor.items.filter(it=>it.type==='class').map(it=>slug(it.system?.identifier||it.name)));
  const classesMatch=new Set([...classes,...[...classes].map(n=>n.split('-')[0])]);
  return trees().filter(t=>t.scope==='common'||
    (t.scope==='class'&&classesMatch.has(t.key))||
    (t.scope==='affinity'&&p.affinities.includes(t.key))||
    (t.scope==='character'&&t.key===actor.id));
}
const investedAnywhere=id=>game.actors.some(a=>number(a.getFlag(MOD,'progress')?.ranks?.[id])>0);
async function itemSource(uuid){
  if(!uuid||typeof uuid!=='string')return null;
  try {const d=await fromUuid(uuid);return d?.documentName==='Item'&&!d.parent?.documentName?.includes('Actor')?d:null;}
  catch(error){console.warn(`${MOD} | Could not resolve ${uuid}`,error);return null;}
}
function nodeItem(node){
  // A real dnd5e Spell is granted for spell nodes, with an Activity rather than
  // an inert description. Unknown affinity mechanics stay as a Utility Activity.
  const activation=['action','bonus','reaction'].includes(node.activation)?node.activation:'action';
  const isSpell=node.kind==='spell';
  const type=isSpell?'spell':'feat';
  const activityId=foundry.utils.randomID(16);
  const description=`<p>${escapeHtml(node.description??'').replaceAll('\n','<br>')}</p><p><em>Averis Skill Tree · ${escapeHtml(node.kind)} · Skill Lv. ${integer(node.minLevel,1)}+</em></p>`;
  const activity={_id:activityId,type:'utility',name:node.name,activation:{type:activation,value:1}};
  // These offensive class talents have explicit homebrew damage written into
  // the preset. Create a native spell attack activity with that exact formula.
  const text=String(node.description??'');
  const attack=text.match(/(?:make (?:a )?(?:ranged )?spell attack)[^\n]*?for (\d+)d(\d+) (Force|Acid|Necrotic|Radiant|Fire|Cold|Thunder|Psychic|Poison|Lightning) damage/i);
  if(attack&&node.scope!=='affinity'){
    const dice=Number(attack[1]),faces=Number(attack[2]),element=attack[3].toLowerCase();
    if(dice>=1&&dice<=20&&[4,6,8,10,12].includes(faces)){
      activity.type='attack';
      activity.attack={ability:'spellcasting',type:{value:'ranged',classification:'spell'}};
      activity.damage={includeBase:false,parts:[{number:dice,denomination:faces,bonus:'',types:[element]}]};
      const range=text.match(/(?:within|at) (\d+) ft/i);
      if(range)activity.range={value:Number(range[1]),units:'ft',override:true};
    }
  }
  const uses=Math.max(0,integer(node.uses,0));
  if(uses){
    // 5e Activities consume the Item's use pool independently of the item sheet.
    activity.consumption={targets:[{type:'itemUses',value:'1'}]};
  }
  const system={description:{value:description},activities:{[activityId]:activity}};
  if(isSpell){
    // 0-level at-will native spell for custom Affinity skills: resource
    // restriction is the Activity's one-use-per-rest, not a class spell slot.
    system.level=0;
    system.school='evo';
    system.preparation={mode:'atwill',prepared:true};
  }
  if(uses)system.uses={max:String(uses),spent:0,recovery:[{period:node.recovery==='sr'?'sr':'lr',type:'recoverAll'}]};
  return {name:node.name,type,img:node.img||'icons/svg/upgrade.svg',system,
    flags:{[MOD]:{nodeId:node.id,generated:true}}};
}
async function grantNode(actor,node,rank){
  const existingItem=actor.items.find(it=>it.getFlag(MOD,'nodeId')===node.id);
  const existingEffect=actor.effects.find(e=>e.getFlag(MOD,'nodeId')===node.id);
  if(node.grantType==='builtin'||node.grantType==='item'){
    if(existingItem)return {type:'existing'};
    let data;
    if(node.grantType==='builtin')data=nodeItem(node);
    else{
      const source=await itemSource(node.itemUuid);
      if(!source)throw Error('Свързаният D&D Item липсва. Точките не са изхарчени.');
      data=source.toObject();delete data._id;delete data.id;
      data.flags??={};data.flags[MOD]={nodeId:node.id,sourceUuid:source.uuid};
    }
    // Do not grant a class feature that the actor already earned natively.
    if(actor.items.some(i=>i.name===data.name&&!i.getFlag(MOD,'nodeId')))
      throw Error(`Героят вече има ${data.name} от друг източник. Не се удържат точки.`);
    let created;
    try {[created]=await actor.createEmbeddedDocuments('Item',[data]);}
    catch(error){
      // If a system minor revision rejects advanced Activity fields, grant a clean
      // native feat instead of failing or creating broken data silently.
      console.warn(`${MOD} | Activity creation failed, retrying with basic native feat`,error);
      if(node.grantType!=='builtin')throw error;
      data.system={description:data.system.description};
      [created]=await actor.createEmbeddedDocuments('Item',[data]);
      alert('warn',`${node.name}: създаден е като D&D Feature без Activity; провери го в Character Sheet.`);
    }
    if(!created)throw Error('Foundry не потвърди създаването на Item.');
    return {type:'item',id:created.id};
  }
  let key,value,mode;
  if(node.grantType==='skill'){
    if(!Object.hasOwn(SKILLS,node.skill))throw Error('Invalid D&D 5e skill key.');
    key=`system.skills.${node.skill}.value`;value=String(rank>=2?2:1);
    mode=CONST.ACTIVE_EFFECT_MODES.UPGRADE;
  }else if(node.grantType==='effect'){
    if(!Object.hasOwn(EFFECT_KEYS,node.effectKey))throw Error('Invalid dnd5e Active Effect key.');
    if(!Number.isFinite(Number(node.amount))||Math.abs(Number(node.amount))>20)throw Error('Effect bonus must be between -20 and 20.');
    key=node.effectKey;value=String(Number(node.amount)*rank);
    mode=CONST.ACTIVE_EFFECT_MODES.ADD;
  }else throw Error('Unrecognized grant type.');
  const changes=[{key,value,mode,priority:20}];
  if(existingEffect){
    const before={changes:clone(existingEffect.changes),disabled:existingEffect.disabled,name:existingEffect.name};
    await existingEffect.update({name:`Averis: ${node.name}`,disabled:false,changes});
    return {type:'effect-update',id:existingEffect.id,before};
  }
  const [created]=await actor.createEmbeddedDocuments('ActiveEffect',[{
    name:`Averis: ${node.name}`,img:'icons/svg/upgrade.svg',disabled:false,
    changes,flags:{[MOD]:{nodeId:node.id}}
  }]);
  if(!created)throw Error('Foundry did not confirm the Active Effect.');
  return {type:'effect',id:created.id};
}
async function rollbackGrant(actor,receipt){
  try{
    if(receipt?.type==='item')await actor.deleteEmbeddedDocuments('Item',[receipt.id]);
    if(receipt?.type==='effect')await actor.deleteEmbeddedDocuments('ActiveEffect',[receipt.id]);
    if(receipt?.type==='effect-update')await actor.effects.get(receipt.id)?.update(receipt.before);
  }catch(error){console.error(`${MOD} | Undo failed; manual cleanup needed`,error);alert('error','Неуспешен rollback. Провери Items / Effects на героя!');}
}
async function removeGrants(actor){
  const items=actor.items.filter(i=>i.getFlag(MOD,'nodeId')).map(i=>i.id);
  const effects=actor.effects.filter(e=>e.getFlag(MOD,'nodeId')).map(e=>e.id);
  if(items.length)await actor.deleteEmbeddedDocuments('Item',items);
  if(effects.length)await actor.deleteEmbeddedDocuments('ActiveEffect',effects);
}
const dialogField=(label,name,value='',opts={})=>`<label class="averis-field"><span>${escapeHtml(label)}</span><input type="${opts.type??'text'}" name="${escapeHtml(name)}" value="${escapeHtml(value)}" ${has(opts.min)?`min="${opts.min}"`:''} ${has(opts.max)?`max="${opts.max}"`:''} ${opts.required?'required':''}></label>`;
const dialogSelect=(label,name,value,options)=>`<label class="averis-field"><span>${escapeHtml(label)}</span><select name="${escapeHtml(name)}">${options.map(([v,t])=>`<option value="${escapeHtml(v)}" ${v===value?'selected':''}>${escapeHtml(t)}</option>`).join('')}</select></label>`;
// DialogV2.input returns FormDataExtended.object (a plain object), NOT FormData.
const value=(data,name)=>data?.[name]??'';
const fromNumber=(data,name)=>{const n=Number(value(data,name));return Number.isSafeInteger(n)?n:NaN;};

class SkillTreeWindow extends HandlebarsApplicationMixin(ApplicationV2){
 static DEFAULT_OPTIONS={
   id:'averis-skill-tree',classes:['averis-skill-tree'],
   window:{title:'Averis Skill Tree',icon:'fa-solid fa-code-branch',resizable:true},
   position:{width:1100,height:770},
   actions:{
     selectTree:SkillTreeWindow.actionSelectTree,invest:SkillTreeWindow.actionInvest,
     grantXp:SkillTreeWindow.actionGrantXp,grantPoints:SkillTreeWindow.actionGrantPoints,
     affinities:SkillTreeWindow.actionAffinities,addTree:SkillTreeWindow.actionAddTree,
     editTree:SkillTreeWindow.actionEditTree,deleteTree:SkillTreeWindow.actionDeleteTree,
     addNode:SkillTreeWindow.actionAddNode,editNode:SkillTreeWindow.actionEditNode,
     deleteNode:SkillTreeWindow.actionDeleteNode,reset:SkillTreeWindow.actionReset,
     openItem:SkillTreeWindow.actionOpenItem
   }
 };
 static PARTS={main:{template:`modules/${MOD}/templates/main.hbs`}};
 constructor(actor){
   super({id:`averis-skill-tree-${actor.id}`,window:{title:`Averis Skills · ${actor.name}`}});
   this.actor=actor;this.treeId=null;this.busy=false;
 }
 async _prepareContext(){
   const p=getProgress(this.actor),available=permittedTrees(this.actor,p);
   if(!available.some(t=>t.id===this.treeId))this.treeId=available[0]?.id??null;
   const current=available.find(t=>t.id===this.treeId);
   const list=available.map(t=>({...t,selected:t.id===this.treeId,
     isCommon:t.scope==='common',isClass:t.scope==='class',isAffinity:t.scope==='affinity'}));
   const groups=[];
   const maxTier=Math.min(30,Math.max(0,...(current?.nodes??[]).map(n=>integer(n.tier))));
   for(let tier=1;tier<=maxTier;tier++){
     const nodes=(current?.nodes??[]).filter(n=>integer(n.tier)===tier).map(n=>{
       const rank=Math.max(0,integer(p.ranks[n.id]));const maxRank=Math.max(1,integer(n.maxRank,1));
       const minLevel=Math.max(1,integer(n.minLevel,1));const cost=Math.max(1,integer(n.cost,1));
       const missing=(n.requires??[]).filter(id=>!integer(p.ranks[id]));
       const reasons=[];
       if(p.level<minLevel)reasons.push(`Skill Lv. ${minLevel} required`);
       if(missing.length)reasons.push('Requires: '+missing.map(id=>current.nodes.find(a=>a.id===id)?.name??id).join(', '));
       if(n.grantType==='item'&&!n.itemUuid)reasons.push('Item UUID missing');
       if(freePoints(p)<cost)reasons.push(`${cost} point(s) needed`);
       if(!canEdit(this.actor))reasons.push('Not your character');
       const maxed=rank>=maxRank;
       return {...n,rank,maxRank,minLevel,cost,maxed,unlocked:rank>0,
         rankPct:Math.round(rank*100/maxRank),lockReason:reasons.join(' · '),canInvest:!this.busy&&!maxed&&!reasons.length,
         showOpen:(n.grantType==='item'||n.grantType==='builtin')&&rank>0,
         isSpell:n.kind==='spell',isSkill:n.kind==='skill',isAttack:n.kind==='attack',isPassive:n.kind==='passive',
         grantLabel:n.grantType==='skill'?'D&D 5e Proficiency / Expertise':n.grantType==='effect'?'D&D 5e Active Effect':'D&D 5e Item',
         canRemove:game.user.isGM&&n.id.startsWith('node-')&&!investedAnywhere(n.id)
       };
     });
     if(nodes.length)groups.push({tier,nodes});
   }
   return {actor:this.actor,actorImage:this.actor.img,isGM:game.user.isGM,canEdit:canEdit(this.actor),
     progress:p,trees:list,tree:current,groups,free:freePoints(p),needed:xpNeeded(p.level),
     xpPct:Math.min(100,p.xp/xpNeeded(p.level)*100),hasTrees:available.length>0,busy:this.busy,isCustomCurrent:current?.id?.startsWith('custom-')??false};
 }
 refresh(){return this.render();}
 static actionSelectTree(_event,target){this.treeId=target.dataset.tree;return this.refresh();}
 static actionInvest(_event,target){return this.invest(target.dataset.node);}
 static actionGrantXp(){return this.grantXp();}
 static actionGrantPoints(){return this.grantPoints();}
 static actionAffinities(){return this.assignAffinities();}
 static actionAddTree(){return this.editTree(null);}
 static actionEditTree(){return this.editTree(this.treeId);}
 static actionDeleteTree(){return this.deleteTree();}
 static actionAddNode(){return this.editNode(null);}
 static actionEditNode(_e,t){return this.editNode(t.dataset.node);}
 static actionDeleteNode(_e,t){return this.deleteNode(t.dataset.node);}
 static actionReset(){return this.resetProgress();}
 static actionOpenItem(_e,t){return this.openItem(t.dataset.node);}
 async invest(id){
   if(this.busy||!canEdit(this.actor))return;
   this.busy=true;let receipt=null;
   try{
     const p=getProgress(this.actor),tree=permittedTrees(this.actor,p).find(t=>t.id===this.treeId),node=tree?.nodes.find(n=>n.id===id);
     if(!node)throw Error('Тази способност вече не е достъпна.');
     const rank=integer(p.ranks[id]);const cost=integer(node.cost,1);
     if(rank>=integer(node.maxRank,1))throw Error('Максимално ниво на способността.');
     if(p.level<integer(node.minLevel,1))throw Error('Недостатъчно Skill Level.');
     if((node.requires??[]).some(r=>!integer(p.ranks[r])))throw Error('Липсва изисквана способност.');
     if(freePoints(p)<cost)throw Error('Нямаш достатъчно Skill Points.');
     if(node.grantType==='item'&&!node.itemUuid)throw Error('GM трябва да свърже D&D Item.');
     receipt=await grantNode(this.actor,node,rank+1);
     p.ranks[id]=rank+1;p.spent+=cost;
     try{await this.actor.setFlag(MOD,'progress',p);}
     catch(error){await rollbackGrant(this.actor,receipt);throw error;}
     alert('info',`${this.actor.name}: ${node.name} rank ${rank+1} unlocked.`);
   }catch(error){console.error(`${MOD} | Purchase error`,error);alert('error',error.message||String(error));}
   finally{this.busy=false;await this.refresh();}
 }
 async grantXp(){
   if(!game.user.isGM||this.busy)return;
   const fd=await DialogV2.input({window:{title:`Skill XP · ${this.actor.name}`},
     content:`<div class="averis-dialog">${dialogField('XP to add (negative removes unused XP)','amount',100,{type:'number',required:true})}<p class="hint">One Skill Point for every Skill Level. Normal D&D character XP and class level are unchanged.</p></div>`,
     ok:{label:'Apply Skill XP'},rejectClose:false});
   if(!fd)return;
   const amount=fromNumber(fd,'amount');
   if(!Number.isSafeInteger(amount)||Math.abs(amount)>1000000)return alert('warn','Enter an integer between -1,000,000 and 1,000,000.');
   this.busy=true;
   try{
     const p=getProgress(this.actor);
     // Do not reduce already-earned levels: doing so invalidates invested skill points.
     p.xp=Math.max(0,p.xp+amount);
     let gained=0;
     while(p.level<100&&p.xp>=xpNeeded(p.level)){p.xp-=xpNeeded(p.level);p.level++;gained++;}
     if(p.level===100)p.xp=0;
     await this.actor.setFlag(MOD,'progress',p);
     alert('info',`${this.actor.name}: ${amount>=0?'+':''}${amount} Skill XP${gained?` · +${gained} Skill Level` :''}`);
   }catch(e){console.error(`${MOD} | XP`,e);alert('error',e.message||String(e));}
   finally{this.busy=false;await this.refresh();}
 }
 async grantPoints(){
   if(!game.user.isGM||this.busy)return;
   const fd=await DialogV2.input({window:{title:`Bonus Skill Points · ${this.actor.name}`},
     content:`<div class="averis-dialog">${dialogField('Bonus points (+1 to +100)','amount',1,{type:'number',min:1,max:100,required:true})}</div>`,
     ok:{label:'Grant Points'},rejectClose:false});
   if(!fd)return;
   const amount=fromNumber(fd,'amount');if(!Number.isInteger(amount)||amount<1||amount>100)return alert('warn','Choose 1–100 points.');
   try{const p=getProgress(this.actor);p.bonusPoints+=amount;await this.actor.setFlag(MOD,'progress',p);await this.refresh();}
   catch(error){alert('error',error.message||String(error));}
 }
 async assignAffinities(){
   if(!game.user.isGM||this.busy)return;
   const p=getProgress(this.actor);
   const fields=AFFINITIES.map(a=>{
     const key=a.toLowerCase();return `<label><input type="checkbox" name="af-${key}" value="true" ${p.affinities.includes(key)?'checked':''}><span>${escapeHtml(a)}</span></label>`;
   }).join('');
   const fd=await DialogV2.input({window:{title:`Assign Affinities · ${this.actor.name}`},
     content:`<div class="averis-dialog"><p class="hint">Choose unlocked elements. Uncheck all for No Mana. Already purchased abilities remain on the Actor, so removing an invested Affinity is blocked.</p><div class="averis-check-grid">${fields}</div></div>`,
     ok:{label:'Save Affinities'},rejectClose:false});
   if(!fd)return;
   const selected=AFFINITIES.map(a=>a.toLowerCase()).filter(k=>['true',true,'on','1',1].includes(value(fd,`af-${k}`)));
   const removed=p.affinities.filter(a=>!selected.includes(a));
   const all=trees();const occupied=removed.filter(key=>all.some(t=>t.scope==='affinity'&&t.key===key&&t.nodes.some(n=>integer(p.ranks[n.id])>0)));
   if(occupied.length)return alert('warn',`Не можеш да махнеш изучен Affinity (${occupied.join(', ')}). Първо reset на героя.`);
   try{p.affinities=selected;await this.actor.setFlag(MOD,'progress',p);this.treeId=null;await this.refresh();alert('info',`Affinities saved for ${this.actor.name}.`);}
   catch(error){console.error(`${MOD} | Assign affinity`,error);alert('error',error.message||String(error));}
 }
 async editTree(id){
   if(!game.user.isGM)return;
   const list=trees(),existing=list.find(t=>t.id===id);
   const fd=await DialogV2.input({window:{title:existing?'Edit Skill Tree':'New Skill Tree'},
     content:`<div class="averis-dialog">${dialogField('Tree name','name',existing?.name??'New Tree',{required:true})}
     ${dialogSelect('Tree scope','scope',existing?.scope??'common', [['common','General'],['class','Class'],['affinity','Affinity'],['character','Character']])}
     ${dialogField('Class/Affinity key (e.g. paladin, fire)','key',existing?.key??'')}
     <p class="hint">Built-in General/Class/Affinity trees are preloaded. You only need this for custom content.</p></div>`,
     ok:{label:'Save'},rejectClose:false});
   if(!fd)return;
   const name=String(value(fd,'name')).trim().slice(0,90),scope=String(value(fd,'scope'));
   const key=scope==='character'?this.actor.id:scope==='common'?'':slug(value(fd,'key'));
   if(!name||!['common','class','affinity','character'].includes(scope)||(!key&&scope!=='common'))return alert('warn','Invalid tree name/scope/key.');
   if(existing){if(existing.nodes.some(n=>investedAnywhere(n.id))&&(scope!==existing.scope||key!==existing.key))return alert('warn','Cannot change scope of invested tree.');Object.assign(existing,{name,scope,key});}
   else{const id=`custom-${foundry.utils.randomID(12)}`;list.push({id,name,scope,key,icon:'fa-solid fa-code-branch',nodes:[]});this.treeId=id;}
   try{await game.settings.set(MOD,'trees',list);await this.refresh();}catch(e){alert('error',e.message||String(e));}
 }
 async deleteTree(){
   if(!game.user.isGM)return;
   const list=trees(),current=list.find(t=>t.id===this.treeId);if(!current)return;
   if(!current.id.startsWith('custom-'))return alert('warn','System trees cannot be deleted; you can edit or create custom trees.');
   if(current.nodes.some(n=>investedAnywhere(n.id)))return alert('warn','Tree has invested abilities. Reset affected characters first.');
   if(!await DialogV2.confirm({window:{title:'Delete Custom Tree'},content:`Delete <b>${escapeHtml(current.name)}</b>?`,rejectClose:false}))return;
   try{await game.settings.set(MOD,'trees',list.filter(t=>t.id!==current.id));this.treeId=null;await this.refresh();}
   catch(e){alert('error',e.message||String(e));}
 }
 async editNode(nodeId){
   if(!game.user.isGM)return;
   const list=trees(),tree=list.find(t=>t.id===this.treeId);if(!tree)return;
   const n=tree.nodes.find(n=>n.id===nodeId);
   if(n&&investedAnywhere(n.id))return alert('warn','This ability is already invested. Reset affected characters before editing.');
   const fd=await DialogV2.input({window:{title:n?'Edit Ability':'New Ability'},
     content:`<div class="averis-dialog">
     ${dialogField('Name','name',n?.name??'New Ability',{required:true})}
     ${dialogSelect('D&D Type','kind',n?.kind??'feature',[['skill','D&D Skill'],['attack','Attack'],['spell','Spell'],['feature','Feature'],['passive','Passive']])}
     ${dialogSelect('Grant automatically as','grantType',n?.grantType??'builtin',[['builtin','Built-in D&D 5e Feature (no UUID)'],['skill','Proficiency / Expertise'],['effect','Active Effect bonus'],['item','Linked World/Compendium Item']])}
     <div class="averis-pair">${dialogField('Tier','tier',n?.tier??1,{type:'number',min:1,max:20})}${dialogField('Min Skill Level','minLevel',n?.minLevel??1,{type:'number',min:1,max:100})}</div>
     <div class="averis-pair">${dialogField('Max Ranks','maxRank',n?.maxRank??1,{type:'number',min:1,max:10})}${dialogField('Cost per Rank','cost',n?.cost??1,{type:'number',min:1,max:10})}</div>
     ${dialogField('Prerequisite IDs (comma-separated)','requires',(n?.requires??[]).join(', '))}
     ${dialogSelect('Skill','skill',n?.skill??'arc',Object.entries(SKILLS))}
     ${dialogSelect('Effect Target','effectKey',n?.effectKey??'system.attributes.init.roll.bonus',Object.entries(EFFECT_KEYS))}
     ${dialogField('Bonus per rank','amount',n?.amount??1,{type:'number',min:-20,max:20})}
     ${dialogSelect('Activation','activation',n?.activation??'action',[['action','Action'],['bonus','Bonus Action'],['reaction','Reaction']])}
     ${dialogField('Item UUID (linked only)','itemUuid',n?.itemUuid??'')}
     <label class="averis-field">Description<textarea rows="5" name="description">${escapeHtml(n?.description??'')}</textarea></label></div>`,
     ok:{label:'Save Ability'},rejectClose:false});
   if(!fd)return;
   const name=String(value(fd,'name')).trim().slice(0,100),kind=String(value(fd,'kind'));
   const grantType=String(value(fd,'grantType'));
   if(!name||!['skill','attack','spell','feature','passive'].includes(kind)||!['builtin','skill','effect','item'].includes(grantType))return alert('warn','Invalid name or type.');
   const requires=String(value(fd,'requires')).split(',').map(x=>x.trim()).filter(Boolean);
   if(!requires.every(id=>id!==nodeId&&tree.nodes.some(t=>t.id===id)))return alert('warn','Invalid prerequisite IDs.');
   const itemUuid=String(value(fd,'itemUuid')).trim();
   if(grantType==='item'&&!await itemSource(itemUuid))return alert('warn','Enter a valid world/compendium D&D Item UUID.');
   const maxRank=['builtin','item'].includes(grantType)?1:Math.min(10,Math.max(1,fromNumber(fd,'maxRank')||1));
   const minLevel=fromNumber(fd,'minLevel'),tier=fromNumber(fd,'tier'),cost=fromNumber(fd,'cost');
   if(![minLevel,tier,cost].every(Number.isSafeInteger)||minLevel<1||tier<1||cost<1||tier>20||minLevel>100||cost>10)return alert('warn','Invalid level, tier or cost.');
   const changes={name,kind,grantType,requires,itemUuid,maxRank,minLevel,tier,cost,
     skill:String(value(fd,'skill')),effectKey:String(value(fd,'effectKey')),amount:number(value(fd,'amount'),1),
     activation:String(value(fd,'activation')),description:String(value(fd,'description')).slice(0,2000)};
   if(n)Object.assign(n,changes);else tree.nodes.push({id:`node-${foundry.utils.randomID(14)}`,...changes});
   try{await game.settings.set(MOD,'trees',list);await this.refresh();}catch(e){alert('error',e.message||String(e));}
 }
 async deleteNode(id){
   if(!game.user.isGM)return;
   const list=trees(),tree=list.find(t=>t.id===this.treeId),node=tree?.nodes.find(n=>n.id===id);
   if(!node)return;
   if(!id.startsWith('node-'))return alert('warn','Built-in abilities are protected; you can edit but not delete them.');
   if(investedAnywhere(id))return alert('warn','An actor has unlocked this ability.');
   if(tree.nodes.some(n=>n.requires?.includes(id)))return alert('warn','Other abilities depend on this one.');
   if(!await DialogV2.confirm({window:{title:'Delete Ability'},content:`Delete <b>${escapeHtml(node.name)}</b>?`,rejectClose:false}))return;
   tree.nodes=tree.nodes.filter(n=>n.id!==id);
   try{await game.settings.set(MOD,'trees',list);await this.refresh();}catch(e){alert('error',e.message||String(e));}
 }
 openItem(id){
   const item=this.actor.items.find(it=>it.getFlag(MOD,'nodeId')===id);
   if(item)return item.sheet.render(true);
   alert('warn','The unlocked D&D Item is missing from your Character Sheet.');
 }
 async resetProgress(){
   if(!game.user.isGM||this.busy)return;
   if(!await DialogV2.confirm({window:{title:'Reset Averis Skills'},
     content:`Reset <b>${escapeHtml(this.actor.name)}</b> to Skill Level 1, lose earned XP and only remove items/effects that the module itself granted? This is irreversible.`,rejectClose:false}))return;
   this.busy=true;
   try{await removeGrants(this.actor);await this.actor.setFlag(MOD,'progress',defaultProgress());this.treeId=null;alert('info','Character skill progression reset.');}
   catch(e){console.error(`${MOD} | reset`,e);alert('error',`Reset incomplete: ${e.message||e}`);}
   finally{this.busy=false;await this.refresh();}
 }
}

const windows=new Map();
async function openTree(actor){
 if(!actor)return alert('warn','Select a character token, or open a character sheet first.');
 if(actor.type!=='character')return alert('warn','Only D&D 5e characters are supported.');
 if(!canEdit(actor))return alert('warn','No permission to edit this character.');
 const old=windows.get(actor.uuid);if(old?.rendered){old.bringToFront();return old;}
 const app=new SkillTreeWindow(actor);windows.set(actor.uuid,app);await app.render(true);return app;
}
function addSheetButton(app,element){
 const actor=app.actor??app.document;
 if(!actor||actor.documentName!=='Actor'||actor.type!=='character'||!canEdit(actor))return;
 if(!(element instanceof HTMLElement)||element.querySelector('.averis-open-tree'))return;
 const btn=document.createElement('button');btn.type='button';btn.className='averis-open-tree';
 btn.innerHTML='<i class="fa-solid fa-code-branch"></i> Skill Tree';btn.title='Open Averis Skill Tree';
 btn.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();void openTree(actor);});
 const dest=element.querySelector('.sheet-header,.character-header,.header-details,.sheet-heading,.window-content')??element;
 dest.prepend(btn);
}
function mergeWorldTrees(previous){
 const newTrees=starterTrees();const current=new Map((previous??[]).map(t=>[t.id,t]));
 const defaults=newTrees.map(t=>{
   const old=current.get(t.id);if(!old)return t;
   // Keep user-created abilities and explicit GM item links, but remove unlinked
   // v0.1 autogenerated placeholders (they could not be bought anyway).
   const extra=(old.nodes??[]).filter(n=>{
     const isFromOld=n.id.startsWith('explore-')||n.id.startsWith('martial-')||n.id.startsWith('magic-')||
       CLASS_KEYS.some(c=>n.id===`${c}-training`||n.id===`${c}-technique`||n.id===`${c}-mastery`)
       ||AFFINITIES.some(a=>n.id===`${a.toLowerCase()}-level-${n.tier}`);
     return !isFromOld||!!n.itemUuid||investedAnywhere(n.id);
   });
   const existingIds=new Set(t.nodes.map(n=>n.id));
   return {...t,nodes:[...t.nodes,...extra.filter(n=>!existingIds.has(n.id))]};
 });
 const legacy=new Set(['common-exploration','common-martial','common-magic']);
 return [...defaults,...(previous??[]).filter(t=>{
   if(newTrees.some(n=>n.id===t.id))return false;
   if(!legacy.has(t.id))return true;
   return (t.nodes??[]).some(n=>investedAnywhere(n.id)||n.id.startsWith('node-')||!!n.itemUuid);
 })];
}
Hooks.once('init',()=>{
 game.settings.register(MOD,'trees',{name:'Averis tree definitions',scope:'world',config:false,type:Array,default:starterTrees()});
 game.settings.register(MOD,'dataVersion',{name:'Averis data version',scope:'world',config:false,type:Number,default:0});
 game.settings.register(MOD,'showSheetButton',{name:'Show Skill Tree button in Character Sheet',scope:'world',config:true,type:Boolean,default:true});
 game.modules.get(MOD).api={open:openTree,openSelected:()=>openTree(canvas.tokens?.controlled?.[0]?.actor??game.user.character),getProgress,trees, xpNeeded};
});
Hooks.once('ready',async()=>{
 if(game.system.id!=='dnd5e'){alert('warn','Averis Skill Tree requires the D&D 5e game system.');return;}
 if(game.user.isGM&&game.settings.get(MOD,'dataVersion')<2){
   try{
     const old=trees();const fresh=mergeWorldTrees(old);
     await game.settings.set(MOD,'trees',fresh);
     await game.settings.set(MOD,'dataVersion',2);
     console.info(`${MOD} | upgraded world trees to v0.2.0 (${fresh.length} trees)`);
   }catch(error){console.error(`${MOD} | migration`,error);alert('error','Skill Tree migration failed. Make a world backup and inspect the console.');}
 }
 Hooks.on('renderApplicationV2',(app,el)=>{
   if(game.settings.get(MOD,'showSheetButton'))addSheetButton(app,el);
 });
 Hooks.on('renderActorSheet',(app,html)=>{
   if(!game.settings.get(MOD,'showSheetButton'))return;
   const el=html instanceof HTMLElement?html:html?.[0];if(el)addSheetButton(app,el);
 });
 console.info(`${MOD} | v0.2.0 for Foundry V14 + dnd5e 5.3.3 ready`);
});