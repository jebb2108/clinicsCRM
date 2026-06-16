if (sessionStorage.getItem('role') !== 'admin') {
  window.location.href = '/index.html';
}

const tableBody = document.getElementById('table-body');
const addForm = document.getElementById('add-form');
const tableWrap = document.querySelector('.patients-table-wrap');
const listControls = document.getElementById('admin-list-controls');
const togglePatientListBtn = document.getElementById('toggle-patient-list');
const togglePatientListLabel = document.getElementById('toggle-patient-list-label');
const adminEmptyState = document.getElementById('admin-empty-state');
const savedNotification = document.getElementById('saved-notification');
const navButtons = Array.from(document.querySelectorAll('.role-nav-btn'));
const dashboardViews = Array.from(document.querySelectorAll('.dashboard-view'));
const profileForm = document.getElementById('admin-profile-form');
const profileNameInput = document.getElementById('profile-name');
const profileLoginInput = document.getElementById('profile-login');
const profilePasswordInput = document.getElementById('profile-password');
const profilePhoneInput = document.getElementById('profile-phone');
const profileEmailInput = document.getElementById('profile-email');
const profileSpecialtyInput = document.getElementById('profile-specialty');
const profileSignatureInput = document.getElementById('profile-signature');
const startTimeInput = document.getElementById('start-time');
const addPhoneInput = document.getElementById('add-phone');
const PATIENT_PHONE_MASK_SLOTS = [4, 5, 6, 9, 10, 11, 13, 14, 16, 17];
let draggedRowIndex = null;
let isPatientListExpanded = false;

function extractPatientPhoneDigits(value) {
  return getPatientPhoneState(value).localDigits;
}

function getPatientPhoneState(value) {
  const rawValue = String(value || '').trim();
  const digits = rawValue.replace(/\D/g, '');
  const hasExplicitPlus = rawValue.startsWith('+');

  if (!digits) {
    return {
      countryCode: '7',
      localDigits: '',
      hasDigits: false,
      hasExplicitPlus
    };
  }

  if (hasExplicitPlus) {
    return {
      countryCode: digits[0],
      localDigits: digits.slice(1, 11),
      hasDigits: true,
      hasExplicitPlus
    };
  }

  if (digits.startsWith('9')) {
    return {
      countryCode: '7',
      localDigits: digits.slice(0, 10),
      hasDigits: true,
      hasExplicitPlus: false
    };
  }

  if (digits.startsWith('7') || digits.startsWith('8')) {
    return {
      countryCode: '7',
      localDigits: digits.slice(1, 11),
      hasDigits: true,
      hasExplicitPlus: false
    };
  }

  return {
    countryCode: digits[0],
    localDigits: digits.slice(1, 11),
    hasDigits: true,
    hasExplicitPlus: false
  };
}

function buildPatientPhoneMask(value) {
  const phoneState = getPatientPhoneState(value);
  const digits = phoneState.localDigits.split('');
  const masked = `+${phoneState.countryCode} (___) ___-__-__`.split('');

  PATIENT_PHONE_MASK_SLOTS.forEach((slotIndex, digitIndex) => {
    if (digits[digitIndex]) {
      masked[slotIndex] = digits[digitIndex];
    }
  });

  return masked.join('');
}

function countPatientLocalDigitsBeforeCaret(value, caretPosition) {
  const rawValue = String(value || '');
  const digits = rawValue.replace(/\D/g, '');
  const digitsBeforeCaret = rawValue.slice(0, caretPosition).replace(/\D/g, '');

  if (!digitsBeforeCaret.length) {
    return 0;
  }

  if (rawValue.trim().startsWith('+')) {
    return Math.max(digitsBeforeCaret.length - 1, 0);
  }

  if (digits.startsWith('9')) {
    return Math.min(digitsBeforeCaret.length, 10);
  }

  return Math.max(digitsBeforeCaret.length - 1, 0);
}

function getPatientPhoneCaretPosition(maskedValue, localDigitCount) {
  if (!maskedValue) {
    return 0;
  }

  if (!localDigitCount) {
    return PATIENT_PHONE_MASK_SLOTS[0];
  }

  if (localDigitCount >= PATIENT_PHONE_MASK_SLOTS.length) {
    return maskedValue.length;
  }

  return PATIENT_PHONE_MASK_SLOTS[localDigitCount];
}

