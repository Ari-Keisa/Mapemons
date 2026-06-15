const fs = require('fs');
const abData = JSON.parse(fs.readFileSync('json/abilities.json', 'utf8'));

for (const k in abData) {
    if (k.toLowerCase().includes('flame') || abData[k].Name.toLowerCase().includes('flame') || abData[k].RuName.toLowerCase().includes('огн')) {
        console.log(k, abData[k].Name, abData[k].RuName);
    }
}
