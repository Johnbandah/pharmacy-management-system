import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';

function Inventory({ token }) {
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    generic_name: '',
    category: '',
    manufacturer: '',
    barcode: '',
    purchase_price: '',
    selling_price: '',
    quantity: '',
    min_stock: '',
    expiry_date: ''
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/products', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(response.data);
    } catch (error) {
      toast.error('Failed to fetch products');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await axios.put(`http://localhost:5000/api/products/${editingProduct.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Product updated');
      } else {
        await axios.post('http://localhost:5000/api/products', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Product added');
      }
      fetchProducts();
      setShowModal(false);
      resetForm();
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await axios.delete(`http://localhost:5000/api/products/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Product deleted');
        fetchProducts();
      } catch (error) {
        toast.error('Delete failed');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      generic_name: '',
      category: '',
      manufacturer: '',
      barcode: '',
      purchase_price: '',
      selling_price: '',
      quantity: '',
      min_stock: '',
      expiry_date: ''
    });
    setEditingProduct(null);
  };

  const editProduct = (product) => {
    setEditingProduct(product);
    setFormData(product);
    setShowModal(true);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-bold">Inventory Management</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
        >
          <FaPlus /> Add Product
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Generic Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map(product => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">{product.name}</td>
                  <td className="px-6 py-4">{product.generic_name || '-'}</td>
                  <td className="px-6 py-4">{product.category || '-'}</td>
                  <td className="px-6 py-4 text-right">MK{product.selling_price}</td>
                  <td className={`px-6 py-4 text-right ${product.quantity <= product.min_stock ? 'text-red-600 font-bold' : ''}`}>
                    {product.quantity}
                  </td>
                  <td className="px-6 py-4">{product.expiry_date || '-'}</td>
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => editProduct(product)} className="text-blue-600 hover:text-blue-900 mr-3">
                      <FaEdit />
                    </button>
                    <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-900">
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-auto">
            <h2 className="text-xl font-bold mb-4">{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
            <form onSubmit={handleSubmit}>
              <input type="text" placeholder="Product Name *" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full mb-2 px-3 py-2 border rounded" required />
              <input type="text" placeholder="Generic Name" value={formData.generic_name} onChange={e => setFormData({...formData, generic_name: e.target.value})} className="w-full mb-2 px-3 py-2 border rounded" />
              <input type="text" placeholder="Category" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full mb-2 px-3 py-2 border rounded" />
              <input type="text" placeholder="Manufacturer" value={formData.manufacturer} onChange={e => setFormData({...formData, manufacturer: e.target.value})} className="w-full mb-2 px-3 py-2 border rounded" />
              <input type="text" placeholder="Barcode" value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})} className="w-full mb-2 px-3 py-2 border rounded" />
              <input type="number" step="0.01" placeholder="Purchase Price" value={formData.purchase_price} onChange={e => setFormData({...formData, purchase_price: e.target.value})} className="w-full mb-2 px-3 py-2 border rounded" />
              <input type="number" step="0.01" placeholder="Selling Price *" value={formData.selling_price} onChange={e => setFormData({...formData, selling_price: e.target.value})} className="w-full mb-2 px-3 py-2 border rounded" required />
              <input type="number" placeholder="Quantity *" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} className="w-full mb-2 px-3 py-2 border rounded" required />
              <input type="number" placeholder="Minimum Stock *" value={formData.min_stock} onChange={e => setFormData({...formData, min_stock: e.target.value})} className="w-full mb-2 px-3 py-2 border rounded" required />
              <input type="date" placeholder="Expiry Date" value={formData.expiry_date} onChange={e => setFormData({...formData, expiry_date: e.target.value})} className="w-full mb-4 px-3 py-2 border rounded" />
              
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

export default Inventory;