function syncPatientPhoneMask() {
  const rawValue = addPhoneInput.value.trim();
  const phoneState = getPatientPhoneState(rawValue);
  const caretPosition = addPhoneInput.selectionStart ?? rawValue.length;
  const localDigitsBeforeCaret = countPatientLocalDigitsBeforeCaret(addPhoneInput.value, caretPosition);
  let nextValue = '';

  if (!rawValue) {
    addPhoneInput.value = '';
    return;
  }

  if (!phoneState.hasDigits && phoneState.hasExplicitPlus) {
    nextValue = '+';
  } else {
    nextValue = phoneState.hasDigits ? buildPatientPhoneMask(rawValue) : '';
  }

  addPhoneInput.value = nextValue;

  const nextCaretPosition = nextValue === '+'
    ? 1
    : getPatientPhoneCaretPosition(nextValue, localDigitsBeforeCaret);

  addPhoneInput.setSelectionRange(nextCaretPosition, nextCaretPosition);
}

function isPatientPhoneComplete(value) {
  return extractPatientPhoneDigits(value).length === 10;
}

function showSaved() {
  if (!savedNotification) return;

  savedNotification.classList.remove('hidden');
  clearTimeout(savedNotification._timeout);
  savedNotification._timeout = setTimeout(() => {
    savedNotification.classList.add('hidden');
  }, 2000);
}

function setActiveTab(tabName) {
  navButtons.forEach(button => {
    button.classList.toggle('is-active', button.dataset.tab === tabName);
  });

  dashboardViews.forEach(view => {
    view.classList.toggle('hidden', view.dataset.view !== tabName);
  });
}

function renderProfileForm() {
  const account = getCredentials().admin || { name: '', login: '', password: '' };
  const profile = getRoleProfile('admin');

  profileNameInput.value = account.name || '';
  profileLoginInput.value = account.login || '';
  profilePasswordInput.value = account.password || '';
  profilePhoneInput.value = profile.phone || '';
  profileEmailInput.value = profile.email || '';
  profileSpecialtyInput.value = profile.specialty || '';
  profileSignatureInput.value = profile.signature || '';
}

function updatePatientListControls(totalRows) {
  const hasPatients = totalRows > 0;
  const canCollapse = totalRows > 5;

  adminEmptyState.classList.toggle('hidden', hasPatients);
  tableWrap.classList.toggle('hidden', !hasPatients);
  tableWrap.classList.toggle('is-collapsed', canCollapse && !isPatientListExpanded);
  listControls.classList.toggle('hidden', !canCollapse);

  if (!canCollapse) {
    isPatientListExpanded = false;
    togglePatientListBtn.setAttribute('aria-expanded', 'false');
    togglePatientListBtn.title = 'Развернуть список';
    if (togglePatientListLabel) togglePatientListLabel.textContent = 'Развернуть список';
    return;
  }

  togglePatientListBtn.setAttribute('aria-expanded', String(isPatientListExpanded));
  togglePatientListBtn.title = isPatientListExpanded ? 'Свернуть список' : 'Развернуть список';
  if (togglePatientListLabel) {
    togglePatientListLabel.textContent = isPatientListExpanded ? 'Свернуть список' : 'Развернуть список';
  }
}

// ========== Рендеринг таблицы ==========
function renderTable() {
  const list = getOperationList();
  const startTimes = calculateStartTimes();
  tableBody.innerHTML = '';

  list.forEach((item, index) => {
    const row = document.createElement('tr');
    row.dataset.index = index;
    row.setAttribute('draggable', 'true');
    row.classList.add('draggable');

    if (item.type !== 'pause') {
      row.innerHTML = `
        <td class="drag-handle">☰</td>
        <td><strong>${startTimes[index] || '—'}</strong></td>
        <td>${escapeHtml(item.fio || '')}</td>
        <td>${escapeHtml(item.card || '')}</td>
        <td>${escapeHtml(item.bday) || ''}</td>
        <td>${escapeHtml(item.phone || '')}</td>
        <td>${escapeHtml(item.type || '')}</td>
        <td class="delete-cell"><button class="btn-delete" data-index="${index}">Удалить</button></td>
      `;
    } else {
      row.classList.add('pause-row');
      row.innerHTML = `
        <td class="drag-handle">☰</td>
        <td><strong>${startTimes[index] || '—'}</strong></td>
        <td colspan="7">ПАУЗА (${item.duration} мин)</td>
        <td class="delete-cell"><button class="btn-delete" data-index="${index}">Удалить</button></td>
      `;
    }

    // Drag-and-drop
    row.addEventListener('dragstart', handleDragStart);
    row.addEventListener('dragover', handleDragOver);
    row.addEventListener('dragleave', handleDragLeave);
    row.addEventListener('drop', handleDrop);
    row.addEventListener('dragend', handleDragEnd);

    tableBody.appendChild(row);
  });

  // Кнопки удаления
  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', function () {
      const idx = this.dataset.index;
      if (confirm('Удалить элемент?')) {
        deleteItem(idx);
        renderTable();
      }
    });
  });

  updatePatientListControls(list.length);
}

