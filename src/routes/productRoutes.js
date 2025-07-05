module.exports = (app, Product, sequelize) => {
  const express = require('express');
  const router = express.Router();

  // Get all active products
  router.get('/products', async (req, res) => {
    try {
      const [products] = await sequelize.query('SELECT * FROM products WHERE is_active = true');
      const result = products.map(p => ({
        ...p,
        flavors: p.flavors_data ? JSON.parse(p.flavors_data) : []
      }));
      res.json(result);
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Get product by ID
  router.get('/products/:id', async (req, res) => {
    try {
      const id = req.params.id;
      const [product] = await sequelize.query('SELECT * FROM products WHERE id = ?', {
        replacements: [id]
      });

      if (!product.length) return res.status(404).json({ error: 'Product not found' });

      const p = product[0];
      res.json({
        ...p,
        flavors: p.flavors_data ? JSON.parse(p.flavors_data) : []
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Admin: get all products
  router.get('/admin/products', async (req, res) => {
    try {
      const products = await Product.findAll();
      const result = products.map(p => {
        const obj = p.toJSON();
        obj.flavors = obj.flavors_data ? JSON.parse(obj.flavors_data)?.flavours || [] : [];
        return obj;
      });
      res.json(result);
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Admin: get product by ID
  router.get('/admin/products/:id', async (req, res) => {
    try {
      const product = await Product.findByPk(req.params.id);
      if (!product) return res.status(404).json({ error: 'Product not found' });
      const obj = product.toJSON();
      obj.flavors = obj.flavors_data ? JSON.parse(obj.flavors_data)?.flavours || [] : [];
      delete obj.flavors_data;
      res.json(obj);
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Admin: create product
  router.post('/admin/products', async (req, res) => {
    try {
      const { name, brand, price } = req.body;
      if (!name || !brand || price === undefined) {
        return res.status(400).json({ error: 'name, brand, price are required' });
      }

      const product = await Product.create({
        ...req.body,
        price: parseFloat(price),
        stock: parseInt(req.body.stock || 0),
        is_active: true
      });

      const obj = product.toJSON();
      obj.flavors = obj.flavors_data ? JSON.parse(obj.flavors_data) : [];
      delete obj.flavors_data;
      res.status(201).json({ message: 'Product created', product: obj });
    } catch (error) {
      console.error('Create product error:', error);
      res.status(500).json({ error: 'Failed to create product' });
    }
  });

  // Admin: update product
  router.put('/admin/products/:id', async (req, res) => {
    try {
      const product = await Product.findByPk(req.params.id);
      if (!product) return res.status(404).json({ error: 'Product not found' });

      await product.update({
        ...product.toJSON(),
        ...req.body,
        price: parseFloat(req.body.price),
        stock: parseInt(req.body.stock),
        is_active: req.body.is_active !== undefined ? req.body.is_active : product.is_active
      });

      const obj = product.toJSON();
      obj.flavors = obj.flavors_data ? JSON.parse(obj.flavors_data)?.flavours || [] : [];
      delete obj.flavors_data;
      res.json({ message: 'Product updated', product: obj });
    } catch (error) {
      console.error('Update product error:', error);
      res.status(500).json({ error: 'Failed to update product' });
    }
  });

  // Admin: soft delete
  router.delete('/admin/products/:id', async (req, res) => {
    try {
      const result = await Product.update({ is_active: false }, { where: { id: req.params.id } });
      if (result[0] === 0) return res.status(404).json({ error: 'Not found' });
      res.json({ message: 'Product deleted' });
    } catch (error) {
      console.error('Delete product error:', error);
      res.status(500).json({ error: 'Failed to delete product' });
    }
  });

  // Admin: toggle status
  router.patch('/admin/products/:id/status', async (req, res) => {
    try {
      const { is_active } = req.body;
      if (typeof is_active !== 'boolean') return res.status(400).json({ error: 'Invalid status' });
      const product = await Product.findByPk(req.params.id);
      if (!product) return res.status(404).json({ error: 'Product not found' });

      await product.update({ is_active });
      res.json({ message: `Product ${is_active ? 'activated' : 'deactivated'}`, is_active });
    } catch (error) {
      console.error('Toggle status error:', error);
      res.status(500).json({ error: 'Failed to update product status' });
    }
  });

  app.use('/api', router);
};
