import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FaSearch, FaTrash, FaCreditCard, FaMoneyBill } from 'react-icons/fa';

function POS({ token }) {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');

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

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      if (existingItem.quantity >= product.quantity) {
        toast.error('Insufficient stock');
        return;
      }
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    toast.success('Added to cart');
  };

  const updateQuantity = (id, quantity) => {
    const product = products.find(p => p.id === id);
    if (quantity > product.quantity) {
      toast.error('Insufficient stock');
      return;
    }
    if (quantity === 0) {
      removeFromCart(id);
    } else {
      setCart(cart.map(item =>
        item.id === id ? { ...item, quantity } : item
      ));
    }
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.selling_price * item.quantity), 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    return subtotal + tax - discount;
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    const saleData = {
      customer_name: customerName || 'Walk-in Customer',
      customer_phone: customerPhone,
      items: cart.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        price: item.selling_price
      })),
      discount: parseFloat(discount),
      tax: parseFloat(tax),
      payment_method: paymentMethod
    };

    try {
      const response = await axios.post('http://localhost:5000/api/sales', saleData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Sale completed! Invoice: ${response.data.invoice_no}`);
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setDiscount(0);
      setTax(0);
      fetchProducts();
    } catch (error) {
      toast.error('Checkout failed');
    }
  };

  const filteredProducts = products.filter(product =>
    product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.barcode?.includes(searchTerm)
  );

  return (
    <div className="h-full flex">
      {/* Products Section */}
      <div className="w-2/3 p-4 overflow-auto">
        <div className="mb-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {filteredProducts.map(product => (
            <div
              key={product.id}
              onClick={() => addToCart(product)}
              className="bg-white p-4 rounded-lg shadow cursor-pointer hover:shadow-lg transition"
            >
              <h3 className="font-semibold">{product.name}</h3>
              <p className="text-sm text-gray-600">{product.generic_name}</p>
              <p className="text-lg font-bold text-green-600">MK{product.selling_price}</p>
              <p className="text-xs text-gray-500">Stock: {product.quantity}</p>
            </div>
          ))}
          {filteredProducts.length === 0 && (
            <div className="col-span-3 text-center py-8 text-gray-500">
              No products found. Add some products in Inventory first!
            </div>
          )}
        </div>
      </div>

      {/* Cart Section */}
      <div className="w-1/3 bg-white border-l p-4 flex flex-col">
        <h2 className="text-xl font-bold mb-4">Shopping Cart</h2>
        
        <div className="flex-1 overflow-auto">
          {cart.map(item => (
            <div key={item.id} className="border-b py-2">
              <div className="flex justify-between">
                <span className="font-semibold">{item.name}</span>
                <button onClick={() => removeFromCart(item.id)} className="text-red-500">
                  <FaTrash />
                </button>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span>MK{item.selling_price}</span>
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                  className="w-16 px-2 py-1 border rounded text-center"
                  min="1"
                />
                <span className="font-bold">MK{item.selling_price * item.quantity}</span>
              </div>
            </div>
          ))}
          {cart.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Cart is empty. Click on products to add.
            </div>
          )}
        </div>

        <div className="border-t pt-4 mt-4">
          <div className="mb-2">
            <input
              type="text"
              placeholder="Customer Name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-3 py-2 border rounded mb-2"
            />
            <input
              type="text"
              placeholder="Customer Phone"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>MK{calculateSubtotal().toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Discount:</span>
              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                className="w-24 px-2 py-1 border rounded"
              />
            </div>
            <div className="flex justify-between">
              <span>Tax:</span>
              <input
                type="number"
                value={tax}
                onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                className="w-24 px-2 py-1 border rounded"
              />
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span>MK{calculateTotal().toFixed(2)}</span>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex gap-2">
              <button
                onClick={() => setPaymentMethod('cash')}
                className={`flex-1 py-2 rounded ${paymentMethod === 'cash' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              >
                <FaMoneyBill className="inline mr-1" /> Cash
              </button>
              <button
                onClick={() => setPaymentMethod('card')}
                className={`flex-1 py-2 rounded ${paymentMethod === 'card' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              >
                <FaCreditCard className="inline mr-1" /> Card
              </button>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition"
            >
              Complete Sale
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default POS;