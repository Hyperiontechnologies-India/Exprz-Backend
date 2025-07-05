module.exports = (app, Category) => {

  const express = require('express');
  const router = express.Router();

  // Create Category
  router.post('/admin/categories', async (req, res) => {
    try {
      if (!req.body.name) {
        return res.status(400).json({ error: 'Name is a required field' });
      }

      const category = await Category.create({
        name: req.body.name,
        description: req.body.description || null,
        is_active: req.body.is_active !== undefined ? req.body.is_active : true
      });

      res.status(201).json({ message: 'Category created successfully', category });
    } catch (error) {
      console.error('Create category error:', error);
      let msg = 'Failed to create category';
      if (error.name === 'SequelizeUniqueConstraintError') {
        msg = 'Category with this name already exists';
      }
      res.status(500).json({ error: msg });
    }
  });

  // Get all active categories (public)
  router.get('/categories', async (req, res) => {
    try {
      const categories = await Category.findAll({
        where: { is_active: true },
        order: [['name', 'ASC']]
      });
      res.json(categories);
    } catch (error) {
      console.error('Fetch public categories error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Get all categories (admin)
  router.get('/admin/categories', async (req, res) => {
    try {
      const categories = await Category.findAll({ order: [['name', 'ASC']] });
      res.json(categories);
    } catch (error) {
      console.error('Fetch admin categories error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Get single category
  router.get('/admin/categories/:id', async (req, res) => {
    try {
      const category = await Category.findByPk(req.params.id);
      if (!category) return res.status(404).json({ error: 'Category not found' });
      res.json(category);
    } catch (error) {
      console.error('Fetch category error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Update Category
  router.put('/admin/categories/:id', async (req, res) => {
    try {
      if (!req.body.name) {
        return res.status(400).json({ error: 'Name is a required field' });
      }

      const category = await Category.findByPk(req.params.id);
      if (!category) return res.status(404).json({ error: 'Category not found' });

      await category.update({
        name: req.body.name,
        description: req.body.description || category.description,
        is_active: req.body.is_active !== undefined ? req.body.is_active : category.is_active
      });

      res.json({ message: 'Category updated successfully', category });
    } catch (error) {
      console.error('Update category error:', error);
      let msg = 'Failed to update category';
      if (error.name === 'SequelizeUniqueConstraintError') {
        msg = 'Category with this name already exists';
      }
      res.status(500).json({ error: msg });
    }
  });

  // Toggle category status
  router.patch('/admin/categories/:id/status', async (req, res) => {
    try {
      const { is_active } = req.body;
      if (typeof is_active !== 'boolean') {
        return res.status(400).json({ error: 'Invalid status value' });
      }

      const category = await Category.findByPk(req.params.id);
      if (!category) return res.status(404).json({ error: 'Category not found' });

      await category.update({ is_active });
      res.json({ message: `Category ${is_active ? 'activated' : 'deactivated'} successfully`, is_active });
    } catch (error) {
      console.error('Toggle category status error:', error);
      res.status(500).json({ error: 'Failed to update category status' });
    }
  });

  // Soft delete category
  router.delete('/admin/categories/:id', async (req, res) => {
    try {
      const result = await Category.update({ is_active: false }, { where: { id: req.params.id } });
      if (result[0] === 0) return res.status(404).json({ error: 'Category not found' });
      res.json({ message: 'Category deleted successfully' });
    } catch (error) {
      console.error('Delete category error:', error);
      res.status(500).json({ error: 'Failed to delete category' });
    }
  });

  app.use('/api', router);
};
