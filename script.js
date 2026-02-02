// Datos del horario
let scheduleData = JSON.parse(localStorage.getItem('scheduleData')) || [];
let scheduleTitle = localStorage.getItem('scheduleTitle') || '📅 Mi Horario Semanal';
let scheduleSubtitle = localStorage.getItem('scheduleSubtitle') || 'Haz clic para editar';

// Configuración de horarios con intervalos de 30 minutos
function generateTimeSlots(start, end) {
    const slots = [];
    for (let hour = start; hour <= end; hour++) {
        slots.push(`${hour.toString().padStart(2, '0')}:00`);
        if (hour < end) {
            slots.push(`${hour.toString().padStart(2, '0')}:30`);
        }
    }
    return slots;
}

// Calcular rango de horas basado en las clases
function calculateTimeRange() {
    if (scheduleData.length === 0) {
        return { start: 7, end: 22 };
    }
    
    let minHour = 24;
    let maxHour = 0;
    
    scheduleData.forEach(classItem => {
        const [startHour] = classItem.startTime.split(':').map(Number);
        const [endHour] = classItem.endTime.split(':').map(Number);
        
        minHour = Math.min(minHour, startHour);
        maxHour = Math.max(maxHour, endHour);
    });
    
    // Añadir una hora de margen antes y después
    minHour = Math.max(6, minHour - 1);
    maxHour = Math.min(23, maxHour + 1);
    
    return { start: minHour, end: maxHour };
}

function updateTimeSlots() {
    const range = calculateTimeRange();
    timeSlots = generateTimeSlots(range.start, range.end);
    
    // Actualizar info del rango
    const infoEl = document.getElementById('timeRangeInfo');
    if (infoEl) {
        if (scheduleData.length === 0) {
            infoEl.textContent = '📊 Vista automática';
        } else {
            infoEl.textContent = `📊 Horario: ${range.start}:00 - ${range.end}:00`;
        }
    }
}

let timeSlots = generateTimeSlots(7, 22);
const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

// Generar horario vacío
function generateSchedule() {
    const schedule = document.getElementById('schedule');
    schedule.innerHTML = '';
    
    // Limpiar visibilidad de todas las celdas
    document.querySelectorAll('.schedule-cell').forEach(cell => {
        cell.style.visibility = 'visible';
    });
    
    // Header vacío
    const cornerCell = document.createElement('div');
    cornerCell.className = 'schedule-cell schedule-header-cell';
    cornerCell.textContent = 'Hora';
    schedule.appendChild(cornerCell);
    
    // Headers de días
    days.forEach(day => {
        const dayCell = document.createElement('div');
        dayCell.className = 'schedule-cell schedule-header-cell';
        dayCell.textContent = day;
        schedule.appendChild(dayCell);
    });
    
    // Filas de tiempo
    timeSlots.forEach(time => {
        // Celda de tiempo
        const timeCell = document.createElement('div');
        timeCell.className = 'schedule-cell time-cell';
        timeCell.textContent = time;
        schedule.appendChild(timeCell);
        
        // Celdas de días
        days.forEach(day => {
            const cell = document.createElement('div');
            cell.className = 'schedule-cell';
            cell.dataset.time = time;
            cell.dataset.day = day;
            schedule.appendChild(cell);
        });
    });
    
    // Renderizar clases
    renderClasses();
}

// Función para editar clase
function editClass(index) {
    const classItem = scheduleData[index];
    
    // Llenar el formulario
    document.getElementById('className').value = classItem.name;
    document.getElementById('teacher').value = classItem.teacher || '';
    document.getElementById('color').value = classItem.color;
    document.getElementById('startTime').value = classItem.startTime;
    document.getElementById('endTime').value = classItem.endTime;
    document.getElementById('room').value = classItem.room || '';
    document.getElementById('editingIndex').value = index;
    
    // Marcar los días
    document.querySelectorAll('.days-selector input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = classItem.days.includes(checkbox.value);
    });
    
    // Cambiar UI del formulario
    document.getElementById('formTitle').textContent = '✏️ Editar Clase';
    document.getElementById('submitBtn').textContent = '💾 Guardar Cambios';
    document.getElementById('cancelBtn').style.display = 'block';
    
    // Scroll al formulario
    document.querySelector('.controls').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Función para cancelar edición
function cancelEdit() {
    document.getElementById('classForm').reset();
    document.getElementById('editingIndex').value = '-1';
    document.getElementById('formTitle').textContent = '➕ Nueva Clase';
    document.getElementById('submitBtn').textContent = '✨ Agregar Clase';
    document.getElementById('cancelBtn').style.display = 'none';
    document.getElementById('color').value = getRandomColor();
}

