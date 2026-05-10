const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middlewares/authMiddleware");

const {
  addCustomer,
  getOwnerCustomer,
  updateCustomer
} = require("../controllers/customerController");

router.post("/add", verifyToken, addCustomer);
router.get("/get", verifyToken, getOwnerCustomer);
router.put("/:id", verifyToken, updateCustomer);

module.exports = router;
