import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { getSocket } from '../lib/socket';
import { Message, Conversation } from '../types';
import { useAuthStore } from '../store/authStore';

const Messages = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
    const socket = getSocket();

    if (socket) {
      socket.on('receive_message', (message: Message) => {
        if (
          userId &&
          (message.sender === userId || message.receiver === userId)
        ) {
          setMessages((prev) => [...prev, message]);
        }
        fetchConversations();
      });

      return () => {
        socket.off('receive_message');
      };
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchMessages(userId);
      fetchUserDetails(userId);
    }
  }, [userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      const response = await api.get('/messages/conversations');
      setConversations(response.data);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    }
  };

  const fetchMessages = async (otherUserId: string) => {
    try {
      const response = await api.get(`/messages/${otherUserId}`);
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const fetchUserDetails = async (otherUserId: string) => {
    try {
      const response = await api.get(`/users/${otherUserId}`);
      setSelectedUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user details:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !userId) return;

    try {
      const socket = getSocket();
      if (socket) {
        socket.emit('send_message', {
          receiver: userId,
          content: newMessage
        });
        setNewMessage('');
      } else {
        const response = await api.post('/messages', {
          receiver: userId,
          content: newMessage
        });
        setMessages([...messages, response.data]);
        setNewMessage('');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleConversationClick = (conversation: Conversation) => {
    navigate(`/messages/${conversation.user._id}`);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow-md overflow-hidden" style={{ height: 'calc(100vh - 180px)' }}>
        <div className="flex h-full">
          {/* Conversations List */}
          <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Messages</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {conversations.map((conversation) => (
                <button
                  key={conversation.user._id}
                  onClick={() => handleConversationClick(conversation)}
                  className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                    userId === conversation.user._id ? 'bg-primary-50' : ''
                  }`}
                >
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold">
                      {conversation.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {conversation.user.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(conversation.lastMessage.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {conversation.lastMessage.content}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
              {conversations.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  No conversations yet. Connect with people to start chatting!
                </div>
              )}
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 flex flex-col">
            {selectedUser ? (
              <>
                {/* Chat Header */}
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold">
                      {selectedUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="ml-3">
                      <p className="font-medium text-gray-900">{selectedUser.name}</p>
                      <p className="text-sm text-gray-500">{selectedUser.country}</p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => {
                    const isSent = message.sender === user?.id;
                    return (
                      <div
                        key={message._id}
                        className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            isSent
                              ? 'bg-primary-600 text-white'
                              : 'bg-gray-200 text-gray-900'
                          }`}
                        >
                          <p className="break-words">{message.content}</p>
                          <p
                            className={`text-xs mt-1 ${
                              isSent ? 'text-primary-100' : 'text-gray-500'
                            }`}
                          >
                            {new Date(message.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <form onSubmit={handleSendMessage} className="p-4 bg-gray-50 border-t border-gray-200">
                  <div className="flex space-x-4">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      Send
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <p className="text-lg mb-2">Select a conversation to start messaging</p>
                  <p className="text-sm">or</p>
                  <button
                    onClick={() => navigate('/connections')}
                    className="mt-2 px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                  >
                    View Connections
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
