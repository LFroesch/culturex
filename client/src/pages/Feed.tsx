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
    if (!user?._id) {
      toast.error('Please log in to like posts');
      return;
    }

    try {
      const response = await api.post(`/posts/${postId}/like`);
      const userId = String(user._id);

      // Optimistic update - update posts in list
      setPosts(prevPosts => prevPosts.map(post => {
        if (post._id === postId) {
          const newLikes = response.data.liked
            ? [...post.likes, userId]
            : post.likes.filter((id: string) => String(id) !== userId);
          return { ...post, likes: newLikes };
        }
        return post;
      }));

      // Update selected post if it's open
      if (selectedPost?._id === postId) {
        const newLikes = response.data.liked
          ? [...selectedPost.likes, userId]
          : selectedPost.likes.filter((id: string) => String(id) !== userId);

        setSelectedPost({
          ...selectedPost,
          likes: newLikes
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
              <PostCard
                key={post._id}
                post={post}
                onLike={handleLike}
                onClick={setSelectedPost}
                currentUserId={user?._id}
              />
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
