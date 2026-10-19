import {CATEGORY_META} from "./catalog.mjs";
import { XP_ON_BOUND, xpForNext, totalXpForLevel, bondRank, normalizeProgress, addXp, awardBound, unlockReason } from "./progression.mjs";
import {
 MODULE_ID, PRESETS, DEFAULT_CONFIG, normalizeTemplate, normalizeLedger,
 failureReason, commitBound, resolveBonus, oppositeSides, distanceFeet
} from "./rules.mjs";

const SOCKET = `module.${MODULE_ID}`;
const log = (...args) => console.log(`[Averis Bound]`, ...args);
let gmQueue = Promise.resolve();
const seen = new Set();
const MAX_REQUESTS = 500;
const lastRequest = new Map();

function notify(message, kind="warn") { ui.notifications?.[kind]?.(message); }
function esc(value) { return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function D() { return foundry.applications.api.DialogV2; }
function cfg() { return { ...DEFAULT_CONFIG, usesPerEncounter:game.settings.get(MODULE_ID,"usesPerEncounter"), cooldownRounds:game.settings.get(MODULE_ID,"cooldownRounds"), preventRepeat:game.settings.get(MODULE_ID,"preventRepeat"), requireOpposite:game.settings.get(MODULE_ID,"requireOpposite"), allowOutOfCombat:game.settings.get(MODULE_ID,"allowOutOfCombat") }; }
function templates() {
 const custom=game.settings.get(MODULE_ID,"customTemplates")??[];
 return [...PRESETS,...custom].map(t=>({...t}));
}
function oneTemplate(id) {return templates().find(x=>x.id===id);}
function isGMCoordinator() { return !!game.user?.isGM && game.users.activeGM?.id===game.user.id; }
function activeScene() { return canvas?.scene; }
function activeCombat() {
 const c=game.combat;
 if(!c?.started || c.ended || c.scene?.id!==activeScene()?.id) return null;
 return c;
}
function scopeDoc(){return activeCombat()??activeScene();}
function actorKey(t){return String(t.actor?.uuid??"");}
function getTokens(){return (canvas?.tokens?.placeables??[]).filter(t=>t.actor?.type==="character"&&t.document?.id);}
function permissionToPropose(t){return game.user.isGM || !!t?.actor?.testUserPermission?.(game.user,"OWNER");}
function editablePairTokens(){return getTokens().filter(t=>t.actor?.isOwner||game.user.isGM);}
function center(t) {return t.center??{x:(t.document.x??0)+t.w/2,y:(t.document.y??0)+t.h/2};}
function feet(a,b) {return distanceFeet(center(a),center(b),canvas?.dimensions?.size,canvas?.dimensions?.distance);}
function selectedTokenOrNull() {return canvas.tokens?.controlled?.find(t=>t.actor?.type==="character")??null;}
function selectedTargetOrNull(){return [...(game.user.targets??[])].find(t=>t.scene?.id===activeScene()?.id)??null;}
function ledgerOf(doc){return normalizeLedger(doc?.getFlag(MODULE_ID,"ledger"));}
function optionsHtml(arr,value="") { return arr.map(x=>`<option value="${esc(x.id)}" ${x.id===value?"selected":""}>${esc(x.name)}</option>`).join(""); }
function choicesAll(){return getTokens().map(t=>({id:t.id,name:`${t.name} (${t.id.slice(-4)})`}));}
function normalizedInput(raw) {
 if(!raw)return null;
 if(raw instanceof FormData)return Object.fromEntries(raw.entries());
 if(raw?.object && typeof raw.object === "object") return raw.object;
 if(typeof raw==="object")return raw;
 return null;
}
function safeId(value) {const str=String(value??"");return /^[a-zA-Z0-9_-]{4,64}$/.test(str)?str:"";}
function cleanError(err) {const msg=String(err?.message??err??"Unexpected error");log("Error",err);notify(`Bound: ${msg.slice(0,240)}`,"error");}
function addSeen(id){seen.add(id);if(seen.size>MAX_REQUESTS)seen.delete(seen.values().next().value);}
function enqueue(job){gmQueue=gmQueue.catch(()=>{}).then(job).catch(cleanError);return gmQueue;}
function confirmedMode(t){return t.category==="melee"||t.category==="ranged"||t.category==="spell";}
function checkAlive(t){
 const hp=t.actor?.system?.attributes?.hp?.value;
 const condition=t.actor?.statuses;
 return (typeof hp!=="number"||hp>0)&&!condition?.has?.("dead")&&!condition?.has?.("unconscious");
}
function validate(req,{strict=true}={}) {
 const scene=activeScene();if(!scene)throw Error("Open a canvas scene first.");
 const t1=canvas.tokens.get(req.tokenA),t2=canvas.tokens.get(req.tokenB);
 if(!t1||!t2||t1.id===t2.id||t1.actor?.type!=="character"||t2.actor?.type!=="character")throw Error("Select two distinct character tokens on the same scene.");
 if(!checkAlive(t1)||!checkAlive(t2))throw Error("Bound requires both characters to be conscious and alive.");
 const requester=game.users.get(req.fromUserId);if(!requester)throw Error('Unknown requesting user.');
 if(!requester.isGM && !t1.actor.testUserPermission(requester,'OWNER'))throw Error('Requesting player does not own the initiating Actor.');
 const template=oneTemplate(req.templateId);
 if(!template)throw Error("Bound variant no longer exists.");
 const combat=activeCombat();
 if(!combat&&!cfg().allowOutOfCombat)throw Error("An active combat is required by GM settings.");
 if(combat){
   if(!combat.combatants.some(c=>c.tokenId===t1.id && c.sceneId!=="_invalid") || !combat.combatants.some(c=>c.tokenId===t2.id && c.sceneId!=="_invalid"))throw Error("Both tokens must have combatants in the current initiative.");
 }
 const target=req.targetId?canvas.tokens.get(req.targetId):null;
 if(template.target && (!target||target.id===t1.id||target.id===t2.id))throw Error("This variant needs a different target token.");
 if(target && !checkAlive(target) && confirmedMode(template))throw Error("The selected target is already down.");
 if(target && template.reach>0 && confirmedMode(template)){
   if(feet(t1,target)>template.reach+0.01 || feet(t2,target)>template.reach+0.01)throw Error(`Both allies must be within ${template.reach} ft of the target.`);
 }
 if(!target && template.reach>0 && !confirmedMode(template) && feet(t1,t2)>template.reach+0.01)throw Error(`This Bound requires allies within ${template.reach} ft of each other.`);
 if(target && template.opposite && cfg().requireOpposite && !oppositeSides(center(t1),center(t2),center(target))) throw Error("Allies must stand on opposite sides of the target (flanking formation).");
 const doc=scopeDoc();if(!doc)throw Error("There is no encounter or scene to track Bound uses.");
 const round=combat?.round??null;
 const one=normalizeProgress(t1.actor.getFlag(MODULE_ID,'boundProgress')),two=normalizeProgress(t2.actor.getFlag(MODULE_ID,'boundProgress'));
 const commonPair=Math.min(one.pairs[actorKey(t2)]??0,two.pairs[actorKey(t1)]??0);
 const progressionFailure=unlockReason(template,one,commonPair)||unlockReason(template,two,commonPair);
 if(progressionFailure)throw Error(`${template.title} is locked: ${progressionFailure}. Both characters must meet prerequisites.`);
 const reason=failureReason({ledger:ledgerOf(doc),a:actorKey(t1),b:actorKey(t2),round,combat:!!combat,config:cfg()});
 if(reason)throw Error(reason);
 if(strict && !doc.canUserModify(game.user,"update"))throw Error("Active GM cannot modify encounter state.");
 return {scene,doc,combat,round,t1,t2,target,template};
}
function chatContent({template,t1,t2,target,round,id,gmName,scope}){
 return `<div class="averis-bound-chat">
 <h3>⚔ Averis Bound · ${esc(template.title)}</h3>
 <div class="bound-pills"><span>${esc(t1.name)}</span><span>+</span><span>${esc(t2.name)}</span><span>${esc(template.category.toUpperCase())}</span></div>
 <p><strong>Action Economy:</strong> ${esc(template.action)}<br><strong>Target:</strong> ${esc(target?.name??"Ally / Scene (GM chooses)")}<br><strong>Encounter:</strong> ${esc(scope)}${round?` · Round ${round}`:""}</p>
 <p>${esc(template.rules)}</p>
 <p><strong>Condition:</strong> ${esc(template.trigger)}</p>
 ${template.formula?`<p><strong>Optional shared roll:</strong> ${esc(template.formula)} (${esc(template.bonusKind)}) — GM adjudicates, then rolls it once.</p>
 <button type="button" data-averis-bound-resolve="${esc(id)}" title="GM only: roll the one-time combination bonus">🎲 GM: Resolve shared bonus</button>`:""}
 <small>Bound ignores exhaustion penalties of levels 1–2 for the combined maneuver only; it does not remove the exhaustion condition. For exhaustion 3+, apply usual D&D restrictions. Both participants use normal dnd5e actions, slots, ammunition, concentration and character-sheet rolls. Uses consumed once GM confirms. ${esc(gmName)}</small>
 </div>`;
}
async function createBound(req){
 if(!isGMCoordinator())return;
 if(seen.has(req.requestId))return;
 addSeen(req.requestId);
 const last=lastRequest.get(req.fromUserId)??0;
 if(Date.now()-last<900)throw Error("Rate limited: please retry your request in a moment.");
 lastRequest.set(req.fromUserId,Date.now());
 const {scene,doc,combat,round,t1,t2,target,template}=validate(req);
 const owner=game.users.get(req.fromUserId);
 const requester=owner?.name??"Unknown sender (identity not authenticated)";
 const approved=await D().confirm({
   window:{title:"Averis Bound · GM approval"},
   content:`<div class="averis-bound-form"><p><strong>Requested by:</strong> ${esc(requester)}</p><p><strong>${esc(t1.name)} + ${esc(t2.name)}</strong></p><p><strong>Variant:</strong> ${esc(template.title)}<br><strong>Target:</strong> ${esc(target?.name??"—")}</p><p class="averis-bound-note">Confirm both participants agree, have their Actions/Reactions, and satisfy any spell or weapon requirements. The GM is the authoritative final approver.</p><div class="averis-bound-info">${esc(template.rules)}</div></div>`,
   yes:{label:"Approve & spend Bound uses"},no:{label:"Reject"},rejectClose:false
 });
 if(!approved){game.socket?.emit(SOCKET,{type:"result",id:req.requestId,toUserId:req.fromUserId,ok:false,title:"GM declined this Bound request"});return;}
 // Re-validate AFTER the GM's asynchronous confirmation, since round, token location,
 // scene, uses, or the target may have changed while the confirmation was open.
 if(activeScene()?.id!==scene.id || scopeDoc()?.uuid!==doc.uuid)throw Error("Scene or encounter changed during approval. Request canceled.");
 if(!isGMCoordinator())throw Error('Active GM changed while approving Bound; please retry.');
 const latest=validate(req);
 const before=ledgerOf(latest.doc);
 const next=commitBound(before,{id:req.requestId,a:actorKey(latest.t1),b:actorKey(latest.t2),round:latest.round,combat:!!latest.combat,templateId:template.id,targetId:target?.id,gmId:game.user.id,sceneId:scene.id,at:Date.now()});
 // The encounter ledger commits first. Follow-up XP updates are individually idempotent.
 await latest.doc.setFlag(MODULE_ID,"ledger",next);
 for(const [owner,other] of [[latest.t1,latest.t2],[latest.t2,latest.t1]]){
   try {const grant=awardBound(owner.actor.getFlag(MODULE_ID,'boundProgress'),req.requestId,actorKey(other),game.settings.get(MODULE_ID,'xpPerBound')??XP_ON_BOUND);
     if(grant.awarded)await owner.actor.setFlag(MODULE_ID,'boundProgress',grant.progress);
   }catch(error){log(`XP award failed for ${owner.actor.name}; bound ledger was committed`,error);notify(`Bound saved, but XP for ${owner.actor.name} was not credited. GM can correct it manually.`,'error');}
 }

 try{
   await ChatMessage.create({speaker:ChatMessage.getSpeaker({actor:latest.t1.actor,token:latest.t1.document}),content:chatContent({...latest,id:req.requestId,gmName:`Approved by ${game.user.name}`,scope:combat?"Combat":"Scene"}),flags:{[MODULE_ID]:{actionId:req.requestId,templateId:template.id,scopeUuid:latest.doc.uuid}}});
 }catch(err){
   // The ledger has already committed. Never silently refund or duplicate resource spend.
   log("Chat post failed; ledger was committed",err);
   notify("Bound was saved, but its chat card failed. Check the Bound status before trying again.","error");
 }
 game.socket?.emit(SOCKET,{type:"result",id:req.requestId,toUserId:req.fromUserId,ok:true,title:template.title});
 notify(`Bound confirmed: ${t1.name} + ${t2.name} (${template.title})`,"info");
}
async function resolveById(id,scopeUuid){
 if(!isGMCoordinator())throw Error("Only the active GM can resolve a Bound bonus.");
 const doc=scopeDoc();
 if(doc?.uuid!==scopeUuid)throw Error("Switch back to the original encounter/scene to resolve this roll.");
 const state=ledgerOf(doc),entry=state.entries.find(e=>e.id===id);
 if(!entry)throw Error("Action not found in this encounter.");
 const variant=oneTemplate(entry.templateId);
 if(!variant?.formula)throw Error("No bonus roll is configured.");
 if(entry.bonusResolved)throw Error("This Bound bonus has already been resolved.");
 const yes=await D().confirm({window:{title:`Resolve ${variant.title}`},content:`<p>${esc(variant.trigger)}</p><p>Roll <strong>${esc(variant.formula)}</strong> as one shared <strong>${esc(variant.bonusKind)}</strong> bonus? The GM applies the result manually; it is never automatically deducted from or added to a character.</p>`,yes:{label:"Roll once"},no:{label:"Cancel"},rejectClose:false});
 if(!yes)return;
 // Reread the ledger after awaiting GM input and save resolved state BEFORE rolling.
 // It is intentionally not automatically retried to prevent unintended double rolls.
 const current=ledgerOf(doc);
 if(!current.entries.some(e=>e.id===id&&!e.bonusResolved))throw Error("This bonus was already resolved or the action was reset.");
 const roll=new Roll(variant.formula);
 await roll.evaluate();
 await doc.setFlag(MODULE_ID,"ledger",resolveBonus(current,id));
 await roll.toMessage({speaker:ChatMessage.getSpeaker(),flavor:`Averis Bound — ${esc(variant.title)}: shared ${esc(variant.bonusKind)} bonus (GM applies manually)`});
}
/** Adaptive Foundry V14 ApplicationV2 — scroll regions are independent. */
let boundDashboard=null;
function progressOf(actor){return normalizeProgress(actor?.getFlag(MODULE_ID,'boundProgress'));}
function actorLabel(t){return t?.actor?.name??t?.name??'Unknown';}
function allTokensOption(tokens,selected){return tokens.map(t=>`<option value="${esc(t.id)}" ${selected===t.id?'selected':''}>${esc(t.name)}</option>`).join('');}
function selectedOwned(actor=null){const mine=getTokens().filter(permissionToPropose);return actor?mine.find(t=>t.actor?.uuid===actor.uuid)??mine[0]:mine.find(t=>t.id===selectedTokenOrNull()?.id)??mine[0];}
function favoriteIds(){return game.settings.get(MODULE_ID,'favorites')??[];}
function favorite(tid){return favoriteIds().includes(tid);}
function badgeForLevel(level, bond){return `<span class="ab-chip">Bound Lv ${esc(level)}</span><span class="ab-chip">Bond Rank ${esc(bond)}</span>`;}
const GROUP_NAMES={all:'All',favorites:'Favorites',melee:'Melee',ranged:'Ranged',spell:'Spells',healing:'Healing',defense:'Defense',control:'Control',skill:'Skill Checks',movement:'Movement',support:'Support',utility:'Utility',custom:'Custom'};
class BoundDashboard extends foundry.applications.api.ApplicationV2 {
 static DEFAULT_OPTIONS={id:'averis-bound-dashboard',classes:['averis-bound-window'],window:{title:'Averis Bound • Combo Library',icon:'fas fa-link',resizable:true},position:{width:1130,height:760}};
 constructor(options={}){super(options);this.actorUuid=null;this.actorId=null;this.tokenA='';this.tokenB='';this.targetId='';this.category='all';this.search='';this.selectedId='twin-strike';this.view='library';this.scroll=0;this.lockedOnly=false;}
 remember(actor=null){if(actor){this.actorUuid=actor.uuid;this.tokenA=selectedOwned(actor)?.id??this.tokenA;}else if(!this.tokenA)this.tokenA=selectedOwned()?.id??'';
   const tokens=getTokens();if(!tokens.some(t=>t.id===this.tokenB)||this.tokenB===this.tokenA)this.tokenB=tokens.find(t=>t.id!==this.tokenA)?.id??'';
   if(!this.targetId)this.targetId=selectedTargetOrNull()?.id??'';
 }
 async show(actor=null){this.remember(actor);const maxW=Math.max(360,Math.min(1130,window.innerWidth-64));const maxH=Math.max(340,Math.min(780,window.innerHeight-96));
   if(this.rendered){this.bringToFront();this.render({force:true});}else{await this.render({force:true});this.setPosition({width:maxW,height:maxH});}
 }
 async _renderHTML(){const tks=getTokens(),owned=tks.filter(permissionToPropose);if(!owned.some(t=>t.id===this.tokenA))this.tokenA=owned[0]?.id??'';if(this.tokenB===this.tokenA||!tks.some(t=>t.id===this.tokenB))this.tokenB=tks.find(t=>t.id!==this.tokenA)?.id??'';
 const first=tks.find(t=>t.id===this.tokenA),partner=tks.find(t=>t.id===this.tokenB),target=tks.find(t=>t.id===this.targetId);
 const p=progressOf(first?.actor),q=progressOf(partner?.actor),pairCount=Math.min(p.pairs?.[actorKey(partner)]??0,q.pairs?.[actorKey(first)]??0),bond=bondRank(pairCount);
 const need=xpForNext(p.level),next=totalXpForLevel(Math.min(20,p.level+1)),earned=p.xp-totalXpForLevel(p.level),percent=p.level===20?100:Math.min(100,Math.max(0,100*earned/need));
 const ledger=ledgerOf(scopeDoc()),used=ledger.used[actorKey(first)]?.count??0,remaining=Math.max(0,cfg().usesPerEncounter-used);
 const selected=oneTemplate(this.selectedId)??templates()[0];const all=templates();
 const visible=all.filter(t=>this.category==='all'||this.category==='favorites'&&favorite(t.id)||t.category===this.category).filter(t=>!this.lockedOnly||unlockReason(t,p,pairCount));
 const cards=visible.map(t=>{const reason=unlockReason(t,p,pairCount);const bothReason=reason||unlockReason(t,q,pairCount);const locked=!!bothReason;return `<button type="button" data-a="select" data-id="${esc(t.id)}" class="ab-card ${this.selectedId===t.id?'active':''} ${locked?'locked':''}" data-search="${esc((t.title+' '+t.category+' '+t.rules).toLowerCase())}" aria-pressed="${this.selectedId===t.id}" aria-label="${esc(t.title)}, tier ${esc(t.tier??1)}, ${locked?'locked':'unlocked'}">
 <div class="ab-card-top"><span class="ab-icon"><i class="fas ${esc(t.icon)}"></i></span><span class="ab-tier">T${esc(t.tier??1)}</span></div>
 <div class="ab-card-name" title="${esc(t.title)}">${esc(t.title)}</div><div class="ab-card-sub">${esc(GROUP_NAMES[t.category]??t.category)}</div>
 <div class="ab-card-meta"><span><i class="fas fa-layer-group"></i> Lv ${esc(t.level??1)}</span>${locked?'<span class="ab-locked"><i class="fas fa-lock"></i> Locked</span>':'<span class="ab-ready"><i class="fas fa-unlock"></i> Ready</span>'}</div></button>`;}).join('');
 const reason=selected?(unlockReason(selected,p,pairCount)||unlockReason(selected,q,pairCount)):'No action selected';const missingTarget=!!selected?.target&&!target;const ready=!reason&&!missingTarget&&first&&partner&&remaining>0;
 const history=ledger.entries.slice(-12).reverse().map(e=>`<div class="ab-history-row"><div><b>${esc(oneTemplate(e.templateId)?.title??e.templateId)}</b><small>${esc((tks.find(t=>actorKey(t)===e.actorA)?.name??'Hero')+' + '+(tks.find(t=>actorKey(t)===e.actorB)?.name??'Hero'))}</small></div><span>${e.round?'Round '+esc(e.round):'Exploration'}</span></div>`).join('')||'<div class="ab-empty">No Bound actions have been performed yet.</div>';
 const side=`<div class="ab-panel-head"><span><i class="fas fa-users"></i> PARTICIPANTS</span></div><div class="ab-partners"><label>Initiator<select aria-label="Initiator" data-field="tokenA" ${owned.length===0?'disabled':''}>${allTokensOption(owned,this.tokenA)}</select></label><label>Partner<select aria-label="Partner" data-field="tokenB">${allTokensOption(tks.filter(t=>t.id!==this.tokenA),this.tokenB)}</select></label><label>Target<select aria-label="Target" data-field="targetId"><option value="">No target</option>${allTokensOption((canvas?.tokens?.placeables??[]).filter(t=>t.id!==this.tokenA&&t.id!==this.tokenB),this.targetId)}</select></label></div>
 <div class="ab-divider"></div><div class="ab-panel-head"><span><i class="fas fa-chart-line"></i> PROGRESSION</span></div>
 <div class="ab-rank"><div><strong>BOUND LEVEL ${p.level}</strong><small>${p.level===20?'MAX LEVEL':`${earned} / ${need} XP`}</small></div><div class="ab-meter"><div style="width:${percent}%"></div></div><span class="ab-xtotal">Total ${p.xp} XP</span></div>
 <div class="ab-statline">${badgeForLevel(p.level,bond)}</div><p class="ab-hint">Bond Rank rises through successful actions with the same partner. Both heroes gain individual Bound XP.</p>
 <div class="ab-tiles"><div><b>${remaining}</b><small>Bound uses left</small></div><div><b>${cfg().cooldownRounds}</b><small>Round cooldown</small></div><div><b>${pairCount}</b><small>Paired actions</small></div></div>
 ${game.user.isGM?'<button class="ab-small-btn" data-a="addxp"><i class="fas fa-plus"></i> Grant Bound XP</button>':''}
 <div class="ab-divider"></div><div class="ab-panel-head"><span><i class="fas fa-wand-magic-sparkles"></i> GM TOOLS</span></div>
 <div class="ab-tools"><button data-a="status"><i class="fas fa-list"></i> Encounter Status</button>${game.user.isGM?'<button data-a="custom"><i class="fas fa-pencil"></i> Custom Combos</button>':''}</div>`;
 const detail=selected?`<div class="ab-hero-icon"><i class="fas ${esc(selected.icon)}"></i></div><div class="ab-details-name">${esc(selected.title)}</div><div class="ab-details-sub">${esc(GROUP_NAMES[selected.category]??selected.category)} · Tier ${esc(selected.tier??1)}</div>
 <div class="ab-requirements">${badgeForLevel(selected.level??1,selected.requiredBondRank??1)} ${reason?`<span class="ab-warn"><i class="fas fa-lock"></i> ${esc(reason)}</span>`:'<span class="ab-ok"><i class="fas fa-check"></i> Unlocked</span>'}</div>
 <div class="ab-detail-title">Action Economy</div><p>${esc(selected.action)}</p><div class="ab-detail-title">Trigger</div><p>${esc(selected.trigger)}</p><div class="ab-detail-title">D&D 5e Effect</div><p>${esc(selected.rules)}</p>
 <div class="ab-detail-grid"><span>Range<strong>${esc(selected.reach)} ft</strong></span><span>Shared Bonus<strong>${esc(selected.formula||'No roll')}</strong></span><span>Target<strong>${selected.target?'Required':'Optional'}</strong></span><span>Formation<strong>${selected.opposite?'Opposite sides':'Flexible'}</strong></span></div>
 <p class="ab-note">The GM adjudicates the shared effect after the participants resolve their normal D&D 5e attacks, saves, spell slots and actions. This module never applies damage automatically.</p>`:'';
 const categories=`<div class="ab-categories">${Object.entries(GROUP_NAMES).map(([id,label])=>`<button type="button" data-a="category" data-id="${id}" class="${this.category===id?'selected':''}">${esc(label)}${id==='all'?` <em>${all.length}</em>`:''}</button>`).join('')}</div>`;
 const main=`<div class="ab-main-header"><div><div class="ab-overline">TOME OF PAIRED ARTS</div><h2>Bound Techniques <span>${all.length}</span></h2><p>Cooperative abilities · unlock through progression</p></div><div class="ab-main-badges"><span><i class="fas fa-shield-alt"></i> GM approval</span><span><i class="fas fa-dice-d20"></i> D&D 5e</span></div></div>
 <div class="ab-tab-row"><button type="button" data-a="tab" data-id="library" class="${this.view==='library'?'active':''}"><i class="fas fa-layer-group"></i> Library</button><button type="button" data-a="tab" data-id="progress" class="${this.view==='progress'?'active':''}"><i class="fas fa-seedling"></i> Progression</button><button type="button" data-a="tab" data-id="history" class="${this.view==='history'?'active':''}"><i class="fas fa-scroll"></i> History</button><button type="button" data-a="tab" data-id="details" class="${this.view==='details'?'active':''}"><i class="fas fa-book-open"></i> Details</button></div>
 ${this.view==='library'?`<div class="ab-catalog-top"><input type="search" class="ab-search" placeholder="Search techniques or effects..." value="${esc(this.search)}" aria-label="Search combos"><label class="ab-checkbox"><input type="checkbox" data-field="lockedOnly" ${this.lockedOnly?'checked':''}> Locked only</label></div>${categories}<div class="ab-scroll ab-catalog-scroll"><div class="ab-grid">${cards}</div><div class="ab-empty ab-none" hidden>No matching techniques.</div></div>`:this.view==='progress'?`<div class="ab-scroll ab-progress"><h3>Bound progression</h3><p>Each hero gains Bound XP after an approved combination (${game.settings.get(MODULE_ID,'xpPerBound')??XP_ON_BOUND} XP), or through a GM award. New techniques unlock automatically based on individual Bound Level and the pair's Bond Rank.</p><div class="ab-milestones">${[1,3,5,7,9,12,15,20].map(level=>`<div class="${p.level>=level?'done':''}"><strong>Level ${level}</strong><span>${level<=12?'New techniques · Tier '+([1,3,5,7,9,12].indexOf(level)+1):'Veteran status'}</span><small>${totalXpForLevel(level)} total XP</small></div>`).join('')}</div><h3>Bond Rank — ${esc(partner?.name??'Partner')}</h3><p>Rank 1: 0–2 paired actions · Rank 2: 3–5 · Rank 3: 6–9 · Rank 4: 10+</p>${game.user.isGM?'<button class="ab-small-btn" data-a="addxp">GM: Grant XP</button>':''}</div>`:this.view==='details'?`<div class="ab-scroll ab-detail-in-main">${detail}</div>`:`<div class="ab-scroll ab-history">${history}</div>`}`;
 const footer=`<div class="ab-footer"><div class="ab-footer-text">${selected?esc(selected.title):'Choose a Bound action'} ${reason?`· ${esc(reason)}`:missingTarget?'· Select a target':'· Ready to request'}</div><button type="button" class="ab-action-btn" data-a="submit" ${ready?'':'disabled'}><i class="fas fa-bolt"></i> ${ready?'Request Bound':reason?'Technique locked':missingTarget?'Select a target':'No uses or partner'}</button></div>`;
 const el=document.createElement('section');el.className='ab-shell';el.innerHTML=`<aside class="ab-left ab-scroll">${side}</aside><main class="ab-main">${main}${footer}</main><aside class="ab-right ab-scroll"><div class="ab-detail-header"><span>DETAILS</span>${selected?`<button class="ab-favorite" data-a="favorite" data-id="${esc(selected.id)}" title="Toggle favorite"><i class="${favorite(selected.id)?'fas':'far'} fa-star"></i></button>`:''}</div>${detail}</aside>`;
 return el;
 }
 _replaceHTML(rendered,content){content.replaceChildren(rendered);}
 async _onRender(context,options){await super._onRender(context,options);const root=this.element?.querySelector('.ab-shell');if(!root)return;
  const list=root.querySelector('.ab-catalog-scroll');if(list)list.scrollTop=this.scroll;
  for(const select of root.querySelectorAll('[data-field]'))select.addEventListener('change',async()=>{
    const key=select.dataset.field;if(key==='lockedOnly')this.lockedOnly=select.checked;else this[key]=select.value;
    if(key==='tokenA'&&this.tokenA===this.tokenB)this.tokenB=getTokens().find(t=>t.id!==this.tokenA)?.id??'';
    this.scroll=0;await this.render({force:true});
  });
  const search=root.querySelector('.ab-search');if(search){const apply=()=>{this.search=search.value;const term=this.search.toLowerCase().trim();let n=0;for(const card of root.querySelectorAll('.ab-card')){const found=card.dataset.search.includes(term);card.hidden=!found;if(found)n++;}const empty=root.querySelector('.ab-none');if(empty)empty.hidden=n!==0;};search.addEventListener('input',apply);apply();}
  for(const btn of root.querySelectorAll('button[data-a]'))btn.addEventListener('click',async event=>{
    event.preventDefault();this.scroll=root.querySelector('.ab-catalog-scroll')?.scrollTop??0;
    try{const action=btn.dataset.a,id=btn.dataset.id;
      if(action==='select'){this.selectedId=id;if(getComputedStyle(root.querySelector('.ab-right')).display==='none')this.view='details';await this.render({force:true});}
      if(action==='category'){this.category=id;this.scroll=0;await this.render({force:true});}
      if(action==='tab'){this.view=id;this.scroll=0;await this.render({force:true});}
      if(action==='favorite'){const prev=favoriteIds();await game.settings.set(MODULE_ID,'favorites',favorite(id)?prev.filter(x=>x!==id):[...prev,id]);await this.render({force:true});}
      if(action==='submit')await this.submit();
      if(action==='status')await status();
      if(action==='custom')await customManager();
      if(action==='addxp')await this.gmXp();
    }catch(e){cleanError(e);}
  });
 }
 async submit(){const t=canvas?.tokens?.get(this.tokenA),p=canvas?.tokens?.get(this.tokenB),tgt=this.targetId?canvas.tokens.get(this.targetId):null;
   if(!t||!p||t.id===p.id)throw Error('Choose two distinct character tokens.');if(!permissionToPropose(t))throw Error('You do not own the initiator.');
   const req={type:'proposal',requestId:foundry.utils.randomID(18),fromUserId:game.user.id,sceneId:activeScene()?.id,tokenA:t.id,tokenB:p.id,targetId:tgt?.id??'',templateId:this.selectedId};
   if(isGMCoordinator())await enqueue(()=>createBound(req));else if(game.users.activeGM?.active){game.socket.emit(SOCKET,req);notify('Bound request sent to active GM.','info');}else throw Error('An active GM must be connected.');
   await this.render({force:true});
 }
 async gmXp(){if(!game.user.isGM)throw Error('GM only.');const actor=canvas.tokens.get(this.tokenA)?.actor;if(!actor)throw Error('Choose a hero.');
   const raw=await D().input({window:{title:`Bound XP · ${actor.name}`},content:`<div class="averis-bound-form"><p>Current Level ${progressOf(actor).level}; ${progressOf(actor).xp} XP. Positive or negative XP, up to ±100,000 per operation.</p><label>XP amount<input name="amount" type="number" min="-100000" max="100000" step="1" value="100" required></label></div>`,ok:{label:'Apply XP'},rejectClose:false});
   const form=normalizedInput(raw);if(!form)return;const amount=Number(form.amount);const next=addXp(progressOf(actor),amount);await actor.setFlag(MODULE_ID,'boundProgress',next);notify(`${actor.name}: Bound Level ${next.level}, XP ${next.xp}`,'info');await this.render({force:true});
 }
}
async function open({actor=null}={}){
 if(!activeScene())return notify('Open a scene first.');if(getTokens().length<2)return notify('Place two character tokens on the current scene.');
 if(!getTokens().some(permissionToPropose))return notify('You need an owned character token on this scene.');
 if(!boundDashboard)boundDashboard=new BoundDashboard();await boundDashboard.show(actor);
}

function onSocket(message){
 if(!message||typeof message!=="object"||!message.type)return;
 if(message.type==="result"&&message.toUserId===game.user.id){ notify(message.ok?`GM approved ${message.title}.`:`Bound declined: ${message.title}`,message.ok?"info":"warn");return; }
 if(message.type!=="proposal" || !isGMCoordinator())return;
 if(!/^[a-zA-Z0-9_-]{10,32}$/.test(String(message.requestId??"")))return;
 if(message.sceneId!==activeScene()?.id)return;
 enqueue(async()=>{try{await createBound(message);}catch(error){game.socket?.emit(SOCKET,{type:"result",id:message.requestId,toUserId:message.fromUserId,ok:false,title:String(error?.message??error).slice(0,160)});throw error;}});
}
async function status(){
 const doc=scopeDoc();if(!doc)return notify("Open a scene.");
 const state=ledgerOf(doc),used=Object.entries(state.used);
 const rows=used.length?used.map(([id,p])=>`<li><strong>${esc(getTokens().find(t=>actorKey(t)===id)?.name??"Actor")}</strong>: ${p.count}/${cfg().usesPerEncounter}; last round ${esc(p.lastRound??"out of combat")}; ${p.partners?.length??0} partner(s)</li>`).join(""):"<li>No Bound combinations yet.</li>";
 const result=await D().confirm({window:{title:"Averis Bound — Encounter status"},content:`<div class="averis-bound-form"><p>Scope: ${esc(activeCombat()?"current combat":"current scene / downtime")}</p><ul>${rows}</ul><p>${state.entries.length} logged combinations.</p><p class="averis-bound-note">Reset removes only Bound uses/cooldowns/logs for this combat or scene. It does not restore spell slots or actions.</p></div>`,yes:{label:"GM: reset encounter Bound"},no:{label:"Close"},rejectClose:false});
 if(!result)return;
 if(!isGMCoordinator())return notify("Only the active GM can reset Bound uses.","error");
 const again=await D().confirm({window:{title:"Confirm Bound reset"},content:"Reset all current encounter Bound uses and history? This cannot be undone.",yes:{label:"Reset all Bound uses"},no:{label:"Cancel"},rejectClose:false});
 if(!again)return;
 await doc.setFlag(MODULE_ID,"ledger",{version:2,revision:state.revision+1,used:{},entries:[]});
 notify("Bound uses for this encounter were reset.","info");
}
async function customManager(){
 if(!game.user.isGM)return notify("GM only.");
 const custom=game.settings.get(MODULE_ID,"customTemplates")??[];
 const intent=normalizedInput(await D().input({window:{title:"Averis Bound · Custom variants"},ok:{label:"Continue"},content:`<div class="averis-bound-form"><p>Built-in variants cannot be deleted. You can add your own non-scripted template or delete a custom one.</p><label>Operation<select name="operation"><option value="create">Create a variant</option><option value="delete">Delete a custom variant</option></select></label><label>Custom variant to delete<select name="target"><option value="">—</option>${optionsHtml(custom.map(t=>({id:t.id,name:t.title})))}</select></label></div>`}));
 if(!intent)return;
 if(intent.operation==="delete"){
   if(!custom.some(x=>x.id===intent.target))return notify("Select a custom variant to delete.");
   const yes=await D().confirm({window:{title:"Delete custom Bound"},content:`Delete ${esc(intent.target)}? Existing combat logs will retain its template ID.`,rejectClose:false});
   if(yes)await game.settings.set(MODULE_ID,"customTemplates",custom.filter(x=>x.id!==intent.target));
   return;
 }
 const form=normalizedInput(await D().input({window:{title:"Create custom Bound action"},ok:{label:"Save variant"},content:`<div class="averis-bound-form">
 <label>Unique ID (lowercase, hyphens)<input name="id" value="custom-combo" required></label>
 <label>Title<input name="title" value="New Bound Combo" required maxlength="64"></label>
 <label>Category<select name="category">${optionsHtml(["custom","utility","melee","ranged","spell","skill","support","healing","movement","control","defense"].map(v=>({id:v,name:v})))}</select></label>
 <label>Action costs<input name="action" value="Action + Action" maxlength="80"></label>
 <label>Required Bound Level<input name="level" type="number" min="1" max="20" value="3"></label>
 <label>Required Pair Bond Rank<input name="requiredBondRank" type="number" min="1" max="4" value="1"></label>
 <label>Reach (feet)<input name="reach" type="number" min="0" max="300" value="30"></label>
 <label>Requires target?<select name="target"><option value="false">No</option><option value="true">Yes</option></select></label>
 <label>Requires opposite sides?<select name="opposite"><option value="false">No</option><option value="true">Yes</option></select></label>
 <label>Optional dice (blank or 1d6 etc.)<input name="formula" value=""></label>
 <label>Bonus type<select name="bonusKind">${optionsHtml(["check","damage","healing","temp","penalty"].map(v=>({id:v,name:v})))}</select></label>
 <label>Trigger condition<input name="trigger" value="Both participants complete their actions" maxlength="300"></label>
 <label>D&D mechanics & adjudication<textarea name="rules" rows="5" required>Both participants take their normal actions. The GM adjudicates effects with D&D 5e rules.</textarea></label>
 </div>`}));
 if(!form)return;
 try{
   const entry=normalizeTemplate({...form,target:form.target==="true",opposite:form.opposite==="true",level:Number(form.level||1),requiredBondRank:Number(form.requiredBondRank||1)});
   if(templates().some(x=>x.id===entry.id))throw Error("A Bound variant already has this ID.");
   await game.settings.set(MODULE_ID,"customTemplates",[...custom,entry]);
   notify(`Added custom Bound variant: ${entry.title}`,"info");
 }catch(e){cleanError(e);}
}
async function onChat(message,html){
 if(!game.user.isGM)return;
 const root=html?.[0]??html;
 if(!root?.querySelectorAll)return;
 for(const btn of root.querySelectorAll("[data-averis-bound-resolve]")){
   if(btn.dataset.averisBoundReady)return;
   btn.dataset.averisBoundReady="1";
   btn.addEventListener("click",()=>enqueue(async()=>{
     const id=btn.dataset.averisBoundResolve;
     const scopeUuid=message.getFlag(MODULE_ID,"scopeUuid");
     await resolveById(id,scopeUuid);
   }));
 }
}
Hooks.once("init",()=>{
 game.settings.register(MODULE_ID,"xpPerBound",{name:"Automatic XP per approved Bound",hint:"Each participant receives this many Bound XP after GM approval. 0 disables automatic experience.",scope:"world",config:true,type:Number,range:{min:0,max:100,step:5},default:15});
 game.settings.register(MODULE_ID,"usesPerEncounter",{name:"Uses per character / encounter",hint:"Both participants consume one use of their own pool.",scope:"world",config:true,type:Number,range:{min:1,max:10,step:1},default:2});
 game.settings.register(MODULE_ID,"cooldownRounds",{name:"Cooldown in combat rounds",hint:"Three rounds means use on round 1, next use on round 4.",scope:"world",config:true,type:Number,range:{min:0,max:20,step:1},default:3});
 game.settings.register(MODULE_ID,"preventRepeat",{name:"Do not repeat the same partner",scope:"world",config:true,type:Boolean,default:true});
 game.settings.register(MODULE_ID,"requireOpposite",{name:"Opposite-side placement for attack modes",scope:"world",config:true,type:Boolean,default:true});
 game.settings.register(MODULE_ID,"allowOutOfCombat",{name:"Allow scene/downtime Bound actions",scope:"world",config:true,type:Boolean,default:true});
 game.settings.register(MODULE_ID,"favorites",{name:"Favorite Bound actions",scope:"client",config:false,type:Array,default:[]});
 game.settings.register(MODULE_ID,"customTemplates",{name:"Custom Bound variants",scope:"world",config:false,type:Array,default:[]});
 game.settings.registerMenu(MODULE_ID,"manager",{name:"Create / delete Bound variants",label:"Manage Bound variants",hint:"Create your own combinations using D&D 5e narrative rules and optional bonus dice.",icon:"fas fa-people-arrows-left-right",type:class extends foundry.applications.api.ApplicationV2{render(...args){void customManager();return this;}},restricted:true});
 game.keybindings.register(MODULE_ID,"open",{name:"Open Averis Bound System",hint:"Propose a combination with another character",editable:[{key:"KeyB",modifiers:["ALT"]}],onDown:()=>{void open();return true;},restricted:false});
 game.modules.get(MODULE_ID).api={open,status,customManager,getVariants:()=>templates(),getLedger:()=>ledgerOf(scopeDoc()),getProgress:(actor)=>progressOf(actor),getUnlocks:(actor,partner=null)=>{const a=progressOf(actor),b=partner?progressOf(partner):null;const pair=partner?Math.min(a.pairs?.[partner.uuid]??0,b.pairs?.[actor.uuid]??0):0;return templates().filter(v=>!unlockReason(v,a,pair)&&(!b||!unlockReason(v,b,pair)));}};
});
Hooks.once("ready",()=>{
 if(game.system.id!=="dnd5e")notify("Averis Bound System was designed for the D&D 5e system.","error");
 game.socket?.on(SOCKET,onSocket);
 log("Ready for Foundry V14 / dnd5e 5.3.3");
});
Hooks.on("getHeaderControlsApplicationV2",(app,controls)=>{
 const actor=app.actor??app.document;
 if(actor?.documentName!=="Actor"||actor.type!=="character")return;
 if(!game.user.isGM&&!actor.isOwner)return;
 if(controls.some(c=>c.action==="averisBoundOpen"))return;
 controls.unshift({action:"averisBoundOpen",label:"Bound",icon:"fa-solid fa-people-arrows-left-right",visible:true,onClick:()=>void open({actor})});
});
Hooks.on("renderChatMessage",(message,html)=>{void onChat(message,html);});
// Reliable fallback for sheets that replace V14 header menus.
Hooks.on("renderApplicationV2",(app,html)=>{
 const actor=app.actor??app.document;if(actor?.documentName!=="Actor"||actor.type!=="character")return;
 if(!game.user.isGM&&!actor.isOwner)return;
 if(!html?.querySelector)return;
 const header=html.querySelector("header.window-header");if(html.querySelector(".averis-bound-header"))return;
 const button=document.createElement("button");button.type="button";button.className="averis-bound-header";button.title="Open Averis Bound";button.innerHTML='<i class="fas fa-link"></i> Bound';
 button.addEventListener("click",e=>{e.preventDefault();void open({actor});});
 if(header){const anchor=header.querySelector(".window-title");if(anchor)anchor.after(button);else header.append(button);}else {const slot=html.querySelector(".sheet-body, .tab-body, form, .sheet-content, section")??html;slot.prepend(button);}
});