const mongoose = require('mongoose');

const clientSchema = mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    clientId: { type: String, required: true },
    residentialAddress: { type: String },
    postalAddress: { type: String },
    town: { type: String },
    maritalStatus: { type: String, enum: ['single', 'married', 'divorced', 'widowed']  },
    emergencyContact: { type: String },
    employmentStatus: { type: String },
    jobTitle: { type: String },
    monthlyIncome: { type: String },
    otherIncome: { type: String },
    assignedOfficer: { type: mongoose.Schema.Types.ObjectId, ref: 'Officer' },
    idType: { type: String },
    idNumber: { type: String },
    idFront: { type: String, required: true },
    idBack: { type: String, required: true }
});


module.exports = mongoose.model('Client', clientSchema);