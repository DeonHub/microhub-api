const express = require("express");
const router = express.Router();
const fileUpload = require('../utils/fileUpload');
const upload = fileUpload("microhub/profilePictures");

const {
     createLoan,
     getLoans,
     getLoan,
     getLoansByOfficer,
     updateLoan,
     deleteLoan
} = require('../controllers/loan.controllers'); 

const checkAuth = require('../middleware/check-auth');

router.post("/", checkAuth, upload.single('collateralDocument'),  createLoan);
router.get("/", checkAuth, getLoans);
router.get("/officer/:officerId", checkAuth, getLoansByOfficer);
router.get("/:loanId", checkAuth, getLoan);
router.patch("/:loanId", checkAuth, updateLoan);
router.delete("/:loanId", checkAuth, deleteLoan);


module.exports = router;