togglePatientListBtn.addEventListener('click', () => {
  isPatientListExpanded = !isPatientListExpanded;
  updatePatientListControls(getOperationList().length);
});

navButtons.forEach(button => {
  button.addEventListener('click', () => {
    setActiveTab(button.dataset.tab);
  });
});

profileForm.addEventListener('submit', event => {
  event.preventDefault();

  const name = profileNameInput.value.trim();
  const login = profileLoginInput.value.trim();
  const password = profilePasswordInput.value.trim();

  if (!name || !login || !password) {
    alert('Заполните имя, логин и пароль.');
    return;
  }

  const creds = getCredentials();
  creds.admin = { name, login, password };
  saveCredentials(creds);
  saveRoleProfile('admin', {
    phone: profilePhoneInput.value.trim(),
    email: profileEmailInput.value.trim(),
    specialty: profileSpecialtyInput.value.trim(),
    signature: profileSignatureInput.value.trim()
  });

  sessionStorage.setItem('userName', name);
  const userNameElement = document.getElementById('user-name');
  if (userNameElement) {
    userNameElement.textContent = name;
  }
  showSaved();
});

// ========== Drag & Drop ==========
function handleDragStart(e) {
  draggedRowIndex = this.dataset.index;
  this.style.opacity = '0.5';
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', draggedRowIndex);
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  this.classList.add('drag-over');
}

function handleDragLeave(e) {
  this.classList.remove('drag-over');
}

function handleDrop(e) {
  e.stopPropagation();
  this.classList.remove('drag-over');
  const targetIndex = this.dataset.index;
  if (draggedRowIndex !== targetIndex) {
    moveItem(draggedRowIndex, targetIndex);
    renderTable();
  }
}

function handleDragEnd(e) {
  this.style.opacity = '1';
  document.querySelectorAll('tr').forEach(r => r.classList.remove('drag-over'));
}

// ========== Форма добавления пациента ==========
document.getElementById('toggle-add-form').addEventListener('click', () => {
  addForm.classList.toggle('hidden');
});

document.getElementById('cancel-add').addEventListener('click', () => {
  addForm.classList.add('hidden');
  clearAddForm();
});

document.getElementById('add-type').addEventListener('change', function () {
  const durInput = document.getElementById('add-duration');
  if (!durInput) return;

  if (this.value === 'ФЕМТО') durInput.value = 15;
  else if (this.value === 'ФРК') durInput.value = 10;
  else durInput.value = 15;
});

// Сохранение пациента
document.getElementById('save-patient').addEventListener('click', () => {
  const fio = document.getElementById('add-fio').value.trim();
  const card = document.getElementById('add-card').value.trim();
  const bday = document.getElementById('add-bday').value.trim();
  const phone = formatPhoneNumber(addPhoneInput.value);

  if (!fio) {
    alert('Поле "ФИО" обязательно для заполнения.');
    return;
  }
  if (!card) {
    alert('Поле "№ медкарты" обязательно для заполнения.');
    return;
  }
  if (!bday) {
    alert('Поле "Дата рождения" обязательно для заполнения.');
  }
  if (!phone) {
    alert('Поле "Телефон" обязательно для заполнения.');
    return;
  }
  if (!isPatientPhoneComplete(addPhoneInput.value)) {
    alert('Введите телефон полностью в формате +7 (___) ___-__-__.');
    return;
  }

  addPhoneInput.value = phone;

  const type = document.getElementById('add-type').value;

  // Автоматическое определение длительности
  let duration;
  if (type === 'ФЕМТО') duration = 15;
  else duration = 10 // по умолчанию;

  const patient = {
    fio, card, bday, phone, type, duration,
    ring: document.getElementById('add-ring')?.value.trim() || '—',
    flap: document.getElementById('add-flap')?.value.trim() || '—'
  };
  addPatient(patient);
  clearAddForm();
  addForm.classList.add('hidden');
  renderTable();
});

