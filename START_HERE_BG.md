# Averis Bound System v0.1.0 — Инструкции

**Foundry VTT 14 / D&D 5e 5.3.3.** Самостоятелен playtest модул.

## Инсталиране с Manifest URL

Setup → Add-on Modules → Install Module → поле **Manifest URL**:

```text
https://raw.githubusercontent.com/Daikaze/Averis-Skill-Tree./averis-bound-system/module.json
```

След инсталация: Game Settings → Manage Modules → **Averis Bound System**.

## Работа

- Отворената Scene трябва да има поне два PC Character токена.
- Натисни **Alt+B** или **Bound** в Character Sheet. Ако бутонът липсва при специфичен sheet, използвай макро `game.modules.get("averis-bound-system").api.open()`.
- Избери инициатор, партньор, тип Bound и цел, ако има такава.
- Активният GM получава заявка и трябва да потвърди. Преди това попитай другия играч дали е съгласен.
- GM следи използванията и нулира конкретната битка / сцена чрез `game.modules.get("averis-bound-system").api.status()`.
- GM може да добавя свои комбинации от Module Settings → Manage Bound variants.

## Правила и важни ограничения

**2 Bound/битка на герой**, **3 рунда cooldown** за всеки, **не може същият партньор в същата битка**, а атакуващите режими изискват еднакъв стил (melee+melee или ranged+ranged). Противоположните страни на целта се проверяват по позиции. При Bound ниво 1–2 exhaustion не пречи на Bound маневрата; извън нея остава активен.

Модулът съдържа 9 готови варианта: Twin Strike, Crossfire, Spell Weave, Healing Chorus, Guardian Link, Tactical Feint, Skill Synergy, Evasive Relay, Rallying Call. Освен това имаш редактор за собствени комбинации.

**Създадените допълнителни бонуси са примерен баланс** — не са предварително утвърден canon за Averis. Няма автоматично нанасяне на щети/лечение, харчене на Spell Slots, активиране на магии или промени в HP/AC. Използвай истинските D&D 5e Item Activities и GM бутона в Bound Chat за еднократното бонус хвърляне.

Важно: Преди реална сесия направи backup и тествай в копие на света. Технически проверки на логиката не са равностойни на тест в твоя Foundry клиент.