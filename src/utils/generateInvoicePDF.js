const PDFDocument = require('pdfkit');

const generateInvoicePDF = (order) => {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const buffers = [];

  doc.on('data', buffers.push.bind(buffers));

  // Set up document styling
  const primaryColor = '#3498db';
  const secondaryColor = '#2c3e50';
  const accentColor = '#e74c3c';
  
  // Add header with logo space (add your actual logo file)
  doc.fillColor(secondaryColor)
     .fontSize(10)
     .text('Sweet Delights', 50, 50, { align: 'left' })
     .fontSize(8)
     .text('123 Bakery Street', 50, 65, { align: 'left' })
     .text('Delhi, India 110001', 50, 80, { align: 'left' });

  // Add invoice title
  doc.moveTo(50, 100)
     .lineTo(550, 100)
     .stroke(primaryColor)
     .fillColor(primaryColor)
     .fontSize(24)
     .font('Helvetica-Bold')
     .text('INVOICE', { align: 'center' })
     .moveTo(50, 130)
     .lineTo(550, 130)
     .stroke(primaryColor);

  // Invoice metadata in two columns
  doc.fontSize(10)
     .fillColor(secondaryColor)
     .text(`Invoice #: ${order.orderId}`, 50, 150)
     .text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 50, 165)
     .text(`Payment Method: ${order.paymentMethod.toUpperCase()}`, 50, 180)
     .text(`User ID: ${order.userid}`, 300, 150)
     .text(`Due Date: ${new Date(order.createdAt).toLocaleDateString()}`, 300, 165);

  // Customer information section
  const addr = order.shippingAddress;
  const fullAddress = `${addr.firstName} ${addr.lastName}\n${addr.streetAddress}\n${addr.city}, ${addr.county}, ${addr.postcode}\nPhone: ${addr.phone}\nInstructions: ${addr.deliveryInstructions || 'N/A'}`;
  
  doc.rect(50, 200, 250, 100)
     .fillAndStroke('#f8f8f8', primaryColor)
     .fillColor(secondaryColor)
     .fontSize(12)
     .font('Helvetica-Bold')
     .text('BILL TO:', 60, 210)
     .font('Helvetica')
     .fontSize(10)
     .text(fullAddress, 60, 230);

  // Items table - responsive column widths
  const columns = [
    { label: '#', width: 30 },        // Column for item number
    { label: 'Description', width: 270 }, // Wider column for product name/flavor
    { label: 'Qty', width: 50 },      // Quantity column
    { label: 'Price', width: 70 },    // Price column
    { label: 'Amount', width: 80 }    // Amount column
  ];

  // Table header
  doc.fillColor(primaryColor)
     .rect(50, 320, 500, 25)
     .fill()
     .fillColor('#ffffff')
     .fontSize(12)
     .font('Helvetica-Bold');
  
  let x = 50;
  columns.forEach(column => {
    doc.text(column.label, x + 5, 325, { width: column.width - 10, align: column.label === 'Description' ? 'left' : 'center' });
    x += column.width;
  });

  // Items rows with text wrapping
  let y = 345;
  order.items.forEach((item, i) => {
    const rowHeight = calculateRowHeight(doc, item, columns[1].width);
    
    doc.fillColor(i % 2 === 0 ? '#ffffff' : '#f8f8f8')
       .rect(50, y, 500, rowHeight)
       .fill()
       .fillColor(secondaryColor)
       .fontSize(10);
    
    // Item number
    doc.text(i + 1, 55, y + 5, { width: columns[0].width - 10, align: 'center' });
    
    // Product description with wrapping
    const description = `${item.productName}${item.flavour ? ` (${item.flavour})` : ''}`;
    doc.text(description, 50 + columns[0].width, y + 5, { 
      width: columns[1].width - 10, 
      align: 'left',
      height: rowHeight,
      ellipsis: true // Add ellipsis if text is too long
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
     .rect(350, y + 20, 200, 100)
     .stroke(primaryColor)
     .fill()
     .fillColor(secondaryColor)
     .fontSize(10)
     .text('Subtotal:', 360, y + 30)
     .text(`₹${order.subtotal.toFixed(2)}`, 460, y + 30, { align: 'right' })
     .text('Tax:', 360, y + 50)
     .text(`₹${order.tax.toFixed(2)}`, 460, y + 50, { align: 'right' })
     .moveTo(360, y + 70)
     .lineTo(460, y + 70)
     .stroke(secondaryColor)
     .font('Helvetica-Bold')
     .text('Total Amount:', 360, y + 80)
     .text(`₹${order.totalAmount.toFixed(2)}`, 460, y + 80, { align: 'right' })
     .fontSize(8)
     .fillColor(primaryColor)
     .text('Thank you for your business!', 360, y + 100);

  // Footer
  doc.fontSize(8)
     .fillColor(secondaryColor)
     .text('Sweet Delights - Premium Bakery Products', 50, 800, { align: 'center' })
     .text('Terms & Conditions: Payment due within 15 days. Late fees may apply.', 50, 815, { align: 'center' });

  doc.end();

  return new Promise((resolve) => {
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(buffers);
      resolve(pdfBuffer);
    });
  });
};

// Helper function to calculate row height based on text length
function calculateRowHeight(doc, item, descriptionWidth) {
  const description = `${item.productName}${item.flavour ? ` (${item.flavour})` : ''}`;
  const height = doc.heightOfString(description, { 
    width: descriptionWidth - 10 
  });
  return Math.max(height + 10, 25); // Minimum row height of 25
}

module.exports = generateInvoicePDF;