const express=require("express") 
const router=express.Router();


const {addEntry,getCustomerLedger,downloadLedgerPDF,sendWhatsAppLink}=require("../controllers/ledgerController")


router.post("/add",addEntry);
router.get("/:customerId",getCustomerLedger)
router.get("/pdf/:customerId", downloadLedgerPDF);
router.get("/whatsapp/:customerId", sendWhatsAppLink);

module.exports=router;