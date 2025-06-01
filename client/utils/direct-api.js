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
      console.log('Calling todos-direct function...');
      const res = await api.get('/.netlify/functions/todos-direct');
      console.log('Todo lists response:', res.data);
      return res.data;
    } catch (err) {
      console.error('Error fetching todo lists:', err.response?.data || err.message);
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
      console.log('Adding todo to list:', listId, 'Todo data:', todoData);
      const res = await api.post(`/.netlify/functions/todos-direct/${listId}/todos`, todoData);
      console.log('Add todo response:', res.data);
      return res.data;
    } catch (err) {
      console.error('Error adding todo:', err.response?.data || err.message || err);
      throw err.response?.data || err;
    }
  },
  
  updateTodo: async (listId, todoId, todoData) => {
    try {
      console.log('Updating todo:', todoId, 'in list:', listId, 'Todo data:', todoData);
      const res = await api.put(`/.netlify/functions/todos-direct/${listId}/todos/${todoId}`, todoData);
      console.log('Update todo response:', res.data);
      return res.data;
    } catch (err) {
      console.error('Error updating todo:', err.response?.data || err.message || err);
      throw err.response?.data || err;
    }
  },
  
  deleteTodo: async (listId, todoId) => {
    try {
      console.log('Deleting todo:', todoId, 'from list:', listId);
      const res = await api.delete(`/.netlify/functions/todos-direct/${listId}/todos/${todoId}`);
      console.log('Delete todo response:', res.data);
      return res.data;
    } catch (err) {
      console.error('Error deleting todo:', err.response?.data || err.message || err);
      throw err.response?.data || err;
    }
  },
  
  // Photo Albums endpoints
  getAlbums: async () => {
    try {
      console.log('Calling albums-direct function...');
      const res = await api.get('/.netlify/functions/albums-direct');
      console.log('Albums response:', res.data);
      return res.data;
    } catch (err) {
      console.error('Error fetching albums:', err.response?.data || err.message);
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
      console.log('Adding photo to album:', albumId, 'Photo data:', JSON.stringify(photoData, null, 2));
      
      // Check if we have a file or a URL
      if (photoData.file) {
        console.log('File detected, type:', typeof photoData.file);
        
        // If it's a File object, convert to base64
        if (typeof photoData.file !== 'string' && photoData.file instanceof File) {
          console.log('Converting File object to base64, file name:', photoData.file.name);
          
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(photoData.file);
            
            reader.onload = async () => {
              try {
                const base64String = reader.result;
                console.log('File converted to base64, length:', base64String.length);
                
                const photoPayload = {
                  url: base64String,
                  caption: photoData.caption || '',
                  date: photoData.date || new Date().toISOString()
                };
                
                console.log('Sending photo data with base64 image to:', `/.netlify/functions/albums-direct/${albumId}/photos`);
                
                const res = await api.post(`/.netlify/functions/albums-direct/${albumId}/photos`, photoPayload);
                console.log('Photo upload response received:', res.status);
                
                resolve(res.data);
              } catch (error) {
                console.error('Error in file upload process:', error.response?.data || error.message || error);
                reject(error.response?.data || error);
              }
            };
            
            reader.onerror = (error) => {
              console.error('Error reading file:', error);
              reject(error);
            };
          });
        } else {
          // It's a file path or URL as string
          console.log('File is a string, treating as URL');
          const photoPayload = {
            url: photoData.file,
            caption: photoData.caption || '',
            date: photoData.date || new Date().toISOString()
          };
          
          console.log('Sending photo data with URL string');
          const res = await api.post(`/.netlify/functions/albums-direct/${albumId}/photos`, photoPayload);
          console.log('Photo upload response received');
          
          return res.data;
        }
      } else if (photoData.url) {
        // It's a URL string, send directly
        console.log('URL detected:', photoData.url.substring(0, 30) + '...');
        
        const photoPayload = {
          url: photoData.url,
          caption: photoData.caption || '',
          date: photoData.date || new Date().toISOString()
        };
        
        console.log('Sending photo data with URL');
        
        const res = await api.post(`/.netlify/functions/albums-direct/${albumId}/photos`, photoPayload);
        console.log('Photo upload response received');
        
        return res.data;
      } else {
        throw new Error('No file or URL provided for photo upload');
      }
    } catch (err) {
      console.error('Error uploading photo:', err.response?.data || err.message || err);
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
