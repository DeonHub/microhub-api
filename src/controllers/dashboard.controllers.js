const mongoose = require("mongoose");
const baseUrl = process.env.BASE_URL;
const Users = require("../models/users");
const Transactions = require("../models/transactions");
const Loans = require("../models/loans");
const Officers = require("../models/officers");
const Clients = require("../models/client");
const Reports = require("../models/reports");
const SupportTickets = require("../models/supportTicket");


const getAdminDashboard = async (req, res, next) => {
    try {
        const users = await Users.find({ isAdmin: false, status: { $ne: 'deleted' } });
        const officers = await Officers.find({ status: { $ne: 'deleted' } });
        const clients = await Clients.find({ status: { $ne: 'deleted' } });
        const loans = await Loans.find({ status: { $ne: 'deleted' }});
        const reports = await Reports.find({ status: { $ne: 'deleted' }});
        const transactions = await Transactions.find({ status: { $ne: 'deleted' } });
        const tickets = await SupportTickets.find({ status: { $ne: 'deleted' } });

        const totalLoans = loans.length;
        const totalReports = reports.length;
        const totalOfficers = officers.length;
        const totalClients = clients.length;
        const totalTransactions = transactions.length;
        const totalTickets = tickets.length;

        const pendingLoans = loans.filter(tx => tx.status === 'pending').length;
        const approvedLoans = loans.filter(tx => tx.status === 'approved').length;
        const pendingTransactions = transactions.filter(tx => tx.status === 'pending').length;

        // Aggregate loans by month and status
        const loanStats = await Loans.aggregate([
            {
                $match: { status: { $in: ['approved', 'pending', 'denied'] } }
            },
            {
                $group: {
                    _id: {
                        month: { $month: "$issuedDate" },
                        status: "$status"
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { "_id.month": 1 }
            }
        ]);

        const formattedLoanStats = Array.from({ length: 12 }, (_, i) => ({
            month: i + 1,
            approved: 0,
            pending: 0,
            denied: 0
        }));

        loanStats.forEach(({ _id, count }) => {
            formattedLoanStats[_id.month - 1][_id.status] = count;
        });

        // Aggregate transactions by type
        const transactionStats = await Transactions.aggregate([
            {
                $group: {
                    _id: "$transactionType",
                    count: { $sum: 1 }
                }
            }
        ]);

        const formattedTransactionStats = {
            deposit: 0,
            withdrawal: 0,
            payment: 0
        };

        transactionStats.forEach(({ _id, count }) => {
            formattedTransactionStats[_id] = count;
        });

        res.status(200).json({
            success: true,
            data: {
                totalOfficers,
                totalClients,
                totalLoans,
                totalReports,
                totalTransactions,
                totalTickets,
                pendingLoans,
                approvedLoans,
                pendingTransactions,
                loanStats: formattedLoanStats,
                transactionStats: formattedTransactionStats
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



const getOfficerDashboard = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const officer = await Officers.findOne({ userId });

        const clients = await Clients.find({ assignedOfficer: officer._id, status: { $ne: 'deleted' } });
        const loans = await Loans.find({ assignedOfficer: officer._id, status: { $ne: 'deleted' } });
        const transactions = await Transactions.find({ officerId: officer._id, status: { $ne: 'deleted' } });
        const reports = await Reports.find({ submittedBy: officer._id, status: { $ne: 'deleted' } });

        const totalClients = clients.length;
        const totalLoans = loans.length;
        const totalTransactions = transactions.length;
        const totalReports = reports.length;

        // Return the aggregated data
        res.status(200).json({
            success: true,
            data: {
                totalClients,
                totalLoans,
                totalTransactions,
                totalReports
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
    getOfficerDashboard
};
