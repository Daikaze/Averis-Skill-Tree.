# Averis Affinity Manager v0.1.0 — инструкции

- Foundry VTT V14; D&D 5e 5.3.3. Направи backup на света.
- Install Module → Manifest URL:
  https://raw.githubusercontent.com/Daikaze/Averis-Skill-Tree./averis-affinity-manager/module.json
- Влез в Averis, активирай модула и отвори персонаж. Отгоре има **Affinity Manager**, или Alt+A.
- GM: избери герой и Affinity, после **Grant innate**, **Learn from teacher** или **Grant special** (Blood).
- За учене от друго същество то трябва да владее същия Affinity на Level 5. GM може да го маркира като Lv5 учител.
- На всяко Level се правят три успешни проверки: Constitution, Arcana, Insight. DC са скрити от интерфейса на играчите и се показват само на GM. Запазват се вече успешните проверки.
- След провал: 3 дни cooldown; след Level-up: 7 дни, според игровото време. Променят се в Module Settings.
- Пълните 65 способности са от изпратения текст. При Thunder няма предоставени правила и затова е заключен placeholder.
- Играчите могат да преглеждат откритите способности и да отбелязват използвания. Автоматично изчисляване на щети, Saving Throws и комплексни ефекти не е включено, за да не дублира нормалните D&D механики.
- След Long Rest натисни **Reset Affinity Uses (Long Rest)**.
- DC числата се крият от UI и общия чат, но *модулен код може да бъде прочетен от любопитен играч*; това не е криптографска защита.