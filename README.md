# Averis Bound System — Foundry VTT 14 / dnd5e 5.3.3

**Playtest v0.1.0** · independent Foundry module, no dependencies on Midi-QOL, DAE, Sequencer or any other third-party modules.

Averis Bound is a 2-character cooperative system for **more than just attacks**. It works alongside normal D&D 5e checks, Activities, spellcasting, reactions and conditions; it does not override the system's action economy or automate casting on another player's behalf.

## How to install

**Manifest URL (GitHub):**

```text
https://raw.githubusercontent.com/Daikaze/Averis-Skill-Tree./averis-bound-system/module.json
```

In **Foundry Setup → Add-on Modules → Install Module**, paste the URL into **Manifest URL** and click Install. Start the world and enable *Averis Bound System* in Manage Modules.

**Important GitHub organization:** The module is temporarily hosted in a *dedicated branch* (`averis-bound-system`) of your existing `Daikaze/Averis-Skill-Tree.` repository because the connected GitHub integration cannot create repositories. The default `main` branch and the Skill Tree manifest/release are left untouched. A dedicated `Daikaze/Averis-Bound-System` repository would be preferable later.

For manual install, extract the release zip into the Foundry User Data directory's `Data/modules/averis-bound-system/` so `module.json` is directly inside this folder. Always back up the world first.

## Nine cooperative variants

| Variant | Category | Action requirements | Combined benefit (GM adjudicated) |
|---|---|---|---|
| Twin Strike | Melee | Action + Action | Both melee attacks land → roll 1d6 extra Force damage |
| Crossfire | Ranged | Action + Action | Both ranged attacks land → roll 1d6 shared damage |
| Spell Weave | Spells | Cast normal spells / spend normal slots | Both spells affect one target → 1d6 extra Force damage |
| Healing Chorus | Healing | Normal healing actions/spells | Both heal an ally → 1d6 extra healing |
| Guardian Link | Defense | Reaction + Reaction | +2 AC vs one attack (GM temporarily adjudicates) |
| Tactical Feint | Control | Action + Reaction | Failed normal Wisdom save → -1d4 to target's next attack |
| Skill Synergy | Skill checks | Action + Action (or downtime) | Two successful checks → +1d4 one follow-up check |
| Evasive Relay | Movement | Reaction + Reaction | Two allies each move up to 10 ft, subject to standard movement rules |
| Rallying Call | Support | Bonus Action + Bonus Action | Give one ally 1d4 temporary HP (non-stacking) |

All numeric benefits are **playtest proposals**, not preexisting Averis canon. The GM can create different custom modes using **Manage Bound variants** in Module Settings. The core module never deals extra damage or edits HP/AC automatically; shared dice are rolled **once** after the GM clicks the chat card button. The GM applies the benefit manually according to the situation.

## Averis Bound restrictions

- 2 Bound uses **per character** in each encounter (both participants spend 1).
- **3 complete round numbers** between uses for each participant, so a use on Round 1 permits their next use at Round 4.
- No repeating the same partner in one encounter.
- Melee and ranged attack modes require both participants to use the same attack style; this is declared by mode and manually confirmed by GM. No automatic item-type guesswork.
- Attack modes can require characters to stand on **opposite sides** of the target, using token positions and an angle tolerance, and be within appropriate maximum reach.
- Special Averis exhaustion exception: ignore exhaustion level 1–2 penalties **for the Bound maneuver only**. The module does **not** remove exhaustion statuses or change D&D 5e's normal exhaustion handling outside Bound.
- During combat, both characters must be in the active combat on the current scene and conscious. Out of combat, Bound is tracked **per scene** and uses reset only using the GM Reset Encounter action. No round-based cooldown outside combat.
- Targeting does not infer allegiance, line of sight, magic components, weapon reach or real remaining spell slots: GM confirms these. D&D 5e items and activities handle the actual attacks, spell slots and rolls.

## Using it

1. Place two PC Character tokens on the same scene. They must be different characters. Start combat if you're using Bound in combat.
2. **Alt+B** or **Bound** on a Character Sheet or this macro:
   ```js
   game.modules.get("averis-bound-system").api.open();
   ```
3. Select initiator, partner, variant and a target if relevant.
4. The active GM receives a confirmation dialog. Ask both participants if they agree, check action/spell/reaction availability, and approve.
5. Both users roll their normal D&D attacks, checks or spell Activities; any shared bonus is rolled by the GM once from the resulting chat card after success conditions are met.
6. **For GM status and reset** use:
   ```js
   game.modules.get("averis-bound-system").api.status();
   ```
7. Custom variants: **Game Settings → Configure Settings → Module Settings → Averis Bound System → Manage Bound variants**.

## Anti-bug measures and known boundaries

- One active GM processes and writes all Bound actions in a serialized queue, so two players cannot spend the same use simultaneously through this module.
- Requests must receive GM confirmation; the module never modifies protected encounter resources on a player's unauthorised request.
- It reads current positions, initiative, uses and round **again after** the GM finishes approving, to prevent stale requests.
- Encounter state is stored once on the Combat Document; out-of-combat state is on the Scene Document. Scene and combat states remain separate. No token/actor HP or effect edits.
- Unique request IDs block duplicate accepted actions; chat shared bonus rolls have a one-time ledger flag.
- The GM sees the claimed requester name but direct Foundry sockets do not provide authenticated sender identity; **GM approval is the security boundary**. Only run this module with trusted players.
- Spell slots, concentration, ammunition, action / bonus action / reaction use, LOS, immunities and native dnd5e Activities are always handled by the players' standard sheets and the GM. This is not a Midi-QOL replacement and does not automatically subtract HP.
- Never reset mid-combat unless intentionally restoring all Bound uses. Undo/refund is not built into v0.1.0.
- No live integration test was possible inside your local Foundry V14 game. Always make a backup and test in a copy of Averis first.

## Compatibility and tests

- Declared Foundry **14 only**, dnd5e **5.3.3 only**. The module uses V14 `DialogV2`, `getHeaderControlsApplicationV2`, module sockets, and native Combat/Scene document flags.
- `node --test tests/rules.test.mjs` runs tests of usage limits, cooldown, repetition, position geometry, duplicate IDs, one-time shared bonus and out-of-combat ledger behavior.
- `node --check scripts/main.js` checks syntax. These tests cannot substitute for actual V14 UI testing.