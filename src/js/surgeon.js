if (sessionStorage.getItem('role') !== 'surgeon') {
  window.location.href = '/index.html';
}

const tableBody = document.getElementById('table-body');
const savedNotification = document.getElementById('saved-notification');
const tableWrap = document.querySelector('.surgeon-table-wrap');
const togglePatientListBtn = document.getElementById('toggle-patient-list');
const surgeonListHint = document.getElementById('surgeon-list-hint');
const approveListBtn = document.getElementById('approve-list-btn');
const approvalModal = document.getElementById('approval-modal');
const operationDateInput = document.getElementById('operation-date');
const confirmApprovalBtn = document.getElementById('confirm-approval-btn');
const cancelApprovalBtn = document.getElementById('cancel-approval-btn');
const approvalStatus = document.getElementById('approval-status');
const currentEmptyState = document.getElementById('current-empty-state');
const approvedTableBody = document.getElementById('approved-table-body');
const approvedEmptyState = document.getElementById('approved-empty-state');
const approvedTableWrap = document.getElementById('approved-table-wrap');
const navButtons = Array.from(document.querySelectorAll('.surgeon-nav-btn'));
const dashboardViews = Array.from(document.querySelectorAll('.dashboard-view'));
const profileForm = document.getElementById('surgeon-profile-form');
const profileNameInput = document.getElementById('profile-name');
const profileLoginInput = document.getElementById('profile-login');
const profilePasswordInput = document.getElementById('profile-password');
const profilePhoneInput = document.getElementById('profile-phone');
const profileEmailInput = document.getElementById('profile-email');
const profileSpecialtyInput = document.getElementById('profile-specialty');
const profileSignatureInput = document.getElementById('profile-signature');
const profileAutoExpandInput = document.getElementById('profile-auto-expand');

let currentUserName = sessionStorage.getItem('userName') || 'Хирург';
let activeTab = 'current';
let isPatientListExpanded = null;

const eyeOptions = ['', 'OU', 'OD', 'OS'];
const ringOptions = ['', '8.5', '9.0', '9.5'];
const flapOptions = ['', '90', '100', '110', '120', '130'];
const typeOptions = ['', 'ФЕМТО', 'ФРК', 'ПТК'];

function getTodayIsoDate() {
  const now = new Date();
  const tzOffset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - tzOffset).toISOString().slice(0, 10);
}

