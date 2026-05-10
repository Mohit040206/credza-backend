const express=require("express") 
const router=express.Router();


const customerRoutes=require("./customerRoutes")
const ledgerRoutes=require("./ledgerRoutes")
const authRoutes = require("./authRoutes");


// auth routes
router.use("/auth", authRoutes);

// Customer route
router.use("/customer",customerRoutes);


// ledger routes
router.use("/ledger",ledgerRoutes)



module.exports=router;