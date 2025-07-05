module.exports = (app, Category) => {
  const express = require('express');
  const router = express.Router();

  // Create
  router.post('/admin/categories', async (req, res) => {
    try {
      const { name, description, is_active } = req.body;
      if (!name) return res.status(400).json({ error: 'Name is required' });
      const category = await Category.create({ name, description: description || null, is_active: is_active ?? true });
      res.status(201).json({ message: 'Category created', category });
    } catch (error) {
      console.error('Create category error:', error);
      const msg = error.name === 'SequelizeUniqueConstraintError' ? 'Category already exists' : 'Failed to create category';
      res.status(500).json({ error: msg });
    }
  });

  // Get All (public)
  router.get('/categories', async (req, res) => {
    try {
      const categories = await Category.findAll({ where: { is_active: true }, order: [['name', 'ASC']] });
      res.json(categories);
    } catch (error) {
      console.error('Fetch categories error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Get All (admin)
  router.get('/admin/categories', async (req, res) => {
    try {
      const categories = await Category.findAll({ order: [['name', 'ASC']] });
      res.json(categories);
    } catch (error) {
      console.error('Admin fetch error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Get One
  router.get('/admin/categories/:id', async (req, res) => {
    try {
      const category = await Category.findByPk(req.params.id);
      if (!category) return res.status(404).json({ error: 'Not found' });
      res.json(category);
    } catch (error) {
      console.error('Get category error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Update
  router.put('/admin/categories/:id', async (req, res) => {
    try {
      const category = await Category.findByPk(req.params.id);
      if (!category) return res.status(404).json({ error: 'Not found' });
      const { name, description, is_active } = req.body;
      if (!name) return res.status(400).json({ error: 'Name is required' });
      await category.update({ name, description: description || category.description, is_active });
      res.json({ message: 'Category updated', category });
    } catch (error) {
      console.error('Update category error:', error);
      res.status(500).json({ error: 'Failed to update category' });
    }
  });

  // Toggle
  router.patch('/admin/categories/:id/status', async (req, res) => {
    try {
      const { is_active } = req.body;
      if (typeof is_active !== 'boolean') return res.status(400).json({ error: 'Invalid status value' });
      const category = await Category.findByPk(req.params.id);
      if (!category) return res.status(404).json({ error: 'Not found' });
      await category.update({ is_active });
      res.json({ message: `Category ${is_active ? 'activated' : 'deactivated'}` });
    } catch (error) {
      console.error('Toggle category status error:', error);
      res.status(500).json({ error: 'Failed to update status' });
    }
  });

  // Soft Delete
  router.delete('/admin/categories/:id', async (req, res) => {
    try {
      const result = await Category.update({ is_active: false }, { where: { id: req.params.id } });
      if (result[0] === 0) return res.status(404).json({ error: 'Not found' });
      res.json({ message: 'Category deleted' });
    } catch (error) {
      console.error('Delete category error:', error);
      res.status(500).json({ error: 'Failed to delete category' });
    }
  });

  app.use('/api', router);
};
