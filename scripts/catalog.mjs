/* Curated verbatim from the user-provided Averis Affinity rules. */
export const AFFINITIES = Object.freeze([
  {
    "id": "fire",
    "name": "Fire",
    "special": false,
    "color": "#e36c4f",
    "icon": "fa-fire-flame-curved",
    "abilities": [
      {
        "level": 1,
        "title": "Scarlet Spark",
        "description": "You compress fire into a sharp blazing projectile and launch it at a target.\n\n- **Type:** Action\n- **Range:** 60 feet\n- **Target:** One creature\n- **Attack:** Ranged Spell Attack\n- **Hit:** **1d10 Fire damage**\n- If the target takes damage, it becomes marked with **Burning Ember** until the end of your next turn.\n- If you hit a creature already affected by **Burning Ember**, it takes an extra **1d4 Fire damage**.\n\n **Burning Ember**\n\nA creature marked by Burning Ember glows with unstable fire energy.\n- The mark itself does not deal damage.\n- It is used to empower your other fire abilities.",
        "uses": null,
        "dice": [
          "1d10",
          "1d4"
        ]
      },
      {
        "level": 2,
        "title": "Flame Emperor’s Guard",
        "description": "You ignite a blazing aura around yourself, turning your defense into a weapon.\n\n- **Type:** Bonus Action\n- **Range:** Self\n- **Duration:** 1 minute\n- **Uses:** **2 per Long Rest**\n\nWhile this effect is active:\n\n- You gain **Resistance to Fire damage**.\n- The first time each turn a creature hits you with a melee attack, it takes **1d6 Fire damage**.\n- Your body radiates heat and flame, shedding bright light in a **10-foot radius** and dim light for another **10 feet**.",
        "uses": {
          "kind": "fixed",
          "value": 2
        },
        "dice": [
          "1d6"
        ]
      },
      {
        "level": 3,
        "title": "Hellfire Impact",
        "description": "You gather explosive flames into your fist, foot, or weapon and unleash a devastating close-range blow.\n\n- **Type:** Action\n- **Range:** 5 feet\n- **Target:** One creature\n- **Attack:** Melee Weapon Attack or Melee Spell Attack\n- **Hit:** Normal weapon damage (if used with a weapon) **+ 2d6 Fire damage**\n\nAfter the hit, fire erupts outward:\n\n- Each creature of your choice within **5 feet** of the target must make a **Dexterity Saving Throw**.\n- On a failure, a creature takes **1d6 Fire damage**.\n- On a success, it takes no damage.\n\nIf the main target was affected by **Burning Ember**, it must also succeed on a **Strength Saving Throw** or be pushed **10 feet** away.\n\n- **Uses:** **Proficiency Bonus per Long Rest**",
        "uses": {
          "kind": "proficiency"
        },
        "dice": [
          "2d6",
          "1d6"
        ]
      },
      {
        "level": 4,
        "title": "Phoenix Flash",
        "description": "You become a streak of fire and burst across the battlefield in an instant.\n\n- **Type:** Bonus Action\n- **Range:** Up to 30 feet to an unoccupied space you can see\n- **Uses:** **Proficiency Bonus per Long Rest**\n\nWhen you use this feature:\n\n- You instantly move to the chosen space.\n- Creatures of your choice within **5 feet** of the space you leave and/or the space you arrive in must make a **Dexterity Saving Throw**.\n- On a failed save, they take **2d6 Fire damage**.\n- On a successful save, they take half damage.\n\nIf a creature damaged by this feature is affected by **Burning Ember**, it takes an additional **1d6 Fire damage**.\n\nUntil the end of your turn, your movement does **not provoke opportunity attacks**.",
        "uses": {
          "kind": "proficiency"
        },
        "dice": [
          "2d6",
          "1d6"
        ]
      },
      {
        "level": 5,
        "title": "Dragon God’s Inferno",
        "description": "You unleash the true might of your flames in a catastrophic blast that devours the battlefield.\n\n- **Type:** Action\n- **Area:** Choose one:\n    - **30-foot cone**, or\n    - **60-foot line (5 feet wide)**\n- **Saving Throw:** Dexterity\n- **Uses:** **1 per Long Rest**\n\nCreatures in the area must make a **Dexterity Saving Throw**.\n\n- **Failure:** **8d6 Fire damage**\n- **Success:** Half damage\n\nA creature that fails the save is also **Ignited** until the end of its next turn.\n\n **Ignited**\n\nAt the end of its turn, an Ignited creature takes **1d6 Fire damage**.  \nA creature can use an **Action** to extinguish the flames.\n\nIf a creature in the area was already affected by **Burning Ember**, it takes an extra **2d6 Fire damage**.",
        "uses": {
          "kind": "fixed",
          "value": 1
        },
        "dice": [
          "8d6",
          "1d6",
          "2d6"
        ]
      }
    ]
  },
  {
    "id": "earth",
    "name": "Earth",
    "special": false,
    "color": "#b99a64",
    "icon": "fa-mountain",
    "abilities": [
      {
        "level": 1,
        "title": "Fault Line",
        "description": "Strike the ground, creating a **15-ft line**.\n\n- **1d8 Bludgeoning Damage**\n- **Dex Save**\n- On fail: Speed reduced by **10 ft**\n- Ground becomes **Difficult Terrain**",
        "uses": null,
        "dice": [
          "1d8"
        ]
      },
      {
        "level": 2,
        "title": "Iron Root",
        "description": "Anchor yourself to the earth.\n\n- **Bonus Action**\n- Gain Temporary HP\n- Advantage on **Strength Saves**\n- Cannot be forcibly moved",
        "uses": null,
        "dice": []
      },
      {
        "level": 3,
        "title": "Stone Burial",
        "description": "Stone closes around one enemy.\n\n- **Range:** 30 ft\n- **Strength Save DC 16**\n- On fail: **Restrained**\n- Target repeats the save at the end of its turns\n\nIf the stone prison is destroyed by an Earth ability, the target takes **2d6 Bludgeoning Damage**.",
        "uses": null,
        "dice": [
          "2d6"
        ]
      },
      {
        "level": 4,
        "title": "Tectonic Shift",
        "description": "Manipulate a section of terrain within **60 ft**.\n\nChoose one:\n- **Raise** – Lift terrain 10 ft\n- **Sink** – Create a 10-ft pit\n- **Shift** – Move terrain 15 ft\n- **Wall** – Create stone cover\n\n**Uses:** 2 per Long Rest",
        "uses": {
          "kind": "fixed",
          "value": 2
        },
        "dice": []
      },
      {
        "level": 5,
        "title": "Earth Sovereign",
        "description": "Take control of the ground in a **30-ft radius** for 1 minute.\n\nWhile active:\n\n- Gain **+2 AC**\n- Gain **Tremorsense 30 ft**\n- Enemies treat the area as Difficult Terrain\n- As a **Bonus Action**, create a stone spike, pillar, wall, or knock enemies Prone\n\n**World Splitter**\nOnce during the effect, fracture the entire area.\n\n- Enemies make a **Dex Save 15**\n- **4d8 Bludgeoning Damage**\n- On fail: **Prone**\n\nUsing World Splitter ends Earth Sovereign.",
        "uses": null,
        "dice": [
          "4d8"
        ]
      }
    ]
  },
  {
    "id": "wind",
    "name": "Wind",
    "special": false,
    "color": "#8bcdb2",
    "icon": "fa-wind",
    "abilities": [
      {
        "level": 1,
        "title": "Pressure Mark",
        "description": "You distort the air pressure around one creature within **30 ft**.\n\n- The target is marked until the start of your next turn.\n- If it moves **10 ft or more**, the mark bursts.\n- It takes **1d8 Force Damage**.",
        "uses": null,
        "dice": [
          "1d8"
        ]
      },
      {
        "level": 2,
        "title": "Slipstream",
        "description": "React to another creature's movement.\n\n- **Reaction**\n- When a creature within **15 ft** moves, move up to **half your Speed** in the same direction.\n- This movement costs no movement.",
        "uses": null,
        "dice": []
      },
      {
        "level": 3,
        "title": "Silent Zone",
        "description": "Remove the air vibrations around one creature.\n\n- **Range:** 30 ft\n- **Constitution Save — DC 15**\n- On fail until the end of its next turn:\n\n- Cannot speak.\n- Cannot use **Verbal Components**.\n- Cannot be heard from more than **5 ft** away.",
        "uses": null,
        "dice": []
      },
      {
        "level": 4,
        "title": "Wind Doppelganger",
        "description": "Create a moving copy of yourself made from compressed air.\n\n- **Bonus Action**\n- **Duration:** 1 minute\n- When targeted by an attack, use your **Reaction** to swap places with the clone.\n- The attack hits the clone instead.\n- The clone disappears afterward.\n\n**Uses:** 2 per Long Rest.",
        "uses": {
          "kind": "fixed",
          "value": 2
        },
        "dice": []
      },
      {
        "level": 5,
        "title": "Breathless",
        "description": "Steal the air from one creature within **60 ft**.\n\n- **Constitution Save — DC 15**\n- On fail, the target becomes **Breathless** for up to 3 rounds.\n\nWhile Breathless:\n\n- Cannot regain Hit Points.\n- Cannot take Reactions.\n- Takes **2d8 Force Damage** at the start of its turn.\n- Repeats the **DC 15 Constitution Save** at the end of each turn.\n\n**Final Breath**\n\nIf the target fails **3 saves**, the compressed air violently returns:\n\n**4d8 Force Damage**\nBreathless then ends.\n**Uses:** 1 per Long Rest.",
        "uses": {
          "kind": "fixed",
          "value": 1
        },
        "dice": [
          "2d8",
          "4d8"
        ]
      }
    ]
  },
  {
    "id": "water",
    "name": "Water",
    "special": false,
    "color": "#59b2da",
    "icon": "fa-droplet",
    "abilities": [
      {
        "level": 1,
        "title": "Undertow Seal",
        "description": "Water coils around one creature within **30 ft**.\n\n- **Strength Save — DC 12**\n- On fail, it gains **Undertow** until your next turn.\n- **Undertow** (The first time it attacks its Speed immediately becomes **0** until the end of that turn).",
        "uses": null,
        "dice": []
      },
      {
        "level": 2,
        "title": "Current Link",
        "description": "Connect yourself to an ally within **30 ft** for **1 minute**.\n\nOnce per round, when either of you takes damage, the other may take up to **half of that damage instead**.\n\n- **Bonus Action**\n- **2 uses per Long Rest**",
        "uses": {
          "kind": "fixed",
          "value": 2
        },
        "dice": []
      },
      {
        "level": 3,
        "title": "Purifying Flow",
        "description": "Send cleansing water through one creature within **30 ft**.\n\nChoose one:\n\n- Restore **2d8 + PB HP**\n- End **Poisoned**\n- End **Frightened**\n- End **Charmed**\n\nIf removing a condition, no healing is restored.\n**3 uses per Long Rest**",
        "uses": {
          "kind": "fixed",
          "value": 3
        },
        "dice": [
          "2d8"
        ]
      },
      {
        "level": 4,
        "title": "Liquid Body",
        "description": "Turn your body into living water until the start of your next turn.\n\n- **Reaction** when you take damage\n- Reduce the damage by **2d10 + PB**\n- You can move through spaces as narrow as **1 inch**\n- You cannot be Grappled or Restrained during the effect\n\n**2 uses per Long Rest**",
        "uses": {
          "kind": "fixed",
          "value": 2
        },
        "dice": [
          "2d10"
        ]
      },
      {
        "level": 5,
        "title": "Crushing Depth",
        "description": "Surround one creature within **60 ft** with supernatural deep-sea pressure.\n\n- **Constitution Save — DC 15**\n- **Duration:** Up to 3 rounds\n\nOn failure, the target gains **1 Pressure Level**.\n\nAt the end of each of its turns, it repeats the save.\n\n**Pressure Levels:**\n\n- **1:** Speed reduced by half\n- **2:** Disadvantage on Attack Rolls\n- **3:** Takes **5d8 Bludgeoning Damage** and is **Stunned until the end of its next turn**\n\nAfter reaching Pressure Level 3, **Crushing Depth ends**.\n\n**1 use per Long Rest**",
        "uses": {
          "kind": "fixed",
          "value": 1
        },
        "dice": [
          "5d8"
        ]
      }
    ]
  },
  {
    "id": "lightning",
    "name": "Lightning",
    "special": false,
    "color": "#f2c55a",
    "icon": "fa-bolt",
    "abilities": [
      {
        "level": 1,
        "title": "Static Brand",
        "description": "Charge one creature within **30 ft**.\n\n- **Dexterity Save — DC 15**\n- On fail, the target becomes **Charged** until your next turn.\n- The next time it makes an Attack Roll, it takes **1d8 Lightning Damage** before the attack resolves.",
        "uses": null,
        "dice": [
          "1d8"
        ]
      },
      {
        "level": 2,
        "title": "Reflex Surge",
        "description": "Flood your nervous system with electricity.\n\n- **Reaction**\n- Trigger: You fail a Dexterity Save or are hit by an attack.\n- Add **+3** to your AC or Dexterity Save against that effect.\n\n**Uses:** 2 per Long Rest",
        "uses": {
          "kind": "fixed",
          "value": 2
        },
        "dice": []
      },
      {
        "level": 3,
        "title": "Nerve Lock",
        "description": "Send a precise electrical impulse through one creature within **30 ft**.\n\n- **Constitution Save — DC 13**\n- On fail, choose one:\n- It drops one held item\n- It loses its Bonus Action-\n- Its Speed becomes **0**\n- It cannot make Opportunity Attacks\n\nEffect lasts until the end of its next turn.\n\n**Uses:** Proficiency Bonus per Long Rest",
        "uses": {
          "kind": "proficiency"
        },
        "dice": []
      },
      {
        "level": 4,
        "title": "Thundherheart",
        "description": "Store electrical energy inside your body for **1 minute**.\n\nEach time you take damage, gain **1 Charge**, up to 3.\n\nAs a **Bonus Action**, spend all Charges:\n\n- **1 Charge:** Gain **10 ft movement**\n- **2 Charges:** Gain **Advantage on your next attack**\n- **3 Charges:** Your next hit deals +3d8 Lightning Damage**\n\n**2 uses per Long Rest**",
        "uses": {
          "kind": "fixed",
          "value": 2
        },
        "dice": [
          "3d8"
        ]
      },
      {
        "level": 5,
        "title": "Zero Point",
        "description": "Choose one creature within **60 ft** and overload its entire nervous system.\n\n- **Constitution Save — DC 15**\n\nOn fail:\n- Takes **4d8 Lightning Damage**\n- Cannot take Reactions\n- Its next Attack Roll automatically has **Disadvantage**\n\nIf this reduces it to **0 HP**, electricity erupts from its body and you regain **one use of Reflex Surge**.\n\n**1 use per Long Rest**",
        "uses": {
          "kind": "fixed",
          "value": 1
        },
        "dice": [
          "4d8"
        ]
      }
    ]
  },
  {
    "id": "psychic",
    "name": "Psychic",
    "special": false,
    "color": "#c99bed",
    "icon": "fa-brain",
    "abilities": [
      {
        "level": 1,
        "title": "Sensory Split",
        "description": "Temporarily disconnect one of the target's senses from its mind.\n\n- **Range:** 30 ft\n- **Intelligence Save — DC 12**\n- On fail, choose one until the end of its next turn:\n- **Sight:** Cannot see beyond **10 ft**\n- **Hearing:** Cannot hear anything\n- **Balance:** Has Disadvantage on Dexterity Checks and Saving Throws",
        "uses": null,
        "dice": []
      },
      {
        "level": 2,
        "title": "False Memory",
        "description": "Plant a brief false memory into one creature.\n\n- **Range:** 30 ft\n- **Wisdom Save — DC 12**\n- On fail, choose one:\n- It believes one creature is an ally\n- It believes one creature is an enemy\n- It forgets the last **6 seconds**\n\nEffect lasts until the end of its next turn.",
        "uses": null,
        "dice": []
      },
      {
        "level": 3,
        "title": "Shared Mind",
        "description": "Link your mind with one willing creature within **30 ft** for **1 minute**.\n\nWhile linked:\n\n- You can communicate telepathically.\n- Once per round, one of you may use the other's **Perception, Insight, or Investigation bonus**.\n- If one succeeds on a Wisdom Save, the other gains **+2** to its next Wisdom Save.\n\n**2 uses per Long Rest**",
        "uses": {
          "kind": "fixed",
          "value": 2
        },
        "dice": []
      },
      {
        "level": 4,
        "title": "Predictive Vision",
        "description": "See a few seconds into the future.\n\n- **Bonus Action**\n- Duration: Until the start of your next turn\n\nChoose one:\n\n- Gain **Advantage on all Saving Throws**\n- Gain **Advantage on all Attack Rolls**\n- Enemies have **Disadvantage on attacks against you**\n\n**2 uses per Long Rest**",
        "uses": {
          "kind": "fixed",
          "value": 2
        },
        "dice": []
      },
      {
        "level": 5,
        "title": "Mind Rewrite",
        "description": "Temporarily overwrite one creature's perception of reality.\n\n- **Range:** 60 ft\n- **Wisdom Save — DC 15**\n- On fail, choose one effect for **1 minute**:\n\n**Broken Reality:** The creature cannot distinguish allies from enemies.\n\n**Forgotten Threat:** The creature completely ignores one creature you choose.\n\n**Commanded Thought:** At the start of each of its turns, you may give it one simple mental command.\n\nThe target repeats the save at the end of each turn.\n\n**1 use per Long Rest**",
        "uses": {
          "kind": "fixed",
          "value": 1
        },
        "dice": []
      }
    ]
  },
  {
    "id": "necrotic",
    "name": "Necrotic",
    "special": false,
    "color": "#a182c1",
    "icon": "fa-skull",
    "abilities": [
      {
        "level": 1,
        "title": "Death Pulse",
        "description": "Release a short pulse of necrotic energy around you.\n\n- **Radius:** 30 ft\n- **Constitution Save — DC 12**\n- On fail: **1d6 Necrotic Damage**\n- The target cannot gain **HP** until the start of your next turn.\n- If the target is already below half HP, it takes an additional **1d4 Necrotic Damage**.",
        "uses": null,
        "dice": [
          "1d6",
          "1d4"
        ]
      },
      {
        "level": 2,
        "title": "Death Omen",
        "description": "Place a dark omen on one creature within **30 ft**.\n\n- **Bonus Action**\n- Duration: **1 minute ( Concentration)**\n- The first time each round the target fails a **Constitution Saving Throw** **(14)**, it takes **1d6 Necrotic Damage**\n\n**2 uses per Long Rest**",
        "uses": {
          "kind": "fixed",
          "value": 2
        },
        "dice": [
          "1d6"
        ]
      },
      {
        "level": 3,
        "title": "Soul Fracture",
        "description": "Damage the connection between body and soul.\n\n- **Range:** 30 ft\n- **Charisma Save — DC 13**\n- On fail, choose one:\n- **-2 AC**\n- **-2 to Saving Throws**\n- Cannot regain Hit Points\n\nEffect lasts until the end of your next turn.\n\n**Uses:** Proficiency Bonus per Long Rest",
        "uses": {
          "kind": "proficiency"
        },
        "dice": []
      },
      {
        "level": 4,
        "title": "Death Echo",
        "description": "When a creature within **30 ft** drops to **0 HP**, capture part of its fading energy.\n\nGain **1 Soul Echo**, up to 3.\n\nSpend them as a **Bonus Action**:\n\n- **1 Echo:** Gain **1d8 Temporary HP**\n- **2 Echoes:** Recover one expended Affinity use\n- **3 Echoes:** Next damaging ability deals **+3d8 Necrotic Damage**\n\nSoul Echoes disappear after a Long Rest.",
        "uses": null,
        "dice": [
          "1d8",
          "3d8"
        ]
      },
      {
        "level": 5,
        "title": "Death Sentence",
        "description": "Mark one creature within **60 ft** for death.\n\n- **Wisdom Save — DC 15**\n- On fail: gains **Death Sentence** for 3 rounds.\n\nAt the end of each turn, it gains **1 Doom Mark**:\n\n- **1 Mark:** Speed reduced by 10 ft\n- **2 Marks:** Disadvantage on Saving Throws\n- **3 Marks:** **6d8 Necrotic Damage**\n\nThe target repeats the **DC 15 Wisdom Save** at the end of each turn.\n\n**1 use per Long Rest**",
        "uses": {
          "kind": "fixed",
          "value": 1
        },
        "dice": [
          "6d8"
        ]
      }
    ]
  },
  {
    "id": "poison",
    "name": "Poison",
    "special": false,
    "color": "#87c368",
    "icon": "fa-flask",
    "abilities": [
      {
        "level": 1,
        "title": "Numbing Venom",
        "description": "Infuse one creature within **30 ft** with a fast-acting toxin.\n\n- **Constitution Save — DC 12*\n- On fail, choose one until the end of its next turn:\n- **Numb Arms:** -2 to Attack Rolls\n- **Numb Legs:** Speed reduced by **10 ft**\n- **Blurred Vision:** Disadvantage on Perception checks and ranged attacks",
        "uses": null,
        "dice": []
      },
      {
        "level": 2,
        "title": "Venom Coat",
        "description": "Coat one weapon with concentrated toxin.\n\n- **Bonus Action**\n- Duration: **1 minute**\n- First successful hit each round deals **+1d6 Poison Damage**\n- On a Critical Hit, target also suffers **-10 ft Speed** until its next turn\n\n**2 uses per Long Rest**",
        "uses": {
          "kind": "fixed",
          "value": 2
        },
        "dice": [
          "1d6"
        ]
      },
      {
        "level": 3,
        "title": "Toxic Adaptation",
        "description": "Expose your body to controlled poison and evolve resistance.\n\n- Gain **Resistance to Poison Damage**\n- Gain **Advantage on saves against Poisoned**\n- Once per Long Rest, when you succeed on a Constitution Save, regain **1d8 HP**",
        "uses": null,
        "dice": [
          "1d8"
        ]
      },
      {
        "level": 4,
        "title": "Corrosive Venom",
        "description": "Inject an unstable toxin into one creature within **30 ft**.\n\n- **Constitution Save — DC 14**\n- On fail, for **2 rounds**:\n- Takes **1d6 Poison Damage** at the start of its turn\n- Its AC is reduced by **1**\n\nTarget repeats the save at the end of each turn.",
        "uses": null,
        "dice": [
          "1d6"
        ]
      },
      {
        "level": 5,
        "title": "Perfect Toxin",
        "description": "Create a custom poison that adapts to one target.\n\n- **Range:** 30 ft\n- **Constitution Save — DC 15**\n- On fail, choose **2 effects** for 3 rounds:\n- **Neurotoxin:** Cannot take Reactions\n- **Muscle Venom:** Disadvantage on Strength and Dexterity Saves\n- **Hallucinogen:** Disadvantage on Attack Rolls\n- **Blood Toxin:** Takes **2d6 Poison Damage** at the start of each turn\n\nTarget repeats the save at the end of each turn.\n\n**1 use per Long Rest**",
        "uses": {
          "kind": "fixed",
          "value": 1
        },
        "dice": [
          "2d6"
        ]
      }
    ]
  },
  {
    "id": "acid",
    "name": "Acid",
    "special": false,
    "color": "#96c777",
    "icon": "fa-vial",
    "abilities": [
      {
        "level": 1,
        "title": "Acid Brand",
        "description": "Mark one creature within **30 ft** with unstable corrosive residue.\n\n- **Dexterity Save — DC 12**\n- On fail, the target is **Branded** until the end of your next turn.\n- The first time it is hit by a **weapon attack**, the brand ruptures.\n- It takes **1d8 Acid Damage**.\n- The attacking weapon is unaffected.",
        "uses": null,
        "dice": [
          "1d8"
        ]
      },
      {
        "level": 2,
        "title": "Melt Line",
        "description": "Drag a stream of acid across the ground.\n\n- **15-ft line**\n- **Dexterity Save — DC 12**\n- On fail: **2d6 Acid Damage**\n- The line becomes **Hazardous Terrain** until your next turn\n- Creatures entering it take **1d4 Acid Damage**\n\n**2 uses per Long Rest**",
        "uses": {
          "kind": "fixed",
          "value": 2
        },
        "dice": [
          "2d6",
          "1d4"
        ]
      },
      {
        "level": 3,
        "title": "Structural Decay",
        "description": "Target armor, shield, weapon, or object within **30 ft**.\n\n- **Dexterity Save — DC 13**\n- On fail, choose one:\n- **Armor/Shield:** -1 AC\n- **Weapon:** -1 to Damage Rolls\n- **Object:** Takes double Acid Damage\n\nEffect lasts **1 minute**.\n\n**Uses:** Proficiency Bonus per Long Rest",
        "uses": {
          "kind": "proficiency"
        },
        "dice": []
      },
      {
        "level": 4,
        "title": "Reactive Acid",
        "description": "When a creature affected by one of your Acid abilities takes **Fire, Lightning, or Cold Damage**, use your **Reaction**.\n\nThe target takes:\n\n**2d8 Acid Damage**\n\nAnd depending on the trigger:\n\n- **Fire:** Small acid explosion\n- **Lightning:** Target loses its Reaction\n- **Cold:** Target's Speed becomes **0** until its next turn\n\n**2 uses per Long Rest**",
        "uses": {
          "kind": "fixed",
          "value": 2
        },
        "dice": [
          "2d8"
        ]
      },
      {
        "level": 5,
        "title": "Dissolution",
        "description": "Choose one creature within **60 ft** and begin breaking down its physical form.\n\n- **Constitution Save — DC 15**\n- On fail, lasts **3 rounds**\n\nAt the start of each turn:\n\n- **Round 1:** 2d8 Acid Damage\n- **Round 2:** 3d8 Acid Damage\n- **Round 3:** 4d8 Acid Damage\n\nEach round also reduces the target's AC by **1**, up to **-3 AC**.\n\nThe target repeats the save at the end of each turn.\n\n**1 use per Long Rest**",
        "uses": {
          "kind": "fixed",
          "value": 1
        },
        "dice": [
          "2d8",
          "3d8",
          "4d8"
        ]
      }
    ]
  },
  {
    "id": "ice",
    "name": "Ice",
    "special": false,
    "color": "#8bdcec",
    "icon": "fa-snowflake",
    "abilities": [
      {
        "level": 1,
        "title": "Frostbite",
        "description": "Freeze part of one creature within **30 ft**.\n\n- **Constitution Save — DC 12**\n- On fail: **1d8 Cold Damage**\n\n- Choose one:\n\n- **Frozen Arm:** -2 to next Attack Roll\n- **Frozen Leg:** Speed reduced by **10 ft**\n- **Frozen Guard:** -1 AC until your next turn",
        "uses": null,
        "dice": [
          "1d8"
        ]
      },
      {
        "level": 2,
        "title": "Ice Armor",
        "description": "Cover your body in compact magical ice.\n\n- **Bonus Action**\n- Duration: **1 minute**\n- Gain **+1 AC**\n- Gain **Temporary HP equal to 2 × PB**\n- When the Temporary HP reaches 0, the armor breaks.\n\n**2 uses per Long Rest**",
        "uses": {
          "kind": "fixed",
          "value": 2
        },
        "dice": []
      },
      {
        "level": 3,
        "title": "Winter Stasis",
        "description": "Temporarily preserve yourself or an ally in supernatural ice.\n\n- **Range:** 30 ft\n- Until the start of your next turn:\n- Cannot move or act   \n- Cannot take damage\n- Cannot gain or lose HP\n- Ongoing harmful effects are paused\n\n**2 uses per Long Rest**",
        "uses": {
          "kind": "fixed",
          "value": 2
        },
        "dice": []
      },
      {
        "level": 4,
        "title": "Shatterpoint",
        "description": "Create microscopic cracks of frost through one creature.\n\n- **Range:** 30 ft\n- **Constitution Save — DC 14**\n- On fail, the next **3 successful attacks** against it add a Crack.\n\nAt **3 Cracks**, the ice shatters:\n\n**3d8 Cold Damage**\n\n**2 uses per Long Rest**",
        "uses": {
          "kind": "fixed",
          "value": 2
        },
        "dice": [
          "3d8"
        ]
      },
      {
        "level": 5,
        "title": "Absolute Zero",
        "description": "Force one creature within **60 ft** toward complete thermal collapse.\n\n- **Constitution Save — DC 15**\n- On fail, lasts up to **3 rounds**\n\nEach round increases the Freeze Stage:\n\n- **Stage 1:** Cannot take Reactions\n- **Stage 2:** Can take either an Action or Bonus Action, not both\n- **Stage 3:** Takes **6d8 Cold Damage** and becomes **Frozen** until the end of its next turn\n\nThe target repeats the save at the end of each turn.\n\n**1 use per Long Rest**",
        "uses": {
          "kind": "fixed",
          "value": 1
        },
        "dice": [
          "6d8"
        ]
      }
    ]
  },
  {
    "id": "radiant",
    "name": "Radiant",
    "special": false,
    "color": "#e9cf88",
    "icon": "fa-sun",
    "abilities": [
      {
        "level": 1,
        "title": "Guiding Spark",
        "description": "Fire a spark of sacred light at one creature within **60 ft**.\n\n- **Ranged Spell Attack**\n- **1d8 Radiant Damage**\n- The next attack against the target has **Advantage**",
        "uses": null,
        "dice": [
          "1d8"
        ]
      },
      {
        "level": 2,
        "title": "Halo of Protection",
        "description": "Create a protective halo around yourself.\n\n- **Bonus Action**\n- **10-ft radius**\n- Duration: **1 minute**\n- You and nearby allies gain **+1 AC**\n\n**2 uses per Long Rest**",
        "uses": {
          "kind": "fixed",
          "value": 2
        },
        "dice": []
      },
      {
        "level": 3,
        "title": "Chains of Light",
        "description": "Summon radiant chains around one creature within **30 ft**.\n\n- **Strength Save — DC 13**\n- On fail:\n- **2d6 Radiant Damage**   \n- Target becomes **Restrained**\n- Repeats the save at the end of each turn\n\n**2 uses per Long Rest**",
        "uses": {
          "kind": "fixed",
          "value": 2
        },
        "dice": [
          "2d6"
        ]
      },
      {
        "level": 4,
        "title": "Light of Revelation",
        "description": "Flood one creature with divine light that reveals its true nature.\n\n- **Range:** 60 ft\n- **Wisdom Save — DC 14**\n- On fail, for **1 minute**:\n- Cannot become **Invisible**   \n- Magical disguises and transformations become visible\n- Cannot benefit from being Hidden    \n- Attacks against it ignore **Half Cover**\n\nTarget repeats the save at the end of each turn.\n\n**2 uses per Long Rest**",
        "uses": {
          "kind": "fixed",
          "value": 2
        },
        "dice": []
      },
      {
        "level": 5,
        "title": "Miracle of Dawn",
        "description": "Call back a fading soul with sacred light.\n\n- **Action**\n- **Range:** 30 ft\n- Target a creature that died within the last **1 minute**\n\nThe creature returns to life with:\n\n**4d8 + PB Hit Points**\n\nIt also immediately ends one of the following:\n- Charmed\n- Frightened\n- Poisoned\n- Paralyzed\n\nA creature can benefit from **Miracle of Dawn only once between Long Rests**.\n\n**1 use per Long Rest**",
        "uses": {
          "kind": "fixed",
          "value": 1
        },
        "dice": [
          "4d8"
        ]
      }
    ]
  },
  {
    "id": "force",
    "name": "Force",
    "special": false,
    "color": "#acbce8",
    "icon": "fa-burst",
    "abilities": [
      {
        "level": 1,
        "title": "Kinetic Reversal",
        "description": "Redirect the force of an incoming strike.\n\n- **Reaction** when hit by a melee attack\n- Reduce damage by **1d8 + PB**\n- Attacker must make a **Strength Save — DC 12**\n- On fail, it is knocked **5 ft backward**",
        "uses": null,
        "dice": [
          "1d8"
        ]
      },
      {
        "level": 2,
        "title": "Momentum Step",
        "description": "Store your movement as kinetic energy.\n\n- If you move at least **20 ft** on your turn, gain **Momentum**\n- Your next melee hit before your next turn deals **+1d8 Force Damage**\n- You can hold only **1 Momentum**",
        "uses": null,
        "dice": [
          "1d8"
        ]
      },
      {
        "level": 3,
        "title": "Trajectory Shift",
        "description": "Alter the direction of an attack in mid-air.\n\n- **Reaction**\n- When a ranged attack passes within **15 ft** of you\n- Roll **1d20 + PB** against the attack roll\n- If you equal or beat it, redirect the attack toward another valid target within range\n\n**2 uses per Long Rest**",
        "uses": {
          "kind": "fixed",
          "value": 2
        },
        "dice": [
          "1d20"
        ]
      },
      {
        "level": 4,
        "title": "Inertia Break",
        "description": "Remove the momentum from one creature within **30 ft**.\n\n- **Constitution Save — DC 14**\n- On fail, until the end of its next turn:\n- Speed becomes **10 ft**  \n- Cannot Dash\n- Cannot be pushed, pulled, or launched \n- Attacks made after moving deal **-1d8 damage**\n\n**2 uses per Long Rest**",
        "uses": {
          "kind": "fixed",
          "value": 2
        },
        "dice": [
          "1d8"
        ]
      },
      {
        "level": 5,
        "title": "Vector Collapse",
        "description": "Choose one creature within **60 ft** and distort every force acting on its body.\n\n- **Strength Save — DC 15**\n- On fail, for **3 rounds**, whenever the target:\n- Moves\n- Attacks  \n- Is hit\n\n…it gains **1 Vector**, up to 5.\n\nAt the end of your turn, you may detonate all stored Vectors:\n\n**1d8 Force Damage per Vector**\n\nAt **5 Vectors**, the target is also knocked **Prone**.\n\n**1 use per Long Rest**",
        "uses": {
          "kind": "fixed",
          "value": 1
        },
        "dice": [
          "1d8"
        ]
      }
    ]
  },
  {
    "id": "blood",
    "name": "Blood",
    "special": true,
    "color": "#cc6674",
    "icon": "fa-heart-pulse",
    "abilities": [
      {
        "level": 1,
        "title": "Blood Sense",
        "description": "You attune your senses to the blood flowing through living creatures, allowing you to detect injuries and track wounded enemies.\n\n- Type: Passive\n- Range: 30 feet\n- Gain Advantage on Perception and Survival Checks when attempting to detect or track a wounded living creature.\n- You can sense the general direction of a wounded creature within 30 feet, even if it is hidden or invisible.\n- This ability cannot detect creatures without blood.",
        "uses": null,
        "dice": []
      },
      {
        "level": 2,
        "title": "Blood Strike",
        "description": "Channel blood energy into your attacks, draining the vitality of your enemies to restore your own.\n\n- Type: Bonus Action\n- Duration: 1 minute\n- Uses: 2 per Long Rest\n\nWhile active:\n\n- Your first successful attack each turn deals an additional 1d6 Necrotic Damage.\n- You regain Hit Points equal to half the additional Necrotic Damage dealt (rounded down).\n- If the target is below half its maximum HP, the additional damage increases to 1d8 Necrotic Damage.",
        "uses": {
          "kind": "fixed",
          "value": 2
        },
        "dice": [
          "1d6",
          "1d8"
        ]
      },
      {
        "level": 3,
        "title": "Crimson Surge",
        "description": "Turn your own suffering into power, allowing your blood to fuel your strength and speed.\n\n- Type: Bonus Action\n- Duration: 1 minute\n- Uses: Proficiency Bonus per Long Rest\n\nWhen activated:\n\n- Sacrifice 1d6 Hit Points. This loss cannot be reduced or prevented.\n- Gain +1 to Attack Rolls.\n- Your movement Speed increases by 10 feet.",
        "uses": {
          "kind": "proficiency"
        },
        "dice": [
          "1d6"
        ]
      },
      {
        "level": 4,
        "title": "Blood Control",
        "description": "Manipulate the blood inside an enemy's body, restricting its movements and inflicting internal damage.\n\n- Type: Action\n- Range: 30 feet\n- Constitution Save — DC 14\n- Duration: Concentration, up to 1 minute\n- Uses: 2 per Long Rest\n\nOn a failed save:\n\n- The target takes 2d6 Necrotic Damage.\n- The target becomes Restrained.\n- At the start of each of its turns, it takes 1d6 Necrotic Damage.\n- The target repeats the Constitution Saving Throw at the end of each turn, ending the effect on a success.",
        "uses": {
          "kind": "fixed",
          "value": 2
        },
        "dice": [
          "2d6",
          "1d6"
        ]
      },
      {
        "level": 5,
        "title": "Blood Awakening",
        "description": "Awaken the full potential of your blood, transforming your body into a vessel of destructive power and supernatural regeneration.\n\n- Type: Bonus Action\n- Range: Self\n- Duration: 1 minute\n- Uses: 1 per Long Rest\n\nWhile Blood Awakening is active:\n\n- Gain +2 to Attack Rolls.\n- Gain Resistance to Necrotic Damage.\n- Your first successful attack each turn deals an additional 2d6 Necrotic Damage.\n- At the start of each of your turns, if you are below half your maximum HP, regain 1d8 Hit Points.",
        "uses": {
          "kind": "fixed",
          "value": 1
        },
        "dice": [
          "2d6",
          "1d8"
        ]
      }
    ]
  },
  {
    "id": "thunder",
    "name": "Thunder",
    "special": false,
    "unavailable": true,
    "color": "#84b6cc",
    "icon": "fa-cloud-bolt",
    "abilities": []
  }
]);
export const AFFINITY_MAP = Object.freeze(Object.fromEntries(AFFINITIES.map(a=>[a.id,a])));