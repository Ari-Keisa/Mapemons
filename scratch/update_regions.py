import os

pages_dir = os.path.join(os.path.dirname(__file__), '../pages')
regions = ['kanto', 'johto', 'hoenn', 'sinnoh', 'unova']

highlightFunctions = """
        // Подсветка локаций по способности
        function highlightByAbility(abilityKey) {
            if (!pokemonDB || !pokemonRuData || !allLocationData || !window.abilitiesData) {
                showNotification('База ещё загружается...', 'error'); return;
            }
            const abilObj = window.abilitiesData[abilityKey];
            const abilName = abilObj ? abilObj.Name.toUpperCase() : abilityKey.toUpperCase();
            
            const abilCache = {};
            for (const id in pokemonDB) {
                const p = pokemonDB[id];
                if (!p.en) continue;
                const key = p.en.toUpperCase();
                const ruEntry = pokemonRuData[key];
                let abs = [];
                if (ruEntry) {
                    if (ruEntry.Abilities) {
                        if (Array.isArray(ruEntry.Abilities)) abs.push(...ruEntry.Abilities.map(a=>a.toUpperCase()));
                        else abs.push(ruEntry.Abilities.toUpperCase());
                    }
                    if (ruEntry.HiddenAbilities) {
                        if (Array.isArray(ruEntry.HiddenAbilities)) abs.push(...ruEntry.HiddenAbilities.map(a=>a.toUpperCase()));
                        else abs.push(ruEntry.HiddenAbilities.toUpperCase());
                    }
                }
                abilCache[key] = abs;
            }
            let found = false;
            document.querySelectorAll('.location-node').forEach(n => n.classList.add('hidden'));
            
            for (const key in allLocationData) {
                const loc = allLocationData[key];
                const node = document.querySelector(`[data-location="${key}"]`);
                if (!node) continue;
                
                const hasAbil = (loc.encounters || []).some(e => {
                    const abs = abilCache[e.species] || [];
                    return abs.includes(abilName);
                });
                
                if (hasAbil) {
                    found = true;
                    node.classList.remove('hidden');
                    node.classList.add('route-active');
                }
            }
            
            if (!found) {
                document.querySelectorAll('.location-node').forEach(n => n.classList.remove('hidden', 'route-active'));
                showNotification(`Локаций с покемонами со способностью "${abilObj ? abilObj.RuName || abilObj.Name : abilName}" не найдено`, 'error');
                return;
            }
            showNotification(`Подсвечены локации (Способность: ${abilObj ? abilObj.RuName || abilObj.Name : abilName})`, 'success');
            highlightTimeout = setTimeout(() => {
                document.querySelectorAll('.location-node').forEach(n => n.classList.remove('hidden', 'route-active'));
            }, 60000);
        }

        // Подсветка локаций по профессии
        function highlightByProfession(professionId) {
            if (!pokemonDB || !pokemonRuData || !allLocationData || !window.professionsData || !window.profAffinityData) {
                showNotification('База ещё загружается...', 'error'); return;
            }
            
            const profObj = window.professionsData[professionId];
            
            const profCache = {};
            for (const id in pokemonDB) {
                const p = pokemonDB[id];
                if (!p.en) continue;
                const key = p.en.toUpperCase();
                
                const ruEntry = pokemonRuData[key];
                const pool = (ruEntry && ruEntry.AptitudePool) || [];
                if (pool.includes(professionId)) {
                    profCache[key] = true;
                    continue;
                }
                
                let matched = false;
                for (const affKey in profAffinityData) {
                    const aff = profAffinityData[affKey];
                    if (!aff.bonuses || !aff.conditions) continue;
                    
                    const hasBonusForProf = aff.bonuses.some(b => b.profession === professionId && b.value > 1);
                    if (!hasBonusForProf) continue;
                    
                    const upperTypes = [];
                    if (p.type) upperTypes.push(...p.type.map(t=>t.toUpperCase()));
                    if (ruEntry && ruEntry.Types) {
                         const rt = Array.isArray(ruEntry.Types) ? ruEntry.Types : ruEntry.Types.split(',');
                         upperTypes.push(...rt.map(t=>t.trim().toUpperCase()));
                    }
                    
                    if (aff.conditions.types && upperTypes.some(t => aff.conditions.types.includes(t))) matched = true;
                    if (!matched && aff.conditions.species && aff.conditions.species.includes(key)) matched = true;
                    
                    if (!matched && aff.conditions.abilities && ruEntry) {
                        const allAbs = [];
                        if (ruEntry.Abilities) allAbs.push(...(Array.isArray(ruEntry.Abilities)?ruEntry.Abilities:[ruEntry.Abilities]));
                        if (ruEntry.HiddenAbilities) allAbs.push(...(Array.isArray(ruEntry.HiddenAbilities)?ruEntry.HiddenAbilities:[ruEntry.HiddenAbilities]));
                        if (aff.conditions.abilities.some(a => allAbs.map(x=>x.toUpperCase()).includes(a.toUpperCase()))) matched = true;
                    }
                    if (!matched && aff.conditions.shapes && (ruEntry && ruEntry.Shape) && aff.conditions.shapes.includes(ruEntry.Shape.toUpperCase())) matched = true;
                    
                    if (matched) break;
                }
                profCache[key] = matched;
            }
            
            let found = false;
            document.querySelectorAll('.location-node').forEach(n => n.classList.add('hidden'));
            
            for (const key in allLocationData) {
                const loc = allLocationData[key];
                const node = document.querySelector(`[data-location="${key}"]`);
                if (!node) continue;
                
                const hasProf = (loc.encounters || []).some(e => profCache[e.species]);
                if (hasProf) {
                    found = true;
                    node.classList.remove('hidden');
                    node.classList.add('route-active');
                }
            }
            
            if (!found) {
                document.querySelectorAll('.location-node').forEach(n => n.classList.remove('hidden', 'route-active'));
                showNotification(`Локаций с покемонами для профессии "${profObj ? profObj.ru_name : professionId}" не найдено`, 'error');
                return;
            }
            showNotification(`Подсвечены локации (Профессия: ${profObj ? profObj.ru_name : professionId})`, 'success');
            highlightTimeout = setTimeout(() => {
                document.querySelectorAll('.location-node').forEach(n => n.classList.remove('hidden', 'route-active'));
            }, 60000);
        }
"""

