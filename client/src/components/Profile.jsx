import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FaSave, FaKey, FaUser } from 'react-icons/fa';

function Profile({ token, user }) {
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('New passwords do not match');
      return;
    }
    try {
      await axios.post('http://localhost:5000/api/change-password', {
        user_id: user.id,
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Password changed successfully');
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
      setIsChangingPassword(false);
    } catch (error) {
      toast.error('Failed to change password');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">My Profile</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Information */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <FaUser /> Profile Information
            </h2>
          </div>
          <div className="p-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <p className="text-lg font-semibold">{user?.username}</p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <p className="text-lg">
                <span className={`px-3 py-1 rounded-full text-sm ${user?.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                  {user?.role?.toUpperCase()}
                </span>
              </p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
              <p className="text-gray-600">{user?.id}</p>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <FaKey /> Change Password
            </h2>
          </div>
          <div className="p-6">
            {!isChangingPassword ? (
              <button
                onClick={() => setIsChangingPassword(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Change Password
              </button>
            ) : (
              <form onSubmit={handlePasswordChange}>
                <div className="mb-3">
                  <input
                    type="password"
                    placeholder="Current Password"
                    value={passwordData.current_password}
                    onChange={(e) => setPasswordData({...passwordData, current_password: e.target.value})}
                    className="w-full px-3 py-2 border rounded"
                    required
                  />
                </div>
                <div className="mb-3">
                  <input
                    type="password"
                    placeholder="New Password"
                    value={passwordData.new_password}
                    onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})}
                    className="w-full px-3 py-2 border rounded"
                    required
                  />
                </div>
                <div className="mb-4">
                  <input
                    type="password"
                    placeholder="Confirm New Password"
                    value={passwordData.confirm_password}
                    onChange={(e) => setPasswordData({...passwordData, confirm_password: e.target.value})}
                    className="w-full px-3 py-2 border rounded"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2">
                    <FaSave /> Save Password
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsChangingPassword(false)}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;