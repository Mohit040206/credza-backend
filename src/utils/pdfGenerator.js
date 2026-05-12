const PDFDocument = require("pdfkit");

// 💰 Format currency (Indian style)
const formatCurrency = (amount) => {
  return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
};

// Get unit label for display
const getUnitLabel = (unit) => {
  const labels = {
    piece: "pc",
    kg: "kg",
    gram: "g",
    liter: "L",
  };
  return labels[unit] || "pc";
};

// Format unit price string (e.g., ₹5000/pc, ₹70/g)
const formatUnitPrice = (price, unit) => {
  return `${formatCurrency(price)}/${getUnitLabel(unit)}`;
};

// Format quantity with unit (e.g., 2 pcs, 10 g)
const formatQuantity = (qty, unit) => {
  const unitLabel = getUnitLabel(unit);
  return `${qty} ${unitLabel}`;
};

const generatePDF = (customer, entries, summary, res, owner) => {
  const doc = new PDFDocument({ margin: 40 });

  // Headers
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=${customer.name}_ledger.pdf`
  );

  doc.pipe(res);

  // ===== HEADER BACKGROUND =====
  doc.rect(0, 0, 612, 90).fill("#eef4ff");

  // ===== BRAND =====
  doc
    .fillColor("#2563eb")
    .fontSize(20)
    .text("Credza", 40, 35);

  // ===== SHOP DETAILS =====
  doc
    .fillColor("black")
    .fontSize(10)
    .text(owner?.shopName || "Credza User", 40, 55)
    .text(owner?.name || "")
    .text(owner?.phone || "");

  doc.moveDown(3);

  // ===== CUSTOMER BOX =====
  const customerTop = doc.y;

  doc
    .roundedRect(40, customerTop, 520, 70, 6)
    .stroke("#d1d5db");

  doc
    .fontSize(12)
    .text("Customer Details", 50, customerTop + 5, { underline: true });

  doc
    .fontSize(11)
    .text(`Name: ${customer.name}`, 50, customerTop + 25)
    .text(`Phone: ${customer.phone}`)
    .text(`Location: ${customer.location || "-"}`);

  doc.moveDown(4);

  // ===== ENTRIES =====
  entries.forEach((entry) => {
    // Check if we need a new page (leave room for content)
    if (doc.y > 650) {
      doc.addPage();
    }

    const entryDate = new Date(entry.createdAt).toLocaleDateString("en-IN");
    const typeLabel = entry.type.toUpperCase();
    const typeColor = entry.type === "credit" ? "#dc2626" : "#16a34a";

    // ===== ENTRY HEADER =====
    const entryHeaderY = doc.y;
    doc.rect(40, entryHeaderY, 520, 20).fill("#f0f4ff");

    doc
      .fillColor(typeColor)
      .fontSize(10)
      .text(typeLabel, 50, entryHeaderY + 5);

    doc
      .fillColor("#374151")
      .fontSize(10)
      .text(`Date: ${entryDate}`, 400, entryHeaderY + 5);

    doc.moveDown(0.5);

    if (entry.type === "credit" && entry.products && entry.products.length > 0) {
      // ===== PRODUCT TABLE HEADER =====
      const tableHeaderY = doc.y;
      doc.rect(40, tableHeaderY, 520, 18).fill("#f3f4f6");

      doc
        .fillColor("#374151")
        .fontSize(9)
        .text("Product", 50, tableHeaderY + 4)
        .text("Unit Price", 220, tableHeaderY + 4, { width: 80, align: "right" })
        .text("Quantity", 320, tableHeaderY + 4, { width: 70, align: "right" })
        .text("Total", 420, tableHeaderY + 4, { width: 80, align: "right" });

      doc.moveDown(0.3);

      // ===== PRODUCT ROWS =====
      let entryTotal = 0;

      entry.products.forEach((p) => {
        if (doc.y > 700) {
          doc.addPage();
        }

        const rowY = doc.y;
        const unit = p.unit || "piece";
        const lineTotal = p.qty * p.price;
        entryTotal += lineTotal;

        doc
          .fillColor("#111827")
          .fontSize(10)
          .text(p.name, 50, rowY, { width: 160 });

        doc
          .fillColor("#4b5563")
          .fontSize(9)
          .text(formatUnitPrice(p.price, unit), 220, rowY, { width: 80, align: "right" })
          .text(formatQuantity(p.qty, unit), 320, rowY, { width: 70, align: "right" });

        doc
          .fillColor("#111827")
          .fontSize(10)
          .text(formatCurrency(lineTotal), 420, rowY, { width: 80, align: "right" });

        doc.moveDown(0.4);
      });

      // ===== ENTRY TOTAL ROW =====
      const totalRowY = doc.y;
      doc
        .moveTo(40, totalRowY)
        .lineTo(560, totalRowY)
        .strokeColor("#d1d5db")
        .stroke();

      doc.moveDown(0.2);
      const totalY = doc.y;

      doc
        .fillColor("#111827")
        .fontSize(10)
        .text("Entry Total", 50, totalY, { continued: false });

      doc
        .fontSize(11)
        .text(formatCurrency(entry.totalAmount), 420, totalY, { width: 80, align: "right" });

    } else {
      // ===== DEBIT (PAYMENT) ROW =====
      const paymentY = doc.y;
      doc
        .fillColor("#16a34a")
        .fontSize(10)
        .text("Payment Received", 50, paymentY);

      doc
        .fillColor("#111827")
        .fontSize(11)
        .text(formatCurrency(entry.totalAmount), 420, paymentY, { width: 80, align: "right" });
    }

    // Note
    if (entry.note) {
      doc.moveDown(0.3);
      doc
        .fillColor("#6b7280")
        .fontSize(9)
        .text(`Note: ${entry.note}`, 50);
    }

    // Running balance
    doc.moveDown(0.3);
    const balY = doc.y;
    doc
      .fillColor("#6b7280")
      .fontSize(9)
      .text(`Running Balance: ${formatCurrency(entry.runningBalance)}`, 380, balY, { width: 120, align: "right" });

    doc.moveDown(1.5);

    // Separator line between entries
    doc
      .moveTo(40, doc.y - 5)
      .lineTo(560, doc.y - 5)
      .strokeColor("#e5e7eb")
      .stroke();

    doc.moveDown(0.5);
  });

  doc.moveDown(2);

  // ===== SUMMARY BOX =====
  if (doc.y > 650) {
    doc.addPage();
  }

  const summaryY = doc.y;

  doc
    .roundedRect(350, summaryY, 210, 90, 6)
    .stroke("#d1d5db");

  doc
    .fillColor("#111827")
    .fontSize(12)
    .text("Summary", 360, summaryY + 10, { underline: true });

  doc
    .fontSize(11)
    .text(`Total Credit: ${formatCurrency(summary.totalCredit)}`, 360)
    .text(`Total Debit: ${formatCurrency(summary.totalDebit)}`)
    .text(`Final Balance: ${formatCurrency(summary.balance)}`);

  doc.moveDown(5);

  // ===== FOOTER =====
  doc
    .fontSize(10)
    .fillColor("gray")
    .text("Generated by Credza", { align: "center" });

  doc.end();
};

module.exports = generatePDF;