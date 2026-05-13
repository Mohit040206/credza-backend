const express=require("express") 
const router=express.Router();

const {verifyToken}=require("../middlewares/authMiddleware")

const {addEntry,getCustomerLedger,downloadLedgerPDF,sendWhatsAppLink,deleteEntry}=require("../controllers/ledgerController")


router.post("/add",verifyToken,addEntry);
router.get("/:customerId",verifyToken,getCustomerLedger)
router.get("/pdf/:customerId", verifyToken,downloadLedgerPDF);
router.get("/whatsapp/:customerId", verifyToken,sendWhatsAppLink);
router.delete("/:entryId", verifyToken, deleteEntry);


module.exports=router;