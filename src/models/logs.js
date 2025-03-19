const mongoose = require('mongoose');
const User = require('./users');

const logSchema = mongoose.Schema({
logId: { type: String, unique: true },
officerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Officer' },
details: {  type: String },
action: { type:String },
timestamp: { type: Date, default: Date.now },

}, { timestamps: true });


module.exports = mongoose.model('Log', logSchema);
