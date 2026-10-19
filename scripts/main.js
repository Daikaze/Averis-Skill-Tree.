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
 const latest=validate(req);
 const before=ledgerOf(latest.doc);
 const next=commitBound(before,{id:req.requestId,a:actorKey(latest.t1),b:actorKey(latest.t2),round:latest.round,combat:!!latest.combat,templateId:template.id,targetId:target?.id,gmId:game.user.id,sceneId:scene.id,at:Date.now()});
 // Sole active GM serializes all writes. A single document flag is the source of truth.
 await latest.doc.setFlag(MODULE_ID,"ledger",next);
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
async function open({actor=null}={}){
 if(!activeScene())return notify("Open an Averis scene first.");
 const all=getTokens(),mine=all.filter(permissionToPropose);
 if(mine.length===0)return notify("You need an owned character token in this scene (or GM permissions).");
 const selected=selectedTokenOrNull();
 const assigned=actor?mine.find(t=>t.actor?.uuid===actor.uuid):null;
 const first=(assigned??(selected&&mine.includes(selected)?selected:null)??mine[0]);
 const partner=all.find(t=>t.id!==first.id);
 if(!partner)return notify("Place at least two different character tokens in the scene.");
 const target=selectedTargetOrNull();
 const variants=templates();
 const current=scopeDoc();
 const state=ledgerOf(current);
 const count=state.used[actorKey(first)]?.count??0;
 const data=await D().input({
   window:{title:"Averis Bound System"},ok:{label:"Send Bound request"},rejectClose:false,
   content:`<div class="averis-bound-form">
   <div class="averis-bound-info"><strong>⚔ Linked Fate</strong><div class="averis-bound-progress"><span>Encounter uses: ${count}/${cfg().usesPerEncounter}</span><span>Cooldown: ${cfg().cooldownRounds} rounds</span><span>One partner only once / encounter</span></div></div>
   <label>Initiator<select name="tokenA">${optionsHtml(mine.map(t=>({id:t.id,name:t.name})),first.id)}</select></label>
   <label>Partner<select name="tokenB">${optionsHtml(all.map(t=>({id:t.id,name:t.name})),partner.id)}</select></label>
   <label>Bound action<select name="templateId">${optionsHtml(variants.map(v=>({id:v.id,name:`${v.title} — ${v.category}`})))}</select></label>
   <label>Target (required for attacks/control)<select name="targetId"><option value="">No target</option>${optionsHtml(canvas.tokens.placeables.filter(t=>t.id!==first.id&&t.id!==partner.id).map(t=>({id:t.id,name:t.name})),target?.id??"")}</select></label>
   <div class="averis-bound-info"><strong>Combined Actions:</strong> Melee, Ranged, Spell, Healing, Defense, Control, Skill Challenges, Movement and Support.<p class="averis-bound-note">All rolls, saving throws, spell slots and action costs remain native D&D 5e. A GM must approve the request and the partners' consent before Bound uses are spent.</p></div>
   </div>`
 });
 const parsed=normalizedInput(data);if(!parsed)return;
 const tokenA=safeId(parsed.tokenA),tokenB=safeId(parsed.tokenB),targetId=parsed.targetId?safeId(parsed.targetId):"";
 const templateId=String(parsed.templateId??"");
 if(!tokenA||!tokenB||!oneTemplate(templateId))return notify("Choose a valid pair and Bound action.");
 const firstToken=canvas.tokens.get(tokenA);
 if(!permissionToPropose(firstToken))return notify("You do not own the initiating character.");
 const req={type:"proposal",requestId:foundry.utils.randomID(18),fromUserId:game.user.id,sceneId:activeScene().id,tokenA,tokenB,targetId,templateId};
 if(isGMCoordinator())enqueue(()=>createBound(req));
 else if(game.users.activeGM?.active){game.socket.emit(SOCKET,req);notify("Bound request sent to the active GM.","info");}
 else notify("An active GM is required to approve Bound actions.","error");
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
 await doc.setFlag(MODULE_ID,"ledger",{version:1,revision:state.revision+1,used:{},entries:[]});
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
 <label>Category<select name="category">${optionsHtml(["custom","melee","ranged","spell","skill","support","healing","movement","control","defense"].map(v=>({id:v,name:v})))}</select></label>
 <label>Action costs<input name="action" value="Action + Action" maxlength="80"></label>
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
   const entry=normalizeTemplate({...form,target:form.target==="true",opposite:form.opposite==="true"});
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
 game.settings.register(MODULE_ID,"usesPerEncounter",{name:"Uses per character / encounter",hint:"Both participants consume one use of their own pool.",scope:"world",config:true,type:Number,range:{min:1,max:10,step:1},default:2});
 game.settings.register(MODULE_ID,"cooldownRounds",{name:"Cooldown in combat rounds",hint:"Three rounds means use on round 1, next use on round 4.",scope:"world",config:true,type:Number,range:{min:0,max:20,step:1},default:3});
 game.settings.register(MODULE_ID,"preventRepeat",{name:"Do not repeat the same partner",scope:"world",config:true,type:Boolean,default:true});
 game.settings.register(MODULE_ID,"requireOpposite",{name:"Opposite-side placement for attack modes",scope:"world",config:true,type:Boolean,default:true});
 game.settings.register(MODULE_ID,"allowOutOfCombat",{name:"Allow scene/downtime Bound actions",scope:"world",config:true,type:Boolean,default:true});
 game.settings.register(MODULE_ID,"customTemplates",{name:"Custom Bound variants",scope:"world",config:false,type:Array,default:[]});
 game.settings.registerMenu(MODULE_ID,"manager",{name:"Create / delete Bound variants",label:"Manage Bound variants",hint:"Create your own combinations using D&D 5e narrative rules and optional bonus dice.",icon:"fas fa-people-arrows-left-right",type:class extends foundry.applications.api.ApplicationV2{render(...args){void customManager();return this;}},restricted:true});
 game.keybindings.register(MODULE_ID,"open",{name:"Open Averis Bound System",hint:"Propose a combination with another character",editable:[{key:"KeyB",modifiers:["ALT"]}],onDown:()=>{void open();return true;},restricted:false});
 game.modules.get(MODULE_ID).api={open,status,customManager,getVariants:()=>templates(),getLedger:()=>ledgerOf(scopeDoc())};
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