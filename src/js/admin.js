if (sessionStorage.getItem('role') !== 'admin') {
  window.location.href = '../index.html';
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
        <td>${escapeHtml(item.ring || '')}</td>
        <td>${escapeHtml(item.flap || '')}</td>
        <td>${escapeHtml(item.phone || '')}</td>
        <td>${escapeHtml(item.type || '')}</td>
        <td>${escapeHtml(item.notes || '')}</td>
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
  const phone = document.getElementById('add-phone').value.trim();

  if (!fio) {
    alert('Поле "ФИО" обязательно для заполнения.');
    return;
  }
  if (!card) {
    alert('Поле "№ медкарты" обязательно для заполнения.');
    return;
  }
  if (!phone) {
    alert('Поле "Телефон" обязательно для заполнения.');
    return;
  }

  const type = document.getElementById('add-type').value;

  // Автоматическое определение длительности
  let duration = 15; // по умолчанию
  if (type === 'ФЕМТО') duration = 15;
  else if (type === 'ФРК') duration = 10;

  const patient = {
    fio,
    card,
    phone,
    type,
    notes: document.getElementById('add-notes').value.trim(),
    duration
  };
  addPatient(patient);
  clearAddForm();
  addForm.classList.add('hidden');
  renderTable();
});

function clearAddForm() {
  document.getElementById('add-fio').value = '';
  document.getElementById('add-card').value = '';
  document.getElementById('add-phone').value = '';
  document.getElementById('add-notes').value = '';
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
document.getElementById('download-word').addEventListener('click', () => {
  const list = getOperationList();
  const startTimes = calculateStartTimes();
  let html = `<html><head><meta charset="utf-8"><title>Список операций</title></head><body>
    <h2>Список пациентов:</h2>
    <table border="1" cellpadding="5" style="border-collapse:collapse;">
      <tr><th>Время</th><th>ФИО</th><th>№ карты</th><th>Телефон</th><th>Особенности</th></tr>`;
  list.forEach((item, idx) => {
    if (item.type !== 'pause') {
      html += `<tr>
        <td>${startTimes[idx]}</td>
        <td>${escapeHtml(item.fio)}</td>
        <td>${escapeHtml(item.card)}</td>
        <td>${escapeHtml(item.phone)}</td>
        <td>${escapeHtml(item.type + ', ' + item.notes)}</td>
      </tr>`;
    } else {
      html += `<tr style="background-color:#f1f3f5;">
        <td>${startTimes[idx]}</td>
        <td colspan="7" style="text-align:center;">ПАУЗА (${item.duration} мин)</td>
      </tr>`;
    }
  });
  html += '</table></body></html>';

  const blob = htmlDocx.asBlob(html);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  currentDate = Date.now().toLocaleString('ru-RU')
  a.href = url;
  a.download = `список_операций_${currentDate}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

// ========== Инициализация ==========
document.getElementById('start-time').value = getSettings().startTime;
renderTable();