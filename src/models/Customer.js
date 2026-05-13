const mongoose=require("mongoose");


const customerSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true,
        trim:true
    },
    phone:{
        type:String,
        required:true,
        match: [/^[0-9]{10}$/, "Enter valid 10-digit phone number"]
    },
    location:{
        type:String,
    },
    ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Owner",
    required: true
}
},{ timestamps: true })

// Composite unique index: same phone allowed for different owners
customerSchema.index({ phone: 1, ownerId: 1 }, { unique: true });

module.exports = mongoose.model("Customer", customerSchema);