import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Add auth token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('vidyastra_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const registerUser = (data) => api.post('/auth/register', data);
export const loginUser = (data) => {
  const formData = new URLSearchParams();
  formData.append('username', data.email);
  formData.append('password', data.password);
  return api.post('/auth/login', formData, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
};

// Documents
export const uploadDocument = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
export const listDocuments = () => api.get('/documents/');
export const deleteDocument = (id) => api.delete(`/documents/${id}`);
export const simplifyDocument = (id) => api.post(`/documents/${id}/simplify`);

// Chat
export const askQuestion = (data) => api.post('/chat/ask', data);
export const getChatSessions = () => api.get('/chat/sessions');
export const getSessionMessages = (sessionId) => api.get(`/chat/sessions/${sessionId}/messages`);

// Quiz & Flashcards
export const generateQuiz = (data) => api.post('/chat/quiz', data);
export const generateFlashcards = (topic, count) =>
  api.post(`/chat/flashcards?topic=${encodeURIComponent(topic)}&count=${count}`);

export default api;
