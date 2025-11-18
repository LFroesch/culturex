import { useState, useEffect } from 'react';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';

const ModeratorDashboard = () => {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'flagged'>('pending');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'moderator' || user?.role === 'admin') {
      fetchPosts();
    }
  }, [filter]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const endpoint = filter === 'flagged' ? '/moderation/flagged' : '/moderation/pending';
      const response = await api.get(endpoint);
      setPosts(response.data);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (postId: string) => {
    try {
      await api.put(`/moderation/posts/${postId}/approve`);
      setPosts(posts.filter(p => p._id !== postId));
      alert('Post approved!');
    } catch (error) {
      console.error('Failed to approve:', error);
      alert('Failed to approve post');
    }
  };

  const handleReject = async (postId: string) => {
    const reason = prompt('Rejection reason (optional):');
    try {
      await api.put(`/moderation/posts/${postId}/reject`, { reason });
      setPosts(posts.filter(p => p._id !== postId));
      alert('Post rejected');
    } catch (error) {
      console.error('Failed to reject:', error);
      alert('Failed to reject post');
    }
  };

  if (!user || (user.role !== 'moderator' && user.role !== 'admin')) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Moderator access required</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Moderation Dashboard</h2>
        <div className="flex space-x-4">
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-md ${
              filter === 'pending'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pending ({posts.length})
          </button>
          <button
            onClick={() => setFilter('flagged')}
            className={`px-4 py-2 rounded-md ${
              filter === 'flagged'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Flagged
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <div key={post._id} className="bg-white rounded-lg shadow-md p-6">
              {post.flagged && (
                <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
                  <p className="text-sm font-medium text-red-800">⚠️ Auto-flagged</p>
                  <ul className="text-sm text-red-700 mt-1 ml-4 list-disc">
                    {post.flagReasons.map((reason: string, idx: number) => (
                      <li key={idx}>{reason}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold">
                    {post.userId?.username?.charAt(0).toUpperCase()}
                  </div>
                  <div className="ml-3">
                    <p className="font-medium">{post.userId?.username}</p>
                    <p className="text-sm text-gray-500">
                      {post.cityId?.name}, {post.cityId?.country}
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                  {post.type}
                </span>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2">{post.title}</h3>
              <p className="text-gray-700 mb-4 whitespace-pre-wrap">{post.description}</p>

              {post.photos && post.photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {post.photos.map((photo: string, idx: number) => (
                    <img key={idx} src={photo} alt="" className="w-full h-32 object-cover rounded" />
                  ))}
                </div>
              )}

              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.tags.map((tag: string, idx: number) => (
                    <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-sm">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="text-sm text-gray-500 mb-4">
                Posted: {new Date(post.createdAt).toLocaleString()}
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => handleApprove(post._id)}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  ✓ Approve
                </button>
                <button
                  onClick={() => handleReject(post._id)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  ✗ Reject
                </button>
              </div>
            </div>
          ))}

          {posts.length === 0 && (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-gray-500 text-lg">No posts to review</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ModeratorDashboard;
