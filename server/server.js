const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 5000;
const SECRET_KEY = 'your-secret-key-12345';

// Middleware
app.use(cors());
app.use(express.json());

// Database setup
const db = new sqlite3.Database('./pharmacy.db');

// Create tables
db.serialize(() => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT DEFAULT 'staff',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Products table
  db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    generic_name TEXT,
    category TEXT,
    manufacturer TEXT,
    barcode TEXT UNIQUE,
    purchase_price DECIMAL(10,2),
    selling_price DECIMAL(10,2),
    quantity INTEGER DEFAULT 0,
    min_stock INTEGER DEFAULT 10,
    expiry_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Sales table
  db.run(`CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_no TEXT UNIQUE,
    customer_name TEXT,
    customer_phone TEXT,
    total_amount DECIMAL(10,2),
    discount DECIMAL(10,2) DEFAULT 0,
    tax DECIMAL(10,2) DEFAULT 0,
    grand_total DECIMAL(10,2),
    payment_method TEXT,
    sale_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    user_id INTEGER
  )`);

  // Sale items table
  db.run(`CREATE TABLE IF NOT EXISTS sale_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER,
    product_id INTEGER,
    quantity INTEGER,
    price DECIMAL(10,2),
    total DECIMAL(10,2)
  )`);

  // Settings table
  db.run(`CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    company_name TEXT DEFAULT 'Pharmacy POS',
    company_phone TEXT,
    company_email TEXT,
    company_address TEXT,
    tax_rate DECIMAL(10,2) DEFAULT 0,
    currency TEXT DEFAULT 'MK',
    receipt_footer TEXT DEFAULT 'Thank you for your purchase!'
  )`);

  // Create admin user (if not exists)
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  db.run(`INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)`, 
    ['admin', hashedPassword, 'admin']);
});

// ============ AUTHENTICATION ============
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err || !user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    if (bcrypt.compareSync(password, user.password)) {
      const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, SECRET_KEY);
      res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
    } else {
      res.status(400).json({ error: 'Invalid credentials' });
    }
  });
});

// ============ AUTHENTICATION MIDDLEWARE ============
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid token' });
  }
};

// ============ PRODUCTS ============
app.get('/api/products', auth, (req, res) => {
  db.all('SELECT * FROM products ORDER BY id DESC', (err, products) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(products);
  });
});

app.post('/api/products', auth, (req, res) => {
  const { name, generic_name, category, manufacturer, barcode, purchase_price, selling_price, quantity, min_stock, expiry_date } = req.body;
  
  db.run(`INSERT INTO products (name, generic_name, category, manufacturer, barcode, purchase_price, selling_price, quantity, min_stock, expiry_date)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, generic_name, category, manufacturer, barcode, purchase_price, selling_price, quantity, min_stock, expiry_date],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, message: 'Product added successfully' });
    });
});

app.put('/api/products/:id', auth, (req, res) => {
  const { name, generic_name, category, manufacturer, barcode, purchase_price, selling_price, quantity, min_stock, expiry_date } = req.body;
  
  db.run(`UPDATE products SET name=?, generic_name=?, category=?, manufacturer=?, barcode=?, purchase_price=?, selling_price=?, quantity=?, min_stock=?, expiry_date=? WHERE id=?`,
    [name, generic_name, category, manufacturer, barcode, purchase_price, selling_price, quantity, min_stock, expiry_date, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Product updated successfully' });
    });
});

app.delete('/api/products/:id', auth, (req, res) => {
  db.run('DELETE FROM products WHERE id=?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Product deleted successfully' });
  });
});

// ============ SALES ============
app.post('/api/sales', auth, (req, res) => {
  const { customer_name, customer_phone, items, discount, tax, payment_method } = req.body;
  
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const grand_total = subtotal + (parseFloat(tax) || 0) - (parseFloat(discount) || 0);
  const invoice_no = 'INV-' + Date.now();
  
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    db.run(`INSERT INTO sales (invoice_no, customer_name, customer_phone, total_amount, discount, tax, grand_total, payment_method, user_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [invoice_no, customer_name || 'Walk-in Customer', customer_phone, subtotal, discount || 0, tax || 0, grand_total, payment_method, req.user.id],
      function(err) {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: err.message });
        }
        
        const saleId = this.lastID;
        let completed = 0;
        
        items.forEach(item => {
          db.run(`INSERT INTO sale_items (sale_id, product_id, quantity, price, total)
                  VALUES (?, ?, ?, ?, ?)`,
            [saleId, item.product_id, item.quantity, item.price, item.price * item.quantity],
            (err) => {
              if (err) {
                db.run('ROLLBACK');
                return res.status(500).json({ error: err.message });
              }
              
              db.run('UPDATE products SET quantity = quantity - ? WHERE id = ?', 
                [item.quantity, item.product_id], (err) => {
                  if (err) {
                    db.run('ROLLBACK');
                    return res.status(500).json({ error: err.message });
                  }
                  
                  completed++;
                  if (completed === items.length) {
                    db.run('COMMIT');
                    res.json({ invoice_no, sale_id: saleId, grand_total, message: 'Sale completed successfully' });
                  }
                });
            });
        });
      });
  });
});

