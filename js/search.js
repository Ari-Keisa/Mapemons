// ==========================================
// Mapémon Search Engine & Statistics Core
// Created by Ari San
// ==========================================

// 1. ЛОВЕЦ ОШИБОК
window.onerror = function (msg, url, line) {
    // Игнорируем ошибки от встроенных скриптов (например, ложные ошибки от Telegram WebView)
    if (msg === 'Script error.' && line === 0) return true;

    const box = document.getElementById('pokemonResultsContent');
    const cont = document.getElementById('pokemonResultsContainer');
    if (box && cont) {
        cont.style.display = 'flex';
        box.innerHTML = `<div style="color:#ff6b6b; padding:15px; border:2px solid red; background:rgba(0,0,0,0.9); border-radius:10px;">
            <h3 style="margin-top:0;">💥 КРИТИЧЕСКАЯ ОШИБКА:</h3>
            <p>${msg}</p>
            <small>Скорее всего, пропущена запятая в JSON файле (строка ${line})</small>
        </div>`;
    }
    return false;
};

// === ГЛОБАЛЬНЫЙ СТЕЙТ ДЛЯ ШАЙНИ И ПОЛЗУНКА ===
window.isShinyToggleActive = false;
window.isHiddenAbilitySearch = false; // Default OFF
window.currentSliderState = 0;

window.toggleShinySearch = function(e) {
    if (e) e.stopPropagation();
    window.isShinyToggleActive = !window.isShinyToggleActive;
    const isShiny = window.isShinyToggleActive;

    const btn = document.getElementById('shinyToggleButton');
    if (btn) {
        btn.style.background = isShiny ? 'rgba(78, 205, 196, 0.2)' : 'rgba(255,255,255,0.05)';
        btn.style.border = `1px solid ${isShiny ? 'var(--primary)' : 'rgba(255,255,255,0.1)'}`;
        btn.style.boxShadow = isShiny ? '0 0 10px rgba(78, 205, 196, 0.5)' : 'none';
        const icon = btn.querySelector('i');
        if (icon) icon.style.color = isShiny ? 'var(--primary)' : '#aaa';
    }

    const cards = document.querySelectorAll('.poke-trading-card');
    cards.forEach(card => {
        const isInPages = card.getAttribute('data-inpages') === 'true';
        const isForm = card.getAttribute('data-isform') === 'true';
        const rawEn = card.getAttribute('data-en');
        const rawRu = card.getAttribute('data-ru');
        const mId = card.getAttribute('data-id');
        const normalSprite = card.getAttribute('data-sprite');
        const shinySprite = card.getAttribute('data-shinysprite');
        
        const img = card.querySelector('.poke-card-img');
        if (img) {
            if (isForm && (normalSprite || shinySprite)) {
                let sPath = isShiny ? shinySprite : normalSprite;
                if (sPath) {
                    if (isInPages && sPath.startsWith('shared/assets/')) sPath = '../' + sPath.replace('shared/assets/', '');
                    else if (!isInPages && sPath.startsWith('shared/assets/')) sPath = sPath.replace('shared/assets/', '');
                    img.src = sPath;
                } else {
                    img.src = `${isInPages ? '../' : ''}home/${isShiny ? 'shiny/' : ''}${parseInt(mId)}.png`;
                }
            } else {
                img.src = `${isInPages ? '../' : ''}home/${isShiny ? 'shiny/' : ''}${parseInt(mId)}.png`;
            }
        }
        
        const ruDiv = card.querySelector('.poke-card-name-ru');
        if (ruDiv) {
            ruDiv.textContent = isShiny ? `⭐️${rawRu}⭐️` : rawRu;
        }
        
        const enDiv = card.querySelector('.poke-card-name-en');
        if (enDiv) {
            // Un-uppercase the EN name for display purposes to match original behavior loosely, or just show as is
            const displayEn = rawEn.charAt(0) + rawEn.slice(1).toLowerCase();
            enDiv.textContent = isShiny ? `⭐️${displayEn}⭐️` : displayEn;
        }
        const textRuObj = document.getElementById('dex-stats-ru');
        if (textRuObj && rawRu) {
            textRuObj.innerHTML = isShiny ? `⭐️${rawRu}⭐️` : rawRu;
        }
    });
};

window.toggleHiddenAbilitySearch = function(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    window.isHiddenAbilitySearch = !window.isHiddenAbilitySearch;
    const btn = document.getElementById('hiddenAbilityToggleButton');
    if (btn) {
        const isHidden = window.isHiddenAbilitySearch;
        btn.style.background = isHidden ? 'rgba(78, 205, 196, 0.2)' : 'rgba(255,255,255,0.05)';
        btn.style.border = `1px solid ${isHidden ? 'var(--primary)' : 'rgba(255,255,255,0.1)'}`;
        btn.style.boxShadow = isHidden ? '0 0 10px rgba(78, 205, 196, 0.5)' : 'none';
        const icon = btn.querySelector('i');
        if (icon) icon.style.color = isHidden ? 'var(--primary)' : '#aaa';
    }
    
    // Перезапуск поиска
    const input = document.getElementById('pokemonSearch');
    if (input && input.value.trim().length > 0) {
        const btnSearch = document.getElementById('searchButton');
        if (btnSearch) btnSearch.click();
    }
};

// ==========================================
// ГЛОБАЛЬНЫЕ ФУНКЦИИ (Перенесены в dossier.js)
// ==========================================

