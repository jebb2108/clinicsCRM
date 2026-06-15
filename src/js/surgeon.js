if (sessionStorage.getItem('role') !== 'surgeon') {
  window.location.href = '/index.html';
}

const tableBody = document.getElementById('table-body');
const savedNotification = document.getElementById('saved-notification');

// Варианты для выпадающих списков
const ringOptions = ['', '8.5', '9.0', '9.5'];
const flapOptions = ['', '90', '100', '110', '120', '130'];

// Функция показа "Сохранено"
function showSaved() {
  if (!savedNotification) return;
  savedNotification.classList.remove('hidden');
  clearTimeout(savedNotification._timeout);
  savedNotification._timeout = setTimeout(() => {
    savedNotification.classList.add('hidden');
  }, 2000);
}

// Отрисовка таблицы
function renderTable() {
  const list = getOperationList();
  const startTimes = calculateStartTimes();
  tableBody.innerHTML = '';

  list.forEach((item, index) => {
    const row = document.createElement('tr');

    if (item.type !== 'pause') {
      const ringSelect = ringOptions.map(val =>
        `<option value="${val}" ${item.ring === val ? 'selected' : ''}>${val || '—'}</option>`
      ).join('');
      const flapSelect = flapOptions.map(val =>
        `<option value="${val}" ${item.flap === val ? 'selected' : ''}>${val || '—'}</option>`
      ).join('');

      row.innerHTML = `
        <td><strong>${startTimes[index] || '—'}</strong></td>
        <td>${escapeHtml(item.fio || '—')}</td>
        <td>${escapeHtml(item.card || '—')}</td>
        <td><select class="ring-select" data-index="${index}">${ringSelect}</select></td>
        <td><select class="flap-select" data-index="${index}">${flapSelect}</select></td>
        <td>${escapeHtml(item.phone || '—')}</td>
        <td>${escapeHtml(item.notes || '—')}</td>
        <td>${escapeHtml(item.type || '—')}</td>
      `;
    } else {
      row.classList.add('pause-row');
      row.innerHTML = `
        <td><strong>${startTimes[index] || '—'}</strong></td>
        <td colspan="7">⏸ ПАУЗА (${item.duration} мин)</td>
      `;
    }

    tableBody.appendChild(row);
  });

  // Автосохранение при изменении выпадающих списков
  document.querySelectorAll('.ring-select').forEach(select => {
    select.addEventListener('change', function () {
      updatePatient(parseInt(this.dataset.index, 10), { ring: this.value });
      showSaved();
    });
  });

  document.querySelectorAll('.flap-select').forEach(select => {
    select.addEventListener('change', function () {
      updatePatient(parseInt(this.dataset.index, 10), { flap: this.value });
      showSaved();
    });
  });
}

// Кнопка выхода
document.getElementById('logout-btn').addEventListener('click', () => {
  sessionStorage.clear();
  window.location.href = '/index.html';
});

// Заполнение user-panel
const userName = sessionStorage.getItem('userName') || 'Хирург';
const today = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

document.getElementById('user-name-display').textContent = userName;
document.getElementById('current-date').textContent = today;

renderTable();