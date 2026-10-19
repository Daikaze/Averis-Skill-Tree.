/** v0.2.0 curated manual-resolution D&D5e combo library. Not automatic character attacks. */
// id | Title | paired economy | requires target | opposite formation | shared dice | bonus kind | trigger | precise shared effect
const DATA = {
 melee: [
 ['twin-strike','Twin Strike','Action + Action',1,1,'1d6','damage','Both melee attacks hit the same target','One additional 1d6 Force damage to the shared target. Each character resolves their ordinary melee attack first.'],
 ['shield-break','Shield Break','Action + Action',1,1,'1d4','check','One melee attack hits and the partner succeeds on Athletics against GM DC','Subtract 1d4 from the target’s next Strength or Dexterity check before the end of its next turn.'],
 ['hammer-and-anvil','Hammer and Anvil','Action + Action',1,1,'1d6','damage','Both melee attacks hit while flanking','One bonus 1d6 bludgeoning damage. It is a single shared roll, not extra damage on each attack.'],
 ['sweeping-pair','Sweeping Pair','Action + Action',1,0,'1d6','damage','Each ally hits a different creature within their normal reach','Choose one creature struck. That target takes one bonus 1d6 weapon damage.'],
 ['crushing-pincer','Crushing Pincer','Action + Action',1,1,'1d8','damage','Both melee hits land and the target fails a normal Strength save chosen by GM','One bonus 1d8 bludgeoning damage; no automatic grapple or restraint.'],
 ['final-crosscut','Final Crosscut','Action + Action',1,1,'2d6','damage','Both allies land melee attacks on a common target','One bonus 2d6 slashing damage. Resolve resistance and immunities normally.']
 ],
 ranged: [
 ['crossfire','Crossfire','Action + Action',1,1,'1d6','damage','Both ranged weapon attacks hit the same target','One extra 1d6 weapon damage; ammunition, cover and disadvantage apply to each normal attack.'],
 ['spotter-shot','Spotter Shot','Action + Action',1,0,'1d4','check','Spotter succeeds on Perception, partner fires normally','Add one 1d4 to a subsequent ranged attack roll before the start of the partner’s next turn (GM adjudicates timing).'],
 ['suppression-lane','Suppression Lane','Action + Action',1,0,'1d4','penalty','Both ranged attacks hit or impose suppressing fire with GM approval','Subtract 1d4 from one target’s next ranged attack before the end of its next turn.'],
 ['split-volley','Split Volley','Action + Action',1,0,'1d6','damage','Each ranged character hits a different enemy','One of the struck targets takes one extra 1d6 piercing damage.'],
 ['piercing-crossfire','Piercing Crossfire','Action + Action',1,1,'1d8','damage','Two ranged attacks strike one creature from opposite positions','One extra 1d8 piercing damage. Normal cover still applies.'],
 ['deadeye-duet','Deadeye Duet','Action + Action',1,1,'2d6','damage','Both ranged weapon hits land on a marked target','One bonus 2d6 piercing damage; no automatic critical hit.']
 ],
 spell: [
 ['spell-weave','Spell Weave','Each casts one legal spell',1,0,'1d6','damage','Both spells affect the same target','One bonus 1d6 Force damage. Both spells still spend their own slots, actions and components.'],
 ['elemental-echo','Elemental Echo','Each casts one spell',1,0,'1d4','damage','Both spells cause elemental damage to a common target','One bonus 1d4 matching one of the spell damage types, as agreed with GM.'],
 ['arcane-focus','Arcane Focus','Action + Reaction',0,0,'1d4','check','One caster succeeds on Arcana while the second legally casts a spell','The caster adds one 1d4 to a single spell attack roll, not the spell DC.'],
 ['resonant-ward','Resonant Ward','Each casts a legal spell',0,0,'1d6','temp','Both spells provide magical protection to the same ally','That ally gains 1d6 temporary HP once (does not stack).'],
 ['convergent-burst','Convergent Burst','Each casts one spell',1,0,'1d8','damage','Both spells successfully affect the same enemy','One bonus 1d8 Force damage. Concentration remains separate.'],
 ['astral-confluence','Astral Confluence','Each casts one spell',1,0,'2d6','damage','Both magical attacks or failed-save spells affect one target','One bonus 2d6 Force damage. No free spell or extra slot.']
 ],
 healing: [
 ['healing-chorus','Healing Chorus','Both use legal healing actions',0,0,'1d6','healing','Both allies heal the same creature','One additional 1d6 healing, capped by missing HP and applied manually.'],
 ['triage-pair','Triage Pair','Action + Action',0,0,'1d4','check','Both succeed on Medicine or one provides a healer’s kit','Add 1d4 to the next Medicine check made for the patient this scene.'],
 ['life-thread','Life Thread','Both use healing resources',0,0,'1d6','temp','Both expend healing resources on a single ally','One 1d6 temporary HP to the ally, not cumulative with existing temporary HP.'],
 ['revival-watch','Revival Watch','Action + Action',0,0,'1d4','check','Both complete Medicine checks to stabilize an ally','Add 1d4 to one Medicine roll; normal stabilization and death save rules apply.'],
 ['restoring-chorus','Restoring Chorus','Both use legal healing abilities',0,0,'1d8','healing','Both abilities restore HP to one creature','One extra 1d8 healing to that creature only.'],
 ['sanctuary-pulse','Sanctuary Pulse','Both expend healing magic',0,0,'2d6','healing','Both spells restore HP to the same target','One bonus 2d6 healing. Does not remove conditions unless a normal spell does.']
 ],
 defense: [
 ['guardian-link','Guardian Link','Reaction + Reaction',0,0,'','none','Both spend their reactions before an incoming attack resolves','Grant one defended ally +2 AC against that single attack only.'],
 ['brace-together','Brace Together','Reaction + Reaction',0,0,'1d4','check','Both brace before one Strength or Constitution save','One ally adds 1d4 to that one save if the GM allows assistance.'],
 ['intercept-guard','Intercept Guard','Reaction + Reaction',0,0,'1d4','penalty','Both take defensive positions against one attacker','The attacker subtracts 1d4 from its next weapon attack roll this round.'],
 ['bulwark-step','Bulwark Step','Reaction + Reaction',0,0,'1d6','temp','Both characters defend a nearby ally','Grant 1d6 temporary HP to one ally, no stacking.'],
 ['iron-circle','Iron Circle','Reaction + Reaction',0,0,'1d8','temp','The participants guard the same friendly creature','Grant 1d8 temporary HP; no permanent AC effect.'],
 ['unbroken-wall','Unbroken Wall','Reaction + Reaction',0,0,'','none','Both expend reactions to protect one target','One chosen ally gets +3 AC against one incoming attack only. Does not stack with Guardian Link.']
 ],
 control: [
 ['tactical-feint','Tactical Feint','Action + Reaction',1,0,'1d4','penalty','Target fails a normal Wisdom save adjudicated by GM','Subtract 1d4 from target’s next attack roll before the end of its next turn.'],
 ['pin-and-divert','Pin and Divert','Action + Action',1,0,'1d4','check','One character succeeds on Athletics and the other on Acrobatics','Add 1d4 to one subsequent attempt to grapple or shove the target this turn.'],
 ['distracting-sync','Distracting Sync','Action + Action',1,0,'1d4','penalty','Both succeed on Deception, Performance or appropriate attack feints','Subtract 1d4 from target’s next Insight check or attack (GM chooses one).'],
 ['binding-angle','Binding Angle','Action + Action',1,0,'1d6','check','Two characters use legal control abilities on one target','Roll 1d6 bonus on a single follow-up Athletics check, not a save DC.'],
 ['thunder-disarray','Thunder Disarray','Action + Action',1,0,'1d6','penalty','One target fails a legal save against both characters’ control effects','Subtract 1d6 from one target ability check before end of next turn.'],
 ['lockdown-pincer','Lockdown Pincer','Action + Action',1,1,'1d8','check','Both successfully restrain movement via normal attacks or checks','Add 1d8 to one follow-up grapple/shove check; cannot automatically stun or restrain.']
 ],
 skill: [
 ['skill-synergy','Skill Synergy','Action + Action / downtime',0,0,'1d4','check','Both succeed on related skill checks chosen by GM','Add one 1d4 to a subsequent follow-up skill check; GM sets DC as normal.'],
 ['trail-reader','Trail Reader','Two exploration checks',0,0,'1d4','check','Survival and Perception checks succeed','Add 1d4 to the next Survival check for following the same trail.'],
 ['lore-concord','Lore Concord','Two knowledge checks',0,0,'1d4','check','Both succeed at Arcana, History, Nature or Religion','Add 1d4 to the next knowledge check on that topic.'],
 ['infiltration-team','Infiltration Team','Two Stealth / tools checks',0,0,'1d6','check','Both Stealth and Thieves’ Tools attempts succeed','Add 1d6 to one follow-up Stealth or Thieves’ Tools check this scene.'],
 ['master-deduction','Master Deduction','Two Investigation checks',0,0,'1d8','check','Both succeed on Investigation or Insight relevant to the mystery','Add 1d8 to one follow-up Investigation roll; no automatic revelation of GM secrets.'],
 ['legendary-coordination','Legendary Coordination','Two skill checks',0,0,'1d10','check','Both complete expert-level checks set by GM','Add 1d10 to one subsequent related skill check in this scene.']
 ],
 movement: [
 ['evasive-relay','Evasive Relay','Reaction + Reaction',0,0,'','none','Both are able to move and spend their reactions','Each may move up to 10 ft along a legal route. Opportunity attacks are not ignored.'],
 ['shadow-cross','Shadow Cross','Reaction + Reaction',0,0,'','none','Both allies can legally reposition','Each can move 5 ft without exceeding remaining legal speed; opportunity attacks still apply.'],
 ['vault-partner','Vault Partner','Action + Action',0,0,'1d4','check','Both succeed on Athletics or Acrobatics','Add 1d4 to the next legal jump, climb or tumble check.'],
 ['rapid-switch','Rapid Switch','Reaction + Reaction',0,0,'','none','Two adjacent allies each spend a Reaction','Swap to each other’s locations only if a legal movement route exists; no teleportation.'],
 ['wind-channel','Wind Channel','Action + Action',0,0,'1d6','check','Both succeed on Acrobatics or Athletics in a chase','Add 1d6 to one subsequent Athletics or Acrobatics check this round.'],
 ['phantom-relay','Phantom Relay','Reaction + Reaction',0,0,'','none','Both are able to move and exchange positioning','Each may move up to 15 ft by normal movement rules, no teleport, no opportunity immunity.']
 ],
 support: [
 ['rallying-call','Rallying Call','Bonus Action + Bonus Action',0,0,'1d4','temp','Both spend Bonus Actions to encourage an ally','One ally within 30 ft gains 1d4 temporary HP, no stacking.'],
 ['battle-rhythm','Battle Rhythm','Bonus Action + Bonus Action',0,0,'1d4','check','Both allies coordinate their next assault','Add 1d4 to one ally’s next initiative-related check if allowed by GM; no second initiative roll.'],
 ['shared-focus','Shared Focus','Action + Action',0,0,'1d4','check','Both allies provide instructions on a specific problem','Add 1d4 to one allied ability check in the next round.'],
 ['morale-flare','Morale Flare','Bonus Action + Bonus Action',0,0,'1d6','temp','Both give encouragement to the same ally','One ally gains 1d6 temporary HP; it does not stack with existing temporary HP.'],
 ['command-crescendo','Command Crescendo','Action + Action',0,0,'1d6','check','Both succeed on Persuasion, Intimidation or Performance','Add 1d6 to one next ally’s relevant ability check (not an attack roll).'],
 ['heroic-harmony','Heroic Harmony','Bonus Action + Bonus Action',0,0,'2d6','temp','Both allies inspire the same nearby ally','One ally gains 2d6 temporary HP, using ordinary non-stacking rules.']
 ],
 utility: [
 ['camp-handwork','Camp Handwork','Two tool checks / downtime',0,0,'1d4','check','Both succeed at the same downtime craft or camp task','Add 1d4 to the next related tool check; supplies/time are still spent.'],
 ['joint-ritual','Joint Ritual','Two legal ritual casts / downtime',0,0,'1d4','check','Both casters complete a legal ritual and an Arcana check','Add 1d4 to one subsequent ritual-related Arcana check. No shorter ritual time.'],
 ['negotiation-duo','Negotiation Duo','Two social checks',0,0,'1d4','check','Two allied speakers succeed on different social skill checks','Add 1d4 to the next Persuasion, Deception or Insight check in the conversation.'],
 ['forge-alliance','Forge Alliance','Two tool checks / downtime',0,0,'1d6','check','Both cooperate using appropriate tool proficiencies','Add 1d6 to one follow-up crafting tool check; does not reduce downtime or costs.'],
 ['warding-circle','Warding Circle','Two Arcana / Religion checks',0,0,'1d8','check','Both complete an appropriate magical warding task','Add 1d8 to one follow-up Arcana or Religion check about the ward.'],
 ['mythic-covenant','Mythic Covenant','Two legal ritual actions',0,0,'1d10','check','Both make successful ritual knowledge checks and provide components','Add 1d10 to the next GM-approved ritual ability check. Not a free spell.']
 ]
};
export const CATEGORY_META = Object.freeze({
 melee:['Melee','fa-khanda'],ranged:['Ranged','fa-bullseye'],spell:['Magic','fa-wand-magic-sparkles'],
 healing:['Healing','fa-heart-pulse'],defense:['Defense','fa-shield-halved'],control:['Control','fa-hand'],
 skill:['Skill Checks','fa-dice-d20'],movement:['Movement','fa-person-running'],support:['Support','fa-flag'],utility:['Utility','fa-compass'],custom:['Custom','fa-star']
});
const LEVELS=[1,3,5,7,9,12];
const RANKS=[1,1,1,1,2,3];
export const PRESETS = Object.freeze(Object.entries(DATA).flatMap(([category,entries]) => entries.map((r,index)=>Object.freeze({
 id:r[0],title:r[1],action:r[2],target:!!r[3],opposite:!!r[4],formula:r[5],bonusKind:r[6],trigger:r[7],rules:r[8],
 category,icon:CATEGORY_META[category][1],reach: category==='melee'?5:category==='ranged'?120:category==='spell'?120:30,
 level:LEVELS[index],requiredBondRank:RANKS[index],tier:index+1
}))));
export const TIER_LEVELS = LEVELS;