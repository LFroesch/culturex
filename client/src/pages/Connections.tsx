import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { Connection } from '../types';
import { useAuthStore } from '../store/authStore';
import { useConfirm } from '../hooks/useConfirm';
import OnlineStatus from '../components/OnlineStatus';

const Connections = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { confirm, ConfirmDialog } = useConfirm();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted'>('all');

  useEffect(() => {
    fetchConnections();
  }, [filter]);

  const fetchConnections = async () => {
    try {
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const response = await api.get(`/connections${params}`);
      setConnections(response.data);
    } catch (error) {
      console.error('Failed to fetch connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (connectionId: string) => {
    try {
      await api.put(`/connections/${connectionId}/accept`);
      fetchConnections();
    } catch (error) {
      console.error('Failed to accept connection:', error);
    }
  };

  const handleReject = async (connectionId: string) => {
    try {
      await api.put(`/connections/${connectionId}/reject`);
      fetchConnections();
    } catch (error) {
      console.error('Failed to reject connection:', error);
    }
  };

  const handleDelete = async (connectionId: string) => {
    const confirmed = await confirm({
      title: 'Remove Connection',
      message: 'Are you sure you want to remove this connection? This action cannot be undone.',
      confirmText: 'Remove',
      cancelText: 'Cancel',
      variant: 'danger'
    });

    if (!confirmed) return;

    try {
      await api.delete(`/connections/${connectionId}`);
      fetchConnections();
    } catch (error) {
      console.error('Failed to delete connection:', error);
    }
  };

  const getOtherUser = (connection: Connection) => {
    return connection.user1._id === user?.id ? connection.user2 : connection.user1;
  };

  const isPendingReceived = (connection: Connection) => {
    return connection.status === 'pending' && connection.requestedBy !== user?.id;
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <ConfirmDialog />
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">My Connections</h2>
        <div className="flex space-x-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md transition-colors ${
              filter === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-md transition-colors ${
              filter === 'pending'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('accepted')}
            className={`px-4 py-2 rounded-md transition-colors ${
              filter === 'accepted'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Accepted
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {connections.map((connection) => {
          const otherUser = getOtherUser(connection);
          return (
            <div key={connection._id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="relative">
                  <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {otherUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="absolute bottom-0 right-0">
                    <OnlineStatus userId={otherUser._id} />
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{otherUser.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{otherUser.country}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {otherUser.languages.slice(0, 3).map((lang, idx) => (
                      <span key={idx} className="px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-200 rounded text-xs">
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col items-end space-y-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      connection.status === 'accepted'
                        ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200'
                        : connection.status === 'pending'
                        ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-200'
                        : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200'
                    }`}
                  >
                    {connection.status}
                  </span>

                  {connection.status === 'accepted' && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => navigate(`/messages/${otherUser._id}`)}
                        className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors text-sm"
                      >
                        Message
                      </button>
                      <button
                        onClick={() => handleDelete(connection._id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  )}

                  {isPendingReceived(connection) && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleAccept(connection._id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleReject(connection._id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  {connection.status === 'pending' && !isPendingReceived(connection) && (
                    <button
                      onClick={() => handleDelete(connection._id)}
                      className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {connections.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">
            {filter === 'all'
              ? 'No connections yet'
              : filter === 'pending'
              ? 'No pending connections'
              : 'No accepted connections'}
          </p>
          <button
            onClick={() => navigate('/discover')}
            className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            Discover People
          </button>
        </div>
      )}
    </div>
  );
};

export default Connections;