app.get('/api/sales', auth, (req, res) => {
  db.all('SELECT * FROM sales ORDER BY sale_date DESC', (err, sales) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(sales);
  });
});

app.get('/api/sales/:id', auth, (req, res) => {
  db.get('SELECT * FROM sales WHERE id = ?', [req.params.id], (err, sale) => {
    if (err) return res.status(500).json({ error: err.message });
    db.all('SELECT * FROM sale_items WHERE sale_id = ?', [req.params.id], (err, items) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ ...sale, items });
    });
  });
});

// ============ DASHBOARD STATS ============
app.get('/api/dashboard/stats', auth, (req, res) => {
  const stats = {};
  
  db.get('SELECT COUNT(*) as total_products FROM products', (err, result) => {
    stats.total_products = result ? result.total_products : 0;
    
    db.get('SELECT COUNT(*) as low_stock FROM products WHERE quantity <= min_stock', (err, result) => {
      stats.low_stock = result ? result.low_stock : 0;
      
      db.get("SELECT COALESCE(SUM(grand_total), 0) as today_sales FROM sales WHERE DATE(sale_date) = DATE('now')", (err, result) => {
        stats.today_sales = result ? result.today_sales : 0;
        
        db.get('SELECT COALESCE(SUM(grand_total), 0) as total_sales FROM sales', (err, result) => {
          stats.total_sales = result ? result.total_sales : 0;
          res.json(stats);
        });
      });
    });
  });
});

// ============ USER MANAGEMENT ============
app.get('/api/users', auth, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
  db.all('SELECT id, username, role, created_at FROM users', (err, users) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(users);
  });
});

app.post('/api/users', auth, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
  const { username, password, role } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);
  db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
    [username, hashedPassword, role],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, message: 'User created successfully' });
    });
});

app.put('/api/users/:id', auth, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
  const { username, role } = req.body;
  db.run('UPDATE users SET username = ?, role = ? WHERE id = ?',
    [username, role, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'User updated successfully' });
    });
});

app.delete('/api/users/:id', auth, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
  db.get('SELECT username FROM users WHERE id = ?', [req.params.id], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (user && user.username === 'admin') {
      return res.status(400).json({ error: 'Cannot delete the main admin account' });
    }
    db.run('DELETE FROM users WHERE id = ?', [req.params.id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'User deleted successfully' });
    });
  });
});

// ============ SETTINGS ============
app.get('/api/settings', auth, (req, res) => {
  db.get('SELECT * FROM settings WHERE id = 1', (err, settings) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(settings || {});
  });
});

