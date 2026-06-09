/**
 * Mapémon Pokémon Dossier Logic
 * Centralized for multiple pages (index.html, kanto.html, etc.)
 */

// ==========================================
// ГЛОБАЛЬНЫЕ ФУНКЦИИ (Fuzzy Match & String Norm)
// ==========================================
window.itemSimilarity = function(str1, str2) {
    if (!str1 || !str2) return 0;
    if (str1 === str2) return 1;
    const getBigrams = str => {
        const b = new Set();
        for (let i = 0; i < str.length - 1; i++) b.add(str.slice(i, i+2));
        return b;
    };
    const bg1 = getBigrams(str1);
    const bg2 = getBigrams(str2);
    let intersection = 0;
    for (let bg of bg1) if (bg2.has(bg)) intersection++;
    if (bg1.size + bg2.size === 0) return 0;
    return (2.0 * intersection) / (bg1.size + bg2.size);
};

window.fuzzyMatchItemKey = function(queryStr, itemsDataObj) {
    if (!queryStr || !itemsDataObj) return null;
    const norm = str => str.toLowerCase().replace(/ё/g, 'е').replace(/[^а-яa-z0-9]/g, '');
    const qNorm = norm(queryStr);

    // 1. Exact match — always return immediately
    for (const key in itemsDataObj) {
        const item = itemsDataObj[key];
        if (norm(item.RuName || "") === qNorm || norm(item.Name || "") === qNorm) return key;
    }

    // 2. Collect ALL fuzzy candidates with their scores
    const candidates = [];
    for (const key in itemsDataObj) {
        const item = itemsDataObj[key];
        const rScore = window.itemSimilarity(qNorm, norm(item.RuName || ""));
        const eScore = window.itemSimilarity(qNorm, norm(item.Name || ""));
        const score = Math.max(rScore, eScore);
        if (score > 0.55) {
            candidates.push({ key, score });
        }
    }

    if (candidates.length === 0) return null;

    // Sort by score descending
    candidates.sort((a, b) => b.score - a.score);
    const best = candidates[0];

    // 3. If there is only ONE candidate above threshold — it's unique, return it
    if (candidates.length === 1 && best.score > 0.55) return best.key;

    // 4. If there are MULTIPLE candidates, check if the best is clearly better
    //    than the second best (gap > 0.15). If not — the query is ambiguous, return null.
    if (candidates.length >= 2) {
        const secondBest = candidates[1];
        const gap = best.score - secondBest.score;
        // Clear winner — big gap between #1 and #2
        if (gap > 0.15 && best.score > 0.70) return best.key;
        // Ambiguous — multiple similar items match, don't guess
        return null;
    }

    if (best.score > 0.70) return best.key;
    return null;
};

const typeIcons = {
    "grass": "🌿", "fire": "🔥", "water": "💧", "electric": "⚡️", "poison": "☠️",
    "ice": "❄️", "fighting": "🥊", "ground": "🏜️", "flying": "🕊️", "psychic": "🔮",
    "bug": "🐛", "rock": "🗿", "ghost": "👻", "dragon": "🐉", "steel": "⚙️",
    "dark": "🌑", "fairy": "✨", "normal": "⚪"
};

const typeNamesRu = {
    "normal": "Нормальный", "fire": "Огненный", "water": "Водный", "grass": "Травяной",
    "electric": "Электрический", "ice": "Ледяной", "fighting": "Боевой", "poison": "Ядовитый",
    "ground": "Земляной", "flying": "Летающий", "psychic": "Психический", "bug": "Насекомый",
    "rock": "Каменный", "ghost": "Призрачный", "dragon": "Драконий", "steel": "Стальной",
    "dark": "Тёмный", "fairy": "Волшебный"
};

