/** Averis authored supplementary progression: D&D 5e-shaped, not a replacement for class advancement. */
export const MODULE_ID = 'averis-skill-tree';
export const SKILLS = {
  acr:'Acrobatics', ani:'Animal Handling', arc:'Arcana', ath:'Athletics', dec:'Deception',
  his:'History', ins:'Insight', itm:'Intimidation', inv:'Investigation', med:'Medicine',
  nat:'Nature', prc:'Perception', prf:'Performance', per:'Persuasion', rel:'Religion',
  slt:'Sleight of Hand', ste:'Stealth', sur:'Survival'
};
export const EFFECT_KEYS = {
  'system.attributes.init.roll.bonus':'Initiative bonus',
  'system.attributes.ac.bonus':'Armor Class bonus',
  'system.rolls.attack.mwak.bonus':'Melee weapon attack bonus',
  'system.rolls.attack.rwak.bonus':'Ranged weapon attack bonus',
  'system.rolls.attack.msak.bonus':'Melee spell attack bonus',
  'system.rolls.attack.rsak.bonus':'Ranged spell attack bonus',
  'system.rolls.damage.mwak.bonus':'Melee weapon damage bonus',
  'system.rolls.damage.rwak.bonus':'Ranged weapon damage bonus',
  'system.rolls.ability.save.bonus':'Saving throw bonus',
  'system.rolls.ability.skill.bonus':'All skill checks bonus',
  ...Object.fromEntries(Object.entries(SKILLS).map(([id,name])=>[`system.skills.${id}.roll.bonus`,`${name} checks bonus`]))
};
export const AFFINITIES = ['Fire','Water','Earth','Wind','Lightning','Ice','Thunder','Acid','Poison','Necrotic','Psychic','Radiant','Force','Blood'];
const iconic = {
  Fire:'fa-solid fa-fire-flame-curved', Water:'fa-solid fa-droplet',Earth:'fa-solid fa-mountain',
  Wind:'fa-solid fa-wind',Lightning:'fa-solid fa-bolt',Ice:'fa-solid fa-snowflake',
  Thunder:'fa-solid fa-volume-high',Acid:'fa-solid fa-flask',Poison:'fa-solid fa-skull-crossbones',
  Necrotic:'fa-solid fa-skull',Psychic:'fa-solid fa-brain',Radiant:'fa-solid fa-sun',
  Force:'fa-solid fa-shield',Blood:'fa-solid fa-droplet'
};
// Names are recovered from Averis' existing 5-level affinity codex.
// Exact unpublished attack stats are intentionally NOT guessed. Players still receive
// real, clickable dnd5e Feature Items; the GM can enter exact Activities later.
export const AFFINITY_CODEX = {
  Fire:[['Fire Spell (Firebolt)','Small fire projectile; may ignite a target.','attack'],['Fire Shield','Flames defend the caster and scorch attackers.','feature'],['Fire Fist','A fire-infused melee strike.','attack'],['Fire Flight','Short fiery flight leaving a trail.','feature'],['Fire Breath','A broad cone of fire.','spell']],
  Water:[['Water Spell (Aqua Jet)','Water projectile.','attack'],['Water Whip','Strike or manipulate with a water whip.','attack'],['Healing Waters','Water-based healing.','feature'],['Water Prison','Contain a creature in water.','spell'],['Tidal Wave','A surge of crashing water.','spell']],
  Earth:[['Earth Spell (Stone Shot)','Launch a stone projectile.','attack'],['Earth Spikes','Raise sharp earth spikes.','attack'],['Earthquake','Shake the ground.','spell'],['Earth Wall','Raise a stone barricade.','feature'],['Earth Manipulation','Manipulate earth and stone.','feature']],
  Wind:[['Wind Spell (Wind Slash)','Wind slash projectile; Averis has a wind cantrip variant.','attack'],['Glide','Glide using moving air.','feature'],['Wind Shield','Deflect incoming attacks with air.','feature'],['Wind Fist','A close-range burst of wind.','attack'],['Fly','Sustain flight using wind.','feature']],
  Lightning:[['Lightning Spell (Spark Bolt)','A lightning projectile.','attack'],['Lightning Dash','Rapid lightning movement.','feature'],['Chain Lightning','Electrical energy leaps among foes.','spell'],['Thunderclap','Thunderous burst.','spell'],['Overcharge','Overload the body with electricity.','feature']],
  Psychic:[['Mind Pierce','Psychic assault that can briefly slow.','attack'],['Telekinetic Push','Push a creature or object telekinetically.','feature'],['Confusion Aura','Disrupt enemy targeting and movement.','spell'],['Psychic Clone','Create an illusory double.','feature'],['Mind Crush','Strong psychic attack and incapacitating effect.','spell']],
  Necrotic:[['Death Touch','Drain life by touch.','attack'],['Raise Skeleton','Temporarily animate a skeletal ally.','feature'],['Drain Life','Drain a foe and heal yourself.','spell'],['Bone Wall','Create a wall of bones.','feature'],['Lich Form','Powerful temporary necrotic transformation.','feature']],
  Poison:[['Venom Shot','Projectile with lingering poison.','attack'],['Poison Cloud','Create a choking poison cloud.','spell'],['Paralysis Strike','Try to temporarily paralyze a foe.','attack'],['Acidic Skin','Melee attackers suffer a corrosive retaliation.','feature'],['Plague Burst','Spread toxic sickness in an area.','spell']],
  Acid:[['Corrosive Bolt','Corrosive bolt that weakens protection.','attack'],['Acid Spray','Spray corrosive acid.','spell'],['Armor Melt','Strip away armor protection.','spell'],['Acid Clone','Create a corrosive duplicate.','feature'],['Liquify','Liquefy to hinder movement.','feature']],
  Ice:[['Ice Spell (Frost Shard)','A shard of frost.','attack'],['Ice Armor','Ice covers and protects you.','feature'],['Freezing Field','Freeze the nearby area.','spell'],['Ice Prison','Encapsulate an enemy in ice.','spell'],['Blizzard','Conjure a powerful snowstorm.','spell']],
  Radiant:[['Guiding Spark','A small burst of celestial light.','attack'],['Halo of Protection','Bonus Action, 10-ft aura for 1 minute: +1 AC for self and nearby allies.','feature'],['Chains of Light','Conjure binding chains of radiant light.','spell'],['Wings of Dawn','Manifest radiant wings.','feature'],['Judgement Ray','Channel a focused radiant beam.','spell']],
  Force:[['Force Spell (Kinetic Bolt)','A projectile of pure force.','attack'],['Force Push','Push an enemy with kinetic force.','feature'],['Gravity Well','Distort gravity in an area.','spell'],['Barrier','Create a force barrier.','feature'],['Force Implosion','Collapse force inward.','spell']],
  Blood:[['Blood Sense','Sense living blood in your surroundings.','feature'],['Blood Strike','Blood-infused attack using Blood Charges.','attack'],['Crimson Surge','Surge of blood power; uses Blood Charges.','feature'],['Blood Control','Manipulate blood; resist with saving throw.','spell'],['Blood Awakening','Powerful blood transformation with exhaustion risk.','feature']],
  // Averis notes only specify Thunder (Spell), not the 4 remaining canonical names.
  Thunder:[['Thunder (Spell)','The previously specified Thunder spell. Exact activity still requires GM details.','spell'],['Thunder II — Unspecified','Averis has not defined this ability yet; no invented mechanics.','feature'],['Thunder III — Unspecified','Reserved for your canon Thunder technique.','feature'],['Thunder IV — Unspecified','Reserved for your canon Thunder technique.','feature'],['Thunder V — Unspecified','Reserved for your canon Thunder technique.','feature']]
};
const node=(id,name,kind,tier,grantType,extra={})=>({id,name,kind,tier,grantType,maxRank:1,cost:1,minLevel:Math.max(1,2*tier-1),description:'',requires:[],skill:'',effectKey:'',amount:1,itemUuid:'',activation:'action',damage:'',damageType:'',...extra});
const tree=(id,name,scope,key,icon,nodes)=>({id,name,scope,key,icon,nodes});
const PROFICIENCY_GROUPS=[
 ['adventure','Adventuring','fa-solid fa-compass',['ath','acr','ste','slt','sur','prc']],
 ['knowledge','Knowledge','fa-solid fa-book-open',['arc','his','inv','nat','rel','med']],
 ['social','Social','fa-solid fa-users',['per','dec','itm','ins','prf','ani']]
];
const general=PROFICIENCY_GROUPS.map(([key,title,icon,list])=>tree('general-'+key,title,'common','',icon,
 list.map((skill,i)=>node(`general-${skill}`,SKILLS[skill]+' Training','skill',i<3?1:2,'skill',{
   skill,maxRank:2,minLevel:i<3?1:3,description:`Rank 1: ${SKILLS[skill]} proficiency. Rank 2: expertise (native D&D 5e skill).`
 }))));
