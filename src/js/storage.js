// Ключи localStorage
const LIST_KEY = 'clinic_operation_list';
const CREDENTIALS_KEY = 'clinic_credentials';
const SETTINGS_KEY = 'clinic_settings';
const APPROVAL_KEY = 'clinic_operation_approval';
const APPROVED_LISTS_KEY = 'clinic_approved_operation_lists';
const ROLE_PROFILES_KEY = 'clinic_role_profiles';

const operationTypes = ['ФЕМТО', 'ФРК', 'ДОКОРРЕКЦИЯ', 'ПТК'];

// Значения по умолчанию
const DEFAULT_CREDENTIALS = {
  admin:    { login: 'admin',    password: 'admin',    name: 'Ирина' },
  surgeon:  { login: 'surgeon',  password: 'surgeon',  name: 'Вячеслав' },
  nurse:    { login: 'nurse',    password: 'nurse',    name: 'Ольга' },
  engineer: { login: 'engineer', password: 'engineer', name: 'Габриэль' }
};

const DEFAULT_SETTINGS = {
  startTime: '09:00'
};

const DEFAULT_ROLE_PROFILES = {
  surgeon: {
    phone: '',
    email: '',
    specialty: 'Хирург-офтальмолог',
    signature: '',
    autoExpandLongList: false
  },
  admin: {
    phone: '',
    email: '',
    specialty: 'Администратор',
    signature: '',
    autoExpandLongList: false
  },
  engineer: {
    phone: '',
    email: '',
    specialty: 'Инженер системы',
    signature: '',
    autoExpandLongList: false
  },
  nurse: {
    phone: '',
    email: '',
    specialty: 'Операционная сестра',
    signature: '',
    autoExpandLongList: false
  }
};

// === Работа со списком операций (пациенты + паузы) ===
function getOperationList() {
  const data = localStorage.getItem(LIST_KEY);
  return data ? JSON.parse(data) : [];
}

function saveOperationList(list) {
  console.log('saveOperationList вызван, сохраняем список:', list);
  localStorage.setItem(LIST_KEY, JSON.stringify(list));
}

function addPatient(patient) {
  const list = getOperationList();
  list.push({ type: 'patient', ...patient });
  saveOperationList(list);
}

function addPause(duration) {
  const list = getOperationList();
  list.push({ type: 'pause', duration });
  saveOperationList(list);
}

function deleteItem(index) {
  const list = getOperationList();
  list.splice(index, 1);
  saveOperationList(list);
}

function moveItem(fromIndex, toIndex) {
  const list = getOperationList();
  if (fromIndex === toIndex) return;
  const item = list.splice(fromIndex, 1)[0];
  list.splice(toIndex, 0, item);
  saveOperationList(list);
}

function updatePatient(index, updatedFields) {
  console.log('updatePatient вызван с index', index, 'поля', updatedFields);
  const list = getOperationList();
  console.log('Текущий пациент', list[index]);
  // Проверяем, что элемент не является паузой (у пауз type === 'pause')
  if (list[index] && list[index].type !== 'pause') {
    list[index] = { ...list[index], ...updatedFields };
    saveOperationList(list);
    console.log('Сохранено:', list[index]);
  } else {
    console.error('Пациент не найден по индексу', index);
  }
}

// === Учётные данные ===
function getCredentials() {
  const data = localStorage.getItem(CREDENTIALS_KEY);
  return data ? JSON.parse(data) : DEFAULT_CREDENTIALS;
}

function saveCredentials(creds) {
  localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(creds));
}

// === Настройки операционного дня ===
function getSettings() {
  const data = localStorage.getItem(SETTINGS_KEY);
  return data ? JSON.parse(data) : DEFAULT_SETTINGS;
}

function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// === Утверждение списка операций ===
function getOperationApproval() {
  const data = localStorage.getItem(APPROVAL_KEY);
  return data ? JSON.parse(data) : null;
}

function saveOperationApproval(approval) {
  if (!approval) {
    localStorage.removeItem(APPROVAL_KEY);
    return;
  }

  localStorage.setItem(APPROVAL_KEY, JSON.stringify(approval));
}

function getApprovedOperationLists() {
  const data = localStorage.getItem(APPROVED_LISTS_KEY);
  return data ? JSON.parse(data) : [];
}

function saveApprovedOperationLists(lists) {
  localStorage.setItem(APPROVED_LISTS_KEY, JSON.stringify(lists));
}

function archiveCurrentOperationList({ date, approvedBy }) {
  const currentList = getOperationList();
  const patientCount = currentList.filter(item => item.type !== 'pause').length;

  if (!patientCount) return null;

  const approvedEntry = {
    id: `approved_${Date.now()}`,
    operationDate: date,
    approvedAt: new Date().toISOString(),
    approvedBy,
    settings: getSettings(),
    items: currentList
  };

  const approvedLists = getApprovedOperationLists();
  approvedLists.unshift(approvedEntry);
  saveApprovedOperationLists(approvedLists);
  saveOperationList([]);
  saveOperationApproval(null);

  return approvedEntry;
}

function getRoleProfile(role) {
  const data = localStorage.getItem(ROLE_PROFILES_KEY);
  const profiles = data ? JSON.parse(data) : {};
  const defaults = DEFAULT_ROLE_PROFILES[role] || DEFAULT_ROLE_PROFILES.surgeon;

  return {
    ...defaults,
    ...(profiles[role] || {})
  };
}

function saveRoleProfile(role, profile) {
  const data = localStorage.getItem(ROLE_PROFILES_KEY);
  const profiles = data ? JSON.parse(data) : {};
  const defaults = DEFAULT_ROLE_PROFILES[role] || DEFAULT_ROLE_PROFILES.surgeon;

  profiles[role] = {
    ...defaults,
    ...profile
  };

  localStorage.setItem(ROLE_PROFILES_KEY, JSON.stringify(profiles));
}

function getSurgeonProfile() {
  return getRoleProfile('surgeon');
}

function saveSurgeonProfile(profile) {
  saveRoleProfile('surgeon', profile);
}

// === Расчёт времени начала операций ===
function calculateStartTimesForList(list, startTime = DEFAULT_SETTINGS.startTime) {
  const times = [];
  let [h, m] = startTime.split(':').map(Number);

  console.log('=== calculateStartTimes ===');
  console.log('Начало дня:', h, m);
  console.log('Список:', JSON.parse(JSON.stringify(list)));

  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    // Запоминаем время начала текущего элемента
    times.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    
    // Прибавляем длительность текущего элемента к времени
    if (operationTypes.includes(item.type)) {
      let duration = item.duration;
      // Если нет длительности или она <=0, подставляем по типу операции
      if (!duration || duration <= 0) {
        if (item.type === 'ФРК') duration = 10;
        else duration = 15;
      }
      console.log(`Пациент ${item.fio}: +${duration} мин`);
      m += duration;
    } else if (item.type === 'pause') {
      const duration = item.duration || 0;
      console.log(`Пауза: +${duration} мин`);
      m += duration;
    } else {
      // на всякий случай
      continue;
    }
    
    // Нормализуем часы и минуты
    h += Math.floor(m / 60);
    m %= 60;
  }
  
  console.log('Итоговые времена:', times);
  return times;
}

function calculateStartTimes() {
  const settings = getSettings();
  const list = getOperationList();
  return calculateStartTimesForList(list, settings.startTime);
}

// Вспомогательная функция экранирования HTML
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}
