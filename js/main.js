// main.js - Основная логика для поиска и карты

document.addEventListener('DOMContentLoaded', function() {
    // Инициализируем карту
    initMap();
    
    // Настраиваем поиск и сервисы
    setupSearchAndServices();
    
    // Настраиваем управление картой
    setupMapControls();
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
        item: 'Например: Чёрный пояс, Уголёк, Poké Ball, Potion',
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