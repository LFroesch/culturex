import { useState } from 'react';
import OnlineStatus from './OnlineStatus';

interface PostCardProps {
  post: {
    _id: string;
    title: string;
    description: string;
    type: string;
    photos?: string[];
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
    tags?: string[];
    metadata?: any;
  };
  onLike?: (postId: string) => void;
  onClick?: (post: any) => void;
  currentUserId?: string;
}

const PostCard = ({ post, onLike, onClick, currentUserId }: PostCardProps) => {
  const isLiked = currentUserId ? post.likes.includes(currentUserId) : false;
  const [showFullDescription, setShowFullDescription] = useState(false);

  // Type-specific styling configs
  const typeStyles = {
    food: {
      gradient: 'from-orange-500 to-red-600',
      badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200',
      icon: '🍜',
      border: 'border-orange-200 dark:border-orange-800'
    },
    recipe: {
      gradient: 'from-amber-500 to-orange-600',
      badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200',
      icon: '👨‍🍳',
      border: 'border-amber-200 dark:border-amber-800'
    },
    photo: {
      gradient: 'from-purple-500 to-pink-600',
      badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200',
      icon: '📸',
      border: 'border-purple-200 dark:border-purple-800'
    },
    story: {
      gradient: 'from-blue-500 to-indigo-600',
      badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200',
      icon: '📖',
      border: 'border-blue-200 dark:border-blue-800'
    },
    music: {
      gradient: 'from-pink-500 to-rose-600',
      badge: 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-200',
      icon: '🎵',
      border: 'border-pink-200 dark:border-pink-800'
    },
    workExchange: {
      gradient: 'from-green-500 to-emerald-600',
      badge: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200',
      icon: '💼',
      border: 'border-green-200 dark:border-green-800'
    },
    forum: {
      gradient: 'from-cyan-500 to-blue-600',
      badge: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-200',
      icon: '💬',
      border: 'border-cyan-200 dark:border-cyan-800'
    },
    insight: {
      gradient: 'from-violet-500 to-purple-600',
      badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-200',
      icon: '💡',
      border: 'border-violet-200 dark:border-violet-800'
    }
  };

  const style = typeStyles[post.type as keyof typeof typeStyles] || typeStyles.insight;

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  const renderRecipeCard = () => (
    <div className={`rounded-xl overflow-hidden border-2 ${style.border} bg-white dark:bg-gray-800 hover:shadow-2xl transition-all duration-300`}>
      {/* Recipe Header */}
      <div className={`bg-gradient-to-r ${style.gradient} p-6 text-white`}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-5xl">{style.icon}</span>
          <span className="text-sm bg-white/20 px-3 py-1 rounded-full backdrop-blur">
            Recipe
          </span>
        </div>
        <h2 className="text-2xl font-bold mb-2">{post.title}</h2>
        <p className="text-white/90 text-sm">{post.description}</p>
      </div>

      {/* Recipe Details */}
      {post.metadata?.ingredients && (
        <div className="p-6 bg-amber-50 dark:bg-gray-900">
          <div className="grid grid-cols-2 gap-4 mb-4">
            {post.metadata.prepTime && (
              <div className="flex items-center gap-2">
                <span className="text-2xl">⏱️</span>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Prep Time</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{post.metadata.prepTime}</p>
                </div>
              </div>
            )}
            {post.metadata.servings && (
              <div className="flex items-center gap-2">
                <span className="text-2xl">🍽️</span>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Serves</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{post.metadata.servings}</p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">Ingredients:</h3>
            <ul className="space-y-1">
              {post.metadata.ingredients.slice(0, 3).map((ing: string, i: number) => (
                <li key={i} className="text-sm text-gray-700 dark:text-gray-300">• {ing}</li>
              ))}
              {post.metadata.ingredients.length > 3 && (
                <li className="text-sm text-gray-500 dark:text-gray-400">+ {post.metadata.ingredients.length - 3} more...</li>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* Author & Engagement */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        {renderUserInfo()}
        {renderEngagement()}
      </div>
    </div>
  );

  const renderFoodCard = () => (
    <div className={`rounded-xl overflow-hidden border-2 ${style.border} bg-white dark:bg-gray-800 hover:shadow-2xl transition-all duration-300`}>
      {/* Food Image Placeholder */}
      <div className={`h-48 bg-gradient-to-br ${style.gradient} relative flex items-center justify-center`}>
        <span className="text-8xl">{style.icon}</span>
        <div className="absolute top-4 right-4">
          <span className={`${style.badge} px-3 py-1 rounded-full text-xs font-semibold`}>
            {post.metadata?.foodType || 'Food'}
          </span>
        </div>
      </div>

      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{post.title}</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">{truncateText(post.description, 150)}</p>

        {post.metadata?.locationDetails && (
          <div className="flex items-start gap-2 mb-4 text-sm bg-orange-50 dark:bg-gray-900 p-3 rounded-lg">
            <span className="text-xl">📍</span>
            <p className="text-gray-700 dark:text-gray-300">{post.metadata.locationDetails}</p>
          </div>
        )}

        {renderTags()}
        {renderUserInfo()}
        {renderEngagement()}
      </div>
    </div>
  );

  const renderPhotoCard = () => (
    <div className={`rounded-xl overflow-hidden border-2 ${style.border} bg-white dark:bg-gray-800 hover:shadow-2xl transition-all duration-300`}>
      {/* Large photo area */}
      <div className={`h-80 bg-gradient-to-br ${style.gradient} relative flex items-center justify-center`}>
        <span className="text-9xl opacity-20">{style.icon}</span>
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-black/50 backdrop-blur-md rounded-lg p-4">
            <h2 className="text-2xl font-bold text-white mb-1">{post.title}</h2>
            <p className="text-white/90 text-sm">{post.metadata?.photoCategory}</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <p className="text-gray-700 dark:text-gray-300 mb-4">{post.description}</p>
        {renderTags()}
        {renderUserInfo()}
        {renderEngagement()}
      </div>
    </div>
  );

  const renderStoryCard = () => (
    <div className={`rounded-xl overflow-hidden border-l-4 ${style.border} bg-white dark:bg-gray-800 hover:shadow-xl transition-all duration-300`}>
      <div className="p-6">
        <div className="flex items-start gap-3 mb-4">
          <span className="text-4xl">{style.icon}</span>
          <div className="flex-1">
            <span className={`${style.badge} px-3 py-1 rounded-full text-xs font-semibold inline-block mb-2`}>
              {post.metadata?.storyCategory || 'Story'}
            </span>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight">{post.title}</h2>
          </div>
        </div>

        <div className="prose dark:prose-invert max-w-none mb-4">
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            {showFullDescription ? post.description : truncateText(post.description, 200)}
          </p>
          {post.description.length > 200 && (
            <button
              onClick={() => setShowFullDescription(!showFullDescription)}
              className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline mt-2"
            >
              {showFullDescription ? 'Read less' : 'Read more →'}
            </button>
          )}
        </div>

        {renderTags()}
        {renderUserInfo()}
        {renderEngagement()}
      </div>
    </div>
  );

  const renderMusicCard = () => (
    <div className={`rounded-xl overflow-hidden border-2 ${style.border} bg-gradient-to-br from-pink-50 to-rose-50 dark:from-gray-900 dark:to-gray-800 hover:shadow-2xl transition-all duration-300`}>
      <div className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${style.gradient} flex items-center justify-center`}>
            <span className="text-4xl">{style.icon}</span>
          </div>
          <div className="flex-1">
            <span className={`${style.badge} px-3 py-1 rounded-full text-xs font-semibold inline-block mb-1`}>
              {post.metadata?.musicType || 'Music'}
            </span>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{post.title}</h2>
            {post.metadata?.artist && (
              <p className="text-gray-600 dark:text-gray-400">by {post.metadata.artist}</p>
            )}
          </div>
        </div>

        <p className="text-gray-700 dark:text-gray-300 mb-4">{post.description}</p>
        {renderTags()}
        {renderUserInfo()}
        {renderEngagement()}
      </div>
    </div>
  );

  const renderWorkExchangeCard = () => (
    <div className={`rounded-xl overflow-hidden border-2 ${style.border} bg-white dark:bg-gray-800 hover:shadow-2xl transition-all duration-300`}>
      <div className={`bg-gradient-to-r ${style.gradient} p-6 text-white`}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-5xl">{style.icon}</span>
          <span className="text-sm bg-white/20 px-3 py-1 rounded-full backdrop-blur">
            Work Exchange
          </span>
        </div>
        <h2 className="text-2xl font-bold">{post.title}</h2>
      </div>

      <div className="p-6">
        <p className="text-gray-700 dark:text-gray-300 mb-4">{post.description}</p>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {post.metadata?.duration && (
            <div className="bg-green-50 dark:bg-gray-900 p-3 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400">Duration</p>
              <p className="font-semibold text-gray-900 dark:text-gray-100">{post.metadata.duration}</p>
            </div>
          )}
          {post.metadata?.workType && (
            <div className="bg-green-50 dark:bg-gray-900 p-3 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400">Type</p>
              <p className="font-semibold text-gray-900 dark:text-gray-100 capitalize">{post.metadata.workType}</p>
            </div>
          )}
        </div>

        {post.metadata?.offered && (
          <div className="bg-emerald-50 dark:bg-gray-900 p-4 rounded-lg mb-4 border-l-4 border-emerald-500">
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mb-1">WHAT'S OFFERED</p>
            <p className="text-gray-700 dark:text-gray-300">{post.metadata.offered}</p>
          </div>
        )}

        {renderTags()}
        {renderUserInfo()}
        {renderEngagement()}
      </div>
    </div>
  );

  const renderForumCard = () => (
    <div className={`rounded-xl overflow-hidden border-2 ${style.border} bg-white dark:bg-gray-800 hover:shadow-xl transition-all duration-300`}>
      <div className="p-6">
        <div className="flex items-start gap-3 mb-4">
          <span className="text-3xl">{style.icon}</span>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`${style.badge} px-3 py-1 rounded-full text-xs font-semibold`}>
                {post.metadata?.forumCategory || 'Discussion'}
              </span>
              {post.comments && post.comments.length > 5 && (
                <span className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200 px-2 py-1 rounded-full text-xs font-semibold">
                  🔥 Active
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{post.title}</h2>
          </div>
        </div>

        <p className="text-gray-700 dark:text-gray-300 mb-4">{post.description}</p>
        {renderTags()}
        {renderUserInfo()}
        {renderEngagement()}
      </div>
    </div>
  );

  const renderInsightCard = () => (
    <div className={`rounded-xl overflow-hidden border-2 ${style.border} bg-gradient-to-br from-violet-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 hover:shadow-xl transition-all duration-300`}>
      <div className="p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${style.gradient} flex items-center justify-center`}>
            <span className="text-2xl">{style.icon}</span>
          </div>
          <div className="flex-1">
            <span className={`${style.badge} px-3 py-1 rounded-full text-xs font-semibold inline-block mb-2`}>
              Local Insight
            </span>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{post.title}</h2>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4">
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{post.description}</p>
        </div>

        {renderTags()}
        {renderUserInfo()}
        {renderEngagement()}
      </div>
    </div>
  );

  const renderTags = () => {
    if (!post.tags || post.tags.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-2 mb-4">
        {post.tags.slice(0, 5).map((tag, i) => (
          <span key={i} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">
            #{tag}
          </span>
        ))}
      </div>
    );
  };

  const renderUserInfo = () => (
    <div className="flex items-center gap-3 mb-3 pt-3 border-t border-gray-200 dark:border-gray-700">
      <div className="relative">
        <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-bold">
          {post.userId.username?.charAt(0).toUpperCase() || '?'}
        </div>
        <div className="absolute -bottom-1 -right-1">
          <OnlineStatus userId={post.userId._id} />
        </div>
      </div>
      <div className="flex-1">
        <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{post.userId.username}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {post.cityId.name}, {post.cityId.country} • {new Date(post.createdAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );

  const renderEngagement = () => (
    <div className="flex items-center gap-4">
      <button
        onClick={() => onLike?.(post._id)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all ${
          isLiked
            ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300'
            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
        }`}
      >
        <span>{isLiked ? '❤️' : '🤍'}</span>
        <span className="font-semibold text-sm">{post.likes.length}</span>
      </button>
      <button
        onClick={() => onClick?.(post)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
      >
        <span>💬</span>
        <span className="font-semibold text-sm">{post.comments?.length || 0}</span>
      </button>
    </div>
  );

  // Render appropriate card based on type
  switch (post.type) {
    case 'recipe':
      return renderRecipeCard();
    case 'food':
      return renderFoodCard();
    case 'photo':
      return renderPhotoCard();
    case 'story':
      return renderStoryCard();
    case 'music':
      return renderMusicCard();
    case 'workExchange':
      return renderWorkExchangeCard();
    case 'forum':
      return renderForumCard();
    case 'insight':
      return renderInsightCard();
    default:
      return renderInsightCard();
  }
};

export default PostCard;
