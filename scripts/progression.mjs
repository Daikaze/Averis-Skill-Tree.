/** Pure, migration-safe, per-character Bound advancement calculations. */
export const MAX_LEVEL=20;
export const XP_ON_BOUND=15;
export const PROGRESS_VERSION=2;
export function xpForNext(level){return Math.round(60+Math.max(0,level-1)*40);} // incremental XP for a single level
export function totalXpForLevel(level){const l=Math.max(1,Math.min(MAX_LEVEL,Math.floor(Number(level)||1)));return (l-1)*60+40*(l-1)*(l-2)/2;}
export function levelForXp(xp){const x=Math.max(0,Math.floor(Number(xp)||0));let level=1;while(level<MAX_LEVEL&&x>=totalXpForLevel(level+1))level++;return level;}
export function bondRank(count){const n=Math.max(0,Math.floor(Number(count)||0));return n>=10?4:n>=6?3:n>=3?2:1;}
export function defaultProgress(){return {version:PROGRESS_VERSION,xp:0,level:1,pairs:{},awardIds:[],revision:0};}
export function normalizeProgress(input){const s=input&&typeof input==='object'?input:{};const xp=Math.min(9999999,Math.max(0,Math.trunc(Number(s.xp)||0)));
 const pairs={};if(s.pairs&&typeof s.pairs==='object'&&!Array.isArray(s.pairs))for(const [id,value] of Object.entries(s.pairs).slice(0,200)){if(id.length<260)pairs[id]=Math.max(0,Math.min(9999,Math.trunc(Number(value)||0)));}
 return {version:PROGRESS_VERSION,xp,level:levelForXp(xp),pairs,awardIds:Array.isArray(s.awardIds)?s.awardIds.filter(v=>typeof v==='string').slice(-300):[],revision:Math.max(0,Math.trunc(Number(s.revision)||0))};
}
export function addXp(raw,delta){const p=normalizeProgress(raw);if(!Number.isFinite(Number(delta))||!Number.isInteger(Number(delta))||Math.abs(Number(delta))>100000)throw Error('Invalid XP amount');return {...p,xp:Math.min(9999999,Math.max(0,p.xp+Number(delta))),level:levelForXp(Math.min(9999999,Math.max(0,p.xp+Number(delta)))),revision:p.revision+1};}
export function awardBound(raw,eventId,partnerId,xp=XP_ON_BOUND){const p=normalizeProgress(raw);if(!/^[a-zA-Z0-9_-]{8,64}$/.test(String(eventId)))throw Error('Invalid Bound event ID');if(!partnerId||typeof partnerId!=='string'||partnerId.length>260)throw Error('Invalid partner');if(p.awardIds.includes(eventId))return {progress:p,awarded:false};const upgraded=addXp(p,xp);upgraded.pairs[partnerId]=Math.min(9999,(upgraded.pairs[partnerId]??0)+1);upgraded.awardIds=[...p.awardIds,eventId].slice(-300);return {progress:upgraded,awarded:true};}
export function isUnlocked(variant,progress,partnerCount=0){const p=normalizeProgress(progress);return p.level >= (Number(variant.level)||1)&&bondRank(partnerCount)>=(Number(variant.requiredBondRank)||1);}
export function unlockReason(variant,progress,partnerCount=0){const p=normalizeProgress(progress);const req=Math.max(1,Number(variant.level)||1),b=Math.max(1,Number(variant.requiredBondRank)||1);if(p.level<req)return `Bound Level ${req} required`;if(bondRank(partnerCount)<b)return `Bond Rank ${b} required (currently ${bondRank(partnerCount)})`;return null;}