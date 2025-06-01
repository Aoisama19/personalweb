import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { apiCall } from '../utils/api';

// Create the auth context
const AuthContext = createContext();

// Provider component that wraps your app and makes auth object available to any child component that calls useAuth()
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  // Check if there's a token in localStorage and fetch user data
  useEffect(() => {
    async function loadUserFromToken() {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setLoading(false);
        return;
      }
      
      try {
        // Use the direct user endpoint
        const response = await fetch('/.netlify/functions/user-direct', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to load user profile');
        }
        
        const userData = await response.json();
        setUser(userData);
      } catch (err) {
        console.error('Failed to load user:', err);
        localStorage.removeItem('token'); // Clear invalid token
      } finally {
        setLoading(false);
      }
    }
    
    loadUserFromToken();
  }, []);

  // Login function
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      // Use the direct login endpoint that we know works
      const response = await fetch('/.netlify/functions/login-direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      
      if (data && data.token) {
        localStorage.setItem('token', data.token);
        setUser(data.user);
        return true;
      } else {
        throw new Error('No token received');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (name, email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      // Use the direct registration endpoint
      const response = await fetch('/.netlify/functions/register-direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }
      
      // If registration is successful, automatically log the user in
      if (data && data.token) {
        localStorage.setItem('token', data.token);
        setUser(data.user);
      }
      
      return true;
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    router.push('/login');
  };

  // Context values to be provided
  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook for child components to get the auth object and re-render when it changes
export const useAuth = () => {
  return useContext(AuthContext);
};
