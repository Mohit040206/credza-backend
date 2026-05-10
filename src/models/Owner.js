const mongoose = require("mongoose");

const ownerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    shopName: {
        type: String,
        required: true,
        trim: true
    },
    location:{
        type:String,
    },
    phone: {
    type: String,
    required: true,
    unique: true,
    match: [/^[0-9]{10}$/, "Enter valid 10-digit phone number"]
},
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ["owner", "admin"],
        default: "owner"
    }
}, { timestamps: true });

module.exports = mongoose.model("Owner", ownerSchema);