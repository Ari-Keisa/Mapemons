/**
 * Mapémon Pokémon Dossier Logic
 * Centralized for multiple pages (index.html, kanto.html, etc.)
 */

const typeIcons = {
    "grass": "🌿", "fire": "🔥", "water": "💧", "electric": "⚡️", "poison": "☠️",
    "ice": "❄️", "fighting": "🥊", "ground": "🏜️", "flying": "🕊️", "psychic": "🔮",
    "bug": "🐛", "rock": "🗿", "ghost": "👻", "dragon": "🐉", "steel": "⚙️",
    "dark": "🌑", "fairy": "✨", "normal": "⚪"
};

const typeColors = {
    "normal": "#A8A878", "fire": "#F08030", "water": "#6890F0", "electric": "#F8D030",
    "grass": "#78C850", "ice": "#98D8D8", "fighting": "#C03028", "poison": "#A040A0",
    "ground": "#E0C068", "flying": "#A890F0", "psychic": "#F85888", "bug": "#A8B820",
    "rock": "#B8A038", "ghost": "#705898", "dragon": "#7038F8", "steel": "#B8B8D0",
    "dark": "#705848", "fairy": "#EE99AC"
};

const tierMap = {
    "LC": "👶 LC", "NFE": "🧬 NFE", "Iron": "🔩 Iron", "Bronze": "🥉 Bronze",
    "Silver": "🥈 Silver", "Gold": "🥇 Gold", "Platinum": "💿 Platinum",
    "Diamond": "💎 Diamond", "Ascendant": "⚔️ Ascendant", "Uber": "💀 Uber",
    "UltraUber": "💀💀💀 UltraUber"
};

const genderMap = {
    "FemaleOneEighth": "🚹 87.5% / 🚺 12.5%",
    "Female25Percent": "🚹 75% / 🚺 25%",
    "Female50Percent": "🚹 50% / 🚺 50%",
    "Female75Percent": "🚹 25% / 🚺 75%",
    "AlwaysMale": "🚹 100%",
    "AlwaysFemale": "🚺 100%",
    "Genderless": "⚪ Бесполый"
};

const growthMap = {
    "Fast": "Быстрая (800,000 EXP)",
    "Medium": "Средняя (1,000,000 EXP)",
    "Parabolic": "Средне-медленная (1,059,860 EXP)",
    "Slow": "Медленная (1,250,000 EXP)",
    "Erratic": "Неровная (600,000 EXP)",
    "Fluctuating": "Колеблющаяся (1,640,000 EXP)"
};

const regionNames = { 'KANTO': 'Канто', 'JOHTO': 'Джото', 'HOENN': 'Хоэнн', 'SINNOH': 'Синно', 'UNOVA': 'Юнова' };

// --- Evolution method translation ---
const evoMethodRu = {
    'Level': 'Уровень',
    'Item': 'Использовать',
    'Trade': 'Обмен',
    'Happiness': 'Максимальное счастье',
    'HappinessDay': 'Максимальное счастье (днём)',
    'HappinessNight': 'Максимальное счастье (ночью)',
    'HasMove': 'Зная атаку',
    'HasMoveType': 'Зная атаку типа',
    'Location': 'В определённом месте',
    'LevelRain': 'Уровень (в дождь)',
    'LevelDay': 'Уровень (днём)',
    'LevelNight': 'Уровень (ночью)',
    'LevelMale': 'Уровень (♂)',
    'LevelFemale': 'Уровень (♀)',
    'Beauty': 'Красота',
    'TradeItem': 'Обмен с предметом',
    'ItemMale': 'Использовать (♂)',
    'ItemFemale': 'Использовать (♀)',
    'LevelDefeatEqual': 'Уровень (победить равного)',
    'LevelDark': 'Уровень (с покемоном типа Тёмный)',
    'Custom': 'Особый метод'
};

