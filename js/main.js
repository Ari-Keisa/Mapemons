
// main.js - Основная логика приложения

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Инициализируем карту
    initMap();
    
    // Заполняем список регионов
    renderRegionsList();
    
    // Настраиваем поиск
    setupSearch();
    
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
            
            ${region.status === 'available' 
                ? `<a href="pages/${region.id}.html" class="region-btn">
                      <i class="fas fa-arrow-right"></i> Посетить
                   </a>`
                : `<button class="region-btn" disabled>
                      <i class="fas fa-clock"></i> Скоро
                   </button>`
            }
        `;
        
        grid.appendChild(card);
    });
}

// Настраиваем поиск
function setupSearch() {
    const searchInput = document.getElementById('pokemonSearch');
    const searchButton = document.getElementById('searchButton');
    const searchOptions = document.querySelectorAll('.search-option');
    
    if (!searchInput || !searchButton) return;
    
    // Переключение типа поиска
    searchOptions.forEach(option => {
        option.addEventListener('click', function() {
            searchOptions.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
            
            const searchType = this.getAttribute('data-type');
            updateSearchPlaceholder(searchType);
        });
    });
    
    // Функция поиска
    const performSearch = () => {
        const query = searchInput.value.trim();
        if (!query) return;
        
        const activeType = document.querySelector('.search-option.active').getAttribute('data-type');
        const message = `Поиск ${getSearchTypeName(activeType)}: "${query}" - функция скоро будет доступна!`;
        
        showNotification(message, 'info');
        searchInput.value = '';
    };
    
    // Обработчики событий
    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });
    
    // Устанавливаем начальный плейсхолдер
    updateSearchPlaceholder('pokemon');
}

function updateSearchPlaceholder(type) {
    const searchInput = document.getElementById('pokemonSearch');
    if (!searchInput) return;
    
    const placeholders = {
        pokemon: 'Введите имя покемона или номер...',
        item: 'Введите название предмета...',
        location: 'Введите название локации...'
    };
    
    searchInput.placeholder = placeholders[type] || placeholders.pokemon;
}

function getSearchTypeName(type) {
    const names = {
        pokemon: 'покемонов',
        item: 'предметов',
        location: 'локаций'
    };
    
    return names[type] || 'покемонов';
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
    const availableRegions = window.regionsData.filter(r => r.status === 'available').length;
    
    // Обновляем счетчики в шапке
    document.getElementById('regionCount').textContent = totalRegions;
    document.getElementById('locationCount').textContent = '0'; // Пока 0
    document.getElementById('pokemonCount').textContent = '0'; // Пока 0
    
    // Показываем уведомление о сборке данных
    if (availableRegions === 1) {
        setTimeout(() => {
            showNotification('Сейчас в разработке: регион Канто. Данные собираются!', 'info');
        }, 1000);
    }
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
        setupSearch,
        setupMapControls,
        updateStatistics,
        showNotification
    };
}