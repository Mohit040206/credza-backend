const PDFDocument = require("pdfkit");

// ================= CLEAN NUMBER =================
const cleanNumber = (val) => {
  return Number(String(val || 0).replace(/[^0-9.-]/g, ""));
};

// ================= FORMAT CURRENCY =================
const formatCurrency = (amount) => {
  const num = cleanNumber(amount);
  const isNegative = num < 0;
  const absNum = Math.abs(num);
  return `${isNegative ? "-" : ""}₹${absNum.toLocaleString("en-IN")}`;
};

// ================= UNIT HELPERS =================
const getUnitLabel = (unit) => {
  const labels = {
    piece: "pc",
    kg: "kg",
    gram: "g",
    liter: "L",
  };
  return labels[unit] || "pc";
};

const formatUnitPrice = (price, unit) => {
  return `${formatCurrency(price)}/${getUnitLabel(unit)}`;
};

const formatQuantity = (qty, unit) => {
  return `${cleanNumber(qty)} ${getUnitLabel(unit)}`;
};

// ================= MAIN FUNCTION =================
const generatePDF = (customer, entries, summary, res, owner) => {
  const doc = new PDFDocument({ margin: 40 });
  
  // Register font to support Rupee symbol (Windows path)
  try {
    doc.font("C:\\Windows\\Fonts\\Arial.ttf");
  } catch (err) {
    console.warn("Arial font not found, falling back to Helvetica");
    doc.font("Helvetica");
  }

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=${customer.name}_ledger.pdf`
  );

  doc.pipe(res);

  // ================= HEADER (DYNAMIC HEIGHT) =================

  const headerStartY = 50;

  // Write first to calculate height
  doc
    .fontSize(10)
    .text(owner?.shopName || "Credza User", 40, headerStartY)
    .text(owner?.name || "")
    .text(owner?.phone || "")
    .text(owner?.location || "");

  const headerEndY = doc.y + 10;

  // Background
  doc.rect(0, 0, 612, headerEndY).fill("#eef4ff");

  // Rewrite content
  doc
    .fillColor("#2563eb")
    .fontSize(20)
    .text("Credza", 40, 20);

  doc
    .fillColor("black")
    .fontSize(10)
    .text(owner?.shopName || "Credza User", 40, headerStartY)
    .text(owner?.name || "")
    .text(owner?.phone || "")
    .text(owner?.location || "");

  doc.y = headerEndY + 20;

  // ================= CUSTOMER BOX =================

  const customerTop = doc.y;

  doc.roundedRect(40, customerTop, 520, 70, 6).stroke("#d1d5db");

  doc
    .fontSize(12)
    .text("Customer Details", 50, customerTop + 5, { underline: true });

  doc
    .fontSize(11)
    .text(`Name: ${customer.name}`, 50, customerTop + 25)
    .text(`Phone: ${customer.phone}`)
    .text(`Location: ${customer.location || "-"}`);

  doc.moveDown(4);

  // ================= ENTRIES =================

  entries.forEach((entry) => {
    if (doc.y > 650) doc.addPage();

    const entryDate = new Date(entry.createdAt).toLocaleDateString("en-IN");
    const typeLabel = entry.type.toUpperCase();
    const typeColor = entry.type === "credit" ? "#dc2626" : "#16a34a";

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

    // ================= CREDIT =================
    if (entry.type === "credit" && entry.products?.length > 0) {
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

      entry.products.forEach((p) => {
        if (doc.y > 700) doc.addPage();

        const rowY = doc.y;
        const unit = p.unit || "piece";

        const price = cleanNumber(p.price);
        const qty = cleanNumber(p.qty);
        const lineTotal = price * qty;

        doc
          .fillColor("#111827")
          .fontSize(10)
          .text(p.name, 50, rowY, { width: 160 });

        doc
          .fillColor("#4b5563")
          .fontSize(9)
          .text(formatUnitPrice(price, unit), 220, rowY, { width: 80, align: "right" })
          .text(formatQuantity(qty, unit), 320, rowY, { width: 70, align: "right" });

        doc
          .fillColor("#111827")
          .fontSize(10)
          .text(formatCurrency(lineTotal), 420, rowY, { width: 80, align: "right" });

        doc.moveDown(0.4);
      });

      const totalRowY = doc.y;

      doc.moveTo(40, totalRowY).lineTo(560, totalRowY).stroke("#d1d5db");

      doc.moveDown(0.2);

      doc.fillColor("#111827").fontSize(10).text("Entry Total", 50);

      doc
        .fontSize(11)
        .text(formatCurrency(entry.totalAmount), 420, doc.y - 12, {
          width: 80,
          align: "right",
        });

    } else {
      // ================= DEBIT =================
      const paymentY = doc.y;

      doc
        .fillColor("#16a34a")
        .fontSize(10)
        .text("Payment Received", 50, paymentY);

      doc
        .fillColor("#111827")
        .fontSize(11)
        .text(formatCurrency(entry.totalAmount), 420, paymentY, {
          width: 80,
          align: "right",
        });
    }

    // ================= NOTE =================
    if (entry.note) {
      doc.moveDown(0.3);
      doc
        .fillColor("#6b7280")
        .fontSize(9)
        .text(`Note: ${entry.note}`, 50);
    }

    // ================= BALANCE =================
    doc.moveDown(0.3);

    doc
      .fillColor("#6b7280")
      .fontSize(9)
      .text(
        `Running Balance: ${formatCurrency(entry.runningBalance)}`,
        380,
        doc.y,
        { width: 120, align: "right" }
      );

    doc.moveDown(1.5);

    doc
      .moveTo(40, doc.y - 5)
      .lineTo(560, doc.y - 5)
      .stroke("#e5e7eb");

    doc.moveDown(0.5);
  });

  // ================= SUMMARY =================

  if (doc.y > 650) doc.addPage();

  const summaryY = doc.y;

  doc.roundedRect(350, summaryY, 210, 90, 6).stroke("#d1d5db");

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

  // ================= FOOTER =================

  doc
    .fontSize(10)
    .fillColor("gray")
    .text("Generated by Credza", { align: "center" });

  doc.end();
};

module.exports = generatePDF;