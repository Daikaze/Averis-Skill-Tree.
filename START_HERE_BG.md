# Averis Bound System v0.2.2 — инструкция

## Важни неща

- За **Foundry V14 / dnd5e 5.3.3**; направи backup на света преди update.
- Същият Manifest URL като v0.1.0:
  `https://raw.githubusercontent.com/Daikaze/Averis-Skill-Tree./averis-bound-system/module.json`
- Дръж `averis-skill-tree` отделен — това е самостоятелен модул с ID `averis-bound-system`.

## Ново

**60 Bound техники в 10 категории.** Всяка има собствен Action/Bonus Action/Reaction, trigger, условия и D&D 5e бонус. Всички стари 9 варианта остават отключени на Level 1.

**Progression** — всеки герой започва от Bound Level 1 и получава автоматично 15 XP за одобрена комбинация (настройва се от GM). Level 3, 5, 7, 9, 12 отключват по-силни Tier-ове. За Tier 5 трябва и Bond Rank 2; Tier 6 — Bond Rank 3. Двойка има Rank 2 след 3 успешни комбинации заедно и Rank 3 след 6. Броят успешни съвместни действия се пази в actor flags и не се нулира между битките.

**Изцяло нов интерфейс** — с регулируем прозорец, категории, търсене, любими, детайли, прогрес и история. При тесен прозорец колоните се подреждат една под друга, вместо да се изрязват.

## Как се играе

1. Постави два Character Token-а на картата, отвори Character Sheet → **Bound** или Alt+B.
2. Избери двамата участници, евентуална цел и отключена комбинация.
3. Изпрати заявка. GM потвърждава след проверка на Actions, Reactions и други ресурси.
4. Герои използват **истинските си D&D атаки/магии/skill checks**. GM може да хвърли общия бонус **само веднъж** от чат картата и го прилага ръчно.
5. След одобрение всеки герой получава XP и progress към общата им Bond Rank. Ако XP не се запише, GM може да го добави от панела.

## За GM

- Отключванията са автоматични — **не добавяш всеки Bound skill поотделно**.
- XP: избери първия герой и бутона **Дай Bound XP**.
- Нови техники: **Custom Combos** → въведи Required Bound Level и Required Bond Rank.
- От Settings можеш да регулираш XP за комбинация, cooldown и максимални използвания.
- Използвания: 2/битка/герой; cooldown: 3 рунда; забранен същият партньор два пъти в същата битка.
- Модулът НЕ начислява автоматични HP промени, щети или Spell Slots, за да избегне двойно изхарчване на ресурси.

## Ограничения

Препоръчват се **Linked Character Tokens** за постоянна прогресия през сцени. При Unlinked Synthetic Actors прогресът може да остане само в съответния токен. Модулът е проверен със скриптове и UI симулация, но още не е тестван в твоята реална Foundry инсталация.

## v0.2.2 interface changes

All in-module UI labels are in English. Fixed overlapping technique cards, navigation tabs and hard-to-read native dropdown options.