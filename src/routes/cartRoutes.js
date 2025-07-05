module.exports = (app, Cart, Product) => {
  const express = require('express');
  const router = express.Router();

  // Define association
  Cart.belongsTo(Product, { foreignKey: 'productid', as: 'product' });

  // Add item to cart
  router.post('/cart', async (req, res) => {
    try {
      const { productid, userid, email, quantity, flavour } = req.body;
      if (!productid || !userid || !email) {
        return res.status(400).json({ error: 'productid, userid, and email are required' });
      }

      const product = await Product.findByPk(productid);
      if (!product) return res.status(404).json({ error: 'Product not found' });

      const existingItem = await Cart.findOne({
        where: {
          userid,
          productid,
          flavour: flavour || null
        }
      });

      let cartItem;
      if (existingItem) {
        const newQuantity = existingItem.quantity + (quantity || 1);
        cartItem = await existingItem.update({ quantity: newQuantity });
      } else {
        cartItem = await Cart.create({
          productid,
          userid,
          email,
          quantity: quantity || 1,
          flavour: flavour || null
        });
      }

      res.status(201).json(cartItem);
    } catch (error) {
      console.error('Error adding to cart:', error);
      res.status(500).json({ error: 'Failed to add item to cart' });
    }
  });

  // Get cart items by user
  router.get('/cart/:userid', async (req, res) => {
    try {
      const { userid } = req.params;
      if (!userid) return res.status(400).json({ error: 'User ID is required' });

      const cartItems = await Cart.findAll({
        where: { userid },
        include: [{ model: Product, as: 'product' }]
      });

      res.status(200).json(cartItems);
    } catch (error) {
      console.error('Error fetching cart items:', error);
      res.status(500).json({ error: 'Failed to fetch cart items' });
    }
  });

  // Update cart item quantity
  router.put('/cart/:id', async (req, res) => {
    try {
      const { quantity, userid } = req.body;
      if (!quantity || quantity < 1 || !userid) {
        return res.status(400).json({ error: 'Valid quantity and userid are required' });
      }

      const cartItem = await Cart.findOne({
        where: {
          id: req.params.id,
          userid
        }
      });

      if (!cartItem) return res.status(404).json({ error: 'Cart item not found' });

      const updatedItem = await cartItem.update({ quantity });
      res.json(updatedItem);
    } catch (error) {
      console.error('Error updating cart item:', error);
      res.status(500).json({ error: 'Failed to update cart item' });
    }
  });

  // Remove item from cart
  router.delete('/cart/:id', async (req, res) => {
    try {
      const { userid } = req.body;
      if (!userid) return res.status(400).json({ error: 'userid is required' });

      const result = await Cart.destroy({
        where: {
          id: req.params.id,
          userid
        }
      });

      if (result === 0) return res.status(404).json({ error: 'Cart item not found' });

      res.json({ message: 'Item removed from cart' });
    } catch (error) {
      console.error('Error removing cart item:', error);
      res.status(500).json({ error: 'Failed to remove item from cart' });
    }
  });

  // Clear cart
  router.delete('/cart/clear/:userid', async (req, res) => {
    try {
      await Cart.destroy({ where: { userid: req.params.userid } });
      res.json({ message: 'Cart cleared successfully' });
    } catch (error) {
      console.error('Error clearing cart:', error);
      res.status(500).json({ error: 'Failed to clear cart' });
    }
  });

  app.use('/api', router);
};
