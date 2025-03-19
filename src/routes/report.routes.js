const express = require("express");
const router = express.Router();
const fileUpload = require('../utils/fileUpload');
const upload = fileUpload("microhub/profilePictures");

const {
     createReport,
     getReports,
     getReport,
     updateReport,
     getReportsByOfficerId,
     deleteReport
} = require('../controllers/reports.controllers'); 

const checkAuth = require('../middleware/check-auth');

router.post("/", checkAuth, upload.single('supportingDocument'),  createReport);
router.get("/", checkAuth, getReports);
router.get("/:reportId", checkAuth, getReport);
router.patch("/:reportId", checkAuth, upload.single('supportingDocument'), updateReport);
router.delete("/:reportId", checkAuth, deleteReport);
router.get("/x/:officerId", checkAuth, getReportsByOfficerId);


module.exports = router;
