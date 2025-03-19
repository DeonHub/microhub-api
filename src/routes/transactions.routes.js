const express = require("express");
const router = express.Router();
// const { upload } = require('../utils/fileUpload');
const checkAuth = require('../middleware/check-auth');

const fileUpload = require('../utils/fileUpload');
const upload = fileUpload("barterFunds/transactionFiles");

const { 
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
   } = require('../controllers/transactions.controllers');


router.get("/", checkAuth, getTransactions);
router.post("/",  checkAuth, createTransaction);
router.patch("/:transactionId", checkAuth, upload.single('paymentProof'), updateTransaction);
router.delete("/:transactionId", checkAuth, deleteTransaction);

module.exports = router;
