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
      const lightGray = '#94a3b8';
      const lightBg = '#f8fafc';
      const borderColor = '#e2e8f0';
      const white = '#ffffff';

      // ── Top green accent bar ──
      doc.rect(0, 0, doc.page.width, 8).fill(green);

      // ══════════════════════════════════════════
      //  HEADER: Logo + Invoice title + Order ID
      // ══════════════════════════════════════════
      doc.fontSize(24).fillColor(darkGreen).text('Farmora Crops', 40, 28);
      doc.fontSize(10).fillColor(gray).text('The Promise of Purity', 40, 54);

      doc.fontSize(28).fillColor(dark).text('INVOICE', 400, 25, { align: 'right', width: 155 });
      doc.fontSize(11).fillColor(gray).text(
        `#${orderDetails._id.toString().slice(-8).toUpperCase()}`,
        400, 58, { align: 'right', width: 155 }
      );
      doc.fontSize(9).fillColor(lightGray).text(
        `Date: ${new Date(orderDetails.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`,
        400, 74, { align: 'right', width: 155 }
      );

      // Divider
      doc.moveTo(40, 92).lineTo(555, 92).dash(3, { space: 3 }).strokeColor(borderColor).stroke();
      doc.undash();

      // ══════════════════════════════════════════
      //  CUSTOMER INFO: Name, Email, Phone
      // ══════════════════════════════════════════
      const infoY = 105;
      doc.rect(40, infoY, 515, 40).fill(lightBg);
      doc.fontSize(10).fillColor(dark).text(`Customer: ${customerName}`, 55, infoY + 8);
      doc.fontSize(9).fillColor(gray).text(`Email: ${customerEmail}`, 55, infoY + 23);

      const phone = orderDetails.deliveryAddress?.mobileNumber || orderDetails.deliveryAddress?.phone || '';
      if (phone) {
        doc.fontSize(9).fillColor(gray).text(`Phone: ${phone}`, 350, infoY + 8);
      }

      const statusText = orderDetails.orderStatus === 'archived' ? 'Completed' :
        orderDetails.orderStatus.charAt(0).toUpperCase() + orderDetails.orderStatus.slice(1);
      const paymentText = orderDetails.paymentMethod === 'cod' ? 'COD' :
        orderDetails.paymentMethod === 'razorpay' ? 'Online' : 'Online';
      doc.fontSize(9).fillColor(gray).text(`Status: ${statusText}  |  Payment: ${paymentText}`, 350, infoY + 23);

      // ══════════════════════════════════════════
      //  ORDER ITEMS TABLE
      // ══════════════════════════════════════════
      const tableTop = infoY + 55;

      // Table header
      doc.rect(40, tableTop, 515, 28).fill(darkGreen);
      doc.fontSize(10).fillColor(white);
      doc.text('#', 50, tableTop + 8, { width: 25 });
      doc.text('Item Name', 75, tableTop + 8, { width: 220 });
      doc.text('Qty / Unit', 295, tableTop + 8, { width: 80 });
      doc.text('Rate', 380, tableTop + 8, { width: 70 });
      doc.text('Amount', 460, tableTop + 8, { width: 90, align: 'right' });

      // Table rows
      let rowY = tableTop + 28;
      const items = orderDetails.items || [];

      items.forEach((item, index) => {
        // Check if we need a new page
        if (rowY > 700) {
          doc.addPage();
          rowY = 40;
        }

        const rowBg = index % 2 === 0 ? white : lightBg;
        doc.rect(40, rowY, 515, 30).fill(rowBg);

        // Row number
        doc.fontSize(9).fillColor(lightGray).text(`${index + 1}`, 50, rowY + 9, { width: 25 });

        // Item name (bold)
        doc.fontSize(10).fillColor(dark).text(item.name, 75, rowY + 5, { width: 210 });

        // Qty with unit (e.g. "2 kg")
        doc.fontSize(10).fillColor(gray).text(
          `${item.quantity} ${item.unit || ''}`,
          295, rowY + 9, { width: 80 }
        );

        // Unit price
        doc.fontSize(10).fillColor(gray).text(
          `Rs.${item.price.toFixed(0)}`,
          380, rowY + 9, { width: 70 }
        );

        // Line total (bold)
        doc.fontSize(10).fillColor(dark).text(
          `Rs.${(item.price * item.quantity).toFixed(0)}`,
          460, rowY + 9, { width: 90, align: 'right' }
        );

        rowY += 30;
      });

      // Table bottom border
      doc.moveTo(40, rowY).lineTo(555, rowY).strokeColor(borderColor).lineWidth(1).stroke();

      // ══════════════════════════════════════════
      //  ORDER SUMMARY (right-aligned)
      // ══════════════════════════════════════════
      const summaryX = 350;
      const summaryY = rowY + 12;

      // Subtotal
      doc.fontSize(10).fillColor(gray).text('Subtotal:', summaryX, summaryY);
      doc.fontSize(10).fillColor(dark).text(
        `Rs.${(orderDetails.totalAmount || 0).toFixed(2)}`,
        460, summaryY, { align: 'right', width: 90 }
      );

      // Delivery Fee
      doc.fontSize(10).fillColor(gray).text('Delivery Fee:', summaryX, summaryY + 20);
      doc.fontSize(10).fillColor(dark).text(
        orderDetails.deliveryFee > 0 ? `Rs.${orderDetails.deliveryFee.toFixed(2)}` : 'FREE',
        460, summaryY + 20, { align: 'right', width: 90 }
      );

      // Total line
      doc.moveTo(summaryX, summaryY + 40).lineTo(555, summaryY + 40)
        .lineWidth(1.5).strokeColor(darkGreen).stroke();

      // Grand Total
      doc.fontSize(14).fillColor(darkGreen).text('Total:', summaryX, summaryY + 50);
      doc.fontSize(14).fillColor(darkGreen).text(
        `Rs.${(orderDetails.finalAmount || orderDetails.totalAmount || 0).toFixed(2)}`,
        440, summaryY + 50, { align: 'right', width: 110 }
      );

      // ══════════════════════════════════════════
      //  DELIVERY ADDRESS (after total)
      // ══════════════════════════════════════════
      const addrY = summaryY + 80;

      // Check for new page
      if (addrY > 650) {
        doc.addPage();
      }

      doc.moveTo(40, addrY).lineTo(555, addrY).strokeColor(borderColor).lineWidth(0.5).stroke();

      doc.fontSize(12).fillColor(darkGreen).text('Delivery Address', 40, addrY + 12);

      const addrParts = [
        orderDetails.deliveryAddress?.houseNo,
        orderDetails.deliveryAddress?.street
      ].filter(Boolean).join(', ');

      const areaLine = [
        orderDetails.deliveryAddress?.area,
        orderDetails.deliveryAddress?.taluka
      ].filter(Boolean).join(', ');

      const cityLine = [
        orderDetails.deliveryAddress?.city || orderDetails.deliveryAddress?.district,
        orderDetails.deliveryAddress?.state
      ].filter(Boolean).join(', ');

      const pincode = orderDetails.deliveryAddress?.pincode || '';
      const mobile = orderDetails.deliveryAddress?.mobileNumber || orderDetails.deliveryAddress?.phone || '';

      let addrTextY = addrY + 30;

      if (addrParts) {
        doc.fontSize(10).fillColor(dark).text(addrParts, 55, addrTextY);
        addrTextY += 16;
      }
      if (areaLine) {
        doc.fontSize(10).fillColor(dark).text(areaLine, 55, addrTextY);
        addrTextY += 16;
      }
      if (cityLine) {
        doc.fontSize(10).fillColor(dark).text(
          `${cityLine}${pincode ? ' - ' + pincode : ''}`,
          55, addrTextY
        );
        addrTextY += 16;
      }
      if (mobile) {
        doc.fontSize(10).fillColor(gray).text(`Mobile: ${mobile}`, 55, addrTextY);
        addrTextY += 16;
      }

      // ══════════════════════════════════════════
      //  FOOTER
      // ══════════════════════════════════════════
      const footerY = addrTextY + 20;

      if (footerY > 720) {
        doc.addPage();
      }

      doc.moveTo(40, footerY).lineTo(555, footerY).strokeColor(borderColor).lineWidth(0.5).stroke();

      doc.fontSize(9).fillColor(gray).text(
        `Estimated Delivery: ${estimatedDeliveryDays} business days  |  Contact: +91 8733040849  |  farmoracrops@gmail.com`,
        40, footerY + 8, { align: 'center', width: 515 }
      );

      doc.fontSize(10).fillColor(darkGreen).text(
        'Thank you for choosing Farmora Crops!',
        40, footerY + 28, { align: 'center', width: 515 }
      );

      doc.fontSize(7).fillColor(lightGray).text(
        `Generated on ${new Date().toLocaleString('en-IN')}  |  © ${new Date().getFullYear()} Farmora Crops. All rights reserved.`,
        40, footerY + 46, { align: 'center', width: 515 }
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
