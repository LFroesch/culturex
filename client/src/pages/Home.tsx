import { useState, useEffect } from 'react';
import api from '../lib/api';
import { Post } from '../types';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../hooks/useToast';
import Loading from '../components/Loading';
import OnlineStatus from '../components/OnlineStatus';

const Home = () => {
  const { user } = useAuthStore();
  const toast = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    category: 'Daily Life',
    tags: ''
  });

  const categories = ['Food', 'Traditions', 'Language', 'Travel', 'Art', 'Music', 'History', 'Daily Life', 'Other'];

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await api.get('/posts');
      setPosts(response.data);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.post('/posts', {
        ...newPost,
        tags: newPost.tags.split(',').map(t => t.trim()).filter(Boolean)
      });
      setPosts([response.data, ...posts]);
      setNewPost({ title: '', content: '', category: 'Daily Life', tags: '' });
      setShowCreatePost(false);
      toast.success('Post created successfully! It will be reviewed by moderators.');
    } catch (error) {
      console.error('Failed to create post:', error);
      toast.error('Failed to create post');
    }
  };

  const handleLike = async (postId: string) => {
    try {
      await api.post(`/posts/${postId}/like`);
      fetchPosts();
    } catch (error) {
      console.error('Failed to like post:', error);
      toast.error('Failed to like post');
    }
  };

  if (loading) {
    return <Loading text="Loading posts..." />;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <toast.ToastContainer />
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Welcome to CulturalX, {user?.name}!
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Share your cultural experiences and learn from others around the world.
        </p>
        <button
          onClick={() => setShowCreatePost(!showCreatePost)}
          className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
        >
          {showCreatePost ? 'Cancel' : 'Create Post'}
        </button>

        {showCreatePost && (
          <form onSubmit={handleCreatePost} className="mt-6 space-y-4">
            <div>
              <input
                type="text"
                required
                value={newPost.title}
                onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Post title"
              />
            </div>
            <div>
              <select
                value={newPost.category}
                onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <textarea
                required
                value={newPost.content}
                onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Share your cultural experience..."
              />
            </div>
            <div>
              <input
                type="text"
                value={newPost.tags}
                onChange={(e) => setNewPost({ ...newPost, tags: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Tags (comma-separated)"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            >
              Post
            </button>
          </form>
        )}
      </div>

      <div className="space-y-6">
        {posts.map((post) => (
          <div key={post._id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <div className="relative">
                <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold">
                  {post.author.name.charAt(0).toUpperCase()}
                </div>
                <div className="absolute bottom-0 right-0">
                  <OnlineStatus userId={post.author.id} />
                </div>
              </div>
              <div className="ml-3">
                <p className="font-medium text-gray-900 dark:text-gray-100">{post.author.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{post.author.country}</p>
              </div>
              <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                {new Date(post.createdAt).toLocaleDateString()}
              </span>
            </div>

            <div className="mb-4">
              <span className="inline-block px-3 py-1 text-xs font-medium bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-200 rounded-full mb-2">
                {post.category}
              </span>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">{post.title}</h3>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{post.content}</p>
            </div>

            {post.tags.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {post.tags.map((tag, idx) => (
                  <span key={idx} className="text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center space-x-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => handleLike(post._id)}
                className={`flex items-center space-x-2 ${
                  post.likes.includes(user?.id || '')
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400'
                }`}
              >
                <span>{post.likes.includes(user?.id || '') ? '❤️' : '🤍'}</span>
                <span>{post.likes.length}</span>
              </button>
              <button className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400">
                <span>💬</span>
                <span>{post.comments.length}</span>
              </button>
            </div>
          </div>
        ))}

        {posts.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-lg">No posts yet. Be the first to share!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
