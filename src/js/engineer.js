if (sessionStorage.getItem('role') !== 'engineer') {
  window.location.href = '/index.html';
}

const tbody = document.getElementById('creds-body');
const savedNotification = document.getElementById('saved-notification');
const saveBtn = document.getElementById('save-creds');
const navButtons = Array.from(document.querySelectorAll('.role-nav-btn'));
const dashboardViews = Array.from(document.querySelectorAll('.dashboard-view'));
const profileForm = document.getElementById('engineer-profile-form');
const profileNameInput = document.getElementById('profile-name');
const profileLoginInput = document.getElementById('profile-login');
const profilePasswordInput = document.getElementById('profile-password');
const profilePhoneInput = document.getElementById('profile-phone');
const profileEmailInput = document.getElementById('profile-email');
const profileSpecialtyInput = document.getElementById('profile-specialty');
const profileSignatureInput = document.getElementById('profile-signature');

// Заполнение user-panel
const userName = sessionStorage.getItem('userName') || 'Инженер';
const today = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });


// Показать уведомление "Сохранено"
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
  const account = getCredentials().engineer || { name: '', login: '', password: '' };
  const profile = getRoleProfile('engineer');

  profileNameInput.value = account.name || '';
  profileLoginInput.value = account.login || '';
  profilePasswordInput.value = account.password || '';
  profilePhoneInput.value = profile.phone || '';
  profileEmailInput.value = profile.email || '';
  profileSpecialtyInput.value = profile.specialty || '';
  profileSignatureInput.value = profile.signature || '';
}

// Отрисовка таблицы с актуальными учётными данными
function renderCredentials() {
  const creds = getCredentials();
  tbody.innerHTML = '';

  for (const role in creds) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${role}</td>
      <td><input type="text" class="cred-login" data-role="${role}" value="${escapeHtml(creds[role].login)}"></td>
      <td><input type="password" class="cred-pass" data-role="${role}" value="${escapeHtml(creds[role].password)}"></td>
      <td><input type="text" class="cred-name" data-role="${role}" value="${escapeHtml(creds[role].name || '')}"></td>
    `;
    tbody.appendChild(tr);
  }
}

// Сохранить учётные данные
saveBtn.addEventListener('click', () => {
  const creds = {};
  document.querySelectorAll('#creds-body tr').forEach(tr => {
    const role = tr.querySelector('.cred-login').dataset.role;
    const login = tr.querySelector('.cred-login').value.trim();
    const password = tr.querySelector('.cred-pass').value.trim();
    const name = tr.querySelector('.cred-name').value.trim();
    if (role && login && password) {
      creds[role] = { login, password, name };
    }
  });
  if (Object.keys(creds).length) {
    saveCredentials(creds);
    showSaved();
  }
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
  creds.engineer = { name, login, password };
  saveCredentials(creds);
  saveRoleProfile('engineer', {
    phone: profilePhoneInput.value.trim(),
    email: profileEmailInput.value.trim(),
    specialty: profileSpecialtyInput.value.trim(),
    signature: profileSignatureInput.value.trim()
  });

  sessionStorage.setItem('userName', name);
  document.getElementById('user-name-display').textContent = name;
  showSaved();
});

function normalizePatientType(type) {
  switch (type) {
    case 'ФЕМТО':
      return 'femto';

    case 'ФРК':
      return 'frk';

    case 'ПТК':
      return 'ptk';

    case 'ДОКОРРЕКЦИЯ':
      return 'correction';

    default:
      return 'femto';
  }
}

function buildPatientsExport() {
  const operationList = getOperationList();

  return operationList
    .filter(patient => patient.type !== 'pause')
    .map((patient, index) => ({
      id: index + 1,
      type: normalizePatientType(patient.type),
      patientName: patient.fio,
      eye: 'OU',
      birthDate: patient.bday,
      phone: patient.phone,
      flapThickness:
        patient.flap && patient.flap !== '—'
          ? Number(patient.flap)
          : 100,
      ringDiameter:
        patient.ring && patient.ring !== '—'
          ? Number(patient.ring)
          : 8.5,
      specialNotes: ''
    }));
}

function downloadPatientsFile() {
  const patients = buildPatientsExport();

  if (!patients.length) {
    alert('Пациенты не найдены.');
    return;
  }

  const fileContent = `const patients = ${JSON.stringify(patients, null, 2)};\n`;
  const blob = new Blob([fileContent], { type: 'text/javascript;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  a.href = url;
  a.download = `patients_${dateStr}.js`;

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}

// Кнопка выхода
document.getElementById('logout-btn').addEventListener('click', () => {
  sessionStorage.clear();
  window.location.href = '/index.html';
});

// кнопки загрузки JSON файла для мобильного приложения
document.getElementById('download-patients').addEventListener('click', downloadPatientsFile);
document.getElementById('user-name-display').textContent = userName;
document.getElementById('current-date').textContent = today;

renderProfileForm();
renderCredentials();