function clearAddForm() {
  document.getElementById('add-fio').value = '';
  document.getElementById('add-card').value = '';
  document.getElementById('add-bday').value = '';
  addPhoneInput.value = '';
  document.getElementById('add-type').selectedIndex = 0;
}

addPhoneInput.addEventListener('input', () => {
  syncPatientPhoneMask();
});

addPhoneInput.addEventListener('blur', () => {
  const phoneState = getPatientPhoneState(addPhoneInput.value);

  if (!phoneState.localDigits.length) {
    addPhoneInput.value = '';
    return;
  }

  if (isPatientPhoneComplete(addPhoneInput.value)) {
    addPhoneInput.value = formatPhoneNumber(addPhoneInput.value);
    return;
  }

  addPhoneInput.value = buildPatientPhoneMask(addPhoneInput.value);
});

// ========== Добавление паузы ==========
document.getElementById('add-pause-btn').addEventListener('click', () => {
  const duration = prompt('Введите длительность паузы (мин):', '5');
  if (duration === null) return;
  const dur = parseInt(duration, 10);
  if (isNaN(dur) || dur <= 0) {
    alert('Введите положительное число.');
    return;
  }
  addPause(dur);
  renderTable();
});

// ========== Начало дня ==========
startTimeInput.addEventListener('change', function () {
  const settings = getSettings();
  settings.startTime = this.value;
  saveSettings(settings);
  renderTable();
});


// ========== Скачивание Word ==========
function importPatientsFromExcel(event) {
  const file = event.target.files[0];

  if (!file) return;

  const reader = new FileReader();

  reader.onload = function (e) {
    try {

      const patients = [];

      const workbook = XLSX.read(
        e.target.result, {type: 'array'}
      );

      const sheet = workbook.Sheets[workbook.SheetNames[0]];

      const rows = XLSX.utils.sheet_to_json(
        sheet, { header: 1, defval: ''
      });

      const OPERATION_TYPES = { 'ФЕМТО': 15, 'ФРК': 10, 'ПТК': 15 };


      rows.forEach(row => {

        // Пропускаем пустые строки
        if (!row || row.length < 6) return;

        // Пропускаем строку заголовка
        const fioColumn = String(row[2] || '').trim();

        if (
          fioColumn.includes('Ф.И.О.') ||
          fioColumn.includes('пациента')
        ) {
          return;
        }

        if (!fioColumn) return;

        // ФИО и дата рождения находятся в одной ячейке
        const fioParts = fioColumn
          .split(/\r?\n/)
          .map(v => v.trim())
          .filter(Boolean);

        const fio = fioParts[0] || '';
        const bday = fioParts[1] || '';

        // Описание операции
        const description = String(row[3] || '').trim();

        const type = description.split(/\s+/)[0]?.toUpperCase().replace(/,.*/, '') || 'ФЕМТО';

        const duration = OPERATION_TYPES[type] || 15;

        const phone = formatPhoneNumber(String(row[4] || '').trim());
        const card = String(row[5] || '').trim();

        patients.push({ fio, card, bday, phone, type, duration, ring: '—', flap: '—' });

      });

      if (!patients.length) {
        alert('Пациенты не найдены.');
        return;
      }

      patients.forEach(patient => addPatient(patient));

      renderTable();

      console.log('Импортированные пациенты:', patients);

    } catch (err) {
      console.error(err);
      alert('Ошибка чтения Excel-файла.');
    }

    event.target.value = '';
  };

  reader.readAsArrayBuffer(file);
}

// ========== Инициализация ==========
document.getElementById('excel-file').addEventListener('change', importPatientsFromExcel);
startTimeInput.value = getSettings().startTime;
renderProfileForm();
renderTable();
