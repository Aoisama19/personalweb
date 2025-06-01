import { createContext, useContext, useState, useEffect } from 'react';

// Create the theme context
const ThemeContext = createContext();

// Custom hook to use the theme context
export function useTheme() {
  return useContext(ThemeContext);
}

// Provider component that wraps your app and makes theme object available
export function ThemeProvider({ children }) {
  // Check if we're on the client side before accessing localStorage
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Initialize dark mode from localStorage when component mounts
  useEffect(() => {
    // First set mounted to true
    setMounted(true);
    
    try {
      const savedMode = localStorage.getItem('darkMode');
      if (savedMode !== null) {
        setDarkMode(savedMode === 'true');
      } else {
        // Check user's system preference
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        setDarkMode(prefersDark);
        // Save the initial preference
        localStorage.setItem('darkMode', prefersDark.toString());
      }
    } catch (error) {
      console.error('Error accessing localStorage:', error);
      // Default to light mode if localStorage is not available
      setDarkMode(false);
    }
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode.toString());
  };

  // Update document class when dark mode changes
  useEffect(() => {
    if (!mounted) return;
    
    // Apply or remove the dark class on the document element
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Log the current state for debugging
    console.log('Dark mode is now:', darkMode);
    console.log('Dark class is present:', document.documentElement.classList.contains('dark'));
  }, [darkMode, mounted]);

  // Value to be provided by the context
  const value = {
    darkMode,
    toggleDarkMode
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
