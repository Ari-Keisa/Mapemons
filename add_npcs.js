const fs = require('fs');
const path = require('path');

const locsPath = path.join(__dirname, 'json', 'locations.json');
const npcsPath = path.join(__dirname, 'json', 'npcs.json');

const locs = JSON.parse(fs.readFileSync(locsPath, 'utf8'));
const npcs = JSON.parse(fs.readFileSync(npcsPath, 'utf8'));

const masterLocs = ['CELADON-CITY', 'BLACKTHORN-CITY', 'EVER-GRANDE-CITY', 'SUNYSHORE-CITY'];
const auctionLocs = ['CELADON-CITY', 'GOLDENROD-CITY', 'LILYCOVE-CITY', 'HEARTHOME-CITY'];
const eliteLocs = ['SAFFRON-CITY', 'GOLDENROD-CITY', 'MAUVILLE-CITY', 'VEILSTONE-CITY'];
const exoticLocs = ['VERMILION-CITY', 'OLIVINE-CITY', 'SLATEPORT-CITY', 'CANALAVE-CITY'];

let npcIdCounter = 1;
for (const k in npcs) {
    const idNum = parseInt(k.replace('npc', ''));
    if (!isNaN(idNum) && idNum >= npcIdCounter) {
        npcIdCounter = idNum + 1;
    }
}

function addNpc(locId, ruName, desc) {
    // Check if already exists in this location
    for (const k in npcs) {
        if (npcs[k].location_id === locId && npcs[k].ru_name === ruName) {
            return; // Already exists
        }
    }
    const newId = 'npc' + npcIdCounter++;
    // remove emoji for photo path
    const cleanName = ruName.replace(/[\u1000-\uFFFF]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDE4F\uDE80-\uDEFF]|[\u2600-\u2B55]/g, '').trim();
    
    npcs[newId] = {
        location_id: locId,
        ru_name: ruName,
        en_name: ruName,
        description: desc,
        photo_path: "shared/assets/npcs/" + cleanName + ".jpg",
        type: "npc",
        dialogue: {
            start: {
                text: "Приветствую!",
                actions: [
                    { text: "Пока", script_id: "END_DIALOGUE" }
                ]
            }
        }
    };
}

for (const locId in locs) {
    const data = locs[locId];
    if (data.has_pokecenter) {
        addNpc(locId, "👩‍⚕️ Сестра Джой", "Заботливая медсестра Покецентра. Она с радостью вылечит ваших покемонов и вернёт им силы для новых приключений.");
    }
    if (data.has_pokemart) {
        addNpc(locId, "👨‍💼 Продавец", "Приветливый продавец Покемарта, всегда готовый предложить нужные товары для вашего путешествия.");
    }

    if (masterLocs.includes(locId)) {
        addNpc(locId, "🎖️ Мастер битв", "Опытный тренер, закаленный в множестве сражений. Он готов поделиться своей мудростью и редкими предметами за победу.");
    }
    if (auctionLocs.includes(locId)) {
        addNpc(locId, "🎩 Аукционист", "Харизматичный ведущий аукционов, предлагающий уникальные и редкие лоты для самых щедрых покупателей.");
    }
    if (eliteLocs.includes(locId)) {
        addNpc(locId, "🧑‍🏫 Элитный продавец", "Продавец эксклюзивных и дорогих товаров, которые невозможно найти в обычном Покемарте.");
    }
    if (exoticLocs.includes(locId)) {
        addNpc(locId, "👳🏻‍♂️ Торговец экзотикой", "Загадочный путешественник, привозящий диковинные товары из дальних уголков мира.");
        addNpc(locId, "🧑‍🌾 Торговец ресурсами", "Трудолюбивый торговец, предлагающий базовые ресурсы и материалы для крафта.");
    }
}

fs.writeFileSync(npcsPath, JSON.stringify(npcs, null, 4), 'utf8');
console.log("Successfully injected NPCs into npcs.json");
