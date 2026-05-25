import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 180000, // 180 second timeout for AI responses (local Ollama can be slow)
});

// Add auth token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('vidyastra_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for better error messages
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      error.message = 'Request timed out. The AI model may be loading. Please try again.';
    } else if (!error.response) {
      error.message = 'Cannot connect to backend server. Make sure the backend is running on port 8000.';
    }
    return Promise.reject(error);
  }
);

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
    timeout: 300000, // 5 min for upload + processing
  });
};
export const listDocuments = () => api.get('/documents/');
export const deleteDocument = (id) => api.delete(`/documents/${id}`);
export const simplifyDocument = (id) => api.post(`/documents/${id}/simplify`, null, {
  timeout: 180000,
});

// Chat
export const askQuestion = (data) => api.post('/chat/ask', data, { timeout: 180000 });
export const getChatSessions = () => api.get('/chat/sessions');
export const getSessionMessages = (sessionId) => api.get(`/chat/sessions/${sessionId}/messages`);

// Quiz & Flashcards
export const generateQuiz = (data) => api.post('/chat/quiz', data, { timeout: 180000 });
export const generateFlashcards = (topic, count, language) =>
  api.post('/chat/flashcards', { topic, count, language }, { timeout: 180000 });

// ── UNIQUE FEATURES ──────────────────────────────────────────────────────
export const explainLike = (text, mode) => api.post('/chat/explain-like', { text, mode }, { timeout: 180000 });
export const generateMindMap = (topic) => api.post('/chat/mind-map', { topic }, { timeout: 180000 });
export const generateStudyPlan = (topic, days) => api.post('/chat/study-plan', { topic, days }, { timeout: 180000 });
export const translateText = (text, target_language) => api.post('/chat/translate', { text, target_language }, { timeout: 60000 });
export const draftProfessional = (context, format_type) => api.post('/chat/draft', { context, format_type }, { timeout: 180000 });
export const simulateInterview = (role) => api.post('/chat/interview', { role }, { timeout: 180000 });
export const reviewLogic = (content) => api.post('/chat/review', { content }, { timeout: 180000 });
export const generatePodcast = (topic) => api.post('/chat/podcast', { topic }, { timeout: 180000 });
export const generateCareerMapping = (topic) => api.post('/chat/careers', { topic }, { timeout: 180000 });

export default api;
