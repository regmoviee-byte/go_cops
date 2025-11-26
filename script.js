// Логика подсчета уровня группы навыков
document.addEventListener('DOMContentLoaded', function() {
    console.log('Дело следака загружено');
    
    // Функция для подсчета уровня группы
    function calculateGroupLevel(groupName) {
        const section = document.querySelector(`[data-group="${groupName}"]`);
        if (!section) return;
        
        // Находим все навыки в группе
        const skillRows = section.querySelectorAll('.attribute-row');
        let totalLevel1Checked = 0;
        
        // Считаем только первые уровни (data-level="1") в навыках
        skillRows.forEach(skillRow => {
            const level1Checkbox = skillRow.querySelector('.attr-checkbox[data-level="1"]');
            if (level1Checkbox && level1Checkbox.checked) {
                totalLevel1Checked++;
            }
        });
        
        // Уровень группы = количество заполненных первых уровней, максимум 4
        const level = Math.min(totalLevel1Checked, 4);
        
        // Обновляем квадратики уровня
        const levelSquares = section.querySelectorAll('.level-square');
        levelSquares.forEach((square, index) => {
            if (index < level) {
                square.classList.add('filled');
            } else {
                square.classList.remove('filled');
            }
        });
    }
    
    // Обработчик изменения чекбоксов
    document.querySelectorAll('.attr-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const groupName = this.getAttribute('data-group');
            const skillName = this.getAttribute('data-skill');
            const level = parseInt(this.getAttribute('data-level'));
            
            if (groupName && skillName) {
                // Проверяем последовательность уровней
                if (this.checked) {
                    // Если пытаемся отметить уровень выше первого, проверяем предыдущие
                    if (level > 1) {
                        // Проверяем, отмечен ли предыдущий уровень
                        const prevCheckbox = document.querySelector(`[data-group="${groupName}"][data-skill="${skillName}"][data-level="${level - 1}"]`);
                        if (!prevCheckbox || !prevCheckbox.checked) {
                            // Предыдущий уровень не отмечен - запрещаем отметить этот
                            this.checked = false;
                            return;
                        }
                    }
                } else {
                    // Если снимаем отметку, снимаем все последующие уровни
                    for (let i = level + 1; i <= 4; i++) {
                        const nextCheckbox = document.querySelector(`[data-group="${groupName}"][data-skill="${skillName}"][data-level="${i}"]`);
                        if (nextCheckbox && nextCheckbox.checked) {
                            nextCheckbox.checked = false;
                        }
                    }
                }
                
                // Если это первый уровень, пересчитываем уровень группы
                if (level === 1) {
                    calculateGroupLevel(groupName);
                }
                
                saveToLocalStorage();
            }
        });
    });
    
    // Инициализация уровней при загрузке
    ['head', 'body', 'voice'].forEach(group => {
        calculateGroupLevel(group);
    });
    
    // Логика для булетов снаряжения (красное заполнение)
    document.querySelectorAll('.load-circle').forEach(circle => {
        circle.addEventListener('click', function() {
            this.classList.toggle('filled');
        });
    });
    
    // Логика для булетов выгорания
    document.querySelectorAll('.burnout-circle').forEach(circle => {
        circle.addEventListener('click', function() {
            this.classList.toggle('filled');
            saveToLocalStorage(); // Сохраняем изменения
        });
    });
    
    // Функция для показа модального окна уведомления
    function showNotification(message) {
        const modal = document.getElementById('notification-modal');
        const messageEl = document.getElementById('notification-message');
        const okButton = document.getElementById('notification-ok');
        
        if (!modal || !messageEl || !okButton) return;
        
        messageEl.textContent = message;
        modal.style.display = 'block';
        
        // Закрытие по клику на кнопку
        okButton.onclick = function() {
            modal.style.display = 'none';
        };
        
        // Закрытие по клику вне модального окна
        modal.onclick = function(e) {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        };
    }
    
    // Сохранение в localStorage
    function saveToLocalStorage(showAlert = false) {
        const data = {
            fioRank: document.getElementById('fio-rank')?.value || '',
            origin: document.getElementById('origin')?.value || '',
            pastService: document.getElementById('past-service')?.value || '',
            calling: document.getElementById('calling')?.value || '',
            weakness: document.getElementById('weakness')?.value || '',
            connectionsUp: document.getElementById('connections-up')?.value || '',
            connectionsDown: document.getElementById('connections-down')?.value || '',
            peculiarity: document.getElementById('peculiarity')?.value || '',
            notes: document.getElementById('notes')?.value || '',
            photo: document.getElementById('character-photo')?.src || '',
            skills: {},
            equipment: {
                light: [],
                medium: [],
                heavy: []
            },
            burnout: [],
            injuries: {
                physical: {
                    heavy: '',
                    medium: ['', ''],
                    light: ['', '']
                },
                psychological: {
                    heavy: '',
                    medium: ['', ''],
                    light: ['', '']
                },
                scars: ''
            }
        };
        
        // Сохраняем навыки
        document.querySelectorAll('.attr-checkbox').forEach(checkbox => {
            const group = checkbox.getAttribute('data-group');
            const skill = checkbox.getAttribute('data-skill');
            const level = checkbox.getAttribute('data-level');
            
            if (group && skill && level) {
                if (!data.skills[group]) data.skills[group] = {};
                if (!data.skills[group][skill]) data.skills[group][skill] = {};
                data.skills[group][skill][level] = checkbox.checked;
            }
        });
        
        // Сохраняем снаряжение
        document.querySelectorAll('.load-circle').forEach((circle, index) => {
            const row = circle.closest('.load-row');
            if (row) {
                const label = row.querySelector('label')?.textContent.toLowerCase();
                if (label && (label.includes('лёгкая') || label.includes('легкая'))) {
                    if (circle.classList.contains('filled')) data.equipment.light.push(index);
                } else if (label && label.includes('средняя')) {
                    if (circle.classList.contains('filled')) data.equipment.medium.push(index);
                } else if (label && label.includes('тяжелая')) {
                    if (circle.classList.contains('filled')) data.equipment.heavy.push(index);
                }
            }
        });
        
        // Сохраняем выгорание
        document.querySelectorAll('.burnout-circle').forEach((circle, index) => {
            if (circle.classList.contains('filled')) {
                data.burnout.push(index);
            }
        });
        
        // Сохраняем травмы
        const injuriesSection = document.querySelector('.injuries-section');
        if (injuriesSection) {
            const physicalHeavy = injuriesSection.querySelector('.injuries-column:first-child .injury-field.heavy');
            if (physicalHeavy) data.injuries.physical.heavy = physicalHeavy.value;
            
            const physicalMedium = injuriesSection.querySelectorAll('.injuries-column:first-child .injury-field.medium');
            physicalMedium.forEach((field, index) => {
                if (index < 2) data.injuries.physical.medium[index] = field.value;
            });
            
            const physicalLight = injuriesSection.querySelectorAll('.injuries-column:first-child .injury-field.light');
            physicalLight.forEach((field, index) => {
                if (index < 2) data.injuries.physical.light[index] = field.value;
            });
            
            const psychHeavy = injuriesSection.querySelector('.injuries-column:last-child .injury-field.heavy');
            if (psychHeavy) data.injuries.psychological.heavy = psychHeavy.value;
            
            const psychMedium = injuriesSection.querySelectorAll('.injuries-column:last-child .injury-field.medium');
            psychMedium.forEach((field, index) => {
                if (index < 2) data.injuries.psychological.medium[index] = field.value;
            });
            
            const psychLight = injuriesSection.querySelectorAll('.injuries-column:last-child .injury-field.light');
            psychLight.forEach((field, index) => {
                if (index < 2) data.injuries.psychological.light[index] = field.value;
            });
            
            const scars = injuriesSection.querySelector('.injury-field.scars');
            if (scars) data.injuries.scars = scars.value;
        }
        
        localStorage.setItem('characterSheet', JSON.stringify(data));
        if (showAlert) {
            showNotification('Личное дело сохранено!');
        }
    }
    
    // Загрузка из localStorage
    function loadFromLocalStorage() {
        const saved = localStorage.getItem('characterSheet');
        if (!saved) return;
        
        try {
            const data = JSON.parse(saved);
            
            // Загружаем поля формы
            if (document.getElementById('fio-rank')) document.getElementById('fio-rank').value = data.fioRank || '';
            if (document.getElementById('origin')) document.getElementById('origin').value = data.origin || '';
            if (document.getElementById('past-service')) document.getElementById('past-service').value = data.pastService || '';
            if (document.getElementById('calling')) document.getElementById('calling').value = data.calling || '';
            if (document.getElementById('weakness')) document.getElementById('weakness').value = data.weakness || '';
            if (document.getElementById('connections-up')) document.getElementById('connections-up').value = data.connectionsUp || '';
            if (document.getElementById('connections-down')) document.getElementById('connections-down').value = data.connectionsDown || '';
            if (document.getElementById('peculiarity')) document.getElementById('peculiarity').value = data.peculiarity || '';
            if (document.getElementById('notes')) document.getElementById('notes').value = data.notes || '';
            
            // Загружаем фото
            if (data.photo && document.getElementById('character-photo')) {
                const photo = document.getElementById('character-photo');
                photo.src = data.photo;
                photo.style.display = 'block';
                const uploadLabel = document.querySelector('.photo-upload-label');
                if (uploadLabel) uploadLabel.style.display = 'none';
            }
            
            // Загружаем навыки
            if (data.skills) {
                Object.keys(data.skills).forEach(group => {
                    Object.keys(data.skills[group]).forEach(skill => {
                        Object.keys(data.skills[group][skill]).forEach(level => {
                            const checkbox = document.querySelector(`[data-group="${group}"][data-skill="${skill}"][data-level="${level}"]`);
                            if (checkbox) {
                                checkbox.checked = data.skills[group][skill][level];
                            }
                        });
                    });
                });
                
                // Пересчитываем уровни групп
                ['head', 'body', 'voice'].forEach(group => {
                    calculateGroupLevel(group);
                });
            }
            
            // Загружаем снаряжение
            if (data.equipment) {
                // Логика загрузки снаряжения
                const loadRows = document.querySelectorAll('.load-row');
                loadRows.forEach((row, rowIndex) => {
                    const circles = row.querySelectorAll('.load-circle');
                    const label = row.querySelector('label')?.textContent.toLowerCase();
                    let filledIndices = [];
                    
                    if (label && (label.includes('лёгкая') || label.includes('легкая'))) {
                        filledIndices = data.equipment.light || [];
                    } else if (label && label.includes('средняя')) {
                        filledIndices = data.equipment.medium || [];
                    } else if (label && label.includes('тяжелая')) {
                        filledIndices = data.equipment.heavy || [];
                    }
                    
                    circles.forEach((circle, index) => {
                        if (filledIndices.includes(index)) {
                            circle.classList.add('filled');
                        }
                    });
                });
            }
            
            // Загружаем выгорание
            if (data.burnout) {
                const burnoutCircles = document.querySelectorAll('.burnout-circle');
                data.burnout.forEach(index => {
                    if (burnoutCircles[index]) {
                        burnoutCircles[index].classList.add('filled');
                    }
                });
            }
            
            // Загружаем травмы
            if (data.injuries) {
                const injuriesSection = document.querySelector('.injuries-section');
                if (injuriesSection) {
                    // Физические
                    const physicalHeavy = injuriesSection.querySelector('.injuries-column:first-child .injury-field.heavy');
                    if (physicalHeavy) physicalHeavy.value = data.injuries.physical?.heavy || '';
                    
                    const physicalMedium = injuriesSection.querySelectorAll('.injuries-column:first-child .injury-field.medium');
                    physicalMedium.forEach((field, index) => {
                        if (index < 2 && data.injuries.physical?.medium) {
                            field.value = data.injuries.physical.medium[index] || '';
                        }
                    });
                    
                    const physicalLight = injuriesSection.querySelectorAll('.injuries-column:first-child .injury-field.light');
                    physicalLight.forEach((field, index) => {
                        if (index < 2 && data.injuries.physical?.light) {
                            field.value = data.injuries.physical.light[index] || '';
                        }
                    });
                    
                    // Психологические
                    const psychHeavy = injuriesSection.querySelector('.injuries-column:last-child .injury-field.heavy');
                    if (psychHeavy) psychHeavy.value = data.injuries.psychological?.heavy || '';
                    
                    const psychMedium = injuriesSection.querySelectorAll('.injuries-column:last-child .injury-field.medium');
                    psychMedium.forEach((field, index) => {
                        if (index < 2 && data.injuries.psychological?.medium) {
                            field.value = data.injuries.psychological.medium[index] || '';
                        }
                    });
                    
                    const psychLight = injuriesSection.querySelectorAll('.injuries-column:last-child .injury-field.light');
                    psychLight.forEach((field, index) => {
                        if (index < 2 && data.injuries.psychological?.light) {
                            field.value = data.injuries.psychological.light[index] || '';
                        }
                    });
                    
                    const scars = injuriesSection.querySelector('.injury-field.scars');
                    if (scars) scars.value = data.injuries.scars || '';
                }
            }
            
            // Автоматическая загрузка при старте - без уведомления
        } catch (e) {
            console.error('Ошибка загрузки:', e);
            showNotification('Ошибка при загрузке данных');
        }
    }
    
    // Сжатие изображения
    function compressImage(file, maxSizeKB = 100) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = new Image();
                img.onload = function() {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    const maxDimension = 800;
                    
                    // Обрезаем под квадрат
                    const size = Math.min(width, height, maxDimension);
                    const x = (width - size) / 2;
                    const y = (height - size) / 2;
                    
                    canvas.width = size;
                    canvas.height = size;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, x, y, size, size, 0, 0, size, size);
                    
                    let quality = 0.9;
                    let dataUrl = canvas.toDataURL('image/jpeg', quality);
                    
                    // Проверяем размер и уменьшаем quality если нужно
                    while (dataUrl.length > maxSizeKB * 1024 && quality > 0.1) {
                        quality -= 0.1;
                        dataUrl = canvas.toDataURL('image/jpeg', quality);
                    }
                    
                    resolve(dataUrl);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }
    
    // Загрузка фото
    const photoUpload = document.getElementById('photo-upload');
    const characterPhoto = document.getElementById('character-photo');
    
    if (photoUpload) {
        photoUpload.addEventListener('change', async function(e) {
            const file = e.target.files[0];
            if (!file) return;
            
            if (!file.type.startsWith('image/')) {
                showNotification('Пожалуйста, выберите изображение');
                return;
            }
            
            try {
                const compressed = await compressImage(file, 100);
                characterPhoto.src = compressed;
                characterPhoto.style.display = 'block';
                const uploadLabel = document.querySelector('.photo-upload-label');
                if (uploadLabel) uploadLabel.style.display = 'none';
                saveToLocalStorage();
            } catch (error) {
                console.error('Ошибка загрузки фото:', error);
                showNotification('Ошибка при загрузке фотографии');
            }
        });
    }
    
    // Логика кубика
    function rollDice() {
        return Math.floor(Math.random() * 6) + 1;
    }
    
    function getSkillLevel(group, skill) {
        let level = 0;
        for (let i = 1; i <= 4; i++) {
            const checkbox = document.querySelector(`[data-group="${group}"][data-skill="${skill}"][data-level="${i}"]`);
            if (checkbox && checkbox.checked) {
                level = i;
            }
        }
        return level;
    }
    
    function getGroupLevel(groupName) {
        const section = document.querySelector(`[data-group="${groupName}"]`);
        if (!section) return 0;
        
        // Считаем количество заполненных квадратиков уровня
        const levelSquares = section.querySelectorAll('.level-square.filled');
        return levelSquares.length;
    }
    
    function showDicePopup(group, skill = null, additionalDice = 0, skillLevel = null) {
        const popup = document.getElementById('dice-popup');
        const container = document.getElementById('dice-container');
        const resultDiv = document.getElementById('dice-result');
        const messageDiv = document.getElementById('dice-message');
        
        container.innerHTML = '';
        resultDiv.innerHTML = '';
        messageDiv.innerHTML = '';
        messageDiv.className = 'dice-message';
        
        // Используем переданный уровень или вычисляем из навыка
        const finalSkillLevel = skillLevel !== null ? skillLevel : (skill ? getSkillLevel(group, skill) : 0);
        let diceCount = finalSkillLevel + additionalDice;
        let useDisadvantage = false;
        
        if (finalSkillLevel === 0) {
            diceCount = 2 + additionalDice;
            useDisadvantage = true;
        }
        
        const diceElements = [];
        let completedAnimations = 0;
        const diceResults = []; // Будет заполняться после анимации
        
        // Генерируем результаты ДО создания кубиков, чтобы они были известны заранее
        for (let i = 0; i < diceCount; i++) {
            diceResults[i] = rollDice();
        }
        
        for (let i = 0; i < diceCount; i++) {
            // Контейнер для 3D кубика
            const diceWrapper = document.createElement('div');
            diceWrapper.className = 'dice-wrapper';
            diceWrapper.style.cssText = `
                width: 60px;
                height: 60px;
                position: relative;
                transform-style: preserve-3d;
                perspective: 200px;
            `;
            
            // Создаем кубик с 6 гранями
            const diceCube = document.createElement('div');
            diceCube.className = 'dice-cube';
            
            // Генерируем случайное начальное вращение для каждого кубика
            // чтобы они выглядели по-разному во время анимации
            const randomStartX = Math.floor(Math.random() * 360);
            const randomStartY = Math.floor(Math.random() * 360);
            const randomStartZ = Math.floor(Math.random() * 360);
            
            // Создаем уникальную анимацию для каждого кубика с разными начальными углами
            const animationId = `rollDice_${i}_${randomStartX}_${randomStartY}_${randomStartZ}`;
            
            // Добавляем стиль с анимацией
            if (!document.getElementById('dice-animations-style')) {
                const styleEl = document.createElement('style');
                styleEl.id = 'dice-animations-style';
                document.head.appendChild(styleEl);
            }
            
            const styleSheet = document.getElementById('dice-animations-style');
            styleSheet.textContent += `
                @keyframes ${animationId} {
                    0% {
                        transform: rotateX(${randomStartX}deg) rotateY(${randomStartY}deg) rotateZ(${randomStartZ}deg);
                    }
                    25% {
                        transform: rotateX(${randomStartX + 90}deg) rotateY(${randomStartY + 90}deg) rotateZ(${randomStartZ + 90}deg);
                    }
                    50% {
                        transform: rotateX(${randomStartX + 180}deg) rotateY(${randomStartY + 180}deg) rotateZ(${randomStartZ + 180}deg);
                    }
                    75% {
                        transform: rotateX(${randomStartX + 270}deg) rotateY(${randomStartY + 270}deg) rotateZ(${randomStartZ + 270}deg);
                    }
                    100% {
                        transform: rotateX(${randomStartX + 360}deg) rotateY(${randomStartY + 360}deg) rotateZ(${randomStartZ + 360}deg);
                    }
                }
            `;
            
            diceCube.style.cssText = `
                width: 60px;
                height: 60px;
                position: relative;
                transform-style: preserve-3d;
                animation: ${animationId} 1s ease-in-out;
            `;
            
            // Грани кубика с изображениями
            const faceImages = [
                'https://static.tildacdn.com/tild3239-3434-4539-b764-663538323938/1.jpg',
                'https://static.tildacdn.com/tild3861-3836-4832-a433-323366663436/2.jpg',
                'https://static.tildacdn.com/tild3965-3430-4637-b734-653836353463/3.jpg',
                'https://static.tildacdn.com/tild3861-3266-4539-b436-633361626262/4.jpg',
                'https://static.tildacdn.com/tild3035-6562-4131-b733-333665346531/5.jpg',
                'https://static.tildacdn.com/tild3238-3062-4163-a632-626639663665/6.jpg'
            ];
            
            const faces = [
                { num: 1, transform: 'rotateY(0deg) translateZ(30px)' },
                { num: 2, transform: 'rotateY(90deg) translateZ(30px)' },
                { num: 3, transform: 'rotateY(-90deg) translateZ(30px)' },
                { num: 4, transform: 'rotateX(90deg) translateZ(30px)' },
                { num: 5, transform: 'rotateX(-90deg) translateZ(30px)' },
                { num: 6, transform: 'rotateY(180deg) translateZ(30px)' }
            ];
            
            faces.forEach((face, index) => {
                const faceDiv = document.createElement('div');
                faceDiv.className = 'dice-face';
                faceDiv.style.cssText = `
                    position: absolute;
                    width: 60px;
                    height: 60px;
                    border: 2px solid #2a1f0f;
                    background-image: url('${faceImages[index]}');
                    background-size: cover;
                    background-position: center;
                    background-repeat: no-repeat;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    backface-visibility: hidden;
                    transform: ${face.transform};
                `;
                diceCube.appendChild(faceDiv);
            });
            
            diceWrapper.appendChild(diceCube);
            container.appendChild(diceWrapper);
            diceElements.push({ wrapper: diceWrapper, cube: diceCube });
            
            // После завершения анимации поворачиваем кубик на заранее определенный результат
            const diceIndex = i; // Сохраняем индекс для замыкания
            const result = diceResults[diceIndex]; // Используем заранее сгенерированный результат
            
            setTimeout(() => {
                // Останавливаем анимацию и сбрасываем transform
                diceCube.style.animation = 'none';
                diceCube.style.transform = 'rotateX(0deg) rotateY(0deg) rotateZ(0deg)';
                
                // Небольшая задержка для сброса transform
                setTimeout(() => {
                    // Поворачиваем кубик так, чтобы нужная грань была видна
                    // Грани определены как:
                    // 1: rotateY(0deg) translateZ - передняя (Z+)
                    // 2: rotateY(90deg) translateZ - правая (X+)
                    // 3: rotateY(-90deg) translateZ - левая (X-)
                    // 4: rotateX(90deg) translateZ - верхняя (Y+)
                    // 5: rotateX(-90deg) translateZ - нижняя (Y-)
                    // 6: rotateY(180deg) translateZ - задняя (Z-)
                    // Чтобы показать нужную грань спереди, нужно повернуть кубик в обратную сторону
                    const faceIndex = result - 1;
                    const rotations = [
                        'rotateX(0deg) rotateY(0deg)',      // Грань 1 (передняя) - без поворота
                        'rotateX(0deg) rotateY(-90deg)',    // Грань 2 (правая) - повернуть на -90 по Y
                        'rotateX(0deg) rotateY(90deg)',     // Грань 3 (левая) - повернуть на 90 по Y
                        'rotateX(-90deg) rotateY(0deg)',    // Грань 4 (верхняя) - повернуть на -90 по X
                        'rotateX(90deg) rotateY(0deg)',     // Грань 5 (нижняя) - повернуть на 90 по X
                        'rotateX(0deg) rotateY(180deg)'     // Грань 6 (задняя) - повернуть на 180 по Y
                    ];
                    diceCube.style.transform = rotations[faceIndex];
                }, 10);
                
                completedAnimations++;
                // Обрабатываем результаты только когда все анимации завершены
                if (completedAnimations === diceCount) {
                    // Все результаты уже известны, обрабатываем их
                    processDiceResults(diceResults, useDisadvantage, resultDiv, messageDiv, diceElements);
                }
            }, 1000);
        }
        
        popup.style.display = 'flex';
    }
    
    function processDiceResults(results, useDisadvantage, resultDiv, messageDiv, diceElements) {
        // Убеждаемся, что все результаты - числа
        const validResults = results.filter(r => typeof r === 'number' && r >= 1 && r <= 6);
        
        if (validResults.length === 0) {
            console.error('Нет валидных результатов:', results);
            return;
        }
        
        // Определяем финальный результат на основе видимых граней
        let finalResult;
        let finalIndex;
        
        if (useDisadvantage) {
            finalResult = Math.min(...validResults);
            finalIndex = validResults.indexOf(finalResult);
        } else {
            finalResult = Math.max(...validResults);
            finalIndex = validResults.indexOf(finalResult);
        }
        
        // Находим правильный индекс в исходном массиве
        let actualIndex = 0;
        for (let i = 0; i < results.length; i++) {
            if (results[i] === finalResult) {
                actualIndex = i;
                break;
            }
        }
        
        resultDiv.textContent = `Результат: ${finalResult}`;
        
        let message = '';
        let messageClass = '';
        
        if (finalResult === 6) {
            message = '<strong class="dice-result-title">Чистый успех.</strong> Всё получилось как надо.';
            messageClass = 'dice-success';
        } else if (finalResult === 4 || finalResult === 5) {
            message = '<strong class="dice-result-title">Частичный успех.</strong> Задуманное удалось, но не без последствий. Что-то пошло не так: шум, гам, подозрения, сомнения — разберётесь на месте.';
            messageClass = 'dice-partial';
        } else {
            message = '<strong class="dice-result-title">Провал.</strong> Вы вляпались. Результат не достигнут, и теперь будут проблемы. Возможно, серьёзные.';
            messageClass = 'dice-failure';
        }
        
        messageDiv.innerHTML = message;
        messageDiv.classList.add(messageClass);
    }
    
    // Обработчики клика на названия навыков
    let currentSkillGroup = null;
    let currentSkill = null;
    let isGroupRoll = false; // Флаг для определения, это бросок группы или навыка
    
    // Обработчики клика на названия навыков
    const skillNames = document.querySelectorAll('.skill-name');
    if (skillNames.length > 0) {
        skillNames.forEach(skillLabel => {
            skillLabel.addEventListener('click', function() {
                currentSkillGroup = this.getAttribute('data-group');
                currentSkill = this.getAttribute('data-skill');
                isGroupRoll = false;
                
                // Показываем модалку добавления кубиков
                const addDiceModal = document.getElementById('add-dice-modal');
                if (addDiceModal) {
                    addDiceModal.style.display = 'flex';
                    const additionalDiceInput = document.getElementById('additional-dice');
                    if (additionalDiceInput) additionalDiceInput.value = 0;
                }
            });
        });
    }
    
    // Обработчики клика на названия групп навыков (только для заголовков внутри .attribute-section)
    const sectionTitles = document.querySelectorAll('.attribute-section .section-title');
    if (sectionTitles.length > 0) {
        sectionTitles.forEach(sectionTitle => {
            sectionTitle.addEventListener('click', function() {
                // Находим родительскую секцию с атрибутом data-group
                const section = this.closest('[data-group]');
                if (!section) return;
                
                const groupName = section.getAttribute('data-group');
                const groupLevel = getGroupLevel(groupName);
                
                currentSkillGroup = groupName;
                currentSkill = null;
                isGroupRoll = true;
                
                // Показываем модалку добавления кубиков
                const addDiceModal = document.getElementById('add-dice-modal');
                if (addDiceModal) {
                    addDiceModal.style.display = 'flex';
                    const additionalDiceInput = document.getElementById('additional-dice');
                    if (additionalDiceInput) additionalDiceInput.value = 0;
                }
            });
        });
    }
    
    // Обработчики модалки добавления кубиков
    const addDiceModal = document.getElementById('add-dice-modal');
    const addDiceCancel = document.getElementById('add-dice-cancel');
    const addDiceConfirm = document.getElementById('add-dice-confirm');
    
    if (addDiceCancel) {
        addDiceCancel.addEventListener('click', function() {
            if (addDiceModal) addDiceModal.style.display = 'none';
        });
    }
    
    if (addDiceConfirm) {
        addDiceConfirm.addEventListener('click', function() {
            if (addDiceModal) addDiceModal.style.display = 'none';
            const additionalDiceInput = document.getElementById('additional-dice');
            const additionalDice = additionalDiceInput ? parseInt(additionalDiceInput.value) || 0 : 0;
            
            if (isGroupRoll && currentSkillGroup) {
                // Бросок группы навыков
                const groupLevel = getGroupLevel(currentSkillGroup);
                showDicePopup(currentSkillGroup, null, additionalDice, groupLevel);
            } else if (currentSkillGroup && currentSkill) {
                // Бросок конкретного навыка
                showDicePopup(currentSkillGroup, currentSkill, additionalDice);
            }
        });
    }
    
    if (addDiceModal) {
        addDiceModal.addEventListener('click', function(e) {
            if (e.target === addDiceModal) {
                addDiceModal.style.display = 'none';
            }
        });
    }
    
    // Закрытие поп-апа
    const popupClose = document.querySelector('.dice-popup-close');
    const dicePopup = document.getElementById('dice-popup');
    
    if (popupClose) {
        popupClose.addEventListener('click', function() {
            dicePopup.style.display = 'none';
        });
    }
    
    if (dicePopup) {
        dicePopup.addEventListener('click', function(e) {
            if (e.target === dicePopup) {
                dicePopup.style.display = 'none';
            }
        });
    }
    
    // Экспорт в JSON файл
    function exportToJSON() {
        const data = {};
        
        // Собираем все данные (та же логика что и в saveToLocalStorage)
        data.fioRank = document.getElementById('fio-rank')?.value || '';
        data.origin = document.getElementById('origin')?.value || '';
        data.pastService = document.getElementById('past-service')?.value || '';
        data.calling = document.getElementById('calling')?.value || '';
        data.weakness = document.getElementById('weakness')?.value || '';
        data.connectionsUp = document.getElementById('connections-up')?.value || '';
        data.connectionsDown = document.getElementById('connections-down')?.value || '';
        data.peculiarity = document.getElementById('peculiarity')?.value || '';
        data.notes = document.getElementById('notes')?.value || '';
        data.photo = document.getElementById('character-photo')?.src || '';
        data.skills = {};
        data.equipment = { light: [], medium: [], heavy: [] };
        data.burnout = [];
        data.injuries = {
            physical: { heavy: '', medium: ['', ''], light: ['', ''] },
            psychological: { heavy: '', medium: ['', ''], light: ['', ''] },
            scars: ''
        };
        
        // Сохраняем навыки
        document.querySelectorAll('.attr-checkbox').forEach(checkbox => {
            const group = checkbox.getAttribute('data-group');
            const skill = checkbox.getAttribute('data-skill');
            const level = checkbox.getAttribute('data-level');
            
            if (group && skill && level) {
                if (!data.skills[group]) data.skills[group] = {};
                if (!data.skills[group][skill]) data.skills[group][skill] = {};
                data.skills[group][skill][level] = checkbox.checked;
            }
        });
        
        // Сохраняем снаряжение
        document.querySelectorAll('.load-row').forEach(row => {
            const label = row.querySelector('label')?.textContent.toLowerCase();
            const circles = row.querySelectorAll('.load-circle');
            const filled = [];
            circles.forEach((circle, index) => {
                if (circle.classList.contains('filled')) filled.push(index);
            });
            
            if (label && (label.includes('лёгкая') || label.includes('легкая'))) {
                data.equipment.light = filled;
            } else if (label && label.includes('средняя')) {
                data.equipment.medium = filled;
            } else if (label && label.includes('тяжелая')) {
                data.equipment.heavy = filled;
            }
        });
        
        // Сохраняем выгорание
        document.querySelectorAll('.burnout-circle').forEach((circle, index) => {
            if (circle.classList.contains('filled')) {
                data.burnout.push(index);
            }
        });
        
        // Сохраняем травмы
        const injuriesSection = document.querySelector('.injuries-section');
        if (injuriesSection) {
            const physicalHeavy = injuriesSection.querySelector('.injuries-column:first-child .injury-field.heavy');
            if (physicalHeavy) data.injuries.physical.heavy = physicalHeavy.value;
            
            const physicalMedium = injuriesSection.querySelectorAll('.injuries-column:first-child .injury-field.medium');
            physicalMedium.forEach((field, index) => {
                if (index < 2) data.injuries.physical.medium[index] = field.value || '';
            });
            
            const physicalLight = injuriesSection.querySelectorAll('.injuries-column:first-child .injury-field.light');
            physicalLight.forEach((field, index) => {
                if (index < 2) data.injuries.physical.light[index] = field.value || '';
            });
            
            const psychHeavy = injuriesSection.querySelector('.injuries-column:last-child .injury-field.heavy');
            if (psychHeavy) data.injuries.psychological.heavy = psychHeavy.value;
            
            const psychMedium = injuriesSection.querySelectorAll('.injuries-column:last-child .injury-field.medium');
            psychMedium.forEach((field, index) => {
                if (index < 2) data.injuries.psychological.medium[index] = field.value || '';
            });
            
            const psychLight = injuriesSection.querySelectorAll('.injuries-column:last-child .injury-field.light');
            psychLight.forEach((field, index) => {
                if (index < 2) data.injuries.psychological.light[index] = field.value || '';
            });
            
            const scars = injuriesSection.querySelector('.injury-field.scars');
            if (scars) data.injuries.scars = scars.value;
        }
        
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'личное-дело.json';
        a.click();
        URL.revokeObjectURL(url);
    }
    
    // Импорт из JSON файла
    function importFromJSON(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                
                // Загружаем данные (та же логика что и в loadFromLocalStorage)
                if (document.getElementById('fio-rank')) document.getElementById('fio-rank').value = data.fioRank || '';
                if (document.getElementById('origin')) document.getElementById('origin').value = data.origin || '';
                if (document.getElementById('past-service')) document.getElementById('past-service').value = data.pastService || '';
                if (document.getElementById('calling')) document.getElementById('calling').value = data.calling || '';
                if (document.getElementById('weakness')) document.getElementById('weakness').value = data.weakness || '';
                if (document.getElementById('connections-up')) document.getElementById('connections-up').value = data.connectionsUp || '';
                if (document.getElementById('connections-down')) document.getElementById('connections-down').value = data.connectionsDown || '';
                if (document.getElementById('peculiarity')) document.getElementById('peculiarity').value = data.peculiarity || '';
                if (document.getElementById('notes')) document.getElementById('notes').value = data.notes || '';
                
                if (data.photo && document.getElementById('character-photo')) {
                    document.getElementById('character-photo').src = data.photo;
                    document.getElementById('character-photo').style.display = 'block';
                    document.querySelector('.photo-upload-label').style.display = 'none';
                }
                
                // Загружаем навыки
                if (data.skills) {
                    Object.keys(data.skills).forEach(group => {
                        Object.keys(data.skills[group]).forEach(skill => {
                            Object.keys(data.skills[group][skill]).forEach(level => {
                                const checkbox = document.querySelector(`[data-group="${group}"][data-skill="${skill}"][data-level="${level}"]`);
                                if (checkbox) {
                                    checkbox.checked = data.skills[group][skill][level];
                                }
                            });
                        });
                    });
                    
                    ['head', 'body', 'voice'].forEach(group => {
                        calculateGroupLevel(group);
                    });
                }
                
                // Загружаем снаряжение
                if (data.equipment) {
                    const loadRows = document.querySelectorAll('.load-row');
                    loadRows.forEach(row => {
                        const label = row.querySelector('label')?.textContent.toLowerCase();
                        const circles = row.querySelectorAll('.load-circle');
                        let filledIndices = [];
                        
                        if (label && (label.includes('лёгкая') || label.includes('легкая'))) {
                            filledIndices = data.equipment.light || [];
                        } else if (label && label.includes('средняя')) {
                            filledIndices = data.equipment.medium || [];
                        } else if (label && label.includes('тяжелая')) {
                            filledIndices = data.equipment.heavy || [];
                        }
                        
                        circles.forEach((circle, index) => {
                            if (filledIndices.includes(index)) {
                                circle.classList.add('filled');
                            } else {
                                circle.classList.remove('filled');
                            }
                        });
                    });
                }
                
                // Загружаем выгорание
                if (data.burnout) {
                    const burnoutCircles = document.querySelectorAll('.burnout-circle');
                    burnoutCircles.forEach((circle, index) => {
                        if (data.burnout.includes(index)) {
                            circle.classList.add('filled');
                        } else {
                            circle.classList.remove('filled');
                        }
                    });
                }
                
                // Загружаем травмы
                if (data.injuries) {
                    const injuriesSection = document.querySelector('.injuries-section');
                    if (injuriesSection) {
                        const physicalHeavy = injuriesSection.querySelector('.injuries-column:first-child .injury-field.heavy');
                        if (physicalHeavy) physicalHeavy.value = data.injuries.physical?.heavy || '';
                        
                        const physicalMedium = injuriesSection.querySelectorAll('.injuries-column:first-child .injury-field.medium');
                        physicalMedium.forEach((field, index) => {
                            if (index < 2 && data.injuries.physical?.medium) {
                                field.value = data.injuries.physical.medium[index] || '';
                            }
                        });
                        
                        const physicalLight = injuriesSection.querySelectorAll('.injuries-column:first-child .injury-field.light');
                        physicalLight.forEach((field, index) => {
                            if (index < 2 && data.injuries.physical?.light) {
                                field.value = data.injuries.physical.light[index] || '';
                            }
                        });
                        
                        const psychHeavy = injuriesSection.querySelector('.injuries-column:last-child .injury-field.heavy');
                        if (psychHeavy) psychHeavy.value = data.injuries.psychological?.heavy || '';
                        
                        const psychMedium = injuriesSection.querySelectorAll('.injuries-column:last-child .injury-field.medium');
                        psychMedium.forEach((field, index) => {
                            if (index < 2 && data.injuries.psychological?.medium) {
                                field.value = data.injuries.psychological.medium[index] || '';
                            }
                        });
                        
                        const psychLight = injuriesSection.querySelectorAll('.injuries-column:last-child .injury-field.light');
                        psychLight.forEach((field, index) => {
                            if (index < 2 && data.injuries.psychological?.light) {
                                field.value = data.injuries.psychological.light[index] || '';
                            }
                        });
                        
                        const scars = injuriesSection.querySelector('.injury-field.scars');
                        if (scars) scars.value = data.injuries.scars || '';
                    }
                }
                
                // Сохраняем в localStorage
                saveToLocalStorage();
                showNotification('Личное дело загружено из файла!');
            } catch (error) {
                console.error('Ошибка импорта:', error);
                showNotification('Ошибка при загрузке файла');
            }
        };
        reader.readAsText(file);
    }
    
    // Обработчики кнопок
    const exportBtn = document.getElementById('export-json');
    const importBtn = document.getElementById('import-json');
    
    if (exportBtn) {
        exportBtn.addEventListener('click', exportToJSON);
    }
    
    if (importBtn) {
        importBtn.addEventListener('change', importFromJSON);
    }
    
    // Автосохранение при изменении
    let saveTimeout;
    const inputs = document.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(saveToLocalStorage, 1000);
        });
    });
    
    // Загружаем при старте
    loadFromLocalStorage();
    
    // Система кубиков на главном экране
    const mainDiceContainer = document.getElementById('main-dice-container');
    const mainDiceElements = [];
    const mainDicePhysics = [];
    let mainAnimationFrameId = null;
    const diceSize = 60;
    let bounds = getBounds();

    function getBounds() {
        return {
            maxX: Math.max(0, window.innerWidth - diceSize),
            maxY: Math.max(0, window.innerHeight - diceSize)
        };
    }
    
    // Функция создания кубика на главном экране
    function createMainDice() {
        if (!mainDiceContainer) {
            console.error('Контейнер для кубиков не найден!');
            return;
        }
        
        const diceWrapper = document.createElement('div');
        diceWrapper.className = 'main-dice-wrapper';
        
        // Случайная начальная позиция на столе (по всему экрану)
        const maxX = Math.max(0, window.innerWidth - diceSize);
        const maxY = Math.max(0, window.innerHeight - diceSize);
        const startX = Math.max(0, Math.min(Math.random() * maxX, maxX));
        const startY = Math.max(0, Math.min(Math.random() * maxY, maxY));
        
        diceWrapper.style.cssText = `
            width: ${diceSize}px;
            height: ${diceSize}px;
            position: fixed;
            transform-style: preserve-3d;
            cursor: grab;
            user-select: none;
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            -webkit-touch-callout: none;
            -webkit-tap-highlight-color: transparent;
            touch-action: none;
            left: ${startX}px;
            top: ${startY}px;
            z-index: 10000;
        `;
        
        // Создаем кубик с 6 гранями
        const diceCube = document.createElement('div');
        diceCube.className = 'dice-cube';
        diceCube.style.cssText = `
            width: ${diceSize}px;
            height: ${diceSize}px;
            position: relative;
            transform-style: preserve-3d;
        `;
        
        // Грани кубика с изображениями
        const faceImages = [
            'https://static.tildacdn.com/tild3239-3434-4539-b764-663538323938/1.jpg',
            'https://static.tildacdn.com/tild3861-3836-4832-a433-323366663436/2.jpg',
            'https://static.tildacdn.com/tild3965-3430-4637-b734-653836353463/3.jpg',
            'https://static.tildacdn.com/tild3861-3266-4539-b436-633361626262/4.jpg',
            'https://static.tildacdn.com/tild3035-6562-4131-b733-333665346531/5.jpg',
            'https://static.tildacdn.com/tild3238-3062-4163-a632-626639663665/6.jpg'
        ];
        
        const faces = [
            { num: 1, transform: 'rotateY(0deg) translateZ(30px)' },
            { num: 2, transform: 'rotateY(90deg) translateZ(30px)' },
            { num: 3, transform: 'rotateY(-90deg) translateZ(30px)' },
            { num: 4, transform: 'rotateX(90deg) translateZ(30px)' },
            { num: 5, transform: 'rotateX(-90deg) translateZ(30px)' },
            { num: 6, transform: 'rotateY(180deg) translateZ(30px)' }
        ];
        
        faces.forEach((face, index) => {
            const faceDiv = document.createElement('div');
            faceDiv.className = 'dice-face';
            faceDiv.style.cssText = `
                position: absolute;
                width: ${diceSize}px;
                height: ${diceSize}px;
                border: 2px solid #2a1f0f;
                background-image: url('${faceImages[index]}');
                background-size: cover;
                background-position: center;
                background-repeat: no-repeat;
                display: flex;
                align-items: center;
                justify-content: center;
                backface-visibility: hidden;
                transform: ${face.transform};
            `;
            diceCube.appendChild(faceDiv);
        });
        
        diceWrapper.appendChild(diceCube);
        mainDiceContainer.appendChild(diceWrapper);
        
        // Инициализируем физику кубика
        const physics = {
            x: startX,
            y: startY, // Кубик может быть в любой точке экрана
            targetX: startX, // Целевая позиция при перетаскивании
            targetY: startY,
            vx: 0,
            vy: 0,
            rotX: 0, // Начальное вращение по X (вокруг горизонтальной оси)
            rotY: Math.random() * 360, // Начальное вращение по Y
            rotZ: 0, // Начальное вращение по Z (вокруг вертикальной оси)
            rotVX: 0,
            rotVY: 0,
            rotVZ: 0,
            isDragging: false,
            dragStartX: 0,
            dragStartY: 0,
            lastMouseX: 0,
            lastMouseY: 0,
            mouseVelX: 0,
            mouseVelY: 0,
            isStopped: false,
            finalResult: null, // Результат после остановки
            targetFaceForAlignment: null, // Целевая грань для выравнивания
            alignmentCompleted: false, // Флаг завершения выравнивания
            lastTapTime: 0 // Время последнего тапа для двойного тапа
        };
        
        mainDicePhysics.push(physics);
        mainDiceElements.push({ wrapper: diceWrapper, cube: diceCube, physics: physics });
        
        // Универсальная функция для начала перетаскивания
        const startDrag = (clientX, clientY) => {
            physics.isDragging = true;
            physics.isStopped = false;
            physics.finalResult = null; // Сбрасываем результат, чтобы кубик мог получить новый при следующей остановке
            physics.targetFaceForAlignment = null; // Сбрасываем целевую грань
            physics.alignmentCompleted = false; // Сбрасываем флаг завершения выравнивания
            physics.lastTapTime = 0; // Сбрасываем таймер тапа при начале перетаскивания
            physics.vx = 0;
            physics.vy = 0;
            physics.rotVX = 0;
            physics.rotVY = 0;
            physics.rotVZ = 0;
            diceWrapper.style.cursor = 'grabbing';
            
            physics.dragStartX = clientX - physics.x;
            physics.dragStartY = clientY - physics.y;
            physics.lastMouseX = clientX;
            physics.lastMouseY = clientY;
            physics.mouseVelX = 0;
            physics.mouseVelY = 0;
        };
        
        // Обработчики для drag and drop (мышь)
        diceWrapper.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            startDrag(e.clientX, e.clientY);
        });
        
        // Переменные для отслеживания тапа на мобильных устройствах
        physics.touchStartTime = 0;
        physics.touchStartX = 0;
        physics.touchStartY = 0;
        physics.hasMoved = false;
        
        diceWrapper.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                const touch = e.touches[0];
                physics.touchStartTime = new Date().getTime();
                physics.touchStartX = touch.clientX;
                physics.touchStartY = touch.clientY;
                physics.hasMoved = false;
                
                // Обработка двойного тапа для удаления
                const currentTime = new Date().getTime();
                const tapLength = currentTime - physics.lastTapTime;
                if (tapLength < 400 && tapLength > 0) {
                    // Двойной тап - удаляем кубик
                    e.preventDefault();
                    e.stopPropagation();
                    removeMainDice(mainDiceElements.length - 1);
                    physics.lastTapTime = 0;
                    return;
                }
                
                e.preventDefault();
                e.stopPropagation();
                startDrag(touch.clientX, touch.clientY);
            }
        }, { passive: false });
        
        // Проверяем, был ли это тап (без значительного движения)
        diceWrapper.addEventListener('touchend', (e) => {
            if (e.changedTouches.length === 1 && !physics.isDragging) {
                const endTime = new Date().getTime();
                const touchDuration = endTime - physics.touchStartTime;
                
                // Если это был короткий тап без движения - запоминаем время для двойного тапа
                if (!physics.hasMoved && touchDuration < 300) {
                    physics.lastTapTime = endTime;
                } else {
                    physics.lastTapTime = 0; // Сбрасываем, если было движение
                }
            }
        }, { passive: false });
        
        // Двойной клик для удаления (для мыши)
        diceWrapper.addEventListener('dblclick', (e) => {
            e.preventDefault();
            e.stopPropagation();
            removeMainDice(mainDiceElements.length - 1);
        });
        
        // Запускаем анимацию если еще не запущена
        if (!mainAnimationFrameId) {
            animateMainDice();
        }
    }
    
    // Функция удаления кубика
    function removeMainDice(index) {
        if (index >= 0 && index < mainDiceElements.length) {
            const element = mainDiceElements[index];
            element.wrapper.remove();
            mainDiceElements.splice(index, 1);
            mainDicePhysics.splice(index, 1);
        }
    }
    
    // Функция получения целевых углов для грани (чтобы грань лежала внизу на столе)
    function getTargetRotationForFace(faceNumber) {
        // Поворачиваем кубик так, чтобы нужная грань была внизу (на столе)
        // Грани определены как:
        // 1: rotateY(0deg) translateZ - передняя (Z+)
        // 2: rotateY(90deg) translateZ - правая (X+)
        // 3: rotateY(-90deg) translateZ - левая (X-)
        // 4: rotateX(90deg) translateZ - верхняя (Y+)
        // 5: rotateX(-90deg) translateZ - нижняя (Y-)
        // 6: rotateY(180deg) translateZ - задняя (Z-)
        // Чтобы грань была сверху (видна), нужно повернуть так:
        const rotations = [
            { x: 0, y: 0, z: 0 },      // Грань 1 (передняя) - поворачиваем так, чтобы она была сверху
            { x: 0, y: -90, z: 0 },    // Грань 2 (правая) - поворачиваем так, чтобы она была сверху
            { x: 0, y: 90, z: 0 },     // Грань 3 (левая) - поворачиваем так, чтобы она была сверху
            { x: -90, y: 0, z: 0 },    // Грань 4 (верхняя) - поворачиваем так, чтобы она была сверху
            { x: 90, y: 0, z: 0 },     // Грань 5 (нижняя) - поворачиваем так, чтобы она была сверху
            { x: 0, y: 180, z: 0 }     // Грань 6 (задняя) - поворачиваем так, чтобы она была сверху
        ];
        return rotations[faceNumber - 1];
    }
    
    // Нормализация угла к диапазону -180..180
    function normalizeAngle(angle) {
        while (angle > 180) angle -= 360;
        while (angle < -180) angle += 360;
        return angle;
    }
    
    // Плавное выравнивание кубика на грань
    function alignDiceToFace(physics, targetFace) {
        const targetRot = getTargetRotationForFace(targetFace);
        
        // Нормализуем текущие углы
        physics.rotX = normalizeAngle(physics.rotX);
        physics.rotY = normalizeAngle(physics.rotY);
        physics.rotZ = normalizeAngle(physics.rotZ);
        
        // Вычисляем кратчайший путь к целевому углу
        const targetX = normalizeAngle(targetRot.x);
        const targetY = normalizeAngle(targetRot.y);
        const targetZ = normalizeAngle(targetRot.z);
        
        // Находим разницу и выбираем кратчайший путь
        let diffX = normalizeAngle(targetX - physics.rotX);
        let diffY = normalizeAngle(targetY - physics.rotY);
        let diffZ = normalizeAngle(targetZ - physics.rotZ);
        
        // Скорость выравнивания (чем медленнее движение, тем быстрее выравнивание)
        const alignSpeed = 0.15; // Скорость интерполяции (0-1)
        
        // Плавно интерполируем к целевому углу
        physics.rotX += diffX * alignSpeed;
        physics.rotY += diffY * alignSpeed;
        physics.rotZ += diffZ * alignSpeed;
        
        // Нормализуем после изменения
        physics.rotX = normalizeAngle(physics.rotX);
        physics.rotY = normalizeAngle(physics.rotY);
        physics.rotZ = normalizeAngle(physics.rotZ);
    }
    
    // Функция определения верхней грани на основе текущих углов поворота
    function getTopFaceFromRotation(rotX, rotY, rotZ) {
        // Преобразуем углы в радианы для вычислений
        const toRad = (deg) => deg * Math.PI / 180;
        const rx = toRad(rotX);
        const ry = toRad(rotY);
        const rz = toRad(rotZ);
        
        // Вычисляем нормали граней после поворота
        // Грани определены как:
        // 1: rotateY(0deg) translateZ - передняя (Z+) - нормаль (0, 0, 1)
        // 2: rotateY(90deg) translateZ - правая (X+) - нормаль (1, 0, 0)
        // 3: rotateY(-90deg) translateZ - левая (X-) - нормаль (-1, 0, 0)
        // 4: rotateX(90deg) translateZ - верхняя (Y+) - нормаль (0, 1, 0)
        // 5: rotateX(-90deg) translateZ - нижняя (Y-) - нормаль (0, -1, 0)
        // 6: rotateY(180deg) translateZ - задняя (Z-) - нормаль (0, 0, -1)
        
        const faceNormals = [
            [0, 0, 1],   // Грань 1 (передняя)
            [1, 0, 0],   // Грань 2 (правая)
            [-1, 0, 0],  // Грань 3 (левая)
            [0, 1, 0],   // Грань 4 (верхняя)
            [0, -1, 0],  // Грань 5 (нижняя)
            [0, 0, -1]   // Грань 6 (задняя)
        ];
        
        // Функция поворота вектора с правильным порядком для CSS transform
        // В CSS: rotateX(a) rotateY(b) rotateZ(c) применяется как: сначала Z, потом Y, потом X
        const rotateVector = (v, rx, ry, rz) => {
            let [vx, vy, vz] = v;
            
            // Поворот вокруг Z (применяется первым в CSS)
            let x1 = vx * Math.cos(rz) - vy * Math.sin(rz);
            let y1 = vx * Math.sin(rz) + vy * Math.cos(rz);
            let z1 = vz;
            
            // Поворот вокруг Y (применяется вторым в CSS)
            let x2 = x1 * Math.cos(ry) + z1 * Math.sin(ry);
            let y2 = y1;
            let z2 = -x1 * Math.sin(ry) + z1 * Math.cos(ry);
            
            // Поворот вокруг X (применяется последним в CSS)
            let x3 = x2;
            let y3 = y2 * Math.cos(rx) - z2 * Math.sin(rx);
            let z3 = y2 * Math.sin(rx) + z2 * Math.cos(rx);
            
            return [x3, y3, z3];
        };
        
        // Направление "вверх" в мировых координатах (камера смотрит сверху)
        const upDirection = [0, 1, 0];
        
        // Находим грань с нормалью, которая ближе всего к направлению вверх
        let maxDot = -Infinity;
        let topFace = 1;
        
        faceNormals.forEach((normal, index) => {
            // Поворачиваем нормаль грани
            const rotatedNormal = rotateVector(normal, rx, ry, rz);
            
            // Вычисляем скалярное произведение с направлением вверх
            const dot = rotatedNormal[0] * upDirection[0] + 
                       rotatedNormal[1] * upDirection[1] + 
                       rotatedNormal[2] * upDirection[2];
            
            if (dot > maxDot) {
                maxDot = dot;
                topFace = index + 1; // Грани нумеруются с 1
            }
        });
        
        return topFace;
    }
    
    // Функция анимации физики для главных кубиков
    function animateMainDice() {
        let hasActiveDice = false;
        const friction = 0.95; // Трение о поверхность стола (применяется всегда)
        
        mainDicePhysics.forEach((physics, index) => {
            if (physics.isDragging) {
                hasActiveDice = true;
                
                // Плавное следование за мышкой с физикой (покачивание)
                const followSpeed = 0.15; // Скорость следования (0-1)
                const dx = physics.targetX - physics.x;
                const dy = physics.targetY - physics.y;
                
                // Применяем плавное движение с инерцией
                physics.vx = dx * followSpeed;
                physics.vy = dy * followSpeed;
                
                // Обновляем позицию
                physics.x += physics.vx;
                physics.y += physics.vy;
                
                // Строго ограничиваем границами экрана
                const maxX = window.innerWidth - diceSize;
                const maxY = window.innerHeight - diceSize;
                physics.x = Math.max(0, Math.min(physics.x, maxX));
                physics.y = Math.max(0, Math.min(physics.y, maxY));
                
                // Если достигли границы, останавливаем движение в этом направлении
                if (physics.x <= 0 || physics.x >= maxX) {
                    physics.vx = 0;
                }
                if (physics.y <= 0 || physics.y >= maxY) {
                    physics.vy = 0;
                }
                
                // РЕАЛИСТИЧНОЕ КАЧЕНИЕ при перетаскивании
                const radius = diceSize / 2;
                const deltaRotX = (physics.vy / radius) * (180 / Math.PI);
                const deltaRotZ = -(physics.vx / radius) * (180 / Math.PI);
                physics.rotX += deltaRotX;
                physics.rotZ += deltaRotZ;
                
                // Применяем transform
                const wrapper = mainDiceElements[index].wrapper;
                const cube = mainDiceElements[index].cube;
                wrapper.style.left = physics.x + 'px';
                wrapper.style.top = physics.y + 'px';
                cube.style.transform = `rotateX(${physics.rotX}deg) rotateY(${physics.rotY}deg) rotateZ(${physics.rotZ}deg)`;
                
                return;
            }
            
            // Если выравнивание завершено, гарантируем полную остановку и обновляем только transform
            if (physics.alignmentCompleted) {
                physics.vx = 0;
                physics.vy = 0;
                physics.isStopped = true;
                // Продолжаем обновлять transform, но пропускаем всю логику движения
                hasActiveDice = true;
                // Применяем transform для стабильного отображения
                const wrapper = mainDiceElements[index].wrapper;
                const cube = mainDiceElements[index].cube;
                wrapper.style.left = physics.x + 'px';
                wrapper.style.top = physics.y + 'px';
                cube.style.transform = `rotateX(${physics.rotX}deg) rotateY(${physics.rotY}deg) rotateZ(${physics.rotZ}deg)`;
                return; // Пропускаем остальную логику движения
            }
            
            // Если кубик полностью остановлен (без выравнивания), также пропускаем логику
            if (physics.isStopped && Math.abs(physics.vx) < 0.01 && Math.abs(physics.vy) < 0.01) {
                // Обновляем transform для стабильного отображения
                const wrapper = mainDiceElements[index].wrapper;
                const cube = mainDiceElements[index].cube;
                wrapper.style.left = physics.x + 'px';
                wrapper.style.top = physics.y + 'px';
                cube.style.transform = `rotateX(${physics.rotX}deg) rotateY(${physics.rotY}deg) rotateZ(${physics.rotZ}deg)`;
                hasActiveDice = true;
                return;
            }
            
            hasActiveDice = true;
            
            // Вычисляем общую скорость для определения, нужно ли выравнивание
            const speed = Math.sqrt(physics.vx * physics.vx + physics.vy * physics.vy);
            
            // Порог скорости для начала выравнивания (когда кубик почти остановился)
            const alignmentThreshold = 2.0;
            
            // Инициализируем целевую грань для выравнивания, если еще не установлена
            // И только если выравнивание еще не было завершено и кубик не перетаскивается
            if (!physics.targetFaceForAlignment && !physics.alignmentCompleted && speed < alignmentThreshold && !physics.isDragging) {
                // Определяем грань только один раз при первом замедлении
                physics.targetFaceForAlignment = getTopFaceFromRotation(physics.rotX, physics.rotY, physics.rotZ);
            }
            
            // Если кубик замедляется, начинаем выравнивание на ближайшую грань
            if ((speed < alignmentThreshold || physics.isStopped) && !physics.isDragging && physics.targetFaceForAlignment && !physics.alignmentCompleted) {
                // Плавно выравниваем кубик на целевую грань
                alignDiceToFace(physics, physics.targetFaceForAlignment);
                
                // Проверяем, достигли ли мы целевой ориентации (с небольшой погрешностью)
                const targetRot = getTargetRotationForFace(physics.targetFaceForAlignment);
                const angleDiffX = Math.abs(normalizeAngle(physics.rotX - targetRot.x));
                const angleDiffY = Math.abs(normalizeAngle(physics.rotY - targetRot.y));
                const angleDiffZ = Math.abs(normalizeAngle(physics.rotZ - targetRot.z));
                
                // Если мы достаточно близко к целевой ориентации, финализируем
                // Используем больший порог для стабильности
                if (angleDiffX < 2 && angleDiffY < 2 && angleDiffZ < 2) {
                    // Точное выравнивание - фиксируем углы
                    physics.rotX = targetRot.x;
                    physics.rotY = targetRot.y;
                    physics.rotZ = targetRot.z;
                    physics.targetFaceForAlignment = null; // Выравнивание завершено
                    physics.alignmentCompleted = true; // Помечаем, что выравнивание завершено
                    
                    // ПОЛНОСТЬЮ останавливаем движение после завершения выравнивания
                    physics.vx = 0;
                    physics.vy = 0;
                    physics.isStopped = true;
                }
                
                // Когда скорость становится очень малой, останавливаем движение
                if (speed < 0.05) {
                    physics.vx = 0;
                    physics.vy = 0;
                    physics.isStopped = true;
                }
            }
            
            
            // Сбрасываем целевую грань и флаг завершения при перетаскивании или начале движения
            if (physics.isDragging || speed >= alignmentThreshold * 2) {
                physics.targetFaceForAlignment = null;
                physics.alignmentCompleted = false;
            }
            
            // Проверяем остановку ПЕРЕД применением трения и обновлением вращения
            const isStopping = !physics.isStopped && Math.abs(physics.vx) < 0.05 && Math.abs(physics.vy) < 0.05;
            
            if (isStopping && speed >= alignmentThreshold) {
                // Останавливаем движение СРАЗУ
                physics.vx = 0;
                physics.vy = 0;
                
                // Помечаем кубик как остановившийся
                physics.isStopped = true;
            } else if (!physics.isStopped && !physics.alignmentCompleted && speed >= alignmentThreshold) {
                // Трение о поверхность стола (применяется только если кубик еще не остановлен и выравнивание не завершено)
                physics.vx *= friction; // Трение скольжения
                physics.vy *= friction;
            }
            
            // Обновляем вращение ТОЛЬКО если кубик еще не остановлен, не выравнивается и выравнивание не завершено
            // Выравнивание происходит когда скорость < alignmentThreshold
            if (!physics.isStopped && !physics.alignmentCompleted && speed >= alignmentThreshold) {
                // РЕАЛИСТИЧНОЕ КАЧЕНИЕ: кубик катится по столу
                // Формула: угол_поворота = пройденное_расстояние / радиус
                // Для кубика радиус = половина стороны = diceSize / 2
                const radius = diceSize / 2;
                
                // Вращение вокруг оси X (движение вверх/вниз)
                // При движении вниз (положительная vy) кубик катится вперед
                const deltaRotX = (physics.vy / radius) * (180 / Math.PI);
                
                // Вращение вокруг оси Z (движение влево/вправо)
                // При движении вправо (положительная vx) кубик катится вправо
                const deltaRotZ = -(physics.vx / radius) * (180 / Math.PI);
                
                // Применяем вращение напрямую (не через скорость)
                // Это обеспечивает точное соответствие движения и вращения
                physics.rotX += deltaRotX;
                physics.rotZ += deltaRotZ;
            }
            
            // Убираем старые скорости вращения - они больше не нужны
            physics.rotVX = 0;
            physics.rotVY = 0;
            physics.rotVZ = 0;
            
            // После завершения выравнивания гарантируем полную остановку
            if (physics.alignmentCompleted) {
                physics.vx = 0;
                physics.vy = 0;
                physics.isStopped = true;
            }
            
            // Обновляем позицию ТОЛЬКО если кубик еще не остановлен
            if (!physics.isStopped) {
                physics.x += physics.vx;
                physics.y += physics.vy;
                
                // Строго ограничиваем границами экрана
                const maxX = window.innerWidth - diceSize;
                const maxY = window.innerHeight - diceSize;
                
                // Отскок от боковых границ экрана
                if (physics.x < 0) {
                    physics.vx *= -0.6;
                    physics.x = 0;
                    physics.rotVY += (Math.random() - 0.5) * 5;
                } else if (physics.x > maxX) {
                    physics.vx *= -0.6;
                    physics.x = maxX;
                    physics.rotVY += (Math.random() - 0.5) * 5;
                }
                
                // Отскок от верхней границы
                if (physics.y < 0) {
                    physics.vy *= -0.6;
                    physics.y = 0;
                }
                
                // Отскок от нижней границы
                if (physics.y > maxY) {
                    physics.vy *= -0.6;
                    physics.y = maxY;
                }
                
                // Финальная проверка - строго ограничиваем границами
                physics.x = Math.max(0, Math.min(physics.x, maxX));
                physics.y = Math.max(0, Math.min(physics.y, maxY));
            }
            
            // Применяем transform
            const wrapper = mainDiceElements[index].wrapper;
            const cube = mainDiceElements[index].cube;
            wrapper.style.left = physics.x + 'px';
            wrapper.style.top = physics.y + 'px';
            // Вращение: rotY для качения, rotX и rotZ для случайных поворотов
            cube.style.transform = `rotateX(${physics.rotX}deg) rotateY(${physics.rotY}deg) rotateZ(${physics.rotZ}deg)`;
        });
        
        if (hasActiveDice || mainDiceElements.length > 0) {
            mainAnimationFrameId = requestAnimationFrame(animateMainDice);
        } else {
            mainAnimationFrameId = null;
        }
    }
    
    // Универсальная функция для обновления позиции при перетаскивании
    const updateDragPosition = (clientX, clientY) => {
        mainDicePhysics.forEach((physics) => {
            if (physics.isDragging) {
                // Вычисляем скорость движения
                const deltaTime = 16; // Примерно 60 FPS
                physics.mouseVelX = (clientX - physics.lastMouseX) / deltaTime * 1000;
                physics.mouseVelY = (clientY - physics.lastMouseY) / deltaTime * 1000;
                
                // Обновляем целевую позицию (кубик будет плавно следовать)
                const maxX = window.innerWidth - diceSize;
                const maxY = window.innerHeight - diceSize;
                physics.targetX = Math.max(0, Math.min(clientX - physics.dragStartX, maxX));
                physics.targetY = Math.max(0, Math.min(clientY - physics.dragStartY, maxY));
                
                physics.lastMouseX = clientX;
                physics.lastMouseY = clientY;
            }
        });
    };
    
    // Универсальная функция для окончания перетаскивания
    const endDrag = () => {
        mainDicePhysics.forEach((physics, index) => {
            if (physics.isDragging) {
                physics.isDragging = false;
                const wrapper = mainDiceElements[index].wrapper;
                wrapper.style.cursor = 'grab';
                
                // Придаем скорость при броске на основе скорости движения
                // Используем сохраненную скорость для более реалистичного броска
                const speedMultiplier = 0.5;
                physics.vx = physics.mouseVelX * speedMultiplier;
                physics.vy = physics.mouseVelY * speedMultiplier;
                
                // Вращение будет рассчитываться автоматически при движении (качение)
                
                // Запускаем анимацию если еще не запущена
                if (!mainAnimationFrameId) {
                    animateMainDice();
                }
            }
        });
    };
    
    // Глобальные обработчики для перемещения кубиков (мышь)
    document.addEventListener('mousemove', (e) => {
        updateDragPosition(e.clientX, e.clientY);
    });
    
    document.addEventListener('mouseup', (e) => {
        endDrag();
    });
    
    // Глобальные обработчики для touch-событий (мобильные устройства)
    document.addEventListener('touchmove', (e) => {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            
            // Проверяем, перетаскивается ли какой-либо кубик
            let isDraggingAnyDice = false;
            mainDicePhysics.forEach((physics) => {
                if (physics.isDragging) {
                    isDraggingAnyDice = true;
                    // Отслеживаем движение для определения тапа
                    if (physics.touchStartTime > 0) {
                        const moveDistance = Math.sqrt(
                            Math.pow(touch.clientX - physics.touchStartX, 2) + 
                            Math.pow(touch.clientY - physics.touchStartY, 2)
                        );
                        if (moveDistance > 5) {
                            physics.hasMoved = true;
                        }
                    }
                }
            });
            
            // Предотвращаем прокрутку страницы ТОЛЬКО при перетаскивании кубика
            if (isDraggingAnyDice) {
                e.preventDefault();
                updateDragPosition(touch.clientX, touch.clientY);
            }
            // Если кубик не перетаскивается, позволяем стандартную прокрутку страницы
        }
    }, { passive: false });
    
    document.addEventListener('touchend', (e) => {
        if (e.changedTouches.length === 1) {
            endDrag();
        }
    }, { passive: false });
    
    document.addEventListener('touchcancel', (e) => {
        // Отменяем перетаскивание при отмене касания (например, при входящем звонке)
        endDrag();
    }, { passive: false });
    
    // Обработчики кнопок
    const addDiceBtn = document.getElementById('add-dice-main');
    
    if (addDiceBtn) {
        addDiceBtn.addEventListener('click', () => {
            createMainDice();
        });
    }
    
    // Обработка изменения размера окна
    window.addEventListener('resize', () => {
        const maxX = Math.max(0, window.innerWidth - diceSize);
        const maxY = Math.max(0, window.innerHeight - diceSize);
        mainDicePhysics.forEach((physics) => {
            physics.x = Math.max(0, Math.min(physics.x, maxX));
            physics.y = Math.max(0, Math.min(physics.y, maxY));
        });
    });
});
