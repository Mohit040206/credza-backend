const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    qty: {
        type: Number,
        required: true
    },
    price: {
        type: Number,
        required: true
    }
});

const ledgerSchema = new mongoose.Schema({
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: true
    },
    products: [productSchema],

    totalAmount: {
        type: Number
    },

    type: {
        type: String,
        enum: ["credit", "debit"],
        required: true
    },

    note: String

}, {
    timestamps: true
});

module.exports = mongoose.model("Ledger", ledgerSchema);