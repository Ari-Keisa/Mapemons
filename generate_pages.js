const fs = require('fs');

const locations = JSON.parse(fs.readFileSync('json/locations.json', 'utf8'));

const regions = ['JOHTO', 'HOENN', 'SINNOH', 'UNOVA'];
const data = {};

regions.forEach(r => {
    data[r] = Object.values(locations).filter(l => l.region === r).map(l => l.ru_name || l.name);
});

fs.writeFileSync('regions_data.json', JSON.stringify(data, null, 2));
console.log('Saved to regions_data.json');
