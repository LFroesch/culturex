import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';
import { useToast } from '../hooks/useToast';

interface Comment {
  _id: string;
  user: {
    _id: string;
    username: string;
    name?: string;
    profilePicture?: string;
  };
  text: string;
  parentCommentId?: string | null;
  likes?: string[];
  createdAt: string;
  updatedAt?: string;
}

interface CommentsSectionProps {
  postId: string;
  comments: Comment[];
  onCommentAdded: (comment: Comment) => void;
  onCommentUpdated: (commentId: string, newText: string) => void;
  onCommentDeleted: (commentId: string) => void;
}

const CommentsSection = ({
  postId,
  comments,
  onCommentAdded,
  onCommentUpdated,
  onCommentDeleted
}: CommentsSectionProps) => {
  const { user } = useAuthStore();
  const toast = useToast();
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [localComments, setLocalComments] = useState<Comment[]>(comments);

  // Sync local comments with props
  useEffect(() => {
    setLocalComments(comments);
  }, [comments]);

  // Handle comment like
  const handleLikeComment = async (commentId: string) => {
    try {
      const response = await api.post(`/posts/${postId}/comment/${commentId}/like`);

      // Optimistically update local state
      setLocalComments(prevComments =>
        prevComments.map(c =>
          c._id === commentId
            ? {
                ...c,
                likes: response.data.liked
                  ? [...(c.likes || []), user?._id].filter(Boolean)
                  : (c.likes || []).filter((id: string) => id !== user?._id)
              }
            : c
        )
      );
    } catch (error) {
      console.error('Failed to like comment:', error);
      toast.error('Failed to like comment');
    }
  };

  // Organize comments into a tree structure
  const organizeComments = (): { topLevel: Comment[]; replies: Record<string, Comment[]> } => {
    const topLevel: Comment[] = [];
    const replies: Record<string, Comment[]> = {};

    localComments.forEach((comment) => {
      if (!comment.parentCommentId) {
        topLevel.push(comment);
      } else {
        if (!replies[comment.parentCommentId]) {
          replies[comment.parentCommentId] = [];
        }
        replies[comment.parentCommentId].push(comment);
      }
    });

    // Sort by date based on sortBy setting
    const sortFn = sortBy === 'newest'
      ? (a: Comment, b: Comment) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      : (a: Comment, b: Comment) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();

    topLevel.sort(sortFn);

    // Replies always oldest first for better conversation flow
    Object.keys(replies).forEach((key) => {
      replies[key].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    });

    return { topLevel, replies };
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      const response = await api.post(`/posts/${postId}/comment`, { text: newComment });
      onCommentAdded(response.data);
      setNewComment('');
      toast.success('Comment added!');
    } catch (error) {
      console.error('Failed to add comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  const handleAddReply = async (parentCommentId: string) => {
    if (!replyText.trim()) return;

    setLoading(true);
    try {
      const response = await api.post(`/posts/${postId}/comment`, {
        text: replyText,
        parentCommentId
      });
      onCommentAdded(response.data);
      setReplyText('');
      setReplyingTo(null);
      toast.success('Reply added!');
    } catch (error) {
      console.error('Failed to add reply:', error);
      toast.error('Failed to add reply');
    } finally {
      setLoading(false);
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editText.trim()) return;

    setLoading(true);
    try {
      await api.put(`/posts/${postId}/comment/${commentId}`, { text: editText });
      onCommentUpdated(commentId, editText);
      setEditingId(null);
      setEditText('');
      toast.success('Comment updated!');
    } catch (error) {
      console.error('Failed to edit comment:', error);
      toast.error('Failed to edit comment');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    setLoading(true);
    try {
      await api.delete(`/posts/${postId}/comment/${commentId}`);
      onCommentDeleted(commentId);
      toast.success('Comment deleted!');
    } catch (error) {
      console.error('Failed to delete comment:', error);
      toast.error('Failed to delete comment');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const renderComment = (comment: Comment, isReply = false) => {
    const isEditing = editingId === comment._id;
    const isAuthor = user?.id === comment.user._id;

    return (
      <div key={comment._id} className={`${isReply ? 'ml-8 md:ml-12' : ''}`}>
        <div className="flex space-x-3 mb-3">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {comment.user.profilePicture ? (
              <img
                src={comment.user.profilePicture}
                alt={comment.user.username}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary-600 dark:bg-primary-500 flex items-center justify-center text-white font-semibold">
                {comment.user.username[0].toUpperCase()}
              </div>
            )}
          </div>

          {/* Comment Content */}
          <div className="flex-1 min-w-0">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                  {comment.user.name || comment.user.username}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(comment.createdAt)}
                  {comment.updatedAt && ' (edited)'}
                </span>
              </div>

              {isEditing ? (
                <div className="space-y-2">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm resize-none"
                    rows={2}
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditComment(comment._id)}
                      disabled={loading}
                      className="px-3 py-1 text-xs bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setEditText('');
                      }}
                      className="px-3 py-1 text-xs bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-400 dark:hover:bg-gray-500"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap">
                  {comment.text}
                </p>
              )}
            </div>

            {/* Actions */}
            {!isEditing && (
              <div className="flex items-center space-x-4 mt-1 text-xs">
                <button
                  onClick={() => handleLikeComment(comment._id)}
                  className={`flex items-center space-x-1 font-medium transition-colors ${
                    comment.likes?.includes(user?._id || '')
                      ? 'text-red-500 hover:text-red-600'
                      : 'text-gray-600 dark:text-gray-400 hover:text-red-500'
                  }`}
                >
                  <span>{comment.likes?.includes(user?._id || '') ? '❤️' : '🤍'}</span>
                  {comment.likes && comment.likes.length > 0 && (
                    <span>{comment.likes.length}</span>
                  )}
                </button>
                <button
                  onClick={() => setReplyingTo(comment._id)}
                  className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 font-medium"
                >
                  Reply
                </button>
                {isAuthor && (
                  <>
                    <button
                      onClick={() => {
                        setEditingId(comment._id);
                        setEditText(comment.text);
                      }}
                      className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteComment(comment._id)}
                      className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 font-medium"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Reply Form */}
            {replyingTo === comment._id && (
              <div className="mt-3 flex space-x-2">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a reply..."
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm resize-none"
                  rows={2}
                />
                <div className="flex flex-col space-y-1">
                  <button
                    onClick={() => handleAddReply(comment._id)}
                    disabled={loading || !replyText.trim()}
                    className="px-3 py-1 text-xs bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50"
                  >
                    Reply
                  </button>
                  <button
                    onClick={() => {
                      setReplyingTo(null);
                      setReplyText('');
                    }}
                    className="px-3 py-1 text-xs bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-400 dark:hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Nested Replies */}
            {replies[comment._id] && replies[comment._id].length > 0 && (
              <div className="mt-3 space-y-3">
                {replies[comment._id].map((reply) => renderComment(reply, true))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const { topLevel, replies } = organizeComments();

  return (
    <>
      <toast.ToastContainer />
      <div className="space-y-4">
        {/* Add Comment Form */}
        <div className="flex space-x-3">
          <div className="flex-shrink-0">
            {user?.profilePicture ? (
              <img
                src={user.profilePicture}
                alt={user.username || 'You'}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary-600 dark:bg-primary-500 flex items-center justify-center text-white font-semibold">
                {user?.username?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
          </div>
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none focus:ring-2 focus:ring-primary-500"
              rows={2}
            />
            <button
              onClick={handleAddComment}
              disabled={loading || !newComment.trim()}
              className="mt-2 px-4 py-2 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        </div>

        {/* Sort Controls */}
        {topLevel.length > 0 && (
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              {localComments.length} {localComments.length === 1 ? 'Comment' : 'Comments'}
            </h3>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-600 dark:text-gray-400">Sort by:</span>
              <button
                onClick={() => setSortBy('newest')}
                className={`text-xs px-2 py-1 rounded ${
                  sortBy === 'newest'
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Newest
              </button>
              <button
                onClick={() => setSortBy('oldest')}
                className={`text-xs px-2 py-1 rounded ${
                  sortBy === 'oldest'
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Oldest
              </button>
            </div>
          </div>
        )}

        {/* Comments List */}
        <div className="space-y-4">
          {topLevel.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              No comments yet. Be the first to comment!
            </p>
          ) : (
            topLevel.map((comment) => renderComment(comment))
          )}
        </div>
      </div>
    </>
  );
};

export default CommentsSection;
