const mongoose = require('mongoose');

const reportsSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    generated_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true },
    reportType: { type: String, enum: ['daily_summary', 'client_account_overview'], required: true },
    content: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

reportsSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

reportsSchema.pre('update', function(next) {
    this.updatedAt = new Date();
    next();
});

reportsSchema.pre('find', function(next) {
    this.populate('userId', '');
    next();
});

module.exports = mongoose.model('Reports', reportsSchema);
