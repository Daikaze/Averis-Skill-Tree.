# Averis Skill Tree — D&D 5e (v0.1.0)

A custom Foundry VTT **V14** module for the Averis D&D campaign. This is an initial *playtest build*; it has been statically checked but not run inside your Foundry instance.

## Install via Manifest URL (recommended)

In Foundry VTT **Setup → Add-on Modules → Install Module**, paste this into **Manifest URL** and click **Install**:

```text
https://github.com/Daikaze/Averis-Skill-Tree./releases/latest/download/module.json
```

Once installed, launch the D&D 5e world and enable **Averis Skill Tree — D&D 5e** via **Game Settings → Manage Modules**. Future published releases can be picked up by **Check Update**. The repository name intentionally ends with a dot; preserve it in the URL.

## Install locally

1. Shut down the Foundry server, or at least close the world.
2. Extract the included `averis-skill-tree` folder into `FoundryVTT/Data/modules/` in your **Foundry User Data** directory. The path must end with `Data/modules/averis-skill-tree/module.json`.
3. Start Foundry V14, open your D&D 5e world, select **Game Settings → Manage Modules**, enable **Averis Skill Tree — D&D 5e** and save.
4. Open any D&D 5e **Character** sheet and select **Skill Tree**. The module also exposes `game.modules.get("averis-skill-tree").api.openSelected()` as a macro-friendly function.

**Before trying on your main campaign:** Back up your Foundry world. Some node unlocks create and delete Actor Items and Active Effects.

## Design

- One *Averis Skill Level* per character, with independent Skill XP and Skill Points. Starts at Skill Level 1 with 1 point; each later level adds 1 point. Needed XP for next level = current Skill Level × 100.
- **General** trees are available to all PCs.
- **Class** trees are shown when the character actually has a class Item (e.g. Paladin).
- **Affinity** trees are opt-in and only appear after GM uses **Assign Affinities**.
- All trees/nodes are defined in a world-level setting, editable in the interface by the GM. Character progress is saved using actor flags.
- D&D actions, weapons, spells, and features are granted by copying a **real existing Foundry dnd5e Item** from a World Item or Compendium into the Actor. Its normal D&D 5e Activities control attacks, spell slots, damage, saves, action economy, concentration, and uses.
- Skill proficiency/expertise or passive modifiers are applied through native dnd5e Active Effects. Supported effect keys are restricted to validated dnd5e paths.
- A missing Item UUID blocks spending points rather than awarding a non-functional ability.
- D&D's core level/proficiency progression, class advancements, spellcasting rules, and combat calculations are not replaced.

## GM: adding a D&D skill, attack, or spell

1. Open a character's Skill Tree; press **+** in the tree header to add a node, or the pencil icon to edit an existing node.
2. For an existing **spell**: in Items or a Compendium, create/select the Spell with the exact correct spell level, school, components, casting time (Action/Bonus Action/Reaction), spell slots, range, target, saving throw, damage dice, Concentration, and limits. Right-click / obtain its document UUID, paste it into the Skill Tree node. Set `D&D category: Spell` and `Grant method: Link an existing D&D 5e Item`.
3. For **melee / ranged / spell attacks**: use a native Weapon, Spell or Feat Item with an Attack Activity and Damage Activity. Configure the relevant proficiency, range, damage and uses there, then link the Item UUID as above.
4. For **class features / affinity features**: use a native Feature (Feat) Item, optionally with its own Activities and Active Effects. Link the UUID.
5. For **Skill Checks**: select `Grant method: Proficiency / Expertise` and the exact D&D skill (e.g. Stealth). Set `Max Ranks: 2`: Rank 1 grants proficiency; Rank 2 grants expertise (using the system upgrade mode).
6. For **passives**: choose `D&D 5e Active Effect` and a supported target (AC, initiative, attack, damage, save bonus, etc.). `Bonus per rank` is applied for each unlocked rank.
7. Set `Tier`, `Minimum Skill Level`, `Cost per rank`, and prerequisite **node IDs**. GM sees IDs at the bottom of each node.

Important: The supplied class and affinity trees intentionally contain **template slots**, not new invented class or Affinity mechanics. The GM must link real D&D5e Items before players can buy them. This prevents duplicate class features and preserves all existing Averis Affinity definitions.

## GM tools

- **+ XP:** Award/remove Skill XP. Raising an Averis Skill Level automatically adds a point.
- **+ Points:** Give optional extra points.
- **Assign Affinities:** Allow only selected elemental trees for the Actor.
- **New Tree:** Add your own Common, Class, Affinity or Character-specific tree.
- **Add/Edit/Delete Nodes:** Set properties and prerequisites. Nodes already invested in by a world character cannot be edited or removed until the GM resets affected character progression.
- **Reset Character:** Deletes *only* Items and Active Effects that have this module's `nodeId` flag and resets this Actor's skill progression. Other Items/Effects are untouched.

## Version scope & limitations

- Foundry **V14**, D&D 5e **5.3.3+** intended. Not yet live-tested with your exact sheet, installed modules or Foundry build.
- The module supports **PC Actors (character)**; NPCs are excluded in this initial version.
- All effects granted via this module are permanent Actor Active Effects. Do not represent a 1-minute spell or temporary buff as a permanent passive; instead link an actual D&D5e Item with its own temporary effect and duration.
- Editing a *source* Item later does **not** retroactively update the already-granted Actor copy.
- Deleting an existing tree/nodes with stored Actor investments from token-only Actors (not in the World Actors directory) is not completely guarded. Prefer backups and world Actors.
- If a class has already granted a feature through standard D&D class advancement, don't grant that identical Item again via Skill Tree.
- All initial attack/spell/affinity slots need GM-linked Items; they do not cast automatically from the tree itself.
- No cross-client transaction lock: avoid two owners purchasing from the exact same Actor simultaneously.

## Example macro

```js
await game.modules.get("averis-skill-tree").api.openSelected();
```

## File structure

```
averis-skill-tree/
  module.json
  scripts/
    main.js
    data.js
  styles/
    tree.css
  templates/
    main.hbs
  README.md
```

## References

- Foundry V14 [ApplicationV2 and HandlebarsApplicationMixin](https://foundryvtt.com/api/modules/foundry.applications.html)
- Foundry [Introduction to Module Development](https://foundryvtt.com/article/module-development/)
- Foundry dnd5e [Active Effect Guide](https://github.com/foundryvtt/dnd5e/wiki/Active-Effect-Guide)
- Foundry dnd5e [Activities](https://github.com/foundryvtt/dnd5e/wiki/Activities)