document.addEventListener('DOMContentLoaded', function () {
    // === ЭЛЕМЕНТЫ ===
    const els = {
        btn: document.getElementById('searchButton'),
        input: document.getElementById('pokemonSearch'),
        container: document.getElementById('pokemonResultsContainer'),
        content: document.getElementById('pokemonResultsContent'),
        title: document.getElementById('pokemonResultTitle'),
        close: document.getElementById('closeResultsBtn'),
        overlay: document.getElementById('modalOverlay'),
        opts: document.querySelectorAll('.search-option'),
        box: document.getElementById('searchBox'),
        centers: document.getElementById('centersList'),
        hint: document.getElementById('searchHint'),
        // СТАТИСТИКА
        statLocs: document.getElementById('locationCount'),
        statPoks: document.getElementById('pokemonCount'),
        statRegs: document.getElementById('regionCount')
    };

    // Проверка: Если на странице нет поиска, скрипт не должен ломаться
    // (например, если мы подключим его на страницу, где только карта)
    if (!els.input) {
        // Если поиска нет, пробуем хотя бы обновить статистику, если она есть
        if (els.statPoks) initStatsOnly();
        return;
    }

    // === ТЕКСТЫ ПОДСКАЗОК ===
    const hintTexts = {
        'pokemon': 'Например: Pikachu, Charizard, Мьюту, #025, 125',
        'item': 'Например: Чёрный пояс, Уголёк, Амурит, item_996, 996',
        'centers': 'Список локаций, где присутствует Покецентр и Магазин',
        'other': 'Например: Имя_NPC, Тип_покемона, Тир_покемона, Редкость ( О | Р_ ), Способность_покемона, Профессия_покемона, Название_Локации, или допишите название Региона для более конкретного поиска, или добавьте ⭐️ для поиска сразу шайни'
    };

    // === ДАННЫЕ (Экспортируем в глобальную область для dossier.js) ===
    let pokemonDB = null;
    let locationData = null;
    window.pokemonDB = null;
    window.locationData = null;
    window.itemLocationsData = null;
    window.itemsRelationsData = null;
    window.pokemonRuData = null;
    window.professionsData = null;
    window.profAffinityData = null;
    window.formsBySpecies = {};
    window.pokemonNamesUpper = null;
    let searchIndex = {};
    let itemSearchIndex = {};
    let npcSearchIndex = {};

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
    const regionNames = { 'KANTO': 'Канто', 'JOHTO': 'Джото', 'HOENN': 'Хоэнн', 'SINNOH': 'Синно', 'UNOVA': 'Юнова' };

    // === 2. ЗАГРУЗКА ===
    async function loadData() {
        try {
            // Важно: Пути к JSON. Если скрипт в папке js/, нам нужно выйти назад (../) или использовать абсолютный путь.
            const results = await Promise.all([
                fetch('json/pokemon_names.json?v=' + new Date().getTime()),
                fetch('json/locations.json?v=' + new Date().getTime()),
                fetch('json/pokemon_ru.json?v=' + new Date().getTime()),
                fetch('json/professions.json?v=' + new Date().getTime()),
                fetch('json/profession_affinity.json?v=' + new Date().getTime()),
                fetch('json/pokemon_forms_ru.json?v=' + new Date().getTime()),
                fetch('json/pokemon_names_upper.json?v=' + new Date().getTime()).catch(() => ({ ok: false })),
                fetch('json/item.json?v=' + new Date().getTime()).catch(() => ({ok: false})),
                fetch('json/items.json?v=' + new Date().getTime()).catch(() => ({ok: false})),
                fetch('json/emoji_combos.json?v=' + new Date().getTime()).catch(() => ({ok: false})),
                fetch('json/item_locations.json?v=' + new Date().getTime()).catch(() => ({ok: false})),
                fetch('json/items_relations.json?v=' + new Date().getTime()).catch(() => ({ok: false})),
                fetch('json/npcs.json?v=' + new Date().getTime()).catch(() => ({ok: false})),
                fetch('json/abilities.json?v=' + new Date().getTime()).catch(() => ({ok: false}))
            ]);

            const [
                pRes, lRes, ruRes, prRes, affRes, fRes, uRes,
                itemLegacyRes, itemsRes, comboRes, itemLocsRes, relRes, npcRes, abRes
            ] = results;

            if (!pRes.ok) throw new Error(`pokemon_names.json не найден`);
            if (!lRes.ok) throw new Error(`locations.json не найден`);

            pokemonDB = (await pRes.json()).pokemon || (await pRes.json());
            locationData = await lRes.json();
            window.pokemonDB = pokemonDB;
            window.locationData = locationData;
            window.pokemonRuData = await ruRes.json();
            window.professionsData = await prRes.json();
            window.profAffinityData = await affRes.json();
            if (abRes && abRes.ok) window.abilitiesData = await abRes.json();
            const formsRaw = await fRes.json();
            if (uRes && uRes.ok) {
                const rawUpper = await uRes.json();
                window.pokemonNamesUpper = rawUpper.pokemon || rawUpper;
            }
            if (itemsRes && itemsRes.ok) window.itemsData = await itemsRes.json();

            // Экспортируем функцию расчета эффективности профессий для повсеместного использования
            window.calculateProfessionEfficiency = function(pk, formObj, professionId, abilitiesData) {
                if (!window.profAffinityData) return [];
                let types = [];
                if (formObj && formObj.Types) {
                    types = Array.isArray(formObj.Types) 
                        ? formObj.Types.map(t=>t.trim().toUpperCase()) 
                        : formObj.Types.split(',').map(t=>t.trim().toUpperCase());
                } else {
                    types = (pk.type || []).map(t=>t.toUpperCase());
                }

                let speciesKey = pk.en.toUpperCase();
                let ruEntry = window.pokemonRuData ? window.pokemonRuData[speciesKey] : null;
                
                let baseAbilities = [];
                if (formObj) {
                    if (formObj.Abilities) {
                        let ab = Array.isArray(formObj.Abilities) ? formObj.Abilities : formObj.Abilities.split(',').map(a=>a.trim());
                        baseAbilities.push(...ab);
                    }
                    if (formObj.HiddenAbilities) {
                        let hab = Array.isArray(formObj.HiddenAbilities) ? formObj.HiddenAbilities : formObj.HiddenAbilities.split(',').map(a=>a.trim());
                        baseAbilities.push(...hab);
                    }
                } else if (ruEntry) {
                    if (ruEntry.Abilities) {
                        let ab = Array.isArray(ruEntry.Abilities) ? ruEntry.Abilities : [ruEntry.Abilities];
                        baseAbilities.push(...ab);
                    }
                    if (ruEntry.HiddenAbilities) {
                        let hab = Array.isArray(ruEntry.HiddenAbilities) ? ruEntry.HiddenAbilities : [ruEntry.HiddenAbilities];
                        baseAbilities.push(...hab);
                    }
                }
                
                let uniqueAbilities = [...new Set(baseAbilities)];
                if (uniqueAbilities.length === 0) uniqueAbilities.push(null);
                
                let results = [];
                
                uniqueAbilities.forEach(abil => {
                    let currentTotal = 0;
                    let reasons = [];
                    
                    for (const affKey in window.profAffinityData) {
                        const aff = window.profAffinityData[affKey];
                        if (!aff.bonuses || !aff.conditions) continue;
                        
                        const b = aff.bonuses.find(b => b.profession === professionId);
                        if (!b) continue;
                        
                        let pct = b.value ? Math.round((b.value - 1) * 100) : 0;
                        if (pct === 0) continue;
                        
                        let matched = false;
                        let matchReason = '';
                        
                        if (aff.conditions.types && types.some(t => aff.conditions.types.includes(t))) {
                            matched = true;
                            matchReason = `${aff.ru_name || affKey}`;
                        }
                        if (!matched && aff.conditions.species && aff.conditions.species.includes(speciesKey)) {
                            matched = true;
                            matchReason = `${aff.ru_name || affKey}`;
                        }
                        if (!matched && abil && aff.conditions.abilities && aff.conditions.abilities.some(a => a.toUpperCase() === abil.toUpperCase())) {
                            matched = true;
                            let abilRu = abil;
                            if (abilitiesData) {
                                let abilObj = Object.values(abilitiesData).find(a => a.Name.toUpperCase() === abil.toUpperCase());
                                if (abilObj && abilObj.RuName) abilRu = abilObj.RuName;
                            }
                            matchReason = `Талант: ${abilRu}`;
                        }
                        if (!matched && aff.conditions.shapes && ruEntry && ruEntry.Shape && aff.conditions.shapes.includes(ruEntry.Shape.toUpperCase())) {
                            matched = true;
                            matchReason = `${aff.ru_name || affKey}`;
                        }
                        
                        if (matched) {
                            currentTotal += pct;
                            reasons.push(`${matchReason}: +${pct}%`);
                        }
                    }
                    
                    results.push({
                        ability: abil,
                        total: currentTotal,
                        reasons: reasons
                    });
                });
                
                return results;
            };

            if (itemLegacyRes && itemLegacyRes.ok) {
                const legacyItems = await itemLegacyRes.json();
                if(!window.itemsData) window.itemsData = legacyItems;
            }
            if (itemLocsRes && itemLocsRes.ok) window.itemLocationsData = await itemLocsRes.json();
            if (npcRes && npcRes.ok) {
                window.npcsData = await npcRes.json();
                try {
                    const customNpcRes = await fetch('json/custom_npcs.json?v=' + new Date().getTime());
                    if (customNpcRes.ok) {
                        const customNpcs = await customNpcRes.json();
                        Object.assign(window.npcsData, customNpcs);
                    }
                } catch(e) {
                    console.error('Could not load custom NPCs', e);
                }
            }
            if (relRes && relRes.ok) window.itemsRelationsData = await relRes.json();
            
            window.emojiCombosData = null;
            window.emojiCombosSorted = null;
            if (comboRes && comboRes.ok) {
                const raw = await comboRes.json();
                window.emojiCombosData = {};
                window.emojiCombosSorted = {};
                for (let k in raw) {
                    const cleanKey = k.replace(/\uFE0F/g, '');
                    const path = raw[k];
                    window.emojiCombosData[cleanKey] = path;
                    
                    // Also store sorted version for order-independent lookup
                    const sortedKey = Array.from(cleanKey).sort().join('');
                    window.emojiCombosSorted[sortedKey] = path;
                }
            }

            // Группируем формы по _SpeciesID (JSON — объект {"VENUSAUR-1": {...}, ...})
            if (formsRaw && typeof formsRaw === 'object' && !Array.isArray(formsRaw)) {
                for (const formKey in formsRaw) {
                    const f = formsRaw[formKey];
                    const speciesId = f._SpeciesID || f.SpeciesID;
                    if (!speciesId) continue;
                    f._FormKey = formKey; // сохраняем ключ формы
                    if (!window.formsBySpecies[speciesId]) window.formsBySpecies[speciesId] = [];
                    window.formsBySpecies[speciesId].push(f);
                }
            } else if (Array.isArray(formsRaw)) {
                for (let f of formsRaw) {
                    const speciesId = f._SpeciesID || f.SpeciesID;
                    if (!speciesId) continue;
                    if (!window.formsBySpecies[speciesId]) window.formsBySpecies[speciesId] = [];
                    window.formsBySpecies[speciesId].push(f);
                }
            }

            // Строим индекс
            for (let key in pokemonDB) {
                const p = pokemonDB[key];
                const id = key.toString();
                searchIndex[id] = id;
                searchIndex[parseInt(id).toString()] = id;
                if (p.en) searchIndex[p.en.toLowerCase().trim()] = id;
                if (p.ru) searchIndex[p.ru.toLowerCase().trim()] = id;
            }

            // Индекс предметов
            if (window.itemsData) {
                for (let key in window.itemsData) {
                    const it = window.itemsData[key];
                    if (it.num_id) {
                        itemSearchIndex[it.num_id.toString()] = key;
                    }
                    if (it.RuName) {
                        const rLow = it.RuName.toLowerCase().trim().replace(/тм/g, 'tm').replace(/нм/g, 'hm');
                        itemSearchIndex[rLow] = key;
                        itemSearchIndex[rLow.replace(/\s+/g, '')] = key;
                        const norm = str => str.toLowerCase().replace(/ё/g, 'е').replace(/тм/g, 'tm').replace(/нм/g, 'hm').replace(/[^а-яa-z0-9]/g, '');
                        itemSearchIndex[norm(it.RuName)] = key;
                    }
                    if (it.Name) {
                        const nLow = it.Name.toLowerCase().trim().replace(/тм/g, 'tm').replace(/нм/g, 'hm');
                        itemSearchIndex[nLow] = key;
                        itemSearchIndex[nLow.replace(/\s+/g, '')] = key;
                        const norm = str => str.toLowerCase().replace(/ё/g, 'е').replace(/тм/g, 'tm').replace(/нм/g, 'hm').replace(/[^а-яa-z0-9]/g, '');
                        itemSearchIndex[norm(it.Name)] = key;
                    }
                }
            }
            
            // Индекс NPC
            if (window.npcsData) {
                for (let key in window.npcsData) {
                    const n = window.npcsData[key];
                    if (n.ru_name) {
                        const rLow = n.ru_name.toLowerCase().trim();
                        if (!npcSearchIndex[rLow]) npcSearchIndex[rLow] = [];
                        npcSearchIndex[rLow].push({ ...n, name: n.ru_name, locId: n.location_id });
                    }
                }
            }

            // Добавляем формы в поисковый индекс
            for (const speciesId in window.formsBySpecies) {
                // Находим ID покемона в pokemonDB по speciesId (EN name)
                let baseId = null;
                for (let key in pokemonDB) {
                    if (pokemonDB[key].en && pokemonDB[key].en.toUpperCase() === speciesId.toUpperCase()) {
                        baseId = key;
                        break;
                    }
                }
                if (!baseId) continue;

                const forms = window.formsBySpecies[speciesId];
                forms.forEach((f, idx) => {
                    const formName = f.FormName || '';
                    if (formName) {
                        const formSearchId = baseId + '_' + idx;
                        const baseRu = pokemonDB[baseId].ru || '';
                        const baseEn = pokemonDB[baseId].en || '';
                        
                        // Используем глобальную функцию из dossier.js если она доступна
                        // Она вернет объект {ru: "Мега-Венузавр", en: "Mega Venusaur"}
                        let translated = { ru: baseRu + ' (' + formName + ')', en: formName };
                        if (typeof translateFormName === 'function') {
                            translated = translateFormName(formName, baseRu, baseEn);
                        }

                        // 1. Основные имена (EN/RU)
                        const enLow = translated.en.toLowerCase().trim();
                        const ruLow = translated.ru.toLowerCase().trim();
                        searchIndex[enLow] = formSearchId;
                        searchIndex[ruLow] = formSearchId;

                        // 2. Варианты без дефисов и скобок (напр. "Раттата Алола" вместо "Раттата (Алола)")
                        const enClean = enLow.replace(/[()\-]/g, ' ').replace(/\s+/g, ' ').trim();
                        const ruClean = ruLow.replace(/[()\-]/g, ' ').replace(/\s+/g, ' ').trim();
                        searchIndex[enClean] = formSearchId;
                        searchIndex[ruClean] = formSearchId;

                        // 2.1. Варианты без пробелов (напр. "MegaVenusaur", "МегаВенузавр")
                        const enSpaceless = enClean.replace(/\s+/g, '');
                        const ruSpaceless = ruClean.replace(/\s+/g, '');
                        if (enSpaceless !== enClean) searchIndex[enSpaceless] = formSearchId;
                        if (ruSpaceless !== ruClean) searchIndex[ruSpaceless] = formSearchId;

                        // 3. Обратные варианты (напр. "Алола Раттата", "Венузавр Мега")
                        // Для EN
                        if (enClean.includes(' ')) {
                            const p = enClean.split(' ');
                            if (p.length === 2) searchIndex[p[1] + ' ' + p[0]] = formSearchId;
                        }
                        // Для RU
                        if (ruClean.includes(' ')) {
                            const p = ruClean.split(' ');
                            if (p.length === 2) searchIndex[p[1] + ' ' + p[0]] = formSearchId;
                            // Если три слова (Мега Венузавр X), пробуем варианты
                            if (p.length === 3) {
                                searchIndex[p[1] + ' ' + p[2] + ' ' + p[0]] = formSearchId; // Венузавр X Мега
                                searchIndex[p[1] + ' ' + p[0] + ' ' + p[2]] = formSearchId; // Венузавр Мега X
                            }
                        }

                        // 4. Специфично для Megas (обратная совместимость и доп. варианты)
                        if (formName.toLowerCase().startsWith('mega ')) {
                            searchIndex[(baseEn + ' mega').toLowerCase()] = formSearchId;
                            searchIndex[(baseRu + ' мега').toLowerCase()] = formSearchId;
                            
                            // Варианты с дефисом после Мега
                            const enMegaHyphen = enClean.replace('mega ', 'mega-');
                            const ruMegaHyphen = ruClean.replace('мега ', 'мега-');
                            searchIndex[enMegaHyphen] = formSearchId;
                            searchIndex[ruMegaHyphen] = formSearchId;
                        }

                        // 5. Raw formName для совместимости
                        searchIndex[formName.toLowerCase().trim()] = formSearchId;
                    }
                });
            }

            console.log('База готова! Формы:', Object.keys(window.formsBySpecies).length);

            // !!! ЗАПУСК ПОДСЧЕТА !!!
            updateStats();

            buildServiceLists();

            if (els.hint) els.hint.textContent = hintTexts['pokemon'];

        } catch (e) {
            console.error(e);
            throw e;
        }
    }

    // Специальная функция загрузки только для статистики (если нет поиска)
    async function initStatsOnly() {
        try {
            const [pRes, lRes] = await Promise.all([
                fetch('json/pokemon_names.json?v=' + new Date().getTime()),
                fetch('json/locations.json?v=' + new Date().getTime())
            ]);
            const rawP = await pRes.json();
            locationData = await lRes.json();
            pokemonDB = rawP.pokemon ? rawP.pokemon : rawP;
            updateStats();
        } catch (e) { console.error(e); }
    }

    loadData();

    // Функция подсчета и анимации
    function updateStats() {
        if (!pokemonDB || !locationData) return;
        if (!els.statPoks) return; // Если на странице нет счетчиков, выходим

        const totalPokemons = Object.keys(pokemonDB).length;
        const totalLocations = Object.keys(locationData).length;
        const totalRegions = 5;

        // Расчет форм 
        let totalForms = 0;
        if (window.formsBySpecies) {
            for (const speciesId in window.formsBySpecies) {
                totalForms += window.formsBySpecies[speciesId].length;
            }
        }

        // Подсчет уникальных покемонов в локациях
        const uniqueEncounters = new Set();
        for (const locId in locationData) {
            const loc = locationData[locId];
            if (loc.encounters && Array.isArray(loc.encounters)) {
                loc.encounters.forEach(e => {
                    if (e.species) uniqueEncounters.add(e.species.toUpperCase().trim());
                });
            }
        }
        const totalInLocations = uniqueEncounters.size;

        // Итоговая сумма покемонов (покемоны + формы + меги)
        const combinedPokemons = totalPokemons + totalForms;

        animateValue(els.statPoks, 0, combinedPokemons, 2000);
        animateValue(els.statLocs, 0, totalLocations, 1500);
        animateValue(els.statRegs, 0, totalRegions, 1000);

        // Обновление скрытых счетчиков, если они существуют
        const basePokeSpan = document.getElementById('basePokeCount');
        if (basePokeSpan) animateValue(basePokeSpan, 0, totalPokemons, 1500);
        
        const formPokeSpan = document.getElementById('formPokeCount');
        if (formPokeSpan) animateValue(formPokeSpan, 0, totalForms, 1500);
        
        const locPokeSpan = document.getElementById('locPokeCount');
        if (locPokeSpan) animateValue(locPokeSpan, 0, totalInLocations, 1500);

        // Обновление статистики по отдельным регионам
        const regionStats = {};
        for (const locId in locationData) {
            const loc = locationData[locId];
            const reg = loc.region ? loc.region.toUpperCase() : null;
            if (!reg) continue;

            if (!regionStats[reg]) {
                regionStats[reg] = { locs: 0, pokes: new Set() };
            }

            regionStats[reg].locs++;

            if (loc.encounters && Array.isArray(loc.encounters)) {
                loc.encounters.forEach(e => {
                    if (e.species) regionStats[reg].pokes.add(e.species.toUpperCase().trim());
                });
            }
        }

        const pluralPlc = ['локация', 'локации', 'локаций'];
        const pluralPok = ['покемон', 'покемона', 'покемонов'];
        function getPl(n, w) { return w[(n % 100 > 4 && n % 100 < 20) ? 2 : [2, 0, 1, 1, 1, 2][Math.min(n % 10, 5)]]; }

        const regsLayout = {
            'KANTO': 'kanto',
            'JOHTO': 'johto',
            'HOENN': 'hoenn',
            'SINNOH': 'sinnoh',
            'UNOVA': 'unova'
        };

        for (const [R, pref] of Object.entries(regsLayout)) {
            const s = regionStats[R];
            const lCount = s ? s.locs : 0;
            const pCount = s ? s.pokes.size : 0;

            const elLoc = document.getElementById(pref + '-loc-stat');
            if (elLoc) elLoc.innerText = lCount + ' ' + getPl(lCount, pluralPlc);

            const elPok = document.getElementById(pref + '-poke-stat');
            if (elPok) elPok.innerText = pCount + ' ' + getPl(pCount, pluralPok);
        }
    }

    function animateValue(obj, start, end, duration) {
        if (!obj) return;
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = Math.floor(progress * (end - start) + start);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                obj.innerHTML = end;
            }
        };
        window.requestAnimationFrame(step);
    }

    // === 3. ПОИСК ===
    function startSearch() {
        const rawQuery = els.input.value.trim();
        const activeType = document.querySelector('.search-option.active')?.dataset.type || 'pokemon';

        if (!rawQuery) return;

        if (els.overlay) els.overlay.classList.add('active');
        els.container.style.display = 'flex';
        els.content.innerHTML = '<div class="loading-spinner"></div>';
        els.title.innerHTML = 'Ищем...';

        if (!pokemonDB) {
            renderError("База еще грузится...");
            return;
        }

        window.isShinyToggleActive = rawQuery.includes('⭐️');
        const isShinySearch = window.isShinyToggleActive;
        let cleanQuery = rawQuery.toLowerCase().replace('#', '').replace(/⭐️/g, '').trim();
        cleanQuery = cleanQuery.replace(/тм/g, 'tm').replace(/нм/g, 'hm');

        let isItemSearch = activeType === 'item';
        let foundID = null;

        if (!isItemSearch) {
            foundID = searchIndex[cleanQuery];
        }

        if (isItemSearch) {
            if (!window.itemsRelationsData || !window.locationData) {
                renderError("Данные предметов загружаются...");
                return;
            }
            const norm = str => str.toLowerCase().replace(/ё/g, 'е').replace(/[^а-яa-z0-9]/g, '');
            const normQuery = norm(cleanQuery);
            let foundId = itemSearchIndex[cleanQuery] || itemSearchIndex[cleanQuery.replace(/\s+/g, '')] || itemSearchIndex[normQuery];
            if (!foundId && window.itemsData) {
                const idMatch = cleanQuery.match(/^(?:\/?item_|\/?item\s+)?(\d+)$/);
                if (idMatch) {
                    const idStr = idMatch[1];
                    for (const key in window.itemsData) {
                        if (window.itemsData[key].num_id == idStr || key == idStr) {
                            foundId = key;
                            break;
                        }
                    }
                }
                if (!foundId) {
                    if (window.itemsData[cleanQuery]) foundId = cleanQuery;
                    else if (window.itemsData[cleanQuery.toUpperCase()]) foundId = cleanQuery.toUpperCase();
                    else foundId = window.fuzzyMatchItemKey(cleanQuery, window.itemsData);
                }
            }
            
            let itemObj = window.itemsData && foundId ? window.itemsData[foundId] : null;
            let titleName = itemObj ? itemObj.RuName || itemObj.Name : rawQuery;

            // === EARLY AMBIGUITY CHECK ===
            // If no specific item was identified, check if the query is a generic word
            // that matches multiple items. If so, ask the user to clarify BEFORE
            // proceeding to the items_relations search.
            if (!itemObj && window.itemsData) {
                const matchingItems = [];
                for (const key in window.itemsData) {
                    const it = window.itemsData[key];
                    const ruN = norm(it.RuName || '');
                    const enN = norm(it.Name || '');
                    if ((normQuery.length >= 3 && ruN.includes(normQuery)) ||
                        (normQuery.length >= 3 && enN.includes(normQuery))) {
                        matchingItems.push(it.RuName || it.Name);
                    }
                }
                if (matchingItems.length > 1) {
                    const list = matchingItems.slice(0, 15).map(s => `<b>${s}</b>`).join(', ');
                    const trailing = matchingItems.length > 15 ? ` и ещё ${matchingItems.length - 15}...` : '';
                    els.title.innerHTML = '<i class="fas fa-search"></i> Уточните запрос';
                    els.content.innerHTML = `<div style="text-align:center; padding:30px; color:var(--primary);">
                        Пожалуйста, уточните какой именно <b>${rawQuery}</b> вас интересует?<br><br>
                        <div style="color:#ccc; font-size:0.95em; line-height:2;">Найдено: ${list}${trailing}</div>
                    </div>`;
                    return;
                }
                // If exactly 1 match — use that item as the resolved one
                if (matchingItems.length === 1) {
                    for (const key in window.itemsData) {
                        const it = window.itemsData[key];
                        const ruN = norm(it.RuName || '');
                        const enN = norm(it.Name || '');
                        if ((normQuery.length >= 3 && ruN.includes(normQuery)) ||
                            (normQuery.length >= 3 && enN.includes(normQuery))) {
                            foundId = key;
                            itemObj = it;
                            titleName = it.RuName || it.Name;
                            break;
                        }
                    }
                }
            }

            let targetSearchStrings = [];
            if (itemObj) {
                if (itemObj.RuName) targetSearchStrings.push(norm(itemObj.RuName));
                if (itemObj.Name) targetSearchStrings.push(norm(itemObj.Name));
            }
            targetSearchStrings.push(normQuery);

            const isMatchItem = (itemsArray) => {
                if (!itemsArray) return false;
                // Count how many items in the array match via substring/fuzzy
                // If more than one matches, the query is ambiguous — require exact match only
                let exactMatch = false;
                let fuzzyMatches = 0;

                for (const rawStr of itemsArray) {
                    const cleanRaw = norm(rawStr);
                    for (const tsClean of targetSearchStrings) {
                        if (!tsClean) continue;
                        // Exact match — always valid
                        if (cleanRaw === tsClean) {
                            exactMatch = true;
                            break;
                        }
                        // Substring or fuzzy match — count how many items it hits
                        if (tsClean.length > 3 && (cleanRaw.includes(tsClean) || window.itemSimilarity(cleanRaw, tsClean) > 0.85)) {
                            fuzzyMatches++;
                        }
                    }
                    if (exactMatch) break;
                }

                // If exact match found — always return true
                if (exactMatch) return true;

                // If fuzzy/substring matched exactly 1 item — it's unique enough
                if (fuzzyMatches === 1) return true;

                // If fuzzy/substring matched 0 or multiple items — ambiguous, reject
                return false;
            };

            const rel = window.itemsRelationsData;
            let dropTypes = [];
            let dropPokemons = [];
            let dropNPCs = [];
            let isWildDrop = false;
            let isDiamondDrop = false;

            if (rel.types) {
                for (let type in rel.types) {
                    if (isMatchItem(rel.types[type])) dropTypes.push(type);
                }
            }
            if (rel.pokemon) {
                for (let pk in rel.pokemon) {
                    if (isMatchItem(rel.pokemon[pk])) dropPokemons.push(pk);
                }
            }
            if (rel.wild && isMatchItem(rel.wild)) isWildDrop = true;
            if (rel.npcs) {
                for (let npc in rel.npcs) {
                    if (isMatchItem(rel.npcs[npc])) dropNPCs.push(npc);
                }
            }
            if (rel.diamonds && isMatchItem(rel.diamonds)) isDiamondDrop = true;

            let itemHabitats = [];
            let addedLocs = new Set();

            for (let locId in window.locationData) {
                let loc = window.locationData[locId];
                let addedToLoc = false;
                let sources = [];

                if (loc.encounters && loc.encounters.length > 0) {
                    if (isWildDrop) {
                        sources.push("Дикие покемоны");
                        addedToLoc = true;
                    }

                    loc.encounters.forEach(enc => {
                        let capsSpecies = enc.species;
                        if (dropPokemons.includes(capsSpecies)) {
                            sources.push(capsSpecies);
                            addedToLoc = true;
                        }

                        let pkId = window.pokemonNamesUpper ? window.pokemonNamesUpper[capsSpecies] : null;
                        if (!pkId && window.pokemonRuData && window.pokemonRuData[capsSpecies]) {
                            pkId = String(window.pokemonRuData[capsSpecies].NationalId).padStart(3, '0');
                        }

                        let pk = pkId ? window.pokemonDB[pkId] : null;
                        if (pk && pk.type) {
                            let typeArr = pk.type;
                            if (enc.form > 0 && window.formsBySpecies && window.formsBySpecies[capsSpecies]) {
                                let formObj = window.formsBySpecies[capsSpecies].find(f => f._FormKey === `${capsSpecies}-${enc.form}`);
                                if (!formObj && window.formsBySpecies[capsSpecies].length >= enc.form) {
                                    formObj = window.formsBySpecies[capsSpecies][enc.form - 1];
                                }
                                if (formObj && formObj.Types) {
                                    typeArr = formObj.Types.toLowerCase().split(',').map(t => t.trim());
                                }
                            }
                            typeArr.forEach(t => {
                                if (dropTypes.includes(t.toLowerCase())) {
                                    sources.push(`Покемоны типа ${typeNamesRu[t.toLowerCase()] || t}`);
                                    addedToLoc = true;
                                }
                            });
                        }
                    });
                }

                // Check NPC
                if (window.npcsData) {
                    for (let npcKey in window.npcsData) {
                        let npc = window.npcsData[npcKey];
                        if (npc.location_id === locId && dropNPCs.some(n => npc.ru_name.includes(n))) {
                            sources.push(`NPC: ${npc.ru_name}`);
                            addedToLoc = true;
                        }
                    }
                }

                if (addedToLoc && !addedLocs.has(locId)) {
                    addedLocs.add(locId);
                    itemHabitats.push({
                        ...loc,
                        name: locId,
                        rawItemString: Array.from(new Set(sources)).join(', '),
                        regionRaw: loc.region || 'UNKNOWN'
                    });
                }
            }

            let msgLines = [];
            if (dropTypes.length > 0) {
                msgLines.push(`<b>${titleName || rawQuery}</b> вы можете выбить из покемонов типа <b>${dropTypes.map(t => typeNamesRu[t.toLowerCase()] || t).join(', ')}</b>.`);
            }
            if (dropPokemons.length > 0) {
                msgLines.push(`<b>${titleName || rawQuery}</b> падает с <b>${dropPokemons.join(', ')}</b>.`);
            }
            if (isWildDrop) {
                msgLines.push(`<b>${titleName || rawQuery}</b> может упасть с любого дикого покемона.`);
            }
            if (dropNPCs.length > 0) {
                msgLines.push(`<b>${titleName || rawQuery}</b> можно купить у: <b>${dropNPCs.join(', ')}</b>.`);
            }
            if (isDiamondDrop) {
                msgLines.push(`Этот предмет вы можете купить в магазине за алмазы. Напишите боту <b>"/diamonds"</b>.`);
            }
            if (itemObj && itemObj.BPPrice) {
                msgLines.push(`Этот предмет можно приобрести за <b>${itemObj.BPPrice} BP</b> в Боевом Рубеже.`);
            }

            let messageHtml = '';
            if (msgLines.length > 0) {
                messageHtml = `<div style="padding:15px; border-left:5px solid var(--accent); background:rgba(255,107,107,0.1); border-radius:10px; margin-bottom:20px; line-height:1.5;">${msgLines.join('<br>')}</div>`;
            }

            if (itemHabitats.length === 0 && !isDiamondDrop && msgLines.length === 0) {
                if (itemObj) {
                    messageHtml = `<div style="padding:15px; border-left:5px solid var(--primary); background:rgba(0,0,0,0.2); border-radius:10px; margin-bottom:20px; line-height:1.5;">Извините, но местонахождение <b>${titleName}</b> не найдено.</div>`;
                } else {
                    // Check if the query is ambiguous — matches multiple items
                    const norm2 = str => str.toLowerCase().replace(/ё/g, 'е').replace(/[^а-яa-z0-9]/g, '');
                    const qNorm2 = norm2(rawQuery);
                    let suggestions = [];
                    if (window.itemsData && qNorm2.length >= 3) {
                        for (const key in window.itemsData) {
                            const it = window.itemsData[key];
                            const ruN = norm2(it.RuName || '');
                            const enN = norm2(it.Name || '');
                            if (ruN.includes(qNorm2) || enN.includes(qNorm2) ||
                                window.itemSimilarity(qNorm2, ruN) > 0.6 ||
                                window.itemSimilarity(qNorm2, enN) > 0.6) {
                                suggestions.push(it.RuName || it.Name);
                            }
                        }
                    }
                    if (suggestions.length > 1) {
                        const list = suggestions.slice(0, 10).map(s => `<b>${s}</b>`).join(', ');
                        renderError(`Запрос "<b>${rawQuery}</b>" слишком общий — найдено несколько предметов: ${list}.<br>Пожалуйста, уточните название.`);
                    } else {
                        renderError(`Предмет "<b>${rawQuery}</b>" не найден.`);
                    }
                    return;
                }
            }

            renderItemOutput(foundId, rawQuery, itemObj, itemHabitats, messageHtml);
            return;
        }

        // ===== ВНЕГЛАСНЫЙ ПОИСК ПО ТИПУ И ТИРУ ПОКЕМОНОВ =====
        if (!isItemSearch && !foundID) {
            const validTiers = ['lc','nfe','iron','bronze','silver','gold','platinum','diamond','ascendant','uber','ultrauber'];
            const validRarities = ['о', 'р1', 'р2', 'р3', 'р4', 'р5', 'р6', 'р7', 'р8', 'р9', 'р10'];
            
            let typeKey = null;
            let tierKey = null;
            let rarityKey = null;
            let abilityKey = null;
            let professionKey = null;
            let regionKey = null;

            const spacedQuery = rawQuery.toLowerCase().trim();

            const regionAliases = {
                'kanto': 'KANTO', 'канто': 'KANTO',
                'johto': 'JOHTO', 'джото': 'JOHTO',
                'hoenn': 'HOENN', 'хоэнн': 'HOENN', 'хоенн': 'HOENN',
                'sinnoh': 'SINNOH', 'синно': 'SINNOH',
                'unova': 'UNOVA', 'юнова': 'UNOVA', 'унова': 'UNOVA'
            };

            let words = spacedQuery.split(/\s+/);
            let newWords = [];
            for (let w of words) {
                let cw = w.replace(/[^\p{L}\d]/gu, '');
                if (regionAliases[cw] && activeType === 'other') {
                    regionKey = regionAliases[cw];
                } else {
                    newWords.push(w);
                }
            }
            let qWithoutRegion = newWords.join(' ').trim();

            if (regionKey && !qWithoutRegion) {
                els.title.innerHTML = '<i class="fas fa-search"></i> Уточните запрос';
                els.content.innerHTML = `<div style="text-align:center; padding:30px; color:var(--primary);">
                    Вы выбрали регион <b>${regionNames[regionKey] || regionKey}</b>.<br><br>
                    <div style="color:#ccc; font-size:0.95em; line-height:1.5;">
                        Пожалуйста, добавьте к поиску что именно вы ищете в этом регионе.<br>
                        Например: <b>${regionNames[regionKey] || regionKey} Огненный</b> или <b>${regionNames[regionKey] || regionKey} Редкость О</b>
                    </div>
                </div>`;
                return;
            }

            const qTypeRaw = qWithoutRegion.replace(/^тип\s+/i, '').replace(/[^\p{L}\d\s]/gu, '').trim();
            const qType = qTypeRaw.replace(/ё/g, 'е');
            
            if (qWithoutRegion.startsWith('тип ')) typeKey = Object.keys(typeNamesRu).find(k => typeNamesRu[k].toLowerCase().replace(/ё/g, 'е') === qType || k === qTypeRaw) || qTypeRaw;
            else typeKey = Object.keys(typeNamesRu).find(k => typeNamesRu[k].toLowerCase().replace(/ё/g, 'е') === qType || k === qTypeRaw);

            if (!typeKey) {
                let cleanNoReg = qWithoutRegion.replace(/[^\p{L}\d]/gu, '');
                if (validTiers.includes(cleanNoReg)) tierKey = cleanNoReg;
                else if (qWithoutRegion.startsWith('тир ')) {
                    const tk = qWithoutRegion.split(' ')[1];
                    if (validTiers.includes(tk)) tierKey = tk;
                }
            }
            
            if (!typeKey && !tierKey && window.abilitiesData) {
                let qAbil = qWithoutRegion.replace(/^способность\s+/i, '').replace(/[^\p{L}\d\s_]/gu, '').trim();
                let qAbilNorm = qAbil.replace(/\s+/g, '').replace(/ё/g, 'е');
                const abKey = Object.keys(window.abilitiesData).find(k => {
                    const ab = window.abilitiesData[k];
                    const enNorm = ab.Name.toLowerCase().replace(/\s+/g, '');
                    const ruNorm = ab.RuName ? ab.RuName.toLowerCase().replace(/\s+/g, '').replace(/ё/g, 'е') : '';
                    return enNorm === qAbilNorm || ruNorm === qAbilNorm || qAbilNorm === `ability_${ab.num_id}`;
                });
                if (abKey) abilityKey = abKey;
            }
            
            if (!typeKey && !tierKey && !abilityKey && window.professionsData) {
                let qProf = qWithoutRegion.replace(/^профессия\s+/i, '').replace(/[^\p{L}\d\s]/gu, '').trim();
                if (qProf) {
                    const prKey = Object.keys(window.professionsData).find(k => {
                        const pr = window.professionsData[k];
                        let prName = pr.ru_name.replace(/^[^\p{L}]+/gu, '').trim().toLowerCase();
                        return k.toLowerCase() === qProf || prName === qProf || pr.ru_name.toLowerCase().includes(qProf);
                    });
                    if (prKey) professionKey = prKey;
                }
            }

            if (!typeKey && !tierKey && !abilityKey && !professionKey) {
                // Заменяем английскую 'p' на русскую 'р'
                let qRarity = qWithoutRegion.replace(/p/g, 'р').replace(/[^\p{L}\d\s]/gu, '').trim();
                
                if (qRarity.startsWith('редкость ')) {
                    qRarity = qRarity.replace(/^редкость\s+/i, '').trim();
                }

                if (qRarity === 'обычный' || qRarity === 'обычная' || qRarity === 'о') {
                    rarityKey = 'о';
                } else if (/^р?\d{1,2}$/.test(qRarity)) {
                    let num = qRarity.match(/\d{1,2}/)[0];
                    if (parseInt(num) >= 1 && parseInt(num) <= 10) {
                        rarityKey = 'р' + num;
                    }
                }
            }

            if (typeKey || tierKey || rarityKey || abilityKey || professionKey || regionKey) {
                let pokemonMatches = [];
                let locationMatches = {}; // Grouped by region

                let regionAllowedSpecies = null;
                if (regionKey && window.locationData) {
                    regionAllowedSpecies = new Set();
                    for (let locId in window.locationData) {
                        const loc = window.locationData[locId];
                        if (loc.region === regionKey && loc.encounters) {
                            loc.encounters.forEach(e => {
                                if (e.species) regionAllowedSpecies.add(e.species.toUpperCase());
                            });
                        }
                    }
                }

                // --- 1. Сбор подходящих покемонов ---
                for (let id in pokemonDB) {
                    const p = pokemonDB[id];
                    if (!p || !p.en) continue;
                    
                    if (regionAllowedSpecies && !regionAllowedSpecies.has(p.en.toUpperCase())) continue;
                    
                    let hasOtherFilters = typeKey || tierKey || abilityKey || professionKey || rarityKey;
                    
                    let pType = false;
                    let pTier = false;
                    let pAbil = false;
                    let pAbilHidden = false;
                    let pProf = false;
                    
                    if (!hasOtherFilters) {
                        pType = true;
                    } else {
                        if (typeKey && p.type && p.type.includes(typeKey)) pType = true;
                    }
                    
                    const ruEntry = window.pokemonRuData && window.pokemonRuData[p.en.toUpperCase()];
                    if (tierKey && ruEntry && ruEntry.Format && ruEntry.Format.toLowerCase() === tierKey) pTier = true;
                    if (abilityKey && ruEntry) {
                        if (ruEntry.Abilities && ruEntry.Abilities.includes(abilityKey)) pAbil = true;
                        if (window.isHiddenAbilitySearch && ruEntry.HiddenAbilities && ruEntry.HiddenAbilities.includes(abilityKey)) {
                            pAbil = true;
                            if (!(ruEntry.Abilities && ruEntry.Abilities.includes(abilityKey))) pAbilHidden = true;
                        }
                    }
                    if (professionKey && ruEntry && ruEntry.AptitudePool) {
                        if (ruEntry.AptitudePool.includes(professionKey)) pProf = true;
                    }
                    
                    if (pType || pTier || pAbil || pProf) {
                        pokemonMatches.push({id, p, isForm: false, formIndex: null, formObj: null, isHA: pAbilHidden});
                    }

                    // --- Сбор форм ---
                    if (window.formsBySpecies && window.formsBySpecies[p.en.toUpperCase()]) {
                        window.formsBySpecies[p.en.toUpperCase()].forEach((form, fIdx) => {
                            // Пропускаем технические пустышки-эволюции (у которых нет ни названия формы, ни спрайта)
                            if (!form.FormName && !form.SpritePath) return;

                            let formType = false;
                            let formTypeArr = p.type;
                            if (!hasOtherFilters) {
                                formType = true;
                            } else {
                                if (form.Types) {
                                    formTypeArr = form.Types.split(',').map(t=>t.trim().toLowerCase());
                                    if (typeKey && formTypeArr.includes(typeKey.toLowerCase())) formType = true;
                                } else if (pType) {
                                    formType = true;
                                }
                            }
                            
                            let fTier = false;
                            let fAbil = false;
                            let fAbilHidden = false;
                            if (tierKey) {
                                if (form.Format && form.Format.toLowerCase() === tierKey) fTier = true;
                                else if (!form.Format && pTier) fTier = true; // Fallback to base tier
                            }
                            
                            if (abilityKey) {
                                let formHasAbilStr = form.Abilities ? form.Abilities.includes(abilityKey) : false;
                                let formHasHiddenStr = form.HiddenAbilities ? form.HiddenAbilities.includes(abilityKey) : false;
                                
                                if (formHasAbilStr) fAbil = true;
                                else if (window.isHiddenAbilitySearch && formHasHiddenStr) { fAbil = true; fAbilHidden = true; }
                                else if (!formHasAbilStr && !formHasHiddenStr) {
                                    if (!form.Abilities && ruEntry && ruEntry.Abilities && ruEntry.Abilities.includes(abilityKey)) fAbil = true;
                                    if (window.isHiddenAbilitySearch && !form.HiddenAbilities && ruEntry && ruEntry.HiddenAbilities && ruEntry.HiddenAbilities.includes(abilityKey)) {
                                        fAbil = true;
                                        if (!(!form.Abilities && ruEntry && ruEntry.Abilities && ruEntry.Abilities.includes(abilityKey))) fAbilHidden = true;
                                    }
                                }
                            }

                            let fProf = false;
                            if (professionKey) {
                                // Since professions are tied to AptitudePool on base species in ruData, fallback to pProf
                                if (pProf) fProf = true;
                            }

                            if (formType || fTier || fAbil || fProf) {
                                let mockP = {
                                    en: p.en,
                                    ru: p.ru,
                                    type: formTypeArr,
                                    formEn: form.FormName || p.en,
                                    formRu: form.FormName || p.ru
                                };
                                pokemonMatches.push({
                                    id: id, 
                                    p: mockP, 
                                    isForm: true, 
                                    formIndex: fIdx,
                                    formObj: form
                                });
                            }
                        });
                    }
                }

                // --- 2. Сбор локаций и редкостей ---
                if (window.locationData) {
                    for (let locId in window.locationData) {
                        const loc = window.locationData[locId];
                        if (regionKey && loc.region !== regionKey) continue;
                        let matchedSpecies = new Set();
                        if (loc.encounters) {
                            loc.encounters.forEach(e => {
                                if (!e.species) return;
                                const p = Object.values(pokemonDB).find(x => x.en.toUpperCase() === e.species.toUpperCase());
                                if (!p) return;
                                
                                let finalRuName = p.ru || p.en;
                                let fTier = false;
                                let formType = false;
                                let formAbil = false;
                                
                                if (e.form > 0 && window.formsBySpecies && window.formsBySpecies[p.en.toUpperCase()]) {
                                    const forms = window.formsBySpecies[p.en.toUpperCase()];
                                    let fObj = forms.find(f => f._FormKey === `${p.en.toUpperCase()}-${e.form}`);
                                    if (!fObj && forms.length >= e.form) fObj = forms[e.form - 1];
                                    
                                    if (fObj) {
                                        if (fObj.FormName) {
                                            if (typeof window.translateFormName === 'function') {
                                                const t = window.translateFormName(fObj.FormName, finalRuName, p.en);
                                                finalRuName = t.ru;
                                            } else {
                                                finalRuName = finalRuName + ' (' + fObj.FormName + ')';
                                            }
                                        }
                                        if (tierKey) {
                                            if (fObj.Format && fObj.Format.toLowerCase() === tierKey) fTier = true;
                                            else {
                                                const ruEntry = window.pokemonRuData && window.pokemonRuData[p.en.toUpperCase()];
                                                if (!fObj.Format && ruEntry && ruEntry.Format && ruEntry.Format.toLowerCase() === tierKey) fTier = true;
                                            }
                                        }
                                        if (typeKey) {
                                            if (fObj.Types) {
                                                let tArr = fObj.Types.split(',').map(t=>t.trim().toLowerCase());
                                                if (tArr.includes(typeKey.toLowerCase())) formType = true;
                                            } else if (p.type && p.type.includes(typeKey)) formType = true;
                                        }
                                        if (abilityKey) {
                                            if (fObj.Abilities && fObj.Abilities.includes(abilityKey)) formAbil = true;
                                            else if (fObj.HiddenAbilities && fObj.HiddenAbilities.includes(abilityKey)) formAbil = true;
                                            else if (!fObj.Abilities && !fObj.HiddenAbilities) {
                                                const ruEntry = window.pokemonRuData && window.pokemonRuData[p.en.toUpperCase()];
                                                if (ruEntry) {
                                                    if (ruEntry.Abilities && ruEntry.Abilities.includes(abilityKey)) formAbil = true;
                                                    if (ruEntry.HiddenAbilities && ruEntry.HiddenAbilities.includes(abilityKey)) formAbil = true;
                                                }
                                            }
                                        }
                                    }
                                }

                                if (typeKey) {
                                    if (e.form > 0 ? formType : (p.type && p.type.includes(typeKey))) matchedSpecies.add(finalRuName);
                                }
                                if (abilityKey) {
                                    if (e.form > 0) {
                                        if (formAbil) matchedSpecies.add(finalRuName);
                                    } else if (window.pokemonRuData) {
                                        const ruEntry = window.pokemonRuData[p.en.toUpperCase()];
                                        if (ruEntry && ((ruEntry.Abilities && ruEntry.Abilities.includes(abilityKey)) || (ruEntry.HiddenAbilities && ruEntry.HiddenAbilities.includes(abilityKey)))) {
                                            matchedSpecies.add(finalRuName);
                                        }
                                    }
                                }
                                if (professionKey && window.calculateProfessionEfficiency) {
                                    let locFormObj = null;
                                    if (e.form > 0 && window.formsBySpecies && window.formsBySpecies[p.en.toUpperCase()]) {
                                        const forms = window.formsBySpecies[p.en.toUpperCase()];
                                        locFormObj = forms.find(f => f._FormKey === `${p.en.toUpperCase()}-${e.form}`);
                                        if (!locFormObj && forms.length >= e.form) locFormObj = forms[e.form - 1];
                                    }
                                    let effs = window.calculateProfessionEfficiency(p, locFormObj, professionKey, window.abilitiesData);
                                    if (effs && effs.length > 0) {
                                        let maxEff = effs.reduce((prev, current) => (prev.total > current.total) ? prev : current);
                                        if (maxEff.total + (window.isShinyToggleActive ? 10 : 0) > 0) {
                                            matchedSpecies.add(finalRuName);
                                        }
                                    }
                                }
                                if (tierKey && window.pokemonRuData) {
                                    if (e.form > 0) {
                                        if (fTier) matchedSpecies.add(finalRuName);
                                    } else {
                                        const ruEntry = window.pokemonRuData[p.en.toUpperCase()];
                                        if (ruEntry && ruEntry.Format && ruEntry.Format.toLowerCase() === tierKey) matchedSpecies.add(finalRuName);
                                    }
                                }
                                if (rarityKey) {
                                    const rarityStrMap = {0: 'о', 1: 'р1', 2: 'р2', 3: 'р3', 4: 'р4', 5: 'р5', 6: 'р6', 7: 'р7', 8: 'р8', 9: 'р9', 10: 'р10'};
                                    if (rarityStrMap[e.rarity] === rarityKey) {
                                        matchedSpecies.add(finalRuName);
                                        if (e.form > 0) {
                                            if (!pokemonMatches.find(pm => pm.p.en === p.en && pm.isForm && pm.formIndex === e.form - 1)) {
                                                const pId = Object.keys(pokemonDB).find(k => pokemonDB[k].en === p.en);
                                                if (pId) {
                                                    const forms = window.formsBySpecies[p.en.toUpperCase()];
                                                    let fObj = forms.find(f => f._FormKey === `${p.en.toUpperCase()}-${e.form}`);
                                                    if (!fObj && forms.length >= e.form) fObj = forms[e.form - 1];
                                                    let formTypeArr = p.type;
                                                    if (fObj && fObj.Types) formTypeArr = fObj.Types.split(',').map(t=>t.trim().toLowerCase());
                                                    let mockP = {
                                                        en: p.en,
                                                        ru: p.ru,
                                                        type: formTypeArr,
                                                        formEn: fObj ? fObj.FormName : p.en,
                                                        formRu: fObj ? fObj.FormName : p.ru
                                                    };
                                                    pokemonMatches.push({
                                                        id: pId, 
                                                        p: mockP, 
                                                        isForm: true, 
                                                        formIndex: forms.indexOf(fObj),
                                                        formObj: fObj
                                                    });
                                                }
                                            }
                                        } else {
                                            if (!pokemonMatches.find(pm => pm.p.en === p.en && !pm.isForm)) {
                                                const pId = Object.keys(pokemonDB).find(k => pokemonDB[k].en === p.en);
                                                if(pId) pokemonMatches.push({id: pId, p: p, isForm: false, formIndex: null, formObj: null});
                                            }
                                        }
                                    }
                                }
                            });
                        }
                        if (matchedSpecies.size > 0) {
                            const reg = loc.region || 'UNKNOWN';
                            if (!locationMatches[reg]) locationMatches[reg] = [];
                            locationMatches[reg].push({locId, loc, speciesCount: matchedSpecies.size, speciesNames: Array.from(matchedSpecies)});
                        }
                    }
                }

                // --- 3. Генерация UI ---
                let titleText = typeKey ? `Поиск по типу: ${typeNamesRu[typeKey] || typeKey}` : 
                                (tierKey ? `Поиск по тиру: ${tierKey.toUpperCase()}` : 
                                (abilityKey && window.abilitiesData && window.abilitiesData[abilityKey] ? `Поиск по способности: ${window.abilitiesData[abilityKey].RuName || window.abilitiesData[abilityKey].Name}` : 
                                (professionKey && window.professionsData && window.professionsData[professionKey] ? `Поиск по профессии: ${window.professionsData[professionKey].ru_name.replace(/^[^\p{L}]+/gu, '').trim()}` : 
                                `Поиск по редкости: ${rarityKey ? rarityKey.toUpperCase() : ''}`)));
                els.title.innerHTML = `<i class="fas fa-search"></i> ${titleText}`;

                // Локации HTML
                let locsHtml = `<div style="display:flex; flex-direction:column; gap: 20px;">`;
                if (Object.keys(locationMatches).length === 0) {
                    locsHtml += `<div style="text-align:center; color:#aaa; padding:20px;">В этой категории не найдено ни одной локации.</div>`;
                } else {
                    for (let reg in locationMatches) {
                        locsHtml += `<div style="background: rgba(0,0,0,0.3); border-radius: 12px; padding: 15px;">
                            <h3 style="color: var(--primary); margin-top:0; margin-bottom: 15px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px;">${regionNames[reg] || reg}</h3>
                            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px;">`;
                        locationMatches[reg].forEach(l => {
                            const ext = window.extractLocationIcon ? window.extractLocationIcon(l.loc.ru_name || l.loc.name, l.loc.type) : {icon: '📍', name: l.loc.ru_name || l.loc.name};
                            locsHtml += `<div class="loc-clickable" data-loc="${l.locId}" style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px; border-left: 4px solid var(--primary); cursor: pointer; transition: 0.2s; position:relative;" onmouseover="this.style.background='rgba(255,255,255,0.1)'; this.style.transform='translateX(3px)';" onmouseout="this.style.background='rgba(255,255,255,0.05)'; this.style.transform='none';" onclick="if(typeof openLightLocationModal==='function') openLightLocationModal('${l.locId}')">
                                <div style="font-weight: bold; color: #fff; margin-bottom: 5px;"><span style="font-size:1.2rem; margin-right:5px;">${ext.icon}</span>${ext.name}</div>
                                <div style="font-size: 0.8rem; color: #aaa;">Найдено видов: <span style="color:var(--primary); font-weight:bold;">${l.speciesCount}</span></div>
                            </div>`;
                        });
                        locsHtml += `</div></div>`;
                    }
                }
                locsHtml += `</div>`;

                // Сохраняем глобально для сортировки
                window.currentPokemonMatches = pokemonMatches;
                window.currentLocationMatches = locationMatches;
                window.currentProfessionKey = professionKey;
                window.currentTypeKey = typeKey;

                if (typeof window.profSortState === 'undefined') {
                    window.profSortState = 0; // 0=ID, 1=Best, 2=Worst, 3=Alpha
                    window.profLocState = 0; // 0=All, 1=LocsOnly
                    window.profAbilState = false; // false=Max, true=Combos
                }

                // Покемоны HTML
                let pokesHtml = '';
                if (professionKey && window.calculateProfessionEfficiency) {
                    pokesHtml = window.generateProfessionHTML();
                } else {
                    pokesHtml = `<div style="display:flex; flex-wrap:wrap; gap:15px; justify-content:center;">`;
                    if (pokemonMatches.length === 0) {
                        pokesHtml += `<div style="text-align:center; color:#aaa; padding:20px;">В этой категории не найдено покемонов.</div>`;
                    } else {
                        pokemonMatches.forEach(m => {
                            pokesHtml += window.generatePokemonCardHTML(m, isShinySearch);
                        });
                    }
                    pokesHtml += `</div>`;
                }

                
                if (pokemonMatches.length > 0) {
                    let totalText = "Всего найдено покемонов";
                    if (typeKey && typeNamesRu[typeKey.toLowerCase()]) {
                        totalText = `Всего покемонов типа «${typeNamesRu[typeKey.toLowerCase()]}»`;
                    } else if (professionKey && window.professionsData && window.professionsData[professionKey]) {
                        totalText = `Всего покемонов для профессии «${window.professionsData[professionKey].ru_name.replace(/^[^\p{L}]+/gu, '').trim()}»`;
                    }
                    let tColor = (typeKey && typeof typeColors !== 'undefined' && typeColors[typeKey.toLowerCase()]) ? typeColors[typeKey.toLowerCase()] : 'var(--primary)';
                    pokesHtml += `<div style="text-align:center; margin-top:30px; font-size:1.1rem; color:#ccc; font-weight:bold; background:rgba(0,0,0,0.3); border-radius:10px; padding:15px; border-bottom:3px solid ${tColor};">
                        ${totalText}: <span style="color:${tColor}; font-size:1.3rem;">${pokemonMatches.length}</span> шт.
                    </div>`;
                }

                let regionHeaderHtml = '';
                if (regionKey) {
                    const rName = regionNames[regionKey] || regionKey;
                    regionHeaderHtml = `
                    <div style="background: linear-gradient(90deg, rgba(78, 205, 196, 0.2), rgba(0,0,0,0)); padding: 15px 20px; border-radius: 12px; margin-bottom: 20px; border-left: 5px solid var(--primary); display: flex; align-items: center; gap: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.3);">
                        <i class="fas fa-map-marked-alt" style="font-size: 2rem; color: var(--primary);"></i>
                        <div>
                            <h2 style="margin: 0; color: #fff; font-size: 1.5rem; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">Регион: ${rName}</h2>
                            <div style="color: #aaa; margin-top: 3px; font-size: 0.85rem;">Отображаются покемоны и локации только из этого региона</div>
                        </div>
                    </div>`;
                }

                let html = regionHeaderHtml + `
                <style>
                    @media (max-width: 768px) {
                        .search-action-buttons {
                            top: 45px !important;
                            right: 0 !important;
                        }
                        .slider-container {
                            margin-bottom: 55px !important;
                        }
                    }
                </style>
                <div class="slider-container" style="display:flex; justify-content:center; align-items:center; margin: 20px 0; user-select: none; position: relative; width: 100%;">
                    <div style="flex: 1 1 0; min-width: 0; display: flex; justify-content: flex-end; padding-right: 15px;">
                        <span id="slider-loc-text" style="color:#aaa; font-weight:bold; transition:0.3s; cursor:pointer; font-size: 0.95rem; white-space: nowrap;" onclick="setSliderState(-1)">Локации</span>
                    </div>
                    <div id="slider-track" style="width: 80px; height: 34px; flex-shrink: 0; background: rgba(0,0,0,0.5); border-radius: 17px; position:relative; cursor:pointer; box-shadow: inset 0 0 5px rgba(0,0,0,0.8);">
                        <div id="slider-thumb" style="width:28px; height:28px; background: var(--text-muted); border-radius:50%; position:absolute; top:3px; left:26px; transition:left 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55), background 0.3s;"></div>
                    </div>
                    <div style="flex: 1 1 0; min-width: 0; position: relative; display: flex; justify-content: flex-start; align-items: center; padding-left: 15px;">
                        <span id="slider-poke-text" style="color:#aaa; font-weight:bold; transition:0.3s; cursor:pointer; font-size: 0.95rem; white-space: nowrap;" onclick="setSliderState(1)">Покемоны</span>
                        <div class="search-action-buttons" style="position: absolute; right: 0; display: flex; flex-direction: row; gap: 8px; z-index: 10;">
                            <button id="shinyToggleButton" class="shiny-slider-btn" onclick="toggleShinySearch(event)" title="Включить Шайни режим" style="opacity: 0; pointer-events: none; background: \${isShinySearch ? 'rgba(78, 205, 196, 0.2)' : 'rgba(255,255,255,0.05)'}; border: 1px solid \${isShinySearch ? 'var(--primary)' : 'rgba(255,255,255,0.1)'}; border-radius: 8px; width: 34px; height: 34px; flex-shrink: 0; cursor: pointer; transition: 0.3s; display: flex; align-items: center; justify-content: center;">
                                <i class="fas fa-star" style="color: \${isShinySearch ? 'var(--primary)' : '#aaa'}; font-size: 1.1rem;"></i>
                            </button>
                            \${abilityKey ? \`<button id="hiddenAbilityToggleButton" class="shiny-slider-btn" onclick="toggleHiddenAbilitySearch(event)" title="Учитывать скрытые способности" style="opacity: 0; pointer-events: none; background: \${window.isHiddenAbilitySearch ? 'rgba(78, 205, 196, 0.2)' : 'rgba(255,255,255,0.05)'}; border: 1px solid \${window.isHiddenAbilitySearch ? 'var(--primary)' : 'rgba(255,255,255,0.1)'}; border-radius: 8px; width: 34px; height: 34px; flex-shrink: 0; cursor: pointer; transition: 0.3s; display: flex; align-items: center; justify-content: center;">
                                <i class="fas fa-eye-slash" style="color: \${window.isHiddenAbilitySearch ? 'var(--primary)' : '#aaa'}; font-size: 1.1rem;"></i>
                            </button>\` : ''}
                        </div>
                    </div>
                </div>
                
                <div id="slider-view-neutral" style="text-align:center; color:#aaa; font-size:1.1rem; padding: 40px 20px; animation: fadeIn 0.3s;">
                    <i class="fas fa-arrows-alt-h" style="font-size:2rem; opacity:0.5; margin-bottom:15px; display:block;"></i>
                    Перетяните ползунок, чтобы выбрать категорию
                </div>
                
                <div id="slider-view-loc" style="display:none; padding:10px; animation: fadeIn 0.3s;">${locsHtml}</div>
                <div id="slider-view-poke" style="display:none; padding:10px; animation: fadeIn 0.3s;">${pokesHtml}</div>
                `;

                els.content.innerHTML = html;
                els.container.style.display = 'flex';
                if (els.overlay) els.overlay.classList.add('active');
                document.body.style.overflow = 'hidden';

                // Slider Logic
                window.setSliderState = function(state) {
                    window.currentSliderState = state;
                    const thumb = document.getElementById('slider-thumb');
                    const tLoc = document.getElementById('slider-loc-text');
                    const tPoke = document.getElementById('slider-poke-text');
                    const vNeutral = document.getElementById('slider-view-neutral');
                    const vLoc = document.getElementById('slider-view-loc');
                    const vPoke = document.getElementById('slider-view-poke');
                    
                    if(!thumb) return;
                    
                    vNeutral.style.display = 'none';
                    vLoc.style.display = 'none';
                    vPoke.style.display = 'none';
                    tLoc.style.color = '#aaa';
                    tPoke.style.color = '#aaa';
                    
                    const shinyBtn = document.getElementById('shinyToggleButton');
                    const hiddenBtn = document.getElementById('hiddenAbilityToggleButton');
                    
                    if (state === -1) {
                        thumb.style.left = '3px';
                        thumb.style.background = 'var(--primary)';
                        tLoc.style.color = 'var(--primary)';
                        vLoc.style.display = 'block';
                        if (shinyBtn) { shinyBtn.style.opacity = '0'; shinyBtn.style.pointerEvents = 'none'; }
                        if (hiddenBtn) { hiddenBtn.style.opacity = '0'; hiddenBtn.style.pointerEvents = 'none'; }
                    } else if (state === 1) {
                        thumb.style.left = '49px';
                        thumb.style.background = 'var(--primary)';
                        tPoke.style.color = 'var(--primary)';
                        vPoke.style.display = 'block';
                        if (shinyBtn) { shinyBtn.style.opacity = '1'; shinyBtn.style.pointerEvents = 'auto'; }
                        if (hiddenBtn) { hiddenBtn.style.opacity = '1'; hiddenBtn.style.pointerEvents = 'auto'; }
                    } else {
                        thumb.style.left = '26px';
                        thumb.style.background = 'var(--text-muted)';
                        vNeutral.style.display = 'block';
                        if (shinyBtn) { shinyBtn.style.opacity = '0'; shinyBtn.style.pointerEvents = 'none'; }
                        if (hiddenBtn) { hiddenBtn.style.opacity = '0'; hiddenBtn.style.pointerEvents = 'none'; }
                    }
                };

                const track = document.getElementById('slider-track');
                let isDragging = false;
                
                track.addEventListener('mousedown', (e) => { isDragging = true; handleSliderDrag(e); });
                document.addEventListener('mousemove', (e) => { if(isDragging) handleSliderDrag(e); });
                document.addEventListener('mouseup', () => { isDragging = false; });
                
                track.addEventListener('touchstart', (e) => { isDragging = true; handleSliderDrag(e.touches[0]); });
                document.addEventListener('touchmove', (e) => { if(isDragging) handleSliderDrag(e.touches[0]); });
                document.addEventListener('touchend', () => { isDragging = false; });
                
                function handleSliderDrag(e) {
                    const rect = track.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    if (x < 26) setSliderState(-1);
                    else if (x > 54) setSliderState(1);
                    else setSliderState(0);
                }

                // Smart tap logic for slider locations
                els.content.querySelectorAll('.loc-clickable').forEach(el => {
                    let isScrolling = false;
                    el.addEventListener('mousedown', () => isScrolling = false);
                    el.addEventListener('mousemove', () => isScrolling = true);
                    el.addEventListener('mouseup', () => {
                        if (!isScrolling && typeof openLightLocationModal === 'function') openLightLocationModal(el.dataset.loc);
                    });
                    el.addEventListener('touchstart', () => isScrolling = false);
                    el.addEventListener('touchmove', () => isScrolling = true);
                    el.addEventListener('touchend', () => {
                        if (!isScrolling && typeof openLightLocationModal === 'function') openLightLocationModal(el.dataset.loc);
                    });
                });

                // Восстановление ползунка
                if (window.currentSliderState !== 0) {
                    setSliderState(window.currentSliderState);
                } else if (pokemonMatches.length > 0 && typeKey === null && tierKey === null && rarityKey === null && abilityKey !== null && professionKey === null) {
                    setSliderState(1);
                }

                return;
            }
        }

        // Внегласный поиск по NPC
        if (!foundID) {
            let foundNPCLocs = [];
            let matchedNames = new Set();
            let locSet = new Set();

            for (let npcKey in npcSearchIndex) {
                if (npcKey.includes(cleanQuery)) {
                    npcSearchIndex[npcKey].forEach(n => {
                        if (!locSet.has(n.locId)) {
                            locSet.add(n.locId);
                            foundNPCLocs.push(n);
                        }
                        matchedNames.add(n.name);
                    });
                }
            }

            if (foundNPCLocs.length > 0) {
                const pluralPlc = ['локация', 'локации', 'локаций'];
                function getPl(n, w) { return w[(n % 100 > 4 && n % 100 < 20) ? 2 : [2, 0, 1, 1, 1, 2][Math.min(n % 10, 5)]]; }
                
                els.title.innerHTML = '<i class="fas fa-users"></i> Результаты поиска NPC';
                const namesStr = Array.from(matchedNames).join(", ");
                
                let html = `<div style="text-align:center;padding:20px;color:var(--primary);font-size:1.1rem;margin-top:10px;">Персонаж(и) <b>${namesStr}</b> найден(ы) в ${foundNPCLocs.length} ${getPl(foundNPCLocs.length, pluralPlc)}:</div>`;
                html += '<div class="habitat-list" style="margin-top: 15px;">';
                
                foundNPCLocs.forEach(n => {
                    const locId = n.locId;
                    // Ищем локацию во всех регионах
                    let foundLoc = null;
                    let foundRegion = '';
                    if (window.locationData) {
                        for (const lId in window.locationData) {
                            if (lId === locId) {
                                foundLoc = window.locationData[lId];
                                foundRegion = regionNames[foundLoc.region] || foundLoc.region;
                                break;
                            }
                        }
                    }
                    if (foundLoc) {
                        const cleanLocName = (foundLoc.ru_name || foundLoc.name || '').replace(/^[^\p{L}\d]+/gu, '').trim();
                        html += `
                            <div class="habitat-item loc-clickable" data-loc="${locId}" style="margin-bottom: 10px; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 12px; border-left: 4px solid var(--primary); display: flex; align-items: center; gap: 15px; cursor: pointer; transition: 0.2s; position: relative; overflow: hidden;" onmouseover="this.style.background='rgba(255,255,255,0.1)'; this.style.transform='translateX(5px)';" onmouseout="this.style.background='rgba(255,255,255,0.05)'; this.style.transform='none';" onclick="if(typeof openLightLocationModal==='function') openLightLocationModal('${locId}')">
                                <div style="font-size: 1.8rem; background: rgba(0,0,0,0.3); width: 45px; height: 45px; display: flex; align-items: center; justify-content: center; border-radius: 50%; box-shadow: 0 4px 10px rgba(0,0,0,0.5); flex-shrink: 0;">🗺️</div>
                                <div>
                                    <div class="habitat-loc-name" style="font-weight: bold; font-size: 1.15rem; color: #fff; margin-bottom: 3px;">${cleanLocName}</div>
                                </div>
                                <div style="position: absolute; bottom: 8px; right: 10px; font-size: 0.75rem; font-weight: bold; background: rgba(0,0,0,0.5); padding: 3px 8px; border-radius: 12px; color: #aaa;">Регион: <span style="color:var(--primary)">${foundRegion}</span></div>
                            </div>`;
                    }
                });
                html += '</div>';
                els.content.innerHTML = html;
                return;
            }
            // Внегласный поиск по локациям
            let foundLocObj = null;
            if (window.locationData) {
                const normLoc = str => str ? str.toLowerCase().replace(/[^\p{L}\d]/gu, '') : '';
                const qLoc = normLoc(rawQuery);
                
                for (let locId in window.locationData) {
                    let loc = window.locationData[locId];
                    if (normLoc(loc.ru_name) === qLoc ||
                        normLoc(loc.name) === qLoc ||
                        normLoc(loc.displayName) === qLoc) {
                        foundLocObj = loc;
                        break;
                    }
                }
            }

            if (foundLocObj) {
                // Если мы уже на странице региона, просто обновляем url
                const currentPath = window.location.pathname;
                const targetRegion = foundLocObj.region.toLowerCase();
                
                if (currentPath.includes(`/${targetRegion}.html`)) {
                    window.location.href = `?loc=${encodeURIComponent(rawQuery)}`;
                } else if (currentPath.includes('/pages/')) {
                    window.location.href = `${targetRegion}.html?loc=${encodeURIComponent(rawQuery)}`;
                } else {
                    window.location.href = `pages/${targetRegion}.html?loc=${encodeURIComponent(rawQuery)}`;
                }
                return;
            }

            renderError(`Не найдено: "<b>${rawQuery}</b>"`);
            return;
        }

        // Pokemon logic is handled implicitly because we check if it is item search above.

        // Поддержка форм: foundID может быть "baseId_formIndex"
        let actualId = foundID;
        let formIndex = null;
        if (typeof foundID === 'string' && foundID.includes('_')) {
            const parts = foundID.split('_');
            actualId = parts[0];
            formIndex = parseInt(parts[1], 10);
        }

        const pokemon = pokemonDB[actualId];
        if (!pokemon) {
            renderError(`Информация о "<b>${rawQuery}</b>" не найдена.`);
            return;
        }
        const searchNameCaps = pokemon.en.toUpperCase().trim();
        let habitats = findInWild(searchNameCaps, formIndex);
        let message = "";
        let ancestorHabitats = [];

        let formName = "";
        let speciesId = pokemon.en.toUpperCase().trim();
        if (formIndex !== null && window.formsBySpecies && window.formsBySpecies[speciesId]) {
            const fList = window.formsBySpecies[speciesId];
            const fObj = fList.find(f => f._FormKey === `${speciesId}-${formIndex}`) || fList[formIndex - 1];
            if (fObj) formName = fObj.FormName || "";
        }

        if (habitats.length === 0) {
            let isStarter = pokemon.is_starter;
            let isLegend = pokemon.is_legendary || (pokemon.rarity && pokemon.rarity >= 8);
            const ancestors = getAllAncestors(actualId, formName);
            
            if (ancestors.length > 0) {
                ancestors.forEach(anc => {
                    if (anc.is_starter) isStarter = true;
                    if (anc.is_legendary || (anc.rarity && anc.rarity >= 8)) isLegend = true;
                });
                
                let specialText = '';
                if (isStarter) specialText = ' (<b>Стартовый</b>)';
                else if (isLegend) specialText = ' (<b>Легендарный</b>)';

                const ancestorNames = ancestors.map(a => `<b>${a.en}</b> (<i>${a.ru || a.en}</i>)`).join(' или ');
                message = `Покемон <b>${pokemon.en}</b> (<i>${pokemon.ru}</i>)${specialText} не встречается в дикой природе, но вы можете эволюционировать его из: ${ancestorNames}.`;
                
                ancestors.forEach(anc => {
                    const ancLocs = findInWild(anc.en.toUpperCase().trim(), formIndex);
                    ancestorHabitats.push({ pokemon: anc, locations: ancLocs });
                });
            } else {
                if (pokemon.is_starter) {
                    message = `Покемон <b>${pokemon.en}</b> (<i>${pokemon.ru}</i>) является стартовым и в дикой природе не встречается. Его можно получить из <b>🎁 Коробки со стартовиком</b>.`;
                } else {
                    const isLegend = pokemon.is_legendary || (pokemon.rarity && pokemon.rarity >= 8);
                    message = isLegend
                        ? `Покемон <b>${pokemon.en}</b> (<i>${pokemon.ru}</i>) является легендарным, но не имеет конкретного места обитания.`
                        : `Покемон <b>${pokemon.en}</b> (<i>${pokemon.ru}</i>) в дикой природе не встречается.`;
                }
            }
        }
        renderOutput(actualId, pokemon, habitats, message, ancestorHabitats, isShinySearch, formIndex);
    }

    function findInWild(capsName, formIndex = null) {
        const found = [];
        for (const id in locationData) {
            const loc = locationData[id];
            if (!loc.encounters) continue;
            let targetForm = formIndex !== null ? formIndex : 0;
            const enc = loc.encounters.find(e => e.species === capsName && (e.form || 0) === targetForm);
            if (enc) found.push({ ...loc, name: id, info: enc });
        }
        return found;
    }

    function getAllAncestors(pkId, formName = '') {
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
                    let ruName = parent.ru || parent.en;
                    let enName = parent.en;
                    
                    if (formName && window.formsBySpecies) {
                        const pSpecies = enName.toUpperCase().trim();
                        const pForms = window.formsBySpecies[pSpecies];
                        if (pForms) {
                            const mForm = pForms.find(f => (f.FormName || '').toLowerCase() === formName.toLowerCase());
                            if (mForm) {
                                if (typeof translateFormName === 'function') {
                                    const t = translateFormName(mForm.FormName, ruName, enName);
                                    ruName = t.ru;
                                    enName = t.en;
                                } else {
                                    ruName = ruName + ' (' + mForm.FormName + ')';
                                    enName = mForm.FormName;
                                }
                            }
                        }
                    }
                    
                    ancestors.push({ id: parentId, ...parent, ru: ruName, en: enName });
                    currentId = parentId;
                } else break;
            } else break;
        }
        return ancestors;
    }

    // === 4. ОТРИСОВКА ===
    function renderOutput(id, p, list, msg, ancestorHabitats, isShiny = false, formIndex = null) {
        const formLabel = formIndex !== null ? ` (${window.formsBySpecies?.[p.en?.toUpperCase()]?.[formIndex]?.FormName || 'Форма'})` : '';
        els.title.innerHTML = `<i class="fas fa-search"></i> ${isShiny ? '⭐️' : ''}${p.ru}${formLabel}${isShiny ? '⭐️' : ''} / ${p.en}`;
        const types = p.type ? p.type.map(t => {
            const tLow = t.toLowerCase().trim();
            const nameRu = typeNamesRu[tLow] || t.toUpperCase();
            const bgColor = typeColors[tLow] || 'rgba(255,255,255,0.1)';
            const lightBackgroundTypes = ['electric', 'fairy', 'normal'];
            const textColor = lightBackgroundTypes.includes(tLow) ? '#000' : '#fff';
            const iconShadow = 'filter: drop-shadow(0 0 1px rgba(255,255,255,0.8))';
            return `<span class="type-badge" style="background:${bgColor}; padding:4px 8px; border-radius:5px; margin-right:5px; font-size:0.8rem; color:${textColor}"><span style="${iconShadow}">${typeIcons[tLow] || ''}</span> ${nameRu}</span>`;
        }).join('') : '';

        // Find correct key for dossier
        let dossierKey = p.en.toUpperCase();
        if (pokemonRuData && !pokemonRuData[dossierKey]) {
            const numericId = parseInt(id);
            for (let k in pokemonRuData) { if (pokemonRuData[k].NationalId === numericId) { dossierKey = k; break; } }
        }

        let html = `
        <div style="padding:10px;">
            <div style="margin-bottom:15px;">
                <div class="search-result-header" style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap: wrap;">
                    <div class="name-button-container" style="display:flex; align-items:flex-start; gap:12px;">
                        <div class="name-container">
                            <h2 style="color:var(--primary); margin:0; line-height:1.1;">#${id} ${p.ru}${formLabel}</h2>
                            <span style="color:var(--text-muted); display:block; margin-top:2px;">${p.en}</span>
                        </div>
                        <button class="poke-info-btn" onclick="openPokemonDossier('${dossierKey}', ${isShiny}, ${formIndex})" title="Открыть досье" style="width:38px; height:38px; border-radius:50%; border:none; background:rgba(78,205,196,0.25); color:var(--primary); cursor:pointer; transition:var(--transition); display:flex; align-items:center; justify-content:center; font-size:1.1rem; flex-shrink:0; pointer-events: auto !important;">
                            <i class="fas fa-book-open"></i>
                        </button>
                    </div>
                    <div class="type-badges-container" style="margin-top:4px; margin-left: 10px;">${types}</div>
                </div>
            </div>`;

        if (msg) {
            let color = 'var(--primary)';
            let bg = 'rgba(255,255,255,0.05)';
            if (msg.includes('эволюционировать')) { color = 'var(--accent)'; bg = 'rgba(255,107,107,0.1)'; }
            if (msg.includes('стартовым')) { color = '#FFD700'; bg = 'rgba(255,215,0,0.1)'; }
            html += `<div style="padding:15px; border-left:5px solid ${color}; background:${bg}; border-radius:10px; margin-bottom:20px; line-height:1.5;">${msg}</div>`;
        } else {
            html += `<div style="margin-bottom:15px; color:var(--text-muted);">📍 Обитает в регионах:</div>`;
        }

        // Render main habitats if any
        if (list.length > 0) {
            html += renderHabitats(list, 'var(--primary)');
        }

        // Render ancestor habitats with toggles
        if (ancestorHabitats && ancestorHabitats.length > 0) {
            ancestorHabitats.forEach((ah, idx) => {
                const ancName = ah.pokemon.ru || ah.pokemon.en;
                let locsHtml = '';
                if (ah.locations && ah.locations.length > 0) {
                    locsHtml = renderHabitats(ah.locations, 'var(--accent)');
                } else {
                    let msg = `Покемон <b>${ah.pokemon.en}</b> (<i>${ah.pokemon.ru}</i>) в дикой природе не встречается.`;
                    if (ah.pokemon.is_starter) msg = `Покемон <b>${ah.pokemon.en}</b> (<i>${ah.pokemon.ru}</i>) является стартовым и в дикой природе не встречается. Его можно получить из <b>🎁 Коробки со стартовиком</b>.`;
                    else if (ah.pokemon.is_legendary || (ah.pokemon.rarity && ah.pokemon.rarity >= 8)) msg = `Покемон <b>${ah.pokemon.en}</b> (<i>${ah.pokemon.ru}</i>) является легендарным и не имеет конкретного места обитания.`;
                    locsHtml = `<div style="padding:15px; color:var(--text-muted); text-align:center; background:rgba(0,0,0,0.2); border-radius:10px;">${msg}</div>`;
                }

                let ancDossierKey = ah.pokemon.en.toUpperCase();
                if (pokemonRuData && !pokemonRuData[ancDossierKey]) {
                    const numericId = parseInt(ah.pokemon.id || ah.pokemon.NationalId);
                    for (let k in pokemonRuData) { if (pokemonRuData[k].NationalId === numericId) { ancDossierKey = k; break; } }
                }

                html += `
                <div style="margin-bottom:12px;">
                    <div style="display:flex; gap:8px;">
                        <button onclick="document.getElementById('searchAnc${idx}').style.display = document.getElementById('searchAnc${idx}').style.display === 'none' ? 'block' : 'none'" style="flex:1; text-align:left; padding:12px 15px; background:rgba(255, 107, 107, 0.05); border:2px solid rgba(255, 107, 107, 0.6); border-radius:10px; color:white; cursor:pointer; font-size:14px; font-weight:bold; display:flex; justify-content:space-between; align-items:center; transition: all 0.3s ease; box-shadow: 0 0 15px rgba(255, 107, 107, 0.2);">
                            <span><i class="fas fa-paw"></i> Посмотреть место жительства <b>${ancName}</b></span>
                            <i class="fas fa-chevron-down"></i>
                        </button>
                        <button class="poke-info-btn" onclick="openPokemonDossier('${ancDossierKey}', false, null)" title="Открыть досье" style="width:46px; height:46px; border-radius:10px; border:2px solid rgba(255, 107, 107, 0.6); background:rgba(255, 107, 107, 0.1); color:var(--accent); cursor:pointer; transition:var(--transition); display:flex; align-items:center; justify-content:center; font-size:1.1rem; flex-shrink:0; pointer-events: auto !important;">
                            <i class="fas fa-book-open"></i>
                        </button>
                    </div>
                    <div id="searchAnc${idx}" style="display:none; margin-top:10px; animation: fadeIn 0.3s ease;">
                        ${locsHtml}
                    </div>
                </div>`;
            });
        }

        html += `</div>`;
        els.content.innerHTML = html;
    }

    function renderHabitats(list, accentColor) {
        const byReg = {};
        list.forEach(l => { if (!byReg[l.region]) byReg[l.region] = []; byReg[l.region].push(l); });
        let h = '';
        for (const reg in byReg) {
            h += `
            <div class="region-section" style="margin-bottom:15px; padding:15px; background:rgba(40,40,80,0.4); border-radius:10px;">
                <h5 style="margin:0 0 10px 0; color:var(--primary);"><i class="fas fa-map-marker-alt"></i> ${regionNames[reg] || reg}</h5>
                <div style="display:grid; gap:8px;">
                    ${byReg[reg].map(l => `
                        <div style="padding:10px; background:rgba(255,255,255,0.05); border-radius:8px; border-left:3px solid ${accentColor}; display:flex; justify-content:space-between; align-items:center;">
                            <div>
                                <strong style="color:white;">${l.ru_name}</strong>
                                <div style="font-size:0.85rem; color:var(--text-muted);">
                                    Ур. ${l.info.min_level}-${l.info.max_level} • ${l.info.rarity === 0 ? 'О' : 'Р' + l.info.rarity} ${l.info.conditions ? '⏰' : ''}
                                </div>
                            </div>
                            <button class="loc-info-btn" onclick="openLocationModal('${l.name}')" title="Информация о локации" style="width:34px; height:34px; border-radius:50%; border:none; background:rgba(78,205,196,0.15); color:var(--primary); cursor:pointer; transition:var(--transition); display:flex; align-items:center; justify-content:center; font-size:1rem; flex-shrink:0;">
                                📍
                            </button>
                        </div>`).join('')}
                </div>
            </div>`;
        }
        return h;
    }

    function formatItemSticker(stickerStr) {
        if (!stickerStr) return '';
        
        // Normalize sticker string: remove ALL invisible Unicode characters
        // FE0F = emoji presentation selector, FE0E = text presentation selector
        // 200B = zero-width space, 200C = ZWNJ, 200D = ZWJ, FEFF = BOM/ZWNBS
        // 00A0 = non-breaking space, 00AD = soft hyphen
        // 2060 = word joiner, 2061-2064 = invisible operators
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
                    const content = formatTextWithEmojis(char); 
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
        return formatTextWithEmojis(stickerStr);
    }

    function formatTextWithEmojis(text) {
        if (!text) return '';
        if (!window.emojiCombosData) return text;
        
        let result = text;
        // Сначала заменяем точные совпадения (включая многосимвольные комбо из JSON)
        for (const [emoji, path] of Object.entries(window.emojiCombosData)) {
            if (result.includes(emoji)) {
                const imgHtml = `<img src="${path}" class="emoji-img" alt="${emoji}" style="width: 1.25em; height: 1.25em; vertical-align: middle; margin: 0 1px;">`;
                result = result.split(emoji).join(imgHtml);
            }
        }
        return result;
    }

    function formatItemStringWithFlip(itemText) {
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
                const formattedSticker = window.formatItemSticker ? window.formatItemSticker(leadingSticker) : formatItemSticker(leadingSticker);
                const formattedText = window.formatTextWithEmojis ? window.formatTextWithEmojis(remainingText.trim()) : formatTextWithEmojis(remainingText.trim());
                return `<span style="display:inline-flex; align-items:center; gap:8px; vertical-align: middle;">
                    <span class="item-result-sticker" style="display:inline-flex; min-width:1.5em; justify-content:center; flex-shrink:0;">${formattedSticker}</span>
                    <span>${formattedText}</span>
                </span>`;
            }
        }
        return window.formatTextWithEmojis ? window.formatTextWithEmojis(itemText) : formatTextWithEmojis(itemText);
    }

    window.formatItemSticker = formatItemSticker;
    window.formatTextWithEmojis = formatTextWithEmojis;
    window.formatItemStringWithFlip = formatItemStringWithFlip;
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
                    window.emojiCombosData[cleanKey] = raw[k];
                    const sortedKey = Array.from(cleanKey).sort().join('');
                    window.emojiCombosSorted[sortedKey] = raw[k];
                }
            }
        } catch(e) { console.error("Error loading emoji combos", e); }
    };

    function renderItemOutput(itemKey, rawQuery, itemObj, habitats, messageHtml = '') {
        let titleName = itemObj ? itemObj.RuName || itemObj.Name : rawQuery;
        let engName = itemObj && itemObj.Name ? `<span style="display:block; font-size:0.7em; color:var(--text-muted); margin-top:4px; line-height:1.2;">${itemObj.Name}</span>` : '';
        let rawSticker = itemObj && itemObj.Sticker ? itemObj.Sticker : '🎒';
        let sticker = formatItemSticker(rawSticker);
        let desc = '';
        if (itemObj && itemObj.Description) {
            desc = `
            <div style="padding:15px 15px 25px 15px; background:rgba(255,255,255,0.05); border-radius:10px; margin-bottom:20px; line-height:1.5; position:relative;">
                ${formatTextWithEmojis(itemObj.Description)}
                ${itemObj.num_id ? `<div style="position: absolute; bottom: 5px; right: 10px; font-size: 0.75rem; color: rgba(255,255,255,0.3);">ID: ${itemObj.num_id}</div>` : ''}
            </div>`;
        }

        let infoButton = (itemKey && typeof openItemInfo === 'function') ? `
            <button class="item-info-btn" onclick="openItemInfo('${itemKey}')" title="Открыть инфо" style="width:38px; height:38px; border-radius:50%; border:none; background:rgba(78,205,196,0.25); color:var(--primary); cursor:pointer; transition:var(--transition); display:flex; align-items:center; justify-content:center; font-size:1.1rem; flex-shrink:0;">
                <i class="fas fa-info-circle"></i>
            </button>
        ` : '';

        els.title.innerHTML = `<div style="display:flex; flex-direction:column;"><div style="display:flex; align-items:center; gap:8px;"><i class="fas fa-search"></i> ${sticker} ${titleName}</div>${engName}</div>`;

        let html = `<div style="padding:10px;">
                        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:15px;">
                            <h2 style="color:var(--primary); margin:0; display:flex; align-items:center; gap:10px;">
                                <span class="item-result-sticker" style="display:inline-flex; min-width:1.5em; justify-content:center;">${sticker}</span>
                                <span>${titleName}</span>
                            </h2>
                            ${infoButton}
                        </div>
                        ${desc}
                        ${messageHtml}
                        ${habitats.length > 0 ? `<div style="margin-bottom:15px; color:var(--text-muted);">📍 Найдено в следующих локациях:</div>` : ''}
                   `;

        // Группируем по региону
        const byReg = {};
        habitats.forEach(h => {
            const r = h.regionRaw || h.region;
            if (!byReg[r]) byReg[r] = [];
            byReg[r].push(h);
        });

        for (const reg in byReg) {
            html += `
            <div class="region-section" style="margin-bottom:15px; padding:15px; background:rgba(40,40,80,0.4); border-radius:10px;">
                <h5 style="margin:0 0 10px 0; color:var(--primary);"><i class="fas fa-map-marker-alt"></i> ${regionNames[reg] || reg}</h5>
                <div style="display:grid; gap:8px;">
                    ${byReg[reg].map(l => {
                        const ext = window.extractLocationIcon ? window.extractLocationIcon(l.ru_name || l.name || 'Неизвестно', l.type) : {icon: '📍', name: l.ru_name || l.name || 'Неизвестно'};
                        return `
                        <div class="loc-clickable" data-loc="${l.name}" style="padding:10px; background:rgba(255,255,255,0.05); border-radius:8px; border-left:3px solid var(--primary); display:flex; justify-content:space-between; align-items:center; cursor:pointer; transition:0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.1)'; this.style.transform='translateX(3px)';" onmouseout="this.style.background='rgba(255,255,255,0.05)'; this.style.transform='none';" onclick="if(typeof openLightLocationModal==='function') openLightLocationModal('${l.name}')">
                            <div style="display:flex; flex-direction:column; gap:4px;">
                                <strong style="color:white; display:flex; align-items:center; gap:6px;"><span style="font-size:1.2rem;">${ext.icon}</span> ${ext.name}</strong>
                                <div style="font-size:0.85rem; color:var(--text-muted);">${window.formatItemStringWithFlip(l.rawItemString)}</div>
                            </div>
                        </div>`;
                    }).join('')}
                </div>
            </div>`;
        }

        html += `</div>`;
        els.content.innerHTML = html;
    }

    function renderError(msg) {
        els.content.innerHTML = `<div style="text-align:center; padding:30px; color:#ff6b6b;">${msg}</div>`;
    }

    function buildServiceLists() {
        if (!locationData) return;
        const c = {};
        for (const id in locationData) {
            const l = locationData[id];
            if (l.has_pokecenter && l.has_pokemart) {
                (c[l.region] = c[l.region] || []).push({name: l.ru_name, rawName: id, type: l.type});
            }
        }

        const render = (d) => { 
            let h = ''; 
            for (const r in d) {
                h += `<div class="region-locations"><h4>${regionNames[r] || r}</h4><div class="locations-grid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap:10px;">`;
                h += d[r].map(x => {
                    const ext = window.extractLocationIcon ? window.extractLocationIcon(x.name, x.type) : {icon: '📍', name: x.name};
                    return `
                    <div class="location-item loc-clickable" data-loc="${x.rawName}" style="cursor:pointer; display:flex; align-items:center; gap:15px; position:relative; overflow:hidden; transition:0.2s; padding:12px 15px; background:rgba(255,255,255,0.05); border-left:4px solid var(--primary); border-radius:12px;" onmouseover="this.style.background='rgba(255,255,255,0.1)'; this.style.transform='translateX(5px)';" onmouseout="this.style.background='rgba(255,255,255,0.05)'; this.style.transform='none';" onclick="if(typeof openLightLocationModal==='function') openLightLocationModal('${x.rawName}')">
                        <div style="font-size: 1.5rem; background: rgba(0,0,0,0.3); width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 50%; box-shadow: 0 4px 10px rgba(0,0,0,0.5); flex-shrink: 0;">${ext.icon}</div>
                        <div style="font-weight: bold; font-size: 1.05rem; color: #fff;">${ext.name}</div>
                    </div>
                `}).join('');
                h += `</div></div>`; 
            }
            return h; 
        };
        if (els.centers) {
            els.centers.innerHTML = render(c);
        }
    }

    // === СОБЫТИЯ ===
    els.btn.addEventListener('click', (e) => { 
        if(e.isTrusted) window.currentSliderState = 0; 
        startSearch(); 
    });
    els.input.addEventListener('keypress', (e) => { 
        if (e.key === 'Enter' && !document.querySelector('.autocomplete-active')) { 
            if(e.isTrusted) window.currentSliderState = 0; 
            startSearch(); 
        } 
    });

    // === АВТОДОПОЛНЕНИЕ (AUTOCOMPLETE) ===
    let autocompleteBox = document.createElement('div');
    autocompleteBox.setAttribute('class', 'autocomplete-items');
    els.input.parentNode.appendChild(autocompleteBox);

    let currentFocus = -1;
    let autocompleteTimeout = null;

    els.input.addEventListener('input', function() {
        if (autocompleteTimeout) clearTimeout(autocompleteTimeout);
        let val = this.value.trim().toLowerCase();
        val = val.replace(/⭐️/g, '').trim(); // Игнорируем шайни звездочку при автокомплите
        autocompleteBox.innerHTML = '';
        autocompleteBox.classList.remove('active');
        if (!val) return;

        autocompleteTimeout = setTimeout(() => {

        const activeType = document.querySelector('.search-option.active')?.dataset.type || 'pokemon';
        let matches = [];
        let addedIds = new Set();

        if (activeType === 'item') {
            if (!window.itemsData) return;
            const norm = str => str.toLowerCase().replace(/ё/g, 'е').replace(/тм/g, 'tm').replace(/нм/g, 'hm').replace(/[^а-яa-z0-9]/g, '');
            const normVal = norm(val);
            
            for (let key in window.itemsData) {
                const it = window.itemsData[key];
                const ruN = it.RuName ? norm(it.RuName) : '';
                const enN = it.Name ? norm(it.Name) : '';
                
                if (ruN.includes(normVal) || enN.includes(normVal) || (it.num_id && it.num_id.toString().includes(val))) {
                    if (!addedIds.has('item_'+key)) {
                        addedIds.add('item_'+key);
                        matches.push({
                            id: key,
                            text: it.RuName || it.Name,
                            subtext: it.RuName && it.Name ? it.Name : '',
                            idBadge: it.num_id ? 'ID: ' + it.num_id : '',
                            icon: '📦',
                            type: 'item'
                        });
                    }
                }
            }
        } else if (activeType === 'pokemon') {
            if (window.pokemonDB) {
                for (let id in window.pokemonDB) {
                    const p = window.pokemonDB[id];
                    const ruN = p.ru ? p.ru.toLowerCase() : '';
                    const enN = p.en ? p.en.toLowerCase() : '';
                    const numId = id.toString();
                    
                    if (ruN.includes(val) || enN.includes(val) || numId.includes(val)) {
                        if (!addedIds.has(id)) {
                            addedIds.add(id);
                            matches.push({
                                id: id,
                                text: p.ru || p.en,
                                subtext: p.ru && p.en ? p.en : '',
                                idBadge: '#' + numId.padStart(3, '0'),
                                icon: '🐾',
                                type: 'pokemon'
                            });
                        }
                    }
                }
            }
        } else if (activeType === 'other') {
            if (typeof npcSearchIndex !== 'undefined') {
                for (let key in npcSearchIndex) {
                    if (key.includes(val)) {
                        npcSearchIndex[key].forEach(n => {
                            const npcId = 'npc_' + n.name;
                            if (!addedIds.has(npcId)) {
                                addedIds.add(npcId);
                                matches.push({
                                    id: npcId,
                                    text: n.name,
                                    subtext: 'NPC',
                                    icon: '👤',
                                    type: 'npc',
                                    queryText: n.name
                                });
                            }
                        });
                    }
                }
            }
            if (window.locationData) {
                for (let locId in window.locationData) {
                    const loc = window.locationData[locId];
                    const ruN = loc.ru_name ? loc.ru_name.toLowerCase() : '';
                    const enN = loc.name ? loc.name.toLowerCase() : '';
                    const dN = loc.displayName ? loc.displayName.toLowerCase() : '';
                    if (ruN.includes(val) || enN.includes(val) || dN.includes(val)) {
                        if (!addedIds.has('loc_' + locId)) {
                            addedIds.add('loc_' + locId);
                            matches.push({
                                id: 'loc_' + locId,
                                text: loc.displayName || loc.ru_name || loc.name,
                                subtext: loc.ru_name && loc.name ? loc.name : 'Локация',
                                icon: '🗺️',
                                type: 'location',
                                queryText: loc.ru_name || loc.name,
                                region: loc.region,
                                description: loc.description
                            });
                        }
                    }
                }
            }
            for(let tKey in typeNamesRu) {
                if(typeNamesRu[tKey].toLowerCase().includes(val) || tKey.toLowerCase().includes(val)) {
                    if (!addedIds.has('type_' + tKey)) {
                        addedIds.add('type_' + tKey);
                        matches.push({
                            id: 'type_' + tKey,
                            text: typeNamesRu[tKey],
                            idBadge: 'Тип',
                            subtext: '', icon: typeIcons[tKey] || '✨', type: 'type',
                            queryText: 'тип ' + typeNamesRu[tKey]
                        });
                    }
                }
            }
            const validTiers = ['lc','nfe','iron','bronze','silver','gold','platinum','diamond','ascendant','uber','ultrauber'];
            validTiers.forEach(tier => {
                if(tier.includes(val) || ('тир ' + tier).includes(val)) {
                    if(!addedIds.has('tier_' + tier)) {
                        addedIds.add('tier_' + tier);
                        matches.push({
                            id: 'tier_' + tier,
                            text: tier.toUpperCase(),
                            idBadge: 'Тир',
                            subtext: '', icon: '🏆', type: 'tier',
                            queryText: 'тир ' + tier
                        });
                    }
                }
            });
            const validRarities = ['о', 'р1', 'р2', 'р3', 'р4', 'р5', 'р6', 'р7', 'р8', 'р9', 'р10'];
            validRarities.forEach(r => {
                if(r.includes(val) || ('редкость ' + r).includes(val)) {
                    if(!addedIds.has('rarity_' + r)) {
                        addedIds.add('rarity_' + r);
                        matches.push({
                            id: 'rarity_' + r,
                            text: r.toUpperCase(),
                            idBadge: 'Редкость',
                            subtext: '', icon: '✨', type: 'rarity',
                            queryText: 'редкость ' + r
                        });
                    }
                }
            });
            if (window.abilitiesData) {
                for (let aKey in window.abilitiesData) {
                    const ab = window.abilitiesData[aKey];
                    const ruN = ab.RuName ? ab.RuName.toLowerCase() : '';
                    const enN = ab.Name ? ab.Name.toLowerCase() : '';
                    if (ruN.includes(val) || enN.includes(val)) {
                        if (!addedIds.has('ability_' + aKey)) {
                            addedIds.add('ability_' + aKey);
                            matches.push({
                                id: 'ability_' + aKey,
                                text: (ab.RuName || ab.Name),
                                idBadge: 'Способность',
                                subtext: ab.RuName && ab.Name ? ab.Name : '',
                                icon: '🌟', type: 'ability',
                                queryText: 'способность ' + (ab.RuName || ab.Name)
                            });
                        }
                    }
                }
            }
            if (window.professionsData) {
                for (let pKey in window.professionsData) {
                    const pr = window.professionsData[pKey];
                    const ruN = pr.ru_name ? pr.ru_name.toLowerCase() : '';
                    if (ruN.includes(val) || pKey.toLowerCase().includes(val)) {
                        if (!addedIds.has('prof_' + pKey)) {
                            addedIds.add('prof_' + pKey);
                            matches.push({
                                id: 'prof_' + pKey,
                                text: pr.ru_name,
                                idBadge: 'Профессия',
                                subtext: '', icon: '💼', type: 'profession',
                                queryText: 'профессия ' + pr.ru_name.replace(/^[^\p{L}]+/gu, '').trim()
                            });
                        }
                    }
                }
            }
        }

        const isNumeric = /^\d+$/.test(val);
        const valIntStr = isNumeric ? parseInt(val, 10).toString() : "";
        
        const typePriority = {
            'type': 1,
            'tier': 2,
            'rarity': 3,
            'npc': 4,
            'location': 5,
            'pokemon': 6,
            'item': 7
        };

        matches.sort((a, b) => {
            const pA = typePriority[a.type] || 99;
            const pB = typePriority[b.type] || 99;
            if (pA !== pB) return pA - pB;

            if (isNumeric) {
                const aIdNum = a.idBadge ? a.idBadge.replace(/\D/g, '') : "";
                const aIdIntStr = aIdNum ? parseInt(aIdNum, 10).toString() : "";
                const bIdNum = b.idBadge ? b.idBadge.replace(/\D/g, '') : "";
                const bIdIntStr = bIdNum ? parseInt(bIdNum, 10).toString() : "";
                
                const aIdExact = (aIdIntStr === valIntStr) ? 1 : 0;
                const bIdExact = (bIdIntStr === valIntStr) ? 1 : 0;
                if (aIdExact !== bIdExact) return bIdExact - aIdExact;
                
                const aIdStarts = aIdIntStr.startsWith(valIntStr) ? 1 : 0;
                const bIdStarts = bIdIntStr.startsWith(valIntStr) ? 1 : 0;
                if (aIdStarts !== bIdStarts) return bIdStarts - aIdStarts;
            }

            const aText = (a.text || "").toString().toLowerCase();
            const bText = (b.text || "").toString().toLowerCase();
            const aqText = (a.queryText || "").toString().toLowerCase();
            const bqText = (b.queryText || "").toString().toLowerCase();
            
            const aStarts = (aText.startsWith(val) || aqText.startsWith(val)) ? 1 : 0;
            const bStarts = (bText.startsWith(val) || bqText.startsWith(val)) ? 1 : 0;
            
            if (aStarts !== bStarts) return bStarts - aStarts;
            return aText.length - bText.length || aText.localeCompare(bText);
        });

        matches = matches.slice(0, 15);

        if (matches.length > 0) {
            matches.forEach(m => {
                let div = document.createElement('div');
                div.className = 'autocomplete-item';
                // Подсветка совпадений
                let regex = new RegExp("(" + val.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + ")", "gi");
                let safeText = (m.text || "").toString();
                let highlightedText = safeText.replace(regex, "<span style='color:var(--primary);font-weight:bold;'>$1</span>");
                
                let descHtml = m.description ? `<div class="autocomplete-desc" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 0.8rem; color: rgba(255,255,255,0.6); margin-top: 2px; max-width: 100%;">${m.description}</div>` : '';
                let regionHtml = m.region ? `<span class="region-badge badge-${m.region.toLowerCase()}">${m.region}</span>` : '';
                let idBadgeHtml = '';
                if (m.idBadge) {
                    if (m.idBadge.startsWith('#') || m.idBadge.startsWith('ID:')) {
                        idBadgeHtml = `<span style="color: var(--primary); font-size: 0.9rem; font-weight: bold; margin-right: 8px; opacity: 0.9; white-space: nowrap;">${m.idBadge}</span>`;
                    } else {
                        let badgeBg = 'rgba(78, 205, 196, 0.2)';
                        let badgeBorder = 'rgba(78, 205, 196, 0.4)';
                        let badgeColor = 'var(--primary)';
                        
                        if (m.type === 'ability') { badgeBg = 'rgba(255, 215, 0, 0.2)'; badgeBorder = 'rgba(255, 215, 0, 0.4)'; badgeColor = '#ffd700'; }
                        else if (m.type === 'tier') { badgeBg = 'rgba(255, 99, 71, 0.2)'; badgeBorder = 'rgba(255, 99, 71, 0.4)'; badgeColor = '#ff6347'; }
                        else if (m.type === 'type') { badgeBg = 'rgba(135, 206, 250, 0.2)'; badgeBorder = 'rgba(135, 206, 250, 0.4)'; badgeColor = '#87cefa'; }
                        else if (m.type === 'rarity') { badgeBg = 'rgba(147, 112, 219, 0.2)'; badgeBorder = 'rgba(147, 112, 219, 0.4)'; badgeColor = '#9370db'; }
                        else if (m.type === 'profession') { badgeBg = 'rgba(255, 105, 180, 0.2)'; badgeBorder = 'rgba(255, 105, 180, 0.4)'; badgeColor = '#ff69b4'; }

                        idBadgeHtml = `<span style="background: ${badgeBg}; color: ${badgeColor}; border: 1px solid ${badgeBorder}; font-size: 0.7rem; font-weight: bold; text-transform: uppercase; padding: 2px 6px; border-radius: 4px; margin-right: 8px; white-space: nowrap; flex-shrink: 0;">${m.idBadge}</span>`;
                    }
                }
                
                div.innerHTML = `
                    <div class="autocomplete-icon">${m.icon}</div>
                    <div class="autocomplete-content">
                        <div class="autocomplete-header">
                            ${idBadgeHtml}
                            <div class="autocomplete-text">${highlightedText}</div>
                            ${regionHtml}
                            <div class="autocomplete-subtext" style="margin-left:auto;">${m.subtext}</div>
                        </div>
                        ${descHtml}
                    </div>
                `;
                div.addEventListener('click', function() {
                    const shinyPrefix = els.input.value.includes('⭐️') ? '⭐️ ' : '';
                    els.input.value = shinyPrefix + (m.queryText || m.text);
                    autocompleteBox.innerHTML = '';
                    autocompleteBox.classList.remove('active');
                    window.currentSliderState = 0; // Сбрасываем ползунок по центру при новом поиске
                    startSearch();
                });
                autocompleteBox.appendChild(div);
            });
            autocompleteBox.classList.add('active');
            currentFocus = -1;
        }
        }, 150); // задержка в 150мс
    });

    els.input.addEventListener('keydown', function(e) {
        let items = autocompleteBox.querySelectorAll('.autocomplete-item');
        if (e.key === 'ArrowDown') {
            currentFocus++;
            addActive(items);
        } else if (e.key === 'ArrowUp') {
            currentFocus--;
            addActive(items);
        } else if (e.key === 'Enter') {
            if (currentFocus > -1) {
                e.preventDefault();
                items[currentFocus].click();
            }
        }
    });

    function addActive(items) {
        if (!items || items.length === 0) return false;
        removeActive(items);
        if (currentFocus >= items.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = (items.length - 1);
        items[currentFocus].classList.add('autocomplete-active');
        items[currentFocus].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    function removeActive(items) {
        for (let i = 0; i < items.length; i++) {
            items[i].classList.remove('autocomplete-active');
        }
    }

    document.addEventListener('click', function(e) {
        if (e.target !== els.input && !autocompleteBox.contains(e.target)) {
            autocompleteBox.innerHTML = '';
            autocompleteBox.classList.remove('active');
        }
    });
    els.close.addEventListener('click', () => {
        els.container.style.display = 'none';
        if (els.overlay) els.overlay.classList.remove('active');
        document.body.style.overflow = '';
    });

    if (els.overlay) {
        els.overlay.addEventListener('click', () => {
            els.container.style.display = 'none';
            els.overlay.classList.remove('active');
            document.body.style.overflow = '';
        });
    }

    els.opts.forEach(opt => {
        opt.addEventListener('click', function () {
            els.opts.forEach(o => o.classList.remove('active'));
            this.classList.add('active');
            const t = this.dataset.type;

            if (t === 'pokemon' || t === 'item' || t === 'other') {
                if (els.box) els.box.classList.remove('hidden');
            } else {
                if (els.box) els.box.classList.add('hidden');
            }
            
            const hintsContainer = document.getElementById('searchHintsContainer');
            if (hintsContainer) hintsContainer.classList.remove('hidden');

            if (els.centers) els.centers.classList.toggle('active', t === 'centers');

            if (els.hint) els.hint.textContent = hintTexts[t] || '';
            const shinyHint = document.getElementById('shinyHint');
            if(shinyHint) {
                 shinyHint.style.display = (t === 'pokemon') ? 'block' : 'none';
            }
        });
    });
});

