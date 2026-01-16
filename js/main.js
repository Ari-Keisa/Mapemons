// main.js - Основная логика для поиска и карты

document.addEventListener('DOMContentLoaded', function() {
    // Настраиваем поиск и сервисы
    setupSearchAndServices();

    // Создаем рендерер карты
    window.mapRenderer = new MapRenderer(svg, regionsData);
    
    // Устанавливаем начальный курсор
    svg.style.cursor = 'grab';
});

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
        item: 'Например: Чёрный пояс, Уголёк, Большой гриб',
        pokecenter: 'Список всех покецентров по регионам',
        pokemart: 'Список всех покемартов по регионам'
    };

    // Обработчики для кнопок поиска
    searchOptions.forEach(option => {
        option.addEventListener('click', function() {
            const type = this.getAttribute('data-type');
            
            // Убираем активный класс у всех
            searchOptions.forEach(opt => opt.classList.remove('active'));
            // Добавляем активный класс текущему
            this.classList.add('active');
            
            // Обновляем подсказку
            searchHint.textContent = searchHints[type];
            
            // Показываем/скрываем соответствующие элементы
            if (type === 'pokemon' || type === 'item') {
                searchBox.classList.remove('hidden');
                searchInput.placeholder = type === 'pokemon' ? 'Покемон' : 'Предмет';
                pokecenterList.classList.remove('active');
                pokemartList.classList.remove('active');
            } else if (type === 'pokecenter') {
                searchBox.classList.add('hidden');
                pokecenterList.classList.add('active');
                pokemartList.classList.remove('active');
            } else if (type === 'pokemart') {
                searchBox.classList.add('hidden');
                pokemartList.classList.add('active');
                pokecenterList.classList.remove('active');
            }
        });
    });

    // Обработчик кнопки поиска
    searchButton.addEventListener('click', function() {
        const activeType = document.querySelector('.search-option.active').getAttribute('data-type');
        const query = searchInput.value.trim();
        
        if ((activeType === 'pokemon' || activeType === 'item') && query) {
            performSearch(activeType, query);
        }
    });

    // Обработчик нажатия Enter в поле поиска
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchButton.click();
        }
    });
}

function performSearch(type, query) {
    // Здесь будет логика поиска
    alert(`Поиск ${type === 'pokemon' ? 'покемона' : 'предмета'}: ${query}`);
}