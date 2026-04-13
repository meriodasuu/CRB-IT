// ===== КОНФИГУРАЦИЯ =====
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwYOUR_SCRIPT_ID_HERE/exec';
const ADMIN_PIN = "7744"; // ПИН-код администратора

// ===== ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ =====
document.addEventListener('DOMContentLoaded', function() {
    // Инициализация списка сотрудников (если пусто)
    if (!localStorage.getItem('hospital_staff')) {
        const defaultStaff = [
            {
                id: 'staff-1',
                name: 'Иванова Мария Александровна',
                department: 'Терапевтическое отделение',
                pin: '3050',
                registeredAt: new Date().toLocaleString('ru-RU')
            },
            {
                id: 'staff-2',
                name: 'Петров Владимир Сергеевич',
                department: 'Хирургия',
                pin: '1122',
                registeredAt: new Date().toLocaleString('ru-RU')
            }
        ];
        localStorage.setItem('hospital_staff', JSON.stringify(defaultStaff));
    }
    
    // Проверяем, авторизован ли пользователь
    const savedAuth = sessionStorage.getItem('hospital_auth');
    const userRole = sessionStorage.getItem('hospital_role');
    
    if (savedAuth === 'true' && userRole) {
        if (userRole === 'staff') {
            showMainForm();
        } else if (userRole === 'admin') {
            window.location.href = 'admin.html';
        }
    }
    
    // Обработка Enter в поле PIN
    const pinInput = document.getElementById('pinCode');
    if (pinInput) {
        pinInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                checkAuth();
            }
        });
    }
});

// ===== ФУНКЦИИ АВТОРИЗАЦИИ =====
function checkAuth() {
    const pinInput = document.getElementById('pinCode');
    const pin = pinInput.value.trim();
    const messageEl = document.getElementById('authMessage');
    
    if (!pin) {
        messageEl.textContent = '❌ Введите PIN-код';
        messageEl.className = 'auth-message error';
        return;
    }
    
    // Проверяем админский PIN
    if (pin === ADMIN_PIN) {
        sessionStorage.setItem('hospital_auth', 'true');
        sessionStorage.setItem('hospital_role', 'admin');
        window.location.href = 'admin.html';
        return;
    }
    
    // Проверяем в списке сотрудников
    const staff = JSON.parse(localStorage.getItem('hospital_staff') || '[]');
    const staffMember = staff.find(m => m.pin === pin);
    
    if (staffMember) {
        sessionStorage.setItem('hospital_auth', 'true');
        sessionStorage.setItem('hospital_role', 'staff');
        sessionStorage.setItem('staff_name', staffMember.name);
        sessionStorage.setItem('staff_department', staffMember.department || '');
        showMainForm();
    } else {
        messageEl.textContent = '❌ Неверный PIN-код';
        messageEl.className = 'auth-message error';
        pinInput.value = '';
        pinInput.focus();
    }
}

function showMainForm() {
    document.getElementById('authBlock').style.display = 'none';
    document.getElementById('mainFormBlock').style.display = 'block';
    
    // Добавляем кнопку выхода
    const header = document.querySelector('.header');
    if (!document.getElementById('logoutBtn')) {
        const logoutBtn = document.createElement('button');
        logoutBtn.id = 'logoutBtn';
        logoutBtn.className = 'logout-btn';
        logoutBtn.innerHTML = '🚪 Выйти';
        logoutBtn.onclick = logout;
        header.style.position = 'relative';
        header.appendChild(logoutBtn);
    }
    
    // Показываем информацию о пользователе
    const staffName = sessionStorage.getItem('staff_name') || 'Сотрудник';
    const staffDept = sessionStorage.getItem('staff_department') || '';
    
    if (!document.getElementById('userLabel')) {
        const userLabel = document.createElement('div');
        userLabel.id = 'userLabel';
        userLabel.className = 'user-label';
        userLabel.innerHTML = `👤 ${staffName}${staffDept ? ' • ' + staffDept : ''}`;
        header.appendChild(userLabel);
    }
    
    // Автозаполнение имени в форме
    const contactInput = document.getElementById('contactName');
    if (contactInput && staffName !== 'Сотрудник') {
        contactInput.value = staffName.split(' ').slice(0, 2).join(' ');
    }
}

