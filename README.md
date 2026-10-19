# Averis Affinity Manager — v0.1.0

Custom Foundry VTT V14 / D&D 5e 5.3.3 **playtest** module implementing Averis Affinity learning, mastery checks and source-specific abilities.

## Install from Manifest URL

Foundry Setup → Add-on Modules → Install Module → Manifest URL:

```
https://raw.githubusercontent.com/Daikaze/Averis-Skill-Tree./averis-affinity-manager/module.json
```

The trailing `.` in the repository name is intentional. Enable **Averis Affinity Manager** inside your world. Open a character sheet and select **Affinity Manager** from header controls, or use **Alt+A** or a script macro:

```js
await game.modules.get("averis-affinity-manager").api.open();
```

## What the user-supplied rules specify

- The Level 1–5 upgrades require **all three successes**: Constitution, Arcana, Insight, in that order; DCs **10 / 13 / 15 / 17 / 20** (GM view only).
- Normal known Affinities: **maximum 3**. Special Affinities (e.g. Blood) do not use this slot cap.
- If learning an Affinity from **another creature**, that teaching creature must have **Level 5** mastery in that Affinity. To teach from a creature not tracked by this module, GM may mark it as a Level 5 teacher.
- An Innate GM grant is separate from learning from a creature. The GM explicitly selects the source; no player can add an Affinity themselves.
- The source document contains **12 complete standard Affinities and Special Blood**, for **65 individual abilities**. It ends with a label **Another Affinity** but supplies no abilities. **Thunder is shown as a disabled placeholder**, not invented content.
- Based on previous Averis world rules, retry is **3 world days after a failed check**, and **7 world days after a completed upgrade**. Both are configurable under Game Settings → Module Settings. If you want no downtime change them to 0.

## Usage

1. Choose a character in the left sidebar and an Affinity.
2. GM uses **Grant innate**, **Learn from teacher** (a qualified teacher), or **Grant special** for Blood. The affinity begins at Level 0.
3. GM uses **Roll next check** or **Record total**. All difficulty numbers are shown only in GM panels. The roll is GM-whispered; only the pass/fail and unlocked level are announced publicly.
4. Upgrade successes persist across attempts; failure triggers retry cooldown. When all 3 checks pass, the level increases automatically, unlocking the next canonical ability.
5. Players can read unlocked ability rules, **Use / Share** an ability and roll individual listed damage/healing dice. Items are NOT auto-applied to targets; the GM handles D&D 5e attack/save/effect resolution.
6. Uses limited per Long Rest are recorded on each world character Actor. After a standard D&D Long Rest, click **Reset Affinity Uses (Long Rest)**; this only clears Affinity usage, not spell slots or other resources.
7. GM can adjust level or remove an Affinity, with confirmation. No standard skill or character-level progression is overwritten.

## Security and limitations

- Only GMs can perform Affinity grants or training rolls; player socket requests **only open a GM approval panel**. A player never specifies DCs or sets Affinity levels via socket.
- **DC concealment is UI/chat-level, not cryptographic secrecy**. Foundry modules are downloaded to user computers; a technically knowledgeable player who reads source files can see fixed DCs. Genuine confidentiality would require a server-only component or manually configured secret GM-held DCs outside a downloadable module.
- D&D 5e sheet bonuses: quick GM rolls use the numerical Constitution ability modifier / skill totals available on the Actor. To account for conditional bonuses (Guidance, Advantage from external modules, custom dice, etc.), use **Record Total**, which accepts the actual D&D final roll result. Exact automatic integration of all third-party effects is intentionally not claimed.
- No automatic damage, save application, condition tracking, concentration or MIDI-QOL effects. Complex canonical abilities (e.g. Mind Rewrite, Time-sensitive multi-stage effects) require DM adjudication.
- The cooldown uses Foundry **world time** (`game.time.worldTime`), not real-world days. Advancing the in-game clock advances cooldown; no reliance on Simple Calendar.
- State is saved in Actor flags. Player-owned world Actors are supported; token-only unlinked NPCs are not intended recipients of persistent player Affinity progression.
- Long-rest resource limits are extracted only when explicitly stated in the supplied rule descriptions. Abilities without an explicit limit are not given invented charges. Special once-per-rest subeffects may need separate GM tracking.
- This build has Node regression tests and Foundry V14 API-targeted structure, but has **not been playtested in your actual Foundry world**. Back up your world before enabling.

## Built-in catalog

Fire, Earth, Wind, Water, Lightning, Psychic, Necrotic, Poison, Acid, Ice, Radiant, Force, and Special Blood. No description is replaced or balanced without DM input.