import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  FaHome, 
  FaCalendarAlt, 
  FaListUl, 
  FaImage, 
  FaMoneyBillWave, 
  FaUtensils, 
  FaPlane, 
  FaEnvelope, 
  FaBirthdayCake,
  FaUser,
  FaBars,
  FaTimes,
  FaSun,
  FaMoon
} from 'react-icons/fa';

const Layout = ({ children }) => {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userInitials, setUserInitials] = useState('');
  
  // Generate user initials when user data is available
  useEffect(() => {
    if (user && user.name) {
      const names = user.name.split(' ');
      if (names.length >= 2) {
        setUserInitials(`${names[0][0]}${names[names.length - 1][0]}`);
      } else if (names.length === 1) {
        setUserInitials(names[0].substring(0, 2));
      }
    }
  }, [user]);
  
  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const navigation = [
    { name: 'Home', href: '/', icon: <FaHome /> },
    { name: 'Important Dates', href: '/dates', icon: <FaBirthdayCake /> },
    { name: 'Calendar', href: '/calendar', icon: <FaCalendarAlt /> },
    { name: 'To-Do Lists', href: '/todos', icon: <FaListUl /> },
    { name: 'Photo Gallery', href: '/gallery', icon: <FaImage /> },
    { name: 'Budget Tracker', href: '/budget', icon: <FaMoneyBillWave /> },
    { name: 'Recipes', href: '/recipes', icon: <FaUtensils /> },
    { name: 'Travel', href: '/travel', icon: <FaPlane /> },
    { name: 'Notes & Messages', href: '/notes', icon: <FaEnvelope /> },
  ];

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Don't show layout on login/register pages
  if (router.pathname === '/login' || router.pathname === '/register') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col dark:bg-gray-900 dark:text-white transition-colors duration-200">
      {/* Mobile Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm md:hidden transition-colors duration-200">
        <div className="px-4 py-3 flex justify-between items-center">
          <button
            onClick={toggleSidebar}
            className="text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100 focus:outline-none"
          >
            {isSidebarOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>
          
          <h1 className="text-xl font-bold text-primary-600 dark:text-primary-400">PersonalWeb</h1>
          
          <div className="flex items-center space-x-2">
            {/* Dark mode toggle for mobile */}
            <button
              onClick={toggleDarkMode}
              className="p-2 text-gray-500 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 focus:outline-none dark-mode-toggle"
              aria-label="Toggle dark mode"
            >
              {darkMode ? 
                <FaSun className="h-5 w-5 text-yellow-500" /> : 
                <FaMoon className="h-5 w-5 text-blue-700" />
              }
            </button>
            
            {isAuthenticated ? (
              <div className="relative group">
                <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold cursor-pointer">
                  {userInitials}
                </div>
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 hidden group-hover:block">
                  <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border-b dark:border-gray-700">
                    Signed in as <span className="font-semibold">{user?.name}</span>
                  </div>
                  <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                    Your Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex space-x-2">
                <Link href="/login" className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300">
                  Sign in
                </Link>
                <span className="text-gray-300 dark:text-gray-600">|</span>
                <Link href="/register" className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300">
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar for desktop */}
        <aside className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 bg-white dark:bg-gray-800 shadow-md z-10 transition-colors duration-200">
          <div className="flex-1 flex flex-col min-h-0 border-r border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between flex-shrink-0 px-4 py-4 border-b border-gray-200 dark:border-gray-700">
              <Link href="/" className="text-xl font-bold text-primary-600 dark:text-primary-400">PersonalWeb</Link>
              
              {/* Dark mode toggle for desktop */}
              <button
                onClick={toggleDarkMode}
                className="p-2 text-gray-500 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 focus:outline-none dark-mode-toggle"
                aria-label="Toggle dark mode"
              >
                {darkMode ? 
                  <FaSun className="h-5 w-5 text-yellow-500" /> : 
                  <FaMoon className="h-5 w-5 text-blue-700" />
                }
              </button>
            </div>
            
            <nav className="flex-1 overflow-y-auto p-4">
              <ul className="space-y-2">
                {navigation.map((item) => (
                  <li key={item.name}>
                    <Link 
                      href={item.href}
                      className={`flex items-center px-4 py-2 rounded-md ${
                        router.pathname === item.href
                          ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                          : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                        } transition-colors duration-200`}
                    >
                      <span className="mr-3">{item.icon}</span>
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              {isAuthenticated ? (
                <>
                  <div className="flex items-center px-4 py-2">
                    <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold mr-3">
                      {userInitials}
                    </div>
                    <div className="text-sm">
                      <div className="font-medium text-gray-700 dark:text-gray-300">{user?.name}</div>
                      <div className="text-gray-400 dark:text-gray-500 text-xs">{user?.email}</div>
                    </div>
                  </div>
                  <Link 
                    href="/profile"
                    className="flex items-center text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 px-4 py-2 rounded-md mt-2"
                  >
                    <FaUser className="mr-3" />
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 px-4 py-2 rounded-md w-full text-left mt-1"
                  >
                    <svg className="mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign out
                  </button>
                </>
              ) : (
                <Link 
                  href="/login"
                  className="flex items-center text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 px-4 py-2 rounded-md"
                >
                  <FaUser className="mr-3" />
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </aside>

        {/* Mobile Sidebar */}
        {isSidebarOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={toggleSidebar}></div>
            <div className="fixed inset-y-0 left-0 flex flex-col w-64 bg-white dark:bg-gray-800 transition-colors duration-200">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h1 className="text-xl font-bold text-primary-600 dark:text-primary-400">PersonalWeb</h1>
                <button onClick={toggleSidebar} className="text-gray-500 dark:text-gray-300">
                  <FaTimes size={20} />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto p-4">
                <ul className="space-y-2">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <Link 
                        href={item.href}
                        className={`flex items-center px-4 py-2 rounded-md ${
                          router.pathname === item.href
                            ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                        } transition-colors duration-200`}
                        onClick={toggleSidebar}
                      >
                        <span className="mr-3">{item.icon}</span>
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                {isAuthenticated ? (
                  <>
                    <div className="flex items-center px-4 py-2">
                      <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold mr-3">
                        {userInitials}
                      </div>
                      <div className="text-sm">
                        <div className="font-medium text-gray-700 dark:text-gray-300">{user?.name}</div>
                        <div className="text-gray-400 dark:text-gray-500 text-xs">{user?.email}</div>
                      </div>
                    </div>
                    <Link 
                      href="/profile"
                      className="flex items-center text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 px-4 py-2 rounded-md mt-2"
                      onClick={toggleSidebar}
                    >
                      <FaUser className="mr-3" />
                      Profile
                    </Link>
                    <button
                      onClick={() => {
                        toggleSidebar();
                        handleLogout();
                      }}
                      className="flex items-center text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 px-4 py-2 rounded-md w-full text-left mt-1"
                    >
                      <svg className="mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign out
                    </button>
                  </>
                ) : (
                  <Link 
                    href="/login"
                    className="flex items-center text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 px-4 py-2 rounded-md"
                    onClick={toggleSidebar}
                  >
                    <FaUser className="mr-3" />
                    Sign in
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 bg-gray-50 dark:bg-gray-900 overflow-y-auto transition-colors duration-200 md:ml-64">
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
