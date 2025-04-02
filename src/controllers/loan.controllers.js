const Loan = require("../models/loans");
const mongoose = require("mongoose");
const Client = require("../models/client");
const createLog = require('../utils/createLog');
const Officers = require("../models/officers");

// Function to calculate repayment date based on schedule
const calculateNextPaymentDate = (issuedDate, schedule) => {
  const nextDate = new Date(issuedDate);
  switch (schedule) {
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'quarterly':
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    case 'annually':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
    default:
      nextDate.setMonth(nextDate.getMonth() + 1);
  }
  return nextDate;
};

// Generate Loan ID
const generateLoanId = (length) => {
  const characters = "0123456789";
  let loanId = "";
  for (let i = 0; i < length; i++) {
    loanId += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return `LNE${loanId}`;
};

// Create Loan with computed values
const createLoan = async (req, res) => {
  try {
    const {
      clientId,
      loanPurpose,
      totalAmount,
      interestRate,
      // repaymentTerm,
      preferredPaymentSchedule,
      dueDate
    } = req.body;

    // Calculate interest amount
    const interestAmount = (Number(totalAmount) * (Number(interestRate) / 100));
    const totalPayable = Number(totalAmount) + interestAmount;

    // Compute repayment start date
    const issuedDate = new Date();
    // const dueDate = new Date(issuedDate);
    // dueDate.setFullYear(dueDate.getFullYear() + (Number(repaymentTerm) || 1));
    
    const nextPaymentDate = calculateNextPaymentDate(issuedDate, preferredPaymentSchedule);


    const existingLoans = await Loan.find({ 
      clientId, 
      status: 'approved', 
      paymentStatus: { $ne: 'fully_paid' } 
    }).exec();

    if (existingLoans.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Client already has an existing loan that is not fully paid" 
      });
    }

    const pendingLoans = await Loan.find({
      clientId,
      status: 'pending'
    }).exec();

    if (pendingLoans.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Client already has a pending loan application"
      });
    }

    const client = await Client.findById(clientId);
    const assignedOfficer = client ? client.assignedOfficer : null;


    const newLoan = new Loan({
      loanId: generateLoanId(10),
      clientId,
      loanPurpose,
      totalAmount: totalPayable,
      amountRemaining: totalPayable,
      interestRate,
      // repaymentTerm: repaymentTerm || 1,
      assignedOfficer,
      preferredPaymentSchedule,
      collateralDocument: req.file ? req.file.path : null,
      issuedDate,
      nextPaymentDate,
      dueDate,
      status: 'pending'
    });

    const loan = await newLoan.save();

    const action = "Submitted a new loan request";
    const details = "Officer submitted a new loan request";
    createLog(assignedOfficer, details, action);

    res.status(201).json({ success: true, message: "Loan created successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get all loans (excluding deleted)
const getLoans = async (req, res) => {
  try {
    const loans = await Loan.find({ status: { $ne: "deleted" } })
    .populate({
      path: 'clientId',
      populate: {
        path: 'userId',
        model: 'User'
      }
    })
    .populate({
      path: 'assignedOfficer',
      populate: {
        path: 'userId',
        model: 'User'
      }
    })
      .exec();

    res.status(200).json({ success: true, count: loans.length, loans });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get single loan by ID
const getLoan = async (req, res) => {
  const loanId = req.params.loanId;
  try {
    const loan = await Loan.findById(loanId)
      .populate('clientId')
      .populate('assignedOfficer')
      .exec();

    if (!loan) {
      return res.status(404).json({ success: false, message: "Loan not found" });
    }

    res.status(200).json({ success: true, loan });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};



// get loan by assigned officer
const getLoansByOfficer = async (req, res) => {
  const officerId = req.params.officerId;
  const officer = await Officers.findOne({ userId: officerId });

  try {
    const loans = await Loan.find({ assignedOfficer: officer._id })
    .populate({
      path: 'clientId',
      populate: {
        path: 'userId',
        model: 'User'
      }
    })
      .exec();

    res.status(200).json({ success: true, count: loans.length, loans });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
};


// Update loan - including status update based on payment
const updateLoan = async (req, res) => {
  const loanId = req.params.loanId;
  try {
    const loan = await Loan.findById(loanId);
    if (!loan) {
      return res.status(404).json({ success: false, message: "Loan not found" });
    }

    const updateData = req.body;

    // If payment is made, compute new amountPaid, amountRemaining, and status
    if (updateData.paymentAmount) {
      const payment = Number(updateData.paymentAmount);
      loan.amountPaid += payment;
      loan.amountRemaining = Math.max(loan.totalAmount - loan.amountPaid, 0);

      // Update loan status
      if (loan.amountRemaining === 0) {
        loan.paymentStatus = 'fully_paid';
      } else if (loan.amountPaid > 0) {
        loan.paymentStatus = 'partially_paid';
      }

      // Set the next payment date
      loan.nextPaymentDate = calculateNextPaymentDate(new Date(), loan.preferredPaymentSchedule);
    }

    // Update any other fields sent in the request
    for (const field in updateData) {
      if (field !== 'paymentAmount') {
        loan[field] = updateData[field];
      }
    }

    const updatedLoan = await loan.save();

    res.status(200).json({ success: true, message: "Loan updated", loan: updatedLoan });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
};



// Delete loan (soft delete)
const deleteLoan = async (req, res) => {
  const loanId = req.params.loanId;
  try {
    // await Loan.updateOne({ _id: loanId }, { $set: { status: 'deleted' } });

    // actually delete loan
    await Loan.deleteOne({ _id: loanId });

    res.status(200).json({ success: true, message: "Loan deleted (soft delete)" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = {
  createLoan,
  getLoans,
  getLoan,
  getLoansByOfficer,
  updateLoan,
  deleteLoan
};

