// Данные регионов для карты (только 5 активных)
const regionsData = [
    {
        id: 'kanto',
        name: 'Kanto',
        title: 'Канто',
        subtitle: 'Первый регион',
        status: 'available',
        icon: 'fas fa-mountain',
        color: '#4ecdc4',
        pokemonCount: 151,
        locationCount: 30,
        description: 'Классический регион, где всё начиналось. Дом для первых покемонов и тренеров.',
        coordinates: { x: 550, y: 250 },
        shape: 'polygon',
        points: [[550,250], [600,230], [620,240], [630,270], [610,290], [590,300], [570,290], [550,270]]
    },
    {
        id: 'johto',
        name: 'Johto',
        title: 'Джото',
        subtitle: 'Традиционный регион',
        status: 'available',
        icon: 'fas fa-torii-gate',
        color: '#4ecdc4',
        pokemonCount: 100,
        locationCount: 25,
        description: 'Регион с богатой историей и традициями. Связан с Канто через горы.',
        coordinates: { x: 450, y: 200 },
        shape: 'circle',
        radius: 35
    },
    {
        id: 'hoenn',
        name: 'Hoenn',
        title: 'Хоэнн',
        subtitle: 'Океанский регион',
        status: 'available',
        icon: 'fas fa-water',
        color: '#4ecdc4',
        pokemonCount: 135,
        locationCount: 35,
        description: 'Регион с обширными океанами и вулканами. Дом для Team Magma и Team Aqua.',
        coordinates: { x: 300, y: 150 },
        shape: 'polygon',
        points: [[300,150], [350,130], [380,140], [390,170], [360,190], [330,180], [310,160]]
    },
    {
        id: 'sinnoh',
        name: 'Sinnoh',
        title: 'Синно',
        subtitle: 'Мифический регион',
        status: 'available',
        icon: 'fas fa-snowflake',
        color: '#4ecdc4',
        pokemonCount: 107,
        locationCount: 28,
        description: 'Холодный регион с глубокой мифологией. Место рождения покемонов.',
        coordinates: { x: 200, y: 100 },
        shape: 'circle',
        radius: 30
    },
    {
        id: 'unova',
        name: 'Unova',
        title: 'Юнова',
        subtitle: 'Урбанистический регион',
        status: 'available',
        icon: 'fas fa-city',
        color: '#4ecdc4',
        pokemonCount: 156,
        locationCount: 32,
        description: 'Современный регион, вдохновлённый Нью-Йорком. Много городских локаций.',
        coordinates: { x: 150, y: 300 },
        shape: 'rect',
        width: 60,
        height: 40
    }
];

// Экспортируем данные
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { regionsData };
}