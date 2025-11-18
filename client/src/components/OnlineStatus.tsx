import { useState, useEffect } from 'react';
import { getSocket } from '../lib/socket';

interface OnlineStatusProps {
  userId: string;
  showLabel?: boolean;
}

const OnlineStatus = ({ userId, showLabel = false }: OnlineStatusProps) => {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    // Listen for online/offline events
    const handleUserOnline = ({ userId: onlineUserId }: { userId: string }) => {
      if (onlineUserId === userId) {
        setIsOnline(true);
      }
    };

    const handleUserOffline = ({ userId: offlineUserId }: { userId: string }) => {
      if (offlineUserId === userId) {
        setIsOnline(false);
      }
    };

    socket.on('user_online', handleUserOnline);
    socket.on('user_offline', handleUserOffline);

    // Request current online status
    socket.emit('check_user_status', { userId }, (response: { isOnline: boolean }) => {
      setIsOnline(response?.isOnline || false);
    });

    return () => {
      socket.off('user_online', handleUserOnline);
      socket.off('user_offline', handleUserOffline);
    };
  }, [userId]);

  if (showLabel) {
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
        isOnline
          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
      }`}>
        <span className={`w-2 h-2 rounded-full mr-1 ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
        {isOnline ? 'Online' : 'Offline'}
      </span>
    );
  }

  return (
    <span
      className={`w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${
        isOnline ? 'bg-green-500' : 'bg-gray-400'
      }`}
      title={isOnline ? 'Online' : 'Offline'}
    />
  );
};

export default OnlineStatus;
