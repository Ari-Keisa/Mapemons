// Данные регионов для карты
const regionsData = [
    {
        id: 'kanto',
        name: 'Kanto',
        title: 'Канто',
        status: 'available',
        color: '#4ecdc4',
        coordinates: { x: 550, y: 250 },
        shape: 'polygon',
        points: [[550,250], [600,230], [620,240], [630,270], [610,290], [590,300], [570,290], [550,270]]
    },
    {
        id: 'johto',
        name: 'Johto',
        title: 'Джото',
        status: 'available',
        color: '#4ecdc4',
        coordinates: { x: 450, y: 200 },
        shape: 'circle',
        radius: 35
    },
    {
        id: 'hoenn',
        name: 'Hoenn',
        title: 'Хоэнн',
        status: 'available',
        color: '#4ecdc4',
        coordinates: { x: 300, y: 150 },
        shape: 'polygon',
        points: [[300,150], [350,130], [380,140], [390,170], [360,190], [330,180], [310,160]]
    },
    {
        id: 'sinnoh',
        name: 'Sinnoh',
        title: 'Синно',
        status: 'available',
        color: '#4ecdc4',
        coordinates: { x: 200, y: 100 },
        shape: 'circle',
        radius: 30
    },
    {
        id: 'unova',
        name: 'Unova',
        title: 'Юнова',
        status: 'available',
        color: '#4ecdc4',
        coordinates: { x: 150, y: 300 },
        shape: 'rect',
        width: 60,
        height: 40
    }
];