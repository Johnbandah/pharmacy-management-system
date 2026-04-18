import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Dashboard({ token }) {
  const [stats, setStats] = useState({
    total_products: 0,
    low_stock: 0,
    today_sales: 0,
    total_sales: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/dashboard/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-gray-500 text-sm mb-2">Total Products</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.total_products}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-gray-500 text-sm mb-2">Low Stock Items</h3>
          <p className="text-3xl font-bold text-red-600">{stats.low_stock}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-gray-500 text-sm mb-2">Today's Sales</h3>
          <p className="text-3xl font-bold text-green-600">MK{stats.today_sales}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-gray-500 text-sm mb-2">Total Sales</h3>
          <p className="text-3xl font-bold text-purple-600">MK{stats.total_sales}</p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;