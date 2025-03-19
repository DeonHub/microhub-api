const express = require("express");
const router = express.Router();
const checkAuth = require('../middleware/check-auth');

const { 
  getAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
  } = require('../controllers/account.controllers');


router.get("/", checkAuth, getAccounts);
router.post("/", checkAuth, createAccount);
router.patch("/:accountId", checkAuth, updateAccount);
router.delete("/:accountId", checkAuth, deleteAccount);

module.exports = router;
