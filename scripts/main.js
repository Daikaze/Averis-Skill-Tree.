import { MODULE_ID as MOD, SKILLS, EFFECT_KEYS, AFFINITIES, starterTrees, defaultProgress, xpNeeded } from "./data.js";

const { ApplicationV2, HandlebarsApplicationMixin, DialogV2 } = foundry.applications.api;
const copy = value => foundry.utils.deepClone(value);
const esc = value => String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[ch]));
const slug = value => String(value ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9-]+/g,"-").replace(/^-+|-+$/g,"");
const num = (value, fallback=0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const notify = (level, msg) => ui.notifications[level](`Averis Skill Tree | ${msg}`);

function getTrees() {return copy(game.settings.get(MOD, "trees") || []);}
function getProgress(actor) {
  const raw=actor.getFlag(MOD,"progress") || {};
  return {...defaultProgress(),...copy(raw),ranks:{...(raw.ranks||{})},affinities:[...(raw.affinities||[])]};
}
function freePoints(progress) {return Math.max(0,progress.level+progress.bonusPoints-progress.spent);}
function allowedTrees(actor, progress) {
  const classes=new Set(actor.items.filter(it=>it.type==="class").map(it=>slug(it.name)));
  const classesWithAliases=new Set([...classes,...[...classes].map(c=>c.split("-")[0])]);
  const affinities=new Set(progress.affinities);
  return getTrees().filter(t=>t.scope==="common" ||
    (t.scope==="class" && classesWithAliases.has(t.key)) ||
    (t.scope==="affinity" && affinities.has(t.key)) ||
    (t.scope==="character" && t.key===actor.id));
}
function investedAnywhere(nodeId){
  return game.actors.some(actor=>num(actor.getFlag(MOD,"progress")?.ranks?.[nodeId])>0);
}
const canEdit = actor => game.user.isGM || actor.isOwner;
const sourceItemFor = async uuid => {
  if (!uuid) return null;
  const doc=await fromUuid(uuid);
  return doc?.documentName==="Item" ? doc : null;
};

async function grantNode(actor,node,rank){
  // Only validate and mutate system-recognized D&D 5e paths.
  if (node.grantType==="item") {
    const source=await sourceItemFor(node.itemUuid);
    if(!source) throw new Error("Item UUID is missing or does not point to a D&D 5e Item.");
    if(source.parent?.documentName==="Actor") throw new Error("Link a World Item or Compendium Item, not an embedded Actor Item.");
    const existing=actor.items.find(it=>it.getFlag(MOD,"nodeId")===node.id);
    if(existing) return;
    const data=source.toObject();
    delete data._id; delete data.id;
    data.flags ??= {};
    data.flags[MOD]={nodeId:node.id,sourceUuid:source.uuid};
    data.name=source.name;
    await actor.createEmbeddedDocuments("Item",[data]);
  } else {
    let key,value,mode;
    if(node.grantType==="skill") {
      if(!Object.hasOwn(SKILLS,node.skill)) throw new Error("Unknown D&D skill.");
      key=`system.skills.${node.skill}.value`;
      value=String(rank>=2?2:1);
      mode=CONST.ACTIVE_EFFECT_MODES.UPGRADE;
    } else if(node.grantType==="effect") {
      if(!Object.hasOwn(EFFECT_KEYS,node.effectKey)) throw new Error("Unsupported Active Effect path.");
      if(!Number.isFinite(Number(node.amount)) || Math.abs(Number(node.amount))>100) throw new Error("Invalid modifier amount.");
      key=node.effectKey;
      value=String(num(node.amount,1)*rank);
      mode=CONST.ACTIVE_EFFECT_MODES.ADD;
    } else throw new Error("Unknown grant type.");
    const changes=[{key,value,mode,priority:20}];
    const existing=actor.effects.find(e=>e.getFlag(MOD,"nodeId")===node.id);
    if(existing) await existing.update({name:`Skill Tree: ${node.name}`,changes,disabled:false});
    else await actor.createEmbeddedDocuments("ActiveEffect",[{
      name:`Skill Tree: ${node.name}`,img:"icons/svg/upgrade.svg",disabled:false,
      changes,flags:{[MOD]:{nodeId:node.id}}
    }]);
  }
}

async function removeAllGrants(actor){
  const items=actor.items.filter(it=>it.getFlag(MOD,"nodeId")).map(it=>it.id);
  const effects=actor.effects.filter(e=>e.getFlag(MOD,"nodeId")).map(e=>e.id);
  if(items.length) await actor.deleteEmbeddedDocuments("Item",items);
  if(effects.length) await actor.deleteEmbeddedDocuments("ActiveEffect",effects);
}

function dialogField(label,name,value="",opts={}){
  const attrs=`${opts.type?`type="${opts.type}"`:"type=\"text\""} name="${esc(name)}" value="${esc(value)}" ${opts.min!==undefined?`min="${opts.min}"`:""} ${opts.max!==undefined?`max="${opts.max}"`:""} ${opts.step!==undefined?`step="${opts.step}"`:""} ${opts.required?"required":""}`;
  return `<label class="averis-field"><span>${esc(label)}</span><input ${attrs}></label>`;
}
function dialogSelect(label,name,selected,options){
  return `<label class="averis-field"><span>${esc(label)}</span><select name="${esc(name)}">${options.map(([value,text])=>`<option value="${esc(value)}" ${selected===value?"selected":""}>${esc(text)}</option>`).join("")}</select></label>`;
}
const fromDialog = (form,name) => form?.get?.(name) ?? form?.object?.[name] ?? "";

class SkillTreeApplication extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS={
    id:"averis-skill-tree",classes:["averis-skill-tree"],
    window:{title:"Averis Skill Tree",icon:"fa-solid fa-code-branch",resizable:true},
    position:{width:1030,height:730},
    actions:{
      selectTree:SkillTreeApplication.actionSelectTree,
      invest:SkillTreeApplication.actionInvest,
      grantXp:SkillTreeApplication.actionGrantXP,
      grantPoints:SkillTreeApplication.actionGrantPoints,
      affinities:SkillTreeApplication.actionAffinities,
      addTree:SkillTreeApplication.actionAddTree,
      editTree:SkillTreeApplication.actionEditTree,
      deleteTree:SkillTreeApplication.actionDeleteTree,
      addNode:SkillTreeApplication.actionAddNode,
      editNode:SkillTreeApplication.actionEditNode,
      deleteNode:SkillTreeApplication.actionDeleteNode,
      reset:SkillTreeApplication.actionReset,
      openItem:SkillTreeApplication.actionOpenItem
    }
  };
  static PARTS={main:{template:`modules/${MOD}/templates/main.hbs`}};

  constructor(actor){
    super({id:`averis-skill-tree-${actor.id}`,window:{title:`Skill Tree · ${actor.name}`}});
    this.actor=actor;
    this.treeId=null;
    this.busy=false;
  }

  async _prepareContext(options){
    const progress=getProgress(this.actor);
    const available=allowedTrees(this.actor,progress);
    const trees=available.map(t=>({
      ...t,selected:t.id===(this.treeId||available[0]?.id),
      isCommon:t.scope==="common",isClass:t.scope==="class",isAffinity:t.scope==="affinity",
    }));
    if(!trees.some(t=>t.selected) && trees.length){this.treeId=trees[0].id;trees[0].selected=true;}
    if(!this.treeId && available.length)this.treeId=available[0].id;
    const current=available.find(t=>t.id===(this.treeId||available[0]?.id));
    const groups=[];
    const maxTier=Math.max(0,...(current?.nodes||[]).map(n=>num(n.tier)));
    for(let tier=1;tier<=maxTier;tier++) {
      const nodes=(current?.nodes||[]).filter(n=>num(n.tier)===tier).map(n=>{
        const rank=num(progress.ranks[n.id]);
        const minLevel=num(n.minLevel,1);
        const missing=(n.requires||[]).filter(id=>!num(progress.ranks[id]));
        const itemMissing=n.grantType==="item"&&!n.itemUuid;
        const maxRank=Math.max(1,num(n.maxRank,1));
        const cost=Math.max(1,num(n.cost,1));
        const reasons=[];
        if(minLevel>progress.level) reasons.push(`Skill Lv. ${minLevel} required`);
        if(missing.length) reasons.push("Requires: "+missing.map(id=>current.nodes.find(p=>p.id===id)?.name||id).join(", "));
        if(itemMissing) reasons.push("GM must link a D&D Item");
        if(!canEdit(this.actor)) reasons.push("Not an owner of this Actor");
        if(freePoints(progress)<cost) reasons.push(`Need ${cost} point(s)`);
        const maxed=rank>=maxRank;
        return {...n,rank,maxRank,cost,rankPct:Math.round(100*rank/maxRank),maxed,unlocked:rank>0,canInvest:!this.busy&&!maxed&&!reasons.length,
          lockReason:reasons.join(" · "), itemMissing,showOpen:n.grantType==="item"&&rank>0,
          isSkill:n.kind==="skill",isSpell:n.kind==="spell",isAttack:n.kind==="attack",
          isFeature:n.kind==="feature",isPassive:n.kind==="passive",grantLabel:n.grantType==="skill"?`${SKILLS[n.skill]||n.skill}: Proficiency / Expertise`:n.grantType==="item"?"Real D&D 5e Item":"D&D 5e Active Effect"
        };
      });
      if(nodes.length) groups.push({tier,nodes});
    }
    return {
      actor:this.actor,actorImage:this.actor.img,player:game.user.isGM?"GM":"Player",
      isGM:game.user.isGM,canEdit:canEdit(this.actor),progress,trees,
      tree:current,groups,free:freePoints(progress),needed:xpNeeded(progress.level),
      xpPct:Math.max(0,Math.min(100,(progress.xp/xpNeeded(progress.level))*100)),
      allTreesCount:getTrees().length,hasTrees:!!available.length
    };
  }

  async refresh(){return this.render();}
  static actionSelectTree(_event,target){this.treeId=target.dataset.tree;return this.refresh();}
  static actionInvest(_event,target){return this.invest(target.dataset.node);}
  static actionGrantXP(){return this.grantXP();}
  static actionGrantPoints(){return this.grantPoints();}
  static actionAffinities(){return this.setAffinities();}
  static actionAddTree(){return this.editTree(null);}
  static actionEditTree(){return this.editTree(this.treeId);}
  static actionDeleteTree(){return this.deleteTree();}
  static actionAddNode(){return this.editNode(null);}
  static actionEditNode(_event,target){return this.editNode(target.dataset.node);}
  static actionDeleteNode(_event,target){return this.deleteNode(target.dataset.node);}
  static actionReset(){return this.resetProgress();}
  static actionOpenItem(_event,target){return this.openItem(target.dataset.node);}

  async invest(nodeId){
    if(this.busy||!canEdit(this.actor))return;
    this.busy=true;
    try {
      const progress=getProgress(this.actor);
      const tree=allowedTrees(this.actor,progress).find(t=>t.id===this.treeId);
      const node=tree?.nodes.find(n=>n.id===nodeId);
      if(!node)throw new Error("The skill is no longer available.");
      const rank=num(progress.ranks[node.id]);
      const cost=Math.max(1,num(node.cost,1));
      if(rank>=Math.max(1,num(node.maxRank,1)))throw new Error("This skill is already maxed out.");
      if(progress.level<num(node.minLevel,1))throw new Error("Skill level is too low.");
      if((node.requires||[]).some(id=>!num(progress.ranks[id])))throw new Error("Prerequisite skills are missing.");
      if(freePoints(progress)<cost)throw new Error("Not enough Skill Points.");
      if(node.grantType==="item"&&!node.itemUuid)throw new Error("GM must link an Item first.");
      // Validate source first, so a broken UUID never costs points.
      if(node.grantType==="item" && !await sourceItemFor(node.itemUuid))throw new Error("Linked Item UUID cannot be resolved.");
      await grantNode(this.actor,node,rank+1);
      progress.ranks[node.id]=rank+1;
      progress.spent+=cost;
      await this.actor.setFlag(MOD,"progress",progress);
      notify("info",`${this.actor.name} unlocked ${node.name} (${rank+1}).`);
    } catch(err){console.error(`${MOD} | purchase`,err);notify("error",err.message);}
    finally {this.busy=false;await this.refresh();}
  }

  async grantXP(){
    if(!game.user.isGM)return;
    const fd=await DialogV2.input({window:{title:`Grant Skill XP · ${this.actor.name}`},
      content:`<div class="averis-dialog">${dialogField("XP to add (can be negative)","amount",100,{type:"number",step:1,required:true})}</div>`,
      ok:{label:"Apply XP"},rejectClose:false});
    if(!fd)return;
    let gained=Math.trunc(num(fromDialog(fd,"amount")));
    if(!Number.isSafeInteger(gained)||Math.abs(gained)>1000000)return notify("warn","Choose an amount under 1,000,000.");
    const p=getProgress(this.actor);
    p.xp=Math.max(0,p.xp+gained);
    let advances=0;
    while(p.xp>=xpNeeded(p.level) && p.level<100 && advances<100){
      p.xp-=xpNeeded(p.level);p.level++;advances++;
    }
    await this.actor.setFlag(MOD,"progress",p);
    notify("info",`${this.actor.name}: +${gained} Skill XP${advances?`, +${advances} Skill Level(s)` :""}.`);
    return this.refresh();
  }
  async grantPoints(){
    if(!game.user.isGM)return;
    const fd=await DialogV2.input({window:{title:`Bonus Skill Points · ${this.actor.name}`},
      content:`<div class="averis-dialog">${dialogField("Bonus points to add", "amount",1,{type:"number",min:1,max:100,required:true})}</div>`,
      ok:{label:"Grant Points"},rejectClose:false});
    if(!fd)return;
    const amount=Math.trunc(num(fromDialog(fd,"amount")));
    if(amount<1||amount>100)return notify("warn","Choose 1–100 points.");
    const p=getProgress(this.actor);p.bonusPoints+=amount;
    await this.actor.setFlag(MOD,"progress",p);return this.refresh();
  }
  async setAffinities(){
    if(!game.user.isGM)return;
    const p=getProgress(this.actor);
    const fd=await DialogV2.input({window:{title:`Affinities · ${this.actor.name}`},
      content:`<div class="averis-dialog averis-check-grid">${AFFINITIES.map(a=>`<label><input type="checkbox" name="affinity" value="${esc(a.toLowerCase())}" ${p.affinities.includes(a.toLowerCase())?"checked":""}> ${esc(a)}</label>`).join("")}</div>`,
      ok:{label:"Save Affinities"},rejectClose:false});
    if(!fd)return;
    p.affinities=fd.getAll("affinity").filter(a=>AFFINITIES.map(x=>x.toLowerCase()).includes(a));
    await this.actor.setFlag(MOD,"progress",p);
    this.treeId=null;return this.refresh();
  }

  async editTree(id){
    if(!game.user.isGM)return;
    const trees=getTrees();const existing=trees.find(t=>t.id===id);
    const body=`<div class="averis-dialog">
      ${dialogField("Tree name","name",existing?.name||"New Tree",{required:true})}
      ${dialogSelect("Scope","scope",existing?.scope||"common",[["common","General: all characters"],["class","Class-specific"],["affinity","Affinity-specific"],["character","This character only"]])}
      ${dialogField("Class / Affinity key (e.g. paladin / fire)","key",existing?.key||"",{})}
      <p class="hint">For a character-only tree the current Actor ID is used automatically. Existing tree IDs remain stable.</p>
    </div>`;
    const fd=await DialogV2.input({window:{title:existing?"Edit Skill Tree":"Create Skill Tree"},content:body,ok:{label:"Save Tree"},rejectClose:false});
    if(!fd)return;
    const name=String(fromDialog(fd,"name")).trim().slice(0,80);
    const scope=String(fromDialog(fd,"scope"));
    const key=scope==="character"?this.actor.id:scope==="common"?"":slug(fromDialog(fd,"key"));
    if(!name||!["common","class","affinity","character"].includes(scope))return notify("warn","Name and valid scope required.");
    if(!key&&scope!=="common")return notify("warn","Enter a class/affinity key.");
    if(existing){Object.assign(existing,{name,scope,key});}
    else {
      const newId=`custom-${slug(name)}-${foundry.utils.randomID(6).toLowerCase()}`;
      trees.push({id:newId,name,scope,key,icon:"fa-solid fa-code-branch",nodes:[]});
      this.treeId=newId;
    }
    await game.settings.set(MOD,"trees",trees);return this.refresh();
  }

  async deleteTree(){
    if(!game.user.isGM)return;
    const trees=getTrees(),current=trees.find(t=>t.id===this.treeId);
    if(!current)return;
    if(current.nodes.some(n=>investedAnywhere(n.id)))return notify("warn","Tree has invested skills. Reset affected characters first.");
    if(!await DialogV2.confirm({window:{title:"Delete Tree"},content:`Delete ${esc(current.name)}?`,rejectClose:false}))return;
    await game.settings.set(MOD,"trees",trees.filter(t=>t.id!==current.id));
    this.treeId=null;return this.refresh();
  }

  async editNode(nodeId){
    if(!game.user.isGM)return;
    const trees=getTrees();const tree=trees.find(t=>t.id===this.treeId);if(!tree)return;
    const node=tree.nodes.find(n=>n.id===nodeId);
    if(node && investedAnywhere(node.id))return notify("warn","This node is in use. Reset invested characters before editing it.");
    const b=`<div class="averis-dialog">
      ${dialogField("Skill / attack / spell name","name",node?.name||"New Ability",{required:true})}
      ${dialogSelect("D&D category","kind",node?.kind||"feature",[["skill","Skill Check"],["attack","Attack"],["spell","Spell"],["feature","Class/Other Feature"],["passive","Passive Bonus"]])}
      ${dialogSelect("Grant method","grantType",node?.grantType||"item",[["item","Link an existing D&D 5e Item"],["skill","Proficiency / Expertise"],["effect","D&D 5e Active Effect"]])}
      <div class="averis-pair">${dialogField("Tier","tier",node?.tier||1,{type:"number",min:1,max:20})}${dialogField("Min Skill Level","minLevel",node?.minLevel||1,{type:"number",min:1,max:100})}</div>
      <div class="averis-pair">${dialogField("Max Ranks (item = 1)","maxRank",node?.maxRank||1,{type:"number",min:1,max:10})}${dialogField("Cost per rank","cost",node?.cost||1,{type:"number",min:1,max:10})}</div>
      ${dialogField("Required node IDs, comma-separated","requires",(node?.requires||[]).join(", "))}
      ${dialogSelect("Skill (if proficiency/expertise)","skill",node?.skill||"arc",Object.entries(SKILLS))}
      ${dialogSelect("Effect target (if passive bonus)","effectKey",node?.effectKey||"system.attributes.init.roll.bonus",Object.entries(EFFECT_KEYS))}
      ${dialogField("Bonus per rank (if passive)","amount",node?.amount??1,{type:"number",min:-100,max:100,step:0.5})}
      ${dialogField("World / Compendium Item UUID (if linked Item)","itemUuid",node?.itemUuid||"")}
      <label class="averis-field"><span>Description (D&D action type, damage dice, range, save, duration)</span><textarea name="description" rows="3">${esc(node?.description||"")}</textarea></label>
      <p class="hint">For attacks/spells, configure the real Item Activities in dnd5e first; the tree will clone that Item when unlocked.</p>
    </div>`;
    const fd=await DialogV2.input({window:{title:node?"Edit D&D Skill":"Add D&D Skill"},content:b,ok:{label:"Save Skill"},rejectClose:false});
    if(!fd)return;
    const name=String(fromDialog(fd,"name")).trim().slice(0,100);
    const kind=String(fromDialog(fd,"kind"));
    const grantType=String(fromDialog(fd,"grantType"));
    const maxRank=grantType==="item"?1:Math.min(10,Math.max(1,Math.trunc(num(fromDialog(fd,"maxRank"),1))));
    const itemUuid=String(fromDialog(fd,"itemUuid")).trim().slice(0,400);
    const reqs=String(fromDialog(fd,"requires")).split(",").map(x=>x.trim()).filter(Boolean);
    const validReq=reqs.every(id=>id!==nodeId && tree.nodes.some(n=>n.id===id));
    if(!name||!validReq)return notify("warn","Name or prerequisite node IDs are invalid.");
    if(!["skill","attack","spell","feature","passive"].includes(kind)||!["skill","item","effect"].includes(grantType))return notify("warn","Invalid type.");
    if(grantType==="item"&&itemUuid&&!(await sourceItemFor(itemUuid)))return notify("warn","Link a valid World/Compendium Item UUID.");
    const values={name,kind,grantType,tier:Math.max(1,Math.min(20,Math.trunc(num(fromDialog(fd,"tier"),1)))),
      minLevel:Math.max(1,Math.min(100,Math.trunc(num(fromDialog(fd,"minLevel"),1)))),
      cost:Math.max(1,Math.min(10,Math.trunc(num(fromDialog(fd,"cost"),1)))),maxRank,
      skill:String(fromDialog(fd,"skill")),effectKey:String(fromDialog(fd,"effectKey")),
      amount:num(fromDialog(fd,"amount"),1),itemUuid,requires:reqs,
      description:String(fromDialog(fd,"description")).trim().slice(0,1500)};
    if(node){Object.assign(node,values);}
    else tree.nodes.push({id:`node-${foundry.utils.randomID(12).toLowerCase()}`,...values});
    await game.settings.set(MOD,"trees",trees);return this.refresh();
  }

  async deleteNode(nodeId){
    if(!game.user.isGM)return;
    const trees=getTrees();const tree=trees.find(t=>t.id===this.treeId);const node=tree?.nodes.find(n=>n.id===nodeId);
    if(!node)return;
    if(investedAnywhere(nodeId))return notify("warn","This skill is unlocked by a character. Reset their tree first.");
    if(tree.nodes.some(n=>n.requires?.includes(nodeId)))return notify("warn","Remove prerequisite references from other nodes first.");
    if(!await DialogV2.confirm({window:{title:"Delete Skill"},content:`Delete ${esc(node.name)}?`,rejectClose:false}))return;
    tree.nodes=tree.nodes.filter(n=>n.id!==nodeId);
    await game.settings.set(MOD,"trees",trees);return this.refresh();
  }

  async openItem(nodeId){
    const item=this.actor.items.find(it=>it.getFlag(MOD,"nodeId")===nodeId);
    if(item) return item.sheet.render(true);
    notify("warn","Granted Item not found on Actor.");
  }

  async resetProgress(){
    if(!game.user.isGM)return;
    if(!await DialogV2.confirm({window:{title:"Reset Skill Tree"},
      content:`Reset <b>${esc(this.actor.name)}</b> to Skill Level 1? This also removes all Items and Active Effects granted by this module.`,rejectClose:false}))return;
    await removeAllGrants(this.actor);
    await this.actor.setFlag(MOD,"progress",defaultProgress());
    this.treeId=null;return this.refresh();
  }
}

