const express = require("express")
const app = express();
const morgan = require("morgan");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
require('dotenv').config();


// const dashboardRoutes = require("./src/routes/dashboard.routes");
// const kycRoutes = require("./src/routes/kyc.routes");
const userRoutes = require('./src/routes/users.routes');
const authRoutes = require('./src/routes/auth.routes');
const officerRoutes = require('./src/routes/officer.routes');
const clientRoutes = require('./src/routes/client.routes');
const loanRoutes = require('./src/routes/loan.routes');
const accountRoutes = require('./src/routes/account.routes');
const reportRoutes = require('./src/routes/report.routes');
const logRoutes = require('./src/routes/log.routes');
const ticketRoutes = require('./src/routes/supportTicket.routes');
const transactionRoutes = require('./src/routes/transactions.routes');
const dashboardRoutes = require('./src/routes/dashboard.routes');

const mode = process.env.MODE;
let dbUser, dbPassword, uri;


dbUser = process.env.DB_USER_DEV;
dbPassword = process.env.DB_PASSWORD_DEV;
uri = `mongodb+srv://${dbUser}:${dbPassword}@deonhub.g1umm8e.mongodb.net/microhub?retryWrites=true&w=majority`;


mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;

db.on('error', (error) => {
  console.error('Error connecting to MongoDB:', error);
});

db.once('open', () => {
  console.log('Connected to MongoDB successfully!');
});

mongoose.Promise = global.Promise;


app.use(morgan("dev"));
app.use('/uploads', express.static('uploads'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
    return res.status(200).json({});
  }
  next();
});

// Routes which should handle requests
app.use("/dashboard", dashboardRoutes);
app.use("/users", userRoutes);
app.use("/auth", authRoutes);
app.use("/officers", officerRoutes);
app.use("/clients", clientRoutes);
app.use("/loans", loanRoutes);
app.use("/accounts", accountRoutes);
app.use("/reports", reportRoutes);
app.use("/logs", logRoutes);
app.use("/tickets", ticketRoutes);
app.use("/transactions", transactionRoutes);



app.use((req, res, next) => {
  if (req.url === '/') {
    res.status(200).send('Welcome to MicroHub API 1.0.0');
  } else {
    const error = new Error('Not found');
    error.status = 404;
    next(error);
  }
});


app.use((req, res, next) => {
  const error = new Error("Not found");
  error.status = 404;
  next(error);
});


app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
    error: {
      message: error.message
    }
  });
});

module.exports = app;