const dev = process.env.NODE_ENV !== 'production';

// We'll deploy the backend to Netlify Functions
export const API_URL = dev 
  ? 'http://localhost:5000/api' 
  : '/.netlify/functions';

export const APP_NAME = 'PersonalWeb';
