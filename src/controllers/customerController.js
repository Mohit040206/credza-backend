const Customer = require("../models/Customer");
const { logError } = require("../utils/logger");

exports.addCustomer = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const { name, phone, location } = req.body;
    console.log("Incoming:", req.body);

    const cleanPhone = phone?.trim();

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: "Name and phone number are required",
      });
    }
    const existing = await Customer.findOne({ phone: cleanPhone, ownerId });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Customer already exist",
      });
    }
    const customer = new Customer({
      name,
      phone: cleanPhone,
      location,
      ownerId,
    });
    await customer.save();

    res.status(201).json({
      success: true,
      message: "Customer created successfully",
      data: customer,
    });
  } catch (err) {
    logError(err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getOwnerCustomer = async (req, res) => {
  try {
    const ownerId = req.user.id;

    const customer = await Customer.find({ ownerId: req.user.id }).sort({
      createdAt: -1,
    });
    if (!customer) {
      return res.status(400).json({
        success: false,
        message: "No customer finds for this owner",
      });
    }
    return res.status(200).json({
      success: true,
      message: customer.length
        ? "Customer fetched successfully"
        : "No customers found",
      count: customer.length,
      data: customer,
    });
  } catch (err) {
    logError(err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.updateCustomer = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const { id } = req.params;
    const { name, phone, location } = req.body|| {};;

    const customer = await Customer.findOne({
      _id: id,
      ownerId,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found for this owner",
      });
    }

    if (phone && phone.trim() !== customer.phone) {
      const existing = await Customer.findOne({
        phone: phone.trim(),
        ownerId,
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          message: "Phone number already used by another customer",
        });
      }

      customer.phone = phone.trim();
    }

    if (name) customer.name = name.trim();
    if (location) customer.location = location;

    await customer.save();

    return res.status(200).json({
      success: true,
      message: "Customer updated successfully",
      data: customer,
    });
  } catch (err) {
    logError(err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
