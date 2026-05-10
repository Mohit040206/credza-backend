const Customer=require("../models/Customer")
const { logError } = require("../utils/logger");



exports.addCustomer=async(req,res)=>{
    try{
        const ownerId=req.user.id;
        const{name,phone,location}=req.body;
        console.log("Incoming:", req.body);

const cleanPhone = phone?.trim();

        if(!name || !phone){
            return res.status(400).json({
                success:false,
                message:"Name and phone number are required"
            })
        }
        const existing= await Customer.findOne({phone: cleanPhone});
        if(existing){
             return res.status(400).json({
                success:false,
                message:"Customer already exist"
            })
        }
        const customer=new Customer({
            name,
            phone:cleanPhone,
            location,
            ownerId
        })
        await customer.save();

        res.status(201).json({
            success:true,
            message:"Customer created successfully",
            data:customer
        })
    }catch(err){
            logError(err);
return res.status(500).json({
    success:false,
    message:err.message,
})
    }
}