const windows=new Map();
async function openTree(actor){
  if(!actor) {notify("warn","Select a character token or open a Character Sheet first.");return;}
  if(actor.type!=="character")return notify("warn","This module currently supports D&D 5e characters only.");
  if(!canEdit(actor))return notify("warn","You do not have permission to edit this character.");
  let app=windows.get(actor.uuid);
  if(app?.rendered){app.bringToFront();return;}
  app=new SkillTreeApplication(actor);
  windows.set(actor.uuid,app);
  await app.render(true);
}

function addSheetButton(app,element){
  const actor=app.actor||app.document;
  if(!actor||actor.documentName!=="Actor"||actor.type!=="character"||!canEdit(actor))return;
  if(!(element instanceof HTMLElement)||element.querySelector(".averis-open-tree"))return;
  const button=document.createElement("button");
  button.type="button";
  button.className="averis-open-tree";
  button.innerHTML=`<i class="fa-solid fa-code-branch"></i><span>Skill Tree</span>`;
  button.title="Open Averis Skill Tree";
  button.addEventListener("click",(ev)=>{ev.preventDefault();ev.stopPropagation();void openTree(actor);});
  const sheetHeader=element.querySelector(".sheet-header,.character-header,.header-details,.sheet-heading");
  if(sheetHeader)sheetHeader.prepend(button);
  else {
    const content=element.querySelector(".window-content");
    if(content)content.prepend(button);
    else element.prepend(button);
  }
}