// Renderizar clases en el horario
function renderClasses() {
    // Limpiar todas las clases existentes
    document.querySelectorAll('.class-block').forEach(block => block.remove());
    
    scheduleData.forEach((classItem, index) => {
        classItem.days.forEach(day => {
            const [startHour, startMin] = classItem.startTime.split(':').map(Number);
            const [endHour, endMin] = classItem.endTime.split(':').map(Number);
            
            // Calcular la duración en minutos
            const startTotalMin = startHour * 60 + startMin;
            const endTotalMin = endHour * 60 + endMin;
            const durationMin = endTotalMin - startTotalMin;
            
            // Encontrar el slot de tiempo más cercano
            const startTimeStr = `${startHour.toString().padStart(2, '0')}:${startMin < 30 ? '00' : '30'}`;
            
            // Buscar todas las celdas que abarca esta clase
            const slotsNeeded = Math.ceil(durationMin / 30);
            const cells = [];
            
            for (let i = 0; i < slotsNeeded; i++) {
                const slotIndex = timeSlots.indexOf(startTimeStr) + i;
                if (slotIndex < timeSlots.length) {
                    const timeStr = timeSlots[slotIndex];
                    const cell = document.querySelector(`[data-time="${timeStr}"][data-day="${day}"]`);
                    if (cell) cells.push(cell);
                }
            }
            
            // Crear el bloque de clase en la primera celda
            if (cells.length > 0) {
                const firstCell = cells[0];
                
                const classBlock = document.createElement('div');
                classBlock.className = 'class-block';
                classBlock.style.backgroundColor = classItem.color;
                classBlock.draggable = true;
                classBlock.dataset.classIndex = index;
                classBlock.dataset.originalDay = day;
                
                // Ajustar altura para que ocupe múltiples celdas si es necesario
                if (cells.length > 1) {
                    // Obtener altura real de la celda desde CSS
                    const cellHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--cell-height') || '40');
                    const cellPadding = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--cell-padding') || '2');
                    const totalHeight = (cellHeight * cells.length) - cellPadding;
                    classBlock.style.height = `${totalHeight}px`;
                    classBlock.style.position = 'absolute';
                    classBlock.style.top = `${cellPadding}px`;
                    classBlock.style.left = `${cellPadding}px`;
                    classBlock.style.right = `${cellPadding}px`;
                    classBlock.style.zIndex = '5';
                }
                
                const className = document.createElement('div');
                className.className = 'class-name';
                className.textContent = classItem.name;
                
                const classTime = document.createElement('div');
                classTime.className = 'class-time';
                classTime.textContent = `${classItem.startTime} - ${classItem.endTime}`;
                
                classBlock.appendChild(className);
                classBlock.appendChild(classTime);
                
                if (classItem.teacher) {
                    const classTeacher = document.createElement('div');
                    classTeacher.className = 'class-teacher';
                    classTeacher.textContent = `👨‍🏫 ${classItem.teacher}`;
                    classBlock.appendChild(classTeacher);
                }
                
                if (classItem.room) {
                    const classRoom = document.createElement('div');
                    classRoom.className = 'class-room';
                    classRoom.textContent = `📍 ${classItem.room}`;
                    classBlock.appendChild(classRoom);
                }
                
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'delete-btn';
                deleteBtn.textContent = '×';
                deleteBtn.onclick = (e) => {
                    e.stopPropagation();
                    deleteClass(index);
                };
                
                // Añadir evento de clic para editar
                classBlock.onclick = (e) => {
                    if (!e.target.classList.contains('delete-btn')) {
                        editClass(index);
                    }
                };
                
                classBlock.appendChild(deleteBtn);
                firstCell.appendChild(classBlock);
                
                // Marcar las celdas restantes como ocupadas
                for (let i = 1; i < cells.length; i++) {
                    cells[i].style.visibility = 'hidden';
                }
            }
        });
    });
    
    updateClassList();
}

// Actualizar lista de clases
function updateClassList() {
    const classList = document.getElementById('classList');
    
    if (scheduleData.length === 0) {
        classList.innerHTML = '<p class="empty-state">No hay clases aún</p>';
        return;
    }
    
    classList.innerHTML = scheduleData.map((classItem, index) => `
        <div class="class-item" style="border-left-color: ${classItem.color}" onclick="editClass(${index})">
            <div class="class-item-info">
                <div class="class-item-name">${classItem.name}</div>
                <div class="class-item-details">
                    ${classItem.startTime} - ${classItem.endTime} | ${classItem.days.join(', ')}
                    ${classItem.teacher ? ` | 👨‍🏫 ${classItem.teacher}` : ''}
                    ${classItem.room ? ` | 📍 ${classItem.room}` : ''}
                </div>
            </div>
            <button class="class-item-remove" onclick="event.stopPropagation(); deleteClass(${index})">×</button>
        </div>
    `).join('');
}

// Agregar o editar clase
document.getElementById('classForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const name = document.getElementById('className').value.trim();
    const teacher = document.getElementById('teacher').value.trim();
    const color = document.getElementById('color').value;
    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;
    const room = document.getElementById('room').value.trim();
    const editingIndex = parseInt(document.getElementById('editingIndex').value);
    
    const selectedDays = Array.from(document.querySelectorAll('.days-selector input[type="checkbox"]:checked'))
        .map(checkbox => checkbox.value);
    
    if (selectedDays.length === 0) {
        showNotification('⚠️ Selecciona al menos un día', 'warning');
        return;
    }
    
    if (startTime >= endTime) {
        showNotification('⚠️ La hora de inicio debe ser anterior a la hora de fin', 'warning');
        return;
    }
    
    const classData = {
        name,
        teacher,
        color,
        startTime,
        endTime,
        days: selectedDays,
        room
    };
    
    if (editingIndex >= 0) {
        // Editar clase existente
        scheduleData[editingIndex] = classData;
        showNotification('✅ Clase actualizada correctamente', 'success');
    } else {
        // Agregar nueva clase
        scheduleData.push(classData);
        showNotification('✅ Clase agregada correctamente', 'success');
    }
    
    saveData();
    updateTimeSlots();
    generateSchedule();
    
    // Limpiar formulario
    cancelEdit();
});

// Botón de cancelar
document.getElementById('cancelBtn').addEventListener('click', cancelEdit);

// Eliminar clase
function deleteClass(index) {
    if (confirm('¿Estás seguro de eliminar esta clase?')) {
        scheduleData.splice(index, 1);
        saveData();
        cancelEdit(); // Cancelar edición si estaba editando la clase eliminada
        updateTimeSlots();
        generateSchedule();
        showNotification('🗑️ Clase eliminada', 'info');
    }
}

// Limpiar todo
document.getElementById('clearBtn').addEventListener('click', () => {
    if (scheduleData.length === 0) {
        showNotification('⚠️ No hay clases para limpiar', 'warning');
        return;
    }
    
    if (confirm('¿Estás seguro de eliminar todo el horario?')) {
        scheduleData = [];
        saveData();
        cancelEdit();
        updateTimeSlots();
        generateSchedule();
        showNotification('🗑️ Horario limpiado', 'info');
    }
});

