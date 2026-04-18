import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FaChartLine, FaBox, FaExclamationTriangle, FaCalendar, FaPrint, FaDownload } from 'react-icons/fa';

function Reports({ token }) {
  const [activeTab, setActiveTab] = useState('sales');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [salesReport, setSalesReport] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [expiringProducts, setExpiringProducts] = useState([]);
  const [inventoryValue, setInventoryValue] = useState({});
  const [profitReport, setProfitReport] = useState({});

  useEffect(() => {
    fetchSalesReport();
    fetchTopProducts();
    fetchLowStock();
    fetchExpiringProducts();
    fetchInventoryValue();
  }, []);

  const fetchSalesReport = async () => {
    try {
      let url = 'http://localhost:5000/api/reports/sales';
      if (dateRange.start && dateRange.end) {
        url += `?start_date=${dateRange.start}&end_date=${dateRange.end}`;
      }
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSalesReport(response.data);
    } catch (error) {
      toast.error('Failed to fetch sales report');
    }
  };

  const fetchTopProducts = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/reports/top-products?limit=10', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTopProducts(response.data);
    } catch (error) {
      toast.error('Failed to fetch top products');
    }
  };

  const fetchLowStock = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/reports/low-stock', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLowStock(response.data);
    } catch (error) {
      toast.error('Failed to fetch low stock report');
    }
  };

  const fetchExpiringProducts = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/reports/expiring-products', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setExpiringProducts(response.data);
    } catch (error) {
      toast.error('Failed to fetch expiring products');
    }
  };

  const fetchInventoryValue = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/reports/inventory-value', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInventoryValue(response.data);
    } catch (error) {
      toast.error('Failed to fetch inventory value');
    }
  };

  const fetchProfitReport = async () => {
    try {
      let url = 'http://localhost:5000/api/reports/profit';
      if (dateRange.start && dateRange.end) {
        url += `?start_date=${dateRange.start}&end_date=${dateRange.end}`;
      }
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfitReport(response.data);
    } catch (error) {
      toast.error('Failed to fetch profit report');
    }
  };

  const printReport = () => {
    window.print();
  };

  const exportToCSV = (data, filename) => {
    const headers = Object.keys(data[0] || {});
    const csv = [headers.join(','), ...data.map(row => headers.map(h => JSON.stringify(row[h])).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: 'sales', label: 'Sales Report', icon: FaChartLine },
    { id: 'products', label: 'Top Products', icon: FaBox },
    { id: 'stock', label: 'Low Stock', icon: FaExclamationTriangle },
    { id: 'expiring', label: 'Expiring', icon: FaCalendar },
    { id: 'profit', label: 'Profit Report', icon: FaChartLine }
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Reports</h1>
        <div className="flex gap-2">
          <button onClick={printReport} className="bg-gray-600 text-white px-3 py-2 rounded flex items-center gap-2">
            <FaPrint /> Print
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-6">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 flex items-center gap-2 ${activeTab === tab.id ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
            >
              <Icon /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Date Range Filter */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex gap-4 items-end">
          <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
              className="px-3 py-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
              className="px-3 py-2 border rounded"
            />
          </div>
          <button
            onClick={() => { fetchSalesReport(); fetchProfitReport(); }}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Apply Filter
          </button>
        </div>
      </div>

      {/* Sales Report Tab */}
      {activeTab === 'sales' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b flex justify-between">
            <h2 className="text-xl font-semibold">Sales Report</h2>
            <button onClick={() => exportToCSV(salesReport, 'sales_report')} className="text-green-600">
              <FaDownload /> Export CSV
            </button>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">Date</th>
                <th className="px-6 py-3 text-right">Transactions</th>
                <th className="px-6 py-3 text-right">Total Sales (MK)</th>
                <th className="px-6 py-3 text-right">Discounts (MK)</th>
                <th className="px-6 py-3 text-right">Tax (MK)</th>
                <th className="px-6 py-3 text-right">Average Sale (MK)</th>
              </tr>
            </thead>
            <tbody>
              {salesReport.map(row => (
                <tr key={row.date} className="border-t">
                  <td className="px-6 py-4">{row.date}</td>
                  <td className="px-6 py-4 text-right">{row.total_transactions}</td>
                  <td className="px-6 py-4 text-right">{parseFloat(row.total_sales).toFixed(2)}</td>
                  <td className="px-6 py-4 text-right">{parseFloat(row.total_discounts || 0).toFixed(2)}</td>
                  <td className="px-6 py-4 text-right">{parseFloat(row.total_tax || 0).toFixed(2)}</td>
                  <td className="px-6 py-4 text-right">{parseFloat(row.average_sale || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Top Products Tab */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold">Top Selling Products</h2>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">Product Name</th>
                <th className="px-6 py-3 text-left">Generic Name</th>
                <th className="px-6 py-3 text-right">Quantity Sold</th>
                <th className="px-6 py-3 text-right">Revenue (MK)</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map(product => (
                <tr key={product.id} className="border-t">
                  <td className="px-6 py-4">{product.name}</td>
                  <td className="px-6 py-4">{product.generic_name || '-'}</td>
                  <td className="px-6 py-4 text-right">{product.total_quantity_sold}</td>
                  <td className="px-6 py-4 text-right">{parseFloat(product.total_revenue).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Low Stock Tab */}
      {activeTab === 'stock' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold">Low Stock Products</h2>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">Product Name</th>
                <th className="px-6 py-3 text-right">Current Stock</th>
                <th className="px-6 py-3 text-right">Min Stock</th>
                <th className="px-6 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {lowStock.map(product => (
                <tr key={product.id} className="border-t">
                  <td className="px-6 py-4">{product.name}</td>
                  <td className="px-6 py-4 text-right text-red-600 font-bold">{product.quantity}</td>
                  <td className="px-6 py-4 text-right">{product.min_stock}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">Low Stock</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Expiring Products Tab */}
      {activeTab === 'expiring' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold">Products Expiring Soon</h2>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">Product Name</th>
                <th className="px-6 py-3 text-left">Expiry Date</th>
                <th className="px-6 py-3 text-right">Stock</th>
                <th className="px-6 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {expiringProducts.map(product => (
                <tr key={product.id} className="border-t">
                  <td className="px-6 py-4">{product.name}</td>
                  <td className="px-6 py-4 text-orange-600">{product.expiry_date}</td>
                  <td className="px-6 py-4 text-right">{product.quantity}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">Expiring Soon</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Profit Report Tab */}
      {activeTab === 'profit' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm mb-2">Total Revenue</h3>
            <p className="text-2xl font-bold text-green-600">MK{parseFloat(profitReport.total_revenue || 0).toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm mb-2">Total Cost</h3>
            <p className="text-2xl font-bold text-red-600">MK{parseFloat(profitReport.total_cost || 0).toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm mb-2">Total Profit</h3>
            <p className="text-2xl font-bold text-blue-600">MK{parseFloat(profitReport.total_profit || 0).toFixed(2)}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Reports;