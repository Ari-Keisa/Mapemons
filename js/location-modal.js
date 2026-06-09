/**
 * Shared Location Modal System
 * Handles rendering and displaying detailed information about locations
 * across different regions.
 */

// Global state for NPCs
window.npcByLocation = {};

// Item restrictions for the warning box
const itemsRestrictions = {
    "BICYCLE": [
        "KANTO-ROUTE-16", "KANTO-ROUTE-18", "HOENN-ROUTE-110", "SINNOH-ROUTE-206", "SINNOH-ROUTE-207"
    ],
    "ICE_SUIT": [
        "ICEFALL-CAVE", "SEAFOAM-ISLANDS", "MT-SILVER", "ICE-PATH", "JOHTO-ROUTE-44",
        "SHOAL-CAVE", "SINNOH-ROUTE-217", "SINNOH-ROUTE-216"
    ],
    "DIVING_SUIT": [],
    "FIRE_SUIT": [
        "KINDLE-ROAD", "SCORCHED-SLAB", "FIERY-PATH", "HOENN-ROUTE-112",
        "JAGGED-PASS", "MT-CHIMNEY", "FUEGO-IRONWORKS"
    ],
    "RUBBER_SUIT": [
        "POWER-PLANT", "EMBEDDED-TOWER", "NEW-MAUVILLE"
    ]
};

const itemNamesRu = {
    "BICYCLE": "Велосипед",
    "DIVING_SUIT": "Водолазный Костюм",
    "ICE_SUIT": "Хладостойкий Костюм",
    "RUBBER_SUIT": "Резиновый Костюм",
    "FIRE_SUIT": "Огнеупорный Костюм"
};

/**
 * Builds the NPC mapping index if npcsData is available
 */
function buildNpcIndex() {
    if (!window.npcsData) return;
    window.npcByLocation = {};
    for (const key in window.npcsData) {
        const npc = window.npcsData[key];
        const locId = npc.location_id;
        if (!locId) continue;
        if (!window.npcByLocation[locId]) window.npcByLocation[locId] = [];
        window.npcByLocation[locId].push({
            ru_name: npc.ru_name,
            description: npc.description
        });
    }
}

/**
 * Main entry point to open a location modal
 * @param {string} locId - The ID of the location (e.g., 'PALLET-TOWN')
 */
window.openLocationModal = function(locId) {
    if (!window.locationData) {
        console.error("Location data not loaded");
        return;
    }

    const data = window.locationData[locId];
    if (!data) {
        console.error(`Location ${locId} not found`);
        return;
    }

    // Ensure NPC index is built
    if (Object.keys(window.npcByLocation).length === 0 && window.npcsData) {
        buildNpcIndex();
    }

    showLocationInfo(locId, data);
};

