<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import api from './services/api';

// ---------- Состояние ----------
const tasks = ref([]);
const newTaskTitle = ref('');
const filter = ref(localStorage.getItem('taskFilter') || 'all');
const sortBy = ref(localStorage.getItem('taskSort') || 'none');

// ---------- Сохранение фильтра/сортировки ----------
watch(filter, (val) => localStorage.setItem('taskFilter', val));
watch(sortBy, (val) => localStorage.setItem('taskSort', val));

// ---------- Обработка ошибок ----------
const handleError = (error, defaultMessage) => {
  if (error.response) {
    const status = error.response.status;
    if (status === 400) {
      const data = error.response.data;
      const fieldErrors = Object.entries(data)
        .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
        .join('\n');
      alert(`Ошибка валидации (400):\n${fieldErrors}`);
    } else if (status === 500) {
      alert('Ошибка сервера (500). Попробуйте позже.');
    } else {
      alert(`Ошибка ${status}: ${defaultMessage}`);
    }
  } else if (error.request) {
    alert('Ошибка сети: сервер недоступен. Проверьте, запущен ли Django.');
  } else {
    alert(`Неизвестная ошибка: ${error.message}`);
  }
  console.error(error);
};

// ---------- CRUD ----------
const fetchTasks = async () => {
  try {
    const response = await api.getTasks();
    tasks.value = response.data;
  } catch (error) {
    handleError(error, 'Не удалось загрузить задачи');
  }
};

const addTask = async () => {
  if (!newTaskTitle.value.trim()) {
    alert('Название задачи не может быть пустым');
    return;
  }
  try {
    await api.createTask({ title: newTaskTitle.value.trim(), completed: false });
    newTaskTitle.value = '';
    await fetchTasks();
  } catch (error) {
    handleError(error, 'Не удалось создать задачу');
  }
};

const toggleTask = async (task) => {
  try {
    await api.patchTask(task.id, { completed: !task.completed });
    await fetchTasks();
  } catch (error) {
    handleError(error, 'Не удалось обновить задачу');
  }
};

const editTask = async (task) => {
  const newTitle = prompt('Новое название задачи:', task.title);
  if (newTitle === null) return;
  if (!newTitle.trim()) {
    alert('Название не может быть пустым');
    return;
  }
  try {
    await api.patchTask(task.id, { title: newTitle.trim() });
    await fetchTasks();
  } catch (error) {
    handleError(error, 'Не удалось сохранить изменения');
  }
};

const deleteTask = async (id) => {
  if (!confirm('Удалить задачу?')) return;
  try {
    await api.deleteTask(id);
    await fetchTasks();
  } catch (error) {
    handleError(error, 'Не удалось удалить задачу');
  }
};

// ---------- Счётчики ----------
const totalCount = computed(() => tasks.value.length);
const activeCount = computed(() => tasks.value.filter((t) => !t.completed).length);
const completedCount = computed(() => tasks.value.filter((t) => t.completed).length);

// ---------- Фильтр + сортировка ----------
const filteredAndSortedTasks = computed(() => {
  let result = [...tasks.value];

  if (filter.value === 'active') result = result.filter((t) => !t.completed);
  if (filter.value === 'completed') result = result.filter((t) => t.completed);

  if (sortBy.value === 'title-asc') {
    result.sort((a, b) => a.title.localeCompare(b.title, 'ru'));
  } else if (sortBy.value === 'title-desc') {
    result.sort((a, b) => b.title.localeCompare(a.title, 'ru'));
  } else if (sortBy.value === 'active-first') {
    result.sort((a, b) => Number(a.completed) - Number(b.completed));
  } else if (sortBy.value === 'completed-first') {
    result.sort((a, b) => Number(b.completed) - Number(a.completed));
  }

  return result;
});

onMounted(fetchTasks);
</script>

<template>
  <div>
    <h1>Мои задачи</h1>

    <div class="stats">
      Всего: <b>{{ totalCount }}</b> |
      Активных: <b>{{ activeCount }}</b> |
      Выполнено: <b>{{ completedCount }}</b>
    </div>

    <div class="filters">
      <button :class="{ active: filter === 'all' }" @click="filter = 'all'">Все</button>
      <button :class="{ active: filter === 'active' }" @click="filter = 'active'">Активные</button>
      <button :class="{ active: filter === 'completed' }" @click="filter = 'completed'">Выполненные</button>
    </div>

    <div class="sort">
      <label>Сортировка:</label>
      <select v-model="sortBy">
        <option value="none">Без сортировки</option>
        <option value="title-asc">Название: А–Я</option>
        <option value="title-desc">Название: Я–А</option>
        <option value="active-first">Сначала активные</option>
        <option value="completed-first">Сначала выполненные</option>
      </select>
    </div>

    <div class="add-row">
      <input
        v-model="newTaskTitle"
        @keyup.enter="addTask"
        placeholder="Новая задача"
      />
      <button @click="addTask">Добавить</button>
    </div>

    <ul>
      <li v-for="task in filteredAndSortedTasks" :key="task.id" :class="{ done: task.completed }">
        <input type="checkbox" :checked="task.completed" @change="toggleTask(task)" />
        <span class="title">{{ task.title }}</span>
        <button class="icon-btn" @click="editTask(task)" title="Редактировать">✏️</button>
        <button class="icon-btn" @click="deleteTask(task.id)" title="Удалить">🗑️</button>
      </li>
    </ul>
  </div>
</template>