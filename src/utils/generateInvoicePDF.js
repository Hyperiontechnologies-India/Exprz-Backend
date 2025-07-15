const PDFDocument = require('pdfkit');
const path = require('path');


const generateInvoicePDF = (order) => {
  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  const buffers = [];

  doc.on('data', buffers.push.bind(buffers));

  const red = '#e53935';
  const gray = '#f5f5f5';
  const black = '#000000';
  const white = '#ffffff';

  doc.fillColor(black).fontSize(22).font('Helvetica-Bold').text('INVOICE', 40, 40);

  try {
    const logoPath = path.join(__dirname, 'logo.jpg');
    doc.image(logoPath, 460, 30, { width: 80 });
  } catch (e) {
    console.error('Logo missing:', e.message);
  }

  // Sender (Company) Address
  doc.fontSize(10).fillColor(red).font('Helvetica-Bold').text('INVOICE FROM:', 40, 80);
  doc.fillColor(black).font('Helvetica-Bold');
  const companyAddress = [
    'Exprz ltd',
    '077-211-84899',
    'vat no :- 481185776',
    'exprz@outlook.com',
    'No 172, Parkinson lane , Halifax ,',
    'Hx1 3ub'
  ];
  companyAddress.forEach((line, i) => {
    doc.text(line, 40, 95 + i * 12);
  });

  // Customer Address
  const addr = order.shippingAddress;
  doc.fillColor(red).font('Helvetica-Bold').text('BILL TO:', 230, 80);
  doc.fillColor(black).font('Helvetica-Bold');

  const customerY = 95;
  let cursorY = customerY;
  const customerLines = [
    `${addr.firstName} ${addr.lastName}`,
    addr.streetAddress,
    `${addr.city}`,
    `${addr.country || ''} ${addr.postcode}`
  ];
  customerLines.forEach((line, i) => {
    const opts = { width: 170 };
    doc.text(line, 230, cursorY, opts);
    cursorY += 12;
  });

  // Invoice Number and Date
  const invoiceNumber = `${order.orderId}`;
  const ukDate = new Date(order.createdAt).toLocaleDateString('en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });

  doc.fontSize(10).font('Helvetica-Bold').fillColor(black);
  doc.text('Number:', 400, 95, { width: 100, align: 'right' });
  doc.font('Helvetica').text(invoiceNumber, 400, 110, { width: 100, align: 'right' });

  doc.font('Helvetica-Bold').text('Date:', 400, 140, { width: 100, align: 'right' });
  doc.font('Helvetica').text(ukDate, 400, 155, { width: 100, align: 'right' });

  // Table Header
  const tableTop = 200;
  const colX = { desc: 40, qty: 290, price: 350, vat: 420, amt: 480 };

  doc.rect(40, tableTop, 520, 25).fill(red);
  doc.fillColor(white).fontSize(10).font('Helvetica-Bold');
  doc.text('Description', colX.desc + 5, tableTop + 7, { width: 200 });
  doc.text('Qty', colX.qty + 5, tableTop + 7, { width: 50, align: 'center' });
  doc.text('Unit Price', colX.price + 5, tableTop + 7, { width: 60, align: 'right' });
  doc.text('VAT', colX.vat + 5, tableTop + 7, { width: 50, align: 'right' });
  doc.text('Amount', colX.amt + 5, tableTop + 7, { width: 60, align: 'right' });

  let y = tableTop + 25;
  let subtotal = 0;
  let totalVAT = 0;
  doc.font('Helvetica').fontSize(10).fillColor(black);

  order.items.forEach((item, i) => {
    const description = `${item.productName}${item.flavour?.flr ? ` (${item.flavour.flr})` : ''}`;
    const quantity = item.quantity;
    const unitPrice = parseFloat(item.price);
    const vatRate = item.vatRate || 20;
    const vatDecimal = vatRate / 100;
    const vatAmount = unitPrice * vatDecimal * quantity;
    const amount = unitPrice * quantity + vatAmount;

    doc.fillColor(i % 2 === 0 ? white : gray).rect(40, y, 520, 25).fill();
    doc.fillColor(black).font('Helvetica');

    doc.text(description, colX.desc + 5, y + 7, { width: 240, ellipsis: true });
    doc.text(quantity.toString(), colX.qty + 5, y + 7, { width: 50, align: 'center' });
    doc.text(`£${unitPrice.toFixed(2)}`, colX.price + 5, y + 7, { width: 60, align: 'right' });
    doc.text(`${vatRate.toFixed(1)}%`, colX.vat + 5, y + 7, { width: 50, align: 'right' });
    doc.text(`£${amount.toFixed(2)}`, colX.amt + 5, y + 7, { width: 60, align: 'right' });

    subtotal += unitPrice * quantity;
    totalVAT += vatAmount;
    y += 25;
  });

  const totalAmount = subtotal + totalVAT;
  const paidAmount = 0;
  const balanceDue = totalAmount - paidAmount;

  // Summary Box
  const summaryY = y + 20;
  doc.rect(320, summaryY - 10, 240, 80).fill(gray);
  doc.font('Helvetica-Bold').fillColor(black).fontSize(11);
  doc.text('SUBTOTAL:', 340, summaryY);
  doc.text('VAT:', 340, summaryY + 15);
  doc.text('TOTAL:', 340, summaryY + 30);
  doc.text('PAID:', 340, summaryY + 45);

  doc.font('Helvetica').fillColor(black);
  doc.text(`£${subtotal.toFixed(2)}`, 500, summaryY, { align: 'right' });
  doc.text(`£${totalVAT.toFixed(2)}`, 500, summaryY + 15, { align: 'right' });
  doc.text(`£${totalAmount.toFixed(2)}`, 500, summaryY + 30, { align: 'right' });
  doc.text(`£${paidAmount.toFixed(2)}`, 500, summaryY + 45, { align: 'right' });

  // BALANCE DUE
  const balanceY = summaryY + 80;
  doc.rect(340, balanceY, 220, 30).fill(black);
  doc.fillColor(white).fontSize(12).font('Helvetica-Bold');

  const balanceText = 'BALANCE DUE:';
  const amountText = `£${balanceDue.toFixed(2)}`;
  doc.text(balanceText, 350, balanceY + 9);
  doc.text(amountText, 540 - doc.widthOfString(amountText), balanceY + 9);

  doc.end();

  return new Promise((resolve) => {
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(buffers);
      resolve(pdfBuffer);
    });
  });
};

module.exports = generateInvoicePDF;
