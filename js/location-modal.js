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
    const npcs = window.npcByLocation[locId] || [];
    let npcHtml = '';
    if (npcs.length > 0) {
        npcHtml = '<div class="npc-list">' + npcs.map((npc, i) => `
            <div>
                <div class="npc-item">
                    <span class="npc-item-name">👤 ${npc.ru_name}</span>
                    <button class="npc-info-btn" onclick="toggleNpcDesc(${i})" title="Подробнее">ℹ️</button>
                </div>
                <div class="npc-desc" id="npcDesc${i}">${npc.description || 'Описание отсутствует.'}</div>
            </div>
        `).join('') + '</div>';
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
    const types = {
        'city': 'Город', 'town': 'Город', 'route': 'Маршрут', 'forest': 'Лес',
        'meadow': 'Луг', 'cave': 'Пещера', 'island': 'Остров', 'mountain': 'Горы',
        'canyon': 'Каньон', 'building': 'Строение', 'special': 'Особое место'
    };
    return types[type.toLowerCase()] || 'Локация';
};
