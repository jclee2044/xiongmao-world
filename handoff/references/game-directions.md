# Xiongmao World: in-game directions

This is the fictional game layout, not a real-world navigation guide. Source of truth: `public/data/navigation.js`, `public/data/market.js`, and `public/game/world.js`. North is up; east is right. Cross canals only at bridges. Coordinates below are final scaled world coordinates, including safe interaction approaches. Moving NPCs may be nearby rather than exactly at their home position.

## Landmark directions

| Place | Position |
| --- | --- |
| 小家 / Home | Northwest, west of the western canal. |
| 茶馆 / Teahouse | North of the market, across the north canal. |
| 博物馆 / Museum | North of the market, east of the teahouse. |
| 书店 / Bookshop | South of the market, across the southern canal. |
| 糕点铺 / Bakery | South of the southern canal, west of the bookshop. |
| 火锅店 / Hotpot restaurant | East of the market, below the lotus lake. |
| 花店 / Florist | Northeast of the market, above the lake. |
| 刺绣坊 / Silk workshop | Southeast, south of the southern canal. |
| 评弹小院 / Storytelling courtyard | South of the canal, between the bookshop and silk workshop. |
| 拙政园 / Humble garden | Northeast, beside the bamboo grove. |
| 狮子林 / Lion grove | Northeast, west of the Humble garden. |
| 虎丘 / Tiger Hill | West of the western canal, south of home. |
| 早饭铺 / Breakfast stall | Northwest corner of the central market. |
| 点心铺 / Sweets stall | West bank within the market, below breakfast. |
| 礼物摊 / Souvenir stall | Northeast corner of the market. |
| 水果摊 / Produce stall | East bank within the market, below souvenirs. |
| 小吃摊 / Street food | Southeast market corner, below produce. |
| 橘子摊 / Tangerine stall | East side of the market, beside the produce seller. The sweet-tangerine walker and trees also remain in the far southwest. |

## Directions quests

Ask Lin “火锅店怎么走？” to accept Ask the way, then enter the restaurant east of the market and south of the lake. Help Hao at the southeast market give directions to the bookshop: find the southern bridge to his left, cross south, then turn left toward the bookshop. Each quest awards 40 XP once. Progress is saved and shown in Panda’s goals.

Both NPC dialogue and Panda coaching receive authoritative map facts. Recognized destination questions use short authored directions, including leaving the current interior first. Language-model prose cannot teleport the player or complete a quest.

## Complete interaction directory

