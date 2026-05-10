const express=require("express") 
const router=express.Router();

const {verifyToken}=require("../middlewares/authMiddleware")

const {addCustomer}=require("../controllers/customerController")


router.post("/add",verifyToken,addCustomer);

module.exports=router;