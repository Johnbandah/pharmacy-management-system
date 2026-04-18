import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaCashRegister, FaBoxes, FaHistory, FaSignOutAlt, FaCog, FaUserCircle, FaUsers, FaChartBar } from 'react-icons/fa';

function Sidebar({ user, setToken }) {
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
  };

  const menuItems = [
    { path: '/', icon: FaHome, label: 'Dashboard' },
    { path: '/pos', icon: FaCashRegister, label: 'POS' },
    { path: '/inventory', icon: FaBoxes, label: 'Inventory' },
    { path: '/sales', icon: FaHistory, label: 'Sales History' },
    { path: '/profile', icon: FaUserCircle, label: 'My Profile' },
    { path: '/settings', icon: FaCog, label: 'Settings' },
    { path: '/users', icon: FaUsers, label: 'User Management' },    // ADD THIS
    { path: '/reports', icon: FaChartBar, label: 'Reports' },       // ADD THIS
  ];

  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold">Pharmacy POS</h1>
        <p className="text-sm text-gray-400 mt-1">{user?.username}</p>
        <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
      </div>
      
      <nav className="flex-1 p-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path}>
              <div className={`flex items-center p-3 mb-2 rounded-lg transition cursor-pointer ${isActive ? 'bg-blue-600' : 'hover:bg-gray-800'}`}>
                <Icon className="mr-3" />
                <span>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="flex items-center w-full p-3 rounded-lg hover:bg-red-600 transition"
        >
          <FaSignOutAlt className="mr-3" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

export default Sidebar;