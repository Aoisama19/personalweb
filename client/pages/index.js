import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaCalendarAlt, FaListUl, FaImage, FaMoneyBillWave, FaUtensils, FaPlane, FaEnvelope, FaBirthdayCake, FaHeart } from 'react-icons/fa';
import Layout from '../components/layout/Layout';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const { darkMode } = useTheme();
  const [greeting, setGreeting] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  
  // Set a greeting based on time of day and update current time
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hour = now.getHours();
      let timeGreeting = '';
      
      if (hour < 12) {
        timeGreeting = 'Good morning';
      } else if (hour < 18) {
        timeGreeting = 'Good afternoon';
      } else {
        timeGreeting = 'Good evening';
      }
      
      setGreeting(timeGreeting);
      
      // Format current time
      const options = { hour: 'numeric', minute: '2-digit', hour12: true };
      setCurrentTime(now.toLocaleTimeString([], options));
    };
    
    // Update immediately and then every minute
    updateTime();
    const interval = setInterval(updateTime, 60000);
    
    return () => clearInterval(interval);
  }, []);
  
  const features = [
    { name: 'Important Dates', icon: <FaBirthdayCake className="h-6 w-6" />, path: '/dates', color: 'bg-red-100 text-red-600' },
    { name: 'Calendar & Events', icon: <FaCalendarAlt className="h-6 w-6" />, path: '/calendar', color: 'bg-blue-100 text-blue-600' },
    { name: 'To-Do Lists', icon: <FaListUl className="h-6 w-6" />, path: '/todos', color: 'bg-green-100 text-green-600' },
    { name: 'Photo Gallery', icon: <FaImage className="h-6 w-6" />, path: '/gallery', color: 'bg-purple-100 text-purple-600' },
    { name: 'Budget Tracker', icon: <FaMoneyBillWave className="h-6 w-6" />, path: '/budget', color: 'bg-yellow-100 text-yellow-600' },
    { name: 'Recipe Collection', icon: <FaUtensils className="h-6 w-6" />, path: '/recipes', color: 'bg-orange-100 text-orange-600' },
    { name: 'Travel Planning', icon: <FaPlane className="h-6 w-6" />, path: '/travel', color: 'bg-teal-100 text-teal-600' },
    { name: 'Notes & Messages', icon: <FaEnvelope className="h-6 w-6" />, path: '/notes', color: 'bg-pink-100 text-pink-600' },
  ];

  return (
    <Layout>

      <main>
        {/* Hero Section */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center">
            {isAuthenticated ? (
              <>
                <div className="mb-4 text-sm font-medium text-gray-500 dark:text-gray-400">{currentTime}</div>
                <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white sm:text-5xl sm:tracking-tight lg:text-6xl">
                  {greeting}, <span className="text-primary-600 dark:text-primary-400">{user?.name?.split(' ')[0]}</span>!
                </h1>
                <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500 dark:text-gray-400">
                  Welcome back to your personal dashboard. What would you like to manage today?
                </p>
                <div className="mt-8 flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                  <Link href="/dates" className="inline-block">
                    <button className="w-full btn-primary text-lg px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                      Important Dates
                    </button>
                  </Link>
                  <Link href="/todos" className="inline-block">
                    <button className="w-full bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 border border-primary-600 dark:border-primary-400 px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                      To-Do Lists
                    </button>
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div className="mb-4 text-sm font-medium text-gray-500 dark:text-gray-400">{currentTime}</div>
                <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white sm:text-5xl sm:tracking-tight lg:text-6xl">
                  Your <span className="text-primary-600 dark:text-primary-400">Shared</span> Digital Space
                </h1>
                <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500 dark:text-gray-400">
                  A personal web application for you and your partner to manage your life together.
                </p>
                <div className="mt-8 flex justify-center">
                  <Link href="/login" className="inline-block">
                    <button className="btn-primary text-lg px-8 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex items-center">
                      <FaHeart className="mr-2" /> Get Started
                    </button>
                  </Link>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Features</h2>
            <p className="max-w-2xl mx-auto text-lg text-gray-500 dark:text-gray-400">
              Everything you need to manage your life together in one place.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Link 
                href={feature.path} 
                key={index}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl p-6 flex flex-col items-center text-center transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 dark:border-gray-700"
              >
                <div className={`${feature.color} p-4 rounded-full mb-4`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">{feature.name}</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Manage your {feature.name.toLowerCase()} together in one place.
                </p>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </Layout>
  );
}
