import axios from 'axios';
import { API_URL } from '../config';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to include auth token in headers
api.interceptors.request.use(
  config => {
    // Get token from localStorage if it exists
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Helper functions for API calls
export const apiCall = {
  // Auth endpoints
  register: async (userData) => {
    try {
      const res = await api.post('/api/users/register', userData);
      return res.data;
    } catch (err) {
      throw err.response.data;
    }
  },
  
  login: async (userData) => {
    try {
      const res = await api.post('/api/users/login', userData);
      return res.data;
    } catch (err) {
      throw err.response.data;
    }
  },
  
  getCurrentUser: async () => {
    try {
      const res = await api.get('/api/users/me');
      return res.data;
    } catch (err) {
      throw err.response.data;
    }
  },
  
  // Important Dates endpoints
  getDates: async () => {
    try {
      const res = await api.get('/api/dates');
      return res.data;
    } catch (err) {
      throw err.response.data;
    }
  },
  
  addDate: async (dateData) => {
    try {
      const res = await api.post('/api/dates', dateData);
      return res.data;
    } catch (err) {
      throw err.response.data;
    }
  },
  
  updateDate: async (id, dateData) => {
    try {
      const res = await api.put(`/api/dates/${id}`, dateData);
      return res.data;
    } catch (err) {
      throw err.response.data;
    }
  },
  
  deleteDate: async (id) => {
    try {
      const res = await api.delete(`/api/dates/${id}`);
      return res.data;
    } catch (err) {
      throw err.response.data;
    }
  },
  
  // Calendar Events endpoints
  getEvents: async () => {
    try {
      const res = await api.get('/api/events');
      return res.data;
    } catch (err) {
      throw err.response.data;
    }
  },
  
  addEvent: async (eventData) => {
    try {
      const res = await api.post('/api/events', eventData);
      return res.data;
    } catch (err) {
      throw err.response.data;
    }
  },
  
  updateEvent: async (id, eventData) => {
    try {
      const res = await api.put(`/api/events/${id}`, eventData);
      return res.data;
    } catch (err) {
      throw err.response.data;
    }
  },
  
  deleteEvent: async (id) => {
    try {
      const res = await api.delete(`/api/events/${id}`);
      return res.data;
    } catch (err) {
      throw err.response.data;
    }
  },
  
  // Todo Lists endpoints
  getTodoLists: async () => {
    try {
      const res = await api.get('/api/todos');
      return res.data;
    } catch (err) {
      throw err.response.data;
    }
  },
  
  addTodoList: async (listData) => {
    try {
      const res = await api.post('/api/todos', listData);
      return res.data;
    } catch (err) {
      throw err.response.data;
    }
  },
  
  updateTodoList: async (id, listData) => {
    try {
      const res = await api.put(`/api/todos/${id}`, listData);
      return res.data;
    } catch (err) {
      throw err.response.data;
    }
  },
  
  deleteTodoList: async (id) => {
    try {
      const res = await api.delete(`/api/todos/${id}`);
      return res.data;
    } catch (err) {
      throw err.response.data;
    }
  },
  
  addTodo: async (listId, todoData) => {
    try {
      const res = await api.post(`/api/todos/${listId}/todo`, todoData);
      return res.data;
    } catch (err) {
      throw err.response.data;
    }
  },
  
  updateTodo: async (listId, todoId, todoData) => {
    try {
      const res = await api.put(`/api/todos/${listId}/todo/${todoId}`, todoData);
      return res.data;
    } catch (err) {
      throw err.response.data;
    }
  },
  
  deleteTodo: async (listId, todoId) => {
    try {
      const res = await api.delete(`/api/todos/${listId}/todo/${todoId}`);
      return res.data;
    } catch (err) {
      throw err.response.data;
    }
  },
  
  // Photo Albums endpoints
  getAlbums: async () => {
    try {
      const res = await api.get('/api/albums');
      return res.data;
    } catch (err) {
      throw err.response.data;
    }
  },
  
  addAlbum: async (albumData) => {
    try {
      const res = await api.post('/api/albums', albumData);
      return res.data;
    } catch (err) {
      throw err.response.data;
    }
  },
  
  updateAlbum: async (id, albumData) => {
    try {
      const res = await api.put(`/api/albums/${id}`, albumData);
      return res.data;
    } catch (err) {
      throw err.response.data;
    }
  },
  
  deleteAlbum: async (id) => {
    try {
      const res = await api.delete(`/api/albums/${id}`);
      return res.data;
    } catch (err) {
      throw err.response.data;
    }
  },
  
  // For photo uploads, we need to handle multipart/form-data
  addPhoto: async (albumId, photoData) => {
    try {
      const formData = new FormData();
      
      // Add photo file
      formData.append('photo', photoData.file);
      
      // Add other data
      if (photoData.caption) formData.append('caption', photoData.caption);
      if (photoData.date) formData.append('date', photoData.date);
      
      const res = await api.post(`/api/albums/${albumId}/photos`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return res.data;
    } catch (err) {
      throw err.response.data;
    }
  },
  
  deletePhoto: async (albumId, photoId) => {
    try {
      const res = await api.delete(`/api/albums/${albumId}/photos/${photoId}`);
      return res.data;
    } catch (err) {
      throw err.response.data;
    }
  }
};

export default api;