const evoItemRu = {
    'WATERSTONE': 'Водный камень', 'FIRESTONE': 'Огненный камень', 'THUNDERSTONE': 'Громовой камень',
    'LEAFSTONE': 'Лиственный камень', 'MOONSTONE': 'Лунный камень', 'SUNSTONE': 'Солнечный камень',
    'SHINYSTONE': 'Сияющий камень', 'DUSKSTONE': 'Сумеречный камень', 'DAWNSTONE': 'Камень рассвета',
    'ICESTONE': 'Ледяной камень', 'OVALSTONE': 'Овальный камень', 'KINGSROCK': 'Королевская скала',
    'METALCOAT': 'Металлическое покрытие', 'DRAGONSCALE': 'Драконья чешуя', 'UPGRADE': 'Апгрейд',
    'DUBIOUSDISC': 'Сомнительный диск', 'PROTECTOR': 'Защитник', 'ELECTIRIZER': 'Электризёр',
    'MAGMARIZER': 'Магмаризёр', 'REAPERCLOTH': 'Ткань жнеца', 'RAZORFANG': 'Острый клык',
    'RAZORCLAW': 'Острый коготь', 'PRISMSCALE': 'Призменная чешуя', 'WHIPPEDDREAM': 'Взбитый крем',
    'SACHET': 'Саше', 'DEEPSEASCALE': 'Глубоководная чешуя', 'DEEPSEATOOTH': 'Глубоководный зуб',
    'SWEETAPPLE': 'Сладкое яблоко', 'TARTAPPLE': 'Кислое яблоко', 'GALARICACUFF': 'Галарская манжета',
    'GALARICAWREATH': 'Галарский венок', 'LINKINGCORD': 'Шнур связи'
};

// Global ability data
window.abilitiesData = window.abilitiesData || null;

/**
 * Load abilities data (called from search.js / kanto.html)
 */
async function loadAbilitiesData() {
    if (window.abilitiesData) return;
    try {
        const isInPages = window.location.pathname.includes('/pages/');
        const resp = await fetch((isInPages ? '../' : '') + 'json/abilities.json');
        if (resp.ok) window.abilitiesData = await resp.json();
    } catch (e) { console.warn('abilities.json not loaded', e); }
}

// Auto-load abilities
loadAbilitiesData();

/**
 * Translate evolution condition to Russian
 */
function translateEvoCondition(method, param) {
    if (method === 'Level') return `Ур. ${param}`;
    if (method === 'LevelDay') return `Ур. ${param} (днём)`;
    if (method === 'LevelNight') return `Ур. ${param} (ночью)`;
    if (method === 'LevelMale') return `Ур. ${param} (♂)`;
    if (method === 'LevelFemale') return `Ур. ${param} (♀)`;
    if (method === 'LevelRain') return `Ур. ${param} (в дождь)`;
    if (method === 'LevelDark') return `Ур. ${param} (с Тёмным типом в команде)`;
    if (method === 'Item' || method === 'ItemMale' || method === 'ItemFemale') {
        const itemName = evoItemRu[param] || param;
        const suffix = method === 'ItemMale' ? ' (♂)' : method === 'ItemFemale' ? ' (♀)' : '';
        return `Использовать ${itemName}${suffix}`;
    }
    if (method === 'Trade') return param ? `Обмен (${evoItemRu[param] || param})` : 'Обмен';
    if (method === 'TradeItem') return `Обмен с ${evoItemRu[param] || param}`;
    if (method === 'Happiness') return param ? `Макс. счастье (${param})` : 'Макс. счастье';
    if (method === 'HappinessDay') return 'Макс. счастье (днём)';
    if (method === 'HappinessNight') return 'Макс. счастье (ночью)';
    if (method === 'HasMove') return `Зная атаку ${param}`;
    if (method === 'HasMoveType') return `Зная атаку типа ${param}`;
    if (method === 'Location') return `В ${param}`;
    if (method === 'Beauty') return `Красота ≥ ${param}`;
    const base = evoMethodRu[method] || method;
    return param ? `${base} ${param}` : base;
}

/**
 * Build full evolution tree from pokemon_ru data
 * Returns array of {from, to, condition} objects for ALL branches
 */
