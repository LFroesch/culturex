import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import CommentsSection from './CommentsSection';
import api from '../lib/api';

interface Post {
  _id: string;
  userId: {
    _id: string;
    username: string;
    name?: string;
    profilePicture?: string;
  };
  cityId: {
    _id: string;
    name: string;
    country: string;
  };
  type: string;
  title: string;
  description: string;
  photos: string[];
  tags: string[];
  likes: string[];
  comments: any[];
  createdAt: string;
}

interface PostDetailModalProps {
  post: Post | null;
  onClose: () => void;
  onLikeToggle: (postId: string) => void;
}

const PostDetailModal = ({ post, onClose, onLikeToggle }: PostDetailModalProps) => {
  const { user } = useAuthStore();
  const [comments, setComments] = useState<any[]>([]);

  useEffect(() => {
    if (post) {
      setComments(post.comments || []);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [post]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && post) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [post, onClose]);

  if (!post) return null;

  const isLiked = post.likes.includes(user?.id || '');

  const handleCommentAdded = (newComment: any) => {
    setComments([...comments, newComment]);
  };

  const handleCommentUpdated = (commentId: string, newText: string) => {
    setComments(comments.map(c =>
      c._id === commentId ? { ...c, text: newText, updatedAt: new Date().toISOString() } : c
    ));
  };

  const handleCommentDeleted = (commentId: string) => {
    setComments(comments.filter(c => c._id !== commentId));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            {post.userId.profilePicture ? (
              <img
                src={post.userId.profilePicture}
                alt={post.userId.username}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary-600 dark:bg-primary-500 flex items-center justify-center text-white font-semibold">
                {post.userId.username[0].toUpperCase()}
              </div>
            )}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                {post.userId.name || post.userId.username}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {post.cityId.name}, {post.cityId.country} • {formatDate(post.createdAt)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Post Content */}
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-3">
              <span className="px-2 py-1 text-xs font-medium bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded">
                {post.type}
              </span>
              {post.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                >
                  #{tag}
                </span>
              ))}
            </div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              {post.title}
            </h2>

            {post.description && (
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap mb-4">
                {post.description}
              </p>
            )}

            {/* Photos */}
            {post.photos && post.photos.length > 0 && (
              <div className={`grid gap-2 mb-4 ${
                post.photos.length === 1 ? 'grid-cols-1' :
                post.photos.length === 2 ? 'grid-cols-2' :
                'grid-cols-2 md:grid-cols-3'
              }`}>
                {post.photos.map((photo, idx) => (
                  <img
                    key={idx}
                    src={photo}
                    alt={`Photo ${idx + 1}`}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center space-x-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => onLikeToggle(post._id)}
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
              >
                <span className="text-xl">{isLiked ? '❤️' : '🤍'}</span>
                <span className="font-medium">{post.likes.length}</span>
              </button>
              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                <span className="text-xl">💬</span>
                <span className="font-medium">{comments.length}</span>
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Comments ({comments.length})
            </h3>
            <CommentsSection
              postId={post._id}
              comments={comments}
              onCommentAdded={handleCommentAdded}
              onCommentUpdated={handleCommentUpdated}
              onCommentDeleted={handleCommentDeleted}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetailModal;
