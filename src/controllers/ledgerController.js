const Ledger=require("../models/Ledger");
const Customer=require("../models/Customer")
const generatePDF = require("../utils/pdfGenerator");

exports.addEntry = async (req, res) => {
    try {
        const { customerId, products, type, note, amount } = req.body;


        if (!customerId || !type) {
            return res.status(400).json({
                success: false,
                message: "CustomerId and type are required"
            });
        }

        if (!["credit", "debit"].includes(type)) {
            return res.status(400).json({
                success: false,
                message: "Invalid type (credit/debit only)"
            });
        }

        
        const customer = await Customer.findById(customerId);
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        let totalAmount = 0;
        let finalProducts = [];

        if (type === "credit") {

            if (!Array.isArray(products) || products.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Products required for credit entry"
                });
            }

            for (let item of products) {
                if (!item.name || !item.qty || !item.price) {
                    return res.status(400).json({
                        success: false,
                        message: "Each product must have name, qty, and price"
                    });
                }

                totalAmount += item.qty * item.price;
            }

            finalProducts = products;
        }

        else if (type === "debit") {

            if (!amount || amount <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "Valid amount is required for debit"
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
            note
        });

        await entry.save();

        return res.status(201).json({
            success: true,
            message: "Entry added successfully",
            data: entry
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};


exports.getCustomerLedger = async (req, res) => {
    try {
        const { customerId } = req.params;

        const entries = await Ledger.find({ customerId })
            .sort({ createdAt: 1 }); // ASC for running calc

        let balance = 0;

        const updatedEntries = entries.map(entry => {

            if (entry.type === "credit") {
                balance += entry.totalAmount;
            } else {
                balance -= entry.totalAmount;
            }

            return {
                ...entry.toObject(),
                runningBalance: balance
            };
        });

        return res.status(200).json({
            success: true,
            data: {
              finalBalance: balance,
                entries: updatedEntries,
            }
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};





exports.downloadLedgerPDF = async (req, res) => {
    try {
        const { customerId } = req.params;

        const customer = await Customer.findById(customerId);
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        const entries = await Ledger.find({ customerId })
            .sort({ createdAt: 1 });

        let totalCredit = 0;
        let totalDebit = 0;
        let balance = 0;

        const updatedEntries = entries.map(entry => {
            if (entry.type === "credit") {
                totalCredit += entry.totalAmount;
                balance += entry.totalAmount;
            } else {
                totalDebit += entry.totalAmount;
                balance -= entry.totalAmount;
            }

            return {
                ...entry.toObject(),
                runningBalance: balance
            };
        });

        const summary = {
            totalCredit,
            totalDebit,
            balance
        };

        generatePDF(customer, updatedEntries, summary, res);

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};