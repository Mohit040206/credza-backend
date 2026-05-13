const Ledger = require("../models/Ledger");
const Customer = require("../models/Customer");
const generatePDF = require("../utils/pdfGenerator");
const { logError } = require("../utils/logger");
const Owner = require("../models/Owner");

/**
 * Add Entry (Credit / Debit)
 */
exports.addEntry = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const { customerId, products, type, note, amount } = req.body;

    if (!customerId || !type) {
      return res.status(400).json({
        success: false,
        message: "CustomerId and type are required",
      });
    }

    if (!["credit", "debit"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid type (credit/debit only)",
      });
    }

    // Ownership check
    const customer = await Customer.findOne({
      _id: customerId,
      ownerId,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found for this owner",
      });
    }

    let totalAmount = 0;
    let finalProducts = [];

    if (type === "credit") {
      if (!Array.isArray(products) || products.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Products required for credit entry",
        });
      }

      for (let item of products) {
        if (!item.name || !item.qty || !item.price) {
          return res.status(400).json({
            success: false,
            message: "Each product must have name, qty, and price",
          });
        }

        totalAmount += item.qty * item.price;
      }

      finalProducts = products;
    }

    if (type === "debit") {
      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: "Valid amount is required for debit",
        });
      }

      totalAmount = amount;
      finalProducts = [];
    }

    const entry = new Ledger({
      customerId,
      products: finalProducts,
      totalAmount,
      type,
      note,
      ownerId,
    });

    await entry.save();

    return res.status(201).json({
      success: true,
      message: "Entry added successfully",
      data: entry,
    });
  } catch (err) {
    logError(err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * Get Customer Ledger
 */
exports.getCustomerLedger = async (req, res) => {
  try {
    const { customerId } = req.params;
    const ownerId = req.user.id;

    const { startDate, endDate } = req.query;

    const customer = await Customer.findOne({
      _id: customerId,
      ownerId,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found for this owner",
      });
    }

    let dateFilter = {};

    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      dateFilter = {
        createdAt: {
          $gte: start,
          $lte: end,
        },
      };
    }

    const entries = await Ledger.find({
      customerId,
      ownerId,
      ...dateFilter,
    }).sort({ createdAt: 1 });

    let balance = 0;

    const updatedEntries = entries.map((entry) => {
      if (entry.type === "credit") {
        balance += entry.totalAmount;
      } else {
        balance -= entry.totalAmount;
      }

      return {
        ...entry.toObject(),
        runningBalance: balance,
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        finalBalance: balance,
        entries: updatedEntries,
      },
    });
  } catch (err) {
    logError(err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * Send WhatsApp Link
 */
exports.sendWhatsAppLink = async (req, res) => {
  try {
    const { customerId } = req.params;
    const ownerId = req.user.id;
    const { startDate, endDate } = req.query;

    // Ownership validation
    const customer = await Customer.findOne({
      _id: customerId,
      ownerId,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found for this owner",
      });
    }
    let dateFilter = {};

    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      dateFilter = {
        createdAt: {
          $gte: start,
          $lte: end,
        },
      };
    }

    const entries = await Ledger.find({
      customerId,
      ownerId,
      ...dateFilter,
    });

    if (!entries.length) {
      return res.status(400).json({
        success: false,
        message: "No transactions found for selected date range",
      });
    }

    let totalCredit = 0;
    let totalDebit = 0;

    entries.forEach((e) => {
      if (e.type === "credit") totalCredit += e.totalAmount;
      else totalDebit += e.totalAmount;
    });

    const balance = totalCredit - totalDebit;

    const pdfLink = `https://credza-backend.onrender.com/api/ledger/pdf/${customerId}?startDate=${startDate}&endDate=${endDate}`;

    const message = `
Hello ${customer.name},

Your ledger summary:

Total Credit: ₹${totalCredit.toLocaleString("en-IN")}
Total Debit: ₹${totalDebit.toLocaleString("en-IN")}
Balance: ₹${balance.toLocaleString("en-IN")}

Download full statement:
${pdfLink}

- Credza
`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappLink = `https://wa.me/91${customer.phone}?text=${encodedMessage}`;

    return res.status(200).json({
      success: true,
      link: whatsappLink,
    });
  } catch (err) {
    logError(err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * Download Ledger PDF
 */
exports.downloadLedgerPDF = async (req, res) => {
  try {
    const { customerId } = req.params;
    const ownerId = req.user.id;
    const { startDate, endDate } = req.query;

    const customer = await Customer.findOne({
      _id: customerId,
      ownerId,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found for this owner",
      });
    }
    let dateFilter = {};

    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      dateFilter = {
        createdAt: {
          $gte: start,
          $lte: end,
        },
      };
    }

    const entries = await Ledger.find({
      customerId,
      ownerId,
      ...dateFilter,
    }).sort({ createdAt: 1 });

    if (!entries.length) {
      return res.status(400).json({
        success: false,
        message: "No transactions found for selected date range",
      });
    }

    let totalCredit = 0;
    let totalDebit = 0;
    let balance = 0;

    const updatedEntries = entries.map((entry) => {
      if (entry.type === "credit") {
        totalCredit += entry.totalAmount;
        balance += entry.totalAmount;
      } else {
        totalDebit += entry.totalAmount;
        balance -= entry.totalAmount;
      }

      return {
        ...entry.toObject(),
        runningBalance: balance,
      };
    });

    const summary = {
      totalCredit,
      totalDebit,
      balance,
    };

    const owner = await Owner.findById(ownerId);

    generatePDF(customer, updatedEntries, summary, res, owner);
  } catch (err) {
    logError(err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * Delete Entry
 */
exports.deleteEntry = async (req, res) => {
  try {
    const { entryId } = req.params;
    const ownerId = req.user.id;

    const entry = await Ledger.findOne({ _id: entryId, ownerId });

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: "Entry not found or unauthorized",
      });
    }

    await Ledger.findByIdAndDelete(entryId);

    return res.status(200).json({
      success: true,
      message: "Entry deleted successfully",
    });
  } catch (err) {
    logError(err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};