function formatDisplayDate(dateValue) {
  if (!dateValue) return '';

  return new Date(`${dateValue}T00:00:00`).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function formatDateTime(dateValue) {
  if (!dateValue) return '';

  return new Date(dateValue).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function showSaved() {
  if (!savedNotification) return;

  savedNotification.classList.remove('hidden');
  clearTimeout(savedNotification._timeout);
  savedNotification._timeout = setTimeout(() => {
    savedNotification.classList.add('hidden');
  }, 2000);
}

function setApprovalModalOpen(isOpen) {
  approvalModal.classList.toggle('hidden', !isOpen);
  approvalModal.setAttribute('aria-hidden', String(!isOpen));

  if (isOpen) {
    operationDateInput.focus();
  }
}

function getSurgeonAccount() {
  const creds = getCredentials();
  return creds.surgeon || { login: '', password: '', name: currentUserName };
}

function updateHeaderUserInfo() {
  document.getElementById('user-name-display').textContent = currentUserName;
  document.getElementById('current-date').textContent = new Date().toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

function setActiveTab(tabName) {
  activeTab = tabName;

  navButtons.forEach(button => {
    button.classList.toggle('is-active', button.dataset.tab === tabName);
  });

  dashboardViews.forEach(view => {
    const isActive = view.dataset.view === tabName;
    view.classList.toggle('hidden', !isActive);
    view.classList.toggle('is-active', isActive);
  });
}

function shouldAutoExpandList() {
  return Boolean(getSurgeonProfile().autoExpandLongList);
}

function updateCollapsedListHeight() {
  const rows = Array.from(tableBody.querySelectorAll('tr'));

  if (rows.length < 8 || tableWrap.classList.contains('hidden')) {
    tableWrap.style.removeProperty('--collapsed-list-height');
    return;
  }

  const targetRow = rows[7];
  const wrapRect = tableWrap.getBoundingClientRect();
  const rowRect = targetRow.getBoundingClientRect();
  const computedStyle = window.getComputedStyle(tableWrap);
  const paddingBottom = parseFloat(computedStyle.paddingBottom) || 0;
  const collapsedHeight = Math.ceil(rowRect.bottom - wrapRect.top + paddingBottom);

  tableWrap.style.setProperty('--collapsed-list-height', `${collapsedHeight}px`);
}

function updatePatientListControls(totalRows) {
  const hasPatients = totalRows > 0;
  const canCollapse = totalRows > 8;

  if (canCollapse && isPatientListExpanded === null) {
    isPatientListExpanded = shouldAutoExpandList();
  }

  if (!canCollapse) {
    isPatientListExpanded = false;
  }

  currentEmptyState.classList.toggle('hidden', hasPatients);
  tableWrap.classList.toggle('hidden', !hasPatients);
  approveListBtn.classList.toggle('hidden', !hasPatients);
  tableWrap.classList.toggle('is-collapsed', canCollapse && !isPatientListExpanded);
  togglePatientListBtn.classList.toggle('hidden', !canCollapse);
  surgeonListHint.classList.toggle('hidden', !canCollapse || isPatientListExpanded || !hasPatients);

  if (!canCollapse) {
    togglePatientListBtn.setAttribute('aria-expanded', 'false');
    togglePatientListBtn.setAttribute('aria-label', 'Развернуть список пациентов');
    togglePatientListBtn.title = 'Развернуть список пациентов';
    return;
  }

  updateCollapsedListHeight();
  togglePatientListBtn.setAttribute('aria-expanded', String(isPatientListExpanded));
  togglePatientListBtn.setAttribute('aria-label', isPatientListExpanded ? 'Свернуть список пациентов' : 'Развернуть список пациентов');
  togglePatientListBtn.title = isPatientListExpanded ? 'Свернуть список пациентов' : 'Развернуть список пациентов';
}

function updateApprovalStatus() {
  const approval = getOperationApproval();
  const hasPatients = getOperationList().some(item => item.type !== 'pause');

  if (!approval?.date || !hasPatients) {
    approvalStatus.classList.add('hidden');
    approvalStatus.textContent = '';
    return;
  }

  approvalStatus.textContent = `Список подготовлен к утверждению на ${formatDisplayDate(approval.date)}`;
  approvalStatus.classList.remove('hidden');
}

function createOptions(options, value) {
  return options
    .map(optionValue => (
      `<option value="${optionValue}" ${value === optionValue ? 'selected' : ''}>${optionValue || '—'}</option>`
    ))
    .join('');
}

function createSelect(index, field, options, value, disabled = false) {
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
}

function setupNotesAutosave(input) {
  let timeout;

  const save = () => {
    const index = Number(input.dataset.index);
    updatePatient(index, { notes: input.value.trim() });
    showSaved();
  };

  input.addEventListener('input', () => {
    clearTimeout(timeout);
    timeout = setTimeout(save, 3000);
  });

  input.addEventListener('blur', () => {
    clearTimeout(timeout);
    save();
  });
}

function renderTable() {
  const list = getOperationList();
  const startTimes = calculateStartTimes();

  tableBody.innerHTML = '';

  list.forEach((item, index) => {
    const row = document.createElement('tr');

    if (item.type !== 'pause') {
      const isFemto = item.type === 'ФЕМТО';

      row.innerHTML = `
        <td><strong>${startTimes[index] || '—'}</strong></td>
        <td>${createSelect(index, 'eye', eyeOptions, item.eye || '')}</td>
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
            value="${escapeHtml(item.notes || '')}"
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
      const index = Number(this.dataset.index);
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
  updatePatientListControls(list.length);
  updateApprovalStatus();
}

function getApprovalValidationErrors() {
  const list = getOperationList();
  const errors = [];
  let patientNumber = 0;

  list.forEach(item => {
    if (item.type === 'pause') return;

    patientNumber += 1;
    const missing = [];
    const isFemto = item.type === 'ФЕМТО';

    if (!item.eye) missing.push('глаз');
    if (!item.fio) missing.push('ФИО');
    if (!item.card) missing.push('№ карты');
    if (!item.type) missing.push('операция');
    if (isFemto && (!item.ring || item.ring === '—')) missing.push('кольцо');
    if (isFemto && (!item.flap || item.flap === '—')) missing.push('лоскут');

    if (missing.length) {
      errors.push(`Пациент ${patientNumber}: ${missing.join(', ')}`);
    }
  });

  if (!patientNumber) {
    errors.push('В списке нет пациентов.');
  }

  return errors;
}

function renderApprovedLists() {
  const approvedLists = getApprovedOperationLists();
  const today = getTodayIsoDate();

  approvedTableBody.innerHTML = '';

  if (!approvedLists.length) {
    approvedEmptyState.classList.remove('hidden');
    approvedTableWrap.classList.add('hidden');
    return;
  }

  approvedEmptyState.classList.add('hidden');
  approvedTableWrap.classList.remove('hidden');

  approvedLists.forEach(entry => {
    const patientCount = entry.items.filter(item => item.type !== 'pause').length;
    const isCompleted = entry.operationDate < today;
    const statusLabel = isCompleted ? 'Опердень завершен' : 'Ожидается';
    const statusIcon = isCompleted ? '✓' : '◔';
    const row = document.createElement('tr');

    row.innerHTML = `
      <td>${formatDisplayDate(entry.operationDate)}</td>
      <td>${formatDateTime(entry.approvedAt)}</td>
      <td>
        <span class="operation-status ${isCompleted ? 'is-complete' : 'is-pending'}">
          <span class="operation-status-label">${statusLabel}</span>
          <span class="operation-status-icon" aria-hidden="true">${statusIcon}</span>
        </span>
      </td>
      <td>${escapeHtml(entry.approvedBy || '—')}</td>
      <td>${patientCount}</td>
      <td>
        <button class="archive-download-btn" type="button" data-id="${entry.id}">Скачать Excel</button>
      </td>
    `;

    approvedTableBody.appendChild(row);
  });
}

function renderProfileForm() {
  const account = getSurgeonAccount();
  const profile = getSurgeonProfile();

  profileNameInput.value = account.name || '';
  profileLoginInput.value = account.login || '';
  profilePasswordInput.value = account.password || '';
  profilePhoneInput.value = profile.phone || '';
  profileEmailInput.value = profile.email || '';
  profileSpecialtyInput.value = profile.specialty || '';
  profileSignatureInput.value = profile.signature || '';
  profileAutoExpandInput.checked = Boolean(profile.autoExpandLongList);
}

function buildExcelRows(entry) {
  const startTime = entry.settings?.startTime || '09:00';
  const startTimes = calculateStartTimesForList(entry.items, startTime);
  const rows = [
    ['Дата операции', formatDisplayDate(entry.operationDate)],
    ['Утвержден', formatDateTime(entry.approvedAt)],
    ['Хирург', entry.approvedBy || ''],
    ['Начало операционного дня', startTime],
    [],
    ['Начало', 'Тип записи', 'Глаз', 'ФИО пациента', '№ карты', 'Кольцо', 'Лоскут', 'Операция', 'Особенности']
  ];

  entry.items.forEach((item, index) => {
    if (item.type === 'pause') {
      rows.push([
        startTimes[index] || '—',
        'Пауза',
        '',
        '',
        '',
        '',
        '',
        '',
        `${item.duration || 0} мин`
      ]);
      return;
    }

    rows.push([
      startTimes[index] || '—',
      'Пациент',
      item.eye || '',
      item.fio || '',
      item.card || '',
      item.ring || '',
      item.flap || '',
      item.type || '',
      item.notes || ''
    ]);
  });

  return rows;
}

function buildExcelMarkup(entry) {
  const rows = buildExcelRows(entry);
  const tableRows = rows
    .map(row => {
      const cells = row.length
        ? row.map(cell => `<td>${escapeHtml(String(cell || '')).replace(/\n/g, '<br>')}</td>`).join('')
        : '<td colspan="9"></td>';

      return `<tr>${cells}</tr>`;
    })
    .join('');

  return `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:x="urn:schemas-microsoft-com:office:excel"
          xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="UTF-8">
      </head>
      <body>
        <table>${tableRows}</table>
      </body>
    </html>
  `;
}

function downloadApprovedList(entryId) {
  const entry = getApprovedOperationLists().find(item => item.id === entryId);

  if (!entry) {
    alert('Утвержденный список не найден.');
    return;
  }

  const approvedTime = new Date(entry.approvedAt);
  const timeSuffix = `${String(approvedTime.getHours()).padStart(2, '0')}${String(approvedTime.getMinutes()).padStart(2, '0')}`;
  const blob = new Blob([buildExcelMarkup(entry)], {
    type: 'application/vnd.ms-excel;charset=utf-8;'
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = `operations_${entry.operationDate}_${timeSuffix}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function handleApproveClick() {
  const errors = getApprovalValidationErrors();

  if (errors.length) {
    alert(`Заполните обязательные поля перед утверждением:\n\n${errors.join('\n')}`);
    return;
  }

  const approval = getOperationApproval();
  operationDateInput.value = approval?.date || getTodayIsoDate();
  operationDateInput.min = getTodayIsoDate();
  setApprovalModalOpen(true);
}

function confirmApproval() {
  const date = operationDateInput.value;

  if (!date) {
    alert('Выберите дату проведения операции.');
    return;
  }

  const archivedEntry = archiveCurrentOperationList({
    date,
    approvedBy: currentUserName
  });

  if (!archivedEntry) {
    alert('В текущем списке нет пациентов для утверждения.');
    return;
  }

  setApprovalModalOpen(false);
  isPatientListExpanded = null;
  renderTable();
  renderApprovedLists();
  setActiveTab('approved');
  showSaved();
}

function saveProfile(event) {
  event.preventDefault();

  const name = profileNameInput.value.trim();
  const login = profileLoginInput.value.trim();
  const password = profilePasswordInput.value.trim();

  if (!name || !login || !password) {
    alert('Заполните имя, логин и пароль.');
    return;
  }

  const creds = getCredentials();
  creds.surgeon = {
    login,
    password,
    name
  };
  saveCredentials(creds);

  saveSurgeonProfile({
    phone: profilePhoneInput.value.trim(),
    email: profileEmailInput.value.trim(),
    specialty: profileSpecialtyInput.value.trim(),
    signature: profileSignatureInput.value.trim(),
    autoExpandLongList: profileAutoExpandInput.checked
  });

  currentUserName = name;
  sessionStorage.setItem('userName', name);
  updateHeaderUserInfo();
  isPatientListExpanded = profileAutoExpandInput.checked ? true : null;
  renderTable();
  showSaved();
}

togglePatientListBtn.addEventListener('click', () => {
  isPatientListExpanded = !Boolean(isPatientListExpanded);
  updatePatientListControls(getOperationList().length);
});

window.addEventListener('resize', () => {
  if (getOperationList().length > 8) {
    updateCollapsedListHeight();
  }
});

approveListBtn.addEventListener('click', handleApproveClick);
confirmApprovalBtn.addEventListener('click', confirmApproval);
cancelApprovalBtn.addEventListener('click', () => setApprovalModalOpen(false));
approvalModal.addEventListener('click', event => {
  if (event.target === approvalModal) {
    setApprovalModalOpen(false);
  }
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !approvalModal.classList.contains('hidden')) {
    setApprovalModalOpen(false);
  }
});

approvedTableBody.addEventListener('click', event => {
  const button = event.target.closest('.archive-download-btn');
  if (!button) return;

  downloadApprovedList(button.dataset.id);
});

navButtons.forEach(button => {
  button.addEventListener('click', () => {
    setActiveTab(button.dataset.tab);
  });
});

profileForm.addEventListener('submit', saveProfile);

document.getElementById('logout-btn').addEventListener('click', () => {
  sessionStorage.clear();
  window.location.href = '/index.html';
});

updateHeaderUserInfo();
renderTable();
renderApprovedLists();
renderProfileForm();