// Добавляем стиль для спиннера автоматически
const s = document.createElement('style');
s.textContent = `.loading-spinner { width: 50px; height: 50px; border: 5px solid rgba(78,205,196,0.2); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite; margin: 30px auto; } @keyframes spin { to { transform: rotate(360deg); } } .hidden { display: none !important; }`;
document.head.appendChild(s);

window.toggleProfSort = function() {
    window.profSortState = (window.profSortState + 1) % 5;
    document.getElementById('profResultsContainer').innerHTML = window.generateProfessionHTML();
};

window.toggleProfLoc = function() {
    window.profLocState = (window.profLocState + 1) % 2;
    document.getElementById('profResultsContainer').innerHTML = window.generateProfessionHTML();
};

window.toggleProfAbil = function() {
    window.profAbilState = !window.profAbilState;
    document.getElementById('profResultsContainer').innerHTML = window.generateProfessionHTML();
};

window.generatePokemonCardHTML = function(m, isShinySearch, customBadgeHtml = null) {
    let badgeText = '';
    let type1 = '', type2 = '';
    if (m.p.type && m.p.type.length > 0) {
        badgeText = m.p.type.map(t => typeIcons && typeIcons[t.toLowerCase()] ? typeIcons[t.toLowerCase()] : '✨').join(' ');
        type1 = m.p.type[0].toLowerCase();
        if (m.p.type.length > 1) type2 = m.p.type[1].toLowerCase();
    } else {
        badgeText = '✨';
    }
    
    let glowStyle = `background: linear-gradient(135deg, rgba(40,40,60,0.9), rgba(20,20,30,0.9)); border: 2px solid rgba(255,255,255,0.1);`;
    let hoverStyle = `this.style.borderColor='var(--primary)';`;
    let hoverOutStyle = `this.style.borderColor='rgba(255,255,255,0.1)';`;

    if (type1 && typeof typeColors !== 'undefined') {
        let c1 = typeColors[type1] || '#aaaaaa';
        if (type1 === 'dark') c1 = '#6a5a75';
        if (c1.length === 9) c1 = c1.substring(0, 7);
        
        if (type2) {
            let c2 = typeColors[type2] || '#aaaaaa';
            if (type2 === 'dark') c2 = '#6a5a75';
            if (c2.length === 9) c2 = c2.substring(0, 7);
            
            glowStyle = `background: linear-gradient(135deg, ${c1}33, ${c2}33, rgba(20,20,30,0.95)); border: 2px solid ${c1}40; box-shadow: 0 0 10px ${c1}15, inset 0 0 15px ${c2}15;`;
            hoverStyle = `this.style.borderColor='${c1}'; this.style.boxShadow='0 0 20px ${c1}66, inset 0 0 20px ${c2}66';`;
            hoverOutStyle = `this.style.borderColor='${c1}40'; this.style.boxShadow='0 0 10px ${c1}15, inset 0 0 15px ${c2}15';`;
        } else {
            glowStyle = `background: linear-gradient(135deg, ${c1}44, rgba(20,20,30,0.95)); border: 2px solid ${c1}40; box-shadow: 0 0 10px ${c1}15, inset 0 0 15px ${c1}15;`;
            hoverStyle = `this.style.borderColor='${c1}'; this.style.boxShadow='0 0 20px ${c1}66, inset 0 0 20px ${c1}66';`;
            hoverOutStyle = `this.style.borderColor='${c1}40'; this.style.boxShadow='0 0 10px ${c1}15, inset 0 0 15px ${c1}15';`;
        }
    }
    
    const safeEn = m.p.en.toUpperCase().replace(/'/g, "\\'");
    const safeRu = (m.p.ru || m.p.en).replace(/'/g, "\\'");
    const isInPages = window.location.pathname.includes('/pages/');
    
    let imgSrc = '';
    if (m.isForm && m.formObj) {
        imgSrc = isShinySearch ? m.formObj.ShinySpritePath : m.formObj.SpritePath;
        if (imgSrc) {
            if (isInPages && imgSrc.startsWith('shared/assets/')) imgSrc = '../' + imgSrc.replace('shared/assets/', '');
            else if (!isInPages && imgSrc.startsWith('shared/assets/')) imgSrc = imgSrc.replace('shared/assets/', '');
        } else {
            imgSrc = `${isInPages ? '../' : ''}home/${isShinySearch ? 'shiny/' : ''}${parseInt(m.id)}.png`;
        }
    } else {
        imgSrc = `${isInPages ? '../' : ''}home/${isShinySearch ? 'shiny/' : ''}${parseInt(m.id)}.png`;
    }

    let dispRu = m.p.ru || m.p.en;
    let dispEn = m.p.en;
    if (m.isForm && m.p.formRu) {
        if (typeof window.translateFormName === 'function') {
            let trans = window.translateFormName(m.p.formRu, dispRu, dispEn);
            dispRu = trans.ru;
            dispEn = trans.en;
        } else {
            if (m.p.formRu.toLowerCase().includes(m.p.en.toLowerCase())) {
                dispRu = m.p.formRu.replace(new RegExp(m.p.en, 'ig'), dispRu);
                dispEn = m.p.formRu;
                dispRu = dispRu.replace(/^Mega\b/i, 'Мега-').replace(/^Alolan\b/i, 'Алола').replace(/^Galarian\b/i, 'Галар');
            } else {
                dispRu = `${dispRu} (${m.p.formRu})`;
                dispEn = `${dispEn} (${m.p.formRu})`;
            }
        }
    } else {
        const ruEntry = window.pokemonRuData && window.pokemonRuData[m.p.en.toUpperCase()];
        if (ruEntry && ruEntry.FormName) {
            if (typeof window.translateFormName === 'function') {
                let trans = window.translateFormName(ruEntry.FormName, dispRu, dispEn);
                dispRu = trans.ru;
                dispEn = trans.en;
            } else {
                dispRu = `${dispRu} (${ruEntry.FormName})`;
                dispEn = `${dispEn} (${ruEntry.FormName})`;
            }
        }
    }
    
    const pNameRu = isShinySearch ? `⭐️${dispRu}⭐️` : dispRu;
    const pNameEn = isShinySearch ? `⭐️${dispEn}⭐️` : dispEn;
    
    const onClickCode = m.isForm 
        ? `typeof openPokemonDossier === 'function' ? openPokemonDossier('${safeEn}', window.isShinyToggleActive, ${m.formIndex}) : (document.getElementById('pokemonSearch').value='${safeEn}', document.getElementById('searchButton').click())`
        : `typeof openPokemonDossier === 'function' ? openPokemonDossier('${safeEn}', window.isShinyToggleActive) : (document.getElementById('pokemonSearch').value='${safeEn}', document.getElementById('searchButton').click())`;
    
    let haBadge = '';
    if (m.isHA) {
        haBadge = `<div style="position: absolute; top: -8px; left: 50%; transform: translateX(-50%); background: rgba(255, 71, 87, 0.9); color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.65rem; font-weight: bold; border: 1px solid rgba(255,255,255,0.3); z-index: 5; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.5);" title="Скрытая способность">Скрытая</div>`;
    }

    return `<div class="poke-trading-card" data-id="${m.id}" data-en="${safeEn}" data-ru="${safeRu}" data-inpages="${isInPages}" data-isform="${m.isForm ? 'true' : 'false'}" data-sprite="${m.formObj ? m.formObj.SpritePath : ''}" data-shinysprite="${m.formObj ? m.formObj.ShinySpritePath : ''}" style="${glowStyle} border-radius: 12px; padding: 10px; width: 140px; text-align: center; position: relative; cursor: pointer; transition: 0.2s; display: flex; flex-direction: column;" 
         onmouseover="this.style.transform='scale(1.05)'; ${hoverStyle}" 
         onmouseout="this.style.transform='none'; ${hoverOutStyle}" 
         onclick="${onClickCode}">
        ${haBadge}
        <div style="position: absolute; top: 8px; left: 8px; background: rgba(0,0,0,0.6); padding: 2px 6px; border-radius: 10px; font-size: 0.75rem; font-weight: bold; color: #fff; z-index: 2;">#${m.id.padStart(3, '0')}</div>
        <div style="position: absolute; top: 8px; right: 8px; background: rgba(0,0,0,0.6); padding: 2px 6px; border-radius: 10px; font-size: 0.8rem; z-index: 2;">${badgeText}</div>
        <img class="poke-card-img" src="${imgSrc}" style="width: 80px; height: 80px; object-fit: contain; margin: 20px auto 0 auto; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.5)); z-index: 1;" onerror="this.src='images/items/0.png'">
        ${customBadgeHtml || ''}
        <div class="poke-card-name-ru" style="margin-top: auto; padding-top: 10px; font-weight: bold; color: #fff; font-size: 0.95rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.1;">${pNameRu}</div>
        <div class="poke-card-name-en" style="font-size: 0.75rem; color: #aaa; margin-top: 2px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.1;">${pNameEn}</div>
    </div>`;
};

window.generateProfessionHTML = function() {
    const isShiny = window.isShinyToggleActive;
    let list = [];
    
    // Получаем список разрешенных видов с локаций, если включен фильтр
    let allowedSpecies = new Set();
    if (window.profLocState === 1 && window.currentLocationMatches) {
        for (const reg in window.currentLocationMatches) {
            window.currentLocationMatches[reg].forEach(locItem => {
                locItem.speciesNames.forEach(sName => allowedSpecies.add(sName));
            });
        }
    }

    // Собираем данные
    window.currentPokemonMatches.forEach(m => {
        let dispRu = m.p.ru || m.p.en;
        let dispEn = m.p.en;
        if (m.isForm && m.p.formRu) {
            if (typeof window.translateFormName === 'function') {
                let trans = window.translateFormName(m.p.formRu, dispRu, dispEn);
                dispRu = trans.ru;
            } else {
                dispRu = m.p.formRu.toLowerCase().includes(m.p.en.toLowerCase()) ? m.p.formRu.replace(new RegExp(m.p.en, 'ig'), dispRu) : `${dispRu} (${m.p.formRu})`;
            }
        } else {
            const ruEntry = window.pokemonRuData && window.pokemonRuData[m.p.en.toUpperCase()];
            if (ruEntry && ruEntry.FormName) {
                if (typeof window.translateFormName === 'function') {
                    dispRu = window.translateFormName(ruEntry.FormName, dispRu, dispEn).ru;
                } else {
                    dispRu = `${dispRu} (${ruEntry.FormName})`;
                }
            }
        }

        if (window.profLocState === 1 && !allowedSpecies.has(dispRu)) return;

        let effs = window.calculateProfessionEfficiency(m.p, m.formObj, window.currentProfessionKey, window.abilitiesData);
        
        if (effs.length === 0) return;

        if (window.profAbilState) {
            // Комбо способностей вкл
            effs.forEach(eff => {
                let cloneM = JSON.parse(JSON.stringify(m));
                let total = eff.total + (isShiny ? 10 : 0);
                list.push({ m: cloneM, total: total, eff: eff, name: dispRu });
            });
        } else {
            // Только максимум
            let maxEff = effs.reduce((prev, current) => (prev.total > current.total) ? prev : current);
            let total = maxEff.total + (isShiny ? 10 : 0);
            list.push({ m: m, total: total, eff: maxEff, name: dispRu });
        }
    });

    // Сортировка (0=ID, 1=Best, 2=Worst, 3=Alpha, 4=Availability)
    if (window.profSortState === 1) {
        list.sort((a, b) => b.total - a.total || a.m.id - b.m.id);
    } else if (window.profSortState === 2) {
        list.sort((a, b) => a.total - b.total || a.m.id - b.m.id);
    } else if (window.profSortState === 3) {
        list.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
    } else if (window.profSortState === 4) {
        list.forEach(item => {
            if (item.minR === undefined) {
                let sp = item.m.p.en.toUpperCase();
                let fIdx = item.m.formIndex;
                let minR = 99;
                if (window.locationData) {
                    for (const locId in window.locationData) {
                        const l = window.locationData[locId];
                        if (l.encounters) {
                            l.encounters.forEach(e => {
                                if (e.species && e.species.toUpperCase() === sp) {
                                    let eForm = e.form || 0;
                                    let targetForm = fIdx === null ? 0 : fIdx + 1;
                                    if (eForm === targetForm) {
                                        let r = e.rarity !== undefined ? e.rarity : 0;
                                        if (r < minR) minR = r;
                                    }
                                }
                            });
                        }
                    }
                }
                item.minR = minR;
            }
        });
        list.sort((a, b) => a.minR - b.minR || b.total - a.total || a.m.id - b.m.id);
    } else {
        list.sort((a, b) => parseInt(a.m.id) - parseInt(b.m.id));
    }

    // UI сортировки
    const sortIcons = ['🔢 По номеру', '⬇️💪 От сильных', '⬆️💪 От слабых', '🔠 По имени', '🟢 По доступности'];
    const locIcons = ['🌐 Все покемоны', '📍 Из дикой природы'];
    
    let uiHtml = `<div id="profResultsContainer"><div style="display:flex; flex-wrap:wrap; gap:10px; justify-content:center; margin-bottom: 20px; background: rgba(0,0,0,0.2); padding: 15px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
        <button onclick="window.toggleProfSort()" style="background: rgba(255,255,255,0.1); border: none; padding: 8px 15px; color: #fff; border-radius: 8px; cursor: pointer; transition: 0.2s; font-weight: bold; box-shadow: 0 4px 6px rgba(0,0,0,0.3);" onmouseover="this.style.background='rgba(255,255,255,0.2)'" onmouseout="this.style.background='rgba(255,255,255,0.1)'">
            ${sortIcons[window.profSortState]}
        </button>
        <button onclick="window.toggleProfLoc()" style="background: rgba(255,255,255,0.1); border: none; padding: 8px 15px; color: #fff; border-radius: 8px; cursor: pointer; transition: 0.2s; font-weight: bold; box-shadow: 0 4px 6px rgba(0,0,0,0.3);" onmouseover="this.style.background='rgba(255,255,255,0.2)'" onmouseout="this.style.background='rgba(255,255,255,0.1)'">
            ${locIcons[window.profLocState]}
        </button>
        <div style="display:flex; align-items:center; gap:8px; background: rgba(255,255,255,0.05); padding: 5px 15px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);">
            <span style="color:#ccc; font-size:0.9rem; font-weight:bold;">✨ Комбо способностей</span>
            <label style="position:relative; display:inline-block; width:40px; height:20px; margin:0;">
                <input type="checkbox" ${window.profAbilState ? 'checked' : ''} onchange="window.toggleProfAbil()" style="opacity:0; width:0; height:0;">
                <span style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:${window.profAbilState ? 'var(--primary)' : '#555'}; transition:.4s; border-radius:34px;">
                    <span style="position:absolute; content:''; height:14px; width:14px; left:3px; bottom:3px; background-color:white; transition:.4s; border-radius:50%; transform:${window.profAbilState ? 'translateX(20px)' : 'translateX(0)'};"></span>
                </span>
            </label>
        </div>
    </div>`;

    uiHtml += `<div style="display:flex; flex-wrap:wrap; gap:15px; justify-content:center;">`;
    if (list.length === 0) {
        uiHtml += `<div style="text-align:center; color:#aaa; padding:20px;">Покемонов не найдено.</div>`;
    } else {
        list.forEach(item => {
            let reasonsTitle = item.eff.reasons.join(' | ');
            if (isShiny) reasonsTitle += ' | Шайни: +10%';
            if (!reasonsTitle) reasonsTitle = 'Нет бонусов';
            
            let color = item.total > 0 ? 'var(--primary)' : '#888';
            let bg = item.total > 0 ? 'rgba(78, 205, 196, 0.2)' : 'rgba(0,0,0,0.5)';
            
            let customBadge = `<div title="${reasonsTitle}" style="align-self: flex-end; margin-top: -10px; margin-right: -5px; position: relative; z-index: 10; background: ${bg}; color: ${color}; padding: 4px 10px; border-radius: 20px; font-size: 0.8rem; font-weight: bold; border: 2px solid ${color}; box-shadow: 0 2px 5px rgba(0,0,0,0.5);">
                +${item.total}%
            </div>`;
            
            if (window.profAbilState) {
                let abilName = item.eff.ability;
                if (abilName && window.abilitiesData) {
                    let cAbil = abilName.replace(/\s+/g, '').toUpperCase();
                    let aObj = Object.values(window.abilitiesData).find(a => 
                        (a.Name||'').replace(/\s+/g, '').toUpperCase() === cAbil || 
                        (a.en_name||'').replace(/\s+/g, '').toUpperCase() === cAbil || 
                        (a.Name||'').toUpperCase() === abilName.toUpperCase()
                    );
                    if (aObj && aObj.RuName) abilName = aObj.RuName;
                }
                customBadge += `<div style="position:absolute; bottom: -8px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.8); color: #fff; padding: 2px 8px; border-radius: 10px; font-size: 0.65rem; border: 1px solid rgba(255,255,255,0.2); white-space: nowrap; z-index: 5;">${abilName || 'Без таланта'}</div>`;
            }

            uiHtml += window.generatePokemonCardHTML(item.m, isShiny, customBadge);
        });
    }
    uiHtml += `</div></div>`;
    return uiHtml;
};
