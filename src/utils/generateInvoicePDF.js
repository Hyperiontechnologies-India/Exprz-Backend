const PDFDocument = require('pdfkit');
const path = require('path');

const generateInvoicePDF = (order) => {
  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  const buffers = [];

  doc.on('data', buffers.push.bind(buffers));

  const red = '#e53935';
  const gray = '#f5f5f5';
  const black = '#000000';

  // === Header ===
  doc.fillColor(black).fontSize(20).font('Helvetica-Bold').text('INVOICE', 40, 40);

  // === Logo ===
  try {
    const logoPath = path.join(__dirname, 'logo.png');
    doc.image(logoPath, 440, 30, { width: 90 });
  } catch (e) {
    console.error('Logo missing:', e.message);
  }

  // === Left Company Info ===
  doc.fontSize(9).fillColor(red).font('Helvetica-Bold').text('INVOICE FROM:', 40, 80);
  doc.fillColor(black).font('Helvetica').text('Exprz ltd', 40, 95)
    .text('077-211-84899')
    .text('vat no :- 481185776')
    .text('exprz@outlook.com')
    .text('No 172, Parkinson lane , Halifax ,')
    .text('Hx1 3ub');

  // === Bill To ===
  const addr = order.shippingAddress;
  doc.fontSize(9).fillColor(red).font('Helvetica-Bold').text('BILL TO:', 230, 80);
  doc.fillColor(black).font('Helvetica').text(`${addr.firstName} ${addr.lastName}`, 230, 95)
    .text(addr.streetAddress)
    .text(`${addr.city}, ${addr.postcode}`);

  // === Invoice Number / Date ===
  doc.fontSize(9).font('Helvetica').fillColor(black);
  doc.text(`Number: INV${order.orderId}`, 420, 95);
  doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-GB')}`, 420, 110);

  // === Table Header ===
  const tableTop = 190;
  const colX = {
    desc: 40,
    qty: 290,
    price: 350,
    vat: 420,
    amt: 480
  };

  doc.rect(40, tableTop, 520, 25).fill(red);
  doc.fillColor('#fff').fontSize(10).font('Helvetica-Bold');
  doc.text('Description', colX.desc + 5, tableTop + 7, { width: 200 });
  doc.text('Quantity', colX.qty + 5, tableTop + 7);
  doc.text('Unit price', colX.price + 5, tableTop + 7);
  doc.text('VAT', colX.vat + 5, tableTop + 7);
  doc.text('Amount', colX.amt + 5, tableTop + 7);

  // === Table Rows ===
  let y = tableTop + 25;
  let subtotal = 0;
  doc.font('Helvetica').fontSize(9).fillColor(black);

  order.items.forEach((item, i) => {
    const description = `${item.productName}${item.flavour ? ` (${item.flavour})` : ''}`;
    const quantity = item.quantity;
    const unitPrice = parseFloat(item.price);
    const vatRate = 0.20;
    const amount = unitPrice * quantity;

    doc.fillColor(i % 2 === 0 ? '#fff' : gray).rect(40, y, 520, 25).fill();
    doc.fillColor(black).font('Helvetica');

    doc.text(description, colX.desc + 5, y + 7, { width: 200 });
    doc.text(quantity.toString(), colX.qty + 5, y + 7);
    doc.text(`£${unitPrice.toFixed(2)}`, colX.price + 5, y + 7);
    doc.text('20.0 %', colX.vat + 5, y + 7);
    doc.text(`£${amount.toFixed(2)}`, colX.amt + 5, y + 7);

    subtotal += amount;
    y += 25;
  });

  // === Totals ===
  const vatAmount = subtotal * 0.2;
  const totalAmount = subtotal + vatAmount;
  const paidAmount = 0;
  const due = totalAmount - paidAmount;

  const summaryX = 400;
  const summaryY = y + 20;

  doc.fontSize(10).fillColor(black).font('Helvetica-Bold');
  doc.text('SUBTOTAL:', summaryX, summaryY);
  doc.text('VAT:', summaryX, summaryY + 15);
  doc.text('TOTAL:', summaryX, summaryY + 30);
  doc.text('PAID:', summaryX, summaryY + 45);
  doc.text('BALANCE DUE', summaryX, summaryY + 75);

  doc.font('Helvetica');
  doc.text(`£${subtotal.toFixed(2)}`, 500, summaryY, { align: 'right' });
  doc.text(`£${vatAmount.toFixed(2)}`, 500, summaryY + 15, { align: 'right' });
  doc.text(`£${totalAmount.toFixed(2)}`, 500, summaryY + 30, { align: 'right' });
  doc.text(`£${paidAmount.toFixed(2)}`, 500, summaryY + 45, { align: 'right' });

  // === Balance Due Box ===
  doc.rect(40, summaryY + 70, 180, 30).fill('#000');
  doc.fillColor('#fff').fontSize(12).font('Helvetica-Bold');
  doc.text('BALANCE DUE', 50, summaryY + 78);
  doc.text(`£${due.toFixed(2)}`, 160, summaryY + 78, { align: 'right' });

  doc.end();

  return new Promise((resolve) => {
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(buffers);
      resolve(pdfBuffer);
    });
  });
};

module.exports = generateInvoicePDF;
