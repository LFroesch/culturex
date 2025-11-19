import { useState } from 'react';
import { useAuthStore } from '../store/authStore';

const Profile = () => {
  const { user, updateProfile } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    languages: user?.profile?.languages?.join(', ') || '',
    interests: user?.profile?.interests?.join(', ') || '',
    bio: user?.profile?.bio || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile({
        username: formData.username,
        profile: {
          bio: formData.bio,
          languages: formData.languages.split(',').map(l => l.trim()).filter(Boolean),
          interests: formData.interests.split(',').map(i => i.trim()).filter(Boolean)
        }
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-primary-500 to-primary-700 h-32"></div>

        <div className="px-6 pb-6">
          <div className="flex items-end -mt-12 mb-4">
            <div className="w-24 h-24 bg-white rounded-full border-4 border-white flex items-center justify-center text-4xl font-bold text-primary-600 shadow-lg">
              {user.username?.charAt(0).toUpperCase() || '?'}
            </div>
            <div className="ml-4 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{user.username}</h1>
              <p className="text-gray-600">{user.email}</p>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="ml-auto mb-2 px-4 py-2 text-sm font-medium text-primary-600 border border-primary-600 rounded-md hover:bg-primary-50 transition-colors"
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>

          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-4 mt-6">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Languages (comma separated)</label>
                  <input
                    type="text"
                    value={formData.languages}
                    onChange={(e) => setFormData({ ...formData, languages: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Languages to Learn</label>
                  <input
                    type="text"
                    value={formData.languagesToLearn}
                    onChange={(e) => setFormData({ ...formData, languagesToLearn: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Interests</label>
                  <input
                    type="text"
                    value={formData.interests}
                    onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
              >
                Save Changes
              </button>
            </form>
          ) : (
            <div className="space-y-6 mt-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Bio</h3>
                <p className="text-gray-900">{user.bio || 'No bio yet'}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Languages I Speak</h3>
                  <div className="flex flex-wrap gap-2">
                    {user.languages.map((lang, idx) => (
                      <span key={idx} className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Languages I Want to Learn</h3>
                  <div className="flex flex-wrap gap-2">
                    {user.languagesToLearn.length > 0 ? (
                      user.languagesToLearn.map((lang, idx) => (
                        <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                          {lang}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500 text-sm">No languages specified</span>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Interests</h3>
                  <div className="flex flex-wrap gap-2">
                    {user.interests.length > 0 ? (
                      user.interests.map((interest, idx) => (
                        <span key={idx} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                          {interest}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500 text-sm">No interests specified</span>
                    )}
                  </div>
                </div>

                {user.age && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Age</h3>
                    <p className="text-gray-900">{user.age} years old</p>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Email</h3>
                <p className="text-gray-900">{user.email}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Member Since</h3>
                <p className="text-gray-900">{new Date(user.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
