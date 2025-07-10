const OrderService = require('../services/orderService');

const orderController = {
  createCODOrder: async (req, res) => {
    try {
      const orderData = req.body;
      
      if (!orderData.userId || !orderData.items || !orderData.shippingAddress) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }

      const result = await OrderService.createCODOrder(orderData);

      res.status(201).json({
        success: true,
        message: 'COD order created successfully',
        order: result.order
      });
    } catch (error) {
      console.error('Error in createCODOrder:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create COD order',
        error: error.message
      });
    }
  },

  getOrder: async (req, res) => {
    try {
      const { orderId } = req.params;
      const order = await OrderService.getOrderById(orderId);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      res.status(200).json({
        success: true,
        order
      });
    } catch (error) {
      console.error('Error in getOrder:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch order',
        error: error.message
      });
    }
  }
};

module.exports = orderController;