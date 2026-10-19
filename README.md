# Averis Bound System — Linked Fate v0.2.2

**Target:** Foundry VTT **V14** / **D&D 5e 5.3.3**. Custom optional homebrew system; does not modify ordinary class progression, Midi-QOL, casting or turn economy.

## v0.2.2 visual hotfix (Foundry V14 / dnd5e 5.3.3)

- Bound technique cards now have an explicit minimum height and vertical layout, overriding V14/global button-height and inline-flex styling. Labels, tier tags and unlock conditions no longer overlap.
- The catalog uses fewer but wider columns (minimum 188px) and scrolls normally rather than squeezing four cards into a narrow panel.
- Top navigation tabs have consistent height, spacing, icon alignment, keyboard focus indication and horizontally scroll when the app is narrow.
- Character / target selectors force a legible dark dropdown (`color-scheme: dark`, high-contrast text and backgrounds). GM input dialogs receive the same native-select contrast styling.
- **All text rendered by the Bound dashboard is now in English**, including sidebar labels, library tabs, warnings, XP / progression information and action buttons.
- Added a UI source-language/CSS regression test and desktop/compact browser layout checks.

## Install / Update from GitHub

Open Foundry Setup → **Add-on Modules → Install Module → Manifest URL**, paste:

```
https://raw.githubusercontent.com/Daikaze/Averis-Skill-Tree./averis-bound-system/module.json
```

This is deliberately published in the **`averis-bound-system`** branch of the existing **`Daikaze/Averis-Skill-Tree.`** repository (the trailing dot is part of its name). It does not replace the Skill Tree module. The Bound release is tagged `bound-v0.2.2` so that the Skill Tree's independent releases remain unaffected.

Make a **backup of your world** first. Updating from v0.1.0 retains old Bound encounter/scene ledgers and custom templates. It adds new actor progression flags non-destructively. No previous items, combat records, or custom presets are reset.

## Features

- **60 handcrafted combinations** across **10 categories** (Melee, Ranged, Spell, Healing, Defense, Control, Skill Checks, Movement, Support, Utility); 6 techniques each. The **9 original v0.1.0 abilities retain their IDs and remain Level 1**.
- **Bound Level / XP**: independent level range 1–20; every GM-approved combo normally grants **15 XP per participant**, configurable from 0 to 100 via world settings. GM can grant or subtract up to 100,000 XP at a time using the panel. XP never modifies D&D class level.
- **Pair Bond Rank** for each specific pair: Rank 1 = 0–2 successful combinations together; Rank 2 = 3–5; Rank 3 = 6–9; Rank 4 = 10+. Bond XP history persists across encounters when tokens represent persistent linked world actors. No explicit skill point spending; abilities unlock automatically.
- **Tier unlocks:** Tier 1 = Bound Lv 1; Tier 2 = Lv 3; Tier 3 = Lv 5; Tier 4 = Lv 7; Tier 5 = Lv 9 **and Pair Rank 2**; Tier 6 = Lv 12 **and Pair Rank 3**. Both characters must meet level requirements; pair counters are tracked for each character.
- **Redesigned ApplicationV2**: adjustable window; portrait-width-safe responsive layout using container queries; independent scrolling, 60 search/filterable cards, 11 category filters (including Custom), detail view, favorites, milestones, histories and GM XP controls.
- **Special skill detail information:** Action/Reaction economy, bonus dice, target and formation requirements, exact effect/trigger. Triggered effects are *manual GM adjudications*; only the optional one-time shared dice roll is executed from the Bound chat card.
- **Own-rule overrides**: world settings for uses per encounter, cooldown (default 3), anti-repeat partner, opposite-side position, out-of-combat play; GM can add/remove custom templates with level and partner rank prerequisites.
- **Fail-safes**: active GM serializes approval, checks eligibility before and after approval (both characters alive, same scene/combat, free uses, cooldown, valid position/target), one-time shared bonus, participant XP idempotency, bounded logs, old flags migration, no automatic spell slots/HP/AC mutation.

## Controls

Open from a D&D5e character sheet's **Bound** button, from `Alt+B`, or via macro:

```js
await game.modules.get('averis-bound-system').api.open();
```

GM can view Bound encounter status and reset only Bound ledger; GM can award XP from the panel and manage custom techniques under Module Settings → Manage Bound variants. 

## Balance & D&D gameplay

Bound skills do **not** grant free attacks, free spell slots, free spell components, unlimited temporary HP or permanent AC. In every combination, each participant still performs the stated normal D&D actions through the **real character sheet**. A GM confirms whether both acted, saves/hits/skill checks succeeded and whether the one-time combined benefit is earned. For melee melee pairs and ranged ranged pairs the GM checks that both characters can use that attack type. Shared rolls are **never automatically applied to token HP, saves, AC, conditions or movement**.

One participant ordinarily has **2 Bound uses per encounter**, a **3-round cooldown** and **cannot repeat the same partner within that encounter**. Position checks against target are real canvas ranges and for opposite formations use positions at time of approval. In exploration uses are scoped to the Scene; GM can reset Scene Bound ledger when starting a new out-of-combat session. Only an active GM can approve bound and reset its ledger. If XP grant fails after the ledger commits, the module reports the error; the GM can adjust XP manually, rather than risk duplicating a combo.

**Note:** The 60 abilities are **homebrew playtest designs**, not automatically derived from an established Averis rulebook. Damage dice, ability DC, class resources and legal move paths remain adjudicated under D&D 5e. The module is tested through static and browser layout simulations, but **not yet live-tested on your Foundry V14 host**. Back up before installing.

## Automated test coverage

`node --test tests/*.test.mjs`: check catalog count/IDs/tier shape, XP progression and idempotency, migrated v0.1.0 encounters, double-resolve safety, 30-round cooldown simulation, custom ability requirements. CI also runs `node --check` on main, rules, catalog and progression and packages the module as a versioned GitHub Release.