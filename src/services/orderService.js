const Cart = require('../models/Cart');
const Order = require('../models/Order');
const { generateOrderId } = require('../utils/helpers');

class OrderService {
  static async createCODOrder(orderData) {
    const orderId = generateOrderId();
    
    try {
      const order = await Order.create({
        orderId,
        userId: orderData.userId,
        items: orderData.items,
        subtotal: orderData.subtotal,
        tax: orderData.tax,
        totalAmount: orderData.totalAmount,
        paymentMethod: 'cod',
        paymentStatus: false,
        status: 'pending',
        shippingAddress: orderData.shippingAddress
      });

      await Cart.destroy({ where: { userid: orderData.userId } });

      return {
        success: true,
        order: {
          orderId: order.orderId,
          userid:order.userId,
          createdAt: order.createdAt,
          items: order.items,
          subtotal: order.subtotal,
          tax: order.tax,
          totalAmount: order.totalAmount,
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus,
          status: order.status,
          shippingAddress: order.shippingAddress
        }
      };
    } catch (error) {
      console.error('Error creating COD order:', error);
      throw error;
    }
  }

  static async getOrderById(orderId) {
    try {
      return await Order.findOne({ where: { orderId } });
    } catch (error) {
      console.error('Error fetching order:', error);
      throw error;
    }
  }
}

module.exports = OrderService;