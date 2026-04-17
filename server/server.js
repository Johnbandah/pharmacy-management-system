// ============ USER MANAGEMENT (Admin only) ============

// Get all users
app.get('/api/users', auth, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
  db.all('SELECT id, username, role, created_at FROM users', (err, users) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(users);
  });
});

// Create new user
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

// Update user
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

// Delete user (prevent deleting admin)
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

// ============ REPORTS ============

// Sales Report by Date Range
app.get('/api/reports/sales', auth, (req, res) => {
  const { start_date, end_date } = req.query;
  let query = `
    SELECT 
      DATE(sale_date) as date,
      COUNT(*) as total_transactions,
      SUM(grand_total) as total_sales,
      SUM(discount) as total_discounts,
      SUM(tax) as total_tax,
      AVG(grand_total) as average_sale
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

// Top Selling Products Report
app.get('/api/reports/top-products', auth, (req, res) => {
  const { limit = 10, start_date, end_date } = req.query;
  let query = `
    SELECT 
      p.id,
      p.name,
      p.generic_name,
      SUM(si.quantity) as total_quantity_sold,
      SUM(si.total) as total_revenue
    FROM sale_items si
    JOIN products p ON si.product_id = p.id
    JOIN sales s ON si.sale_id = s.id
  `;
  
  if (start_date && end_date) {
    query += ` WHERE DATE(s.sale_date) BETWEEN '${start_date}' AND '${end_date}'`;
  }
  
  query += ` GROUP BY p.id, p.name ORDER BY total_quantity_sold DESC LIMIT ${limit}`;
  
  db.all(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Low Stock Report
app.get('/api/reports/low-stock', auth, (req, res) => {
  db.all('SELECT * FROM products WHERE quantity <= min_stock ORDER BY quantity ASC', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Expiring Products Report (next 30 days)
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

// Inventory Value Report
app.get('/api/reports/inventory-value', auth, (req, res) => {
  db.get(`
    SELECT 
      SUM(quantity * purchase_price) as total_purchase_value,
      SUM(quantity * selling_price) as total_selling_value,
      COUNT(*) as total_products,
      SUM(quantity) as total_stock_items
    FROM products
  `, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
});

// Daily Sales Summary
app.get('/api/reports/daily-summary', auth, (req, res) => {
  db.all(`
    SELECT 
      DATE(sale_date) as date,
      COUNT(*) as transactions,
      SUM(grand_total) as revenue,
      SUM(discount) as discounts,
      SUM(tax) as taxes,
      COUNT(DISTINCT customer_phone) as unique_customers
    FROM sales
    GROUP BY DATE(sale_date)
    ORDER BY date DESC
    LIMIT 30
  `, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Profit Report
app.get('/api/reports/profit', auth, (req, res) => {
  const { start_date, end_date } = req.query;
  let query = `
    SELECT 
      SUM(si.quantity * p.purchase_price) as total_cost,
      SUM(si.total) as total_revenue,
      SUM(si.total) - SUM(si.quantity * p.purchase_price) as total_profit
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