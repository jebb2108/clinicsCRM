if (sessionStorage.getItem('role') !== 'surgeon') {
  window.location.href = '/index.html';
}

const tableBody = document.getElementById('table-body');
const savedNotification = document.getElementById('saved-notification');
// Заполнение user-panel
const userName = sessionStorage.getItem('userName') || 'Хирург';
const today = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });


// Варианты для выпадающих списков
const eyeOptions = ['OU', 'OD', 'OS'];
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

function setupNotesAutosave(input) {

  let timeout;
  const save = () => {
    const index = Number(input.dataset.index);
    updatePatient(index, {
      notes: input.value.trim()
    });
    showSaved();
  };

  input.addEventListener('input', function () {
    clearTimeout(timeout);
    timeout = setTimeout(save, 3000);
  });

  input.addEventListener('blur', function () {
    clearTimeout(timeout);
    save();
  });
}

// Отрисовка таблицы
function renderTable() {
  const list = getOperationList();
  const startTimes = calculateStartTimes();
  tableBody.innerHTML = '';

  const createOptions = (options, value) => {
    return options
      .map(
        val => `<option value="${val}" ${value === val ? 'selected' : ''}>${val || '—'}</option>`
      )
      .join('');
  };

  const createSelect = (index, field, options, value, disabled = false) => {
    return `
      <select
        class="${field}-select"
        data-index="${index}"
        data-field="${field}"
        ${disabled ? 'disabled' : ''}
      >
        ${createOptions(options, value)}
      </select>
    `;
  };

  list.forEach((item, index) => {
    const row = document.createElement('tr');

    if (item.type !== 'pause') {
      const isFemto = item.type === 'ФЕМТО';

      row.innerHTML = `
        <td><strong>${startTimes[index] || '—'}</strong></td>
        <td>${createSelect(index, 'eye', eyeOptions, item.eye || 'OU')}</td>
        <td>${escapeHtml(item.fio || '—')}</td>
        <td>${escapeHtml(item.card || '—')}</td>
        <td>${createSelect(index, 'ring', ringOptions, item.ring || '', !isFemto)}</td>
        <td>${createSelect(index, 'flap', flapOptions, item.flap || '', !isFemto)}</td>
        <td>${createSelect(index, 'type', typeOptions, item.type || '')}</td>
        <td>
          <input
            type="text"
            class="notes-input"
            data-index="${index}"
            value="${(item.notes || '').replace(/"/g, '&quot;')}"
            placeholder="Особенности лечения"
          >
        </td>
      `;
    } else {
      row.classList.add('pause-row');
      row.innerHTML = `
        <td><strong>${startTimes[index] || '—'}</strong></td>
        <td colspan="8">ПАУЗА (${item.duration} мин)</td>
      `;
    }

    tableBody.appendChild(row);
  });

  document.querySelectorAll('select[data-index]').forEach(select => {
    select.addEventListener('change', function () {
      const index = parseInt(this.dataset.index, 10);
      const field = this.dataset.field;
      const value = this.value;

      updatePatient(index, { [field]: value });

      if (field === 'type' && value !== 'ФЕМТО') {
        updatePatient(index, {
          ring: '',
          flap: ''
        });
      }

      showSaved();
      renderTable();
    });
  });

  document.querySelectorAll('.notes-input').forEach(setupNotesAutosave);
}

// Кнопка выхода
document.getElementById('logout-btn').addEventListener('click', () => {
  sessionStorage.clear();
  window.location.href = '/index.html';
});

document.getElementById('user-name-display').textContent = userName;
document.getElementById('current-date').textContent = today;

renderTable();