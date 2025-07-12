const User = require('../models/User');
const generateInvoicePDF = require('./generateInvoicePDF');
const transporter = require('../config/transporter'); // or from email.js if exported there

const sendOrderEmails = async (order) => {
  try {
    const user = await User.findByPk(order.userid);
    if (!user || !user.email) throw new Error('User email not found');

    const pdfBuffer = await generateInvoicePDF(order);

    const customerMail = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Your Order Confirmation - Invoice Attached',
      html: `<p>Dear ${user.name || 'Customer'},<br>Your COD order has been placed successfully. Please find the invoice attached.</p>`,
      attachments: [{
        filename: `Invoice_${order.orderId}.pdf`,
        content: pdfBuffer
      }]
    };

    const adminMail = {
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL,
      subject: `New COD Order from ${user.name || user.email}`,
      html: `<p>A new COD order has been placed by <strong>${user.name || user.email}</strong>.<br>Order ID: ${order.orderId}</p>`,
      attachments: [{
        filename: `Invoice_${order.orderId}.pdf`,
        content: pdfBuffer
      }]
    };

    await transporter.sendMail(customerMail);
    await transporter.sendMail(adminMail);

    console.log('✅ Order emails with invoice sent successfully.');
  } catch (err) {
    console.error('❌ Error sending order emails:', err.message);
  }
};

module.exports = sendOrderEmails;
