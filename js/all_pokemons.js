document.addEventListener('DOMContentLoaded', () => {
    // 1. Inject the HTML for the modal
    const modalHTML = `
        <div id="allPokeModal" class="all-poke-modal-overlay">
            <div class="all-poke-header">
                <img src="https://upload.wikimedia.org/wikipedia/commons/9/98/International_Pok%C3%A9mon_logo.svg" alt="Pokemon Logo" class="all-poke-logo">
                <div class="all-poke-controls">
                    <button id="allPokeStyleToggle" class="custom-icon-btn style-btn" title="Сменить стиль">
                        <div class="icon-shape three-stars-icon">
                            <i class="fas fa-star ts-1"></i>
                            <i class="fas fa-star ts-2"></i>
                            <i class="fas fa-star ts-3"></i>
                        </div>
                    </button>
                    <button id="allPokeLangToggle" class="custom-icon-btn lang-btn" title="Сменить язык">
                        <div class="icon-shape lang-icon">
                            <i class="fas fa-globe globe-icon"></i>
                            <span class="lang-text" id="allPokeLangText">RU</span>
                        </div>
                    </button>
                    <button id="allPokeFormsToggle" class="custom-icon-btn form-btn active-toggle" title="Показывать формы">
                        <div class="icon-shape pokeball-f">
                            <div class="pokeball-top"></div>
                            <div class="pokeball-bottom"></div>
                            <div class="pokeball-center"><span class="pokeball-letter">ℱ</span><span class="pokeball-flower">🌸</span></div>
                        </div>
                    </button>
                    <button id="allPokeLegendToggle" class="custom-icon-btn legend-btn" title="Только легендарные">
                        <div class="icon-shape crown-l">
                            <i class="fas fa-crown crown-icon"></i>
                            <span class="l-letter">ℒ</span>
                            <span class="thumbs-up">👍</span>
                        </div>
                    </button>
                    <button id="allPokeShinyToggle" class="custom-icon-btn shiny-btn" title="Шайни режим">
                        <div class="icon-shape star-w">
                            <i class="fas fa-star main-star"></i>
                            <span class="w-letter">Ш</span>
                        </div>
                    </button>
                    <button id="allPokeCloseBtn" class="custom-icon-btn close-btn" title="Закрыть">
                        <div class="icon-shape cross-bones">
                            <div class="thin-bone bone-1"></div>
                            <div class="thin-bone bone-2"></div>
                        </div>
                    </button>
                </div>
            </div>
            <div class="all-poke-grid-container style-emblem" id="allPokeGridContainer">
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
    let currentGridStyle = 1; // 1 = emblem, 2 = glass, 3 = classic

    const modal = document.getElementById('allPokeModal');
    const gridContainer = document.getElementById('allPokeGridContainer');
    const grid = document.getElementById('allPokeGrid');
    
    // Controls
    const btnStyle = document.getElementById('allPokeStyleToggle');
    const btnLang = document.getElementById('allPokeLangToggle');
    const langText = document.getElementById('allPokeLangText');
    const btnForms = document.getElementById('allPokeFormsToggle');
    const btnLegend = document.getElementById('allPokeLegendToggle');
    const btnShiny = document.getElementById('allPokeShinyToggle');
    const btnClose = document.getElementById('allPokeCloseBtn');

    // 3. Attach Events to controls
    btnStyle.addEventListener('click', () => {
        currentGridStyle = currentGridStyle === 3 ? 1 : currentGridStyle + 1;
        gridContainer.className = 'all-poke-grid-container'; // reset
        if (currentGridStyle === 1) gridContainer.classList.add('style-emblem');
        if (currentGridStyle === 2) gridContainer.classList.add('style-glass');
        if (currentGridStyle === 3) gridContainer.classList.add('style-classic');
        // trigger re-render if needed, but CSS might be enough!
        // renderGrid(); // Actually we don't need to re-render DOM, just change class!
    });
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
        btnLegend.classList.toggle('active-toggle', onlyLegendaries);
        
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
        document.body.classList.add('all-poke-modal-open');
        isModalOpen = true;
    };

    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        document.body.classList.remove('all-poke-modal-open');
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

    let currentRenderId = 0;

    // 6. Render Grid
    function renderGrid() {
        currentRenderId++;
        const renderId = currentRenderId;
        grid.innerHTML = '';
        
        const filteredData = allBadgesData.filter(m => {
            if (onlyLegendaries && !m.isLegend) return false;
            if (!onlyLegendaries && !showForms && m.isForm) return false;
            if (onlyLegendaries && m.isForm) return false;
            return true;
        });

        if (filteredData.length === 0) return;

        if (window.allPokeObserver) {
            window.allPokeObserver.disconnect();
        }

        window.allPokeObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const idx = entry.target.dataset.idx;
                if (entry.isIntersecting) {
                    if (!entry.target.innerHTML) {
                        entry.target.innerHTML = generateBadgeContent(filteredData[idx]);
                    }
                } else {
                    // Виртуализация: удаляем контент, когда он уходит за экран
                    // Это сильно экономит память для 1200 карточек!
                    entry.target.innerHTML = '';
                }
            });
        }, { 
            root: gridContainer, 
            rootMargin: '1000px' // Грузим примерно 50 покемонов вокруг (на 2 экрана вперед/назад)
        });

        let html = '';
        filteredData.forEach((m, i) => {
            let tArr = m.p.type || [];
            if (m.isForm && m.formObj && m.formObj.Types) {
                tArr = m.formObj.Types.split(',').map(t => t.trim().toLowerCase());
            }
            let type1 = tArr[0] || 'normal';
            let type2 = tArr[1] || type1;
            let c1 = typeColors[type1] || '#444';
            let c2 = typeColors[type2] || c1;
            let gradient = `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`;

            const clickAction = m.isForm 
                ? `if(typeof openPokemonDossier === 'function') openPokemonDossier('${m.id}', ${isShiny}, ${m.formIndex});`
                : `if(typeof openPokemonDossier === 'function') openPokemonDossier('${m.id}', ${isShiny});`;

            // Рисуем пустые "коробки" нужного размера (они заполнятся при приближении)
            html += `<div class="all-poke-badge" data-idx="${i}" style="background: ${gradient};" onclick="${clickAction}"></div>`;
        });
        
        grid.innerHTML = html;

        // Запускаем наблюдение за всеми пустышками
        Array.from(grid.children).forEach(child => window.allPokeObserver.observe(child));

        // Функция генерации внутренностей (вызывается только для тех, кто на экране)
        function generateBadgeContent(m) {
            let tArr = m.p.type || [];
            if (m.isForm && m.formObj && m.formObj.Types) {
                tArr = m.formObj.Types.split(',').map(t => t.trim().toLowerCase());
            }

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

            const nameToShowMain = currentLang === 'ru' ? dispRu : dispEn;
            const nameToShowSub = currentLang === 'ru' ? dispEn : dispRu;

            let imgSrc = '';
            if (m.isForm && m.formObj) {
                imgSrc = isShiny && m.formObj.ShinySpritePath ? m.formObj.ShinySpritePath : m.formObj.SpritePath;
                if (!imgSrc) imgSrc = `home/${isShiny ? 'shiny/' : ''}${parseInt(m.id)}.png`;
                else if (imgSrc.startsWith('shared/assets/')) imgSrc = imgSrc.replace('shared/assets/', '');
            } else {
                imgSrc = `home/${isShiny ? 'shiny/' : ''}${parseInt(m.id)}.png`;
            }

            let typeIconsHtml = '';
            if (typeof typeIcons !== 'undefined') {
                tArr.forEach(t => {
                    const iconPath = typeIcons[t];
                    if (iconPath) {
                        typeIconsHtml += `<span class="type-icon-emoji" style="font-size: 1.2rem; filter: drop-shadow(1px 1px 2px rgba(0,0,0,0.5));">${iconPath}</span>`;
                    }
                });
            }

            const shinyStarHtml = isShiny 
                ? `<i class="fas fa-star" style="position: absolute; color: #FFD700; font-size: 2.5rem; top: -12px; left: -12px; z-index: -1; opacity: 0.1; transform: rotate(-15deg);"></i>` 
                : '';

            const uniqueSvgId = `curve-${m.id}-${m.isForm ? m.formIndex : 'base'}`;

            return `
                <div class="all-poke-badge-number">
                    ${shinyStarHtml}
                    #${parseInt(m.id).toString().padStart(3, '0')}
                </div>
                <div class="all-poke-badge-types">${typeIconsHtml}</div>
                
                <div class="all-poke-badge-img-box">
                    <img src="${imgSrc}" loading="lazy" alt="${nameToShowMain}">
                </div>
                
                <div class="all-poke-badge-name">${nameToShowMain}</div>
                <div class="all-poke-badge-name-en" style="font-size: 0.75rem; color: #aaa; margin-top: 2px;">${nameToShowSub}</div>

                <div class="all-poke-emblem-svg">
                    <svg viewBox="0 0 200 200" width="100%" height="100%">
                        <!-- Token/Coin Border Layers -->
                        <circle cx="100" cy="100" r="97" fill="none" stroke="#DAA520" stroke-width="4" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.5))" />
                        <circle cx="100" cy="100" r="90" fill="none" stroke="#FFD700" stroke-width="1.5" stroke-dasharray="3 4" />
                        <circle cx="100" cy="100" r="86" fill="none" stroke="rgba(255,215,0,0.5)" stroke-width="1" />
                        <path id="${uniqueSvgId}" d="M 15, 100 A 85 85 0 0 0 185, 100" fill="transparent" />
                        <text width="200" text-anchor="middle" class="svg-curved-text">
                            <textPath href="#${uniqueSvgId}" startOffset="50%">
                                ${nameToShowMain.toUpperCase()}
                            </textPath>
                        </text>
                    </svg>
                </div>
            `;
        }
    }
});