parseLogic = """
            // ===== ПОИСК ПО СПОСОБНОСТИ =====
            if (window.abilitiesData) {
                let qAbil = query.replace(/^способность\\s+/i, '').replace(/[^\\p{L}\\d\\s_]/gu, '').trim();
                let qAbilNorm = qAbil.replace(/\\s+/g, '').replace(/ё/g, 'е');
                if (qAbilNorm) {
                    const abKey = Object.keys(window.abilitiesData).find(k => {
                        const ab = window.abilitiesData[k];
                        const enNorm = ab.Name.toLowerCase().replace(/\\s+/g, '');
                        const ruNorm = ab.RuName ? ab.RuName.toLowerCase().replace(/\\s+/g, '').replace(/ё/g, 'е') : '';
                        return enNorm === qAbilNorm || ruNorm === qAbilNorm || qAbilNorm === `ability_${ab.num_id}`;
                    });
                    if (abKey) {
                        highlightByAbility(abKey);
                        return;
                    }
                }
            }

            // ===== ПОИСК ПО ПРОФЕССИИ =====
            if (window.professionsData) {
                let qProf = query.replace(/^профессия\\s+/i, '').replace(/[^\\p{L}\\d\\s]/gu, '').trim();
                if (qProf) {
                    const prKey = Object.keys(window.professionsData).find(k => {
                        const pr = window.professionsData[k];
                        let prName = pr.ru_name.replace(/^[^\\p{L}]+/gu, '').trim().toLowerCase();
                        return k.toLowerCase() === qProf || prName === qProf || pr.ru_name.toLowerCase().includes(qProf);
                    });
                    if (prKey) {
                        highlightByProfession(prKey);
                        return;
                    }
                }
            }
"""

import re

for region in regions:
    file_path = os.path.join(pages_dir, f"{region}.html")
    if not os.path.exists(file_path):
        continue
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if "function highlightByAbility" not in content:
        content = re.sub(
            r'(function highlightByTier\([^)]+\)\s*\{[\s\S]*?highlightTimeout = setTimeout\(\(\) => \{[\s\S]*?\}, 60000\);\s*\})',
            r'\1\n' + highlightFunctions,
            content
        )
    
    if "ПОИСК ПО СПОСОБНОСТИ" not in content:
        content = re.sub(
            r'(highlightByTier\(tierKey\);\s*return;\s*\}\s*\})',
            r'\1\n' + parseLogic,
            content
        )
        
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
        
    print(f"Updated {region}.html")
