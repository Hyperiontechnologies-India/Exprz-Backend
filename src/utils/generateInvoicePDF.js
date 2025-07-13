const PDFDocument = require('pdfkit');
const path = require('path');

const generateInvoicePDF = (order) => {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const buffers = [];

  doc.on('data', buffers.push.bind(buffers));

  // Document styling
  const primaryColor = '#3498db';
  const secondaryColor = '#2c3e50';
  const accentColor = '#e74c3c';
  
  // Header with logo and company info
  try {
    // Add logo (adjust path as needed)
    const logoPath = path.join(__dirname, 'logo.png');
    doc.image(logoPath, 50, 45, { width: 80, height: 40 });
    
    // Company info to the right of logo
    doc.fillColor(secondaryColor)
       .fontSize(12)
       .font('Helvetica-Bold')
       .text('Exprz Vapes', 140, 45)
       .font('Helvetica')
       .fontSize(9)
       .text('No 172, Parkinson Lane', 140, 65)
       .text('Halifax, United Kingdom', 140, 80)
       .text('Phone: +44 1234 567890', 140, 95)
       .text('Email: info@exprzvapes.com', 140, 110);
  } catch (err) {
    console.error('Logo not found, using text header only:', err);
    // Fallback header without logo
    doc.fillColor(secondaryColor)
       .fontSize(12)
       .font('Helvetica-Bold')
       .text('Exprz Vapes', 50, 50)
       .font('Helvetica')
       .fontSize(9)
       .text('No 172, Parkinson Lane', 50, 70)
       .text('Halifax, United Kingdom', 50, 85)
       .text('Phone: +44 1234 567890', 50, 100)
       .text('Email: info@exprzvapes.com', 50, 115);
  }

  // Invoice title section
  doc.moveTo(50, 140)
     .lineTo(550, 140)
     .stroke(primaryColor)
     .fillColor(primaryColor)
     .fontSize(24)
     .font('Helvetica-Bold')
     .text('INVOICE', { align: 'center' })
     .moveTo(50, 170)
     .lineTo(550, 170)
     .stroke(primaryColor);

  // Invoice metadata in two columns
  doc.fontSize(10)
     .fillColor(secondaryColor)
     .text(`Invoice #: ${order.orderId}`, 50, 190)
     .text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 50, 205)
     .text(`Payment Method: ${order.paymentMethod.toUpperCase()}`, 50, 220)
     .text(`User ID: ${order.userid}`, 300, 190)
     .text(`Due Date: ${new Date(order.createdAt).toLocaleDateString()}`, 300, 205);

  // Customer information section
  const addr = order.shippingAddress;
  const fullAddress = `${addr.firstName} ${addr.lastName}\n${addr.streetAddress}\n${addr.city}, ${addr.county}, ${addr.postcode}\nPhone: ${addr.phone}\nInstructions: ${addr.deliveryInstructions || 'N/A'}`;
  
  doc.rect(50, 240, 250, 100)
     .fillAndStroke('#f8f8f8', primaryColor)
     .fillColor(secondaryColor)
     .fontSize(12)
     .font('Helvetica-Bold')
     .text('BILL TO:', 60, 250)
     .font('Helvetica')
     .fontSize(10)
     .text(fullAddress, 60, 270);

  // Items table
  const columns = [
    { label: '#', width: 30 },
    { label: 'Description', width: 270 },
    { label: 'Qty', width: 50 },
    { label: 'Price', width: 70 },
    { label: 'Amount', width: 80 }
  ];

  // Table header
  doc.fillColor(primaryColor)
     .rect(50, 360, 500, 25)
     .fill()
     .fillColor('#ffffff')
     .fontSize(12)
     .font('Helvetica-Bold');
  
  let x = 50;
  columns.forEach(column => {
    doc.text(column.label, x + 5, 365, { 
      width: column.width - 10, 
      align: column.label === 'Description' ? 'left' : 'center' 
    });
    x += column.width;
  });

  // Items rows
  let y = 385;
  order.items.forEach((item, i) => {
    const rowHeight = calculateRowHeight(doc, item, columns[1].width);
    
    doc.fillColor(i % 2 === 0 ? '#ffffff' : '#f8f8f8')
       .rect(50, y, 500, rowHeight)
       .fill()
       .fillColor(secondaryColor)
       .fontSize(10);
    
    // Item number
    doc.text((i + 1).toString(), 55, y + 5, { 
      width: columns[0].width - 10, 
      align: 'center' 
    });
    
    // Product description
    const description = `${item.productName}${item.flavour ? ` (${item.flavour})` : ''}`;
    doc.text(description, 50 + columns[0].width, y + 5, { 
      width: columns[1].width - 10, 
      align: 'left',
      height: rowHeight,
      ellipsis: true
    });
    
    // Quantity
    doc.text(item.quantity.toString(), 50 + columns[0].width + columns[1].width, y + 5, { 
      width: columns[2].width - 10, 
      align: 'center' 
    });
    
    // Price
    doc.text(`₹${Number(item.price).toFixed(2)}`, 50 + columns[0].width + columns[1].width + columns[2].width, y + 5, { 
      width: columns[3].width - 10, 
      align: 'right' 
    });
    
    // Amount
    doc.text(`₹${(item.price * item.quantity).toFixed(2)}`, 50 + columns[0].width + columns[1].width + columns[2].width + columns[3].width, y + 5, { 
      width: columns[4].width - 10, 
      align: 'right' 
    });
    
    y += rowHeight;
  });

  // Summary section
  doc.fillColor('#ffffff')
     .rect(350, y + 20, 200, 120)
     .stroke(primaryColor)
     .fill()
     .fillColor(secondaryColor)
     .fontSize(10)
     .text('Subtotal:', 360, y + 30)
     .text(`₹${order.subtotal.toFixed(2)}`, 460, y + 30, { align: 'right' })
     .text('Shipping:', 360, y + 50)
     .text(`₹${order.shippingFee?.toFixed(2) || '0.00'}`, 460, y + 50, { align: 'right' })
     .text('Tax:', 360, y + 70)
     .text(`₹${order.tax.toFixed(2)}`, 460, y + 70, { align: 'right' })
     .moveTo(360, y + 90)
     .lineTo(460, y + 90)
     .stroke(secondaryColor)
     .font('Helvetica-Bold')
     .text('Total Amount:', 360, y + 100)
     .text(`₹${order.totalAmount.toFixed(2)}`, 460, y + 100, { align: 'right' })
     .fontSize(8)
     .fillColor(primaryColor)
     .text('Thank you for your business!', 360, y + 120);

  // Footer
  doc.fontSize(8)
     .fillColor(secondaryColor)
     .text('Exprz Vapes | Registered in England No. 12345678 | VAT No. GB123456789', 50, 800, { align: 'center' })
     .text('Terms: Payment due within 15 days. Late fees may apply at 1.5% per month.', 50, 815, { align: 'center' })
     .text('Returns accepted within 14 days with original receipt.', 50, 830, { align: 'center' });

  doc.end();

  return new Promise((resolve) => {
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(buffers);
      resolve(pdfBuffer);
    });
  });
};

// Helper function to calculate row height
function calculateRowHeight(doc, item, descriptionWidth) {
  const description = `${item.productName}${item.flavour ? ` (${item.flavour})` : ''}`;
  const height = doc.heightOfString(description, { 
    width: descriptionWidth - 10 
  });
  return Math.max(height + 10, 25); // Minimum row height of 25
}

module.exports = generateInvoicePDF;