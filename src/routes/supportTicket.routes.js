const express = require("express");
const router = express.Router();
// const { upload } = require('../utils/fileUpload');
const checkAuth = require('../middleware/check-auth');

const fileUpload = require('../utils/fileUpload');
const upload = fileUpload("barterFunds/supportTicketFiles");


const { 
  getSupportTickets,
  createSupportTicket,
  getSupportTicketById,
  deleteSupportTicket,
  updateSupportTicket,
  getSupportTicketsByUserId,
  replySupportTicket,
  getSupportTicketsByOfficer
   } = require('../controllers/supportTicket.controllers');


router.get("/", checkAuth, getSupportTickets);
// router.post("/", checkAuth, upload.array('files', 5), createSupportTicket);
router.post("/", checkAuth, upload.single('supportingDocument'), createSupportTicket);
router.get("/x/user", checkAuth, getSupportTicketsByUserId);
router.get("/officer/:officerId", checkAuth, getSupportTicketsByOfficer);
router.get("/:ticketId", checkAuth, getSupportTicketById);
router.patch("/:ticketId", checkAuth, updateSupportTicket);
router.patch("/x/:ticketId", checkAuth, upload.single('supportingDocument'), replySupportTicket);
router.delete("/:ticketId", checkAuth, deleteSupportTicket);

module.exports = router;
