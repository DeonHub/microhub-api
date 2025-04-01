const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    firstname: { type: String, required: true },
    surname: { type: String, required: true },
    username: { type: String, default: 'user1234'},
    profilePicture: { type: String },
    email: { type: String, required: true, unique: true, match: /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/},
    password: { type: String, required: false },
    contact: { type: String, required: false },
    dateOfBirth: { type: Date },
    nationality: { type: String },
    gender: { type: String },
    verified: { type: Boolean, default: true },
    status: { type: String, enum: ['active', 'inactive', 'blocked', 'deleted'], default: 'active' },
    role: { type: String, enum: ['admin', 'officer', 'client', 'superadmin'] },
    createdAt: { type: Date, default: Date.now },
    lastLogin: { type: Date }
});


module.exports = mongoose.model('User', userSchema);