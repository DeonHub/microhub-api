const express = require("express");
const router = express.Router();
const fileUpload = require('../utils/fileUpload');
const upload = fileUpload("microhub/profilePictures");

const {
     createLog,
     getLogs,
     getLog,
     deleteLog
} = require('../controllers/logs.controllers'); 

const checkAuth = require('../middleware/check-auth');

router.post("/", checkAuth, createLog);
router.get("/", checkAuth, getLogs);
router.get("/:logId", checkAuth, getLog);
router.delete("/:logId", checkAuth, deleteLog);


module.exports = router;
