import { useState, useEffect } from 'react';
import api from '../lib/api';
import { User } from '../types';
import { useToast } from '../hooks/useToast';
import Loading from '../components/Loading';
import OnlineStatus from '../components/OnlineStatus';

const Discover = () => {
  const toast = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    country: '',
    language: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.country) params.append('country', filters.country);
      if (filters.language) params.append('language', filters.language);

      const response = await api.get(`/users?${params.toString()}`);
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  const sendConnectionRequest = async (userId: string) => {
    try {
      await api.post(`/connections/request/${userId}`);
      toast.success('Connection request sent!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to send connection request');
    }
  };

  if (loading) {
    return <Loading text="Discovering people..." />;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <toast.ToastContainer />
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Discover People</h2>
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            placeholder="Search by name or bio..."
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <input
            type="text"
            value={filters.country}
            onChange={(e) => setFilters({ ...filters, country: e.target.value })}
            placeholder="Filter by country..."
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <input
            type="text"
            value={filters.language}
            onChange={(e) => setFilters({ ...filters, language: e.target.value })}
            placeholder="Filter by language..."
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => (
          <div key={user._id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-primary-400 to-primary-600 h-20"></div>
            <div className="px-6 pb-6">
              <div className="flex flex-col items-center -mt-10">
                <div className="relative">
                  <div className="w-20 h-20 bg-white dark:bg-gray-700 rounded-full border-4 border-white dark:border-gray-800 flex items-center justify-center text-2xl font-bold text-primary-600 dark:text-primary-400 shadow-lg">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="absolute bottom-0 right-0">
                    <OnlineStatus userId={user._id} />
                  </div>
                </div>
                <h3 className="mt-2 text-xl font-bold text-gray-900 dark:text-gray-100">{user.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{user.country}</p>
                {user.age && <p className="text-sm text-gray-600 dark:text-gray-400">{user.age} years old</p>}
              </div>

              <div className="mt-4 space-y-3">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Languages</p>
                  <div className="flex flex-wrap gap-1">
                    {user.languages.map((lang, idx) => (
                      <span key={idx} className="px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-200 rounded text-xs">
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>

                {user.languagesToLearn.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Learning</p>
                    <div className="flex flex-wrap gap-1">
                      {user.languagesToLearn.map((lang, idx) => (
                        <span key={idx} className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded text-xs">
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {user.interests.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Interests</p>
                    <div className="flex flex-wrap gap-1">
                      {user.interests.slice(0, 3).map((interest, idx) => (
                        <span key={idx} className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 rounded text-xs">
                          {interest}
                        </span>
                      ))}
                      {user.interests.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs">
                          +{user.interests.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {user.bio && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Bio</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">{user.bio}</p>
                  </div>
                )}
              </div>

              <button
                onClick={() => sendConnectionRequest(user._id)}
                className="mt-4 w-full px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors text-sm font-medium"
              >
                Connect
              </button>
            </div>
          </div>
        ))}
      </div>

      {users.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-lg">No users found. Try different filters.</p>
        </div>
      )}
    </div>
  );
};

export default Discover;
