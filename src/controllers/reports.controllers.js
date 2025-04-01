const Report = require('../models/reports');
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
const createReport = async (req, res) => {
    try {
        const userId = req.user.userId;

        // find the officer with that userId
        const officer = await Officers.find({ userId }).exec();

        const { title, submittedBy, reportType, content } = req.body;
        
        const newReport = new Report({
            reportId: generateReportId(12),
            title,
            submittedBy: officer ? officer : submittedBy,
            reportType,
            content,
            supportingDocument: req.file ? req.file.path : null
        });

      // Create a log for officer
      const action = "Submitted a new report";
      const details = "Officer submitted a new report";
      createLog(officer, details, action);

        await newReport.save();
        res.status(201).json({ success: true, message: "Report created successfully", report: newReport });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
};

// Get all reports
const getReports = async (req, res) => {
    try {
        const reports = await Report.find({ status: { $ne: "deleted" } })
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
        const report = await Report.findById(req.params.reportId).exec();
        if (!report) {
            return res.status(404).json({ success: false, message: "Report not found" });
        }
        res.status(200).json({ success: true, report });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
};

// Update a report
const updateReport = async (req, res) => {
    try {

        const updateOps = { ...req.body, updatedAt: Date.now() };

        const report = await Report.findByIdAndUpdate(req.params.reportId, updateOps, { new: true }).exec();
        if (!report) {
            return res.status(404).json({ success: false, message: "Report not found" });
        }
        res.status(200).json({ success: true, message: "Report updated", report });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
};

// get reports by officer id
const getReportsByOfficerId = async (req, res) => {
    try {
        const reports = await Report.find({ status: { $ne: "deleted" }, submittedBy: req.params.officerId }).exec();
        res.status(200).json({ success: true, count: reports.length, reports });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
};

// Delete a report
const deleteReport = async (req, res) => {
    try {
        const report = await Report.findByIdAndUpdate(req.params.reportId, { status: "deleted" }, { new: true }).exec();
        if (!report) {
            return res.status(404).json({ success: false, message: "Report not found" });
        }
        res.status(200).json({ success: true, message: "Report deleted", report });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
};

module.exports = { createReport, getReports, getReport, updateReport, deleteReport, getReportsByOfficerId };
