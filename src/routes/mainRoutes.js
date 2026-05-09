const express=require("express") 
const router=express.Router();


const customerRoutes=require("./customerRoutes")
const ledgerRoutes=require("./ledgerRoutes")


// Customer route
router.use("/customer",customerRoutes);


// ledger routes
router.use("/ledger",ledgerRoutes)

module.exports=router;