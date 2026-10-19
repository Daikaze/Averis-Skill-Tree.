/** Definitions are intentionally editable by the GM. No official D&D content is redistributed. */
export const MODULE_ID = "averis-skill-tree";

export const SKILLS = {
  acr: "Acrobatics", ani: "Animal Handling", arc: "Arcana", ath: "Athletics",
  dec: "Deception", his: "History", ins: "Insight", itm: "Intimidation",
  inv: "Investigation", med: "Medicine", nat: "Nature", prc: "Perception",
  prf: "Performance", per: "Persuasion", rel: "Religion", slt: "Sleight of Hand",
  ste: "Stealth", sur: "Survival"
};

export const EFFECT_KEYS = {
  "system.attributes.init.roll.bonus": "Initiative bonus",
  "system.attributes.ac.bonus": "Armor Class bonus",
  "system.rolls.attack.mwak.bonus": "Melee weapon attack bonus",
  "system.rolls.attack.rwak.bonus": "Ranged weapon attack bonus",
  "system.rolls.attack.msak.bonus": "Melee spell attack bonus",
  "system.rolls.attack.rsak.bonus": "Ranged spell attack bonus",
  "system.rolls.damage.mwak.bonus": "Melee weapon damage bonus",
  "system.rolls.damage.rwak.bonus": "Ranged weapon damage bonus",
  "system.rolls.damage.msak.bonus": "Melee spell damage bonus",
  "system.rolls.damage.rsak.bonus": "Ranged spell damage bonus",
  "system.rolls.ability.save.bonus": "Saving throw bonus",
  "system.rolls.ability.skill.bonus": "All skill checks bonus",
  "system.bonuses.spell.dc": "Spell save DC bonus",
  ...Object.fromEntries(Object.entries(SKILLS).map(([id, name]) => [
    `system.skills.${id}.roll.bonus`, `${name} checks bonus`
  ]))
};

export const AFFINITIES = [
  "Fire", "Water", "Earth", "Wind", "Lightning", "Ice", "Thunder",
  "Acid", "Poison", "Necrotic", "Psychic", "Radiant", "Force", "Blood"
];

const makeNode = (id, name, kind, tier, grantType, data = {}) => ({
  id, name, kind, tier, grantType, maxRank: 1, cost: 1, minLevel: 1,
  description: "", requires: [], skill: "", effectKey: "", amount: 1,
  itemUuid: "", ...data
});
const tree = (id, name, scope, key, icon, nodes) => ({id, name, scope, key, icon, nodes});

const standard = [
  tree("common-exploration", "Adventuring", "common", "", "fa-solid fa-compass", [
    makeNode("explore-perception", "Keen Senses", "skill", 1, "skill", {skill:"prc", maxRank:2, description:"Rank 1: Perception proficiency. Rank 2: expertise."}),
    makeNode("explore-athletics", "Athletic Training", "skill", 1, "skill", {skill:"ath", maxRank:2, description:"Rank 1: Athletics proficiency. Rank 2: expertise."}),
    makeNode("explore-stealth", "Silent Movement", "skill", 1, "skill", {skill:"ste", maxRank:2, description:"Rank 1: Stealth proficiency. Rank 2: expertise."}),
    makeNode("explore-investigation", "Investigator", "skill", 2, "skill", {skill:"inv", maxRank:2, minLevel:3, requires:["explore-perception"], description:"Gain Investigation proficiency, then expertise."}),
    makeNode("explore-survival", "Pathfinder", "skill", 2, "skill", {skill:"sur", maxRank:2, minLevel:3, requires:["explore-athletics"], description:"Gain Survival proficiency, then expertise."})
  ]),
  tree("common-martial", "Martial Training", "common", "", "fa-solid fa-shield-halved", [
    makeNode("martial-reflexes", "Quick Reflexes", "passive", 1, "effect", {effectKey:"system.attributes.init.roll.bonus", amount:1, maxRank:2, description:"+1 Initiative per rank (homebrew progression)."}),
    makeNode("martial-accuracy", "Weapon Accuracy", "attack", 2, "effect", {effectKey:"system.rolls.attack.mwak.bonus", amount:1, minLevel:3, requires:["martial-reflexes"], description:"+1 to melee weapon attack rolls (homebrew progression)."}),
    makeNode("martial-technique", "Special Technique", "attack", 3, "item", {minLevel:5, requires:["martial-accuracy"], description:"Link a D&D 5e Weapon or Feature Item with its own Attack Activity and damage."})
  ]),
  tree("common-magic", "Spellcraft", "common", "", "fa-solid fa-wand-magic-sparkles", [
    makeNode("magic-arcana", "Arcane Studies", "skill", 1, "skill", {skill:"arc", maxRank:2, description:"Rank 1: Arcana proficiency. Rank 2: expertise."}),
    makeNode("magic-focus", "Focused Casting", "passive", 2, "effect", {minLevel:3, effectKey:"system.rolls.attack.rsak.bonus", amount:1, requires:["magic-arcana"], description:"+1 to ranged spell attack rolls (homebrew progression)."}),
    makeNode("magic-spell", "Learn a Spell", "spell", 3, "item", {minLevel:5, requires:["magic-focus"], description:"GM links an actual D&D 5e Spell Item; uses normal spell slots and activities."})
  ])
];

