document.addEventListener('DOMContentLoaded', () => {
    // 1. Inject the HTML for the modal
    const modalHTML = `
        <div id="allPokeModal" class="all-poke-modal-overlay">
            <div class="all-poke-header">
                <img src="https://upload.wikimedia.org/wikipedia/commons/9/98/International_Pok%C3%A9mon_logo.svg" alt="Pokemon Logo" class="all-poke-logo">
                <div class="all-poke-controls">
                    <button id="allPokeLangToggle" class="all-poke-control-btn" title="Сменить язык">
                        <i class="fas fa-language"></i> <span id="allPokeLangText">RU</span>
                    </button>
                    <button id="allPokeFormsToggle" class="all-poke-control-btn active-toggle" title="Показывать формы">
                        <i class="fas fa-shapes"></i> Ф
                    </button>
                    <button id="allPokeLegendToggle" class="all-poke-control-btn" title="Только легендарные">
                        <i class="fas fa-crown"></i> Легенды
                    </button>
                    <button id="allPokeShinyToggle" class="all-poke-control-btn" title="Шайни режим">
                        <i class="fas fa-star"></i> Шайни
                    </button>
                    <button id="allPokeCloseBtn" class="all-poke-control-btn all-poke-close-btn" title="Закрыть">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <div class="all-poke-grid-container" id="allPokeGridContainer">
                <div class="all-poke-grid" id="allPokeGrid"></div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // 2. State
    let isShiny = false;
    let currentLang = 'ru'; // 'ru' or 'en'
    let showForms = true;
    let onlyLegendaries = false;
    let isModalOpen = false;
    let allBadgesData = []; // To store pre-calculated badge data

    const modal = document.getElementById('allPokeModal');
    const grid = document.getElementById('allPokeGrid');
    
    // Controls
    const btnLang = document.getElementById('allPokeLangToggle');
    const langText = document.getElementById('allPokeLangText');
    const btnForms = document.getElementById('allPokeFormsToggle');
    const btnLegend = document.getElementById('allPokeLegendToggle');
    const btnShiny = document.getElementById('allPokeShinyToggle');
    const btnClose = document.getElementById('allPokeCloseBtn');

    // 3. Attach Events to controls
    btnLang.addEventListener('click', () => {
        currentLang = currentLang === 'ru' ? 'en' : 'ru';
        langText.textContent = currentLang.toUpperCase();
        renderGrid();
    });

    btnForms.addEventListener('click', () => {
        if (onlyLegendaries) return; // Disabled when legendary is active
        showForms = !showForms;
        btnForms.classList.toggle('active-toggle', showForms);
        renderGrid();
    });

    btnLegend.addEventListener('click', () => {
        onlyLegendaries = !onlyLegendaries;
        btnLegend.classList.toggle('active-legend', onlyLegendaries);
        
        if (onlyLegendaries) {
            btnForms.style.opacity = '0.5';
            btnForms.style.pointerEvents = 'none';
        } else {
            btnForms.style.opacity = '1';
            btnForms.style.pointerEvents = 'auto';
        }
        renderGrid();
    });

    btnShiny.addEventListener('click', () => {
        isShiny = !isShiny;
        btnShiny.classList.toggle('active-toggle', isShiny);
        renderGrid();
    });

    btnClose.addEventListener('click', () => {
        closeModal();
    });

    // 4. Expose open method globally
    window.openAllPokemonsModal = function() {
        if (!allBadgesData.length) {
            buildBadgesData();
        }
        
        // Sync shiny state with global if needed
        if (typeof window.isShinyToggleActive !== 'undefined') {
            isShiny = window.isShinyToggleActive;
            btnShiny.classList.toggle('active-toggle', isShiny);
        }

        renderGrid();
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        isModalOpen = true;
    };

    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        isModalOpen = false;
    }

    // 5. Build Badge Data
    function buildBadgesData() {
        if (typeof pokemonDB === 'undefined' || typeof typeColors === 'undefined') return;

        allBadgesData = [];

        // Iterate all bases
        for (let id in pokemonDB) {
            const p = pokemonDB[id];
            if (!p || !p.en) continue;

            const ruEntry = window.pokemonRuData && window.pokemonRuData[p.en.toUpperCase()];
            const isLegend = (p.is_legendary) || (p.rarity && p.rarity >= 8) || (ruEntry && (ruEntry.Format === 'Uber' || ruEntry.Format === 'Gold')); // Approximation if no exact flag

            allBadgesData.push({
                id: id,
                p: p,
                isForm: false,
                formIndex: null,
                formObj: null,
                isLegend: !!isLegend
            });

            // Forms
            if (window.formsBySpecies && window.formsBySpecies[p.en.toUpperCase()]) {
                window.formsBySpecies[p.en.toUpperCase()].forEach((form, fIdx) => {
                    if (!form.FormName && !form.SpritePath) return; // Skip dummy forms

                    // Some forms might be legendary too (e.g. Primal Groudon)
                    // If base is legendary, form is usually legendary
                    allBadgesData.push({
                        id: id,
                        p: p,
                        isForm: true,
                        formIndex: fIdx,
                        formObj: form,
                        isLegend: !!isLegend
                    });
                });
            }
        }

        // JS iterators put integer-like keys (100) before string keys ("001"), 
        // so we must sort them explicitly by numeric ID
        allBadgesData.sort((a, b) => {
            const idA = parseInt(a.id);
            const idB = parseInt(b.id);
            if (idA !== idB) return idA - idB;
            // If base IDs are equal (forms of same pokemon), sort by form index
            const fA = a.isForm ? (a.formIndex + 1) : 0;
            const fB = b.isForm ? (b.formIndex + 1) : 0;
            return fA - fB;
        });
    }

    // 6. Render Grid
    function renderGrid() {
        grid.innerHTML = '';
        
        let html = '';
        
        allBadgesData.forEach(m => {
            // Apply Filters
            if (onlyLegendaries && !m.isLegend) return;
            if (!onlyLegendaries && !showForms && m.isForm) return;
            if (onlyLegendaries && m.isForm) return; // "которая автоматом вырубит формы и тд оставит ток легендарных"

            // Get Colors
            let tArr = m.p.type || [];
            if (m.isForm && m.formObj && m.formObj.Types) {
                tArr = m.formObj.Types.split(',').map(t => t.trim().toLowerCase());
            }

            let type1 = tArr[0] || 'normal';
            let type2 = tArr[1] || type1;

            let c1 = typeColors[type1] || '#444';
            let c2 = typeColors[type2] || c1;
            
            // Adjust gradient for premium look
            let gradient = `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`;

            // Names
            let dispRu = m.p.ru || m.p.en;
            let dispEn = m.p.en;
            if (m.isForm && m.formObj && m.formObj.FormName) {
                if (typeof window.translateFormName === 'function') {
                    let trans = window.translateFormName(m.formObj.FormName, dispRu, dispEn);
                    dispRu = trans.ru;
                    dispEn = trans.en;
                } else {
                    dispRu = `${dispRu} (${m.formObj.FormName})`;
                    dispEn = `${dispEn} (${m.formObj.FormName})`;
                }
            }

            const nameToShow = currentLang === 'ru' ? dispRu : dispEn;
            const safeEn = m.p.en.replace(/'/g, "\\'");

            // Image
            let imgSrc = '';
            if (m.isForm && m.formObj) {
                imgSrc = isShiny && m.formObj.ShinySpritePath ? m.formObj.ShinySpritePath : m.formObj.SpritePath;
                if (!imgSrc) imgSrc = `home/${isShiny ? 'shiny/' : ''}${parseInt(m.id)}.png`;
                else if (imgSrc.startsWith('shared/assets/')) imgSrc = imgSrc.replace('shared/assets/', '');
            } else {
                imgSrc = `home/${isShiny ? 'shiny/' : ''}${parseInt(m.id)}.png`;
            }

            // Type icons
            let typeIconsHtml = '';
            if (typeof typeIcons !== 'undefined') {
                tArr.forEach(t => {
                    const iconPath = typeIcons[t];
                    if (iconPath) {
                        typeIconsHtml += `<span class="type-icon-emoji" style="font-size: 1.2rem; filter: drop-shadow(1px 1px 2px rgba(0,0,0,0.5));">${iconPath}</span>`;
                    }
                });
            }

            const clickAction = m.isForm 
                ? `if(typeof openPokemonDossier === 'function') openPokemonDossier('${safeEn}', ${isShiny}, ${m.formIndex});`
                : `if(typeof openPokemonDossier === 'function') openPokemonDossier('${safeEn}', ${isShiny});`;

            html += `
                <div class="all-poke-badge" style="background: ${gradient};" onclick="${clickAction}">
                    <div class="all-poke-badge-number">#${parseInt(m.id).toString().padStart(3, '0')}</div>
                    <div class="all-poke-badge-types">${typeIconsHtml}</div>
                    
                    <div class="all-poke-badge-img-box">
                        <img src="${imgSrc}" loading="lazy" alt="${nameToShow}">
                    </div>
                    
                    <div class="all-poke-badge-name">${nameToShow}</div>
                </div>
            `;
        });

        grid.innerHTML = html;
    }
});
