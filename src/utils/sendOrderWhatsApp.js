// utils/sendOrderWhatsApp.js - Sends Order Details via WhatsApp (No PDF)
const twilio = require('twilio');
const User = require('../models/User');
require('dotenv').config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

const TWILIO_WHATSAPP_NUMBER = 'whatsapp:+14155238886'; // Twilio sandbox number
const ADMIN_PHONE = process.env.ADMIN_PHONE; // Must include 'whatsapp:' prefix like 'whatsapp:+447123456789'

const formatOrderMessage = (order, user) => {
    
    
  const items = order.items.map(
    (item) => `- ${item.productName}${item.flavour?.flr ? ` (${item.flavour.flr})` : ''} x${item.quantity}`
  ).join('\n');

  const shipping = order.shippingAddress;

   

     

  return `📦 Order Placed by ${user.name || user.email}\n\n` +
         `🧾 Order ID: ${order.orderId}\n` +
         `💳 Payment: ${order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod}\n` +
         `🛍️ Items:\n${items}\n\n` +
         `💰 Subtotal: £${order.subtotal.toFixed(2)}\n` +
         `🧾 VAT: £${order.tax.toFixed(2)}\n` +
         `📦 Total: £${order.totalAmount.toFixed(2)}\n\n` +
         `🚚 Shipping:\n${shipping.firstName} ${shipping.lastName}\n${shipping.streetAddress}, ${shipping.city}, ${shipping.county}, ${shipping.postcode}\n📞 ${shipping.phone}`;
};

const sendOrderWhatsApp = async (order) => {
  try {
    const user = await User.findByPk(order.userId);
    if (!user || !user.phone) {
      throw new Error('User phone number not found');
    }

     

    const message = formatOrderMessage(order, user);
    const userPhone = 'whatsapp:' + "+91"+user.phone;

    // Send to admin
    await client.messages.create({
      from: TWILIO_WHATSAPP_NUMBER,
      to: ADMIN_PHONE,
      body: `📢 NEW ORDER ALERT\n\n${message}`
    })
    
    console.log("admin mail sent succesfully");

    // Send to user
    await client.messages.create({
      from: TWILIO_WHATSAPP_NUMBER,
      to: userPhone,
      body: `✅ Thank you for your order!\n\n${message}`
    });

     

    console.log('✅ WhatsApp messages sent to user and admin.');
  } catch (err) {
    console.error('❌ Error sending WhatsApp order details:', err.message);
  }
};

module.exports = sendOrderWhatsApp;
