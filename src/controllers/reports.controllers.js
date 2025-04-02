const Reports = require('../models/reports');
const Officers = require('../models/officers');
const createLog = require('../utils/createLog');



const generateReportId = (length) => {
  const characters = "0123456789";
  let ticketId = "";
  for (let i = 0; i < length; i++) {
    ticketId += characters.charAt(
      Math.floor(Math.random() * characters.length)
    );
  }
  return `RPT${ticketId}`;
};

// Create a new report
const createReport = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const officer = await Officers.findOne({ userId }).exec();

        const { title, reportType, content } = req.body;

        
        const newReport = new Reports({
            reportId: generateReportId(12),
            title,
            submittedBy: officer,
            reportType,
            content,
            supportingDocument: req.file ? req.file.path : null
        });

      // Create a log for officer
      const action = "Submitted a new report";
      const details = "Officer submitted a new report";
      try{
        createLog(officer, details, action);
      }catch(err){
        console.log("Error")
        }

        await newReport.save();
        res.status(201).json({ success: true, message: "Reports created successfully", report: newReport });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
};

// Get all reports
const getReports = async (req, res) => {
    try {
        const reports = await Reports.find({ status: { $ne: "deleted" } })
        .populate({
        path: 'submittedBy',
        populate: {
            path: 'userId',
            model: 'User'
        }
    }).exec();
        res.status(200).json({ success: true, count: reports.length, reports });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
};

// Get a single report by ID
const getReport = async (req, res) => {
    try {
        const report = await Reports.findById(req.params.reportId).exec();
        if (!report) {
            return res.status(404).json({ success: false, message: "Reports not found" });
        }
        res.status(200).json({ success: true, report });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
};


const getReportsByOfficer = async (req, res) => {
    const officerId = req.params.officerId;
    const officer = await Officers.findOne({ userId: officerId });
  
    try {
      const reports = await Reports.find({ status: { $ne: "deleted" }, submittedBy: officer._id })
      .populate({
        path: 'submittedBy',
        populate: {
            path: 'userId',
            model: 'User'
        }
    })
        .exec();
  
      res.status(200).json({ success: true, count: reports.length, reports });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: err.message });
    }
  };

// Update a report
const updateReport = async (req, res) => {
    try {

        const updateOps = { ...req.body, updatedAt: Date.now() };

        const report = await Reports.findByIdAndUpdate(req.params.reportId, updateOps, { new: true }).exec();
        if (!report) {
            return res.status(404).json({ success: false, message: "Reports not found" });
        }
        res.status(200).json({ success: true, message: "Reports updated", report });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
};


// Delete a report
const deleteReport = async (req, res) => {
    try {
        const report = await Reports.findByIdAndUpdate(req.params.reportId, { status: "deleted" }, { new: true }).exec();
        if (!report) {
            return res.status(404).json({ success: false, message: "Reports not found" });
        }
        res.status(200).json({ success: true, message: "Reports deleted", report });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
};

module.exports = { getReportsByOfficer, createReport, getReports, getReport, updateReport, deleteReport };