| Scene | ID | Name | Approach (x, y) | Enters |
| --- | --- | --- | --- | --- |
| shanghai | home-north | 小家 | 360, 644 | home |
| shanghai | tea | 茶馆 | 1305, 707 | teahouse |
| shanghai | books | 书店 | 1899, 2651 | bookshop |
| shanghai | flowers | 花店 | 2844, 1103 | — |
| shanghai | bakery | 糕点铺 | 1260, 2588 | bakery |
| shanghai | dumplings | 火锅店 | 2898, 1922 | restaurant |
| shanghai | fabric | 刺绣坊 | 2907, 2588 | silk-room |
| shanghai | museum | 博物馆 | 1791, 725 | museum |
| shanghai | tiger-hill | 虎丘 | 387, 1445 | tiger-court |
| shanghai | garden | 拙政园 | 2817, 734 | humble-garden |
| shanghai | classical-garden | 狮子林 | 2583, 707 | lion-grove |
| shanghai | neighbors-south | 评弹小院 | 2376, 2597 | pingtan-room |
| shanghai | mei | Mei · 梅 | 2817, 1974 | — |
| shanghai | lin | Lin · 林 | 1161, 768 | — |
| shanghai | yun | Yun · 云奶奶 | 396, 781 | — |
| shanghai | qiao | Qiao · 乔 | 1413, 772 | — |
| shanghai | bo | Bo · 博 | 2160, 2644 | — |
| shanghai | lan | Lan · 兰 | 2961, 1141 | — |
| shanghai | wei | 水果摊 | 1897, 1586 | — |
| shanghai | an | An · 安 | 2691, 1110 | — |
| shanghai | hao | Hao · 浩 | 2520, 1942 | — |
| shanghai | suzhou-museum | Museum reading corner · 苏州博物馆 | 2052, 725 | — |
| shanghai | momo | Momo · 桃桃 | 540, 2502 | — |
| shanghai | pingjiang | Pingjiang canal walk · 平江河巷 | 945, 1188 | — |
| shanghai | tea-table | 茶桌 · Tea table | 999, 765 | — |
| shanghai | well | Old well · 水井 | 869, 725 | — |
| shanghai | garden-bench | Garden bench · 长椅 | 2646, 1125 | — |
| shanghai | lake | Lake walk · 湖边 | 2502, 1404 | — |
| shanghai | lanterns | Lantern riddles · 猜灯谜 | 2637, 2268 | — |
| shanghai | market-budget | Market shopping · 集市买东西 | 2501, 1512 | — |
| shanghai | lake-cat | Cat · 小猫 | 2601, 1841 | — |
| shanghai | lake-duck | Duck · 小鸭 | 3132, 1359 | — |
| shanghai | garden-rabbit | Rabbit · 小兔 | 585, 1638 | — |
| shanghai | courtyard-cat | 小猫 | 1425, 1680 | — |
| shanghai | home-cat | 小猫 | 450, 864 | — |
| shanghai | garden-rabbit-two | 小兔 | 2484, 738 | — |
| shanghai | lake-duck-two | 小鸭 | 3186, 1521 | — |
| shanghai | lost-flowers | 掉落的花束 · Fallen flowers | 594, 1656 | — |
| shanghai | next-area | 游船码头 · Departure boat | 3078, 2201 | shantang |
| shanghai | lian | 莲 · Lian | 1458, 1708 | — |
| shanghai | snack-host | 点心铺 | 1314, 1699 | — |
| shanghai | silk-host | 礼物摊 | 2459, 1301 | — |
| shanghai | kid-one | 小豆 · Xiaodou | 351, 2230 | — |
| shanghai | kid-two | 小米 · Xiaomi | 486, 2248 | — |
| shanghai | buy-cake | 桂花糕 | 1305, 1728 | — |
| shanghai | buy-fan | 团扇 | 2439, 1357 | — |
| shanghai | buy-oranges | 橘子摊 | 432, 2430 | — |
| shanghai | bamboo-grove | 树山竹林 · Shushan bamboo grove | 2610, 207 | — |
| shanghai | rock-study | 太湖石 · Taihu rocks | 441, 1710 | — |
| shanghai | market-baker | 早饭铺 | 1646, 1232 | — |
| shanghai | market-cook | 小吃摊 | 2259, 1962 | — |
| home | outside-door | Canal Lane · 河巷 | 450, 544 | shanghai |
| home | journal | Journal · 旅行日记 | 447, 314 | — |
| home | momo-home | Momo · 桃桃 | 705, 390 | — |
| home | home-bed | 床边的小纸条 | 214, 319 | — |
| home | home-books | 书和小秘密 | 435, 225 | — |
| home | home-sofa | 窗边的沙发 | 683, 379 | — |
| home | home-teacup | 第一只茶杯 | 293, 341 | — |
| home | home-cabinet | 旅行柜 | 154, 371 | — |
| home | sheep-keepsake | 小羊 · Lian’s gift | 600, 416 | — |
| bakery | bakery-exit | Outside · 出门 | 600, 710 | shanghai |
| bakery | bakery-workbench | Make osmanthus cakes · 做桂花糕 | 900, 440 | — |
| bakery | bakery-order | Order pastries · 买点心 | 525, 420 | — |
| bakery | bakery-display | Pastry display · 点心柜 | 425, 405 | — |
| bakery | bakery-baker | baker | 650, 470 | — |
| bakery | bakery-diner-friend | diner-friend | 940, 520 | — |
| teahouse | teahouse-exit | Outside · 出门 | 600, 700 | shanghai |
| teahouse | teahouse-counter | Listen to tea orders · 茶馆接单 | 795, 480 | — |
| teahouse | teahouse-order | Order tea · 点茶 | 700, 460 | — |
| teahouse | teahouse-table | Tea table · 茶桌 | 355, 430 | — |
| teahouse | teahouse-qiao | qiao | 740, 525 | — |
| teahouse | teahouse-diner | diner | 440, 465 | — |
| teahouse | teahouse-reader | reader | 985, 520 | — |
| bookshop | bookshop-exit | Outside · 出门 | 475, 695 | shanghai |
| bookshop | bookshop-table | Word pairs · 词语配对 | 795, 480 | — |
| bookshop | bookshop-order | Choose a book · 选一本书 | 500, 470 | — |
| bookshop | bookshop-shelves | Bookshelves · 书架 | 450, 420 | — |
| bookshop | bookshop-bo | bo | 630, 460 | — |
| bookshop | bookshop-reader | reader | 295, 530 | — |
| restaurant | restaurant-exit | 出门 | 600, 735 | shanghai |
| restaurant | hotpot | 吃火锅 · Hot pot | 865, 370 | — |
| restaurant | restaurant-menu | 今日菜单 | 560, 330 | — |
| restaurant | restaurant-waiter | 小陈 · Waiter | 690, 405 | — |
| restaurant | hotpot-two | 火锅桌 · Hotpot table | 565, 450 | — |
| restaurant | hotpot-three | 火锅桌 · Hotpot table | 565, 655 | — |
| restaurant | restaurant-diner | diner | 180, 415 | — |
| restaurant | restaurant-friend | diner-friend | 565, 415 | — |
| restaurant | restaurant-reader | reader | 135, 610 | — |
| restaurant | restaurant-artist | an | 565, 615 | — |
| restaurant | hotpot-four | 空桌 · An empty table | 900, 660 | — |
| museum | museum-exit | 出门 | 600, 730 | shanghai |
| museum | lotus-bowl | 秘色瓷莲花碗 | 300, 350 | — |
| museum | pearl-pillar | 真珠舍利宝幢 | 600, 350 | — |
| museum | canal-map | 水陆并行 | 890, 350 | — |
| museum | museum-guide | 小文 · Guide | 970, 485 | — |
| museum | museum-reader | reader | 300, 535 | — |
| museum | museum-artist | an | 620, 505 | — |
| shantang | back-town | 回平江河巷 | 250, 800 | shanghai |
| shantang | shantang-story | 山塘故事 | 440, 625 | — |
| shantang | shantang-host | 素音 · Suyin | 1400, 650 | — |
| shantang | shantang-riddles | 灯谜 | 430, 1090 | — |
| lion-grove | lion-grove-exit | 出门 · Outside | 700, 900 | shanghai |
| lion-grove | lion-grove-keeper | gardener | 460, 560 | — |
| lion-grove | lion-grove-visitor | an | 970, 650 | — |
| lion-grove | lion-grove-story | 狮子林 | 710, 440 | — |
| humble-garden | humble-garden-exit | 出门 · Outside | 700, 900 | shanghai |
| humble-garden | humble-garden-keeper | gardener | 460, 560 | — |
| humble-garden | humble-garden-visitor | an | 1080, 715 | — |
| humble-garden | humble-garden-story | 拙政园 | 710, 440 | — |
| tiger-court | tiger-court-exit | 出门 · Outside | 700, 900 | shanghai |
| tiger-court | tiger-court-keeper | gardener | 460, 560 | — |
| tiger-court | tiger-court-visitor | an | 970, 650 | — |
| tiger-court | tiger-court-story | 虎丘 | 710, 440 | — |
| silk-room | silk-room-exit | 出门 · Outside | 700, 900 | shanghai |
| silk-room | silk-room-host | silk-host | 440, 570 | — |
| silk-room | silk-room-guest | reader | 900, 600 | — |
| silk-room | silk-workbench | 苏绣配色 · Embroidery colors | 680, 530 | — |
| pingtan-room | pingtan-room-exit | 出门 · Outside | 700, 900 | shanghai |
| pingtan-room | pingtan-room-host | suyin | 440, 570 | — |
| pingtan-room | pingtan-room-guest | reader | 900, 600 | — |

## Outdoor crossings

| Bridge center | Orientation |
| --- | --- |
| 765, 2376 | west ↔ east |
| 1742, 2097 | north ↔ south |
| 2354, 2097 | north ↔ south |
| 765, 227 | west ↔ east |
| 789, 1061 | west ↔ east · painted market bridge |
| 1754, 1332 | west ↔ east · painted market bridge |
| 1724, 1652 | west ↔ east · painted market bridge |
| 1706, 851 | north ↔ south |
| 2633, 851 | north ↔ south |

## Departure boat

A medium-large wooden passenger boat is moored in the bottom-right canal, north of the silk workshop. Walk along the southern stone path to its wooden boarding dock. Clicking the boat walks to shore before opening the captain’s dialogue; Space also works nearby. Sailing requires 500 XP, checked again when boarding. The current next destination is Shantang; its return entrance leads to this same dock. No XP is spent.
