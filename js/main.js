// main.js - Основная логика приложения

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Инициализируем карту
    initMap();
    
    // Заполняем список регионов
    renderRegionsList();
    
    // Настраиваем поиск и переключение
    setupSearchAndServices();
    
    // Настраиваем управление картой
    setupMapControls();
    
    // Обновляем статистику
    updateStatistics();
});

// Инициализация карты
function initMap() {
    const svg = document.getElementById('worldMap');
    if (!svg || !window.regionsData) return;
    
    // Создаем рендерер карты
    window.mapRenderer = new MapRenderer(svg, regionsData);
    
    // Устанавливаем начальный курсор
    svg.style.cursor = 'grab';
}

// Рендерим список регионов
function renderRegionsList() {
    const grid = document.getElementById('regionsGrid');
    if (!grid || !window.regionsData) return;
    
    grid.innerHTML = '';
    
    window.regionsData.forEach(region => {
        const card = document.createElement('div');
        card.className = `region-card ${region.status}`;
        card.innerHTML = `
            <div class="region-header">
                <div class="region-icon">
                    <i class="${region.icon}"></i>
                </div>
                <div class="region-info">
                    <h3 class="region-title">${region.title}</h3>
                    <p class="region-subtitle">${region.subtitle}</p>
                </div>
            </div>
            
            <p class="region-description">${region.description}</p>
            
            <div class="region-stats">
                <div class="region-stat">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${region.locationCount} локаций</span>
                </div>
                <div class="region-stat">
                    <i class="fas fa-dragon"></i>
                    <span>${region.pokemonCount} покемонов</span>
                </div>
            </div>
            
            <a href="pages/${region.id}.html" class="region-btn">
                <i class="fas fa-arrow-right"></i> Посетить
            </a>
        `;
        
        grid.appendChild(card);
    });
}

// Настраиваем поиск и сервисы
function setupSearchAndServices() {
    const searchInput = document.getElementById('pokemonSearch');
    const searchButton = document.getElementById('searchButton');
    const searchBox = document.getElementById('searchBox');
    const searchHint = document.getElementById('searchHint');
    const searchOptions = document.querySelectorAll('.search-option');
    const pokecenterList = document.getElementById('pokecenterList');
    const pokemartList = document.getElementById('pokemartList');
    
    // Подсказки для разных типов поиска
    const searchHints = {
        pokemon: 'Например: Pikachu, Charizard, #025',
        item: 'Например: Poké Ball, Potion, Black Belt, Charcoal',
        pokecenter: 'Список всех покецентров по регионам',
        pokemart: 'Список всех покемарктов по регионам'
    };
    
    // Плейсхолдеры для поиска
    const searchPlaceholders = {
        pokemon: 'Введите имя покемона или номер...',
        item: 'Введите название предмета...',
        pokecenter: 'Покецентры всех регионов',
        pokemart: 'Покемаркты всех регионов'
    };
    
    // Функция переключения типа поиска/сервиса
    function switchSearchType(type) {
        // Обновляем активную кнопку
        searchOptions.forEach(opt => opt.classList.remove('active'));
        document.querySelector(`.search-option[data-type="${type}"]`).classList.add('active');
        
        // Обновляем подсказку
        searchHint.textContent = searchHints[type];
        
        // Показываем/скрываем поле поиска и списки локаций
        if (type === 'pokemon' || type === 'item') {
            searchBox.classList.remove('hidden');
            searchInput.placeholder = searchPlaceholders[type];
            pokecenterList.classList.remove('active');
            pokemartList.classList.remove('active');
        } else if (type === 'pokecenter') {
            searchBox.classList.add('hidden');
            pokecenterList.classList.add('active');
            pokemartList.classList.remove('active');
        } else if (type === 'pokemart') {
            searchBox.classList.add('hidden');
            pokecenterList.classList.remove('active');
            pokemartList.classList.add('active');
        }
    }
    
    // Обработчики для кнопок поиска/сервисов
    searchOptions.forEach(option => {
        option.addEventListener('click', function() {
            const type = this.getAttribute('data-type');
            switchSearchType(type);
        });
    });
    
    // Функция поиска (для покемонов и предметов)
    function performSearch() {
        const query = searchInput.value.trim();
        if (!query) return;
        
        const activeType = document.querySelector('.search-option.active').getAttribute('data-type');
        const typeNames = {
            pokemon: 'покемонов',
            item: 'предметов'
        };
        
        const typeName = typeNames[activeType] || activeType;
        const message = `Поиск ${typeName}: "${query}" - функция скоро будет доступна!`;
        
        showNotification(message, 'info');
        searchInput.value = '';
    }
    
    // Обработчики событий для поиска
    if (searchButton && searchInput) {
        searchButton.addEventListener('click', performSearch);
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') performSearch();
        });
    }
    
    // Устанавливаем начальный тип (покемоны)
    switchSearchType('pokemon');
}

// Настраиваем управление картой
function setupMapControls() {
    const zoomInBtn = document.getElementById('zoomIn');
    const zoomOutBtn = document.getElementById('zoomOut');
    const resetBtn = document.getElementById('resetView');
    
    if (!zoomInBtn || !zoomOutBtn || !resetBtn || !window.mapRenderer) return;
    
    zoomInBtn.addEventListener('click', () => window.mapRenderer.zoomIn());
    zoomOutBtn.addEventListener('click', () => window.mapRenderer.zoomOut());
    resetBtn.addEventListener('click', () => window.mapRenderer.resetView());
}

// Обновляем статистику
function updateStatistics() {
    if (!window.regionsData) return;
    
    const totalRegions = window.regionsData.length;
    const totalLocations = window.regionsData.reduce((sum, region) => sum + region.locationCount, 0);
    const totalPokemon = window.regionsData.reduce((sum, region) => sum + region.pokemonCount, 0);
    
    // Обновляем счетчики в шапке
    document.getElementById('regionCount').textContent = totalRegions;
    document.getElementById('locationCount').textContent = totalLocations;
    document.getElementById('pokemonCount').textContent = totalPokemon;
    
    // Показываем уведомление
    setTimeout(() => {
        showNotification('Добро пожаловать в Mapémon! Начинаем с регионов Канто, Джото, Хоэнн, Синно и Юнова.', 'info');
    }, 1000);
}

// Функция уведомлений
function showNotification(message, type = 'info') {
    // Удаляем старое уведомление
    const oldNotification = document.querySelector('.notification');
    if (oldNotification) {
        oldNotification.remove();
    }
    
    // Создаем новое
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
        <i class="fas fa-${type === 'info' ? 'info-circle' : 'check-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Удаляем через 3 секунды
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}

// Экспорт функций
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initMap,
        renderRegionsList,
        setupSearchAndServices,
        setupMapControls,
        updateStatistics,
        showNotification
    };
}