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
        cont.style.display = 'block';
        box.innerHTML = `<div style="color:#ff6b6b; padding:15px; border:2px solid red; background:rgba(0,0,0,0.9); border-radius:10px;">
            <h3 style="margin-top:0;">💥 КРИТИЧЕСКАЯ ОШИБКА:</h3>
            <p>${msg}</p>
            <small>Скорее всего, пропущена запятая в JSON файле (строка ${line})</small>
        </div>`;
    }
    return false;
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
        centers: document.getElementById('pokecenterList'),
        marts: document.getElementById('pokemartList'),
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
        'item': 'Например: Чёрный пояс, Уголёк, Травяная броня, item_996, 996',
        'pokecenter': 'Список локаций, где присутствует Покецентр',
        'pokemart': 'Список локаций, где присутствует Магазин'
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
                fetch('json/pokemon_names.json'),
                fetch('json/locations.json'),
                fetch('json/pokemon_ru.json'),
                fetch('json/professions.json'),
                fetch('json/profession_affinity.json'),
                fetch('json/pokemon_forms_ru.json'),
                fetch('json/pokemon_names_upper.json').catch(() => ({ ok: false })),
                fetch('json/item.json').catch(() => ({ok: false})),
                fetch('json/items.json').catch(() => ({ok: false})),
                fetch('json/emoji_combos.json').catch(() => ({ok: false})),
                fetch('json/item_locations.json').catch(() => ({ok: false})),
                fetch('json/items_relations.json').catch(() => ({ok: false})),
                fetch('json/npcs.json').catch(() => ({ok: false}))
            ]);

            const [
                pRes, lRes, ruRes, prRes, affRes, fRes, uRes,
                itemLegacyRes, itemsRes, comboRes, itemLocsRes, relRes, npcRes
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
            const formsRaw = await fRes.json();
            if (uRes && uRes.ok) {
                const rawUpper = await uRes.json();
                window.pokemonNamesUpper = rawUpper.pokemon || rawUpper;
            }
            if (itemsRes && itemsRes.ok) window.itemsData = await itemsRes.json();
            if (itemLegacyRes && itemLegacyRes.ok) {
                const legacyItems = await itemLegacyRes.json();
                if(!window.itemsData) window.itemsData = legacyItems;
            }
            if (itemLocsRes && itemLocsRes.ok) window.itemLocationsData = await itemLocsRes.json();
            if (npcRes && npcRes.ok) window.npcsData = await npcRes.json();
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
                fetch('json/pokemon_names.json'),
                fetch('json/locations.json')
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
        els.container.style.display = 'block';
        els.content.innerHTML = '<div class="loading-spinner"></div>';
        els.title.innerHTML = 'Ищем...';

        if (!pokemonDB) {
            renderError("База еще грузится...");
            return;
        }

        const isShinySearch = rawQuery.includes('⭐️');
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

            let targetSearchStrings = [];
            if (itemObj) {
                if (itemObj.RuName) targetSearchStrings.push(norm(itemObj.RuName));
                if (itemObj.Name) targetSearchStrings.push(norm(itemObj.Name));
            }
            targetSearchStrings.push(normQuery);

            const isMatchItem = (itemsArray) => {
                if (!itemsArray) return false;
                return itemsArray.some(rawStr => {
                    const cleanRaw = norm(rawStr);
                    return targetSearchStrings.some(tsClean => {
                        if (!tsClean) return false;
                        if (cleanRaw === tsClean) return true;
                        if (tsClean.length > 3 && cleanRaw.includes(tsClean)) return true;
                        // Use fuzzy matching for substring if it's close enough
                        if (tsClean.length > 3 && window.itemSimilarity(cleanRaw, tsClean) > 0.85) return true;
                        return false;
                    });
                });
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
                        if (npc.location_id === locId && dropNPCs.includes(npc.ru_name)) {
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

            let messageHtml = '';
            if (msgLines.length > 0) {
                messageHtml = `<div style="padding:15px; border-left:5px solid var(--accent); background:rgba(255,107,107,0.1); border-radius:10px; margin-bottom:20px; line-height:1.5;">${msgLines.join('<br>')}</div>`;
            }

            if (itemHabitats.length === 0 && !isDiamondDrop && msgLines.length === 0) {
                if (itemObj) {
                    messageHtml = `<div style="padding:15px; border-left:5px solid #ffcc00; background:rgba(255,215,0,0.1); border-radius:10px; margin-bottom:20px; line-height:1.5;">Извините, но местонахождение <b>${titleName}</b> не найдено.</div>`;
                } else {
                    renderError(`Предмет "<b>${rawQuery}</b>" не найден.`);
                    return;
                }
            }

            renderItemOutput(rawQuery, itemObj, itemHabitats, messageHtml);
            return;
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
                
                let html = `<div style="text-align:center;padding:20px;color:#ffcc00;font-size:1.1rem;margin-top:10px;">Персонаж(и) <b>${namesStr}</b> найден(ы) в ${foundNPCLocs.length} ${getPl(foundNPCLocs.length, pluralPlc)}:</div>`;
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
                            <div class="habitat-item" style="margin-bottom: 10px; padding: 10px; background: rgba(0,0,0,0.1); border-radius: 4px; display: flex; align-items: center; gap: 10px;">
                                <div style="font-size: 1.5rem;">📍</div>
                                <div>
                                    <div class="habitat-loc-name" style="font-weight: 500; font-size: 1.1rem; color: #fff;">${cleanLocName}</div>
                                    <div style="font-size: 0.9rem; color: #aaa;">Регион: ${foundRegion}</div>
                                </div>
                            </div>`;
                    }
                });
                html += '</div>';
                els.content.innerHTML = html;
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
        let habitats = findInWild(searchNameCaps);
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
            const ancestors = getAllAncestors(actualId, formName);
            if (ancestors.length > 0) {
                const ancestorNames = ancestors.map(a => `<b>${a.en}</b> (<i>${a.ru || a.en}</i>)`).join(' или ');
                message = `Покемон <b>${pokemon.en}</b> (<i>${pokemon.ru}</i>) не встречается в дикой природе, но вы можете эволюционировать его из: ${ancestorNames}.`;
                
                ancestors.forEach(anc => {
                    const ancLocs = findInWild(anc.en.toUpperCase().trim());
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

    function findInWild(capsName) {
        const found = [];
        for (const id in locationData) {
            const loc = locationData[id];
            const enc = loc.encounters?.find(e => e.species === capsName);
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
            const textColor = '#fff';
            const iconShadow = 'filter: drop-shadow(0 0 1px rgba(255,255,255,0.8))';
            return `<span class="type-badge" style="background:rgba(255,255,255,0.1); padding:4px 8px; border-radius:5px; margin-right:5px; font-size:0.8rem; color:${textColor}"><span style="${iconShadow}">${typeIcons[tLow] || ''}</span> ${nameRu}</span>`;
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

    function renderItemOutput(rawQuery, itemObj, habitats, messageHtml = '') {
        let titleName = itemObj ? itemObj.RuName || itemObj.Name : rawQuery;
        let engName = itemObj && itemObj.Name ? ` / ${itemObj.Name}` : '';
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

        els.title.innerHTML = `<i class="fas fa-search"></i> ${sticker} ${titleName}${engName}`;

        let html = `<div style="padding:10px;">
                        <h2 style="color:var(--primary); margin:0 0 15px 0; display:flex; align-items:center; gap:10px;">
                            <span class="item-result-sticker" style="display:inline-flex; min-width:1.5em; justify-content:center;">${sticker}</span>
                            <span>${titleName}</span>
                        </h2>
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
                    ${byReg[reg].map(l => `
                        <div style="padding:10px; background:rgba(255,255,255,0.05); border-radius:8px; border-left:3px solid #ffcc00; display:flex; justify-content:space-between; align-items:center;">
                            <div style="display:flex; flex-direction:column; gap:4px;">
                                <strong style="color:white;">${l.ru_name || l.name || 'Неизвестно'}</strong>
                                <div style="font-size:0.85rem; color:var(--text-muted);">${window.formatItemStringWithFlip(l.rawItemString)}</div>
                            </div>
                            <button class="loc-info-btn" onclick="openLocationModal('${l.name}')" title="Информация о локации" style="width:34px; height:34px; border-radius:50%; border:none; background:rgba(255,215,0,0.15); color:#ffd700; cursor:pointer; transition:var(--transition); display:flex; align-items:center; justify-content:center; font-size:1rem; flex-shrink:0;">
                                📍
                            </button>
                        </div>`).join('')}
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
        const c = {}, m = {};
        for (const id in locationData) {
            const l = locationData[id];
            if (l.has_pokecenter) (c[l.region] = c[l.region] || []).push(l.ru_name);
            if (l.has_pokemart) (m[l.region] = m[l.region] || []).push(l.ru_name);
        }
        const render = (d) => { let h = ''; for (const r in d) h += `<div class="region-locations"><h4>${regionNames[r] || r}</h4><div class="locations-grid">${d[r].map(x => `<div class="location-item">${x}</div>`).join('')}</div></div>`; return h; };
        if (els.centers) els.centers.innerHTML = render(c);
        if (els.marts) els.marts.innerHTML = render(m);
    }

    // === СОБЫТИЯ ===
    els.btn.addEventListener('click', startSearch);
    els.input.addEventListener('keypress', (e) => { if (e.key === 'Enter') startSearch(); });
    els.close.addEventListener('click', () => {
        els.container.style.display = 'none';
        if (els.overlay) els.overlay.classList.remove('active');
    });

    if (els.overlay) {
        els.overlay.addEventListener('click', () => {
            els.container.style.display = 'none';
            els.overlay.classList.remove('active');
        });
    }

    els.opts.forEach(opt => {
        opt.addEventListener('click', function () {
            els.opts.forEach(o => o.classList.remove('active'));
            this.classList.add('active');
            const t = this.dataset.type;

            if (t === 'pokemon' || t === 'item') els.box.classList.remove('hidden');
            else els.box.classList.add('hidden');

            els.centers.classList.toggle('active', t === 'pokecenter');
            els.marts.classList.toggle('active', t === 'pokemart');

            if (els.hint) els.hint.textContent = hintTexts[t] || '';
        });
    });
});

// Добавляем стиль для спиннера автоматически
const s = document.createElement('style');
s.textContent = `.loading-spinner { width: 50px; height: 50px; border: 5px solid rgba(78,205,196,0.2); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite; margin: 30px auto; } @keyframes spin { to { transform: rotate(360deg); } } .hidden { display: none !important; }`;
document.head.appendChild(s);
