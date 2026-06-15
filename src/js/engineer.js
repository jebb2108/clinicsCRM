if (sessionStorage.getItem('role') !== 'engineer') {
  window.location.href = '/index.html';
}

window.addEventListener('storage', function(event) {
  if (event.key === 'clinic_operation_list') {
    console.log('Данные обновлены из другого окна, перерисовываем таблицу');
    renderTable();
  }
});

const tbody = document.getElementById('creds-body');
const savedNotification = document.getElementById('saved-notification');
const saveBtn = document.getElementById('save-creds');

// Показать уведомление "Сохранено"
function showSaved() {
  if (!savedNotification) return;
  savedNotification.classList.remove('hidden');
  clearTimeout(savedNotification._timeout);
  savedNotification._timeout = setTimeout(() => {
    savedNotification.classList.add('hidden');
  }, 2000);
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

// Кнопка выхода
document.getElementById('logout-btn').addEventListener('click', () => {
  sessionStorage.clear();
  window.location.href = '/index.html';
});

// Заполнение user-panel
const userName = sessionStorage.getItem('userName') || 'Инженер';
const today = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

document.getElementById('user-name-display').textContent = userName;
document.getElementById('current-date').textContent = today;

renderCredentials();