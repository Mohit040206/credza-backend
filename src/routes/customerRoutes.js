const express=require("express") 
const router=express.Router();


const {addCustomer}=require("../controllers/customerController")


router.post("/add",addCustomer);

module.exports=router;