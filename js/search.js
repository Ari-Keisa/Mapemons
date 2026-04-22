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
        'item': 'Например: Чёрный пояс, Уголёк, Травяная броня',
        'pokecenter': 'Список локаций, где присутствует Покецентр',
        'pokemart': 'Список локаций, где присутствует Магазин'
    };

    // === ДАННЫЕ (Экспортируем в глобальную область для dossier.js) ===
    let pokemonDB = null;
    let locationData = null;
    window.pokemonDB = null;
    window.locationData = null;
    window.itemsData = null;
    window.itemLocationsData = null;
    window.pokemonRuData = null;
    window.professionsData = null;
    window.profAffinityData = null;
    window.formsBySpecies = {};
    window.pokemonNamesUpper = null;
    let searchIndex = {};
    let itemSearchIndex = {};

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
            // Используем относительный путь от HTML файла (обычно работает просто 'json/...')
            const [pRes, lRes, ruRes, prRes, affRes, fRes, uRes, itemLRes, itemsRes] = await Promise.all([
                fetch('json/pokemon_names.json'),
                fetch('json/locations.json'),
                fetch('json/pokemon_ru.json'),
                fetch('json/professions.json'),
                fetch('json/profession_affinity.json'),
                fetch('json/pokemon_forms_ru.json'),
                fetch('json/pokemon_names_upper.json').catch(() => ({ ok: false })),
                fetch('json/item.json').catch(() => ({ok: false})),
                fetch('json/items.json').catch(() => ({ok: false}))
            ]);

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
            if (itemLRes && itemLRes.ok) window.itemLocationsData = await itemLRes.json();

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
                    if (it.RuName) {
                        const rLow = it.RuName.toLowerCase().trim();
                        itemSearchIndex[rLow] = key;
                        itemSearchIndex[rLow.replace(/\s+/g, '')] = key;
                    }
                    if (it.Name) {
                        const nLow = it.Name.toLowerCase().trim();
                        itemSearchIndex[nLow] = key;
                        itemSearchIndex[nLow.replace(/\s+/g, '')] = key;
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

        animateValue(els.statPoks, 0, totalPokemons, 2000);
        animateValue(els.statLocs, 0, totalLocations, 1500);
        animateValue(els.statRegs, 0, totalRegions, 1000);
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
        const cleanQuery = rawQuery.toLowerCase().replace('#', '').replace(/⭐️/g, '').trim();

        let isItemSearch = activeType === 'item';
        let foundID = null;

        if (!isItemSearch) {
            foundID = searchIndex[cleanQuery];
            // If not found in pokemon search, try item search
            if (!foundID) {
                const checkClean = cleanQuery.replace(/\s+/g, '');
                if (itemSearchIndex[cleanQuery] || itemSearchIndex[checkClean]) {
                    isItemSearch = true;
                }
            }
        }

        if (isItemSearch) {
            if (!window.itemLocationsData) {
                renderError("Данные предметов загружаются...");
                return;
            }
            const cleanQueryForItems = cleanQuery.replace(/\s+/g, '');
            let foundId = itemSearchIndex[cleanQuery] || itemSearchIndex[cleanQueryForItems];
            let itemObj = window.itemsData && foundId ? window.itemsData[foundId] : null;

            let targetSearchStrings = [];
            if (itemObj) {
                if (itemObj.RuName) targetSearchStrings.push(itemObj.RuName.toLowerCase());
                if (itemObj.Name) targetSearchStrings.push(itemObj.Name.toLowerCase());
            }
            targetSearchStrings.push(cleanQuery); // Always add query fallback

            // Find locations
            let itemHabitats = [];
            for (let reg in window.itemLocationsData) {
                for (let locId in window.itemLocationsData[reg]) {
                    const itemsInLoc = window.itemLocationsData[reg][locId];
                    if (!Array.isArray(itemsInLoc)) continue;
                    
                    for (let rawStr of itemsInLoc) {
                        const rawLower = rawStr.toLowerCase();
                        // Cleaning symbols
                        const cleanRawLoc = rawLower.replace(/[^\p{L}\d\s]/gu, '').trim();
                        const isMatch = targetSearchStrings.some(ts => {
                            const tsClean = ts.replace(/[^\p{L}\d\s]/gu, '').trim();
                            if (!tsClean) return false;
                            return cleanRawLoc === tsClean || cleanRawLoc.includes(tsClean);
                        });

                        if (isMatch) {
                            if (locationData && locationData[locId]) {
                                itemHabitats.push({
                                    ...locationData[locId],
                                    rawItemString: rawStr,
                                    regionRaw: reg
                                });
                            } else {
                                itemHabitats.push({
                                    ru_name: locId,
                                    region: reg,
                                    rawItemString: rawStr,
                                    regionRaw: reg
                                });
                            }
                            break; // Stop at first match in this loc
                        }
                    }
                }
            }

            if (itemHabitats.length === 0) {
                renderError(`Предмет "<b>${rawQuery}</b>" не найден на картах.`);
                return;
            }

            renderItemOutput(rawQuery, itemObj, itemHabitats);
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

        if (habitats.length === 0) {
            const ancestors = getAllAncestors(actualId);
            if (ancestors.length > 0) {
                const ancestorNames = ancestors.map(a => `<b>${a.en}</b> (<i>${a.ru || a.en}</i>)`).join(' или ');
                message = `Покемон <b>${pokemon.en}</b> (<i>${pokemon.ru}</i>) не встречается в дикой природе, но вы можете эволюционировать его из: ${ancestorNames}.`;
                
                ancestors.forEach(anc => {
                    const ancLocs = findInWild(anc.en.toUpperCase().trim());
                    if (ancLocs.length > 0) {
                        ancestorHabitats.push({ pokemon: anc, locations: ancLocs });
                    }
                });
            } else {
                if (pokemon.is_starter) {
                    message = `Покемон <b>${pokemon.en}</b> (<i>${pokemon.ru}</i>) является стартовым и в дикой природе не встречается.`;
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
            if (enc) found.push({ ...loc, info: enc });
        }
        return found;
    }

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

    // === 4. ОТРИСОВКА ===
    function renderOutput(id, p, list, msg, ancestorHabitats, isShiny = false, formIndex = null) {
        const formLabel = formIndex !== null ? ` (${window.formsBySpecies?.[p.en?.toUpperCase()]?.[formIndex]?.FormName || 'Форма'})` : '';
        els.title.innerHTML = `<i class="fas fa-search"></i> ${isShiny ? '⭐️' : ''}${p.ru}${formLabel}${isShiny ? '⭐️' : ''} / ${p.en}`;
        const types = p.type ? p.type.map(t => {
            const tLow = t.toLowerCase().trim();
            const nameRu = typeNamesRu[tLow] || t.toUpperCase();
            const textColor = tLow === 'normal' ? '#000' : '#fff';
            return `<span class="type-badge" style="background:rgba(255,255,255,0.1); padding:4px 8px; border-radius:5px; margin-right:5px; font-size:0.8rem; color:${textColor}">${typeIcons[tLow] || ''} ${nameRu}</span>`;
        }).join('') : '';

        // Find correct key for dossier
        let dossierKey = p.en.toUpperCase();
        if (pokemonRuData && !pokemonRuData[dossierKey]) {
            const numericId = parseInt(id);
            for (let k in pokemonRuData) { if (pokemonRuData[k].NationalId === numericId) { dossierKey = k; break; } }
        }

        let html = `
            <div style="padding:10px;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:15px;">
                    <div style="display:flex; align-items:flex-start; gap:12px;">
                        <div>
                            <h2 style="color:var(--primary); margin:0; line-height:1.1;">#${id} ${p.ru}${formLabel}</h2>
                            <span style="color:var(--text-muted); display:block; margin-top:2px;">${p.en}</span>
                        </div>
                        <button class="poke-info-btn" onclick="openPokemonDossier('${dossierKey}', ${isShiny}, ${formIndex})" title="Открыть досье" style="width:38px; height:38px; border-radius:50%; border:none; background:rgba(78,205,196,0.25); color:var(--primary); cursor:pointer; transition:var(--transition); display:flex; align-items:center; justify-content:center; font-size:1.1rem; flex-shrink:0; pointer-events: auto !important;">
                            <i class="fas fa-book-open"></i>
                        </button>
                    </div>
                    <div style="margin-top:4px;">${types}</div>
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
                html += `
                <div style="margin-bottom:12px;">
                    <button onclick="document.getElementById('searchAnc${idx}').style.display = document.getElementById('searchAnc${idx}').style.display === 'none' ? 'block' : 'none'" style="width:100%; text-align:left; padding:12px 15px; background:rgba(255, 107, 107, 0.05); border:2px solid rgba(255, 107, 107, 0.6); border-radius:10px; color:white; cursor:pointer; font-size:14px; font-weight:bold; display:flex; justify-content:space-between; align-items:center; transition: all 0.3s ease; box-shadow: 0 0 15px rgba(255, 107, 107, 0.2);">
                        <span><i class="fas fa-paw"></i> Посмотреть место жительства <b>${ancName}</b></span>
                        <i class="fas fa-chevron-down"></i>
                    </button>
                    <div id="searchAnc${idx}" style="display:none; margin-top:10px; animation: fadeIn 0.3s ease;">
                        ${renderHabitats(ah.locations, 'var(--accent)')}
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
                        </div>`).join('')}
                </div>
            </div>`;
        }
        return h;
    }

    function renderItemOutput(rawQuery, itemObj, habitats) {
        let titleName = itemObj ? itemObj.RuName || itemObj.Name : rawQuery;
        let engName = itemObj && itemObj.Name ? ` / ${itemObj.Name}` : '';
        let sticker = itemObj && itemObj.Sticker ? itemObj.Sticker : '🎒';
        let desc = itemObj && itemObj.Description ? `<div style="padding:15px; background:rgba(255,255,255,0.05); border-radius:10px; margin-bottom:20px; line-height:1.5;">${itemObj.Description}</div>` : '';

        els.title.innerHTML = `<i class="fas fa-search"></i> ${sticker} ${titleName}${engName}`;

        let html = `<div style="padding:10px;">
                        <h2 style="color:var(--primary); margin:0 0 15px 0;">${sticker} ${titleName}</h2>
                        ${desc}
                        <div style="margin-bottom:15px; color:var(--text-muted);">📍 Найдено в следующих локациях:</div>
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
                        <div style="padding:10px; background:rgba(255,255,255,0.05); border-radius:8px; border-left:3px solid #ffcc00; display:flex; flex-direction:column; gap:4px;">
                            <strong style="color:white;">${l.ru_name || l.name || 'Неизвестно'}</strong>
                            <div style="font-size:0.85rem; color:var(--text-muted);">${l.rawItemString}</div>
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
