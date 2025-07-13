const PDFDocument = require('pdfkit');
const path = require('path');

const generateInvoicePDF = (order) => {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const buffers = [];

  doc.on('data', buffers.push.bind(buffers));

  const primaryColor = '#000000';

  // === Logo + Company Info ===
  try {
    const logoPath = path.join(__dirname, 'logo.jpg');
    doc.image(logoPath, 50, 40, { width: 100 }); // Adjust as needed
  } catch (err) {
    console.error('Logo not found:', err);
  }

  doc.fontSize(12).fillColor(primaryColor).font('Helvetica-Bold')
    .text('INVOICE', 0, 40, { align: 'center' });

  doc.fontSize(10).fillColor(primaryColor).font('Helvetica-Bold')
    .text('INVOICE FROM:', 160, 50);

  doc.font('Helvetica')
    .text('Exprz ltd', 160, 65)
    .text('077-211-84899', 160, 80)
    .text('vat no :- 481185776', 160, 95)
    .text('exprz@outlook.com', 160, 110)
    .text('No 172, Parkinson lane , Halifax ,', 160, 125)
    .text('Hx1 3ub', 160, 140);

  // === BILL TO Section ===
  const addr = order.shippingAddress;
  const billToY = 180;

  doc.font('Helvetica-Bold').text('BILL TO:', 50, billToY);
  doc.font('Helvetica')
    .text(`${addr.firstName} ${addr.lastName}`, 50, billToY + 15)
    .text(addr.streetAddress, 50, billToY + 30)
    .text(`${addr.city}, ${addr.postcode}`, 50, billToY + 45);

  // === Invoice Metadata ===
  const invoiceNum = `INV${order.orderId}`;
  const dateStr = new Date(order.createdAt).toLocaleDateString('en-GB');

  doc.text(`Number: ${invoiceNum}`, 350, billToY);
  doc.text(`Date: ${dateStr}`, 350, billToY + 15);

  // === Table Header ===
  const tableTop = billToY + 80;
  const startX = 50;

  doc.font('Helvetica-Bold').fontSize(10);
  doc.text('Description', startX, tableTop);
  doc.text('Quantity', startX + 200, tableTop);
  doc.text('Unit price', startX + 270, tableTop);
  doc.text('VAT', startX + 340, tableTop);
  doc.text('Amount', startX + 410, tableTop);

  doc.moveTo(startX, tableTop + 15).lineTo(550, tableTop + 15).stroke();

  // === Table Rows ===
  let y = tableTop + 25;
  doc.font('Helvetica').fontSize(10);

  let subtotal = 0;

  order.items.forEach((item) => {
    const description = `${item.productName}${item.flavour ? ` (${item.flavour})` : ''}`;
    const quantity = item.quantity;
    const unitPrice = parseFloat(item.price);
    const vatRate = 0.20;
    const amount = unitPrice * quantity;

    doc.text(description, startX, y);
    doc.text(quantity.toString(), startX + 200, y);
    doc.text(`£${unitPrice.toFixed(2)}`, startX + 270, y);
    doc.text('20.0 %', startX + 340, y);
    doc.text(`£${amount.toFixed(2)}`, startX + 410, y);

    subtotal += amount;
    y += 20;
  });

  // === Totals Section ===
  const vatAmount = subtotal * 0.20;
  const totalAmount = subtotal + vatAmount;
  const paidAmount = 0;
  const balanceDue = totalAmount - paidAmount;

  doc.font('Helvetica-Bold').fontSize(10);
  doc.text(`SUBTOTAL: £${subtotal.toFixed(2)}`, startX, y + 20);
  doc.text(`VAT: £${vatAmount.toFixed(2)}`, startX, y + 40);
  doc.text(`TOTAL: £${totalAmount.toFixed(2)}`, startX, y + 60);
  doc.text(`PAID: £${paidAmount.toFixed(2)}`, startX, y + 80);
  doc.text(`BALANCE DUE £${balanceDue.toFixed(2)}`, startX, y + 100);

  doc.end();

  return new Promise((resolve) => {
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(buffers);
      resolve(pdfBuffer);
    });
  });
};

module.exports = generateInvoicePDF;
