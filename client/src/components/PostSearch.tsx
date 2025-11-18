import { useState } from 'react';
import api from '../lib/api';

interface Post {
  _id: string;
  title: string;
  description: string;
  type: string;
  userId: {
    name: string;
    country: string;
  };
  cityId: {
    name: string;
    country: string;
  };
  createdAt: string;
}

const PostSearch = () => {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('');
  const [results, setResults] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);

    try {
      const params = new URLSearchParams({ q: query });
      if (type) params.append('type', type);

      const response = await api.get(`/posts/search?${params}`);
      setResults(response.data);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const postTypes = [
    { value: '', label: 'All Types' },
    { value: 'insight', label: 'Local Insights' },
    { value: 'photo', label: 'Photos' },
    { value: 'food', label: 'Food & Culture' },
    { value: 'recipe', label: 'Recipes' },
    { value: 'story', label: 'Stories' },
    { value: 'music', label: 'Music' },
    { value: 'workExchange', label: 'Work Exchange' },
    { value: 'forum', label: 'Forum' }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Search Posts</h2>

      <form onSubmit={handleSearch} className="space-y-4">
        <div className="flex gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by keywords, tags, titles..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
          >
            {postTypes.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {loading ? '🔍 Searching...' : '🔍 Search'}
          </button>
        </div>
      </form>

      {/* Results */}
      {searched && (
        <div className="mt-6">
          {loading ? (
            <div className="text-center py-8 text-gray-600 dark:text-gray-400">Searching...</div>
          ) : results.length === 0 ? (
            <div className="text-center py-8 text-gray-600 dark:text-gray-400">
              No results found for "{query}"
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Found {results.length} result{results.length !== 1 ? 's' : ''}
              </p>
              {results.map((post) => (
                <div
                  key={post._id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      {post.title}
                    </h3>
                    <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-200 rounded text-xs">
                      {post.type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                    {post.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
                    <span>
                      By {post.userId.name} • {post.cityId.name}, {post.cityId.country}
                    </span>
                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PostSearch;
