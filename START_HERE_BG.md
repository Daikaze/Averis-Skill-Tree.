# Averis Skill Tree V14 — първи тест

Това е **v0.1.0**, първа версия за тестване. Проверихме файловете и примерните дървета, но не сме я стартирали на твоя Foundry сървър.

## Инсталация
1. Направи резервно копие на света си.
2. Разархивирай ZIP файла в твоята папка `FoundryVTT/Data/modules/`. Трябва да съществува `FoundryVTT/Data/modules/averis-skill-tree/module.json`.
3. Във Foundry V14 отвори D&D 5e света си. В **Game Settings → Manage Modules** активирай **Averis Skill Tree — D&D 5e**.
4. Отвори Character Sheet. Трябва да се появи бутон **Skill Tree**. Ако не се появява с конкретен Character Sheet, стартирай модулния прозорец чрез Script Macro:

```js
await game.modules.get("averis-skill-tree").api.openSelected();
```

## Проверка на уменията
- В **Adventuring** избери **Keen Senses**. Първият ранг дава **Perception Proficiency**; следващият — **Expertise**.
- В **Martial Training** има пасивни 5e bonuses, които работят с Active Effects.
- **GM → + XP** добавя отделен Skill XP. На всеки Skill Level се дава точка (начално 1 точка при Skill Lv. 1).
- **GM → Assign Affinities** избери например Blood или Wind, за да се появи съответното дърво.
- **Class** дърветата се показват само ако героят има нормален **Class Item** (Paladin, Fighter, Wizard, Sorcerer и др.).

## Как да добавяш истински D&D магии/атаки
1. Създай или намери във Foundry нормален **Spell**, **Weapon** или **Feat / Class Feature** Item.
2. Конфигурирай самия Item според D&D 5e — Action/Bonus Action/Reaction, Range, Save DC, Damage Dice, Concentration, Uses / Rest, spell slot rules.
3. В Skill Tree натисни **моливчето** на нода.
4. Постави **UUID на World или Compendium Item** в полето Item UUID и запиши.
5. След отключване предметът се копира в Character Sheet и се използва като нормален D&D Item.

**Важно:** Примерните класови и Affinity нодове са шаблони. Те не дават измислени нови сили, докато GM не свърже истински Items. Това ни позволява да запазим твоите вече съществуващи Averis механики.

## Ако нещо не работи
- Отвори браузърната конзола с `F12` и виж има ли червена грешка с текст `averis-skill-tree`.
- Провери дали модулът е в директория с правилното име.
- Увери се, че играеш с D&D 5e system, а не друг system.
- Ако Character Sheet бутонът липсва, пробвай примерния Script Macro по-горе.

**Ограничения на v0.1.0:** няма графичен drag-and-drop редактор; нодовете се редактират чрез полета. Не синхронизира автоматично промени в вече дадени Items след редакция на оригинала. Няма транзакционна защита от едновременно натискане на две различни машини.
