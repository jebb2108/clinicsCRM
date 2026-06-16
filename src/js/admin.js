if (sessionStorage.getItem('role') !== 'admin') {
  window.location.href = '/index.html';
}

const tableBody = document.getElementById('table-body');
const addForm = document.getElementById('add-form');
let draggedRowIndex = null;

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
}

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
  if (this.value === 'ФЕМТО') durInput.value = 15;
  else if (this.value === 'ФРК') durInput.value = 10;
  else durInput.value = 15;
});

// Сохранение пациента
document.getElementById('save-patient').addEventListener('click', () => {
  const fio = document.getElementById('add-fio').value.trim();
  const card = document.getElementById('add-card').value.trim();
  const bday = document.getElementById('add-bday').value.trim();
  const phone = document.getElementById('add-phone').value.trim();

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
  document.getElementById('add-phone').value = '';
  document.getElementById('add-type').selectedIndex = 0;
}

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
document.getElementById('start-time').addEventListener('change', function () {
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

        const phone = String(row[4] || '').trim();
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
document.getElementById('start-time').value = getSettings().startTime;
renderTable();