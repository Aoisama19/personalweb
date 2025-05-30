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
        const userData = await apiCall.getCurrentUser();
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
      const data = await apiCall.login({ email, password });
      
      if (data && data.token) {
        localStorage.setItem('token', data.token);
        const userData = await apiCall.getCurrentUser();
        setUser(userData);
        return true;
      }
    } catch (err) {
      setError(err.msg || 'Login failed');
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
      await apiCall.register({ name, email, password });
      return true;
    } catch (err) {
      setError(err.msg || 'Registration failed');
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