function logout() {
    sessionStorage.removeItem('hospital_auth');
    sessionStorage.removeItem('hospital_role');
    sessionStorage.removeItem('staff_name');
    sessionStorage.removeItem('staff_department');
    location.reload();
}

// ===== ФУНКЦИИ ФОРМЫ ЗАЯВОК =====
function showMessage(message, type = 'info') {
    const messageEl = document.getElementById('formMessage');
    messageEl.textContent = message;
    messageEl.className = 'form-message ' + type;
    
    if (type === 'success') {
        setTimeout(() => {
            messageEl.className = 'form-message';
        }, 5000);
    }
}

function setButtonLoading(isLoading) {
    const btn = document.getElementById('submitBtn');
    
    if (isLoading) {
        btn.disabled = true;
        btn.innerHTML = '<span class="btn-icon">⏳</span> Отправка...';
    } else {
        btn.disabled = false;
        btn.innerHTML = '<span class="btn-icon">📤</span> Отправить заявку';
    }
}

function collectFormData() {
    return {
        roomNumber: document.getElementById('roomNumber').value.trim(),
        equipmentType: document.getElementById('equipmentType').value,
        problemDescription: document.getElementById('problemDescription').value.trim(),
        priority: document.getElementById('priority').value,
        contactName: document.getElementById('contactName').value.trim(),
        timestamp: new Date().toLocaleString('ru-RU', { 
            timeZone: 'Europe/Moscow',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }),
        authorName: sessionStorage.getItem('staff_name') || 'Неизвестно',
        authorDept: sessionStorage.getItem('staff_department') || ''
    };
}

function validateForm(data) {
    const errors = [];
    
    if (!data.roomNumber) errors.push('Укажите номер кабинета');
    if (!data.equipmentType) errors.push('Выберите тип оборудования');
    if (!data.problemDescription) errors.push('Опишите проблему');
    if (data.problemDescription && data.problemDescription.length < 5) {
        errors.push('Опишите проблему подробнее (минимум 5 символов)');
    }
    if (!data.contactName) errors.push('Укажите ваше имя для связи');
    
    return errors;
}

function resetForm() {
    document.getElementById('requestForm').reset();
    document.getElementById('priority').value = 'Срочная';
    
    const staffName = sessionStorage.getItem('staff_name');
    if (staffName) {
        document.getElementById('contactName').value = staffName.split(' ').slice(0, 2).join(' ');
    }
}

function saveToLocalStorage(formData) {
    try {
        const existingRequests = JSON.parse(localStorage.getItem('hospital_requests') || '[]');
        
        const newRequest = {
            id: Date.now() + '-' + Math.random().toString(36).substr(2, 5),
            ...formData,
            status: 'Новая'
        };
        
        existingRequests.push(newRequest);
        localStorage.setItem('hospital_requests', JSON.stringify(existingRequests));
        return true;
    } catch (error) {
        console.error('Ошибка сохранения:', error);
        return false;
    }
}

// ===== ОБРАБОТЧИК ФОРМЫ =====
document.getElementById('requestForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = collectFormData();
    const errors = validateForm(formData);
    
    if (errors.length > 0) {
        showMessage('❌ ' + errors.join('. '), 'error');
        return;
    }
    
    setButtonLoading(true);
    showMessage('📡 Отправка заявки...', 'info');
    
    try {
        if (!SCRIPT_URL.includes('YOUR_SCRIPT_ID')) {
            await fetch(SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: JSON.stringify(formData)
            });
        }
        
        saveToLocalStorage(formData);
        showMessage(`✅ Заявка принята! Кабинет: ${formData.roomNumber}`, 'success');
        resetForm();
        
    } catch (error) {
        console.error('Ошибка:', error);
        saveToLocalStorage(formData);
        showMessage('⚠️ Заявка сохранена локально. Техник с вами свяжется.', 'info');
        resetForm();
    } finally {
        setButtonLoading(false);
    }
});