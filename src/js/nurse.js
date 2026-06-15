if (sessionStorage.getItem('role') !== 'nurse') {
  window.location.href = '/index.html';
}

window.addEventListener('storage', function(event) {
  if (event.key === LIST_KEY) {
    console.log('Данные обновлены из другого окна, перерисовываем таблицу');
    renderTable();
  }
});

// Пока ничего дополнительного