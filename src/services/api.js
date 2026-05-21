import axios from 'axios';

const API = axios.create({
  baseURL: 'https://flynet-drone-backend.onrender.com/api',
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

export const loginUser = (data) => API.post('/auth/login', data);
export const registerUser = (data) => API.post('/auth/register', data);

export const getDrones = () => API.get('/drones');
export const getDroneById = (id) => API.get(`/drones/${id}`);
export const createDrone = (data) => API.post('/drones', data);
export const updateDrone = (id, data) => API.put(`/drones/${id}`, data);
export const deleteDrone = (id) => API.delete(`/drones/${id}`);

export const getMissions = () => API.get('/missions');
export const getMissionById = (id) => API.get(`/missions/${id}`);
export const createMission = (data) => API.post('/missions', data);
export const updateMission = (id, data) => API.put(`/missions/${id}`, data);
export const deleteMission = (id) => API.delete(`/missions/${id}`);

export const getAlerts = () => API.get('/alerts');
export const markAsRead = (id) => API.put(`/alerts/${id}/read`);
export const markAllAsRead = () => API.put('/alerts/read-all');
export const deleteAlert = (id) => API.delete(`/alerts/${id}`);
export const approveMission = (id) => API.put(`/missions/${id}/approve`);