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
    },
    unit: {
        type: String,
        enum: ["piece", "kg", "gram", "liter"],
        default: "piece"
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

    note: String,
    ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Owner",
    required: true
}

}, {
    timestamps: true
});

module.exports = mongoose.model("Ledger", ledgerSchema);