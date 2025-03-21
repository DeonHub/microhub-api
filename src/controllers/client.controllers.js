const mongoose = require("mongoose");
const User = require("../models/users");

const bcrypt = require("bcryptjs");
const Client = require("../models/client");
const Account = require("../models/accounts");


// Generate client id of format ofs-<random 8 digit number>
const generateClientId = () => {
  const random = Math.floor(10000000 + Math.random() * 90000000);
  return `CLS${random}`;
}

// Create Client (creates a user first, then an client)
const createClient = async (req, res, next) => {
  try {
    const {
      firstname,
      surname,
      email,
      contact,
      nationality,
      gender,
      residentialAddress,
      postalAddress,
      town,
      maritalStatus,
      emergencyContact,
      idType,
      idNumber,
      employmentStatus,
      jobTitle,
      monthlyIncome,
      otherIncome,
      assignedOfficer
    } = req.body;

    // Hash password if contact is provided
    let hashedPassword = null;
    if (contact) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(contact, salt);
    }

    // Create User
    const newUser = new User({
      firstname,
      surname,
      email,
      profilePicture: req.files['profilePicture'][0]['path'],
      password: hashedPassword,
      contact,
      nationality,
      gender,
      userType: "client",
    });

    const savedUser = await newUser.save();

    // Create Client using savedUser._id
    const newClient = new Client({
      userId: savedUser._id,
      clientId: generateClientId(),
      residentialAddress,
      postalAddress,
      town,
      maritalStatus,
      emergencyContact,
      idType,
      idNumber,
      idFront: req.files['idFront'][0]['path'],
      idBack: req.files['idBack'][0]['path'],
      employmentStatus,
      jobTitle,
      monthlyIncome,
      otherIncome,
      assignedOfficer
    });

    const savedClient = await newClient.save();

    // Generate Account ID
    const generateAccountId = (length) => {
      const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      let accountId = '';
      for (let i = 0; i < length; i++) {
        accountId += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return `ACC${accountId}`;
    };

    // Create Account for Client
    const newAccount = new Account({
      accountId: generateAccountId(10),
      clientId: savedClient._id
    });

    const savedAccount = await newAccount.save();

    res.status(201).json({
      success: true,
      message: "Client and account created successfully",
      client: savedClient,
      account: savedAccount,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
};


// Get all clients (with user populated)
const getClients = (req, res, next) => {
  Client.find()
    .populate("userId") // Populate the user data
    .exec()
    .then((clients) => {
      res.status(200).json({
        success: true,
        count: clients.length,
        clients,
      });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ success: false, error: err });
    });
};

// Get client by ID
const getClient = async (req, res, next) => {
  const clientId = req.params.clientId;

  try {
    const client = await Client.findById(clientId).populate("userId").exec();

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    res.status(200).json({
      success: true,
      client,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// Update Client (dynamically updating client and linked user fields)
const updateClient = async (req, res, next) => {
  const clientId = req.params.clientId;
  const updates = req.body;

  // Define user model fields to check against
  const userUpdateKeys = [
    'firstname', 'surname', 'profilePicture',
    'contact', 'nationality', 'gender', 'status', 'userType'
  ];

  // Separate updates for user and client dynamically
  const userUpdates = {};
  const clientUpdates = {};

  for (const key in updates) {
    if (userUpdateKeys.includes(key)) {
      if(key === 'profilePicture') {
        userUpdates[key] = req.files['profilePicture'][0]['path'];
      } else {
      userUpdates[key] = updates[key];
      }
    } else {
      clientUpdates[key] = updates[key];
    }
  }

  try {
    const client = await Client.findById(clientId).exec();
    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    // Update client fields if any
    if (Object.keys(clientUpdates).length > 0) {
      await Client.updateOne({ _id: clientId }, { $set: clientUpdates });
    }

    // Update linked user fields if any
    if (Object.keys(userUpdates).length > 0 && client.userId) {
      await User.updateOne({ _id: client.userId }, { $set: userUpdates });
    }

    const updatedClient = await Client.findById(clientId).populate("userId").exec();

    res.status(200).json({
      success: true,
      message: "Client updated successfully",
      client: updatedClient,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err });
  }
};


// Delete Client (and optionally the linked user)
const deleteClient = async (req, res, next) => {
  const clientId = req.params.clientId;

  try {
    const client = await Client.findById(clientId).exec();

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    // Optionally delete the linked user
    if (client.userId) {
      await User.deleteOne({ _id: client.userId });
    }

    // Delete the client record
    await Client.deleteOne({ _id: clientId });

    res.status(200).json({
      success: true,
      message: "Client and linked user deleted",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err });
  }
};

module.exports = {
  createClient,
  getClients,
  getClient,
  updateClient,
  deleteClient,
};
