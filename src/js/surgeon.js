if (sessionStorage.getItem('role') !== 'surgeon') {
  window.location.href = '/index.html';
}

const tableBody = document.getElementById('table-body');
const savedNotification = document.getElementById('saved-notification');

// Варианты для выпадающих списков
const ringOptions = ['', '8.5', '9.0', '9.5'];
const flapOptions = ['', '90', '100', '110', '120', '130'];
const typeOptions = ['', 'ФЕМТО', 'ФРК', 'ПТК'];

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

  const createOptions = (options, value) => {
    return options
      .map(
        val =>
          `<option value="${val}" ${
            value === val 
              ? 'selected' 
              : ''}>${val || '—'
            }</option>`
      )
      .join('');
  };

  const createSelect = (index, field, options, value) => {
    return `<select class="${field}-select" data-index="${index}" data-field="${field}">
      ${createOptions(options, value)}
    </select>`;
  };

  list.forEach((item, index) => {
    const row = document.createElement('tr');

    if (item.type !== 'pause') {
      row.innerHTML = `
        <td><strong>${startTimes[index] || '—'}</strong></td>
        <td>${escapeHtml(item.fio || '—')}</td>
        <td>${escapeHtml(item.card || '—')}</td>
        <td>${createSelect(index, 'ring', ringOptions, item.ring || '')}</td>
        <td>${createSelect(index, 'flap', flapOptions, item.flap || '')}</td>
        <td>${createSelect(index, 'type', typeOptions, item.type || '')}</td>
        <td>${escapeHtml(item.notes || '—')}</td>
      `;
    } else {
      row.classList.add('pause-row');
      row.innerHTML = `
        <td><strong>${startTimes[index] || '—'}</strong></td>
        <td colspan="6">⏸ ПАУЗА (${item.duration} мин)</td>
      `;
    }

    tableBody.appendChild(row);
  });

  document.querySelectorAll('select[data-index]').forEach(select => {
    select.addEventListener('change', function () {
      const index = parseInt(this.dataset.index, 10);
      const field = this.dataset.field;

      updatePatient(index, { [field]: this.value });
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