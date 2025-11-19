import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import NotificationBell from './NotificationBell';
import DarkModeToggle from './DarkModeToggle';

const Layout = () => {
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const baseNavItems = [
    { path: '/', label: 'Map', icon: '🗺️' },
    { path: '/feed', label: 'Feed', icon: '🏠' },
    { path: '/create-post', label: 'Create', icon: '✍️' },
    { path: '/discover', label: 'Discover', icon: '🌍' },
    { path: '/connections', label: 'Connections', icon: '🤝' },
    { path: '/messages', label: 'Messages', icon: '💬' },
    { path: '/profile', label: 'Profile', icon: '👤' }
  ];

  const moderatorNavItems = [
    { path: '/moderation', label: 'Moderation', icon: '⚖️' }
  ];

  const adminNavItems = [
    { path: '/admin', label: 'Admin', icon: '👑' }
  ];

  const navItems = [
    ...baseNavItems,
    ...(user?.role === 'moderator' || user?.role === 'admin' ? moderatorNavItems : []),
    ...(user?.role === 'admin' ? adminNavItems : [])
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16">
      <nav className="bg-white dark:bg-gray-800 shadow-md fixed top-0 left-0 right-0 z-50">
        <div className="max-w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4 overflow-x-auto">
              <Link to="/" className="text-2xl font-bold text-primary-600 dark:text-primary-400 flex-shrink-0">
                CulturalX
              </Link>
              <div className="hidden lg:flex space-x-2 flex-wrap">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                      location.pathname === item.path
                        ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-100'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span className="mr-1">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">
              <DarkModeToggle />
              <NotificationBell />
              <span className="hidden lg:inline text-sm text-gray-600 dark:text-gray-300 max-w-[150px] truncate">
                {user?.name || user?.username}
              </span>
              <button
                onClick={logout}
                className="px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main>
        <Outlet />
      </main>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-around py-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center px-3 py-2 text-xs ${
                location.pathname === item.path
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <span className="text-2xl">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Layout;
