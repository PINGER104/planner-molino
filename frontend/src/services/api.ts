import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authApi = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
  getMe: () => api.get('/auth/me'),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),
};

// Utenti API
export const utentiApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/utenti', { params }),
  getById: (id: number) => api.get(`/utenti/${id}`),
  create: (data: Record<string, unknown>) => api.post('/utenti', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/utenti/${id}`, data),
  delete: (id: number) => api.delete(`/utenti/${id}`),
  resetPassword: (id: number, newPassword: string) =>
    api.post(`/utenti/${id}/reset-password`, { newPassword }),
};

// Trasportatori API
export const trasportatoriApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/trasportatori', { params }),
  getById: (id: number) => api.get(`/trasportatori/${id}`),
  getDropdown: () => api.get('/trasportatori/dropdown'),
  create: (data: Record<string, unknown>) => api.post('/trasportatori', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/trasportatori/${id}`, data),
  delete: (id: number) => api.delete(`/trasportatori/${id}`),
};

// Clienti API
export const clientiApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/clienti', { params }),
  getById: (id: number) => api.get(`/clienti/${id}`),
  getDropdown: () => api.get('/clienti/dropdown'),
  create: (data: Record<string, unknown>) => api.post('/clienti', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/clienti/${id}`, data),
  delete: (id: number) => api.delete(`/clienti/${id}`),
};

// Prenotazioni API
export const prenotazioniApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/prenotazioni', { params }),
  getCalendario: (params: { tipologia?: string; data_da: string; data_a: string }) =>
    api.get('/prenotazioni/calendario', { params }),
  getById: (id: number) => api.get(`/prenotazioni/${id}`),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  create: (data: any) => api.post('/prenotazioni', data),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  update: (id: number, data: any) => api.put(`/prenotazioni/${id}`, data),
  updateStato: (id: number, nuovo_stato: string, note?: string) =>
    api.patch(`/prenotazioni/${id}/stato`, { nuovo_stato, note }),
  delete: (id: number) => api.delete(`/prenotazioni/${id}`),
  // Dati carico
  getDatiCarico: (prenotazioneId: number) =>
    api.get(`/prenotazioni/${prenotazioneId}/dati-carico`),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createDatiCarico: (prenotazioneId: number, data: any) =>
    api.post(`/prenotazioni/${prenotazioneId}/dati-carico`, data),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateDatiCarico: (prenotazioneId: number, data: any) =>
    api.put(`/prenotazioni/${prenotazioneId}/dati-carico`, data),
};

// Configurazione API
export const configurazioneApi = {
  getTempiCiclo: () => api.get('/configurazione/tempi-ciclo'),
  updateTempiCiclo: (categoria: string, data: Record<string, unknown>) =>
    api.put(`/configurazione/tempi-ciclo/${categoria}`, data),
  calcolaDurata: (data: { categoria_prodotto: string; quantita_kg: number; cambio_prodotto?: boolean }) =>
    api.post('/configurazione/calcola-durata', data),
  getDashboardStats: (tipologia?: string) =>
    api.get('/configurazione/dashboard-stats', { params: { tipologia } }),
};
