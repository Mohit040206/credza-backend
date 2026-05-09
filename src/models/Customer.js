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
        unique:true,
         match: [/^[0-9]{10}$/, "Enter valid 10-digit phone number"]

    },
    location:{
        type:String,
    }
},{ timestamps: true })

module.exports = mongoose.model("Customer", customerSchema);