const fs = require('fs');
const path = require('path');

const files = [
    'd:/gitari/Mapemons-main/pages/unova.html',
    'd:/gitari/Mapemons-main/pages/sinnoh.html',
    'd:/gitari/Mapemons-main/pages/kanto.html',
    'd:/gitari/Mapemons-main/pages/johto.html',
    'd:/gitari/Mapemons-main/pages/hoenn.html'
];

const abilitiesBlock = `
                if (window.abilitiesData) {
                    const norm = str => str.toLowerCase().replace(/ё/g, 'е').replace(/[^а-яa-z0-9\\s]/gi, '');
                    let qAbil = val.replace(/^способность\\s+/i, '').trim();
                    const normVal = norm(qAbil);
                    if (normVal) {
                        for (let key in window.abilitiesData) {
                            const ab = window.abilitiesData[key];
                            const ruN = ab.RuName ? norm(ab.RuName) : '';
                            const enN = ab.Name ? norm(ab.Name) : '';
                            
                            if (ruN.includes(normVal) || enN.includes(normVal)) {
                                if (!addedIds.has('abil_'+key)) {
                                    addedIds.add('abil_'+key);
                                    matches.push({
                                        id: 'abil_'+key,
                                        text: 'Способность ' + (ab.RuName || ab.Name),
                                        subtext: ab.RuName && ab.Name ? ab.Name : 'Способность',
                                        icon: '✨',
                                        type: 'ability',
                                        queryText: 'Способность ' + (ab.RuName || ab.Name),
                                        description: ab.Description || ''
                                    });
                                }
                            }
                        }
                    }
                }
`;

for (let file of files) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Find the place to insert (after itemsData block)
    const itemsDataRegex = /if \\(window\\.itemsData\\) \\{[\\s\\S]*?\\}\\s*\\}\\s*\\}/;
    const match = content.match(itemsDataRegex);
    if (match) {
        if (!content.includes('if (window.abilitiesData)')) {
            const index = match.index + match[0].length;
            content = content.slice(0, index) + '\\n' + abilitiesBlock + content.slice(index);
            fs.writeFileSync(file, content, 'utf8');
            console.log('Updated ' + file);
        } else {
            console.log('Already updated ' + file);
        }
    } else {
        console.log('Could not find itemsData block in ' + file);
    }
}
