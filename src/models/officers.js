const mongoose = require('mongoose');

const officerSchema = mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    officerId: { type: String, required: true },
    residentialAddress: { type: String },
    postalAddress: { type: String },
    town: { type: String },
    maritalStatus: { type: String, enum: ['single', 'married', 'divorced', 'widowed'] },
    emergencyContact: { type: String },
    idType: { type: String },
    idNumber: { type: String },
    idFront: { type: String, required: true },
    idBack: { type: String, required: true }
});


module.exports = mongoose.model('Officer', officerSchema);