const classStyles = {
  barbarian:["Battle Instinct", "Fury Technique", "Mighty Strike"],
  bard:["Inspiring Performance", "Bardic Technique", "Magical Secret"],
  cleric:["Divine Training", "Sacred Technique", "Blessed Miracle"],
  druid:["Primal Training", "Wild Technique", "Nature's Gift"],
  fighter:["Combat Training", "Combat Maneuver", "Masterful Attack"],
  monk:["Disciplined Training", "Ki Technique", "Martial Mastery"],
  paladin:["Sacred Training", "Holy Technique", "Divine Strike"],
  ranger:["Wilderness Training", "Hunter's Technique", "Precision Strike"],
  rogue:["Subtle Training", "Roguish Technique", "Cunning Strike"],
  sorcerer:["Innate Training", "Metamagic Technique", "Arcane Burst"],
  warlock:["Eldritch Training", "Pact Technique", "Eldritch Power"],
  wizard:["Scholarly Training", "Arcane Technique", "Signature Spell"],
  artificer:["Inventive Training", "Infused Technique", "Artificer's Creation"]
};

for(const [cls, labels] of Object.entries(classStyles)) {
  const name = cls.charAt(0).toUpperCase() + cls.slice(1);
  const spellType = ["bard","cleric","druid","sorcerer","warlock","wizard"].includes(cls);
  standard.push(tree(`class-${cls}`, `${name} Techniques`, "class", cls, "fa-solid fa-dice-d20", [
    makeNode(`${cls}-training`,labels[0],"feature",1,"item",{
      description:"Attach a D&D 5e Feature Item. Avoid granting a feature already provided by the class."}),
    makeNode(`${cls}-technique`,labels[1],spellType?"spell":"attack",2,"item",{
      minLevel:3,requires:[`${cls}-training`],description:"Attach a prepared Feature/Spell/Weapon Item with native D&D 5e Activities."}),
    makeNode(`${cls}-mastery`,labels[2],spellType?"spell":"attack",3,"item",{
      minLevel:5,requires:[`${cls}-technique`],description:"Attach your D&D 5e Item with its correct action economy, uses, range, save and damage."})
  ]));
}

for(const affinity of AFFINITIES) {
  const key = affinity.toLowerCase();
  standard.push(tree(`affinity-${key}`, `${affinity} Affinity`, "affinity", key, "fa-solid fa-fire-flame-curved",
    Array.from({length:5}, (_,i)=>makeNode(`${key}-level-${i+1}`,`Level ${i+1} — ${affinity} Technique`,i<2?"feature":"spell",i+1,"item",{
      minLevel:1+i*2,requires:i?[`${key}-level-${i}`]:[],
      description:`GM: link the actual ${affinity} Affinity Level ${i+1} Feature/Spell from Averis. No mechanics are invented by the module.`
    }))
  ));
}

export function starterTrees(){ return structuredClone(standard); }
export function defaultProgress(){return {level:1, xp:0, bonusPoints:0, spent:0, ranks:{}, affinities:[]};}
export function xpNeeded(level){return 100*Math.max(1,Number(level)||1);}
