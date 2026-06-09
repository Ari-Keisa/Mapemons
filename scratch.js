const fs = require('fs');
const locData = JSON.parse(fs.readFileSync('d:/gitari/Mapemons-main/json/locations.json', 'utf8'));
let centerOnly = [];
let martOnly = [];

for (let locId in locData) {
    const loc = locData[locId];
    if (loc.has_pokecenter && !loc.has_pokemart) {
        centerOnly.push(loc.ru_name || loc.name);
    }
    if (!loc.has_pokecenter && loc.has_pokemart) {
        martOnly.push(loc.ru_name || loc.name);
    }
}

console.log('--- Центры БЕЗ маркета ---');
console.log(centerOnly.length > 0 ? centerOnly.join(', ') : 'Нет таких');

console.log('\n--- Маркеты БЕЗ центра ---');
console.log(martOnly.length > 0 ? martOnly.join(', ') : 'Нет таких');
