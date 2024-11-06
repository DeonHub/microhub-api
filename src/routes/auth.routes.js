const express = require("express");
const router = express.Router();

const { 
    Signup, 
    Login, 
    updatePassword,
    accountActivation,
    forgotPassword,
    resetPassword,
    getUserFromToken,
    getCurrentUser
     } = require('../controllers/auth.controllers');
const checkAuth = require('../middleware/check-auth');


router.post("/signup", Signup);
router.post("/login", Login);
router.post("/account-activation", accountActivation);
router.post("/get-user-from-token", getUserFromToken);
router.post("/update-password", checkAuth, updatePassword);
router.get("/get-current-user", checkAuth, getCurrentUser);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);


module.exports = router;
