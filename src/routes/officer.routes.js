const express = require("express");
const router = express.Router();
const fileUpload = require('../utils/fileUpload');
const upload = fileUpload("microhub/officerDocs");


const { createOfficer,
        getOfficers,
        getOfficer,
        getOfficerProfile,
        updateOfficer,
        deleteOfficer
     } = require('../controllers/officer.controllers');

const checkAuth = require('../middleware/check-auth');

router.post("/", checkAuth, upload.fields([ { name: 'idFront', maxCount: 1 }, { name: 'idBack', maxCount: 1 }, { name: 'profilePicture', maxCount: 1 }]), createOfficer);
router.get("/", checkAuth, getOfficers);
router.get("/x/profile", checkAuth, getOfficerProfile);
router.get("/:officerId", checkAuth, getOfficer);
router.patch("/:officerId", checkAuth, upload.single('profilePicture'), updateOfficer);
router.delete("/:officerId", checkAuth, deleteOfficer);


module.exports = router;
