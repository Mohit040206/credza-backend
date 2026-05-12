const Owner=require("../models/Owner");
const bcrypt=require("bcryptjs");
const jwt =require("jsonwebtoken")
const { logError } = require("../utils/logger");


exports.register=async(req,res)=>{
    try
    {
        const {name,shopName,phone,password,location}=req.body;

        if(!name || !shopName ||!phone || !password){
            return res.status(400).json({
                success:false,
                message:"All fields are required"
            })
        }
        const existing =await Owner.findOne({phone});
        if(existing){
            return res.status(400).json({
                success:false,
                message:"Owner already exist"
            })
        }
         const hashedPassword=await bcrypt.hash(password,10);

         const owner=await Owner.create({
            name,
            shopName,
            phone,
            password:hashedPassword,
            location
         })

         return res.status(201).json({
            success:true,
            message:"Owner registered",
            data:owner
         })
    }catch(err){
            logError(err);
        return res.status(500).json({
            success:false,
            message:err.message
        })
    }
}

exports.login= async (req,res)=>{
    try{
    const {phone,password}=req.body;

    const owner=await Owner.findOne({phone});
    if(!owner){
        return res.status(404).json({
            success:false,
            message:"Owner not found"
        })
    }
    const isMatch=await bcrypt.compare(password,owner.password);
    if(!isMatch){
        return res.status(400).json({
            success:false,
            message:"Invalid Password"
        })
    }
    const token=jwt.sign(
        {id:owner._id,role:owner.role},
        process.env.SECRET_KEY,
        {expiresIn:"7d"}
    );

    return res.status(200).json({
        success:true,
        message:"Logged in successfully",
        token,
        shopName: owner.shopName
    })
}catch(err){
        logError(err);
    return res.status(500).json({
        success:false,
        message:err.message
    })
}
}

exports.getMe = async (req, res) => {
    try {
        const owner = await Owner.findById(req.user.id).select('-password');
        if (!owner) {
            return res.status(404).json({ success: false, message: "Owner not found" });
        }
        return res.status(200).json({ success: true, data: owner });
    } catch (err) {
        logError(err);
        return res.status(500).json({ success: false, message: err.message });
    }
};