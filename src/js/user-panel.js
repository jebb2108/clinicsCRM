const userInfo = function showUserInfo() {

  const role = sessionStorage.getItem('role');
  const userName = sessionStorage.getItem('userName') || 'Пользователь';

  // Отображение имени
  const nameSpan = document.getElementById('user-name');
  if (nameSpan) nameSpan.textContent = userName;

  // Отображение сегодняшней даты
  const dateSpan = document.getElementById('current-date');
  if (dateSpan) {
    const today = new Date();
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    dateSpan.textContent = today.toLocaleDateString('ru-RU', options);
  }

  // Кнопка выхода
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function () {
      sessionStorage.clear();
      window.location.href = '/index.html';
    });
  }
}

userInfo();