const typeColors = {
    "normal": "#A8A878", "fire": "#eb6657ff", "water": "#5d85e2ff", "electric": "#F8D030",
    "grass": "#78C850", "ice": "#70aaaaff", "fighting": "#C03028", "poison": "#b64db6ff",
    "ground": "#6d5c2bff", "flying": "#c8b6ffff", "psychic": "#f14e7fff", "bug": "#909d17ff",
    "rock": "#443c17ff", "ghost": "#cab3f0ab", "dragon": "#27a573ff", "steel": "#545465ff",
    "dark": "#000000ff", "fairy": "#f9f290ff"
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

// --- STICKER & EMOJI FORMATTING (Shared) ---

window.formatItemSticker = function(stickerStr) {
    if (!stickerStr) return '';
    
    // Normalize sticker string: remove ALL invisible Unicode characters
    // FE0F = emoji presentation selector, FE0E = text presentation selector
    // 200B = zero-width space, 200C = ZWNJ, 200D = ZWJ, FEFF = BOM/ZWNBS
    // 00A0 = non-breaking space, 00AD = soft hyphen
    // 2060 = word joiner, 2061-2064 = invisible operators
    // E0020-E007F = tag characters (used in flag sequences)
    const cleanStr = stickerStr.replace(/[\uFE0F\uFE0E\u200B-\u200D\u00A0\u00AD\uFEFF\u2060-\u2064\u2028\u2029]/g, '').trim();
    const chars = Array.from(cleanStr).filter(c => {
        if (!c || !c.trim()) return false;
        const cp = c.codePointAt(0);
        // Filter out remaining control/format characters
        if (cp < 0x20) return false; // C0 controls
        if (cp >= 0x7F && cp <= 0x9F) return false; // C1 controls
        if (cp >= 0xE0020 && cp <= 0xE007F) return false; // Tags
        if (cp === 0x2028 || cp === 0x2029) return false; // line/para separators
        return true;
    });
    
    if (chars.length > 1) {
        // 1. Check for known 2-character combination image
        if (chars.length === 2 && window.emojiCombosSorted) {
            const sortedKey = [...chars].sort().join('');
            const path = window.emojiCombosSorted[sortedKey];
            if (path) {
               return `<img src="${path}" class="emoji-img" alt="${stickerStr}" style="width: 1.5em; height: 1.5em; vertical-align: middle;">`;
            }
        }

        // 2. Otherwise, if it's multiple symbols (not letters/digits), apply flip
        const hasLetters = /[a-zA-Zа-яА-Я0-9]/.test(cleanStr);
        if (!hasLetters) {
            const facesHtml = chars.map((char, index) => {
                const content = window.formatTextWithEmojis(char); 
                return `<div class="sticker-face face-${index + 1}">${content}</div>`;
            }).join('');
            
            const flipLimit = Math.min(chars.length, 4);
            return `
                <div class="coin-sticker-container">
                    <div class="coin-sticker flip-${flipLimit}">
                        ${facesHtml}
                    </div>
                </div>`;
        }
    }
    
    // Single character or fallback
    return window.formatTextWithEmojis(stickerStr);
};

window.formatTextWithEmojis = function(text) {
    if (!text) return '';
    if (!window.emojiCombosData) return text;
    
    let result = text;
    const isInPages = window.location.pathname.includes('/pages/');
    
    for (const [emoji, path] of Object.entries(window.emojiCombosData)) {
        if (result.includes(emoji)) {
            const relativePath = isInPages ? '../' + path : path;
            const imgHtml = `<img src="${relativePath}" class="emoji-img" alt="${emoji}" style="width: 1.25em; height: 1.25em; vertical-align: middle; margin: 0 1px;">`;
            result = result.split(emoji).join(imgHtml);
        }
    }
    return result;
};

window.formatItemStringWithFlip = function(itemText) {
    if (!itemText) return '';
    
    // Match leading characters that are not letters, digits, or standard punctuation, but allow spaces.
    const match = itemText.match(/^([^\p{L}\p{N}()\[\]\-+.,;:!?%&'"]+)(.*)$/u);
    if (match) {
        const leadingSticker = match[1];
        const remainingText = match[2];
        
        // Clean ALL invisible Unicode characters from sticker
        const cleanSticker = leadingSticker.replace(/[\s\uFE0F\uFE0E\u00A0\u00AD\u200B-\u200D\uFEFF\u2060-\u2064\u2028\u2029]/g, '');
        // Extract array of characters and filter to only keep visible emoji/symbols
        const chars = Array.from(cleanSticker).filter(c => {
            if (!c || !c.trim()) return false;
            const cp = c.codePointAt(0);
            if (cp < 0x20 || (cp >= 0x7F && cp <= 0x9F)) return false;
            if (cp >= 0xE0020 && cp <= 0xE007F) return false;
            return /[^\p{L}\p{N}\s()\[\]\-+.,;:!?%&'"]/u.test(c);
        });
        
        if (chars.length > 1) {
            const formattedSticker = window.formatItemSticker(leadingSticker);
            const formattedText = window.formatTextWithEmojis(remainingText.trim());
            return `<span style="display:inline-flex; align-items:center; gap:8px; vertical-align: middle;">
                <span class="item-result-sticker" style="display:inline-flex; min-width:1.5em; justify-content:center; flex-shrink:0;">${formattedSticker}</span>
                <span>${formattedText}</span>
            </span>`;
        }
    }
    return window.formatTextWithEmojis(itemText);
};

window.loadEmojiCombos = async function() {
    if (window.emojiCombosData) return;
    try {
        const isInPages = window.location.pathname.includes('/pages/');
        const resp = await fetch((isInPages ? '../' : '') + 'json/emoji_combos.json');
        if (resp.ok) {
            const raw = await resp.json();
            window.emojiCombosData = {};
            window.emojiCombosSorted = {};
            for (let k in raw) {
                const cleanKey = k.replace(/\uFE0F/g, '');
                const path = raw[k];
                window.emojiCombosData[cleanKey] = path;
                const sortedKey = Array.from(cleanKey).sort().join('');
                window.emojiCombosSorted[sortedKey] = path;
            }
        }
    } catch (e) {
        console.warn('emoji_combos.json not loaded', e);
    }
};

// Auto-load emojis
window.loadEmojiCombos();

/**
 * Translates English form names to Russian and formats them properly.
 */
window.translateFormName = function(enFormName, baseRuName, baseEnName) {
    if (!enFormName) return { ru: baseRuName, en: baseEnName };

    // Standardize base English name
    const enBase = baseEnName.charAt(0).toUpperCase() + baseEnName.slice(1).toLowerCase();
    
    let ru = enFormName;
    let en = enFormName;

    // Translation maps
    const prefixes = {
        'Mega': 'Мега',
        'Primal': 'Первобытный',
        'Alolan': 'Алола',
        'Galarian': 'Галар',
        'Hisuian': 'Хисуи',
        'Paldean': 'Палдея',
        'Partner': 'Партнёр',
        'Origin': 'Оригинальная',
        'Therian': 'Териан',
        'Incarnate': 'Воплощённая',
        'Gigantamax': 'Гигантамакс',
        'White': 'Белый',
        'Black': 'Чёрный',
        'Dusk': 'Сумеречный',
        'Dawn': 'Рассветный',
        'Zen': 'Дзен',
        'Red': 'Красный',
        'Blue': 'Синий',
        'Yellow': 'Жёлтый',
        'Orange': 'Оранжевый',
        'White': 'Белый',
        'Eternal': 'Вечный'
    };

    const forms = {
        'Forme': 'форма',
        'Form': 'форма',
        'Style': 'стиль',
        'Mode': 'режим',
        'Flower': 'цветок'
    };

    let matched = false;

    // Case 1: FormName already contains species, e.g., "Mega Venusaur"
    const lowerForm = enFormName.toLowerCase();
    const lowerBase = baseEnName.toLowerCase();
    
    if (lowerForm.includes(lowerBase)) {
        for (const [enPref, ruPref] of Object.entries(prefixes)) {
            if (enFormName.startsWith(enPref)) {
                // Заменяем префикс и имя вида, сохраняя остальное (например, " X")
                ru = enFormName.replace(enPref, ruPref + '-').replace(new RegExp(baseEnName, 'i'), baseRuName);
                matched = true;
                break;
            }
        }
    } 
    // Case 2: FormName is just the form, e.g., "Alolan"
    else {
        for (const [enPref, ruPref] of Object.entries(prefixes)) {
            if (enFormName === enPref) {
                ru = baseRuName + ' (' + ruPref + ')';
                en = enPref + ' ' + enBase;
                matched = true;
                break;
            }
        }
        
        // Handle "Forme" suffixes
        if (!matched) {
            for (const [enForm, ruForm] of Object.entries(forms)) {
                if (enFormName.endsWith(enForm)) {
                    const prefix = enFormName.replace(enForm, '').trim();
                    const ruPref = prefixes[prefix] || prefix;
                    ru = ruPref + ' ' + ruForm + ' ' + baseRuName;
                    en = enFormName + ' ' + enBase;
                    matched = true;
                    break;
                }
            }
        }
    }

    // Fallback if no specific pattern matched but we have FormName
    if (!matched) {
        ru = baseRuName + ' (' + enFormName + ')';
        if (!lowerForm.includes(lowerBase)) {
            en = enFormName + ' ' + enBase;
        }
    }

    return { ru, en };
}

/**
 * Opens the Pokémon dossier modal
 */
function openPokemonDossier(pkId, isShiny = false, formIndex = null) {
    if (!pkId) return;

    // Поддержка "ID_FORM" формата
    if (typeof pkId === 'string' && pkId.includes('_')) {
        const parts = pkId.split('_');
        pkId = parts[0];
        formIndex = parts[1] === 'null' ? null : parseInt(parts[1], 10);
    }
    if (typeof pokemonDB === 'undefined' || typeof pokemonRuData === 'undefined') {
        console.error('Core data (pokemonDB/pokemonRuData) not loaded');
        return;
    }

    let pk = pokemonDB[pkId];
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

    let natId = ruData ? ruData.NationalId : parseInt(pkId);
    let numStr = (natId || pkId).toString().replace(/^0+/, '');

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
    let enName = speciesKey || (pk && pk.en) || pkId;

    // --- FORM OVERRIDES ---
    let forms = [];
    if (typeof formsBySpecies !== 'undefined') {
        // Ищем формы по speciesKey (EN name, напр. "VENUSAUR")
        forms = formsBySpecies[speciesKey] || formsBySpecies[enName.toUpperCase()] || [];
    }

    let activeForm = null;
    // Делаем pk мутабельным для формы
    let pkMut = pk ? { ...pk } : null;
    if (formIndex !== null && forms[formIndex]) {
        activeForm = forms[formIndex];

        ruData = ruData ? { ...ruData } : {};
        if (activeForm.BaseStats) ruData.BaseStats = activeForm.BaseStats;
        if (activeForm.Types) ruData.Types = activeForm.Types.split(',').map(t => t.trim().toLowerCase());
        if (activeForm.Weight) ruData.Weight = activeForm.Weight;
        if (activeForm.Height) ruData.Height = activeForm.Height;
        if (activeForm.Abilities) ruData.Abilities = activeForm.Abilities;
        if (activeForm.HiddenAbilities) ruData.HiddenAbilities = activeForm.HiddenAbilities;
        if (activeForm.Format) ruData.Format = activeForm.Format;
        if (activeForm.Pokedex) ruData.Pokedex = activeForm.Pokedex;
        if (activeForm.PowerCategory != null) ruData.PowerCategory = activeForm.PowerCategory;
        if (activeForm.FormName) {
            const translated = window.translateFormName(activeForm.FormName, ruName, enName);
            ruName = translated.ru;
            enName = translated.en;
        }

        if (activeForm.Types && pkMut) {
            pkMut.type = activeForm.Types.split(',').map(t => t.toLowerCase().trim());
        }
    }
    // Используем pkMut вместо pk далее
    pk = pkMut;

    // Sprite path
    const isInPages = window.location.pathname.includes('/pages/');
    let spritePath = '';
    if (activeForm) {
        spritePath = isShiny ? activeForm.ShinySpritePath : activeForm.SpritePath;
        if (spritePath) {
            if (isInPages && spritePath.startsWith('shared/assets/')) {
                spritePath = '../' + spritePath.replace('shared/assets/', '');
            } else if (!isInPages && spritePath.startsWith('shared/assets/')) {
                spritePath = spritePath.replace('shared/assets/', '');
            }
        }
    }
    if (!spritePath) {
        spritePath = (isInPages ? '../' : '') + `home/${isShiny ? 'shiny/' : ''}${natId}.png`;
    }

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
        const nameRu = typeNamesRu[tLow] || (t.charAt(0).toUpperCase() + t.slice(1).toLowerCase());
        const lightBackgroundTypes = ['electric', 'fairy', 'normal'];
        const textColor = lightBackgroundTypes.includes(tLow) ? '#000' : '#fff';
        const iconShadow = 'filter: drop-shadow(0 0 1px rgba(255,255,255,0.8))';
        return `<span class="dossier-type-badge" style="background:${color}; color:${textColor}"><span style="${iconShadow}">${icon}</span> ${nameRu}</span>`;
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
            <div class="dossier-section-content">
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
            </div>
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
            <div class="dossier-section-content">
                ${Object.entries(byReg).map(([reg, locs]) => `
                    <div class="habitat-region" style="margin-top:10px; padding:15px; background:rgba(40,40,80,0.4); border-radius:10px; border: 1px solid rgba(255,255,255,0.05);">
                        <div style="color:var(--primary); font-size:0.9rem; margin-bottom:10px; font-weight:bold; display:flex; align-items:center; gap:8px;">
                            <i class="fas fa-map-marker-alt" style="font-size:0.8rem;"></i> ${regionNames[reg] || reg}
                        </div>
                        <div style="display:grid; gap:8px;">
                            ${locs.map(l => `
                                <div class="habitat-loc" style="padding:10px; background:rgba(255,255,255,0.05); border-radius:8px; border-left:3px solid var(--primary); font-size:0.85rem; display:flex; justify-content:space-between; align-items:center;">
                                    <div>
                                        <div style="color:white; font-weight:bold;">${l.ru_name || l.name}</div>
                                        <div style="color:var(--text-muted); font-size:0.8rem;">
                                            Ур. ${l.info.min_level}-${l.info.max_level} • ${l.info.rarity === 0 ? 'О' : 'Р' + l.info.rarity} ${l.info.conditions ? '⏰' : ''}
                                        </div>
                                    </div>
                                </div>`).join('')}
                        </div>
                    </div>`).join('')}
            </div>
        </div>`;
    } else {
        // Check for ancestors
        const ancestors = getAllAncestors(pkId);
        let ancestorsHtml = '';
        let message = '';
        let color = 'var(--primary)';
        let bg = 'rgba(255,255,255,0.05)';

        // Check if pk or any ancestor is starter/legendary
        let isStarter = pk && pk.is_starter;
        let isLegend = (pk && pk.is_legendary) || (pk && pk.rarity && pk.rarity >= 8);
        if (ancestors.length > 0) {
            ancestors.forEach(anc => {
                if (anc.is_starter) isStarter = true;
                if (anc.is_legendary || (anc.rarity && anc.rarity >= 8)) isLegend = true;
            });
        }

        if (ancestors.length > 0) {
            let specialText = '';
            if (isStarter) specialText = ' (<b>Стартовый</b>)';
            else if (isLegend) specialText = ' (<b>Легендарный</b>)';
            
            message = `Покемон <b>${enName}</b> (<i>${ruName}</i>)${specialText} не встречается в дикой природе. Вы можете эволюционировать его из предыдущих форм:`;
            color = 'var(--accent)';
            bg = 'rgba(255,107,107,0.1)';
        } else {
            if (isStarter) {
                message = `Покемон <b>${enName}</b> (<i>${ruName}</i>) является <b>стартовым</b> и в дикой природе не встречается. Его можно получить из <b>🎁 Коробки со стартовиком</b>.`;
                color = '#FFD700';
                bg = 'rgba(255,215,0,0.1)';
            } else {
                if (isLegend) {
                    message = `Покемон <b>${enName}</b> (<i>${ruName}</i>) является <b>легендарным</b> и не имеет конкретного места обитания.`;
                    color = 'var(--primary)';
                    bg = 'rgba(78,205,196,0.1)';
                } else {
                    message = `Покемон <b>${enName}</b> (<i>${ruName}</i>) не встречается в дикой природе.`;
                }
            }
        }

        ancestorsHtml = `<div class="dossier-section">
            <div class="dossier-section-title">📍 Среда обитания</div>
            <div class="dossier-section-content">
                <div style="padding:15px; border-left:5px solid ${color}; background:${bg}; border-radius:10px; margin-bottom:20px; line-height:1.5; font-size:14px;">
                    ${message}
                </div>`;

        if (ancestors.length > 0) {
            ancestors.forEach((anc, idx) => {
                const ancHabitats = findHabitatForDossier(anc.en);
                const ancRuName = anc.ru || anc.en;

                if (ancHabitats.length > 0) {
                    const byReg = {};
                    ancHabitats.forEach(l => { if (!byReg[l.region]) byReg[l.region] = []; byReg[l.region].push(l); });

                    ancestorsHtml += `
                    <div class="ancestor-habitat-box" style="margin-bottom:12px;">
                        <button class="anc-toggle-btn" onclick="toggleAncestorHabitat('anc${idx}')" style="width:100%; text-align:left; padding:12px 15px; background:rgba(255, 107, 107, 0.05); border:2px solid rgba(255, 107, 107, 0.6); border-radius:10px; color:white; cursor:pointer; font-size:14px; font-weight:bold; display:flex; justify-content:space-between; align-items:center; transition: all 0.3s ease; box-shadow: 0 0 15px rgba(255, 107, 107, 0.2);">
                            <span><i class="fas fa-paw"></i> Посмотреть место жительства <b>${ancRuName}</b></span>
                            <i class="fas fa-chevron-down" id="ancIcon${idx}"></i>
                        </button>
                        <div id="anc${idx}" class="anc-habitat-list" style="display:none; margin-top:10px; animation: fadeIn 0.3s ease;">
                            ${Object.entries(byReg).map(([reg, locs]) => `
                                <div class="habitat-region" style="margin-top:10px; padding:15px; background:rgba(40,40,80,0.4); border-radius:10px; border: 1px solid rgba(255,255,255,0.05);">
                                    <div style="color:var(--primary); font-size:0.9rem; margin-bottom:10px; font-weight:bold; display:flex; align-items:center; gap:8px;">
                                        <i class="fas fa-map-marker-alt" style="font-size:0.8rem;"></i> ${regionNames[reg] || reg}
                                    </div>
                                    <div style="display:grid; gap:8px;">
                                        ${locs.map(l => `
                                            <div class="habitat-loc" style="padding:10px; background:rgba(255,255,255,0.05); border-radius:8px; border-left:3px solid var(--accent); font-size:0.85rem; display:flex; justify-content:space-between; align-items:center;">
                                                <div>
                                                    <div style="color:white; font-weight:bold;">${l.ru_name || l.name}</div>
                                                    <div style="color:var(--text-muted); font-size:0.8rem;">
                                                        Ур. ${l.info.min_level}-${l.info.max_level} • ${l.info.rarity === 0 ? 'О' : 'Р' + l.info.rarity} ${l.info.conditions ? '⏰' : ''}
                                                    </div>
                                                </div>
                                            </div>`).join('')}
                                    </div>
                                </div>`).join('')}
                        </div>
                    </div>`;
                } else {
                    ancestorsHtml += `
                    <div style="padding:10px; background:rgba(255,255,255,0.05); border-radius:8px; margin-bottom:10px; font-size:13px; color:var(--text-muted);">
                        🛑 <b>${ancRuName}</b> также не встречается в дикой природе.
                    </div>`;
                }
            });
        }
        ancestorsHtml += `</div></div>`;
        habitatHtml = ancestorsHtml;
    }

    // --- PROFESSIONS ---
    let profHtml = '';
    if (typeof profAffinityData !== 'undefined' && typeof professionsData !== 'undefined') {
        // NEW: Get all professions from AptitudePool
        const pool = (ruData && ruData.AptitudePool) || [];
        const finalProfs = {};
        const capsSpeciesKey = (speciesKey || "").toUpperCase();
        const capsEnName = (enName || "").toUpperCase();
        const upperTypes = (types || []).map(t => t.toUpperCase().trim());

        // 1. Initialize from pool
        pool.forEach(profId => {
            const p = professionsData[profId];
            if (p) finalProfs[profId] = { name: p.ru_name, bonuses: [] };
        });

        // 2. Find all matching affinities and map bonuses to pool
        for (const affKey in profAffinityData) {
            const aff = profAffinityData[affKey];
            if (!aff.bonuses || !aff.conditions) continue;

            let matched = false;
            if (aff.conditions.types && upperTypes.some(t => aff.conditions.types.includes(t))) matched = true;
            if (!matched && aff.conditions.species && (aff.conditions.species.includes(capsSpeciesKey) || aff.conditions.species.includes(capsEnName))) matched = true;
            if (!matched && aff.conditions.abilities) {
                const allAbs = [...abilitiesArr, ...hiddenArr].map(a => a.toUpperCase());
                if (aff.conditions.abilities.some(a => allAbs.includes(a.toUpperCase()))) matched = true;
            }
            if (!matched && aff.conditions.shapes && (ruData.Shape || pk.Shape) && aff.conditions.shapes.includes((ruData.Shape || pk.Shape).toUpperCase())) matched = true;

            if (matched) {
                for (const b of aff.bonuses) {
                    if (finalProfs[b.profession]) {
                        let pct = b.value ? Math.round((b.value - 1) * 100) : 0;
                        if (isShiny) pct += 10;
                        finalProfs[b.profession].bonuses.push(`${aff.ru_name || affKey}: +${pct}%`);
                    }
                }
            }
        }

        const entries = Object.values(finalProfs);

        if (isShiny) {
            entries.forEach(p => {
                if (p.bonuses.length === 0) {
                    p.bonuses.push('Шайни: +10%');
                }
            });
        }

        if (entries.length > 0) {
            profHtml = `<div class="dossier-section dossier-prof-section">
                <div class="dossier-section-title">🧑‍🔧 Профессии и Сродство</div>
                <div class="dossier-section-content">
                    ${entries.map(p => `
                        <div class="prof-item ${!p.bonuses.length ? 'no-bonus' : ''}">
                            <div class="prof-name">
                                <span>${p.name}</span>
                                ${!p.bonuses.length ? '<span class="prof-no-bonus-tag">(Бонусов нет)</span>' : ''}
                            </div>
                            ${p.bonuses.map(b => `<div class="prof-bonus">• ${b}</div>`).join('')}
                        </div>
                    `).join('')}
                    <div class="prof-note">
                        💡 Бонусы к профессиям зависят от типа, вида, способностей и формы покемона.
                    </div>
                </div>
            </div>`;
        }
    }

    // --- FORMS ---
    let formsHtml = '';
    if (forms.length > 0) {
        let optionsHtml = `<button class="form-option-btn ${formIndex === null ? 'active' : ''}" onclick="openPokemonDossier('${pkId}', ${isShiny}, null)">Основная форма</button>`;
        forms.forEach((f, i) => {
            const fName = f.FormName || f._FormName || `Форма ${i + 1}`;
            optionsHtml += `<button class="form-option-btn ${formIndex === i ? 'active' : ''}" onclick="openPokemonDossier('${pkId}', ${isShiny}, ${i})">${fName}</button>`;
        });

        formsHtml = `
            <div class="form-selector-container" tabindex="0">
                <button class="form-toggle-btn">
                    <i class="fas fa-magic"></i> ФОРМЫ
                </button>
                <div class="form-dropdown-menu">
                    ${optionsHtml}
                </div>
            </div>
        `;
    }

    // ===== RENDER =====
    let overlay = document.getElementById('dossierOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'dossier-overlay';
        overlay.id = 'dossierOverlay';
        overlay.style.zIndex = '999999';
        document.body.appendChild(overlay);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) closeDossier(); });
    }

    overlay.innerHTML = `
        <div class="dossier-card">
            <div class="dossier-controls">
                ${prevId ? `<button class="dossier-nav-btn dossier-prev" onclick="openPokemonDossier('${prevId}', ${isShiny})" title="Предыдущий (#${natId - 1})"><i class="fas fa-chevron-left"></i></button>` : ''}
                <button class="dossier-close" onclick="closeDossier()"><i class="fas fa-times"></i></button>
                ${nextId ? `<button class="dossier-nav-btn dossier-next" onclick="openPokemonDossier('${nextId}', ${isShiny})" title="Следующий (#${natId + 1})"><i class="fas fa-chevron-right"></i></button>` : ''}
            </div>
            <div class="dossier-top">
                <div class="dossier-portrait">
                    <div class="dossier-portrait-frame">
                        <div class="dossier-num">#${numStr}</div>
                        <img src="${spritePath}" alt="${enName}" onerror="this.src='${isInPages ? '../' : ''}home/0.png'">
                    </div>
                    <div class="dossier-name-block">
                        <div class="ru">${isShiny ? `⭐️${ruName}⭐️` : ruName}</div>
                        <div class="en">${isShiny ? `⭐️${enName}⭐️` : enName}</div>
                    </div>
                    <div class="dossier-types">${typesHtml}</div>
                    ${tierDisplay ? `<div class="dossier-tier">🏆 Тир: ${tierDisplay}</div>` : ''}
                    <div class="shiny-toggle-container">
                        ${isShiny ?
            `<button class="shiny-toggle is-shiny" onclick="openPokemonDossier('${pkId}', false, ${formIndex})"><i class="fas fa-star"></i> ОБЫЧНЫЙ</button>` :
            `<button class="shiny-toggle is-normal" onclick="openPokemonDossier('${pkId}', true, ${formIndex})"><i class="fas fa-star"></i> ШАЙНИ</button>`
        }
                        ${formsHtml}
                    </div>
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
    // Deprecated. Now using openPokemonDossier directly.
    openPokemonDossier(String(speciesId), false, formIndex);
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
