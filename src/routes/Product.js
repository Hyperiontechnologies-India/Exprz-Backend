module.exports = (app, Product, sequelize) => {
  const express = require('express');
  const router = express.Router();

  // Create Product
  router.post('/admin/products', async (req, res) => {
    try {
      const { name, brand, price, ...rest } = req.body;
      if (!name || !brand || price === undefined) {
        return res.status(400).json({ error: 'Name, brand, and price are required' });
      }

      const product = await Product.create({
        name,
        brand,
        price: parseFloat(price),
        stock: parseInt(rest.stock) || 0,
        flavors_data: rest.flavors_data || [],
        nicotine_level: rest.nicotine_level || null,
        description: rest.description || null,
        image_base64: rest.image_base64 || null,
        category: rest.category || null,
        product_group: rest.product_group || null,
        is_active: true
      });

      const productData = product.toJSON();
      productData.flavors = productData.flavors_data ? JSON.parse(productData.flavors_data) : [];
      delete productData.flavors_data;

      res.status(201).json({ message: 'Product created', product: productData });
    } catch (error) {
      console.error('Create product error:', error);
      res.status(500).json({ error: 'Failed to create product' });
    }
  });

  // Get All Products (Public)
  router.get('/products', async (req, res) => {
    try {
      const [products] = await sequelize.query('SELECT * FROM products WHERE is_active = true');
      const parsed = products.map(p => ({ ...p, flavors: p.flavors_data ? JSON.parse(p.flavors_data) : [] }));
      res.json(parsed);
    } catch (error) {
      console.error('Fetch products error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Get Product by ID (Public)
  router.get('/products/:id', async (req, res) => {
    try {
      const [product] = await sequelize.query('SELECT * FROM products WHERE id = ?', {
        replacements: [req.params.id]
      });
      if (!product || product.length === 0) return res.status(404).json({ error: 'Product not found' });
      res.json({ ...product[0], flavors: product[0].flavors_data ? JSON.parse(product[0].flavors_data) : [] });
    } catch (error) {
      console.error('Fetch product error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Admin Get All Products
  router.get('/admin/products', async (req, res) => {
    try {
      const products = await Product.findAll();
      const result = products.map(p => {
        const data = p.toJSON();
        data.flavors = data.flavors_data ? JSON.parse(data.flavors_data).flavours || [] : [];
        return data;
      });
      res.json(result);
    } catch (error) {
      console.error('Admin fetch error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Admin Get Product by ID
  router.get('/admin/products/:id', async (req, res) => {
    try {
      const product = await Product.findByPk(req.params.id);
      if (!product) return res.status(404).json({ error: 'Product not found' });
      const data = product.toJSON();
      data.flavors = data.flavors_data ? JSON.parse(data.flavors_data).flavours || [] : [];
      delete data.flavors_data;
      res.json(data);
    } catch (error) {
      console.error('Admin get product error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Update Product
  router.put('/admin/products/:id', async (req, res) => {
    try {
      const product = await Product.findByPk(req.params.id);
      if (!product) return res.status(404).json({ error: 'Product not found' });

      const { name, brand, price } = req.body;
      if (!name || !brand || price === undefined) {
        return res.status(400).json({ error: 'Name, brand, and price are required' });
      }

      await product.update({ ...req.body });
      const data = product.toJSON();
      data.flavors = data.flavors_data ? JSON.parse(data.flavors_data).flavours || [] : [];
      delete data.flavors_data;
      res.json({ message: 'Updated successfully', product: data });
    } catch (error) {
      console.error('Update product error:', error);
      res.status(500).json({ error: 'Failed to update product' });
    }
  });

  // Delete Product (Soft)
  router.delete('/admin/products/:id', async (req, res) => {
    try {
      const result = await Product.update({ is_active: false }, { where: { id: req.params.id } });
      if (result[0] === 0) return res.status(404).json({ error: 'Product not found' });
      res.json({ message: 'Product deleted' });
    } catch (error) {
      console.error('Delete product error:', error);
      res.status(500).json({ error: 'Failed to delete product' });
    }
  });

  // Toggle Status
  router.patch('/admin/products/:id/status', async (req, res) => {
    try {
      const { is_active } = req.body;
      if (typeof is_active !== 'boolean') return res.status(400).json({ error: 'Invalid status value' });

      const product = await Product.findByPk(req.params.id);
      if (!product) return res.status(404).json({ error: 'Product not found' });

      await product.update({ is_active });
      res.json({ message: `Product ${is_active ? 'activated' : 'deactivated'}`, is_active });
    } catch (error) {
      console.error('Toggle status error:', error);
      res.status(500).json({ error: 'Failed to update status' });
    }
  });

  app.use('/api', router);
};