function showLocationInfo(locId, data) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'locationModal';
    
    // --- Requirements check ---
    const requiredItems = [];
    for (const item in itemsRestrictions) {
        if (itemsRestrictions[item].includes(locId)) {
            requiredItems.push({
                id: item,
                name: itemNamesRu[item] || item
            });
        }
    }

    let requirementsHtml = '';
    if (requiredItems.length > 0) {
        requirementsHtml = `
            <div class="loc-requirements-box">
                <div class="req-title">⚠️ ДЛЯ ЭТОЙ ЛОКАЦИИ НЕОБХОДИМО ИМЕТЬ:</div>
                <div class="req-items-list">
                    ${requiredItems.map(it => `<span class="req-item-tag">${it.name}</span>`).join('')}
                </div>
            </div>
        `;
    }

    // Badges (Pokecenter / Mart)
    let badges = '';
    if (data.has_pokecenter) badges += '<span title="Покецентр">❤️‍🩹</span>';
    if (data.has_pokemart) badges += '<span title="Покемарт">🛒</span>';
    const badgesHtml = badges ? `<span class="loc-modal-badges">${badges}</span>` : '';

    // --- NPC tab content ---
    let npcs = Array.from(window.npcByLocation[locId] || []);
    
    let npcHtml = '';
    if (npcs.length > 0) {
        npcHtml = '<div class="npc-list">' + npcs.map((npc, i) => {
            const ext = window.extractLocationIcon ? window.extractLocationIcon(npc.ru_name, 'npc') : {icon: '👤', name: npc.ru_name};
            return `
            <div>
                <div class="npc-item">
                    <span class="npc-item-name">${ext.icon} ${ext.name}</span>
                    <button class="npc-info-btn" onclick="toggleNpcDesc(${i})" title="Подробнее">ℹ️</button>
                </div>
                <div class="npc-desc" id="npcDesc${i}">${npc.description || 'Описание отсутствует.'}</div>
            </div>
        `}).join('') + '</div>';
    } else {
        npcHtml = '<div class="loc-empty"><div class="loc-empty-icon">🚫</div><div class="loc-empty-text">В этой локации нет NPC</div></div>';
    }

    // --- Pokémon tab content ---
    const encounters = data.encounters || [];
    let pokeHtml = '';
    if (encounters.length > 0) {
        const sorted = [...encounters].sort((a, b) => {
            const rA = a.rarity || 0;
            const rB = b.rarity || 0;
            if (rA === rB) return 0;
            if (rA === 0) return -1;
            if (rB === 0) return 1;
            return rA - rB;
        });
        pokeHtml = '<div class="poke-list">' + sorted.map(enc => {
            const capsSpecies = enc.species;
            let pkId = null;
            if (window.pokemonNamesUpper) {
                pkId = window.pokemonNamesUpper[capsSpecies];
            }
            
            let pk = pkId ? window.pokemonDB[pkId] : null;
            let ruEntry = null;
            if (window.pokemonRuData && window.pokemonRuData[capsSpecies]) {
                ruEntry = window.pokemonRuData[capsSpecies];
                if (!pkId && ruEntry.NationalId) {
                    pkId = String(ruEntry.NationalId).padStart(3, '0');
                    pk = window.pokemonDB[pkId] || null;
                }
            }
            const numStr = pkId || (ruEntry && ruEntry.NationalId ? String(ruEntry.NationalId) : '???');
            const ruName = pk ? pk.ru : (ruEntry ? ruEntry.Name : capsSpecies);
            const enName = pk ? pk.en : (ruEntry ? ruEntry.Name : capsSpecies);
            const lvl = enc.min_level === enc.max_level ? `Ур. ${enc.min_level}` : `Ур. ${enc.min_level} - ${enc.max_level}`;

            let conditionLabel = '';
            if (enc.can_catch === false) conditionLabel += '❌ ';
            if (enc.conditions) {
                if (enc.conditions.time === "Morning") conditionLabel += '☀️ Утро / День ';
                else if (enc.conditions.time === "Evening") conditionLabel += '🌇 Вечер ';
                else if (enc.conditions.time === "Night") conditionLabel += '🌙 Ночь ';
                if (enc.conditions.method === "fish") conditionLabel += '🎣 Рыбалка ';
            }

            let rarityLabel = enc.rarity ? 'Р' + enc.rarity : 'О';

            const dossierKey = pkId || capsSpecies;
            return `
            <div class="poke-item">
                <div class="poke-item-info">
                    <div style="font-weight: 500; margin-bottom: 3px;">
                        <strong>#${String(numStr).replace(/^0+/, '') || numStr}</strong> ${ruName} / ${enName}
                    </div>
                    <div style="color:var(--text-muted); font-size:0.82rem;">
                        ${lvl}
                    </div>
                </div>
                <div class="habitat-actions" style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
                    <div style="display: flex; align-items: center;">
                        <span class="poke-item-rarity" style="min-width: 40px; text-align: center; display: inline-block; margin-left: 0;">${rarityLabel}</span>
                        <button class="poke-info-btn" style="margin-left: 6px;" onclick="openPokemonDossier('${dossierKey}')" title="Досье"><i class="fas fa-book-open"></i></button>
                    </div>
                    ${conditionLabel ? `<div style="font-size: 0.8rem; color:var(--accent); opacity: 0.9; text-align: right;">${conditionLabel.trim()}</div>` : ''}
                </div>
            </div>`;
        }).join('') + '</div>';
    } else {
        pokeHtml = '<div class="loc-empty"><div class="loc-empty-icon">🚫</div><div class="loc-empty-text">Дикие покемоны здесь не встречаются</div></div>';
    }

    // --- Items tab content ---
    let locItemsRaw = new Set();
    const rel = window.itemsRelationsData;
    
    if (rel) {
        if (encounters.length > 0) {
            if (rel.wild) rel.wild.forEach(i => locItemsRaw.add(i));
            
            encounters.forEach(enc => {
                let capsSpecies = enc.species;
                if (rel.pokemon && rel.pokemon[capsSpecies]) {
                    rel.pokemon[capsSpecies].forEach(i => locItemsRaw.add(i));
                }
                
                let pkId = window.pokemonNamesUpper ? window.pokemonNamesUpper[capsSpecies] : null;
                if (!pkId && window.pokemonRuData && window.pokemonRuData[capsSpecies]) {
                    pkId = String(window.pokemonRuData[capsSpecies].NationalId).padStart(3, '0');
                }
                let pk = pkId && window.pokemonDB ? window.pokemonDB[pkId] : null;
                if (pk && pk.type && rel.types) {
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
                        let tLow = t.toLowerCase();
                        if (rel.types[tLow]) {
                            rel.types[tLow].forEach(i => locItemsRaw.add(i));
                        }
                    });
                }
            });
        }
        
        if (npcs && npcs.length > 0 && rel.npcs) {
            npcs.forEach(npc => {
                if (rel.npcs[npc.ru_name]) {
                    rel.npcs[npc.ru_name].forEach(i => locItemsRaw.add(i));
                }
            });
        }
    } else {
        // Fallback to old behavior
        const region = data.region || 'KANTO';
        const fallbackItems = (window.itemLocationsData && window.itemLocationsData[region] && window.itemLocationsData[region][locId]) || [];
        fallbackItems.forEach(i => locItemsRaw.add(i));
    }
    
    const locItems = Array.from(locItemsRaw);
    let itemsHtml = '';
    if (locItems.length > 0) {
        itemsHtml = '<div class="items-list">' + locItems.map(it => {
            let itemKey = null;
            if (window.itemsData) {
                const norm = str => str.toLowerCase().replace(/ё/g, 'е').replace(/[^а-яa-z0-9]/g, '');
                const searchIt = norm(it);
                for (const key in window.itemsData) {
                    const item = window.itemsData[key];
                    const ruNameNorm = item.RuName ? norm(item.RuName) : "";
                    if (ruNameNorm === searchIt || (item.Name && norm(item.Name) === searchIt)) {
                        itemKey = key;
                        break;
                    }
                }
                if (!itemKey && typeof window.fuzzyMatchItemKey === 'function') {
                    itemKey = window.fuzzyMatchItemKey(it, window.itemsData);
                }
            }

            let displayStr = it;
            if (itemKey && window.itemsData[itemKey]) {
                displayStr = (window.itemsData[itemKey].Sticker || "") + (window.itemsData[itemKey].RuName || it);
            }

            const formatted = window.formatItemStringWithFlip ? window.formatItemStringWithFlip(displayStr) : (window.formatTextWithEmojis ? window.formatTextWithEmojis(displayStr) : displayStr);
            if (itemKey) {
                return `<div class="item-tag clickable" onclick="openItemInfo('${itemKey}')" title="Подробнее">${formatted}</div>`;
            }
            return `<div class="item-tag">${formatted}</div>`;
        }).join('') + '</div>';
    } else {
        itemsHtml = '<div class="loc-empty"><div class="loc-empty-icon">🚫</div><div class="loc-empty-text">Предметы в этой локации не найдены</div></div>';
    }

    const npcCount = npcs.length;
    const pokeCount = encounters.length;
    const itemCount = locItems.length;

    let defaultTab = (data.environment && data.environment !== "None") ? 'pokePanel' : 'npcPanel';
    if (npcCount === 0 && pokeCount > 0) defaultTab = 'pokePanel';
    if (npcCount === 0 && pokeCount === 0 && itemCount > 0) defaultTab = 'itemsPanel';

    const isNpcActive = defaultTab === 'npcPanel' ? 'active' : '';
    const isPokeActive = defaultTab === 'pokePanel' ? 'active' : '';
    const isItemsActive = defaultTab === 'itemsPanel' ? 'active' : '';

    modal.innerHTML = `
        <div class="modal-header">
            <div>
                <h3>${data.ru_name || data.name}${badgesHtml}</h3>
                <small>${window.getTypeText ? window.getTypeText(data.environment || 'other') : (data.environment || 'Локация')}</small>
            </div>
            <button class="modal-close">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="modal-content">
            <div class="loc-modal-desc">${data.description || 'Описание отсутствует.'}</div>
            ${requirementsHtml}

            <div class="loc-tabs">
                <button class="loc-tab ${isNpcActive}" onclick="switchLocTab(this, 'npcPanel')">👥 НПС${npcCount ? ` (${npcCount})` : ''}</button>
                <button class="loc-tab ${isPokeActive}" onclick="switchLocTab(this, 'pokePanel')">🐾 Покемоны${pokeCount ? ` (${pokeCount})` : ''}</button>
                <button class="loc-tab ${isItemsActive}" onclick="switchLocTab(this, 'itemsPanel')">🎒 Предметы${itemCount ? ` (${itemCount})` : ''}</button>
            </div>

            <div class="loc-tab-panel ${isNpcActive}" id="npcPanel">${npcHtml}</div>
            <div class="loc-tab-panel ${isPokeActive}" id="pokePanel">${pokeHtml}</div>
            <div class="loc-tab-panel ${isItemsActive}" id="itemsPanel">${itemsHtml}</div>
        </div>
    `;

    document.body.appendChild(modal);
    document.getElementById('modalOverlay').classList.add('active');
    setTimeout(() => modal.classList.add('active'), 10);
    modal.querySelector('.modal-close').addEventListener('click', closeModal);
}

