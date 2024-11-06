const mongoose = require('mongoose');

const transactionsSchema = mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    transactionId: { type: String, required: true },
    referenceId: { type: String },
    transactionType: {
        type: String,
        enum: ['buy', 'sell', 'send', 'receive'],
        required: true
      },
    amount: { type: Number, required: true },  

    paymentSuccess: { type: Boolean, default: false },

    paymentMethod: {
        type: String,
        enum: ['momo', 'credit-card', 'wallet', 'bank', '']
    },

    paymentNumber: { type: String },
    status: { type: String, enum: ['pending', 'success', 'cancelled', 'failed', 'deleted', 'processing'], default: 'pending' },

    paymentProof: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});


transactionsSchema.pre('find', function(next) {
    this.populate('userId', '');
    this.populate('currencyId', '')
    next();
});

transactionsSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

transactionsSchema.pre('update', function(next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('Transactions', transactionsSchema);