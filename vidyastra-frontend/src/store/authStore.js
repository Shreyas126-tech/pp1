import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('vidyastra_user') || 'null'),
  token: localStorage.getItem('vidyastra_token') || null,
  isAuthenticated: !!localStorage.getItem('vidyastra_token'),

  login: (user, token) => {
    localStorage.setItem('vidyastra_token', token);
    localStorage.setItem('vidyastra_user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('vidyastra_token');
    localStorage.removeItem('vidyastra_user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  setUser: (user) => {
    localStorage.setItem('vidyastra_user', JSON.stringify(user));
    set({ user });
  },
}));

export default useAuthStore;
