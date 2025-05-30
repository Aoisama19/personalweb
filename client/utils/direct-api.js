// Direct API utility for making requests to Netlify Functions
import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: '/',
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
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Helper functions for API calls
export const directApiCall = {
  // Important Dates endpoints
  getDates: async () => {
    try {
      const res = await api.get('/.netlify/functions/dates-direct');
      return res.data;
    } catch (err) {
      throw err.response?.data || err;
    }
  },
  
  addDate: async (dateData) => {
    try {
      const res = await api.post('/.netlify/functions/dates-direct', dateData);
      return res.data;
    } catch (err) {
      throw err.response?.data || err;
    }
  },
  
  updateDate: async (id, dateData) => {
    try {
      const res = await api.put(`/.netlify/functions/dates-direct/${id}`, dateData);
      return res.data;
    } catch (err) {
      throw err.response?.data || err;
    }
  },
  
  deleteDate: async (id) => {
    try {
      const res = await api.delete(`/.netlify/functions/dates-direct/${id}`);
      return res.data;
    } catch (err) {
      throw err.response?.data || err;
    }
  },
  
  // Calendar Events endpoints
  getEvents: async () => {
    try {
      const res = await api.get('/.netlify/functions/events-direct');
      return res.data;
    } catch (err) {
      throw err.response?.data || err;
    }
  },
  
  addEvent: async (eventData) => {
    try {
      const res = await api.post('/.netlify/functions/events-direct', eventData);
      return res.data;
    } catch (err) {
      throw err.response?.data || err;
    }
  },
  
  updateEvent: async (id, eventData) => {
    try {
      const res = await api.put(`/.netlify/functions/events-direct/${id}`, eventData);
      return res.data;
    } catch (err) {
      throw err.response?.data || err;
    }
  },
  
  deleteEvent: async (id) => {
    try {
      const res = await api.delete(`/.netlify/functions/events-direct/${id}`);
      return res.data;
    } catch (err) {
      throw err.response?.data || err;
    }
  },
  
  // Todo Lists endpoints
  getTodoLists: async () => {
    try {
      const res = await api.get('/.netlify/functions/todos-direct');
      return res.data;
    } catch (err) {
      throw err.response?.data || err;
    }
  },
  
  addTodoList: async (listData) => {
    try {
      const res = await api.post('/.netlify/functions/todos-direct', listData);
      return res.data;
    } catch (err) {
      throw err.response?.data || err;
    }
  },
  
  updateTodoList: async (id, listData) => {
    try {
      const res = await api.put(`/.netlify/functions/todos-direct/${id}`, listData);
      return res.data;
    } catch (err) {
      throw err.response?.data || err;
    }
  },
  
  deleteTodoList: async (id) => {
    try {
      const res = await api.delete(`/.netlify/functions/todos-direct/${id}`);
      return res.data;
    } catch (err) {
      throw err.response?.data || err;
    }
  },
  
  addTodo: async (listId, todoData) => {
    try {
      const res = await api.post(`/.netlify/functions/todos-direct/${listId}/todo`, todoData);
      return res.data;
    } catch (err) {
      throw err.response?.data || err;
    }
  },
  
  updateTodo: async (listId, todoId, todoData) => {
    try {
      const res = await api.put(`/.netlify/functions/todos-direct/${listId}/todo/${todoId}`, todoData);
      return res.data;
    } catch (err) {
      throw err.response?.data || err;
    }
  },
  
  deleteTodo: async (listId, todoId) => {
    try {
      const res = await api.delete(`/.netlify/functions/todos-direct/${listId}/todo/${todoId}`);
      return res.data;
    } catch (err) {
      throw err.response?.data || err;
    }
  },
  
  // Photo Albums endpoints
  getAlbums: async () => {
    try {
      const res = await api.get('/.netlify/functions/albums-direct');
      return res.data;
    } catch (err) {
      throw err.response?.data || err;
    }
  },
  
  addAlbum: async (albumData) => {
    try {
      const res = await api.post('/.netlify/functions/albums-direct', albumData);
      return res.data;
    } catch (err) {
      throw err.response?.data || err;
    }
  },
  
  updateAlbum: async (id, albumData) => {
    try {
      const res = await api.put(`/.netlify/functions/albums-direct/${id}`, albumData);
      return res.data;
    } catch (err) {
      throw err.response?.data || err;
    }
  },
  
  deleteAlbum: async (id) => {
    try {
      const res = await api.delete(`/.netlify/functions/albums-direct/${id}`);
      return res.data;
    } catch (err) {
      throw err.response?.data || err;
    }
  },
  
  // For photo uploads, we need to handle multipart/form-data
  addPhoto: async (albumId, photoData) => {
    try {
      // For direct functions, we'll just pass the URL and caption
      // Note: In a real app, you'd need to handle file uploads separately
      const res = await api.post(`/.netlify/functions/albums-direct/${albumId}/photos`, {
        url: photoData.url || photoData.file,
        caption: photoData.caption,
        date: photoData.date
      });
      
      return res.data;
    } catch (err) {
      throw err.response?.data || err;
    }
  },
  
  deletePhoto: async (albumId, photoId) => {
    try {
      const res = await api.delete(`/.netlify/functions/albums-direct/${albumId}/photos/${photoId}`);
      return res.data;
    } catch (err) {
      throw err.response?.data || err;
    }
  }
};

export default api;
