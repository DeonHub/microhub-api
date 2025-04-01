const mongoose = require("mongoose");
const User = require("../models/users");

const bcrypt = require("bcryptjs");
const Officer = require("../models/officers");
const Users = require("../models/users");


// Generate officer id of format ofs-<random 8 digit number>
const generateOfficerId = () => {
  const random = Math.floor(10000000 + Math.random() * 90000000);
  return `OFS${random}`;
}

// Create Officer (creates a user first, then an officer)
const createOfficer = async (req, res, next) => {

  try {
    const {
      firstname,
      surname,
      email,
      contact,
      nationality,
      gender,
      residentialAddress,
      dateOfBirth,
      // Officer-specific fields
      postalAddress,
      town,
      maritalStatus,
      emergencyContact,
      idType,
      idNumber
    } = req.body;

    // Hash password if contact is provided
    let hashedPassword = null;

     // Check if email already exists
     const existingUser = await Users.findOne({ email: req.body.email });
     if (existingUser) {
       return res.status(409).json({
        success: false,
         message:
           "User with email already exists. Please use a different email address",
       });
     }

    if (contact) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(contact, salt);
    }

    // Create User
    const newUser = new User({
      firstname,
      surname,
      email,
      password: hashedPassword,
      contact,
      nationality,
      dateOfBirth,
      gender,
      profilePicture: req.files['profilePicture'][0]['path'],
      role: "officer",
    });

    const savedUser = await newUser.save();

    // Create Officer using savedUser._id
    const newOfficer = new Officer({
      userId: savedUser._id,
      officerId: generateOfficerId(),
      residentialAddress,
      postalAddress,
      town,
      maritalStatus,
      emergencyContact,
      idType,
      idNumber,
      idFront: req.files['idFront'][0]['path'],
      idBack: req.files['idBack'][0]['path'],
    });

    const savedOfficer = await newOfficer.save();

    res.status(201).json({
      success: true,
      message: "Officer created",
      officer: savedOfficer,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
};



// Get all officers (with user populated)
const getOfficers = (req, res, next) => {
  Officer.find()
    .populate("userId")
    .exec()
    .then((officers) => {
      res.status(200).json({
        success: true,
        count: officers.length,
        officers,
      });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ success: false, error: err });
    });
};

// Get officer by ID
const getOfficer = async (req, res, next) => {
  const officerId = req.params.officerId;

  try {
    const officer = await Officer.findById(officerId).populate("userId").exec();

    if (!officer) {
      return res.status(404).json({
        success: false,
        message: "Officer not found",
      });
    }

    res.status(200).json({
      success: true,
      officer,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// Update Officer (dynamically updating officer and linked user fields)
const updateOfficer = async (req, res, next) => {
  const officerId = req.params.officerId;
  const updates = req.body;

  // console.log(updates);

  // Define user model fields to check against
  const userUpdateKeys = [
    'firstname', 'surname', 'profilePicture',
    'contact', 'status', 'nationality'
  ];

  // Separate updates for user and officer dynamically
  const userUpdates = {};
  const officerUpdates = {};

  for (const key in updates) {
    if (key === "_id") continue; // Prevent updating _id

    if (userUpdateKeys.includes(key)) {
      if(key === 'profilePicture' && req.file) {
        userUpdates[key] = req.file ? req.file.path : null;
      } else {
      userUpdates[key] = updates[key];
      }
    } else {
      officerUpdates[key] = updates[key];
    }
  }

  try {
    const officer = await Officer.findById(officerId).exec();
    if (!officer) {
      return res.status(404).json({
        success: false,
        message: "Officer not found",
      });
    }

    // Update officer fields if any
    if (Object.keys(officerUpdates).length > 0) {
      await Officer.updateOne({ _id: officerId }, { $set: officerUpdates });
    }

    // Update linked user fields if any
    if (Object.keys(userUpdates).length > 0 && officer.userId) {
      await User.updateOne({ _id: officer.userId }, { $set: userUpdates });
    }

    const updatedOfficer = await Officer.findById(officerId).populate("userId").exec();

    res.status(200).json({
      success: true,
      message: "Officer updated successfully",
      officer: updatedOfficer,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err });
  }
};


// Delete Officer (and optionally the linked user)
const deleteOfficer = async (req, res, next) => {
  const officerId = req.params.officerId;

  try {
    const officer = await Officer.findById(officerId).exec();

    if (!officer) {
      return res.status(404).json({
        success: false,
        message: "Officer not found",
      });
    }

    // Optionally delete the linked user
    if (officer.userId) {
      await User.deleteOne({ _id: officer.userId });
    }

    // Delete the officer record
    await Officer.deleteOne({ _id: officerId });

    res.status(200).json({
      success: true,
      message: "Officer and linked user deleted",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err });
  }
};

module.exports = {
  createOfficer,
  getOfficers,
  getOfficer,
  updateOfficer,
  deleteOfficer,
};