// Descargar horario como imagen
document.getElementById('downloadBtn').addEventListener('click', async () => {
    const scheduleTitle = document.getElementById('scheduleTitle').textContent || 'Mi Horario Semanal';
    
    try {
        showNotification('⬇️ Generando descarga...', 'info');
        
        // Crear contenedor temporal con solo el horario (sin controles)
        const scheduleContainer = document.querySelector('.schedule-container');
        const captureContainer = document.createElement('div');
        captureContainer.style.padding = '20px';
        captureContainer.style.position = 'absolute';
        captureContainer.style.left = '-10000px';
        captureContainer.style.top = '0';
        captureContainer.style.width = scheduleContainer.offsetWidth + 'px';
        
        // Aplicar imagen de fondo si existe
        if (bgImageSettings.backgroundImage) {
            captureContainer.style.backgroundImage = `url('${bgImageSettings.backgroundImage}')`;
            captureContainer.style.backgroundPosition = bgImageSettings.bgPosition || 'center';
            captureContainer.style.backgroundSize = bgImageSettings.bgSize || 'cover';
            captureContainer.style.backgroundRepeat = bgImageSettings.bgRepeat || 'no-repeat';
        } else {
            captureContainer.style.backgroundColor = 'white';
        }
        
        // Clonar el encabezado (título y subtítulo)
        const headerEl = document.getElementById('scheduleHeaderContainer');
        if (headerEl) {
            const headerClone = headerEl.cloneNode(true);
            captureContainer.appendChild(headerClone);
        }
        
        // Clonar solo la tabla del horario (sin los controles)
        const scheduleEl = document.getElementById('schedule');
        if (scheduleEl) {
            const scheduleClone = scheduleEl.cloneNode(true);
            captureContainer.appendChild(scheduleClone);
        }
        
        // Obtener variables CSS actuales
        const root = document.documentElement;
        const styles = window.getComputedStyle(root);
        
        // Extraer todas las variables CSS personalizadas
        let cssVars = '';
        for (let prop of styles) {
            if (prop.startsWith('--')) {
                const value = styles.getPropertyValue(prop).trim();
                cssVars += `${prop}: ${value}; `;
            }
        }
        
        // Crear un estilo temporal
        const styleSheet = document.createElement('style');
        styleSheet.textContent = `
            :root { ${cssVars} }
            * { 
                border-radius: ${styles.getPropertyValue('--border-radius').trim()} !important;
            }
            .class-block {
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25) !important;
                border: 1px solid rgba(255, 255, 255, 0.25) !important;
            }
            #schedule {
                background: rgba(255, 255, 255, 0.95) !important;
                margin-top: 20px !important;
            }
            .schedule-cell {
                background: white !important;
                border-color: rgba(0, 0, 0, 0.06) !important;
            }
            .schedule-header-cell {
                background: rgba(245, 245, 247, 0.8) !important;
            }
            .time-cell {
                background: rgba(245, 245, 247, 0.6) !important;
            }
            .schedule-title {
                color: ${designSettings.titleColor || '#1C1C1E'} !important;
                margin: 0 !important;
            }
            .schedule-subtitle {
                color: ${designSettings.subtitleColor || '#8E8E93'} !important;
                margin: 0 !important;
            }
        `;
        document.head.appendChild(styleSheet);
        
        // Agregar al DOM
        document.body.appendChild(captureContainer);
        
        // Esperar a que se renderice
        await new Promise(r => setTimeout(r, 500));
        
        // Capturar con html2canvas
        const contentCanvas = await html2canvas(captureContainer, {
            backgroundColor: null,
            scale: 2,
            logging: false,
            useCORS: true,
            allowTaint: true,
            imageTimeout: 0,
            windowWidth: captureContainer.scrollWidth,
            windowHeight: captureContainer.scrollHeight
        });
        
        // Remover elementos temporales
        document.body.removeChild(captureContainer);
        document.head.removeChild(styleSheet);
        
        // Descargar directamente
        const link = document.createElement('a');
        const fileName = scheduleTitle.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').toLowerCase();
        link.download = `${fileName || 'horario'}-${new Date().toISOString().split('T')[0]}.png`;
        link.href = contentCanvas.toDataURL('image/png');
        link.click();
        
        showNotification('✅ Horario descargado correctamente', 'success');
    } catch (error) {
        showNotification('❌ Error al descargar el horario', 'error');
        console.error(error);
    }
});

// ===== IMPORTAR/EXPORTAR JSON =====

