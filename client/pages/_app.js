import '../styles/globals.css';
import '../styles/calendar-dark.css';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';

function MyApp({ Component, pageProps }) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <Head>
        <title>PersonalWeb - Your Shared Digital Space</title>
        <meta name="description" content="A personal web application for couples to manage their life together" />
        <link rel="icon" href="/favicon.ico" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      
      {isLoading ? (
        <div className="flex items-center justify-center min-h-screen dark:bg-gray-900">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <AuthProvider>
          <ThemeProvider>
            <Component {...pageProps} />
          </ThemeProvider>
        </AuthProvider>
      )}
    </>
  );
}

export default MyApp;
