const User = require("../models/User");
const generateInvoicePDF = require("./generateInvoicePDF");
const transporter = require("../config/transporter"); // or from email.js if exported there

const sendOrderEmails = async (order) => {
   
  try {
    const user = await User.findByPk(order.userId);

    console.log(user)
    if (!user || !user.email) throw new Error("User email not found");

    const pdfBuffer = await generateInvoicePDF(order);

    const customerMail = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Your Order Confirmation - Invoice Attached",
      html: `<p>Dear ${
        user.name || "Customer"
      },<br>Your COD order has been placed successfully. Please find the invoice attached.</p>`,
      attachments: [
        {
          filename: `Invoice_${order.orderId}.pdf`,
          content: pdfBuffer,
        },
      ],
    };

    const adminMail = {
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL,
      subject: `New COD Order from ${user.name || user.email}`,
      html: `<p>A new COD order has been placed by <strong>${
        user.name || user.email
      }</strong>.<br>Order ID: ${order.orderId}</p>`,
      attachments: [
        {
          filename: `Invoice_${order.orderId}.pdf`,
          content: pdfBuffer,
        },
      ],
    };

    try {
      await transporter.sendMail(customerMail);
    } catch (err) {
      console.log(
        `Error while sending the order mail to customer of order no :${order.orderId} with the error $${err}`
      );
    }

    try {
        console.log("Admin email:", process.env.ADMIN_EMAIL);

      await transporter.sendMail(adminMail);
      

    } catch (err) {
      console.log(
        `Error while sending the order mail to Admin of order no :${order.orderId} with the error $${err}`
      );
    }

    console.log("✅ Order emails with invoice sent successfully.");
  } catch (err) {
    console.error("❌ Error sending order emails:", err.message);
  }
};

module.exports = sendOrderEmails;
