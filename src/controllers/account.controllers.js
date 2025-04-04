const mongoose = require("mongoose");
const Accounts = require("../models/accounts")
const Users = require("../models/users");
const Officers = require("../models/officers");
const Clients = require("../models/client");


const generateAccountId = (length) => {
    const characters = '0123456789';
    let ticketId = '';
    for (let i = 0; i < length; i++) {
        ticketId += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return ticketId;
};


// create account
const createAccount = (req, res, next) => {
    const { userId, accountType, balance, status } = req.body;
  
    const newAccount = new Accounts({
      accountId: generateAccountId(8),
      userId,
      accountType,
      balance: balance || 0,
      status: status || "active",
    });
  
    newAccount
      .save()
      .then((account) => {
        res.status(201).json({ success: true, message: "Accounts created", account });
      })
      .catch((err) => {
        console.error(err);
        res.status(500).json({ success: false, error: err });
      });
  };



// Get all accounts
const getAccounts = (req, res, next) => {
  const filters = [];
  filters.push({ status: { $ne: "deleted" } });

  const filter = { $and: filters };

  Accounts.find(filter)
  .populate({
    path: 'clientId',
    populate: {
      path: 'userId',
      model: 'User'
    }
  })
    .exec()
    .then((result) => {
      res.status(200).json({
        success: true,
        count: result.length,
        accounts: result,
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ success: false, error: err });
    });
};

// Get a single account by ID
const getAccount = async (req, res, next) => {
  const accountId = req.params.accountId;
  try {
    const account = await Accounts.findById(accountId).exec();
    if (!account) {
      return res.status(404).json({
        success: false,
        message: "No valid entry found for provided account ID",
      });
    }
    res.status(200).json({ success: true, account });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

const getAccountsByOfficer = async (req, res, next) => {
  try {
    const officerId = req.params.officerId;
    const officer = await Officers.findOne({ userId: officerId });

    if (!officer) {
      return res.status(404).json({ success: false, message: "Officer not found" });
    }

    const clients = await Clients.find({ assignedOfficer: officer._id }).select("_id");
    const clientIds = clients.map(client => client._id);

    const accounts = await Accounts.find({ clientId: { $in: clientIds } })
    .populate({
      path: 'clientId',
      populate: {
        path: 'userId',
        model: 'User'
      }
    })
      .exec();

    res.status(200).json({
      success: true,
      count: accounts.length,
      accounts,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};


// Update an account
const updateAccount = (req, res, next) => {
  const accountId = req.params.accountId;
  const updateOps = {};

  for (const propName in req.body) {
    if (Object.prototype.hasOwnProperty.call(req.body, propName)) {
      updateOps[propName] = req.body[propName];
    }
  }

  Accounts.updateOne({ _id: accountId }, { $set: updateOps })
    .exec()
    .then(() => {
      return Accounts.findById(accountId).exec();
    })
    .then((account) => {
      res.status(200).json({
        success: true,
        message: "Accounts updated",
        account,
      });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ success: false, error: err });
    });
};

// Delete an account
const deleteAccount = (req, res, next) => {
  const accountId = req.params.accountId;
  Accounts.deleteOne({ _id: accountId })
    .exec()
    .then(() => {
      res.status(200).json({ success: true, message: "Accounts deleted" });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ success: false, error: err });
    });
};

module.exports = {
  createAccount,
  getAccounts,
  getAccount,
  getAccountsByOfficer,
  updateAccount,
  deleteAccount,
};


