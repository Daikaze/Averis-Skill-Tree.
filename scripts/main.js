import {AFFINITIES,AFFINITY_MAP} from './catalog.mjs';
import {redactDC} from './redact.mjs';
import {MODULE_ID,DC_BY_LEVEL,CHECKS,MAX_NORMAL,normalizeState,emptyState,grantAffinity,gmSetLevel,removeAffinity,nextCheck,attemptCheck,useAbility,longRest,maxUses,knownCount} from './engine.mjs';

const SOCKET=`module.${MODULE_ID}`;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const warn=s=>ui.notifications?.warn?.(s);
const info=s=>ui.notifications?.info?.(s);
const err=e=>{console.error('[Averis Affinity]',e);ui.notifications?.error?.(`Affinity Manager: ${e?.message??e}`);};
const dialog=()=>foundry.applications.api.DialogV2;
const isGM=()=>!!game.user?.isGM;
const nowWorld=()=>Number(game.time?.worldTime??0);
const days=s=>`${Math.floor(s/86400)}d ${Math.ceil((s%86400)/3600)}h`;
const profile=a=>normalizeState(a?.getFlag?.(MODULE_ID,'progress'));
const ownership=a=>!!a&&(isGM()||!!a.testUserPermission?.(game.user,'OWNER'));
const isActor=a=>a?.documentName==='Actor'&&a.type==='character';
const visibleActors=()=>[...(game.actors?.contents??[])].filter(a=>isActor(a)&&ownership(a)).sort((a,b)=>a.name.localeCompare(b.name));
const allTeachers=id=>[...(game.actors?.contents??[])].filter(a=>Math.max(profile(a).known[id]?.level??0,Number(a.getFlag(MODULE_ID,'mastery')?.[id]??0))>=5);
const pb=a=>Math.max(1,Math.min(6,Number(a?.system?.attributes?.prof??2)||2));
const wait=new Set(),requestTimes=new Map();
const iso=()=>new Date().toISOString().slice(0,16).replace('T',' ');
function markdown(text,gm=false){
 const raw=gm?String(text):redactDC(String(text));
 return raw.split(/\n+/).map(line=>{
  const bullet=/^\s*-\s*/.test(line);let t=esc(line.replace(/^\s*-\s*/,''));
  t=t.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/\*([^*]+)\*/g,'<em>$1</em>');
  if(!t.trim()||t==='---')return '';
  return `<p class="aam-rule ${bullet?'bullet':''}">${bullet?'• ':''}${t}</p>`;
 }).join('');
}
function safeInput(raw){if(!raw)return null;if(raw instanceof FormData)return Object.fromEntries(raw.entries());if(raw?.object&&typeof raw.object==='object')return raw.object;return typeof raw==='object'?raw:null;}
function actorById(id){const a=game.actors?.get?.(id);return isActor(a)?a:null;}
async function persist(a,newState){if(!a||!a.canUserModify?.(game.user,'update'))throw Error('You cannot update this Actor.');await a.setFlag(MODULE_ID,'progress',newState);}
async function change(a,callback){if(wait.has(a?.uuid))throw Error('An Affinity update is already running for this character.');wait.add(a.uuid);try{const before=profile(a),newState=callback(before);await persist(a,newState);dashboard?.render({force:true});return newState;}finally{wait.delete(a.uuid);}}
async function confirm(title,body,action='Confirm') {return dialog().confirm({window:{title},content:`<div class="aam-confirm">${body}</div>`,yes:{label:action},no:{label:'Cancel'},rejectClose:false});}
async function input(title,content,button='Save') {return safeInput(await dialog().input({window:{title},content:`<div class="aam-dialog">${content}</div>`,ok:{label:button},rejectClose:false}));}
function sendRequest(a,id,type){
 if(!a||!ownership(a))throw Error('Choose an owned character.');
 if(!game.users?.activeGM?.active)return warn('An active GM must be connected.');
 const t=Date.now();if(t-(requestTimes.get(a.id)??0)<5000)return warn('Please avoid repeated requests.');requestTimes.set(a.id,t);
 game.socket.emit(SOCKET,{type:'request',actorId:a.id,affinityId:id,kind:type,fromUserId:game.user.id});info('Request sent to the GM.');
}
async function handleRequest(msg){
 if(!isGM()||game.users?.activeGM?.id!==game.user.id||!msg||msg.type!=='request')return;
 const a=actorById(msg.actorId),aff=AFFINITY_MAP[msg.affinityId],requester=game.users.get(msg.fromUserId);
 if(!a||!aff||aff.unavailable||!requester||!a.testUserPermission(requester,'OWNER'))return;
 const key=`${requester.id}:${a.id}`,time=Date.now();if(time-(requestTimes.get(key)??0)<5000)return;requestTimes.set(key,time);
 const good=await confirm('Affinity request',`<p><strong>${esc(requester.name)}</strong> requests ${esc(msg.kind==='upgrade'?'upgrade training':'to learn')} <strong>${esc(aff.name)}</strong> for ${esc(a.name)}.</p><p>This only opens the GM dashboard. No levels are granted automatically.</p>`,'Open GM panel');
 if(good)await open({actor:a,affinity:aff.id});
}
// GM controls: grants, teacher mastery, secret rolls; all mutable progression stays authoritative on the Actor.
async function grant(a,id,source){
 if(!isGM())throw Error('GM permission required.');const aff=AFFINITY_MAP[id];if(!aff||aff.unavailable)throw Error('No rules are available for this Affinity.');
 let teacherId=null,teacherLevel=null;
 if(source==='teacher'){
   const options=allTeachers(id).filter(x=>x.id!==a.id);
   if(!options.length)throw Error('No Level 5 teacher for this Affinity. Mark an NPC as Master first, or use Innate acquisition.');
   const raw=await input('Learn from Level 5 teacher',`<p>Only creatures with Level 5 of ${esc(aff.name)} can teach it.</p><label>Qualified teacher<select name="teacher">${options.map(x=>`<option value="${esc(x.id)}">${esc(x.name)}</option>`).join('')}</select></label>`,'Learn');
   if(!raw)return;
   const teacher=game.actors.get(raw.teacher);if(!teacher||teacher.id===a.id)throw Error('Invalid teacher.');
   teacherId=teacher.id;teacherLevel=Math.max(profile(teacher).known[id]?.level??0,Number(teacher.getFlag(MODULE_ID,'mastery')?.[id]??0));
 }
 const yes=await confirm('Grant Affinity',`<p>Grant <strong>${esc(aff.name)}</strong> to ${esc(a.name)}?</p><p>Method: ${esc(source)}. Starting at Level 0 — first upgrade still requires three checks.</p>`,'Grant Affinity');
 if(!yes)return;
 await change(a,s=>grantAffinity(s,id,{source,teacherId,teacherLevel}));info(`${a.name} has learned ${aff.name}.`);
}
async function markTeacher(id){
 if(!isGM())throw Error('GM only.');const actors=[...(game.actors?.contents??[])].filter(a=>a.documentName==='Actor');
 const raw=await input('GM · Authorize Affinity teacher',`<p>Mark a creature as Level 5 teacher for <b>${esc(AFFINITY_MAP[id]?.name)}</b>. This only grants teaching permission, not attacks or spells.</p><label>Creature<select name="actorId">${actors.map(a=>`<option value="${esc(a.id)}">${esc(a.name)}</option>`).join('')}</select></label>`,'Mark Level 5');
 if(!raw)return;const teacher=game.actors.get(raw.actorId);if(!teacher)throw Error('Creature not found.');
 const current=teacher.getFlag(MODULE_ID,'mastery')??{};await teacher.setFlag(MODULE_ID,'mastery',{...current,[id]:5});info(`${teacher.name} can teach ${AFFINITY_MAP[id].name}.`);
}
async function adjustLevel(a,id){if(!isGM())throw Error('GM only.');const raw=await input('GM · Adjust Affinity Level',`<p>Set Level 0–5 for <b>${esc(AFFINITY_MAP[id].name)}</b>. This is an override, not a training roll.</p><label>New level<input name="level" type="number" min="0" max="5" step="1" value="${profile(a).known[id]?.level??0}" required></label>`,'Set Level');if(!raw)return;const l=Number(raw.level);if(!Number.isInteger(l)||l<0||l>5)throw Error('Enter a valid Level between 0 and 5.');if(!await confirm('Confirm GM override',`Set ${esc(a.name)} — ${esc(AFFINITY_MAP[id].name)} to Level ${l}?`,'Confirm'))return;await change(a,s=>gmSetLevel(s,id,l));}
async function removeKnown(a,id){if(!isGM())throw Error('GM only.');if(!await confirm('Remove Affinity',`Remove ${esc(AFFINITY_MAP[id].name)} from ${esc(a.name)}? This deletes its progress and saved uses.`,'Remove'))return;await change(a,s=>removeAffinity(s,id));}
// The GM rolls with the current numerical D&D 5e sheet modifiers; exceptional conditional modifiers may be entered via Record Total instead.
function checkModifier(a,check){
 const system=a.system;
 if(check==='con'){const v=Number(system?.abilities?.con?.mod??0);const extra=Number(system?.abilities?.con?.checkBonus??0);return v+(Number.isFinite(extra)?extra:0);}
 return Number(system?.skills?.[check]?.total??system?.skills?.[check]?.mod??0);
}
async function runCheck(a,id,manual=false){
 if(!isGM())throw Error('Only the GM can determine a training check.');
 const next=nextCheck(profile(a),id,nowWorld());if(next.reason)throw Error(next.reason);
 const affinity=AFFINITY_MAP[id],name={con:'Constitution Check',arc:'Arcana Check',ins:'Insight Check'}[next.check];
 const dc=DC_BY_LEVEL[next.level-1];
 let total,formula='Manual';
 if(manual){
   const raw=await input(`Record ${name} · GM private`,`<p>${esc(a.name)} · ${esc(affinity.name)} to Level ${next.level}.</p><p><strong>Required DC ${dc}</strong> (GM only).</p><label>Final D&D check total<input type="number" name="total" min="-100" max="1000" required></label>`,'Record Result');
   if(!raw)return;total=Number(raw.total);
 }else{
   let mod=checkModifier(a,next.check);if(!Number.isFinite(mod))throw Error('No numeric D&D modifier found. Use Record Total instead.');
   const raw=await input(`Roll ${name} · GM only`,`<p>Target DC: <b>${dc}</b>. Sheet modifier: <b>${mod>=0?'+':''}${mod}</b>.</p><p>Rolls the numeric sheet modifier. For unusual bonuses or effects, use <b>Record Total</b>.</p><label>Roll mode<select name="mode"><option value="normal">Normal</option><option value="adv">Advantage</option><option value="dis">Disadvantage</option></select></label><label>Situational bonus<input name="extra" type="number" step="1" value="0" min="-20" max="20"></label>`,'Roll Secretly');
   if(!raw)return;const extra=Number(raw.extra);if(!Number.isInteger(extra)||Math.abs(extra)>20)throw Error('Invalid bonus.');
   const dice=raw.mode==='adv'?'2d20kh':raw.mode==='dis'?'2d20kl':'1d20';formula=`${dice} ${mod+extra<0?'-':'+'} ${Math.abs(mod+extra)}`;
   const roll=await (new Roll(formula)).evaluate();total=roll.total;
   try{await roll.toMessage({speaker:ChatMessage.getSpeaker({actor:a}),flavor:`[GM PRIVATE] ${affinity.name} ${name} — Level ${next.level}, DC ${dc}`,whisper:ChatMessage.getWhisperRecipients('GM').map(u=>u.id)}, {rollMode:'gmroll'});}catch(e){console.warn('[Affinity] Private roll log failed',e);}
 }
 const result=attemptCheck(profile(a),id,{check:next.check,total,worldTime:nowWorld(),failDays:game.settings.get(MODULE_ID,'failureDays'),successDays:game.settings.get(MODULE_ID,'successDays')});
 await change(a,()=>result.state);
 const summary=`${a.name} · ${affinity.name}: ${name} ${result.pass?'SUCCEEDED':'FAILED'}${result.levelUp?` — Affinity Level ${result.newLevel} unlocked!`:''}`;
 // Public message must contain NO target DC or secret difficulty.
 await ChatMessage.create({speaker:ChatMessage.getSpeaker({actor:a}),content:`<div class="aam-chat"><b>Affinity Training</b><p>${esc(summary)}</p><small>${result.levelUp?'All 3 checks passed.':'Progress updated.'}</small></div>`});
 info(summary);
}
async function activate(a,id,level){
 if(!ownership(a))throw Error('You do not own this character.');const aff=AFFINITY_MAP[id],ability=aff?.abilities?.find(s=>s.level===level);if(!ability)throw Error('Ability not found.');
 const limit=maxUses(ability,pb(a)),used=profile(a).usage[`${id}:${level}`]??0;
 if(limit!==null&&used>=limit)throw Error('No uses remaining until Long Rest.');
 const ok=await confirm(`Use ${ability.title}`,`<p>Use <b>${esc(ability.title)}</b>?</p><p>${limit===null?'This ability has no recorded finite use limit.':`Remaining uses: ${limit-used} / ${limit}. One use will be recorded.`}</p><p>Apply attacks, saves, effects and damage normally in D&D 5e.</p>`,'Use Ability');
 if(!ok)return;
 await change(a,s=>useAbility(s,id,level,pb(a)));
 // Plain description in chat never exposes any source save DC to non-GMs.
 await ChatMessage.create({speaker:ChatMessage.getSpeaker({actor:a}),content:`<div class="aam-chat"><h3>${esc(aff.name)} · ${esc(ability.title)}</h3>${markdown(ability.description,false)}<small>Track rolls and effects with regular D&D 5e activities. Uses are recorded by Affinity Manager.</small></div>`});
}
async function quickDice(a,id,level,formula){
 if(!ownership(a))throw Error('Not your Actor.');const ab=AFFINITY_MAP[id]?.abilities[level-1];if(!ab||!profile(a).known[id]||profile(a).known[id].level<level||!ab.dice.includes(formula))throw Error('Dice not available for this unlocked ability.');
 const roll=await(new Roll(formula)).evaluate();await roll.toMessage({speaker:ChatMessage.getSpeaker({actor:a}),flavor:`${esc(ab.title)} · Optional dice (${esc(formula)}) — GM adjudicates`});
}
function actorOptions(sel){return visibleActors().map(a=>`<option value="${esc(a.id)}" ${sel===a.id?'selected':''}>${esc(a.name)}</option>`).join('');}
const ALL=AFFINITIES;
const icons=aff=>`<i class="fa-solid ${esc(aff.icon)}" aria-hidden="true"></i>`;
class AffinityDashboard extends foundry.applications.api.ApplicationV2{
 static DEFAULT_OPTIONS={id:'averis-affinity-manager-ui',classes:['aam-window'],window:{title:'Averis · Affinity Manager',icon:'fas fa-gem',resizable:true},position:{width:1130,height:730}};
 constructor(opts={}){super(opts);this.actorId='';this.affinityId='fire';this.tab='abilities';this.search='';this.compact=false;this._resize=null;}
 async show(actor=null,affinity=null){if(actor)this.actorId=actor.id;if(affinity)this.affinityId=affinity;const w=Math.min(1160,Math.max(360,window.innerWidth-70)),h=Math.min(800,Math.max(340,window.innerHeight-80));if(!this.rendered){await this.render({force:true});this.setPosition({width:w,height:h});}else{this.bringToFront();await this.render({force:true});}}
 async _renderHTML(){
  const actors=visibleActors();if(!actors.some(a=>a.id===this.actorId))this.actorId=actors[0]?.id??'';
  const actor=actorById(this.actorId),state=profile(actor),aff=AFFINITY_MAP[this.affinityId]??AFFINITIES[0],known=state.known[aff.id],lv=known?.level??-1;
  const normal=knownCount(state),owned=ownership(actor),gm=isGM(),next=known?nextCheck(state,aff.id,nowWorld()):null;
  const tiles=ALL.map(a=>{const k=state.known[a.id];const unavailable=!!a.unavailable;return `<button class="aam-aff ${a.id===aff.id?'active':''} ${k?'known':''} ${unavailable?'unavailable':''}" data-action="affinity" data-id="${a.id}" style="--aff-color:${a.color}" type="button" aria-pressed="${a.id===aff.id}"><span class="aam-emblem">${icons(a)}</span><span class="aam-aff-content"><b>${esc(a.name)}</b><small>${unavailable?'Rules unavailable':k?`Level ${k.level} / 5`:a.special?'Special · GM Only':'Not learned'}</small></span><i class="fas ${k?'fa-check-circle':'fa-chevron-right'}" aria-hidden="true"></i></button>`;}).join('');
  const abilityCards=aff.abilities.map((a,i)=>{const unlock=known&&lv>=a.level,limit=maxUses(a,pb(actor)),used=state.usage[`${aff.id}:${a.level}`]??0,left=limit===null?null:Math.max(0,limit-used);return `<article class="aam-ability ${unlock?'unlocked':'locked'}"><div class="aam-ability-title"><span class="aam-num">${String(a.level).padStart(2,'0')}</span><div><small>LEVEL ${a.level}</small><h3>${esc(a.title)}</h3></div><span class="aam-status ${unlock?'yes':''}">${unlock?'Unlocked':'Locked'}</span></div><div class="aam-ability-body">${unlock?markdown(a.description,gm):`<p>Reach Affinity Level ${a.level} to unlock this ability.</p>`}</div>${unlock?`<div class="aam-ability-actions"><div class="aam-uses">${limit===null?'No fixed use limit':`${left} / ${limit} uses left`}</div><button type="button" data-action="use" data-level="${a.level}" ${left===0?'disabled':''}><i class="fas fa-bolt"></i> Use / Share</button>${a.dice.length?`<div class="aam-dice">${a.dice.slice(0,4).map(d=>`<button type="button" title="Roll ${esc(d)} without applying damage" data-action="dice" data-level="${a.level}" data-dice="${esc(d)}">${esc(d)}</button>`).join('')}</div>`:''}</div>`:''}</article>`;}).join('');
  const pill=known?`<span class="aam-pill success">Known · Level ${lv}/5</span>`:`<span class="aam-pill">${aff.special?'Special Affinity':'Unlearned'}</span>`;
  const progress=known?`<div class="aam-progress"><div class="aam-progress-track"><span style="width:${lv/5*100}%;background:${aff.color}"></span></div><div class="aam-prog-label">${lv}/5 levels unlocked · ${known.successes.length}/3 checks completed toward next level</div></div>`:'';
  const gmControls=gm&&actor?`<section class="aam-gm"><div class="aam-label"><i class="fas fa-crown"></i> GM CONTROL PANEL <span>PRIVATE DCs</span></div><div class="aam-gm-actions">${aff.unavailable?'<p>No source abilities supplied for this Affinity.</p>':known?`<button data-action="roll"><i class="fas fa-dice-d20"></i> Roll next check</button><button data-action="record">Record total</button><button data-action="set-level">Set level</button><button data-action="remove">Remove</button>`:`${aff.special?'':'<button data-action="grant-innate">Grant innate</button>'}${aff.special?'<button data-action="grant-special">Grant special</button>':'<button data-action="grant-teacher">Learn from teacher</button><button data-action="mark-teacher">Mark Lv5 teacher</button>'}`}</div>${known&&lv<5?`<div class="aam-gm-secret">Next: <b>${esc({con:'CON',arc:'Arcana',ins:'Insight'}[next?.check]??'Cooldown')}</b> · Target DC <b>${DC_BY_LEVEL[lv]}</b> · ${next?.reason?esc(next.reason):'Ready to check'}</div>`:''}</section>`:'';
  const playerCta=!gm&&actor&&!aff.unavailable?`<button type="button" class="aam-request" data-action="request"><i class="fas fa-paper-plane"></i> ${known?'Request upgrade training':'Request to learn Affinity'}</button>`:'';
  const footer=`<footer class="aam-footer"><button type="button" data-action="long-rest"><i class="fas fa-bed"></i> Reset Affinity Uses (Long Rest)</button><span><i class="fas fa-shield-alt"></i> Powered by D&D 5e 5.3.3 · GM-approved progression</span><span>Ability effects are GM-adjudicated</span></footer>`;
  const history=state.history.slice(-35).reverse().map(e=>`<div class="aam-event"><span>${esc((AFFINITY_MAP[e.id]?.name??'Affinity'))}</span><b>${esc(e.type==='check'?`${{con:'CON',arc:'Arcana',ins:'Insight'}[e.check]??'Check'} ${e.pass?'Passed':'Failed'}`:e.type==='grant'?'Learned':e.type==='use'?e.ability:e.type==='long-rest'?'Long Rest':e.type==='gm-set'?'GM level set':e.type==='remove'?'Removed':e.type)}</b><small>${e.levelUp?'Level Up!':e.type==='check'?`Step for Lv ${e.level}`:e.source??''}</small></div>`).join('')||'<div class="aam-empty">No Affinity history yet.</div>';
  const content=aff.unavailable?`<div class="aam-empty"><h3>Thunder rules not supplied</h3><p>The provided Affinity document includes “Another Affinity” but no Thunder abilities. This tree is intentionally disabled to avoid inventing rules.</p></div>`:this.tab==='abilities'?`<div class="aam-cards">${abilityCards}</div>`:this.tab==='training'?`<div class="aam-info-card"><h3>Upgrade Path</h3><p>Each upgrade requires three successful checks in order: Constitution, Arcana and Insight.</p><p>Successful checks are saved, even when a later check fails. Retry waiting times are governed by world time.</p>${known?`<div class="aam-check-track">${CHECKS.map(c=>`<div class="${known.successes.includes(c)?'done':''}"><i class="fas ${known.successes.includes(c)?'fa-circle-check':'fa-circle'}"></i><b>${{con:'Constitution',arc:'Arcana',ins:'Insight'}[c]}</b><span>${known.successes.includes(c)?'Success':'Pending'}</span>${gm&&lv<5?`<small>DC ${DC_BY_LEVEL[lv]}</small>`:''}</div>`).join('')}</div><p>${next?.reason?`Training status: ${esc(next.reason)}${next.remaining?` — ${days(next.remaining)} remaining`:''}`:next?.check?`Next check: ${{con:'Constitution',arc:'Arcana',ins:'Insight'}[next.check]}`:'Maximum level achieved.'}</p>`:'<p>Learn an Affinity first to begin training.</p>'}</div>`:`<div class="aam-history">${history}</div>`;
  const html=`<section class="aam-shell" style="--aff-color:${aff.color}"><div class="aam-top"><div class="aam-brand"><span class="aam-logo"><i class="fas fa-gem"></i></span><div><span class="aam-overline">THE POWER WITHIN</span><h1>Averis <em>Affinity</em> Manager</h1></div></div><div class="aam-top-status"><span>${gm?'GAME MASTER':'ADVENTURER'}</span><b>V14 · 5e 5.3.3</b></div></div><div class="aam-layout"><aside class="aam-sidebar"><div class="aam-sidebar-head"><label>CHARACTER</label><select data-field="actorId" aria-label="Character">${actorOptions(this.actorId)}</select><div class="aam-limit">Known ${normal} / ${MAX_NORMAL} <small>Special excluded</small></div></div><div class="aam-sidebar-title">ELEMENTAL AFFINITIES <span>${ALL.filter(x=>!x.unavailable).length}</span></div><div class="aam-aff-list">${tiles}</div></aside><main class="aam-main"><div class="aam-aff-hero"><div class="aam-glow"></div><div class="aam-hero-icon">${icons(aff)}</div><div class="aam-hero-content"><small>AFFINITY PATH</small><h2>${esc(aff.name)}</h2><p>${pill} ${aff.special?'<span class="aam-pill special">Special</span>':''}</p>${progress}</div></div><div class="aam-tab-bar"><button type="button" data-action="tab" data-id="abilities" class="${this.tab==='abilities'?'current':''}"><i class="fas fa-book-open"></i> Abilities</button><button type="button" data-action="tab" data-id="training" class="${this.tab==='training'?'current':''}"><i class="fas fa-chart-line"></i> Training</button><button type="button" data-action="tab" data-id="history" class="${this.tab==='history'?'current':''}"><i class="fas fa-clock-rotate-left"></i> History</button></div><div class="aam-main-scroll">${content}</div><div class="aam-bottom">${gmControls}${playerCta}${footer}</div></main></div></section>`;
  const el=document.createElement('div');el.innerHTML=html;return el.firstElementChild;
 }
 _replaceHTML(rendered,content){content.replaceChildren(rendered);}
 async _onRender(context,opts){await super._onRender(context,opts);this._resize?.disconnect();const root=this.element?.querySelector('.aam-shell');if(!root)return;const compact=()=>root.classList.toggle('compact',root.clientWidth<800);compact();this._resize=new ResizeObserver(compact);this._resize.observe(root);
  root.querySelector('[data-field="actorId"]')?.addEventListener('change',e=>{this.actorId=e.target.value;this.render({force:true});});
  for(const btn of root.querySelectorAll('button[data-action]'))btn.addEventListener('click',async e=>{e.preventDefault();const action=btn.dataset.action,id=btn.dataset.id,actor=actorById(this.actorId),aff=this.affinityId;try{
   if(action==='affinity'){this.affinityId=id;this.tab='abilities';await this.render({force:true});return;}
   if(action==='tab'){this.tab=id;await this.render({force:true});return;}
   if(!actor)throw Error('Select a character.');
   if(action==='long-rest')await resetUses(actor);
   if(action==='request')sendRequest(actor,aff,profile(actor).known[aff]?'upgrade':'learn');
   if(action==='grant-innate')await grant(actor,aff,'innate');
   if(action==='grant-teacher')await grant(actor,aff,'teacher');
   if(action==='grant-special')await grant(actor,aff,'gm-special');
   if(action==='mark-teacher')await markTeacher(aff);
   if(action==='roll')await runCheck(actor,aff,false);
   if(action==='record')await runCheck(actor,aff,true);
   if(action==='set-level')await adjustLevel(actor,aff);
   if(action==='remove')await removeKnown(actor,aff);
   if(action==='use')await activate(actor,aff,Number(btn.dataset.level));
   if(action==='dice')await quickDice(actor,aff,Number(btn.dataset.level),btn.dataset.dice);
  }catch(ex){err(ex);}});
 }
 async close(...args){this._resize?.disconnect();return super.close(...args);}
}
let dashboard=null;
async function open({actor=null,affinity=null}={}){if(!visibleActors().length)return warn('No accessible world character Actors.');dashboard??=new AffinityDashboard();await dashboard.show(actor,affinity);}
async function resetUses(a){if(!ownership(a))throw Error('No permission.');if(!await confirm('Long Rest · Reset Affinities',`Reset all tracked Affinity uses for ${esc(a.name)}? This does not change D&D spell slots or standard rest resources.`,'Reset Affinity Uses'))return;await change(a,s=>longRest(s));}
Hooks.once('init',()=>{
 game.settings.register(MODULE_ID,'failureDays',{name:'Training cooldown after failed check (world days)',scope:'world',config:true,type:Number,range:{min:0,max:30,step:1},default:3});
 game.settings.register(MODULE_ID,'successDays',{name:'Training cooldown after upgrading (world days)',scope:'world',config:true,type:Number,range:{min:0,max:30,step:1},default:7});
 game.keybindings.register(MODULE_ID,'open',{name:'Open Averis Affinity Manager',editable:[{key:'KeyA',modifiers:['ALT']}],onDown:()=>{void open();return true;},restricted:false});
 game.modules.get(MODULE_ID).api={open,grantAffinity:grant,resetUses,getProgress:profile,getCatalog:()=>AFFINITIES};
});
Hooks.once('ready',()=>{if(game.system?.id!=='dnd5e')warn('Averis Affinity Manager requires the D&D 5e system.');game.socket?.on(SOCKET,msg=>void handleRequest(msg).catch(err));});
Hooks.on('getHeaderControlsApplicationV2',(app,controls)=>{const actor=app.actor??app.document;if(!isActor(actor)||(!ownership(actor)))return;controls.unshift({icon:'fas fa-gem',label:'Affinity Manager',action:()=>void open({actor})});});
Hooks.on('updateActor',a=>{if(dashboard?.rendered&&a.id===dashboard.actorId)dashboard.render({force:true});});