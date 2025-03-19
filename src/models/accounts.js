const mongoose = require('mongoose');
const User = require('./users');

const accountSchema =  mongoose.Schema({
    accountId: { type: String, unique: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
    accountType: { type: String, enum: ['savings', 'current', 'fixed'], default: 'savings' },
    balance: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'inactive', 'deleted'], default: 'active' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Accounts', accountSchema);