function buildFullEvoTree(speciesKey) {
    if (!pokemonRuData) return [];

    // Find root of chain by traversing evolves_from in pokemonDB
    let rootKey = speciesKey;
    const visited = new Set();

    // Try to find root via pokemonDB
    if (typeof pokemonDB !== 'undefined') {
        let currentId = null;
        for (const id in pokemonDB) {
            if (pokemonDB[id].en && pokemonDB[id].en.toUpperCase() === rootKey.toUpperCase()) {
                currentId = id; break;
            }
        }
        if (currentId && pokemonDB[currentId]) {
            let safety = 10;
            while (safety-- > 0) {
                const pk = pokemonDB[currentId];
                if (pk && pk.evolves_from && pk.evolves_from.length > 0) {
                    const parentId = pk.evolves_from[0];
                    const parent = pokemonDB[parentId];
                    if (parent && parent.en) {
                        currentId = parentId;
                        rootKey = parent.en.toUpperCase();
                    } else break;
                } else break;
            }
        }
    }

    // Now collect all evolution paths recursively from root
    const allPaths = [];

    function traverse(key) {
        if (visited.has(key)) return;
        visited.add(key);
        const data = pokemonRuData[key];
        if (!data || !data.Evolution || data.Evolution.length === 0) return;

        for (const evStr of data.Evolution) {
            const parts = evStr.split(',');
            const evoSpecies = parts[0] || '???';
            const evoMethod = parts[1] || '';
            const evoParam = parts[2] || '';

            // Get Russian names and IDs for clicking
            const fromData = getEvoSpeciesData(key);
            const toData = getEvoSpeciesData(evoSpecies);
            const cond = translateEvoCondition(evoMethod, evoParam);

            allPaths.push({
                from: fromData.name,
                fromKey: fromData.id,
                to: toData.name,
                toKey: toData.id,
                cond: cond
            });
            traverse(evoSpecies.toUpperCase());
        }
    }

    traverse(rootKey.toUpperCase());
    return allPaths;
}

/**
 * Get name and ID for a species key (for evolution chain)
 */
function getEvoSpeciesData(key) {
    const upper = key.toUpperCase();
    let name = key;
    let id = key;

    // Try pokemonDB first
    if (typeof pokemonDB !== 'undefined') {
        for (const pid in pokemonDB) {
            if (pokemonDB[pid].en && pokemonDB[pid].en.toUpperCase() === upper) {
                name = pokemonDB[pid].ru || pokemonDB[pid].en || key;
                id = pid;
                return { name, id };
            }
        }
    }
    // Try pokemonRuData
    if (typeof pokemonRuData !== 'undefined' && pokemonRuData[upper]) {
        name = pokemonRuData[upper].Name || key;
        id = upper;
    }
    return { name, id };
}

/**
 * Get Russian name for a species key
 */
function getRuName(key) {
    return getEvoSpeciesData(key).name;
}

/**
 * Get all ancestors (pre-evolutions) of a pokemon
 */
function getAllAncestors(pkId) {
    const ancestors = [];
    let currentId = pkId;
    const visited = new Set();
    
    while (currentId && !visited.has(currentId)) {
        visited.add(currentId);
        const pk = pokemonDB[currentId];
        if (pk && pk.evolves_from && pk.evolves_from.length > 0) {
            const parentId = pk.evolves_from[0];
            const parent = pokemonDB[parentId];
            if (parent) {
                ancestors.push({ id: parentId, ...parent });
                currentId = parentId;
            } else break;
        } else break;
    }
    return ancestors;
}

/**
 * Find where a pokemon lives (habitat)
 */
function findHabitatForDossier(enName) {
    const ld = (typeof locationData !== 'undefined' && locationData) || (typeof allLocationData !== 'undefined' && allLocationData) || null;
    if (!ld) return [];
    const capsName = enName.toUpperCase().trim();
    const found = [];
    for (const id in ld) {
        const loc = ld[id];
        const enc = loc.encounters ? loc.encounters.find(e => e.species === capsName) : null;
        if (enc) found.push({ ...loc, info: enc });
    }
    return found;
}

/**
 * Render ability with expand/collapse tooltip
 */
function renderAbilityItem(abilityKey, index) {
    const data = window.abilitiesData ? window.abilitiesData[abilityKey] : null;
    const ruName = data ? (data.RuName || data.ru) : abilityKey;
    const desc = data ? (data.Description || data.desc) : null;
    const displayName = `${ruName} (${abilityKey.toUpperCase()})`;

    if (!desc || desc === 'undefined') {
        return `<div class="ability-item no-desc">
            ${displayName}
        </div>`;
    }

    return `<div class="ability-item" onclick="toggleAbilityDesc('ab${index}')" id="abBtn${index}">
        <span class="ability-toggle">▶</span> ${displayName}
    </div>
    <div class="ability-desc" id="ab${index}">${desc}</div>`;
}

function toggleAbilityDesc(id) {
    const el = document.getElementById(id);
    const btn = document.getElementById(id.replace('ab', 'abBtn'));
    if (el) {
        el.classList.toggle('show');
        if (btn) btn.classList.toggle('open');
    }
}

/**
 * Opens the Pokémon dossier modal
 */
