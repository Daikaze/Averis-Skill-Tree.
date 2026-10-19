/** Pure, version-agnostic Bound rules. No Foundry globals or side effects. */
export const MODULE_ID = "averis-bound-system";
export const VERSION = 1;
export const PRESETS = Object.freeze([
  { id:"twin-strike", title:"Twin Strike", category:"melee", icon:"fa-swords", action:"Action + Action", target:true, opposite:true, reach:5, formula:"1d6", bonusKind:"damage", trigger:"Both melee attacks hit the same creature", rules:"Both participants spend their normal Actions and roll their own melee attacks through D&D 5e. If both hit the chosen target, the GM may resolve one extra 1d6 Force damage. Damage is never auto-applied." },
  { id:"crossfire", title:"Crossfire", category:"ranged", icon:"fa-bullseye", action:"Action + Action", target:true, opposite:true, reach:120, formula:"1d6", bonusKind:"damage", trigger:"Both ranged attacks hit the same creature", rules:"Both participants make separate ranged attacks with appropriate weapons. On two hits, GM may roll one extra 1d6 damage. Respect normal ammunition, cover and disadvantage." },
  { id:"spell-weave", title:"Spell Weave", category:"spell", icon:"fa-wand-magic-sparkles", action:"Normal spell casting for both participants", target:true, opposite:false, reach:120, formula:"1d6", bonusKind:"damage", trigger:"Both spells successfully affect the same target", rules:"Each caster must cast a real D&D 5e spell from their sheet and pay slots, concentration, components and normal action costs. If both affect the same target, GM may roll 1d6 Force damage once. Neither spell DC nor damage stack automatically." },
  { id:"healing-chorus", title:"Healing Chorus", category:"healing", icon:"fa-heart-pulse", action:"Normal healing Action / spell for both", target:false, opposite:false, reach:30, formula:"1d6", bonusKind:"healing", trigger:"Both participants actually use healing abilities on the same ally", rules:"Participants use normal healing spells/abilities and consume resources independently. Once both contribute, GM can roll 1d6 additional healing for one ally (apply manually; cannot exceed maximum HP)." },
  { id:"guardian-link", title:"Guardian Link", category:"defense", icon:"fa-shield-halved", action:"Reaction + Reaction", target:false, opposite:false, reach:10, formula:"", bonusKind:"none", trigger:"Both spend reactions before the defended attack resolves", rules:"If within 10 ft of each other, two allies can shield one ally from a single incoming attack, granting +2 AC against that attack only. GM adjudicates; the module does not create a permanent AC effect." },
  { id:"tactical-feint", title:"Tactical Feint", category:"control", icon:"fa-masks-theater", action:"Action + Reaction", target:true, opposite:false, reach:30, formula:"1d4", bonusKind:"penalty", trigger:"Target fails Wisdom saving throw against initiator's normal feature DC (GM adjudicates)", rules:"One ally feints and the other distracts. If target fails a normal Wisdom save, subtract the GM-rolled 1d4 from its next attack roll before end of next round. Resolve the saving throw from D&D 5e, not a second independent DC system." },
  { id:"skill-synergy", title:"Skill Synergy", category:"skill", icon:"fa-handshake", action:"Action + Action (or downtime checks)", target:false, opposite:false, reach:30, formula:"1d4", bonusKind:"check", trigger:"Both participants succeed on appropriate D&D 5e skill checks", rules:"Each player rolls a normal skill check through their D&D 5e sheet; the GM chooses relevant checks and DC. On both successes, GM may award a shared 1d4 bonus to one follow-up check." },
  { id:"evasive-relay", title:"Evasive Relay", category:"movement", icon:"fa-person-running", action:"Reaction + Reaction", target:false, opposite:false, reach:10, formula:"", bonusKind:"none", trigger:"Both are conscious and voluntarily spend reactions", rules:"Both allies within 10 ft can reposition up to 10 ft each as an agreed Bound maneuver. Does not teleport, ignore obstacles or automatically ignore opportunity attacks; GM decides legal paths." },
  { id:"rallying-call", title:"Rallying Call", category:"support", icon:"fa-flag", action:"Bonus Action + Bonus Action", target:false, opposite:false, reach:30, formula:"1d4", bonusKind:"temp", trigger:"Both spend Bonus Actions to rally the group", rules:"Choose one ally within 30 ft; GM may roll 1d4 temporary HP. Temporary HP do not stack; apply the greater value per standard D&D rules." }
]);
export const DEFAULT_CONFIG = Object.freeze({usesPerEncounter:2, cooldownRounds:3, preventRepeat:true, requireOpposite:true, allowOutOfCombat:true, requireGMApproval:true});
export const MAX_HISTORY = 200;
export const CATEGORIES = ["melee", "ranged", "spell", "healing", "defense", "control", "skill", "movement", "support", "custom"];
export function safeInt(value, fallback=0) { const n=Number(value); return Number.isInteger(n) && Number.isSafeInteger(n)?n:fallback; }
export function validFormula(value) { return value === "" || (typeof value === "string" && /^(?:[1-9]\d?d(?:4|6|8|10|12|20|100))(?:\s*[+]\s*\d{1,2})?$/.test(value.trim())); }
export function normalizeTemplate(raw) {
  if (!raw || typeof raw!=="object") throw new Error("Invalid Bound template");
  const id=String(raw.id??"").trim().toLowerCase();
  if (!/^[a-z][a-z0-9-]{2,45}$/.test(id)) throw new Error("Invalid template ID");
  const title=String(raw.title??"").trim().slice(0,64);
  const rules=String(raw.rules??"").trim().slice(0,1800);
  const trigger=String(raw.trigger??"").trim().slice(0,300);
  const category=String(raw.category??"custom");
  if (title.length<3 || rules.length<10 || !CATEGORIES.includes(category)) throw new Error("Invalid template content");
  const formula=String(raw.formula??"").trim();
  if (!validFormula(formula)) throw new Error("Bonus dice must be blank or XdY [+ N], e.g. 1d6");
  const reach=safeInt(raw.reach,30);
  if (reach<0||reach>300) throw new Error("Reach must be between 0 and 300 feet");
  return {id,title,category,icon:"fa-people-arrows-left-right",action:String(raw.action??"Action + Action").slice(0,80),target:!!raw.target,opposite:!!raw.opposite,reach,formula,bonusKind:formula?String(raw.bonusKind??"check"):"none",trigger,rules};
}
export function defaultLedger() { return {version:VERSION, revision:0, used:{}, entries:[]}; }
export function normalizeLedger(input){
 const v=input && typeof input==="object" ? input :{};
 const used=v.used && typeof v.used==="object" ? v.used:{};
 const entries=Array.isArray(v.entries)?v.entries.slice(-MAX_HISTORY):[];
 return {version:VERSION,revision:safeInt(v.revision,0),used,entries};
}
export function failureReason({ ledger, a, b, round, combat, config=DEFAULT_CONFIG }){
 if (!a || !b || a===b) return "Choose two DIFFERENT characters.";
 const state=normalizeLedger(ledger);
 const max=Math.max(1,safeInt(config.usesPerEncounter,2));
 const cd=Math.max(0,safeInt(config.cooldownRounds,3));
 for(const [self,partner] of [[a,b],[b,a]]){
   const record=state.used[self] ?? {count:0,lastRound:null,partners:[]};
   if((record.count??0)>=max)return "One participant has no Bound uses left for this encounter.";
   if(config.preventRepeat!==false && (record.partners??[]).includes(partner))return "These characters already used Bound together this encounter.";
   if(combat && cd>0 && Number.isFinite(record.lastRound) && round-record.lastRound<cd) return `Cooldown active: each participant needs ${cd} rounds between Bound uses.`;
 }
 return null;
}
export function commitBound(ledger,{id,a,b,round,combat,templateId,targetId,gmId,sceneId,at}){
 const base=normalizeLedger(ledger);
 if(base.entries.some(x=>x.id===id))throw new Error("Duplicate request ID");
 const used={...base.used};
 for(const [self,other] of [[a,b],[b,a]]){
   const prev=used[self]??{count:0,lastRound:null,partners:[]};
   used[self]={count:(prev.count??0)+1,lastRound:combat?round:null,partners:[...(prev.partners??[]),other]};
 }
 const entry={id,actorA:a,actorB:b,round:combat?round:null,templateId,targetId:targetId??null,gmId,sceneId,at,bonusResolved:false};
 return {version:VERSION,revision:base.revision+1,used,entries:[...base.entries,entry].slice(-MAX_HISTORY)};
}
export function resolveBonus(ledger,id){const state=normalizeLedger(ledger);const e=state.entries.find(x=>x.id===id);if(!e)throw Error("Bound action no longer exists");if(e.bonusResolved)throw Error("Bonus already rolled");return {...state,revision:state.revision+1,entries:state.entries.map(x=>x.id===id?{...x,bonusResolved:true}:x)};}
export function oppositeSides(a,b,t, threshold=-0.45){
 const av={x:a.x-t.x,y:a.y-t.y},bv={x:b.x-t.x,y:b.y-t.y};
 const mag=Math.hypot(av.x,av.y)*Math.hypot(bv.x,bv.y);
 if(mag<0.00001)return false;
 return (av.x*bv.x+av.y*bv.y)/mag <= threshold;
}
export function degreesPoint(p){if(!p)return null;return {x:Number(p.x??0),y:Number(p.y??0)};}
export function distanceFeet(a,b,gridPx,gridDistance){const pixels=Math.hypot(a.x-b.x,a.y-b.y);if(!(gridPx>0 && gridDistance>0))return Infinity;return pixels / gridPx*gridDistance;}