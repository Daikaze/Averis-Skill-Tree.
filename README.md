# Averis Skill Tree — Foundry V14 / D&D 5e 5.3.3 (v0.2.0)

Custom campaign skill progression: a character gains **one independent Skill Point on each Skill Level** and spends it on abilities from General, Class, and assigned Affinity trees. These are additional **Averis homebrew** progression perks, not a replacement for normal D&D 5e advancement. No GM creation of every ability or Item UUID is required.

## Install or update via Manifest URL

In **Foundry Setup → Add-on Modules → Install Module**, paste:

```
https://github.com/Daikaze/Averis-Skill-Tree./releases/latest/download/module.json
```

The trailing `.` in the repository name is intentional. Users upgrading from v0.1.0 can choose **Check Update**, then activate the new version. Back up the Foundry **world** before updating: the module migrates world-wide tree definitions when a GM logs in.

## What's new in v0.2.0

- Fixed `DialogV2.input` plain-object input parsing (XP, bonus points, editing, Affinity assignment).
- Fixed Affinity checkboxes, which now have unique form names, including `No Mana` (no Affinity selected).
- Fixed narrow toolbar/delete buttons and protected preconfigured system trees from accidental deletion.
- **31 built-in trees**, **159 nodes**: four General trees (all 18 dnd5e skills, adventure combat talents), unique 5-ability trees for 13 D&D 5e classes, and all 14 Averis Affinities with five tiers each.
- Abilities no longer need GM-linked World/Compendium Items: the module creates native D&D 5e Features and Spells directly on the Actor; skill proficiency/expertise and passive bonuses use Active Effects. Class attacks with stated numeric damage have native Attack Activities. Missing exact Affinity attack/DC data is **not invented**: the Item is a clickable Utility Activity with the canonical description and GM adjudication.
- XP grants **+1 Skill Point per Skill Level** (starts with 1 point at Level 1), independent from class levels. Formula: `100 × current Skill Level` XP for next Skill Level. Negative XP changes current unspent XP only; already spent points never become invalid.
- Better safety: no missing linked Item can consume points, per-window purchase lock, rollback of newly created Items/Effects if saving Actor progress fails, prohibit removing an Affinity with invested skills, and protect a character's unrelated Items/Effects during Reset.
- Migrates v0.1.0 world settings once. Keeps custom trees/custom nodes and invested legacy trees when required rather than discarding saved purchases.

## How players use it

1. Open a Character Sheet and click **Skill Tree**. Every character sees General trees and the tree for each class Item actually present on their sheet.
2. The GM clicks **Assign Affinities** to select Fire, Water, Earth, Wind, Lightning, Ice, Thunder, Acid, Poison, Necrotic, Psychic, Radiant, Force, or Blood.
3. The GM clicks **+ XP** to award independent Skill XP. On each Skill Level increase the hero automatically gains one spendable point.
4. Click **UNLOCK / UPGRADE** on an available node. The Actor gets the native skill/effect/item and the Skill Point is deducted once.
5. For unlocked spells and class ability Items, open the sheet's native Spells/Features area. Click the small book icon in the tree to open the Item itself. Normal D&D 5e features and advancements remain unchanged.

## Exact mechanics and limitations

- Built-in **General skills** provide standard proficiency and expertise via Active Effects (Rank 1 / 2); passive bonuses use dnd5e Active Effect paths.
- Unique **Class talents** are explicitly labelled extra Averis homebrew abilities, not copied SRD class advancement features (avoids duplication with Rage, Extra Attack, Lay on Hands, etc). Their descriptions specify action economy/usage and often saves or damage where provided.
- **Affinity names** were restored from previously discussed Averis canon. Fire, Water, Earth, Wind, Lightning, Ice, Acid, Poison, Necrotic, Psychic, Radiant, Force, Blood have their named tier skills. Canonical Thunder tier 2–5 descriptions were not previously recorded and are labelled **Unspecified**, rather than inventing them. Some Affinity damage/DC/uses are likewise unspecified: the automatic native Item serves as a tracked D&D feature, while the GM handles effects manually until those values are configured.
- D&D `system.activities` support depends on the installed dnd5e build. If a build rejects generated Activities, the module retries with a plain native Item and warns the GM. This fails safe (keeps a usable Feature/Spell description but no automated attack). Do not expect all non-numeric Affinity attacks, buffs, temporary areas, conditions, or summoning to run automatically without custom Activities/Midi-QOL configuration.
- A `1/Long Rest` Item **may still require configuration/checking** of consumption and recovery in a specific installed dnd5e system version. Confirm once on a test character.
- No simultaneous multi-client transaction arbitration. Only one owner should spend points for a character at a time.
- This release is **code-reviewed and tested with a Node-based mocked Foundry harness**, not yet runtime-tested inside your actual Foundry V14/5.3.3 installation. Back up first and confirm the live UI as a GM and a player.

## GM customization

The module includes a GM-only tree/node editor for optional personal rules. To add custom attacks/spells with precise dice and DC, you can link a complete native D&D Item UUID as before. The 159 preloaded nodes do not need you to do that.

## Developer testing

```bash
node --check scripts/main.js
node --check scripts/data.js
node tests/smoke.mjs
```

## Source and updates

GitHub: https://github.com/Daikaze/Averis-Skill-Tree.

Manifest: https://github.com/Daikaze/Averis-Skill-Tree./releases/latest/download/module.json

Release assets are produced by GitHub Actions. Update checking in Foundry will follow new published releases.