function openPokemonDossier(pkId) {
    if (typeof pokemonDB === 'undefined' || typeof pokemonRuData === 'undefined') {
        console.error('Core data (pokemonDB/pokemonRuData) not loaded');
        return;
    }

    const pk = pokemonDB[pkId];
    let ruData = null;
    let speciesKey = '';

    // Advanced Data Lookup
    if (pokemonRuData) {
        if (pk && pk.en) {
            speciesKey = pk.en.toUpperCase();
            ruData = pokemonRuData[speciesKey];
        }
        if (!ruData) {
            ruData = pokemonRuData[pkId];
            if (ruData) speciesKey = pkId;
        }
        if (!ruData && pk) {
            const numId = parseInt(pkId);
            for (const k in pokemonRuData) {
                if (pokemonRuData[k].NationalId === numId) {
                    ruData = pokemonRuData[k];
                    speciesKey = k;
                    break;
                }
            }
        }
    }

    if (!pk && !ruData) return;

    const natId = ruData ? ruData.NationalId : parseInt(pkId);
    const numStr = (natId || pkId).toString().replace(/^0+/, '');

    let ruName = (pk && pk.ru) || null;
    if (!ruName && window.pokemonNamesUpper) {
        const paddedId = natId ? natId.toString().padStart(3, '0') : pkId.toString().padStart(3, '0');
        if (window.pokemonNamesUpper[paddedId] && window.pokemonNamesUpper[paddedId].ru) {
            ruName = window.pokemonNamesUpper[paddedId].ru;
        }
    }
    if (!ruName) {
        ruName = (ruData && (ruData.RuName || ruData.Name)) || pkId;
    }
    const enName = speciesKey || (pk && pk.en) || pkId;

    // Sprite path
    const isInPages = window.location.pathname.includes('/pages/');
    const spritePath = (isInPages ? '../' : '') + `home/${natId}.png`;

    // Types
    let types = [];
    if (pk && pk.type && Array.isArray(pk.type)) {
        types = pk.type;
    } else if (ruData && ruData.Types) {
        types = typeof ruData.Types === 'string' ? ruData.Types.split(',') : ruData.Types;
    }
    const typesHtml = types.map(t => {
        const tLow = t.toLowerCase().trim();
        const color = typeColors[tLow] || '#888';
        const icon = typeIcons[tLow] || '';
        return `<span class="dossier-type-badge" style="background:${color}">${icon} ${t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()}</span>`;
    }).join('');

    // Basic info
    const format = ruData ? ruData.Format : '';
    const tierDisplay = format ? (tierMap[format] || format) : '';
    const pokedex = (ruData && ruData.Pokedex) || '';
    const abilitiesArr = (ruData && ruData.Abilities) ? (Array.isArray(ruData.Abilities) ? ruData.Abilities : [ruData.Abilities]) : [];
    const hiddenArr = (ruData && ruData.HiddenAbilities) ? (Array.isArray(ruData.HiddenAbilities) ? ruData.HiddenAbilities : [ruData.HiddenAbilities]) : [];
    const catchRate = (ruData && ruData.CatchRate != null) ? ruData.CatchRate : '';
    const height = (ruData && ruData.Height != null) ? ruData.Height : '';
    const weight = (ruData && ruData.Weight != null) ? ruData.Weight : '';

    // --- ABILITIES with tooltips ---
    let abilityIndex = 0;
    let abilitiesHtml = '';
    if (abilitiesArr.length) {
        abilitiesHtml = `<div>✨ <strong>Способности:</strong><br>${abilitiesArr.map(a => renderAbilityItem(a, abilityIndex++)).join('')}</div>`;
    }
    let hiddenHtml = '';
    if (hiddenArr.length) {
        hiddenHtml = `<div style="margin-top:5px;">🔮 <strong>Скрытые:</strong><br>${hiddenArr.map(a => renderAbilityItem(a, abilityIndex++)).join('')}</div>`;
    }

    // --- INFO PANEL (right of portrait) ---
    let infoHtml = `<div class="dossier-info-text">
        ${abilitiesHtml}
        ${hiddenHtml}
        ${ruData && ruData.GenderRatio ? `<div>👥 <strong>Соотношение полов:</strong> ${genderMap[ruData.GenderRatio] || ruData.GenderRatio}</div>` : ''}
        ${ruData && ruData.GrowthRate ? `<div>⭐️ <strong>Группа опыта:</strong> ${growthMap[ruData.GrowthRate] || ruData.GrowthRate}</div>` : ''}
        ${catchRate !== '' ? `<div>🎯 <strong>Рейтинг поимки:</strong> ${catchRate}</div>` : ''}
        ${height || weight ? `<div>${height ? `📏 <strong>Рост:</strong> ${height} м` : ''}${height && weight ? ' | ' : ''}${weight ? `⚖️ <strong>Вес:</strong> ${weight} кг` : ''}</div>` : ''}
    </div>`;

    // --- NAVIGATION ---
    const prevId = (natId && natId > 1) ? (natId - 1).toString().padStart(3, '0') : null;
    const nextId = (natId && natId < 1025) ? (natId + 1).toString().padStart(3, '0') : null;

    // --- STATS (full width) ---
    const bsArr = (ruData && ruData.BaseStats) ? ruData.BaseStats : null;
    let statsHtml = '';
    if (bsArr && Array.isArray(bsArr) && bsArr.length >= 6) {
        const statLabels = ['HP', 'Атк', 'Защ', 'Скор', 'СА', 'СЗ'];
        const statColorsArr = ['#ff5555', '#ff8844', '#ffcc33', '#ff66aa', '#6699ff', '#77dd77'];
        const total = bsArr.reduce((a, b) => a + b, 0);
        statsHtml = `<div class="dossier-stats-section"><div class="dossier-stats-title">📊 Базовые статы (Сумма: ${total}):</div>`;
        for (let i = 0; i < 6; i++) {
            const val = bsArr[i] || 0;
            const pct = Math.min(100, (val / 255) * 100);
            statsHtml += `<div class="stat-row">
                <span class="stat-label">${statLabels[i]}</span>
                <span class="stat-val">${val}</span>
                <div class="stat-bar-bg"><div class="stat-bar" style="width:0%;background:${statColorsArr[i]}" data-pct="${pct}"></div></div>
            </div>`;
        }
        statsHtml += '</div>';
    }

    // Power
    const power = (ruData && ruData.PowerCategory != null) ? ruData.PowerCategory : '';
    let powerHtml = '';
    if (power !== '') {
        const n = parseInt(power) || 0;
        powerHtml = `<div class="dossier-power">💪 <strong>Сила:</strong> ${'⭐️'.repeat(Math.min(n, 10))} (${n})</div>`;
    }

    // --- EVOLUTION (full tree) ---
    let evoHtml = '';
    const evoPaths = buildFullEvoTree(speciesKey || enName);
    if (evoPaths.length > 0) {
        evoHtml = `<div class="dossier-section">
            <div class="dossier-section-title">🔄 Цепочка эволюций</div>
            ${evoPaths.map(p => {
            const fromPadded = p.fromKey && !isNaN(p.fromKey) ? p.fromKey.toString().padStart(3, '0') : p.fromKey;
            const toPadded = p.toKey && !isNaN(p.toKey) ? p.toKey.toString().padStart(3, '0') : p.toKey;

            return `<div class="evo-row">
                    <span class="evo-species" onclick="openPokemonDossier('${p.fromKey}')">${p.from}</span>
                    <span class="evo-arrow">→</span>
                    <span class="evo-cond">${p.cond}</span>
                    <span class="evo-arrow">→</span>
                    <span class="evo-species" onclick="openPokemonDossier('${p.toKey}')">${p.to}</span>
                </div>`;
        }).join('')}
        </div>`;
    }

    // --- HABITAT ---
    let habitatHtml = '';
    const habitats = findHabitatForDossier(enName);
    
    if (habitats.length > 0) {
        const byReg = {};
        habitats.forEach(l => { if (!byReg[l.region]) byReg[l.region] = []; byReg[l.region].push(l); });
        habitatHtml = `<div class="dossier-section">
            <div class="dossier-section-title">📍 Среда обитания</div>
            ${Object.entries(byReg).map(([reg, locs]) => `<div class="habitat-region">
                <div class="habitat-region-name">${regionNames[reg] || reg}</div>
                ${locs.map(l => `<div class="habitat-loc">
                    <strong>${l.ru_name}</strong>
                    <div class="habitat-loc-detail">Ур. ${l.info.min_level}-${l.info.max_level} • Шанс: ${l.info.rarity}%${l.info.conditions ? ' ⏰' : ''}</div>
                </div>`).join('')}
            </div>`).join('')}
        </div>`;
    } else {
        // Check for ancestors
        const ancestors = getAllAncestors(pkId);
        let ancestorsHtml = '';

        if (ancestors.length > 0) {
            ancestorsHtml = `<div class="dossier-section">
                <div class="dossier-section-title">📍 Среда обитания</div>
                <div style="color:#ff6b6b; font-size:0.82rem; margin-bottom:12px; font-style:italic;">
                    Не встречается в дикой природе. Вы можете эволюционировать его из предыдущих форм:
                </div>`;

            ancestors.forEach((anc, idx) => {
                const ancHabitats = findHabitatForDossier(anc.en);
                const ancRuName = anc.ru || anc.en;
                
                if (ancHabitats.length > 0) {
                    const byReg = {};
                    ancHabitats.forEach(l => { if (!byReg[l.region]) byReg[l.region] = []; byReg[l.region].push(l); });
                    
                    ancestorsHtml += `
                    <div class="ancestor-habitat-box" style="margin-bottom:10px;">
                        <button class="anc-toggle-btn" onclick="toggleAncestorHabitat('anc${idx}')" style="width:100%; text-align:left; padding:10px; background:rgba(78,205,196,0.15); border:1px solid rgba(78,205,196,0.3); border-radius:8px; color:white; cursor:pointer; font-size:14px; display:flex; justify-content:space-between; align-items:center;">
                            <span>🗺 Посмотреть места обитания <b>${ancRuName}</b> (${anc.en})</span>
                            <i class="fas fa-chevron-down" id="ancIcon${idx}"></i>
                        </button>
                        <div id="anc${idx}" class="anc-habitat-list" style="display:none; padding:10px; background:rgba(0,0,0,0.2); border-radius:0 0 8px 8px; border:1px solid rgba(78,205,196,0.1); border-top:none;">
                            ${Object.entries(byReg).map(([reg, locs]) => `
                                <div class="habitat-region">
                                    <div class="habitat-region-name" style="font-size:13px; margin:5px 0;">${regionNames[reg] || reg}</div>
                                    ${locs.map(l => `
                                        <div class="habitat-loc" style="padding:6px 10px; font-size:13px;">
                                            <strong>${l.ru_name}</strong>
                                            <div class="habitat-loc-detail">Ур. ${l.info.min_level}-${l.info.max_level} • Шанс: ${l.info.rarity}%</div>
                                        </div>
                                    `).join('')}
                                </div>
                            `).join('')}
                        </div>
                    </div>`;
                } else {
                    ancestorsHtml += `
                    <div style="padding:10px; background:rgba(255,255,255,0.05); border-radius:8px; margin-bottom:10px; font-size:13px; color:var(--text-muted);">
                        🛑 <b>${ancRuName}</b> также не встречается в дикой природе.
                    </div>`;
                }
            });
            ancestorsHtml += `</div>`;
        }

        habitatHtml = ancestorsHtml || `<div class="dossier-section">
            <div class="dossier-section-title">📍 Среда обитания</div>
            <div class="habitat-empty">В дикой природе не встречается</div>
        </div>`;
    }

    // --- PROFESSIONS ---
    let profHtml = '';
    if (typeof profAffinityData !== 'undefined' && typeof professionsData !== 'undefined') {
        const matchedProfs = {};
        const capsSpeciesKey = speciesKey.toUpperCase();
        const capsEnName = enName.toUpperCase();
        const upperTypes = types.map(t => t.toUpperCase().trim());

        for (const affKey in profAffinityData) {
            const aff = profAffinityData[affKey];
            if (!aff.bonuses || !aff.conditions) continue;
            let matched = false;
            if (aff.conditions.types) {
                for (const ct of aff.conditions.types) {
                    if (upperTypes.includes(ct.toUpperCase())) { matched = true; break; }
                }
            }
            if (!matched && aff.conditions.species) {
                for (const cs of aff.conditions.species) {
                    const c = cs.toUpperCase();
                    if (c === capsSpeciesKey || c === capsEnName) { matched = true; break; }
                }
            }
            if (!matched && aff.conditions.abilities) {
                const allAbs = [...abilitiesArr, ...hiddenArr].map(a => a.toUpperCase());
                for (const ca of aff.conditions.abilities) {
                    if (allAbs.includes(ca.toUpperCase())) { matched = true; break; }
                }
            }
            if (matched) {
                for (const bonus of aff.bonuses) {
                    const profId = bonus.profession;
                    const prof = professionsData[profId];
                    const profName = prof ? prof.ru_name : profId;
                    const pct = bonus.value ? Math.round((bonus.value - 1) * 100) : 0;
                    if (!matchedProfs[profName]) matchedProfs[profName] = [];
                    matchedProfs[profName].push(`${aff.ru_name || affKey}: +${pct}%`);
                }
            }
        }

        const profEntries = Object.entries(matchedProfs);
        if (profEntries.length > 0) {
            profHtml = `<div class="dossier-section dossier-prof-section">
                <div class="dossier-section-title">🧑‍🔧 Профессии и Сродство</div>
                ${profEntries.map(([name, bonuses]) => `<div class="prof-item">
                    <div class="prof-name">${name}</div>
                    ${bonuses.map(b => `<div class="prof-bonus">• ${b}</div>`).join('')}
                </div>`).join('')}
                <div class="prof-note">💡 Бонусы к профессиям зависят от типа, вида, способностей и формы покемона.</div>
            </div>`;
        }
    }

    // --- FORMS ---
    let formsHtml = '';
    if (typeof formsBySpecies !== 'undefined') {
        const specId = natId || parseInt(pkId);
        const forms = formsBySpecies[String(specId)] || [];
        if (forms.length > 0) {
            formsHtml = '<div style="margin-top:15px;">' + forms.map((f, i) => {
                const fName = f.FormName || f._FormName || `Форма ${i + 1}`;
                const isMega = fName.toLowerCase().includes('mega');
                return `<button class="form-btn" onclick="showFormDossier(${specId}, ${i})">🔄 ${isMega ? 'Открыть ' : ''}${fName}</button>`;
            }).join('') + '</div>';
        }
    }

    // ===== RENDER =====
    let overlay = document.getElementById('dossierOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'dossier-overlay';
        overlay.id = 'dossierOverlay';
        document.body.appendChild(overlay);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) closeDossier(); });
    }

    overlay.innerHTML = `
        <div class="dossier-card">
            <div class="dossier-controls">
                ${prevId ? `<button class="dossier-nav-btn dossier-prev" onclick="openPokemonDossier('${prevId}')" title="Предыдущий (#${natId - 1})"><i class="fas fa-chevron-left"></i></button>` : ''}
                <button class="dossier-close" onclick="closeDossier()"><i class="fas fa-times"></i></button>
                ${nextId ? `<button class="dossier-nav-btn dossier-next" onclick="openPokemonDossier('${nextId}')" title="Следующий (#${natId + 1})"><i class="fas fa-chevron-right"></i></button>` : ''}
            </div>
            <div class="dossier-top">
                <div class="dossier-portrait">
                    <div class="dossier-portrait-frame">
                        <div class="dossier-num">#${numStr}</div>
                        <img src="${spritePath}" alt="${enName}" onerror="this.src='${isInPages ? '../' : ''}home/0.png'">
                    </div>
                    <div class="dossier-name-block">
                        <div class="ru">${ruName}</div>
                        <div class="en">${enName}</div>
                    </div>
                    <div class="dossier-types">${typesHtml}</div>
                    ${tierDisplay ? `<div class="dossier-tier">🏆 Тир: ${tierDisplay}</div>` : ''}
                </div>
                ${infoHtml}
            </div>

            ${statsHtml}
            ${powerHtml}

            ${pokedex ? `<div class="dossier-pokedex"><div class="dossier-pokedex-title">📖 Покедекс</div>${pokedex}</div>` : ''}

            <div class="dossier-bottom-grid">
                ${evoHtml}
                ${habitatHtml}
            </div>

            ${profHtml}
            ${formsHtml}
        </div>
    `;

    // Animate stat bars after render
    requestAnimationFrame(() => {
        setTimeout(() => {
            overlay.querySelectorAll('.stat-bar').forEach(bar => {
                bar.style.width = bar.dataset.pct + '%';
            });
        }, 100);
    });
}

