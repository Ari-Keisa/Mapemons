// map-renderer.js - Отрисовка SVG карты мира

class MapRenderer {
    constructor(svgElement, regionsData) {
        this.svg = svgElement;
        this.regions = regionsData;
        this.scale = 1;
        this.translateX = 0;
        this.translateY = 0;
        this.isDragging = false;
        this.startX = 0;
        this.startY = 0;
        
        this.init();
    }
    
    init() {
        this.clearMap();
        this.drawBackground();    // 1. Фон с картинкой
        this.drawGrid();          // 2. Сетка (полупрозрачная)
        this.drawRegions();       // 3. Регионы
        this.drawConnections();   // 4. Связи
        this.setupInteractions(); // 5. Взаимодействие
    }
    
    clearMap() {
        this.svg.innerHTML = '';
    }
    
    drawBackground() {
        // 1. ФОНОВАЯ КАРТИНКА (pokemap.png должна быть в корне проекта!)
        const bgImage = document.createElementNS('http://www.w3.org/2000/svg', 'image');
        bgImage.setAttribute('href', 'pokemap.png');
        bgImage.setAttribute('width', '800');
        bgImage.setAttribute('height', '600');
        bgImage.setAttribute('x', '0');
        bgImage.setAttribute('y', '0');
        bgImage.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        this.svg.appendChild(bgImage);
        
        // 2. ТЁМНЫЙ ОВЕРЛЕЙ для контраста
        const overlay = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        overlay.setAttribute('width', '800');
        overlay.setAttribute('height', '600');
        overlay.setAttribute('fill', 'rgba(13, 43, 78, 0.4)'); // 40% прозрачности
        overlay.setAttribute('rx', '10');
        this.svg.appendChild(overlay);
    }
    
