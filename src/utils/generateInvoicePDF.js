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
    const logoPath = path.join(__dirname, 'logo.jpg');
    doc.image(logoPath, 440, 30, { width: 100 });
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

  // === Bill To Section ===
  const addr = order.shippingAddress;
  doc.fillColor(red).font('Helvetica-Bold').text('BILL TO:', 230, 80);
  doc.fillColor(black).font('Helvetica').text(`${addr.firstName} ${addr.lastName}`, 230, 95)
    .text(addr.streetAddress)
    .text(`${addr.city}, ${addr.postcode}`);

  // === Invoice Info ===
  const invoiceNumber = `INV${order.orderId}`;
  const ukDate = new Date(order.createdAt).toLocaleDateString('en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });

  doc.font('Helvetica').fontSize(9);
  doc.text(`Number: ${invoiceNumber}`, 420, 95, { align: 'right' });
  doc.text(`Date: ${ukDate}`, 420, 110, { align: 'right' });

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
    const amount = unitPrice * quantity;

    doc.fillColor(i % 2 === 0 ? '#fff' : gray).rect(40, y, 520, 25).fill();
    doc.fillColor(black).font('Helvetica');

    doc.text(description, colX.desc + 5, y + 7, { width: 240, ellipsis: true });
    doc.text(quantity.toString(), colX.qty + 5, y + 7);
    doc.text(`£${unitPrice.toFixed(2)}`, colX.price + 5, y + 7);
    doc.text('20.0 %', colX.vat + 5, y + 7);
    doc.text(`£${amount.toFixed(2)}`, colX.amt + 5, y + 7);

    subtotal += amount;
    y += 25;
  });

  // === Totals ===
  const vatAmount = subtotal * 0.20;
  const totalAmount = subtotal + vatAmount;
  const paidAmount = 0;
  const balanceDue = totalAmount - paidAmount;

  const summaryY = y + 20;
  doc.font('Helvetica-Bold').fillColor(black).fontSize(10);

  doc.text('SUBTOTAL:', 400, summaryY);
  doc.text('VAT:', 400, summaryY + 15);
  doc.text('TOTAL:', 400, summaryY + 30);
  doc.text('PAID:', 400, summaryY + 45);

  doc.font('Helvetica').fillColor(black);
  doc.text(`£${subtotal.toFixed(2)}`, 500, summaryY, { align: 'right' });
  doc.text(`£${vatAmount.toFixed(2)}`, 500, summaryY + 15, { align: 'right' });
  doc.text(`£${totalAmount.toFixed(2)}`, 500, summaryY + 30, { align: 'right' });
  doc.text(`£${paidAmount.toFixed(2)}`, 500, summaryY + 45, { align: 'right' });

  // === Final BALANCE DUE Section ===
  const balanceY = summaryY + 80;

  doc.rect(320, balanceY, 240, 30).fill(black);
  doc.fillColor('#fff').fontSize(12).font('Helvetica-Bold');
  doc.text('BALANCE DUE', 330, balanceY + 9, { align: 'left' });
  doc.text(`£${balanceDue.toFixed(2)}`, 540, balanceY + 9, { align: 'right' });

  doc.end();

  return new Promise((resolve) => {
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(buffers);
      resolve(pdfBuffer);
    });
  });
};

module.exports = generateInvoicePDF;
