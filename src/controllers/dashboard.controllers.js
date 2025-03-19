const mongoose = require("mongoose");
const KYC = require("../models/kyc");
const baseUrl = process.env.BASE_URL;
const Users = require("../models/users");
const Transactions = require("../models/transactions");
const Orders = require("../models/orders");
const Loans = require("../models/loans");
const Officers = require("../models/officers");

const getAdminDashboard = async (req, res, next) => {
    try {
       // Get all users that are not admins and not deleted
        const users = await Users.find({ isAdmin: false, status: { $ne: 'deleted' } });
        const registeredUsers = users.length;

        // Get all loans
        const loans = await Loans.find({ status: { $ne: 'deleted' }});
        const totalLoans = loans.length;

        // get all officers
        const officers = await Officers.find({ status: { $ne: 'deleted' } });

        const totalOfficers = transactions.length;
        // const pendingTransactions = transactions.filter(tx => tx.status === 'pending' || tx.status === 'processing').length;
        // const cancelledTransactions = transactions.filter(tx => tx.status === 'cancelled').length;
        // const successfulTransactions = transactions.filter(tx => tx.status === 'success').length;


        // Get all transactions
        const transactions = await Transactions.find({ status: { $ne: 'deleted' } });

        const totalTransactions = transactions.length;
        const pendingTransactions = transactions.filter(tx => tx.status === 'pending' || tx.status === 'processing').length;
        const cancelledTransactions = transactions.filter(tx => tx.status === 'cancelled').length;
        const successfulTransactions = transactions.filter(tx => tx.status === 'success').length;

        // Get all support tickets
        const tickets = await SupportTickets.find({ status: { $ne: 'deleted' } });

        const totalTickets = tickets.length;
        const pendingTickets = tickets.filter(ticket => ticket.status === 'pending').length;
        const closedTickets = tickets.filter(ticket => ticket.status === 'closed').length;
        const openTickets = tickets.filter(ticket => ticket.status === 'open').length;


        // Return the aggregated data
        res.status(200).json({
            success: true,
            data: {
                
                totalTransactions,
                pendingTransactions,
                cancelledTransactions,
                successfulTransactions,
                totalTickets,
                pendingTickets,
                closedTickets,
                openTickets,
              
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};


const getUserDashboard = async (req, res, next) => {
    try {
        const userId = req.user.userId;

        // Get the user's referral code
        const user = await Users.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        const referralCode = user.referralCode;

        // Get all currencies
        const currencies = await Currencies.find({}).limit(9);

        // Get the user's wallet
        const wallet = await Wallet.findOne({ userId: userId, status: { $ne: 'deleted' }})
            .populate({
                path: 'orderHistory',
                match: { status: { $ne: 'deleted' } },
                select: '-__v'
            })
            .exec();

        // Get all referrals using the user's referral code
        const referrals = await Referrals.countDocuments({ referralCode: referralCode });

        // Return the aggregated data
        res.status(200).json({
            success: true,
            info: {
                currencies: currencies,
                wallet: wallet || {},
                referrals: referrals
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};


module.exports = {
    getAdminDashboard,
    getUserDashboard
};
