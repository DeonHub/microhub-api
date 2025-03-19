const express = require("express");
const router = express.Router();
const fileUpload = require('../utils/fileUpload');
const upload = fileUpload("microhub/clientDocs");


const { createClient,
        getClients,
        getClient,
        updateClient,
        deleteClient
     } = require('../controllers/client.controllers');


const checkAuth = require('../middleware/check-auth');

router.post("/", checkAuth, upload.fields([ { name: 'idFront', maxCount: 1 }, { name: 'idBack', maxCount: 1 }, { name: 'profilePicture', maxCount: 1 }]), createClient);
router.get("/", checkAuth, getClients);
router.get("/:clientId", checkAuth, getClient);
router.patch("/:clientId", checkAuth, upload.fields([ { name: 'idFront', maxCount: 1 }, { name: 'idBack', maxCount: 1 }, { name: 'profilePicture', maxCount: 1 }]), updateClient);
router.delete("/:clientId", checkAuth, deleteClient);


module.exports = router;
