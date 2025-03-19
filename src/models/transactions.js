const mongoose = require('mongoose');
const User = require('./users');


const transactionsSchema = mongoose.Schema({
    transactionId: { type: String, unique: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
    officerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Officer' },
    type: { type: String, enum: ['deposit', 'withdrawal', 'payment'] },
    amount: { type:Number, required: true },
    paymentFor: { type: String, enum: ['loan', 'savings', 'investment'] },
    accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
    loanId: { type: mongoose.Schema.Types.ObjectId , ref: 'Loan' },
    paymentMethod: { type: String, enum: ['cash', 'cheque', 'transfer'] },
    status: { type: String, enum: ['pending', 'approved', 'processing', 'deleted', 'denied'], default: 'pending' },
    timestamp: { type: Date, default: Date.now },
    remarks: { type: String },
});


module.exports = mongoose.model('Transactions', transactionsSchema);