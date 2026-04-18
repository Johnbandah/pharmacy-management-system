import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FaEdit, FaTrash, FaUserPlus, FaTimes } from 'react-icons/fa';

function UserManagement({ token, currentUser }) {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'staff'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (error) {
      toast.error('Failed to fetch users');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await axios.put(`http://localhost:5000/api/users/${editingUser.id}`, {
          username: formData.username,
          role: formData.role
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('User updated');
      } else {
        await axios.post('http://localhost:5000/api/users', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('User created');
      }
      fetchUsers();
      setShowModal(false);
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Operation failed');
    }
  };

  const handleDelete = async (id, username) => {
    if (username === 'admin') {
      toast.error('Cannot delete the main admin account');
      return;
    }
    if (window.confirm(`Delete user "${username}"?`)) {
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

  const resetForm = () => {
    setFormData({ username: '', password: '', role: 'staff' });
    setEditingUser(null);
  };

  const editUser = (user) => {
    setEditingUser(user);
    setFormData({ username: user.username, password: '', role: user.role });
    setShowModal(true);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">User Management</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <FaUserPlus /> Add User
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">Username</th>
              <th className="px-6 py-3 text-left">Role</th>
              <th className="px-6 py-3 text-left">Created Date</th>
              <th className="px-6 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  {user.username}
                  {user.username === currentUser?.username && (
                    <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">You</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4">{new Date(user.created_at).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-center">
                  <button onClick={() => editUser(user)} className="text-blue-600 mr-3">
                    <FaEdit />
                  </button>
                  <button onClick={() => handleDelete(user.id, user.username)} className="text-red-600">
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{editingUser ? 'Edit User' : 'Add New User'}</h2>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="text-gray-500">
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Username"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                className="w-full mb-3 px-3 py-2 border rounded"
                required
              />
              {!editingUser && (
                <input
                  type="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full mb-3 px-3 py-2 border rounded"
                  required
                />
              )}
              <select
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                className="w-full mb-4 px-3 py-2 border rounded"
              >
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded">Save</button>
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="flex-1 bg-gray-300 py-2 rounded">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagement;