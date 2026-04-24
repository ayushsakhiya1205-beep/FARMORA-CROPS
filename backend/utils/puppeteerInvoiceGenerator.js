const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Create invoices directory if it doesn't exist
const invoicesDir = path.join(__dirname, '../invoices');
if (!fs.existsSync(invoicesDir)) {
  fs.mkdirSync(invoicesDir, { recursive: true });
}

const generateOrderInvoiceWithPuppeteer = async (orderDetails, customerName, customerEmail) => {
  try {
    console.log('📄 Generating PDF invoice with PDFKit...');

    const filename = `invoice_${orderDetails._id}_${Date.now()}.pdf`;
    const filepath = path.resolve(invoicesDir, filename);

    // Estimated delivery days
    const estimatedDeliveryDays = Math.max(3, Math.ceil(orderDetails.items.length * 2));

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const stream = fs.createWriteStream(filepath);

      doc.pipe(stream);

      // ── Colors ──
      const green = '#16a34a';
      const darkGreen = '#114714';
      const dark = '#0f172a';
      const gray = '#64748b';
      const lightBg = '#f8fafc';
      const borderColor = '#e2e8f0';

      // ── Top accent bar ──
      doc.rect(0, 0, doc.page.width, 8).fill(green);

      // ── Header ──
      doc.moveDown(1);
      doc.fontSize(26).fillColor(green).text('🌾 Farmora Crops', 40, 30);
      doc.fontSize(28).fillColor(dark).text('INVOICE', 350, 25, { align: 'right' });
      doc.fontSize(12).fillColor(gray).text(
        `#${orderDetails._id.toString().slice(-8).toUpperCase()}`,
        350, 58, { align: 'right' }
      );

      // ── Divider ──
      doc.moveTo(40, 80).lineTo(555, 80).dash(3, { space: 3 }).strokeColor(borderColor).stroke();
      doc.undash();

      // ── Info boxes ──
      const boxY = 95;
      const boxH = 95;

      // Billed To
      doc.rect(40, boxY, 165, boxH).fill(lightBg).stroke(borderColor);
      doc.fontSize(8).fillColor(gray).text('BILLED TO', 50, boxY + 10);
      doc.fontSize(11).fillColor(dark).text(customerName, 50, boxY + 25, { width: 145 });
      doc.fontSize(9).fillColor(gray).text(customerEmail, 50, boxY + 42, { width: 145 });
      doc.fontSize(9).fillColor(gray).text(
        orderDetails.deliveryAddress?.mobileNumber || orderDetails.deliveryAddress?.phone || '',
        50, boxY + 57, { width: 145 }
      );

      // Shipping Address
      doc.rect(215, boxY, 175, boxH).fill(lightBg).stroke(borderColor);
      doc.fontSize(8).fillColor(gray).text('SHIPPING ADDRESS', 225, boxY + 10);
      const addrParts = [
        orderDetails.deliveryAddress?.houseNo,
        orderDetails.deliveryAddress?.street,
        orderDetails.deliveryAddress?.area
      ].filter(Boolean).join(', ');
      const cityLine = [
        orderDetails.deliveryAddress?.city || orderDetails.deliveryAddress?.district,
        orderDetails.deliveryAddress?.state
      ].filter(Boolean).join(', ');
      const pincode = orderDetails.deliveryAddress?.pincode ? ` - ${orderDetails.deliveryAddress.pincode}` : '';

      doc.fontSize(9).fillColor(dark).text(addrParts || 'N/A', 225, boxY + 25, { width: 155 });
      doc.fontSize(9).fillColor(gray).text(`${cityLine}${pincode}`, 225, boxY + 55, { width: 155 });

      // Invoice Details
      doc.rect(400, boxY, 155, boxH).fill(lightBg).stroke(borderColor);
      doc.fontSize(8).fillColor(gray).text('INVOICE DETAILS', 410, boxY + 10);
      doc.fontSize(9).fillColor(dark).text(`Date: ${new Date(orderDetails.createdAt).toLocaleDateString('en-IN')}`, 410, boxY + 25);
      
      const statusText = orderDetails.orderStatus === 'archived' ? 'Completed' : 
        orderDetails.orderStatus.charAt(0).toUpperCase() + orderDetails.orderStatus.slice(1);
      doc.fontSize(9).fillColor(dark).text(`Status: ${statusText}`, 410, boxY + 42);
      
      const paymentText = orderDetails.paymentMethod === 'cod' ? 'Cash on Delivery' : 
        orderDetails.paymentMethod === 'razorpay' ? 'Online (Razorpay)' : 'Online';
      doc.fontSize(9).fillColor(dark).text(`Payment: ${paymentText}`, 410, boxY + 59);

      // ── Items Table ──
      const tableTop = boxY + boxH + 25;
      
      // Table header
      doc.rect(40, tableTop, 515, 30).fill(green);
      doc.fontSize(10).fillColor('#ffffff');
      doc.text('ITEM', 50, tableTop + 9);
      doc.text('QTY', 320, tableTop + 9);
      doc.text('PRICE', 395, tableTop + 9);
      doc.text('AMOUNT', 475, tableTop + 9);

      // Table rows
      let rowY = tableTop + 30;
      const items = orderDetails.items || [];

      items.forEach((item, index) => {
        const rowBg = index % 2 === 0 ? '#ffffff' : lightBg;
        doc.rect(40, rowY, 515, 28).fill(rowBg);
        
        doc.fontSize(10).fillColor(dark).text(item.name, 50, rowY + 8, { width: 260 });
        doc.fontSize(10).fillColor(gray).text(`${item.quantity} ${item.unit || ''}`, 320, rowY + 8);
        doc.fontSize(10).fillColor(gray).text(`₹${item.price.toFixed(2)}`, 395, rowY + 8);
        doc.fontSize(10).fillColor(dark).text(`₹${(item.price * item.quantity).toFixed(2)}`, 475, rowY + 8);
        
        rowY += 28;
      });

      // Bottom border of table
      doc.moveTo(40, rowY).lineTo(555, rowY).strokeColor(borderColor).stroke();

      // ── Summary ──
      const summaryX = 370;
      const summaryY = rowY + 15;

      doc.rect(summaryX, summaryY, 185, 95).fill(lightBg).stroke(borderColor);

      doc.fontSize(10).fillColor(gray).text('Subtotal', summaryX + 15, summaryY + 12);
      doc.fontSize(10).fillColor(dark).text(
        `₹${(orderDetails.totalAmount || 0).toFixed(2)}`,
        summaryX + 100, summaryY + 12, { align: 'right', width: 70 }
      );

      doc.fontSize(10).fillColor(gray).text('Delivery Fee', summaryX + 15, summaryY + 32);
      doc.fontSize(10).fillColor(dark).text(
        orderDetails.deliveryFee > 0 ? `₹${orderDetails.deliveryFee.toFixed(2)}` : 'FREE',
        summaryX + 100, summaryY + 32, { align: 'right', width: 70 }
      );

      // Total line
      doc.moveTo(summaryX + 10, summaryY + 52).lineTo(summaryX + 175, summaryY + 52)
        .dash(3, { space: 3 }).strokeColor(gray).stroke();
      doc.undash();

      doc.fontSize(14).fillColor(green).text('Total Due', summaryX + 15, summaryY + 62);
      doc.fontSize(14).fillColor(green).text(
        `₹${(orderDetails.finalAmount || orderDetails.totalAmount || 0).toFixed(2)}`,
        summaryX + 80, summaryY + 62, { align: 'right', width: 90 }
      );

      // ── Footer boxes ──
      const footerY = summaryY + 120;

      // Shipping Info
      doc.rect(40, footerY, 250, 65).fill(lightBg).stroke(borderColor);
      doc.fontSize(10).fillColor(dark).text('📦 Shipping Info', 50, footerY + 10);
      doc.fontSize(9).fillColor(gray).text(
        `Estimated Delivery: ${estimatedDeliveryDays} Business Days`,
        50, footerY + 28, { width: 230 }
      );
      doc.fontSize(8).fillColor(gray).text(
        'Our delivery executive will contact you before arrival.',
        50, footerY + 44, { width: 230 }
      );

      // Need Help
      doc.rect(305, footerY, 250, 65).fill(lightBg).stroke(borderColor);
      doc.fontSize(10).fillColor(dark).text('💬 Need Help?', 315, footerY + 10);
      doc.fontSize(9).fillColor(gray).text('Email: farmoracrops@gmail.com', 315, footerY + 28);
      doc.fontSize(9).fillColor(gray).text('Call: +91 8733040849', 315, footerY + 44);

      // ── Thank you ──
      doc.moveTo(40, footerY + 80).lineTo(555, footerY + 80).strokeColor(borderColor).stroke();
      doc.fontSize(10).fillColor(gray).text(
        'Thank you for your business!',
        40, footerY + 90, { align: 'center', width: 515 }
      );
      doc.fontSize(8).fillColor(gray).text(
        `Generated on ${new Date().toLocaleString('en-IN')} | © ${new Date().getFullYear()} Farmora Crops`,
        40, footerY + 106, { align: 'center', width: 515 }
      );

      doc.end();

      stream.on('finish', () => {
        const stats = fs.statSync(filepath);
        console.log(`✅ PDFKit invoice generated: ${filename} (${stats.size} bytes)`);
        resolve({
          filename,
          filepath,
          success: true,
          size: stats.size
        });
      });

      stream.on('error', (err) => {
        console.error('❌ PDF stream error:', err);
        reject(err);
      });
    });

  } catch (error) {
    console.error('❌ PDFKit invoice generation error:', error);
    throw error;
  }
};

module.exports = {
  generateOrderInvoiceWithPuppeteer
};