// Helper Functions
window.switchLocTab = function(btn, tabId) {
    const modal = btn.closest('.modal');
    modal.querySelectorAll('.loc-tab').forEach(t => t.classList.remove('active'));
    modal.querySelectorAll('.loc-tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    modal.querySelector('#' + tabId).classList.add('active');
};

window.toggleNpcDesc = function(index) {
    const desc = document.getElementById('npcDesc' + index);
    if (desc) desc.classList.toggle('show');
};

window.closeModal = function() {
    const activeModals = document.querySelectorAll('.modal.active');
    const lastModal = activeModals[activeModals.length - 1];
    
    if (lastModal) {
        lastModal.classList.remove('active');
        setTimeout(() => {
            lastModal.remove();
            // Only hide overlay if no more modals are active
            if (document.querySelectorAll('.modal.active').length === 0) {
                document.getElementById('modalOverlay').classList.remove('active');
            }
        }, 300);
    }
};

window.openItemInfo = function(key) {
    if (!window.itemsData) return;
    const item = window.itemsData[key];
    if (!item) return;

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'itemInfoModal';

    const priceHtml = item.Price > 0 
        ? `<span class="item-modal-price">💰 Цена: ${item.Price.toLocaleString()} ₽</span>` 
        : '<span class="item-modal-price">💎 Редкий предмет</span>';

    modal.innerHTML = `
        <div class="modal-header">
            <div>
                <h3>${item.RuName || item.Name}</h3>
                <small>${item.Name}</small>
            </div>
            <button class="modal-close">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="modal-content">
            <div class="item-modal-content">
                <div class="item-modal-header">
                    <div class="item-modal-sticker">${window.formatItemSticker ? window.formatItemSticker(item.Sticker || '📦') : (item.Sticker || '📦')}</div>
                    <div class="item-modal-title-group">
                        <div class="item-modal-ru-name">${item.RuName || item.Name}</div>
                        <div class="item-modal-en-name">${item.Name}</div>
                    </div>
                </div>
                <div class="item-modal-desc">${window.formatTextWithEmojis ? window.formatTextWithEmojis(item.Description || 'Описание отсутствует.') : (item.Description || 'Описание отсутствует.')}</div>
                <div class="item-modal-footer">
                    ${priceHtml}
                    <span class="item-modal-id">ID: ${key}</span>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    // Ensure overlay is active
    document.getElementById('modalOverlay').classList.add('active');
    setTimeout(() => modal.classList.add('active'), 10);
    modal.querySelector('.modal-close').addEventListener('click', closeModal);
};

// Simple getTypeText fallback
window.getTypeText = function(type) {
    if (!type) return 'Локация';
    const types = {
        'city': 'Город', 'town': 'Город', 'route': 'Маршрут', 'forest': 'Лес',
        'meadow': 'Луг', 'cave': 'Пещера', 'island': 'Остров', 'mountain': 'Горы',
        'canyon': 'Каньон', 'building': 'Строение', 'special': 'Особое место',
        'water': 'Водоем'
    };
    return types[type.toLowerCase()] || 'Локация';
};

window.getTypeIcon = function(type) {
    if (!type) return '📍';
    const icons = {
        'city': '🏙️', 'town': '🏘️', 'route': '🛣️', 'forest': '🌲',
        'meadow': '🌸', 'cave': '🪨', 'island': '🏝️', 'mountain': '⛰️',
        'canyon': '🏜️', 'building': '🏢', 'special': '✨', 'water': '🌊',
        'npc': '👤'
    };
    return icons[type.toLowerCase()] || '📍';
};

window.extractLocationIcon = function(name, type) {
    if (!name) return { icon: window.getTypeIcon(type), name: 'Неизвестно' };
    
    // Ищем символы-эмодзи в начале строки (не буквы, не цифры, не знаки препинания, не пробелы)
    const match = name.match(/^([^\p{L}\p{N}\p{P}\p{Z}]+)\s*(.*)/u);
    if (match && match[1].trim() !== '') {
        return { icon: match[1], name: match[2] };
    }
    
    return { icon: window.getTypeIcon(type), name: name };
};

window.openLightLocationModal = function(locId) {
    if (!window.locationData) return;
    const data = window.locationData[locId];
    if (!data) return;

    let overlay = document.getElementById('lightModalOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'lightModalOverlay';
        overlay.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:20000; display:none; opacity:0; transition:opacity 0.3s; backdrop-filter:blur(3px);';
        document.body.appendChild(overlay);
        
        const modal = document.createElement('div');
        modal.id = 'lightLocationModal';
        // Обновленный стиль: темный фон, подходящий под общий дизайн сайта
        modal.style.cssText = 'position:fixed; top:50%; left:50%; transform:translate(-50%, -50%) scale(0.9); width:90%; max-width:500px; background:rgba(25, 25, 35, 0.98); border-radius:15px; padding:25px; z-index:20001; box-shadow:0 10px 40px rgba(0,0,0,0.8); border:2px solid var(--primary); display:none; opacity:0; transition:all 0.3s; color:#fff; max-height:80vh; overflow-y:auto; backdrop-filter:blur(10px);';
        document.body.appendChild(modal);

        overlay.addEventListener('click', closeLightModal);
    }

    const modal = document.getElementById('lightLocationModal');
    
    const regionFiles = {
        'KANTO': 'pages/kanto.html',
        'JOHTO': 'pages/johto.html',
        'HOENN': 'pages/hoenn.html',
        'SINNOH': 'pages/sinnoh.html',
        'UNOVA': 'pages/unova.html'
    };
    
    const regUrl = regionFiles[data.region] ? `${regionFiles[data.region]}?loc=${locId}` : '#';

    let pokesHtml = '';
    if (data.encounters && data.encounters.length > 0) {
        let speciesSet = new Set();
        data.encounters.forEach(e => {
            if(e.species) speciesSet.add(e.species.toUpperCase());
        });
        
        let pokeCards = '';
        speciesSet.forEach(sp => {
            if (window.pokemonDB) {
                const pObj = Object.values(window.pokemonDB).find(x => x.en.toUpperCase() === sp);
                if (pObj) {
                    const pId = Object.keys(window.pokemonDB).find(k => window.pokemonDB[k].en === pObj.en);
                    const isInPages = window.location.pathname.includes('/pages/');
                    const imgSrc = `${isInPages ? '../' : ''}home/${parseInt(pId)}.png`;
                    pokeCards += `<div style="background:rgba(0,0,0,0.3); padding:5px; border-radius:8px; text-align:center; width:65px;" title="${pObj.ru || pObj.en}">
                        <img src="${imgSrc}" style="width:40px;height:40px;object-fit:contain;" onerror="this.src='images/items/0.png'">
                        <div style="font-size:0.6rem; margin-top:3px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${pObj.ru || pObj.en}</div>
                    </div>`;
                }
            }
        });
        
        if (pokeCards) {
            pokesHtml = `
            <h4 style="margin-top:15px; margin-bottom:10px; color:var(--primary); font-size:0.9rem;">Встречаемые покемоны:</h4>
            <div style="display:flex; flex-wrap:wrap; gap:8px;">${pokeCards}</div>
            `;
        }
    }

    let badges = '';
    if (data.has_pokecenter) badges += '<span title="Покецентр" style="margin-right:5px; font-size:1.2rem;">❤️‍🩹</span>';
    if (data.has_pokemart) badges += '<span title="Покемарт" style="font-size:1.2rem;">🛒</span>';
    
    modal.innerHTML = `
        <button onclick="closeLightModal()" style="position:absolute; top:15px; right:15px; background:none; border:none; color:#aaa; font-size:1.5rem; cursor:pointer; transition:0.2s;" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='#aaa'">&times;</button>
        <h2 style="margin-top:0; color:var(--primary); font-size:1.5rem; margin-bottom:5px;">${data.ru_name || data.name}</h2>
        <div style="color:#ccc; font-size:0.9rem; margin-bottom:15px;">Регион: <span style="color:#fff; font-weight:bold;">${data.region}</span></div>
        ${badges ? `<div style="margin-bottom:15px;">${badges}</div>` : ''}
        ${data.description ? `<div style="background:rgba(0,0,0,0.2); padding:10px; border-radius:8px; font-size:0.95rem; line-height:1.4; margin-bottom:15px; border-left:3px solid var(--primary);">${data.description}</div>` : ''}
        ${pokesHtml}
        <div style="margin-top:25px; text-align:center;">
            <a href="${regUrl}" style="display:inline-block; background:var(--primary); color:#000; text-decoration:none; padding:10px 20px; border-radius:25px; font-weight:bold; font-size:1rem; transition:0.2s; box-shadow:0 4px 15px rgba(78,205,196,0.4);" onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 6px 20px rgba(78,205,196,0.6)';" onmouseout="this.style.transform='none'; this.style.boxShadow='0 4px 15px rgba(78,205,196,0.4)';">
                Перейти на карту региона
            </a>
        </div>
    `;

    overlay.style.display = 'block';
    modal.style.display = 'block';
    
    void modal.offsetWidth;
    
    overlay.style.opacity = '1';
    modal.style.opacity = '1';
    modal.style.transform = 'translate(-50%, -50%) scale(1)';
};

window.closeLightModal = function() {
    const overlay = document.getElementById('lightModalOverlay');
    const modal = document.getElementById('lightLocationModal');
    if (overlay && modal) {
        overlay.style.opacity = '0';
        modal.style.opacity = '0';
        modal.style.transform = 'translate(-50%, -50%) scale(0.9)';
        setTimeout(() => {
            overlay.style.display = 'none';
            modal.style.display = 'none';
        }, 300);
    }
};
