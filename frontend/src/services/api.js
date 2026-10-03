import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  headers: { 'Content-Type': 'application/json' },
});

export default {
  getTasks() {
    return apiClient.get('/tasks/');
  },
  createTask(task) {
    return apiClient.post('/tasks/', task);
  },
  updateTask(id, task) {
    return apiClient.put(`/tasks/${id}/`, task);
  },
  patchTask(id, data) {
    return apiClient.patch(`/tasks/${id}/`, data);
  },
  deleteTask(id) {
    return apiClient.delete(`/tasks/${id}/`);
  },
};