import {AFFINITY_MAP} from './catalog.mjs';
export const MODULE_ID='averis-affinity-manager';
export const DC_BY_LEVEL=Object.freeze([10,13,15,17,20]);
export const CHECKS=Object.freeze(['con','arc','ins']);
export const MAX_NORMAL=3;
export const HISTORY_LIMIT=70;
const day=86400;
const isObj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const cleanInt=(x,def=0)=>Number.isSafeInteger(Number(x))?Number(x):def;
const clamp=(x,lo,hi)=>Math.max(lo,Math.min(hi,cleanInt(x,lo)));
export function emptyState(){return {version:1,known:{},usage:{},history:[]};}
export function normalizeState(x){
  const raw=isObj(x)?x:{};const known={};
  for(const [id,v] of Object.entries(isObj(raw.known)?raw.known:{})){
    if(!AFFINITY_MAP[id]||AFFINITY_MAP[id].unavailable)continue;
    const o=isObj(v)?v:{};
    known[id]={level:clamp(o.level,0,5),successes:[...new Set(Array.isArray(o.successes)?o.successes:[])].filter(q=>CHECKS.includes(q)),retryAt:Number.isFinite(o.retryAt)?o.retryAt:0};
    if(known[id].level>=5)known[id].successes=[];
  }
  const usage={};
  for(const [id,u] of Object.entries(isObj(raw.usage)?raw.usage:{})){
    if(/^(fire|earth|wind|water|lightning|psychic|necrotic|poison|acid|ice|radiant|force|blood):[1-5]$/.test(id)) usage[id]=clamp(u,0,999);
  }
  return {version:1,known,usage,history:Array.isArray(raw.history)?raw.history.slice(-HISTORY_LIMIT).filter(isObj):[]};
}
export const knownCount=state=>Object.entries(normalizeState(state).known).filter(([id])=>!AFFINITY_MAP[id].special).length;
export function maxUses(ability,actorPb=2){
  if(!ability?.uses)return null;
  return ability.uses.kind==='fixed'?ability.uses.value:clamp(actorPb,1,6);
}
export function recordHistory(state,entry){const s=normalizeState(state);s.history=[...s.history,{at:Date.now(),...entry}].slice(-HISTORY_LIMIT);return s;}
export function grantAffinity(state,id,{source='innate',teacherId=null,teacherLevel=null}={}){
  const s=normalizeState(state),aff=AFFINITY_MAP[id];
  if(!aff||aff.unavailable)throw Error('Affinity rules are not available yet.');
  if(s.known[id])throw Error('Character already knows this Affinity.');
  if(aff.special&&source!=='gm-special')throw Error('Special Affinities require GM authorization.');
  if(!aff.special&&knownCount(s)>=MAX_NORMAL)throw Error('A character can know at most 3 normal Affinities.');
  if(source==='teacher'){
    if(!teacherId||!Number.isFinite(Number(teacherLevel))||Number(teacherLevel)<5)throw Error('The teaching creature must possess Level 5 of this Affinity.');
  }else if(!['innate','gm-special'].includes(source))throw Error('Invalid learning source.');
  s.known[id]={level:0,successes:[],retryAt:0};
  return recordHistory(s,{type:'grant',id,source,teacherId});
}
export function nextCheck(state,id,worldTime=0){
  const s=normalizeState(state),a=s.known[id];
  if(!a)return {reason:'Affinity is not learned.'};
  if(a.level>=5)return {reason:'Affinity is already at maximum level.'};
  if(Number(worldTime)<a.retryAt)return {reason:'Upgrade attempt is on cooldown.',remaining:a.retryAt-Number(worldTime)};
  const check=CHECKS.find(k=>!a.successes.includes(k));
  return {check,level:a.level+1,successes:[...a.successes]};
}
export function attemptCheck(state,id,{check,total,worldTime,failDays=3,successDays=7}={}){
  const s=normalizeState(state),p=nextCheck(s,id,worldTime);
  if(p.reason)throw Error(p.reason);
  if(check!==p.check)throw Error('Checks must be completed in order: Constitution, Arcana, Insight.');
  const n=Number(total);if(!Number.isFinite(n)||n< -100||n>1000)throw Error('Invalid check total.');
  const level=p.level,dc=DC_BY_LEVEL[level-1],pass=n>=dc;
  const a=s.known[id];
  if(pass)a.successes.push(check);
  else a.retryAt=Number(worldTime)+clamp(failDays,0,365)*day;
  let levelUp=false;
  if(a.successes.length===3){a.level++;a.successes=[];a.retryAt=Number(worldTime)+clamp(successDays,0,365)*day;levelUp=true;}
  const output=recordHistory(s,{type:'check',id,check,total:n,pass,level,levelUp});
  return {state:output,pass,levelUp,dc,newLevel:a.level,nextAt:a.retryAt};
}
export function useAbility(state,id,level,pb){
  const s=normalizeState(state),aff=AFFINITY_MAP[id],ability=aff?.abilities.find(a=>a.level===level);
  if(!ability||!s.known[id]||s.known[id].level<level)throw Error('That ability is locked.');
  const limit=maxUses(ability,pb),key=`${id}:${level}`,used=s.usage[key]??0;
  if(limit!==null&&used>=limit)throw Error('No Long Rest uses remain.');
  if(limit!==null)s.usage[key]=used+1;
  return recordHistory(s,{type:'use',id,level,ability:ability.title});
}
export function longRest(state){const s=normalizeState(state);s.usage={};return recordHistory(s,{type:'long-rest'});}
export function gmSetLevel(state,id,level){const s=normalizeState(state);if(!s.known[id])throw Error('Grant Affinity before adjusting level.');s.known[id].level=clamp(level,0,5);s.known[id].successes=[];s.known[id].retryAt=0;return recordHistory(s,{type:'gm-set',id,level:s.known[id].level});}
export function removeAffinity(state,id){const s=normalizeState(state);if(!s.known[id])throw Error('This Affinity is not known.');delete s.known[id];for(let i=1;i<=5;i++)delete s.usage[`${id}:${i}`];return recordHistory(s,{type:'remove',id});}