document.getElementById('login-form').addEventListener('submit', function(e) {
  e.preventDefault();
  const role = document.getElementById('role-select').value;
  const login = document.getElementById('login-input').value.trim();
  const password = document.getElementById('password-input').value.trim();
  const errorMsg = document.getElementById('error-msg');

  if (!role) {
    errorMsg.textContent = 'Выберите роль';
    return;
  }

  const credentials = getCredentials();

  // Получить отображаемое имя по роли
  function getUserDisplayName(role) {
    if (credentials[role] && credentials[role].name) {
      return credentials[role].name;
    }
    return role;
  }

  if (credentials[role] && credentials[role].login === login && credentials[role].password === password) {
    const displayName = getUserDisplayName(role);
    sessionStorage.setItem('role', role);
    sessionStorage.setItem('userName', displayName);
    sessionStorage.setItem('loginTime', new Date().toLocaleString('ru-RU'));
    window.location.href = `/src/pages/${role}.html`;
  } else {
    errorMsg.textContent = 'Неверный логин или пароль';
  }
});