Hooks.once("init",()=>{
  game.settings.register(MOD,"trees",{
    name:"Averis Skill Tree definitions",hint:"World-wide Skill Tree and D&D 5e node configuration",
    scope:"world",config:false,type:Array,default:starterTrees()
  });
  game.settings.register(MOD,"showSheetButton",{
    name:"Show Skill Tree button in Character Sheet",scope:"world",config:true,type:Boolean,default:true
  });
  game.modules.get(MOD).api={
    open:openTree,
    openSelected:()=>openTree(canvas.tokens.controlled[0]?.actor || game.user.character),
    getProgress,
    getTrees,
    getXPForNextLevel:xpNeeded
  };
});
Hooks.once("ready",()=>{
  if(game.system.id!=="dnd5e") {notify("warn","This module requires the dnd5e game system.");return;}
  Hooks.on("renderApplicationV2",(app,element)=>{
    if(!game.settings.get(MOD,"showSheetButton"))return;
    addSheetButton(app,element);
  });
  // Legacy sheets: handle JQuery/HTMLElement without breaking older sheet options.
  Hooks.on("renderActorSheet",(app,html)=>{
    if(!game.settings.get(MOD,"showSheetButton"))return;
    const element=html instanceof HTMLElement?html:html?.[0];
    if(element)addSheetButton(app,element);
  });
  console.info(`${MOD} | Averis Skill Tree ready for Foundry V14 + dnd5e.`);
});
