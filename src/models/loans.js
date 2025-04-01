const mongoose = require('mongoose');
const User = require("./users");
const Client = require("./client");
const Officer = require("./officers");

const loanSchema = mongoose.Schema({
    loanId: { type: String, unique: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
    loanPurpose: { type: String },
    totalAmount: { type: Number },
    amountPaid: { type: Number, default: 0 },
    amountRemaining: { type: Number },
    interestRate: { type: Number },
    repaymentTerm: { type: Number },
    paymentStatus: {type: String, enum: ['fully_paid', 'partially_paid', 'not_paid'], default: 'not_paid' },
    status: { type: String, enum: ['approved', 'denied', 'pending', 'deleted'], default: 'pending' },
    issuedDate: { type: Date },
    repaymentDate: { type: Date },
    assignedOfficer: { type: mongoose.Schema.Types.ObjectId, ref: 'Officer' },
    preferredPaymentSchedule: { type: String, enum: ['monthly', 'quarterly', 'annually', 'one_time'] },
    nextPaymentDate: { type: Date },
    dueDate: { type: Date },
    existingLoan: { type: Boolean, default: false },
    collateralDocument: { type: String },

}, { timestamps: true});



module.exports = mongoose.model('Loan', loanSchema);
