const mongoose = require('mongoose');
const User = require('./users');

const reportsSchema = mongoose.Schema({
    reportId: { type: String },
    title: { type: String },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Officer', required: true },
    reportType: { type: String, enum: ['daily', 'monthly', 'other'], required: true },
    content: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    supportingDocument: { type: String },
    status: { type: String, enum: ['pending', 'approved', 'denied', 'deleted'], default: 'pending' },
}, { timestamps: true });



module.exports = mongoose.model('Reports', reportsSchema);
