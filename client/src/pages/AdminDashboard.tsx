import { useState, useEffect } from 'react';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { useConfirm } from '../hooks/useConfirm';

const AdminDashboard = () => {
  const { user } = useAuthStore();
  const { confirm, ConfirmDialog } = useConfirm();
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchData();
    }
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, citiesRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users?limit=100'),
        api.get('/cities')
      ]);

      setStats(statsRes.data);
      setUsers(usersRes.data.users);
      setCities(citiesRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      alert('Role updated successfully');
      fetchData();
    } catch (error) {
      console.error('Failed to update role:', error);
      alert('Failed to update role');
    }
  };

  const handleAssignModerator = async () => {
    if (!selectedUser || !selectedCity) {
      alert('Please select both user and city');
      return;
    }

    try {
      await api.post('/admin/moderators', {
        userId: selectedUser,
        cityId: selectedCity
      });
      alert('Moderator assigned successfully');
      setSelectedUser('');
      setSelectedCity('');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to assign moderator');
    }
  };

  const handleResetCities = async () => {
    const confirmed = await confirm({
      title: 'Reset Cities',
      message: 'Are you sure you want to delete all cities and re-seed? This cannot be undone.',
      confirmText: 'Reset',
      cancelText: 'Cancel',
      variant: 'danger'
    });

    if (!confirmed) return;

    try {
      await api.post('/admin/reset-cities');
      alert('Cities reset successfully');
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to reset cities');
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Admin access required</p>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <ConfirmDialog />
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Users</h3>
          <p className="text-3xl font-bold text-primary-600">{stats?.users.total}</p>
          <p className="text-sm text-gray-500 mt-2">
            {stats?.users.moderators} moderators, {stats?.users.admins} admins
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Posts</h3>
          <p className="text-3xl font-bold text-green-600">{stats?.posts.total}</p>
          <p className="text-sm text-gray-500 mt-2">
            {stats?.posts.pending} pending, {stats?.posts.flagged} flagged
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Cities</h3>
          <p className="text-3xl font-bold text-blue-600">{stats?.cities.total}</p>
          <p className="text-sm text-gray-500 mt-2">
            {stats?.cities.withContent} with content
          </p>
          <button
            onClick={handleResetCities}
            className="mt-4 w-full px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
          >
            Reset Cities
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Connections</h3>
          <p className="text-3xl font-bold text-purple-600">{stats?.connections}</p>
          <p className="text-sm text-gray-500 mt-2">Active friendships</p>
        </div>
      </div>

      {/* Assign Moderators */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Assign Moderator to City</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">Select User</option>
            {users
              .filter(u => u.role === 'moderator' || u.role === 'admin')
              .map(u => (
                <option key={u._id} value={u._id}>
                  {u.username} ({u.role})
                </option>
              ))}
          </select>

          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">Select City</option>
            {cities.map(c => (
              <option key={c._id} value={c._id}>
                {c.name}, {c.country}
              </option>
            ))}
          </select>

          <button
            onClick={handleAssignModerator}
            className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Assign
          </button>
        </div>
      </div>

      {/* User Management */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">User Management</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((u) => (
                <tr key={u._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {u.username}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {u.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u._id, e.target.value)}
                      className="text-sm border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="user">User</option>
                      <option value="moderator">Moderator</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={async () => {
                        const confirmed = await confirm({
                          title: 'Delete User',
                          message: `Are you sure you want to delete user ${u.name}? This action cannot be undone.`,
                          confirmText: 'Delete',
                          cancelText: 'Cancel',
                          variant: 'danger'
                        });

                        if (confirmed) {
                          api.put(`/admin/users/${u._id}/ban`, { banned: true });
                          fetchData();
                        }
                      }}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