    drawGrid() {
        // ВЕРТИКАЛЬНЫЕ ЛИНИИ (еле видные)
        for (let x = 50; x < 800; x += 50) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x);
            line.setAttribute('y1', '0');
            line.setAttribute('x2', x);
            line.setAttribute('y2', '600');
            line.setAttribute('stroke', 'rgba(255, 255, 255, 0.1)'); // ОЧЕНЬ прозрачные!
            line.setAttribute('stroke-width', '1');
            this.svg.appendChild(line);
        }
        
        // ГОРИЗОНТАЛЬНЫЕ ЛИНИИ
        for (let y = 50; y < 600; y += 50) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', '0');
            line.setAttribute('y1', y);
            line.setAttribute('x2', '800');
            line.setAttribute('y2', y);
            line.setAttribute('stroke', 'rgba(255, 255, 255, 0.1)');
            line.setAttribute('stroke-width', '1');
            this.svg.appendChild(line);
        }
    }
    
    drawRegions() {
        // Добавляем фильтр свечения
        this.addGlowFilter();
        
        this.regions.forEach(region => {
            const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            group.setAttribute('class', `region-svg ${region.status}`);
            group.setAttribute('data-region', region.id);
            group.style.cursor = region.status === 'available' ? 'pointer' : 'default';
            
            let shape;
            
            // Создаем форму региона
            switch (region.shape) {
                case 'circle':
                    shape = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                    shape.setAttribute('cx', region.coordinates.x);
                    shape.setAttribute('cy', region.coordinates.y);
                    shape.setAttribute('r', region.radius);
                    break;
                    
                case 'rect':
                    shape = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                    shape.setAttribute('x', region.coordinates.x - region.width/2);
                    shape.setAttribute('y', region.coordinates.y - region.height/2);
                    shape.setAttribute('width', region.width);
                    shape.setAttribute('height', region.height);
                    shape.setAttribute('rx', '5');
                    shape.setAttribute('ry', '5');
                    break;
                    
                case 'polygon':
                    shape = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                    const points = region.points.map(p => p.join(',')).join(' ');
                    shape.setAttribute('points', points);
                    break;
            }
            
            // Стили формы
            shape.setAttribute('fill', region.color);
            shape.setAttribute('stroke', '#fff');
            shape.setAttribute('stroke-width', '2');
            shape.setAttribute('opacity', region.status === 'available' ? '0.9' : '0.7');
            shape.setAttribute('class', 'region-shape');
            
            // Добавляем форму в группу
            group.appendChild(shape);
            
            // Добавляем текст с названием
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', region.coordinates.x);
            text.setAttribute('y', region.coordinates.y + 5);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('fill', 'white');
            text.setAttribute('font-size', '12');
            text.setAttribute('font-weight', 'bold');
            text.setAttribute('pointer-events', 'none');
            text.textContent = region.name;
            group.appendChild(text);
            
            this.svg.appendChild(group);
        });
    }
    
    addGlowFilter() {
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        
        const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
        filter.setAttribute('id', 'glow');
        
        const feGaussianBlur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
        feGaussianBlur.setAttribute('stdDeviation', '3.5');
        feGaussianBlur.setAttribute('result', 'coloredBlur');
        
        const feMerge = document.createElementNS('http://www.w3.org/2000/svg', 'feMerge');
        
        const feMergeNode1 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
        feMergeNode1.setAttribute('in', 'coloredBlur');
        
        const feMergeNode2 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
        feMergeNode2.setAttribute('in', 'SourceGraphic');
        
        feMerge.appendChild(feMergeNode1);
        feMerge.appendChild(feMergeNode2);
        
        filter.appendChild(feGaussianBlur);
        filter.appendChild(feMerge);
        defs.appendChild(filter);
        this.svg.appendChild(defs);
    }
    
    drawConnections() {
        // Связь между Канто и Джото
        const connection1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        connection1.setAttribute('x1', '550');
        connection1.setAttribute('y1', '250');
        connection1.setAttribute('x2', '450');
        connection1.setAttribute('y2', '200');
        connection1.setAttribute('stroke', 'rgba(255, 255, 255, 0.25)');
        connection1.setAttribute('stroke-width', '2');
        connection1.setAttribute('stroke-dasharray', '5,5');
        this.svg.appendChild(connection1);
        
        // Связь между Джото и Хоэнн
        const connection2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        connection2.setAttribute('x1', '450');
        connection2.setAttribute('y1', '200');
        connection2.setAttribute('x2', '300');
        connection2.setAttribute('y2', '150');
        connection2.setAttribute('stroke', 'rgba(255, 255, 255, 0.25)');
        connection2.setAttribute('stroke-width', '2');
        connection2.setAttribute('stroke-dasharray', '5,5');
        this.svg.appendChild(connection2);
    }
    
    setupInteractions() {
        // Обработчики для регионов
        this.svg.querySelectorAll('.region-svg').forEach(region => {
            const shape = region.querySelector('.region-shape');
            const regionId = region.getAttribute('data-region');
            const regionData = this.regions.find(r => r.id === regionId);
            
            if (!regionData) return;
            
            // Наведение
            shape.addEventListener('mouseenter', () => {
                if (regionData.status === 'available') {
                    shape.setAttribute('filter', 'url(#glow)');
                    shape.style.transform = 'scale(1.05)';
                    shape.style.transformOrigin = 'center';
                }
            });
            
            shape.addEventListener('mouseleave', () => {
                shape.removeAttribute('filter');
                shape.style.transform = 'scale(1)';
            });
            
            // Клик
            shape.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleRegionClick(regionData);
            });
        });
        
        // Перетаскивание для всей карты
        this.setupDragAndDrop();
    }
    
    handleRegionClick(region) {
        if (region.status === 'available') {
            window.location.href = `pages/${region.id}.html`;
        } else {
            this.showNotification(`Регион "${region.title}" скоро будет доступен!`);
        }
    }
    
    setupDragAndDrop() {
        let isDragging = false;
        let startX, startY;
        let currentTranslateX = 0, currentTranslateY = 0;
        let translateX = 0, translateY = 0;
        
        // Мышка
        this.svg.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('region-shape')) return;
            
            isDragging = true;
            startX = e.clientX - currentTranslateX;
            startY = e.clientY - currentTranslateY;
            this.svg.style.cursor = 'grabbing';
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            e.preventDefault();
            translateX = e.clientX - startX;
            translateY = e.clientY - startY;
            this.updateTransform(translateX, translateY, this.scale);
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                currentTranslateX = translateX;
                currentTranslateY = translateY;
                this.svg.style.cursor = 'grab';
            }
        });
        
        // Для мобильных
        this.svg.addEventListener('touchstart', (e) => {
            if (e.target.classList.contains('region-shape')) return;
            
            isDragging = true;
            startX = e.touches[0].clientX - currentTranslateX;
            startY = e.touches[0].clientY - currentTranslateY;
        });
        
        document.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            
            e.preventDefault();
            translateX = e.touches[0].clientX - startX;
            translateY = e.touches[0].clientY - startY;
            this.updateTransform(translateX, translateY, this.scale);
        });
        
        document.addEventListener('touchend', () => {
            if (isDragging) {
                isDragging = false;
                currentTranslateX = translateX;
                currentTranslateY = translateY;
            }
        });
    }
    
    updateTransform(x, y, scale) {
        this.svg.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
        this.translateX = x;
        this.translateY = y;
    }
    
    zoomIn() {
        if (this.scale < 3) {
            this.scale += 0.2;
            this.updateTransform(this.translateX, this.translateY, this.scale);
        }
    }
    
    zoomOut() {
        if (this.scale > 0.5) {
            this.scale -= 0.2;
            this.updateTransform(this.translateX, this.translateY, this.scale);
        }
    }
    
    resetView() {
        this.scale = 1;
        this.translateX = 0;
        this.translateY = 0;
        this.updateTransform(0, 0, 1);
    }
    
    showNotification(message) {
        // Простая функция уведомления
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.innerHTML = `
            <i class="fas fa-info-circle"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }
}

// Экспорт класса
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MapRenderer;
}