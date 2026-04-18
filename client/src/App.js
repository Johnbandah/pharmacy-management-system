import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import POS from './components/POS';
import Inventory from './components/Inventory';
import SalesHistory from './components/SalesHistory';
import Profile from './components/Profile';
import Settings from './components/Settings';
import UserManagement from './components/UserManagement';
import Reports from './components/Reports';
import Sidebar from './components/Sidebar';
import { Toaster } from 'react-hot-toast';
import './App.css';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (token) {
      const userData = JSON.parse(localStorage.getItem('user'));
      setUser(userData);
    }
  }, [token]);

  if (!token) {
    return <Login setToken={setToken} setUser={setUser} />;
  }

  return (
    <Router>
      <div className="flex h-screen bg-gray-100">
        <Sidebar user={user} setToken={setToken} />
        <div className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard token={token} />} />
            <Route path="/pos" element={<POS token={token} />} />
            <Route path="/inventory" element={<Inventory token={token} />} />
            <Route path="/sales" element={<SalesHistory token={token} />} />
            <Route path="/profile" element={<Profile token={token} user={user} />} />
            <Route path="/settings" element={<Settings token={token} user={user} />} />
            {/* ADD THESE TWO NEW ROUTES HERE */}
            <Route path="/users" element={<UserManagement token={token} currentUser={user} />} />
            <Route path="/reports" element={<Reports token={token} />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </div>
      <Toaster position="top-right" />
    </Router>
  );
}

export default App;