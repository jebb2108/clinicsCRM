if (sessionStorage.getItem('role') !== 'nurse') {
  window.location.href = '/index.html';
}

window.addEventListener('storage', function(event) {
  if (event.key === 'clinic_operation_list') {
    console.log('Данные обновлены из другого окна, перерисовываем таблицу');
    renderTable();
  }
});

// Пока ничего дополнительного