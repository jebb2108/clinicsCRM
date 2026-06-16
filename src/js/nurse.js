if (sessionStorage.getItem('role') !== 'nurse') {
  window.location.href = '/index.html';
}

const savedNotification = document.getElementById('saved-notification');
const navButtons = Array.from(document.querySelectorAll('.role-nav-btn'));
const dashboardViews = Array.from(document.querySelectorAll('.dashboard-view'));
const profileForm = document.getElementById('nurse-profile-form');
const profileNameInput = document.getElementById('profile-name');
const profileLoginInput = document.getElementById('profile-login');
const profilePasswordInput = document.getElementById('profile-password');
const profilePhoneInput = document.getElementById('profile-phone');
const profileEmailInput = document.getElementById('profile-email');
const profileSpecialtyInput = document.getElementById('profile-specialty');
const profileSignatureInput = document.getElementById('profile-signature');

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
  const account = getCredentials().nurse || { name: '', login: '', password: '' };
  const profile = getRoleProfile('nurse');

  profileNameInput.value = account.name || '';
  profileLoginInput.value = account.login || '';
  profilePasswordInput.value = account.password || '';
  profilePhoneInput.value = profile.phone || '';
  profileEmailInput.value = profile.email || '';
  profileSpecialtyInput.value = profile.specialty || '';
  profileSignatureInput.value = profile.signature || '';
}

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
  creds.nurse = { name, login, password };
  saveCredentials(creds);
  saveRoleProfile('nurse', {
    phone: profilePhoneInput.value.trim(),
    email: profileEmailInput.value.trim(),
    specialty: profileSpecialtyInput.value.trim(),
    signature: profileSignatureInput.value.trim()
  });

  sessionStorage.setItem('userName', name);
  document.getElementById('user-name-display').textContent = name;
  showSaved();
});

document.getElementById('logout-btn').addEventListener('click', () => {
  sessionStorage.clear();
  window.location.href = '/index.html';
});

document.getElementById('user-name-display').textContent = sessionStorage.getItem('userName') || 'Оперсестра';
document.getElementById('current-date').textContent = new Date().toLocaleDateString('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric'
});

renderProfileForm();
