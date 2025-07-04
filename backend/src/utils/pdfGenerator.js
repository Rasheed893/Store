const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
// const QRCode = require("qrcode");
const bucket = require("../firebase/config");
const Reshaper = require("js-arabic-reshaper");
const bidi = require("bidi-js");

const generateInvoicePDF = async (
  orderId,
  products,
  subtotal,
  vat,
  shipping,
  grandTotal,
  city,
  customerName,
  email,
  phone,
  address,
  deliveryNotes = "", // optional
  paymentId,
  discount
) => {
  const tempDir = path.join(__dirname, "../temp");
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  const pdfPath = path.join(tempDir, `invoice-${orderId}.pdf`);
  const doc = new PDFDocument({ margin: 50 });

  const robotoPath = path.join(__dirname, "../assets/fonts/Roboto-Regular.ttf");
  const arabicFontPath = path.join(
    __dirname,
    "../assets/fonts/NotoSansArabic-Black.ttf"
  );

  doc.registerFont("Roboto", robotoPath);
  doc.registerFont("Arabic", arabicFontPath);

  doc.pipe(fs.createWriteStream(pdfPath));

  const reshapeAndReorderArabic = (text) => {
    try {
      const safeText = typeof text === "string" ? text : String(text);
      if (safeText.trim().length === 0) return safeText;

      const words = safeText.trim().split(/\s+/);

      // Check if all words are Arabic
      const allArabic = words.every((word) => /[\u0600-\u06FF]/.test(word));

      const reshapedWords = words.map((word) =>
        /[\u0600-\u06FF]/.test(word) ? Reshaper.reshape(word) : word
      );

      // Reverse word order only if fully Arabic
      return allArabic
        ? reshapedWords.reverse().join(" ")
        : reshapedWords.join(" ");
    } catch (error) {
      console.error("Arabic processing failed:", { input: text, error });
      return typeof text === "string" ? text : "";
    }
  };

  const drawSmartText = (text, x, y, options = {}, fontWeight = "normal") => {
    if (typeof text !== "string") text = String(text);

    const arabicRegex = /[\u0600-\u06FF]/;
    if (arabicRegex.test(text)) {
      doc.font("Arabic");
      text = reshapeAndReorderArabic(text);
      options = { ...options, align: options.align || "right" };
    } else {
      doc.font(fontWeight === "bold" ? "Helvetica-Bold" : "Roboto");
    }

    return doc.text(text, x, y, options);
  };

  doc.pipe(fs.createWriteStream(pdfPath));

  // Header & Logo
  const logoPath = path.join(__dirname, "../assets/RFS.png");
  if (fs.existsSync(logoPath)) {
    doc.link(50, 45, 50, 50, "http://localhost:5173/"); // clickable
    doc.image(logoPath, 50, 45, { width: 50 });
  }

  // company info (left column)
  doc
    .font("Roboto")
    .fontSize(18)
    .fillColor("#333")
    .text("Your Company Name", 110, 50);

  doc
    .fontSize(10)
    .fillColor("#555")
    .text("123 Business Rd.", 110, doc.y + 2)
    .text("Business City, BC 12345")
    .text("Phone: (123) 456-7890");

  // doc.fontSize(20).fillColor("#333333");
  // drawSmartText("Your Company Name", 160, 50);

  // doc.fontSize(10).fillColor("#555");
  // drawSmartText("123 Business Rd.", 160, 75);
  // drawSmartText("Business City, BC 12345", 160, 90);
  // drawSmartText("Phone: (123) 456-7890", 160, 105);

  const invoiceDate = new Date();

  // Invoice Metadata Box (Left-Aligned)
  // =========================================================
  const META_BOX = {
    x: 350, // Base X position
    y: 50, // Base Y position
    labelWidth: 70, // Width for bold labels
    valueOffset: 70, // Starting X position for values
    lineHeight: 16, // Line height in points
    bgOpacity: 0.1, // Background opacity
    textGap: 4, // Space between label and value
  };

  const metaEntries = [
    { label: "Date", value: invoiceDate.toLocaleDateString() },
    { label: "City", value: city },
    { label: "Invoice #", value: orderId },
    ...(paymentId ? [{ label: "Payment Ref", value: paymentId }] : []),
  ];

  // Calculate dynamic box height
  const boxHeight = metaEntries.length * META_BOX.lineHeight + 10;

  // Draw background
  doc
    .rect(META_BOX.x - 5, META_BOX.y - 5, 220, boxHeight)
    .fillOpacity(META_BOX.bgOpacity)
    .fill("#2c3e50")
    .fillOpacity(1);

  // Draw metadata items
  let currentY = META_BOX.y;
  metaEntries.forEach((entry) => {
    // Draw bold label
    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor("#333")
      .text(`${entry.label}:`, META_BOX.x, currentY, {
        width: META_BOX.labelWidth,
        align: "left",
      });

    // Draw value with gap
    doc
      .font("Helvetica")
      .text(
        entry.value,
        META_BOX.x + META_BOX.labelWidth + META_BOX.textGap,
        currentY,
        {
          width: 140,
          align: "left",
        }
      );

    currentY += META_BOX.lineHeight;
  });

  // Optional border
  doc.rect(META_BOX.x - 5, META_BOX.y - 5, 220, boxHeight).stroke("#eee");

  // doc.fontSize(12).fillColor("#333");
  // drawSmartText(`Date: ${invoiceDate.toLocaleDateString()}`, 400, 65, {
  //   align: "right",
  // });
  // drawSmartText(`City: ${city}`, 400, 80, { align: "right" });
  // drawSmartText(`Invoice Number: ${orderId}`, 400, 95, { align: "right" });

  // if (paymentId) {
  //   drawSmartText(`Payment Ref: ${paymentId}`, 400, 110, { align: "right" });
  // }
  // doc
  //   .moveTo(50, metaY + boxHeight + 50)
  //   .lineTo(550, metaY + boxHeight + 50)
  //   .lineWidth(1)
  //   .strokeColor("#ccc")
  //   .stroke();

  doc.moveTo(50, 130).lineTo(550, 130).stroke();

  doc.fontSize(20).fillColor("#333");
  drawSmartText("TAX INVOICE", 50, 140, { align: "center" });

  doc.fontSize(12).fillColor("#000");
  drawSmartText("Customer Details:", 50, 180);
  doc.fontSize(10);
  drawSmartText(`Name: ${customerName}`, 50, 200);
  drawSmartText(`Email: ${email}`, 50, 215);
  drawSmartText(`Phone: ${phone}`, 50, 230);
  const reshapedCity = reshapeAndReorderArabic(address.city || "");
  const reshapedState = reshapeAndReorderArabic(address.state || "");
  const reshapedCountry = reshapeAndReorderArabic(address.country || "");
  const reshapedZip = reshapeAndReorderArabic(address.zipcode || "");

  doc.font("Roboto").fontSize(10);
  doc.text("Address: ", 50, 245, { continued: true });

  doc.font("Arabic");
  doc.text(
    `${reshapedCity}, ${reshapedState}, ${reshapedCountry} - ${reshapedZip}`,
    { align: "left" }
  );

  doc.moveTo(50, 270).lineTo(550, 270).stroke();
  doc.fontSize(12).fillColor("#000");
  drawSmartText("Order Summary:", 50, 290);

  let tableTop = 310;
  const colPositions = { qty: 50, product: 90, price: 330, total: 410 };
  const colWidths = { qty: 30, product: 240, price: 80, total: 80 };

  // Table Header
  doc.rect(50, tableTop, 500, 20).fill("#f0f0f0").stroke();
  doc.fillColor("#000").fontSize(12);
  drawSmartText("Qty", colPositions.qty, tableTop + 4, {
    width: colWidths.qty,
  });
  drawSmartText("Product", colPositions.product, tableTop + 4, {
    width: colWidths.product,
  });
  drawSmartText("Price (AED)", 350, tableTop + 4, {
    width: 100,
    align: "right",
  });
  drawSmartText("Total (AED)", 450, tableTop + 4, {
    width: 100,
    align: "right",
  });

  tableTop += 30;
  doc.moveTo(50, tableTop).lineTo(550, tableTop).stroke();
  tableTop += 10;

  // Product Rows
  products.forEach((item) => {
    const itemTotal = item.quantity * item.price;
    const trimmedName =
      item.productName.length > 40
        ? item.productName.slice(0, 37) + "..."
        : item.productName;

    doc.fontSize(12);
    drawSmartText(item.quantity, colPositions.qty, tableTop, {
      width: colWidths.qty,
    });
    drawSmartText(trimmedName, colPositions.product, tableTop, {
      width: colWidths.product,
    });
    drawSmartText(item.price.toFixed(2), 350, tableTop, {
      width: 100,
      align: "right",
    });
    drawSmartText(itemTotal.toFixed(2), 450, tableTop, {
      width: 100,
      align: "right",
    });

    tableTop += 20;
  });

  doc.moveTo(50, tableTop).lineTo(550, tableTop).stroke();
  tableTop += 10;

  // Totals
  const totalsStartX = 400;
  const totalsWidth = 150;

  doc.fontSize(12);
  drawSmartText(
    `Subtotal: AED ${subtotal.toFixed(2)}`,
    totalsStartX,
    tableTop,
    {
      width: totalsWidth,
      align: "right",
    }
  );
  tableTop += 20;
  doc.fontSize(12);
  drawSmartText(
    `Discount: AED -${discount.toFixed(2)}`,
    totalsStartX,
    tableTop,
    {
      width: totalsWidth,
      align: "right",
    }
  );
  tableTop += 20;

  drawSmartText(`VAT (5%): AED ${vat}`, totalsStartX, tableTop, {
    width: totalsWidth,
    align: "right",
  });
  tableTop += 20;

  drawSmartText(`Shipping: AED ${shipping}`, totalsStartX, tableTop, {
    width: totalsWidth,
    align: "right",
  });
  tableTop += 20;

  drawSmartText(
    `Grand Total: AED ${grandTotal}`,
    totalsStartX,
    tableTop,
    {
      width: totalsWidth,
      align: "right",
    },
    "bold"
  );

  doc.font("Roboto");
  tableTop += 30;

  tableTop += 30;

  // Payment Method
  doc.fontSize(12).fillColor("#000");
  drawSmartText("Payment Method: Card", 50, tableTop);
  tableTop += 20;

  // Order Notes
  if (deliveryNotes) {
    doc.fontSize(12).fillColor("#000");
    drawSmartText("Order Notes:", 50, tableTop);
    doc.fontSize(10).fillColor("#444");
    drawSmartText(deliveryNotes, 50, tableTop + 15, {
      width: 500,
      align: "center",
    });
    tableTop += 45;
  }

  // // QR Code
  // const qrText = `http://localhost:5173/invoice/${orderId}`;
  // const qrImagePath = path.join(tempDir, `qr-${orderId}.png`);
  // await QRCode.toFile(qrImagePath, qrText, { width: 150 });

  // doc.image(qrImagePath, 400, tableTop + 10, { width: 100 });
  // doc.fontSize(8).text("Scan to view online", 400, tableTop + 115);

  // Footer
  const footerY = tableTop + 150 > 700 ? tableTop + 130 : 700;

  doc.fontSize(10);
  doc.fillColor("gray");
  drawSmartText(
    "Note: This invoice is valid for download for 7 days from the issue date.",
    50,
    footerY,
    {
      width: 500,
      align: "center",
    }
  );

  doc.fontSize(12);
  doc.fillColor("#333");
  drawSmartText("Thank you for your purchase!", 50, footerY + 20, {
    align: "center",
  });

  doc.end();
  await new Promise((resolve) => doc.on("end", resolve));

  // Upload
  const firebaseFileName = `invoices/invoice-${orderId}.pdf`;
  await bucket.upload(pdfPath, {
    destination: firebaseFileName,
    metadata: { contentType: "application/pdf" },
  });
  const file = bucket.file(firebaseFileName);
  const [url] = await file.getSignedUrl({
    action: "read",
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
  });

  // Cleanup
  // fs.unlinkSync(pdfPath);
  // if (fs.existsSync(qrImagePath)) fs.unlinkSync(qrImagePath);

  return url;
};

module.exports = { generateInvoicePDF };
