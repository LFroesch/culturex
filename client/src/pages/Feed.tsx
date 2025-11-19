import { useState, useEffect } from 'react';
import api from '../lib/api';
import PostSearch from '../components/PostSearch';
import PostCard from '../components/PostCard';
import { useToast } from '../hooks/useToast';
import Loading from '../components/Loading';
import PostDetailModal from '../components/PostDetailModal';
import { useAuthStore } from '../store/authStore';

interface Post {
  _id: string;
  title: string;
  description: string;
  type: string;
  photos: string[];
  userId: {
    _id: string;
    username: string;
    profile?: {
      bio?: string;
      photos?: string[];
    };
  };
  cityId: {
    name: string;
    country: string;
  };
  likes: string[];
  comments: any[];
  createdAt: string;
}

const Feed = () => {
  const toast = useToast();
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedType, setFeedType] = useState<'friends' | 'all'>('all');

  useEffect(() => {
    fetchPosts();
  }, [feedType]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const endpoint = feedType === 'friends' ? '/posts/feed/activity' : '/posts';
      const response = await api.get(endpoint);
      const postsData = response.data.posts || response.data;
      const approvedPosts = Array.isArray(postsData) ? postsData : [];
      setPosts(approvedPosts);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      await api.post(`/posts/${postId}/like`);
      setPosts(posts.map(p =>
        p._id === postId
          ? { ...p, likes: p.likes.includes('current-user') ? p.likes.filter(id => id !== 'current-user') : [...p.likes, 'current-user'] }
          : p
      ));
      if (selectedPost && selectedPost._id === postId) {
        setSelectedPost({
          ...selectedPost,
          likes: selectedPost.likes.includes('current-user')
            ? selectedPost.likes.filter(id => id !== 'current-user')
            : [...selectedPost.likes, 'current-user']
        });
      }
    } catch (error) {
      console.error('Failed to like post:', error);
      toast.error('Failed to like post');
    }
  };

  if (loading) {
    return <Loading text="Loading feed..." />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <toast.ToastContainer />
      {/* Search Section */}
      <PostSearch />

      {/* Recent Posts Feed */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {feedType === 'friends' ? 'Friends Activity' : 'All Posts'}
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setFeedType('friends')}
              className={`px-4 py-2 rounded-md transition-colors ${
                feedType === 'friends'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              👥 Friends
            </button>
            <button
              onClick={() => setFeedType('all')}
              className={`px-4 py-2 rounded-md transition-colors ${
                feedType === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              🌍 Explore
            </button>
          </div>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 mb-4">No posts yet</p>
            <a
              href="/create-post"
              className="text-primary-600 dark:text-primary-400 hover:underline"
            >
              Be the first to create a post
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <div
                key={post._id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold">
                        {post.userId.username?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="absolute bottom-0 right-0">
                        <OnlineStatus userId={post.userId._id} />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {post.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {post.userId.username} • {post.cityId.name}, {post.cityId.country}
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-200 rounded-full text-sm">
                    {post.type}
                  </span>
                </div>

                <p className="text-gray-700 dark:text-gray-300 mb-4">{post.description}</p>

                {post.photos && post.photos.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {post.photos.slice(0, 4).map((photo, idx) => (
                      <img
                        key={idx}
                        src={photo}
                        alt={`Post ${idx + 1}`}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
                  <div className="flex items-center space-x-4">
                    <span>❤️ {post.likes.length} likes</span>
                    <button
                      onClick={() => setSelectedPost(post)}
                      className="hover:text-primary-600 dark:hover:text-primary-400"
                    >
                      💬 {post.comments.length} comments
                    </button>
                  </div>
                  <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Post Detail Modal */}
      <PostDetailModal
        post={selectedPost}
        onClose={() => setSelectedPost(null)}
        onLikeToggle={handleLike}
      />
    </div>
  );
};

export default Feed;