// Exportar a JSON
document.getElementById('exportJsonBtn').addEventListener('click', () => {
    const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        scheduleData: scheduleData,
        designSettings: designSettings
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `horario_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showNotification('✅ Horario exportado exitosamente', 'success');
});

// Importar desde JSON
document.getElementById('importJsonBtn').addEventListener('click', () => {
    document.getElementById('importJsonFile').click();
});

document.getElementById('importJsonFile').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const importedData = JSON.parse(event.target.result);
            
            // Validar estructura
            if (!importedData.scheduleData || !Array.isArray(importedData.scheduleData)) {
                throw new Error('Formato de archivo inválido');
            }
            
            // Validar cada clase
            const validClasses = importedData.scheduleData.every(classItem => 
                classItem.name && 
                classItem.color && 
                classItem.startTime && 
                classItem.endTime && 
                Array.isArray(classItem.days)
            );
            
            if (!validClasses) {
                throw new Error('Los datos del horario son inválidos');
            }
            
            // Confirmar importación
            if (scheduleData.length > 0) {
                if (!confirm('¿Deseas reemplazar el horario actual? Esta acción no se puede deshacer.')) {
                    e.target.value = ''; // Reset file input
                    return;
                }
            }
            
            // Importar datos
            scheduleData = importedData.scheduleData;
            localStorage.setItem('scheduleData', JSON.stringify(scheduleData));
            
            // Importar configuración de diseño si existe
            if (importedData.designSettings) {
                designSettings = { ...defaultSettings, ...importedData.designSettings };
                localStorage.setItem('designSettings', JSON.stringify(designSettings));
                applyDesignSettings();
            }
            
            // Actualizar vista
            updateTimeSlots();
            generateSchedule();
            
            showNotification('✅ Horario importado exitosamente', 'success');
            
        } catch (error) {
            showNotification('❌ Error al importar: ' + error.message, 'error');
        }
        
        // Reset file input
        e.target.value = '';
    };
    
    reader.onerror = () => {
        showNotification('❌ Error al leer el archivo', 'error');
        e.target.value = '';
    };
    
    reader.readAsText(file);
});

// Guardar datos en localStorage
function saveData() {
    localStorage.setItem('scheduleData', JSON.stringify(scheduleData));
}

// Colores predefinidos
const colors = ['#4CAF50', '#2196F3', '#FF9800', '#E91E63', '#9C27B0', '#F44336', '#00BCD4', '#FFC107'];

function getRandomColor() {
    return colors[Math.floor(Math.random() * colors.length)];
}

// Selector de colores predefinidos
document.querySelectorAll('.color-preset').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const color = btn.dataset.color;
        document.getElementById('color').value = color;
    });
});

// Mostrar notificación mejorada
function showNotification(message, type = 'info') {
    const colors = {
        success: '#4CAF50',
        error: '#f44336',
        warning: '#FF9800',
        info: '#2196F3'
    };
    
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type] || colors.info};
        color: white;
        padding: 16px 24px;
        border-radius: 10px;
        box-shadow: 0 6px 20px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideIn 0.3s ease;
        font-weight: 600;
        max-width: 350px;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Agregar animaciones CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ===== CONFIGURACIÓN DE DISEÑO =====
const defaultSettings = {
    cellHeight: 40,
    fontSize: 11,
    cellPadding: 2,
    headerSize: 13,
    timeColumnWidth: 80,
    borderRadius: 6,
    titleColor: '#1C1C1E',
    subtitleColor: '#8E8E93',
    titleShadowColor: '#000000',
    titleShadowBlur: 4,
    titleShadowOpacity: 15,
    headerColorStart: '#667eea',
    headerColorEnd: '#764ba2',
    timeColumnColorStart: '#f8f9fa',
    timeColumnColorEnd: '#e9ecef',
    cellBackgroundColor: '#ffffff',
    scheduleBgColor: '#f8f9fa'
};

// Cargar configuración guardada o usar valores predeterminados
let designSettings = JSON.parse(localStorage.getItem('designSettings')) || {...defaultSettings};

// Aplicar configuración al cargar
function applyDesignSettings() {
    const root = document.documentElement;
    root.style.setProperty('--cell-height', `${designSettings.cellHeight}px`);
    root.style.setProperty('--font-size', `${designSettings.fontSize}px`);
    root.style.setProperty('--cell-padding', `${designSettings.cellPadding}px`);
    root.style.setProperty('--header-size', `${designSettings.headerSize}px`);
    root.style.setProperty('--time-column-width', `${designSettings.timeColumnWidth}px`);
    root.style.setProperty('--border-radius', `${designSettings.borderRadius}px`);
    root.style.setProperty('--header-color-start', designSettings.headerColorStart);
    root.style.setProperty('--header-color-end', designSettings.headerColorEnd);
    root.style.setProperty('--time-column-color-start', designSettings.timeColumnColorStart);
    root.style.setProperty('--time-column-color-end', designSettings.timeColumnColorEnd);
    root.style.setProperty('--cell-bg-color', designSettings.cellBackgroundColor);
    root.style.setProperty('--schedule-bg-color', designSettings.scheduleBgColor);
    
    // Aplicar colores al título y subtítulo
    const titleEl = document.getElementById('scheduleTitle');
    const subtitleEl = document.getElementById('scheduleSubtitle');
    if (titleEl) {
        titleEl.style.color = designSettings.titleColor;
        // Aplicar sombra al título
        const hexToRgba = (hex, alpha) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        };
        const shadowColor = designSettings.titleShadowColor || '#000000';
        const shadowBlur = designSettings.titleShadowBlur || 4;
        const shadowOpacity = (designSettings.titleShadowOpacity || 15) / 100;
        titleEl.style.textShadow = `0 2px ${shadowBlur}px ${hexToRgba(shadowColor, shadowOpacity)}`;
    }
    if (subtitleEl) subtitleEl.style.color = designSettings.subtitleColor;
    
    // Actualizar valores mostrados
    document.getElementById('cellHeightValue').textContent = `${designSettings.cellHeight}px`;
    document.getElementById('fontSizeValue').textContent = `${designSettings.fontSize}px`;
    document.getElementById('cellPaddingValue').textContent = `${designSettings.cellPadding}px`;
    document.getElementById('headerSizeValue').textContent = `${designSettings.headerSize}px`;
    document.getElementById('timeColumnWidthValue').textContent = `${designSettings.timeColumnWidth}px`;
    document.getElementById('borderRadiusValue').textContent = `${designSettings.borderRadius}px`;
    
    // Actualizar controles deslizantes
    document.getElementById('cellHeight').value = designSettings.cellHeight;
    document.getElementById('fontSize').value = designSettings.fontSize;
    document.getElementById('cellPadding').value = designSettings.cellPadding;
    document.getElementById('headerSize').value = designSettings.headerSize;
    document.getElementById('timeColumnWidth').value = designSettings.timeColumnWidth;
    document.getElementById('borderRadius').value = designSettings.borderRadius;
    
    // Actualizar selectores de color
    document.getElementById('titleColor').value = designSettings.titleColor || '#1C1C1E';
    document.getElementById('subtitleColor').value = designSettings.subtitleColor || '#8E8E93';
    document.getElementById('titleShadowColor').value = designSettings.titleShadowColor || '#000000';
    document.getElementById('titleShadowBlur').value = designSettings.titleShadowBlur || 4;
    document.getElementById('titleShadowBlurValue').textContent = (designSettings.titleShadowBlur || 4) + 'px';
    document.getElementById('titleShadowOpacity').value = designSettings.titleShadowOpacity || 15;
    document.getElementById('titleShadowOpacityValue').textContent = (designSettings.titleShadowOpacity || 15) + '%';
    document.getElementById('titleShadowColor').value = designSettings.titleShadowColor || '#000000';
    document.getElementById('titleShadowBlur').value = designSettings.titleShadowBlur || 4;
    document.getElementById('titleShadowBlurValue').textContent = (designSettings.titleShadowBlur || 4) + 'px';
    document.getElementById('titleShadowOpacity').value = designSettings.titleShadowOpacity || 15;
    document.getElementById('titleShadowOpacityValue').textContent = (designSettings.titleShadowOpacity || 15) + '%';
    document.getElementById('headerColorStart').value = designSettings.headerColorStart;
    document.getElementById('headerColorEnd').value = designSettings.headerColorEnd;
    document.getElementById('timeColumnColorStart').value = designSettings.timeColumnColorStart;
    document.getElementById('timeColumnColorEnd').value = designSettings.timeColumnColorEnd;
    document.getElementById('cellBackgroundColor').value = designSettings.cellBackgroundColor;
    document.getElementById('scheduleBgColor').value = designSettings.scheduleBgColor;
}

// Guardar configuración
function saveDesignSettings() {
    localStorage.setItem('designSettings', JSON.stringify(designSettings));
}

// Event listeners para controles de diseño
document.getElementById('cellHeight').addEventListener('input', (e) => {
    designSettings.cellHeight = parseInt(e.target.value);
    document.getElementById('cellHeightValue').textContent = `${e.target.value}px`;
    applyDesignSettings();
    saveDesignSettings();
    generateSchedule(); // Regenerar para aplicar cambios
});

document.getElementById('fontSize').addEventListener('input', (e) => {
    designSettings.fontSize = parseInt(e.target.value);
    document.getElementById('fontSizeValue').textContent = `${e.target.value}px`;
    applyDesignSettings();
    saveDesignSettings();
});

document.getElementById('cellPadding').addEventListener('input', (e) => {
    designSettings.cellPadding = parseInt(e.target.value);
    document.getElementById('cellPaddingValue').textContent = `${e.target.value}px`;
    applyDesignSettings();
    saveDesignSettings();
    generateSchedule();
});

document.getElementById('headerSize').addEventListener('input', (e) => {
    designSettings.headerSize = parseInt(e.target.value);
    document.getElementById('headerSizeValue').textContent = `${e.target.value}px`;
    applyDesignSettings();
    saveDesignSettings();
});

document.getElementById('timeColumnWidth').addEventListener('input', (e) => {
    designSettings.timeColumnWidth = parseInt(e.target.value);
    document.getElementById('timeColumnWidthValue').textContent = `${e.target.value}px`;
    applyDesignSettings();
    saveDesignSettings();
});

document.getElementById('borderRadius').addEventListener('input', (e) => {
    designSettings.borderRadius = parseInt(e.target.value);
    document.getElementById('borderRadiusValue').textContent = `${e.target.value}px`;
    applyDesignSettings();
    saveDesignSettings();
});

// Event listeners para selectores de color
document.getElementById('titleColor').addEventListener('input', (e) => {
    designSettings.titleColor = e.target.value;
    applyDesignSettings();
    saveDesignSettings();
});

document.getElementById('subtitleColor').addEventListener('input', (e) => {
    designSettings.subtitleColor = e.target.value;
    applyDesignSettings();
    saveDesignSettings();
});

document.getElementById('titleShadowColor').addEventListener('input', (e) => {
    designSettings.titleShadowColor = e.target.value;
    applyDesignSettings();
    saveDesignSettings();
});

document.getElementById('titleShadowBlur').addEventListener('input', (e) => {
    designSettings.titleShadowBlur = parseInt(e.target.value);
    document.getElementById('titleShadowBlurValue').textContent = e.target.value + 'px';
    applyDesignSettings();
    saveDesignSettings();
});

document.getElementById('titleShadowOpacity').addEventListener('input', (e) => {
    designSettings.titleShadowOpacity = parseInt(e.target.value);
    document.getElementById('titleShadowOpacityValue').textContent = e.target.value + '%';
    applyDesignSettings();
    saveDesignSettings();
});

document.getElementById('headerColorStart').addEventListener('input', (e) => {
    designSettings.headerColorStart = e.target.value;
    applyDesignSettings();
    saveDesignSettings();
});

document.getElementById('headerColorEnd').addEventListener('input', (e) => {
    designSettings.headerColorEnd = e.target.value;
    applyDesignSettings();
    saveDesignSettings();
});

document.getElementById('timeColumnColorStart').addEventListener('input', (e) => {
    designSettings.timeColumnColorStart = e.target.value;
    applyDesignSettings();
    saveDesignSettings();
});

document.getElementById('timeColumnColorEnd').addEventListener('input', (e) => {
    designSettings.timeColumnColorEnd = e.target.value;
    applyDesignSettings();
    saveDesignSettings();
});

document.getElementById('cellBackgroundColor').addEventListener('input', (e) => {
    designSettings.cellBackgroundColor = e.target.value;
    applyDesignSettings();
    saveDesignSettings();
});

document.getElementById('scheduleBgColor').addEventListener('input', (e) => {
    designSettings.scheduleBgColor = e.target.value;
    applyDesignSettings();
    saveDesignSettings();
});

// Botón de configuración
document.getElementById('settingsBtn').addEventListener('click', () => {
    const panel = document.getElementById('settingsPanel');
    const mainGrid = document.querySelector('.main-grid');
    panel.classList.toggle('visible');
    mainGrid.classList.toggle('settings-open');
});

// Botón cerrar configuración
document.getElementById('closeSettings').addEventListener('click', () => {
    const panel = document.getElementById('settingsPanel');
    const mainGrid = document.querySelector('.main-grid');
    panel.classList.remove('visible');
    mainGrid.classList.remove('settings-open');
});

// Función para esperar a que el DOM esté listo
function initializeBackgroundSettings() {
    // Inicializar valores de background si existen
    if (bgImageSettings.bgOpacity) {
        const opacityEl = document.getElementById('bgOpacity');
        const opacityValueEl = document.getElementById('bgOpacityValue');
        if (opacityEl) {
            opacityEl.value = bgImageSettings.bgOpacity;
            opacityValueEl.textContent = `${bgImageSettings.bgOpacity}%`;
        }
    }
    
    if (bgImageSettings.bgBlur) {
        const blurEl = document.getElementById('bgBlur');
        const blurValueEl = document.getElementById('bgBlurValue');
        if (blurEl) {
            blurEl.value = bgImageSettings.bgBlur;
            blurValueEl.textContent = `${bgImageSettings.bgBlur}px`;
        }
    }
    
    // Inicializar checkboxes
    document.getElementById('textShadow').checked = bgImageSettings.textShadow;
    document.getElementById('cellShadow').checked = bgImageSettings.cellShadow;
    document.getElementById('glassMorphism').checked = bgImageSettings.glassMorphism;
    document.getElementById('boldText').checked = bgImageSettings.boldText;
    document.getElementById('cellBorder').checked = bgImageSettings.cellBorder;
    document.getElementById('animationEnabled').checked = bgImageSettings.animationEnabled;
    
    // Inicializar selectores
    if (document.getElementById('bgPosition')) {
        document.getElementById('bgPosition').value = bgImageSettings.bgPosition;
        document.getElementById('bgSize').value = bgImageSettings.bgSize;
        document.getElementById('bgRepeat').value = bgImageSettings.bgRepeat;
    }
}

// Event listeners para resetSettings y closeSettings
document.addEventListener('DOMContentLoaded', () => {
    const resetBtn = document.getElementById('resetSettings');
    const closeBtn = document.getElementById('closeSettings');
    
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm('¿Deseas restaurar la configuración predeterminada?')) {
                designSettings = {...defaultSettings};
                Object.assign(bgImageSettings, {
                    bgOpacity: 100,
                    bgBlur: 0,
                    textShadow: false,
                    cellShadow: false,
                    glassMorphism: true,
                    boldText: false,
                    cellBorder: true,
                    animationEnabled: true
                });
                bgImageSettings.backgroundImage = null;
                document.getElementById('backgroundImageInput').value = '';
                
                applyDesignSettings();
                applyBackgroundImage();
                saveDesignSettings();
                saveBgSettings();
                
                document.querySelectorAll('.btn-preset').forEach(b => b.classList.remove('active'));
                showNotification('✅ Configuración restaurada', 'success');
            }
        });
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            document.getElementById('settingsPanel').style.display = 'none';
        });
    }
});

// ===== DRAG AND DROP DE MATERIAS =====
let draggedClassData = null;

function enableDragAndDrop() {
    const schedule = document.getElementById('schedule');
    
    schedule.addEventListener('dragstart', (e) => {
        if (e.target.classList.contains('class-block')) {
            draggedClassData = {
                index: parseInt(e.target.dataset.classIndex),
                originalDay: e.target.dataset.originalDay
            };
            e.target.style.opacity = '0.5';
            e.dataTransfer.effectAllowed = 'move';
        }
    });
    
    schedule.addEventListener('dragend', (e) => {
        if (e.target.classList.contains('class-block')) {
            e.target.style.opacity = '1';
        }
    });
    
    schedule.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    });
    
    schedule.addEventListener('drop', (e) => {
        e.preventDefault();
        
        if (!draggedClassData) return;
        
        const targetCell = e.target.closest('.schedule-cell');
        if (targetCell && targetCell.dataset.day && targetCell.dataset.time) {
            const newDay = targetCell.dataset.day;
            const classItem = scheduleData[draggedClassData.index];
            
            // Remover el día anterior y añadir el nuevo
            const dayIndex = classItem.days.indexOf(draggedClassData.originalDay);
            if (dayIndex !== -1 && !classItem.days.includes(newDay)) {
                classItem.days[dayIndex] = newDay;
                saveData();
                generateSchedule();
                showNotification('✅ Clase movida correctamente', 'success');
            } else if (classItem.days.includes(newDay)) {
                showNotification('⚠️ La clase ya existe en ese día', 'warning');
            }
        }
        
        draggedClassData = null;
    });
}

// ===== TÍTULO EDITABLE =====
function initEditableTitle() {
    const titleEl = document.getElementById('scheduleTitle');
    const subtitleEl = document.getElementById('scheduleSubtitle');
    
    if (titleEl) {
        titleEl.textContent = scheduleTitle;
        titleEl.addEventListener('blur', () => {
            scheduleTitle = titleEl.textContent.trim() || '📅 Mi Horario Semanal';
            localStorage.setItem('scheduleTitle', scheduleTitle);
        });
        
        titleEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                titleEl.blur();
            }
        });
    }
    
    if (subtitleEl) {
        subtitleEl.textContent = scheduleSubtitle;
        subtitleEl.addEventListener('blur', () => {
            scheduleSubtitle = subtitleEl.textContent.trim() || 'Haz clic para editar';
            localStorage.setItem('scheduleSubtitle', scheduleSubtitle);
        });
        
        subtitleEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                subtitleEl.blur();
            }
        });
    }
}

// ===== AÑADIR/QUITAR HORAS CON CURSOR =====
let isResizing = false;
let resizingBlock = null;
let resizingDirection = null;
let originalHeight = 0;
let startY = 0;

function enableClassResizing() {
    const schedule = document.getElementById('schedule');
    
    schedule.addEventListener('mousedown', (e) => {
        const classBlock = e.target.closest('.class-block');
        if (!classBlock) return;
        
        const rect = classBlock.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const edgeThreshold = 10;
        
        // Detectar si está cerca del borde superior o inferior
        if (y < edgeThreshold) {
            isResizing = true;
            resizingDirection = 'top';
            resizingBlock = classBlock;
            originalHeight = rect.height;
            startY = e.clientY;
            classBlock.style.cursor = 'ns-resize';
            e.preventDefault();
        } else if (y > rect.height - edgeThreshold) {
            isResizing = true;
            resizingDirection = 'bottom';
            resizingBlock = classBlock;
            originalHeight = rect.height;
            startY = e.clientY;
            classBlock.style.cursor = 'ns-resize';
            e.preventDefault();
        }
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isResizing) {
            // Cambiar cursor al pasar sobre bordes
            const classBlock = e.target.closest('.class-block');
            if (classBlock) {
                const rect = classBlock.getBoundingClientRect();
                const y = e.clientY - rect.top;
                const edgeThreshold = 10;
                
                if (y < edgeThreshold || y > rect.height - edgeThreshold) {
                    classBlock.style.cursor = 'ns-resize';
                } else {
                    classBlock.style.cursor = 'pointer';
                }
            }
            return;
        }
        
        e.preventDefault();
        const deltaY = e.clientY - startY;
        const cellHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--cell-height') || '40');
        const slots = Math.round(Math.abs(deltaY) / cellHeight);
        
        if (slots > 0) {
            const classIndex = parseInt(resizingBlock.dataset.classIndex);
            const classItem = scheduleData[classIndex];
            const [startHour, startMin] = classItem.startTime.split(':').map(Number);
            const [endHour, endMin] = classItem.endTime.split(':').map(Number);
            
            if (resizingDirection === 'bottom' && deltaY > 0) {
                // Extender hacia abajo
                const newEndMin = endMin + (slots * 30);
                const newEndHour = endHour + Math.floor(newEndMin / 60);
                const finalEndMin = newEndMin % 60;
                
                if (newEndHour < 24) {
                    classItem.endTime = `${newEndHour.toString().padStart(2, '0')}:${finalEndMin.toString().padStart(2, '0')}`;
                }
            } else if (resizingDirection === 'bottom' && deltaY < 0) {
                // Reducir desde abajo
                const newEndMin = endMin - (slots * 30);
                const newEndHour = endHour + Math.floor(newEndMin / 60);
                const finalEndMin = ((newEndMin % 60) + 60) % 60;
                
                const newEndTotal = (newEndHour * 60) + finalEndMin;
                const startTotal = (startHour * 60) + startMin;
                
                if (newEndTotal > startTotal + 30) {
                    classItem.endTime = `${newEndHour.toString().padStart(2, '0')}:${finalEndMin.toString().padStart(2, '0')}`;
                }
            } else if (resizingDirection === 'top' && deltaY < 0) {
                // Extender hacia arriba
                const newStartMin = startMin - (slots * 30);
                const newStartHour = startHour + Math.floor(newStartMin / 60);
                const finalStartMin = ((newStartMin % 60) + 60) % 60;
                
                if (newStartHour >= 0) {
                    classItem.startTime = `${newStartHour.toString().padStart(2, '0')}:${finalStartMin.toString().padStart(2, '0')}`;
                }
            } else if (resizingDirection === 'top' && deltaY > 0) {
                // Reducir desde arriba
                const newStartMin = startMin + (slots * 30);
                const newStartHour = startHour + Math.floor(newStartMin / 60);
                const finalStartMin = newStartMin % 60;
                
                const newStartTotal = (newStartHour * 60) + finalStartMin;
                const endTotal = (endHour * 60) + endMin;
                
                if (newStartTotal < endTotal - 30) {
                    classItem.startTime = `${newStartHour.toString().padStart(2, '0')}:${finalStartMin.toString().padStart(2, '0')}`;
                }
            }
            
            saveData();
            updateTimeSlots();
            generateSchedule();
            
            // Actualizar referencias
            const newBlock = document.querySelector(`[data-class-index="${classIndex}"]`);
            if (newBlock) {
                resizingBlock = newBlock;
                startY = e.clientY;
            }
        }
    });
    
    document.addEventListener('mouseup', () => {
        if (isResizing) {
            isResizing = false;
            resizingBlock = null;
            resizingDirection = null;
            showNotification('✅ Horario actualizado', 'success');
        }
    });
}

// ===== FUNCIONES DE FONDO DE IMAGEN =====

// Extensión de configuración de diseño
const bgImageSettings = {
    backgroundImage: null,
    bgOpacity: 100,
    bgBlur: 0,
    bgPosition: 'center',
    bgSize: 'cover',
    bgRepeat: 'no-repeat',
    textShadow: false,
    cellShadow: false,
    glassMorphism: true,
    boldText: false,
    cellBorder: true,
    animationEnabled: true
};

// Cargar configuración de fondo
const savedBgSettings = localStorage.getItem('bgImageSettings');
if (savedBgSettings) {
    Object.assign(bgImageSettings, JSON.parse(savedBgSettings));
}

// Aplicar configuración de fondo
function applyBackgroundImage() {
    const scheduleContainer = document.querySelector('.schedule-container');
    const schedule = document.getElementById('schedule');
    
    if (!scheduleContainer) return;
    
    if (bgImageSettings.backgroundImage) {
        // Aplicar fondo al contenedor principal
        const opacity = bgImageSettings.bgOpacity / 100;
        const blur = bgImageSettings.bgBlur;
        
        // Usar un pseudo-elemento para el overlay
        let style = document.getElementById('bgOverlayStyle');
        if (!style) {
            style = document.createElement('style');
            style.id = 'bgOverlayStyle';
            document.head.appendChild(style);
        }
        
        style.textContent = `
            .schedule-container {
                position: relative;
                background-image: url('${bgImageSettings.backgroundImage}');
                background-position: ${bgImageSettings.bgPosition};
                background-size: ${bgImageSettings.bgSize};
                background-repeat: ${bgImageSettings.bgRepeat};
                background-attachment: fixed;
            }
            
            .schedule-container::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-image: url('${bgImageSettings.backgroundImage}');
                background-position: ${bgImageSettings.bgPosition};
                background-size: ${bgImageSettings.bgSize};
                background-repeat: ${bgImageSettings.bgRepeat};
                background-attachment: fixed;
                opacity: ${opacity};
                filter: blur(${blur}px);
                pointer-events: none;
                z-index: 0;
            }
            
            .schedule-container > * {
                position: relative;
                z-index: 1;
            }
        `;
        
        scheduleContainer.style.position = 'relative';
    } else {
        // Limpiar estilos si no hay imagen
        scheduleContainer.style.backgroundImage = 'none';
        scheduleContainer.style.position = '';
        const style = document.getElementById('bgOverlayStyle');
        if (style) style.remove();
    }
    
    applyVisualEffects();
}

// Aplicar efectos visuales
function applyVisualEffects() {
    const schedule = document.getElementById('schedule');
    const cells = document.querySelectorAll('.schedule-cell');
    
    // Sombra de texto
    cells.forEach(cell => {
        if (bgImageSettings.textShadow) {
            cell.style.textShadow = '0 1px 3px rgba(0,0,0,0.3)';
        } else {
            cell.style.textShadow = 'none';
        }
        
        // Texto en negrita
        if (bgImageSettings.boldText) {
            cell.style.fontWeight = '600';
        } else {
            cell.style.fontWeight = 'normal';
        }
    });
    
    // Sombra de celdas
    const scheduleClassBlocks = document.querySelectorAll('.class-block');
    scheduleClassBlocks.forEach(block => {
        if (bgImageSettings.cellShadow) {
            block.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        } else {
            block.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        }
    });
    
    // Bordes de celdas
    if (bgImageSettings.cellBorder) {
        document.documentElement.style.setProperty('--apple-border', 'rgba(0, 0, 0, 0.06)');
    } else {
        document.documentElement.style.setProperty('--apple-border', 'transparent');
    }
    
    // Glassmorphism
    const controls = document.querySelector('.controls');
    const header = document.querySelector('.main-header');
    if (controls && header) {
        if (bgImageSettings.glassMorphism) {
            controls.style.backdropFilter = 'blur(30px) saturate(180%)';
            controls.style.webkitBackdropFilter = 'blur(30px) saturate(180%)';
            header.style.backdropFilter = 'blur(30px) saturate(180%)';
            header.style.webkitBackdropFilter = 'blur(30px) saturate(180%)';
        } else {
            controls.style.backdropFilter = 'none';
            controls.style.webkitBackdropFilter = 'none';
            header.style.backdropFilter = 'none';
            header.style.webkitBackdropFilter = 'none';
        }
    }
    
    // Animaciones
    if (!bgImageSettings.animationEnabled) {
        document.documentElement.style.setProperty('--animation-duration', '0s');
    } else {
        document.documentElement.style.setProperty('--animation-duration', '0.3s');
    }
}

// Manejo de carga de imagen
document.getElementById('backgroundImageInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            bgImageSettings.backgroundImage = event.target.result;
            saveBgSettings();
            applyBackgroundImage();
            showNotification('✅ Fondo cargado exitosamente', 'success');
        };
        reader.readAsDataURL(file);
    }
});

// Controles de opacidad y blur
document.getElementById('bgOpacity').addEventListener('input', (e) => {
    bgImageSettings.bgOpacity = parseInt(e.target.value);
    document.getElementById('bgOpacityValue').textContent = `${e.target.value}%`;
    applyBackgroundImage();
    saveBgSettings();
});

document.getElementById('bgBlur').addEventListener('input', (e) => {
    bgImageSettings.bgBlur = parseInt(e.target.value);
    document.getElementById('bgBlurValue').textContent = `${e.target.value}px`;
    applyBackgroundImage();
    saveBgSettings();
});

// Selectores de posición y tamaño
document.getElementById('bgPosition').addEventListener('change', (e) => {
    bgImageSettings.bgPosition = e.target.value;
    applyBackgroundImage();
    saveBgSettings();
});

document.getElementById('bgSize').addEventListener('change', (e) => {
    bgImageSettings.bgSize = e.target.value;
    applyBackgroundImage();
    saveBgSettings();
});

document.getElementById('bgRepeat').addEventListener('change', (e) => {
    bgImageSettings.bgRepeat = e.target.value;
    applyBackgroundImage();
    saveBgSettings();
});

// Botón para remover fondo
document.getElementById('removeBackgroundBtn').addEventListener('click', () => {
    bgImageSettings.backgroundImage = null;
    document.getElementById('backgroundImageInput').value = '';
    applyBackgroundImage();
    saveBgSettings();
    showNotification('✅ Fondo removido', 'success');
});

// Efectos visuales
document.getElementById('textShadow').addEventListener('change', (e) => {
    bgImageSettings.textShadow = e.target.checked;
    applyVisualEffects();
    saveBgSettings();
});

document.getElementById('cellShadow').addEventListener('change', (e) => {
    bgImageSettings.cellShadow = e.target.checked;
    applyVisualEffects();
    saveBgSettings();
});

document.getElementById('glassMorphism').addEventListener('change', (e) => {
    bgImageSettings.glassMorphism = e.target.checked;
    applyVisualEffects();
    saveBgSettings();
});

document.getElementById('boldText').addEventListener('change', (e) => {
    bgImageSettings.boldText = e.target.checked;
    applyVisualEffects();
    saveBgSettings();
});

document.getElementById('cellBorder').addEventListener('change', (e) => {
    bgImageSettings.cellBorder = e.target.checked;
    applyVisualEffects();
    saveBgSettings();
});

document.getElementById('animationEnabled').addEventListener('change', (e) => {
    bgImageSettings.animationEnabled = e.target.checked;
    applyVisualEffects();
    saveBgSettings();
});

// Guardar configuración de fondo
function saveBgSettings() {
    localStorage.setItem('bgImageSettings', JSON.stringify(bgImageSettings));
}

// Inicializar funcionalidades adicionales
enableDragAndDrop();
initEditableTitle();
enableClassResizing();
applyBackgroundImage();
applyDesignSettings();
updateTimeSlots();
generateSchedule();

// Inicializar valores de background cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initializeBackgroundSettings();
    });
} else {
    initializeBackgroundSettings();
}


