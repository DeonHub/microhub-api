const Log = require('../models/logs');
const mongoose = require('mongoose');

const generateLogId = (length) => {
    const characters = "0123456789";
    let ticketId = "";
    for (let i = 0; i < length; i++) {
      ticketId += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }
    return ticketId;
  };

// Create a log entry
const createLog = (req, res, next) => {
    const { officerId, details, action } = req.body;
    
    const newLog = new Log({
        logId: generateLogId(8),
        officerId,
        details,
        action
    });
    
    newLog.save()
        .then((log) => {
            res.status(201).json({ success: true, message: "Log entry created", log });
        })
        .catch((err) => {
            console.error(err);
            res.status(500).json({ success: false, error: err });
        });
};

// Get all logs
const getLogs = (req, res, next) => {
    Log.find()
    .populate({
        path: 'officerId',
        populate: {
          path: 'userId',
          model: 'User'
        }
      })
        .exec()
        .then((logs) => {
            res.status(200).json({ success: true, count: logs.length, logs });
        })
        .catch((err) => {
            console.error(err);
            res.status(500).json({ success: false, error: err });
        });
};

// Get a single log by ID
const getLog = async (req, res, next) => {
    const logId = req.params.logId;
    try {
        const log = await Log.findById(logId).exec();
        if (!log) {
            return res.status(404).json({ success: false, message: "No valid entry found for provided log ID" });
        }
        res.status(200).json({ success: true, log });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
};

// Delete a log
const deleteLog = (req, res, next) => {
    const logId = req.params.logId;
    Log.deleteOne({ _id: logId })
        .exec()
        .then(() => {
            res.status(200).json({ success: true, message: "Log entry deleted" });
        })
        .catch((err) => {
            console.error(err);
            res.status(500).json({ success: false, error: err });
        });
};

module.exports = { createLog, getLogs, getLog, deleteLog };
