const mongoose = require('mongoose');
const Logs = require('../models/logs'); 


const generateLogId = () => {
  const characters = '0123456789';
  let logId = '';
  for (let i = 0; i < 8; i++) {
    logId += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return `LOG${logId}`;
}

const createLog = async (officerId, details, action) => {
  try {
    const log = new Logs({
      logId: generateLogId(),
      officerId: officerId,
      details: details,
      action: action
    });

    const result = await log.save();
    return result;

  } catch (err) {
    console.error('Error creating notification:', err);
    throw err;
  }
};

module.exports = createLog;


