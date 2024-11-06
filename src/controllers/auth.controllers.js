require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Users = require("../models/users");
const Wallet = require("../models/wallet");

const sendMail = require("../utils/sendMail");
const { generateWalletAddress } = require("../controllers/wallet.controllers");
const crypto = require("crypto");


const generateUsername = (name) => {
  const trimmedName = name.trim();
  const randomNumbers = Math.floor(100000 + Math.random() * 900000);
  return trimmedName + randomNumbers;
};

const generateToken = (user) => {
  return jwt.sign(
    { email: user.email, userId: user._id },
    process.env.JWT_KEY,
    { expiresIn: "30d" }
  );
};

const decodeToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_KEY);
  } catch (err) {
    console.error("Error decoding token:", err);
    throw err;
  }
};

const getUserFromToken = async (req, res, next) => {
  try {
    // Extract the token from the request body
    const token = req.body.token;

    if (!token) {
      return res
        .status(400)
        .json({ success: false, message: "Token is required" });
    }

    // Decode the token to extract user information
    const decodedToken = decodeToken(token);

    // Retrieve the user from the database using the user ID from the decoded token
    const user = await Users.findById(decodedToken.userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    } else {
      // Return the retrieved user along with status and message
      return res
        .status(200)
        .json({ success: true, message: "User not found", user: user });
    }
  } catch (err) {
    console.error("Error retrieving user from token:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};


const Login = async (req, res, next) => {
  try {
    const user = await Users.findOne({ email: req.body.email }).exec();

    if (!user || user.status === "deleted" || user.status === "blocked") {
      return res
        .status(401)
        .json({ success: false, message: "Invalid username or password" });
    }

    const result = await bcrypt.compare(req.body.password, user.password);

    if (!result) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid username or password" });
    }

    // Update lastLogin to current date and time
    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user);
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });
    res
      .status(200)
      .json({ success: true, message: "Login successful", token, user });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const Signup = async (req, res, next) => {
  try {
    // Check if any required field is missing
    const requiredFields = [
      "firstname",
      "surname",
      "email",
      "password",
      "contact",
    ];

    const missingFields = requiredFields.filter((field) => !req.body[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    // Check if email already exists
    const existingUser = await Users.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(409).json({
        message:
          "User with email already exists. Please Login to continue or reset password if you have forgotten.",
      });
    }

    // Hash the password
    const hash = await bcrypt.hash(req.body.password, 10);

    // Generate a verification code
    const activationToken = crypto.randomBytes(64).toString("base64");

    // Create and save the user
    const user = new Users({
      _id: new mongoose.Types.ObjectId(),
      firstname: req.body.firstname,
      surname: req.body.surname,
      username: generateUsername(req.body.firstname),
      email: req.body.email,
      password: hash,
      contact: req.body.contact,
      activationToken: activationToken,
      activationTokenExpires: Date.now() + 432000000,
    });

    const result = await user.save();

    // Send the verification code to the user's email
    sendMail(
      req.body.email,
      encodeURIComponent(activationToken),
      "MicroHub Account Activation",
      "account-activation",
      "Thank you for registering with MicroHub",
      "To complete your registration and activate your account, please click on the button below",
      "If you did not sign up for an account with MicroHub, please disregard this email.",
      "Activate Account"
    );

    res.status(201).json({
      success: true,
      message: "Account created successfully.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const accountActivation = async (req, res, next) => {
  const { activationToken } = req.body;
  console.log(activationToken);

  if (!activationToken) {
    return res
      .status(400)
      .json({ success: false, message: "Token is required" });
  }

  try {
    // Find user by token
    const user = await Users.findOne({ activationToken: activationToken });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Invalid or expired activation token",
      });
    }

    if (!user.verified) {
      if (user.activationTokenExpires < Date.now()) {
        return res.status(404).json({
          success: false,
          message: "Invalid or expired activation token",
        });
      }

      user.verified = true;
      user.status = "active";
      user.activationTokenExpires = null;

      // Save the updated user document
      await user.save();

      // Create a wallet for the user
      const wallet = new Wallet({
        _id: new mongoose.Types.ObjectId(),
        userId: user._id,
        walletAddress: generateWalletAddress(64),
      });

      await wallet.save();

      res.status(200).json({
        success: true,
        message: "User account activation successful",
        user: user,
      });
    } else {
      res.status(200).json({
        success: true,
        message: "User account already activated",
        user: user,
      });
    }
  } catch (err) {
    console.error("Error activating account:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const forgotPassword = (req, res, next) => {
  const email = req.body.email;
  const resetToken = crypto.randomBytes(64).toString("base64");

  // Find user by email
  Users.findOne({ email })
    .then((user) => {
      // If user not found, return error
      if (!user) {
        console.log("User not found");
        return res
          .status(201)
          .json({ success: false, message: "User not found" });
      }

      // Debugging: Log user details
      console.log("User found:", user);

      // Update user's reset token and expiry time
      user.resetToken = resetToken;
      user.resetTokenExpires = Date.now() + 432000000;
      user.save();

      // Send reset password email
      sendMail(
        user.email,
        encodeURIComponent(resetToken),
        "MicroHub Account Password Reset Request",
        "reset-password",
        "Greetings from MicroHub",
        "We received a request to reset the password for the MicroHub account associated with this e-mail address. Click the button below to reset your password.",
        "If you did not request this, please ignore this email and your password will remain unchanged.",
        "Reset Password"
      );

      // Send success response
      res
        .status(201)
        .json({
          success: true,
          message: "Reset Password email sent successfully.",
        });
    })
    .catch((err) => {
      // Error handling: Log and return internal server error
      console.error("Error finding user:", err);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    });
};

const resetPassword = async (req, res, next) => {
  const { password, resetToken } = req.body;

  if (!resetToken) {
    return res
      .status(400)
      .json({ success: false, message: "Token is required" });
  }

  try {
    // Find user by token
    const user = await Users.findOne({
      resetToken: resetToken,
      resetTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(404)
        .json({
          success: false,
          message:
            "Invalid or expired reset token. Please request for another password reset link.",
        });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    // Update user password with the new hashed password
    user.password = hash;
    user.resetToken = null;
    user.resetTokenExpires = null;

    // Save the updated user document
    await user.save();

    // Send success response with notification details
    res.status(200).json({
      success: true,
      message: "Password reset successful",
      notification: notification,
    });
  } catch (err) {
    console.error("Error resetting password:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const updatePassword = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    // Fetch the user from the database
    const user = await Users.findById(userId);

    // Check if the user exists
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    // Update the user's password
    user.password = hashedPassword;
    await user.save();


    // Optionally, you can send a success message
    return res
      .status(200)
      .json({
        success: true,
        message: "Password updated successfully",
        notification: notification,
      });
  } catch (error) {
    console.error("Error updating password:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};



const getCurrentUser = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const user = await Users.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Error fetching user:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  Login,
  Signup,
  updatePassword,
  accountActivation,
  forgotPassword,
  resetPassword,
  getUserFromToken,
  getCurrentUser,
};