function closeDossier() {
    const el = document.getElementById('dossierOverlay');
    if (el) el.remove();
}

/**
 * Toggle ancestor habitat dropdown
 */
function toggleAncestorHabitat(id) {
    const el = document.getElementById(id);
    const icon = document.getElementById(id.replace('anc', 'ancIcon'));
    if (el) {
        const isHidden = el.style.display === 'none';
        el.style.display = isHidden ? 'block' : 'none';
        if (icon) {
            icon.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
        }
    }
}

/**
 * Handles toggling to a specific Pokémon form (Mega, etc.)
 */
function showFormDossier(speciesId, formIndex) {
    if (typeof formsBySpecies === 'undefined') return;
    const forms = formsBySpecies[String(speciesId)] || [];
    const form = forms[formIndex];
    if (!form) return;

    const overlay = document.getElementById('dossierOverlay');
    if (!overlay) return;

    const fName = form.FormName || form._FormName || 'Форма';
    const types = form.Types || [];
    const typesHtml = types.map(t => {
        const color = typeColors[t.toLowerCase()] || '#888';
        const icon = typeIcons[t.toLowerCase()] || '';
        return `<span class="dossier-type-badge" style="background:${color}">${icon} ${t.charAt(0).toUpperCase() + t.slice(1)}</span>`;
    }).join('');

    const format = form.Format || '';
    const tierDisplay = format ? (tierMap[format] || format) : '';
    const pokedex = form.Pokedex || '';
    const abilities = form.Abilities ? form.Abilities.join(', ') : '';
    const weight = form.Weight != null ? (form.Weight / 10).toFixed(1) : '';
    const bs = form.BaseStats || null;

    let statsHtml = '';
    if (bs) {
        const statNames = { HP: 'HP', Atk: 'Атк', Def: 'Защ', SpAtk: 'СА', SpDef: 'СЗ', Spd: 'Скор' };
        const statCols = { HP: '#ff5555', Atk: '#ff8844', Def: '#ffcc33', SpAtk: '#6699ff', SpDef: '#77dd77', Spd: '#ff66aa' };
        const total = Object.values(bs).reduce((a, b) => a + b, 0);
        statsHtml = `<div class="dossier-stats-title">📊 Базовые статы (Сумма: ${total}):</div>`;
        for (const [key, label] of Object.entries(statNames)) {
            const val = bs[key] || 0;
            const pct = Math.min(100, (val / 255) * 100);
            statsHtml += `<div class="stat-row"><span class="stat-label">${label}</span><span class="stat-val">${val}</span><div class="stat-bar-bg"><div class="stat-bar" style="width:${pct}%;background:${statCols[key] || '#4ecdc4'}"></div></div></div>`;
        }
    }

    const prevId = (speciesId > 1) ? (speciesId - 1).toString().padStart(3, '0') : null;
    const nextId = (speciesId < 1025) ? (speciesId + 1).toString().padStart(3, '0') : null;

    overlay.querySelector('.dossier-card').innerHTML = `
        <div class="dossier-controls">
            ${prevId ? `<button class="dossier-nav-btn dossier-prev" onclick="openPokemonDossier('${prevId}')" title="Предыдущий (#${speciesId - 1})"><i class="fas fa-chevron-left"></i></button>` : ''}
            <button class="dossier-close" onclick="closeDossier()"><i class="fas fa-times"></i></button>
            ${nextId ? `<button class="dossier-nav-btn dossier-next" onclick="openPokemonDossier('${nextId}')" title="Следующий (#${speciesId + 1})"><i class="fas fa-chevron-right"></i></button>` : ''}
        </div>
        <div class="dossier-top">
            <div class="dossier-portrait">
                <div class="dossier-portrait-frame">
                    <div class="dossier-num">#${speciesId}</div>
                    <img src="${(window.location.pathname.includes('/pages/') ? '../' : '')}home/${speciesId}.png" alt="${fName}" onerror="this.src='${(window.location.pathname.includes('/pages/') ? '../' : '')}home/0.png'">
                </div>
                <div class="dossier-name-block">
                    <div class="ru">${fName}</div>
                    <div class="en">Форма покемона</div>
                </div>
                <div class="dossier-types">${typesHtml}</div>
                ${tierDisplay ? `<div class="dossier-tier">🏆 Тир: ${tierDisplay}</div>` : ''}
            </div>
            <div class="dossier-info-text">
                ${abilities ? `<div>✨ <strong>Способности:</strong><br>${abilities}</div>` : ''}
                ${weight ? `<div>⚖️ <strong>Вес:</strong> ${weight} кг</div>` : ''}
                ${form.MegaStone ? `<div style="color:#c9b1ff;">💎 Мега-камень: <strong>${form.MegaStone}</strong></div>` : ''}
            </div>
        </div>
        
        <div class="dossier-stats-section">
            ${statsHtml}
        </div>

        ${pokedex ? `<div class="dossier-pokedex"><div class="dossier-pokedex-title">📖 Покедекс</div>${pokedex}</div>` : ''}
        
        <div style="margin-top:25px;">
            <button class="form-btn" onclick="openPokemonDossier('${String(speciesId).padStart(3, '0')}')">← Назад к основной форме</button>
        </div>
    `;
}

function getTypeText(type) {
    const types = {
        'city': 'Город', 'route': 'Маршрут', 'special': 'Особое место',
        'forest': 'Лес', 'meadow': 'Луг', 'cave': 'Пещера',
        'island': 'Остров', 'mountain': 'Гора', 'canyon': 'Каньон',
        'building': 'Строение', 'other': 'Прочее', 'inactive': 'Другой регион'
    };
    return types[type] || 'Локация';
}
