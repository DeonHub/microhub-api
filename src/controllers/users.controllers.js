const mongoose = require("mongoose");

const Users = require("../models/users");

const createUser = async (req, res, next) => {
  try {
    const { firstname, surname, profilePicture, email, contact, nationality, gender, residentialAddress, status, userType } = req.body;

    // Hash password if provided
    let hashedPassword = null;
    if (contact) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(contact, salt);
    }

    const newUser = new User({
      firstname,
      surname,
      profilePicture,
      email,
      password: hashedPassword,
      contact,
      nationality,
      gender,
      residentialAddress,
      status: status || "active",
      userType: userType || "customer",
    });

    const savedUser = await newUser.save();
    res.status(201).json({ success: true, message: "User created", user: savedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err });
  }
};

const getUsers = (req, res, next) => {
  const filters = []; // Initialize an array to store all filters
  filters.push({ status: { $ne: "deleted" } });

  // Combine all filters into a single filter object using $and
  const filter = { $and: filters };

  Users.find(filter)
    .exec()
    .then((result) => {
      const response = {
        success: true,
        count: result.length,
        users: result,
      };
      res.status(200).json(response);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        success: false,
        error: err,
      });
    });
};

const getUser = async (req, res, next) => {
  const userId = req.params.userId;
  let user;

  try {
    if (mongoose.Types.ObjectId.isValid(userId)) {
      // If userId is a valid ObjectId
      user = await Users.findById(userId).exec();
    } else {
      // If userId is not a valid ObjectId
      user = await Users.findOne({ username: userId }).exec();
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No valid entry found for provided user ID",
      });
    }


    res.status(200).json({
      success: true,
      user: user
 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

const updateUser = (req, res, next) => {
  const userId = req.params.userId;
  const { status } = req.body;
  const updateOps = {};

  if (req.file) {
    updateOps.profilePicture = req.file.path;
  }

  // Iterate over the properties of req.body
  for (const propName in req.body) {
    // Check if the property is not inherited from the prototype chain
    if (Object.prototype.hasOwnProperty.call(req.body, propName)) {
      // Exclude the 'status' field from updateOps if it's provided
      if (propName !== "status") {
        updateOps[propName] = req.body[propName];
      }
    }
  }

  // If status is provided, update it as well
  if (status) {
    updateOps.status = status;
  }

  // Update the user
  Users.updateOne({ _id: userId }, { $set: updateOps })
    .exec()
    .then((result) => {

      Users.findById(userId)
        .exec()
        .then((user) => {
          res.status(200).json({
            success: true,
            message: "User updated",
            user: user,
        
          });
        })
        .catch((err) => {
          res.status(500).json({
            success: false,
            error: err,
          });
        });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({
        success: false,
        error: err,
      });
    });
};

const deleteUser = (req, res, next) => {
  const id = req.params.userId;
  Users.deleteOne({ _id: id })
    .exec()
    .then((result) => {
      res.status(200).json({
        success: true,
        message: "User deleted",
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        success: false,
        error: err,
      });
    });
};

module.exports = {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
};
