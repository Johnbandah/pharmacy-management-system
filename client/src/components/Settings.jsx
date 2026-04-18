import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FaSave, FaUserPlus, FaTrash, FaEdit } from 'react-icons/fa';

function Settings({ token, user }) {
  const [users, setUsers] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [settings, setSettings] = useState({
    company_name: 'Pharmacy POS System',
    company_phone: '',
    company_email: '',
    company_address: '',
    tax_rate: 0,
    currency: 'MK',
    receipt_footer: 'Thank you for your purchase!'
  });
  const [userForm, setUserForm] = useState({
    username: '',
    password: '',
    role: 'staff'
  });

  useEffect(() => {
    fetchUsers();
    fetchSettings();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users');
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data) {
        setSettings(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch settings');
    }
  };

  const handleSettingsSave = async () => {
    try {
      await axios.post('http://localhost:5000/api/settings', settings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    }
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await axios.put(`http://localhost:5000/api/users/${editingUser.id}`, userForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('User updated');
      } else {
        await axios.post('http://localhost:5000/api/users', userForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('User created');
      }
      fetchUsers();
      setShowUserModal(false);
      setUserForm({ username: '', password: '', role: 'staff' });
      setEditingUser(null);
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await axios.delete(`http://localhost:5000/api/users/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('User deleted');
        fetchUsers();
      } catch (error) {
        toast.error('Delete failed');
      }
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      {/* System Settings */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">System Settings</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Company Name</label>
              <input
                type="text"
                value={settings.company_name}
                onChange={(e) => setSettings({...settings, company_name: e.target.value})}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Company Phone</label>
              <input
                type="text"
                value={settings.company_phone}
                onChange={(e) => setSettings({...settings, company_phone: e.target.value})}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Company Email</label>
              <input
                type="email"
                value={settings.company_email}
                onChange={(e) => setSettings({...settings, company_email: e.target.value})}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tax Rate (%)</label>
              <input
                type="number"
                step="0.01"
                value={settings.tax_rate}
                onChange={(e) => setSettings({...settings, tax_rate: parseFloat(e.target.value)})}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Company Address</label>
              <textarea
                value={settings.company_address}
                onChange={(e) => setSettings({...settings, company_address: e.target.value})}
                className="w-full px-3 py-2 border rounded"
                rows="2"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Receipt Footer Message</label>
              <input
                type="text"
                value={settings.receipt_footer}
                onChange={(e) => setSettings({...settings, receipt_footer: e.target.value})}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={handleSettingsSave}
              className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700"
            >
              <FaSave /> Save Settings
            </button>
          </div>
        </div>
      </div>

      {/* User Management */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">User Management</h2>
          <button
            onClick={() => setShowUserModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-green-700"
          >
            <FaUserPlus /> Add User
          </button>
        </div>
        <div className="p-6">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Username</th>
                <th className="px-4 py-2 text-left">Role</th>
                <th className="px-4 py-2 text-left">Created</th>
                <th className="px-4 py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-t">
                  <td className="px-4 py-2">{u.username}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 text-xs rounded ${u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-2">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-2 text-center">
                    {u.username !== 'admin' && (
                      <button onClick={() => handleDeleteUser(u.id)} className="text-red-600">
                        <FaTrash />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-xl font-bold mb-4">{editingUser ? 'Edit User' : 'Add New User'}</h2>
            <form onSubmit={handleUserSubmit}>
              <input
                type="text"
                placeholder="Username"
                value={userForm.username}
                onChange={(e) => setUserForm({...userForm, username: e.target.value})}
                className="w-full mb-3 px-3 py-2 border rounded"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={userForm.password}
                onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                className="w-full mb-3 px-3 py-2 border rounded"
                required={!editingUser}
              />
              <select
                value={userForm.role}
                onChange={(e) => setUserForm({...userForm, role: e.target.value})}
                className="w-full mb-4 px-3 py-2 border rounded"
              >
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded">Save</button>
                <button type="button" onClick={() => { setShowUserModal(false); setEditingUser(null); }} className="flex-1 bg-gray-300 py-2 rounded">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;