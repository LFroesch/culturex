import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

const CreatePost = () => {
  const navigate = useNavigate();
  const [cities, setCities] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    type: 'insight',
    cityId: '',
    title: '',
    description: '',
    tags: '',
    photos: [] as string[],
    metadata: {} as any
  });

  useEffect(() => {
    fetchCities();
  }, []);

  const fetchCities = async () => {
    try {
      const response = await api.get('/cities');
      setCities(response.data);
    } catch (error) {
      console.error('Failed to fetch cities:', error);
    }
  };

  const postTypes = [
    { value: 'insight', label: 'Local Insight' },
    { value: 'photo', label: 'Photo' },
    { value: 'food', label: 'Food & Culture' },
    { value: 'recipe', label: 'Recipe' },
    { value: 'story', label: 'Story' },
    { value: 'music', label: 'Music' },
    { value: 'workExchange', label: 'Work Exchange' },
    { value: 'forum', label: 'Forum Post' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/posts', {
        ...formData,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
      });
      alert('Post submitted for moderation!');
      navigate('/feed');
    } catch (error) {
      console.error('Failed to create post:', error);
      alert('Failed to create post');
    }
  };

  const renderMetadataFields = () => {
    switch (formData.type) {
      case 'recipe':
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Servings"
                value={formData.metadata.servings || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  metadata: { ...formData.metadata, servings: e.target.value }
                })}
                className="px-3 py-2 border border-gray-300 rounded-md"
              />
              <input
                type="text"
                placeholder="Prep Time"
                value={formData.metadata.prepTime || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  metadata: { ...formData.metadata, prepTime: e.target.value }
                })}
                className="px-3 py-2 border border-gray-300 rounded-md"
              />
              <input
                type="text"
                placeholder="Cook Time"
                value={formData.metadata.cookTime || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  metadata: { ...formData.metadata, cookTime: e.target.value }
                })}
                className="px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <textarea
              placeholder="Ingredients (one per line)"
              value={formData.metadata.ingredients?.join('\n') || ''}
              onChange={(e) => setFormData({
                ...formData,
                metadata: { ...formData.metadata, ingredients: e.target.value.split('\n') }
              })}
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            <textarea
              placeholder="Instructions (one per line)"
              value={formData.metadata.instructions?.join('\n') || ''}
              onChange={(e) => setFormData({
                ...formData,
                metadata: { ...formData.metadata, instructions: e.target.value.split('\n') }
              })}
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </>
        );

      case 'music':
        return (
          <>
            <input
              type="text"
              placeholder="Artist"
              value={formData.metadata.artist || ''}
              onChange={(e) => setFormData({
                ...formData,
                metadata: { ...formData.metadata, artist: e.target.value }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            <select
              value={formData.metadata.musicType || ''}
              onChange={(e) => setFormData({
                ...formData,
                metadata: { ...formData.metadata, musicType: e.target.value }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Select music type</option>
              <option value="folk">Folk</option>
              <option value="traditional">Traditional</option>
              <option value="local">Local</option>
              <option value="street">Street</option>
              <option value="other">Other</option>
            </select>
            <input
              type="text"
              placeholder="Audio Link (YouTube/SoundCloud)"
              value={formData.metadata.audioLink || ''}
              onChange={(e) => setFormData({
                ...formData,
                metadata: { ...formData.metadata, audioLink: e.target.value }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            <textarea
              placeholder="Lyrics (optional)"
              value={formData.metadata.lyrics || ''}
              onChange={(e) => setFormData({
                ...formData,
                metadata: { ...formData.metadata, lyrics: e.target.value }
              })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </>
        );

      case 'workExchange':
        return (
          <>
            <select
              value={formData.metadata.workType || ''}
              onChange={(e) => setFormData({
                ...formData,
                metadata: { ...formData.metadata, workType: e.target.value }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Select work type</option>
              <option value="farm">Farm</option>
              <option value="teaching">Teaching</option>
              <option value="hospitality">Hospitality</option>
              <option value="construction">Construction</option>
              <option value="creative">Creative</option>
              <option value="other">Other</option>
            </select>
            <input
              type="text"
              placeholder="Duration"
              value={formData.metadata.duration || ''}
              onChange={(e) => setFormData({
                ...formData,
                metadata: { ...formData.metadata, duration: e.target.value }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            <textarea
              placeholder="What's offered (accommodation, meals, etc.)"
              value={formData.metadata.offered || ''}
              onChange={(e) => setFormData({
                ...formData,
                metadata: { ...formData.metadata, offered: e.target.value }
              })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            <textarea
              placeholder="Requirements"
              value={formData.metadata.requirements || ''}
              onChange={(e) => setFormData({
                ...formData,
                metadata: { ...formData.metadata, requirements: e.target.value }
              })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </>
        );

      case 'photo':
        return (
          <select
            value={formData.metadata.photoCategory || ''}
            onChange={(e) => setFormData({
              ...formData,
              metadata: { ...formData.metadata, photoCategory: e.target.value }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">Select category</option>
            <option value="landscape">Landscape</option>
            <option value="people">People</option>
            <option value="architecture">Architecture</option>
            <option value="dailyLife">Daily Life</option>
            <option value="other">Other</option>
          </select>
        );

      case 'food':
        return (
          <>
            <select
              value={formData.metadata.foodType || ''}
              onChange={(e) => setFormData({
                ...formData,
                metadata: { ...formData.metadata, foodType: e.target.value }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Select food type</option>
              <option value="restaurant">Restaurant</option>
              <option value="streetFood">Street Food</option>
              <option value="tradition">Tradition</option>
              <option value="festival">Festival</option>
              <option value="other">Other</option>
            </select>
            <input
              type="text"
              placeholder="Location details"
              value={formData.metadata.locationDetails || ''}
              onChange={(e) => setFormData({
                ...formData,
                metadata: { ...formData.metadata, locationDetails: e.target.value }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </>
        );

      case 'story':
        return (
          <select
            value={formData.metadata.storyCategory || ''}
            onChange={(e) => setFormData({
              ...formData,
              metadata: { ...formData.metadata, storyCategory: e.target.value }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">Select story type</option>
            <option value="personal">Personal</option>
            <option value="legend">Legend</option>
            <option value="historical">Historical</option>
            <option value="other">Other</option>
          </select>
        );

      case 'forum':
        return (
          <select
            value={formData.metadata.forumCategory || ''}
            onChange={(e) => setFormData({
              ...formData,
              metadata: { ...formData.metadata, forumCategory: e.target.value }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">Select category</option>
            <option value="question">Question</option>
            <option value="discussion">Discussion</option>
            <option value="meetup">Meetup</option>
            <option value="announcement">Announcement</option>
            <option value="other">Other</option>
          </select>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Post</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Post Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value, metadata: {} })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            >
              {postTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
            <select
              value={formData.cityId}
              onChange={(e) => setFormData({ ...formData, cityId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            >
              <option value="">Select a city</option>
              {cities.map(city => (
                <option key={city._id} value={city._id}>{city.name}, {city.country}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          {renderMetadataFields()}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma-separated)</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="culture, food, travel"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded p-4">
            <p className="text-sm text-blue-800">
              📝 Your post will be submitted for moderation and will appear once approved.
            </p>
          </div>

          <div className="flex space-x-4">
            <button
              type="submit"
              className="flex-1 py-3 px-4 bg-primary-600 text-white rounded-md hover:bg-primary-700 font-medium"
            >
              Submit for Review
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-3 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePost;