app.post('/api/settings', auth, (req, res) => {
  const { company_name, company_phone, company_email, company_address, tax_rate, currency, receipt_footer } = req.body;
  db.run(`INSERT OR REPLACE INTO settings (id, company_name, company_phone, company_email, company_address, tax_rate, currency, receipt_footer) 
          VALUES (1, ?, ?, ?, ?, ?, ?, ?)`,
    [company_name, company_phone, company_email, company_address, tax_rate, currency, receipt_footer],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Settings saved successfully' });
    });
});

// ============ CHANGE PASSWORD ============
app.post('/api/change-password', auth, (req, res) => {
  const { current_password, new_password } = req.body;
  const user_id = req.user.id;
  
  db.get('SELECT * FROM users WHERE id = ?', [user_id], (err, user) => {
    if (err || !user) return res.status(400).json({ error: 'User not found' });
    
    if (!bcrypt.compareSync(current_password, user.password)) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
    
    const hashedPassword = bcrypt.hashSync(new_password, 10);
    db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, user_id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Password changed successfully' });
    });
  });
});

// ============ REPORTS ============
app.get('/api/reports/sales', auth, (req, res) => {
  const { start_date, end_date } = req.query;
  let query = `
    SELECT 
      DATE(sale_date) as date,
      COUNT(*) as total_transactions,
      COALESCE(SUM(grand_total), 0) as total_sales,
      COALESCE(SUM(discount), 0) as total_discounts,
      COALESCE(SUM(tax), 0) as total_tax,
      COALESCE(AVG(grand_total), 0) as average_sale
    FROM sales
  `;
  
  if (start_date && end_date) {
    query += ` WHERE DATE(sale_date) BETWEEN '${start_date}' AND '${end_date}'`;
  }
  
  query += ` GROUP BY DATE(sale_date) ORDER BY date DESC`;
  
  db.all(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.get('/api/reports/top-products', auth, (req, res) => {
  const { limit = 10 } = req.query;
  const query = `
    SELECT 
      p.id,
      p.name,
      p.generic_name,
      COALESCE(SUM(si.quantity), 0) as total_quantity_sold,
      COALESCE(SUM(si.total), 0) as total_revenue
    FROM sale_items si
    JOIN products p ON si.product_id = p.id
    JOIN sales s ON si.sale_id = s.id
    GROUP BY p.id, p.name
    ORDER BY total_quantity_sold DESC
    LIMIT ${limit}
  `;
  
  db.all(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.get('/api/reports/low-stock', auth, (req, res) => {
  db.all('SELECT * FROM products WHERE quantity <= min_stock ORDER BY quantity ASC', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.get('/api/reports/expiring-products', auth, (req, res) => {
  db.all(`
    SELECT * FROM products 
    WHERE expiry_date IS NOT NULL 
    AND DATE(expiry_date) BETWEEN DATE('now') AND DATE('now', '+30 days')
    ORDER BY expiry_date ASC
  `, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.get('/api/reports/inventory-value', auth, (req, res) => {
  db.get(`
    SELECT 
      COALESCE(SUM(quantity * purchase_price), 0) as total_purchase_value,
      COALESCE(SUM(quantity * selling_price), 0) as total_selling_value,
      COUNT(*) as total_products,
      COALESCE(SUM(quantity), 0) as total_stock_items
    FROM products
  `, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
});

app.get('/api/reports/profit', auth, (req, res) => {
  const { start_date, end_date } = req.query;
  let query = `
    SELECT 
      COALESCE(SUM(si.quantity * p.purchase_price), 0) as total_cost,
      COALESCE(SUM(si.total), 0) as total_revenue,
      COALESCE(SUM(si.total) - SUM(si.quantity * p.purchase_price), 0) as total_profit
    FROM sale_items si
    JOIN products p ON si.product_id = p.id
    JOIN sales s ON si.sale_id = s.id
  `;
  
  if (start_date && end_date) {
    query += ` WHERE DATE(s.sale_date) BETWEEN '${start_date}' AND '${end_date}'`;
  }
  
  db.get(query, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result || { total_cost: 0, total_revenue: 0, total_profit: 0 });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📊 API available at http://localhost:${PORT}/api`);
});