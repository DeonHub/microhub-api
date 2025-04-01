const mongoose = require('mongoose');
const User = require('./users');


const transactionsSchema = mongoose.Schema({
    transactionId: { type: String, unique: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
    officerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Officer' },
    transactionType: { type: String, enum: ['deposit', 'withdrawal', 'payment'] },
    amount: { type:Number, required: true },
    paymentMethod: { type: String },
    status: { type: String, enum: ['pending', 'approved', 'processing', 'deleted', 'denied'], default: 'pending' },
    paymentProof: { type: String },
    notes: { type: String },
}, { timestamps: true});


module.exports = mongoose.model('Transactions', transactionsSchema);