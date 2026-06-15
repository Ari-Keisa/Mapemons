const fs = require('fs');
const code = fs.readFileSync('js/search.js', 'utf8');
const lines = code.split('\n');
lines.forEach((l, i) => {
    if (l.toLowerCase().includes('найдено')) console.log(`${i+1}: ${l}`);
});