general.push(tree('general-adventurer','Adventure Talents','common','','fa-solid fa-shield-halved',[
 node('general-initiative','Improved Initiative','passive',1,'effect',{maxRank:2,effectKey:'system.attributes.init.roll.bonus',description:'+1 initiative roll per rank (Averis bonus).'}),
 node('general-defense','Defensive Discipline','passive',2,'effect',{effectKey:'system.attributes.ac.bonus',amount:1,description:'+1 AC while the effect is enabled (Averis homebrew).'}),
 node('general-striker','Weapon Precision','passive',2,'effect',{effectKey:'system.rolls.attack.mwak.bonus',amount:1,description:'+1 melee weapon attack roll (Averis homebrew).'}),
 node('general-marksman','Careful Aim','passive',2,'effect',{effectKey:'system.rolls.attack.rwak.bonus',amount:1,description:'+1 ranged weapon attack roll (Averis homebrew).'}),
 node('general-spellcraft','Arcane Accuracy','passive',2,'effect',{effectKey:'system.rolls.attack.rsak.bonus',amount:1,description:'+1 ranged spell attack roll (Averis homebrew).'}),
 node('general-secondwind','Adventurer’s Resolve','feature',3,'builtin',{activation:'bonus',description:'Once per Long Rest, take a Bonus Action to gain temporary HP equal to your Proficiency Bonus. This is an Averis supplementary feat, not the Fighter feature.',uses:1,recovery:'lr'})
]));
// All 13 class lists are deliberately distinct supplementary feats; no automatic
// duplications of Rage, Lay on Hands, Sneak Attack, Spellcasting or Extra Attack.
const CLASSES={
 barbarian:[['Savage Endurance','Gain temporary HP equal to PB when you enter a battle; once/Long Rest.','bonus'],['Reckless Momentum','After moving at least 10 ft, your next melee weapon hit gains +1d4 damage; once/Long Rest.','bonus'],['Intimidating Roar','As an Action, one creature within 30 ft makes a Wisdom save against DC 8 + PB + STR mod or becomes frightened until your next turn. Once/Long Rest.','action'],['Iron Resilience','Reaction: reduce incoming damage by 1d8 + CON mod; once/Long Rest.','reaction'],['Warpath','Bonus Action: gain +10 ft speed until end of turn. Once/Short Rest.','bonus']],
 bard:[['Stage Presence','Once/Long Rest, gain advantage on your next Performance check.','bonus'],['Distracting Verse','Bonus Action: impose disadvantage on the next Perception check of a creature within 30 ft; once/Long Rest.','bonus'],['Resonant Note','Action: one target within 30 ft makes a Wisdom save vs spell DC or takes 2d6 Psychic; once/Long Rest.','action'],['Harmonic Shield','Reaction: grant a visible ally within 30 ft +2 AC against one attack; once/Long Rest.','reaction'],['Grand Finale','Bonus Action: one ally within 30 ft gains temporary HP equal to PB + CHA modifier; once/Long Rest.','bonus']],
 cleric:[['Prayer of Focus','Bonus Action: gain advantage on your next Religion check; once/Long Rest.','bonus'],['Merciful Touch','Action: one creature you touch gains 1d6 + WIS mod HP; once/Long Rest.','action'],['Sanctified Warning','Reaction: gain +2 AC against one incoming attack; once/Long Rest.','reaction'],['Beacon of Hope','Bonus Action: one ally within 30 ft gains temporary HP equal to PB; once/Long Rest.','bonus'],['Judgment Call','Action: one target within 30 ft makes a WIS save vs spell DC or takes 3d6 Radiant; once/Long Rest.','action']],
 druid:[['Green Whisper','Gain advantage on a Nature check; once/Long Rest.','bonus'],['Root Grasp','Action: one creature within 30 ft makes a Strength save vs spell DC or its speed becomes 0 until start of your next turn; once/Long Rest.','action'],['Barkskin Reflex','Reaction: reduce incoming damage by 1d6; once/Long Rest.','reaction'],['Verdant Healing','Action: heal an ally you touch by 2d6 + WIS modifier; once/Long Rest.','action'],['Circle of Vines','Action: one creature within 30 ft makes a DEX save vs spell DC or becomes restrained until end of your next turn (save at end of turn); once/Long Rest.','action']],
 fighter:[['Guarded Stance','Reaction: +2 AC against a single melee attack; once/Short Rest.','reaction'],['Driving Blow','After a melee hit, force DC 8 + PB + STR mod Strength save or push target 5 ft; once/Long Rest.','bonus'],['Tactical Footwork','Bonus Action: move 10 ft without provoking opportunity attacks; once/Long Rest.','bonus'],['Battlefield Focus','Bonus Action: gain +1 to your next weapon attack before end of turn; once/Short Rest.','bonus'],['Decisive Strike','After you hit with a weapon, add 2d6 damage; once/Long Rest.','bonus']],
 monk:[['Balanced Breath','Bonus Action: gain temporary HP equal to WIS modifier + PB; once/Long Rest.','bonus'],['Flowing Footwork','Bonus Action: move 10 ft without provoking attacks; once/Long Rest.','bonus'],['Palm Shock','Action: a creature within 5 ft makes a CON save DC 8 + PB + WIS mod or takes 2d6 Thunder; once/Long Rest.','action'],['Still Minded','Reaction: gain advantage on one incoming Wisdom save; once/Long Rest.','reaction'],['Focused Barrage','Bonus Action: your next unarmed strike gains 2d6 extra Force damage if it hits; once/Long Rest.','bonus']],
 paladin:[['Knight’s Vigil','Bonus Action: your next Perception check has advantage; once/Long Rest.','bonus'],['Guardian’s Oath','Reaction: grant an adjacent ally +2 AC against one attack; once/Long Rest.','reaction'],['Radiant Challenge','Action: one enemy within 30 ft makes WIS save DC 8 + PB + CHA mod or has disadvantage on attacks against allies other than you until your next turn; once/Long Rest.','action'],['Warding Light','Bonus Action: gain temporary HP equal to CHA mod + PB; once/Long Rest.','bonus'],['Oathbound Strike','After a melee weapon hit, deal +2d6 Radiant damage; once/Long Rest, no spell slot cost.','bonus']],
 ranger:[['Trail Reader','Gain advantage on your next Survival check; once/Long Rest.','bonus'],['Swift Pursuit','Bonus Action: +10 ft speed until end of turn; once/Short Rest.','bonus'],['Pinning Shot','After a ranged weapon hit, enemy makes STR save DC 8 + PB + DEX mod or its speed is halved until your next turn; once/Long Rest.','bonus'],['Ambush Awareness','Reaction: gain +2 AC against a visible ranged attack; once/Long Rest.','reaction'],['Hunter’s Finish','After a weapon hit against a creature below half HP, deal +2d6 weapon damage; once/Long Rest.','bonus']],
 rogue:[['Quiet Step','Gain advantage on your next Stealth check; once/Long Rest.','bonus'],['Smoke Feint','Bonus Action: a creature within 5 ft has disadvantage on its next opportunity attack against you; once/Long Rest.','bonus'],['Trick Strike','After a finesse/ranged weapon hit, add +1d6 weapon damage (not Sneak Attack); once/Long Rest.','bonus'],['Evasive Instinct','Reaction: gain +2 AC against one attack; once/Short Rest.','reaction'],['Shadow Retreat','Bonus Action: move up to 15 ft without opportunity attacks; once/Long Rest.','bonus']],
 sorcerer:[['Innate Sensitivity','Gain advantage on your next Arcana check; once/Long Rest.','bonus'],['Spell Spark','Bonus Action: your next damaging spell gains +1 damage; once/Long Rest.','bonus'],['Weave Reflex','Reaction: gain +2 AC against one spell attack; once/Long Rest.','reaction'],['Raw Power','Bonus Action: your next damaging spell this turn gains +1d6 damage; once/Long Rest.','bonus'],['Innate Overflow','Action: make a spell attack against one creature within 60 ft for 3d6 Force damage; once/Long Rest.','action']],
 warlock:[['Pact Murmur','Gain advantage on your next Intimidation check; once/Long Rest.','bonus'],['Hexbound Glance','Bonus Action: one creature within 30 ft makes WIS save vs spell DC or cannot take reactions until your next turn; once/Long Rest.','bonus'],['Occult Shield','Reaction: gain +2 AC vs one incoming attack; once/Long Rest.','reaction'],['Eldritch Pulse','Action: make a spell attack at 60 ft for 2d6 Force damage; once/Long Rest.','action'],['Patron’s Mark','Bonus Action: mark one creature within 30 ft; the next damage you deal to it before end of your next turn gains +1d6 Necrotic; once/Long Rest.','bonus']],
 wizard:[['Mnemonic Scholar','Gain advantage on your next Arcana check; once/Long Rest.','bonus'],['Defensive Sigil','Reaction: gain +2 AC against an attack; once/Long Rest.','reaction'],['Rune Flicker','Action: make a spell attack against a target within 60 ft for 2d6 Force damage; once/Long Rest.','action'],['Quick Calculation','Bonus Action: gain +1 on your next spell attack this turn; once/Long Rest.','bonus'],['Arcane Apex','Action: make a spell attack against a target within 90 ft for 3d6 Force; once/Long Rest.','action']],
 artificer:[['Tool Calibration','Gain advantage on your next tool check; once/Long Rest.','bonus'],['Defensive Gizmo','Reaction: gain +2 AC vs one attack; once/Short Rest.','reaction'],['Alchemical Charge','Action: make ranged spell attack at 30 ft for 2d6 Acid damage; once/Long Rest.','action'],['Rapid Repair','Action: restore 2d6 HP to a construct or object you touch; once/Long Rest.','action'],['Arcane Device','Action: ranged spell attack at 60 ft for 3d6 Force; once/Long Rest.','action']]
};
export const CLASS_KEYS=Object.keys(CLASSES);
const classTrees=Object.entries(CLASSES).map(([cls,abilities])=>tree(`class-${cls}`,`${cls[0].toUpperCase()+cls.slice(1)} Talents`,'class',cls,'fa-solid fa-dice-d20',abilities.map(([name,description,activation],i)=>node(`${cls}-talent-${i+1}`,name,i>=2?'feature':'feature',i+1,'builtin',{
  activation,description,uses:1,recovery:i===0||i===3?'sr':'lr',requires:i?[`${cls}-talent-${i}`]:[]
}))));
const affinityTrees=AFFINITIES.map(aff=>{
 const key=aff.toLowerCase();
 return tree(`affinity-${key}`,`${aff} Affinity`,'affinity',key,iconic[aff],(AFFINITY_CODEX[aff]||[]).map(([name,description,kind],i)=>node(`${key}-level-${i+1}`,name,kind,i+1,'builtin',{
  minLevel:i+1,uses:1,recovery:'lr',description:`${description}\nAveris Affinity Level ${i+1}. This feat is usable in D&D 5e; where exact mechanics were not recorded, the GM adjudicates the effect.`,requires:i?[`${key}-level-${i}`]:[],
  // Prevent bypassing the affinity training progression by representing tiers.
  affinityLevel:i+1
 })));
});
export function starterTrees(){return structuredClone([...general,...classTrees,...affinityTrees]);}
export function defaultProgress(){return {level:1,xp:0,bonusPoints:0,spent:0,ranks:{},affinities:[]};}
export function xpNeeded(level){return 100*Math.max(1,Math.trunc(Number(level)||1));}