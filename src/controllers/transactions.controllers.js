const Transaction = require('../models/transactions');
const Account = require('../models/accounts');
const Loan = require('../models/loans');
const Client = require('../models/client');


const generateOrderId = () => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let orderId = "";
    for (let i = 0; i < 10; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      orderId += characters[randomIndex];
    }
    return orderId;
  };
  
  // ✅ Create a new transaction
  const createTransaction = async (req, res) => {
    try {
      const {
        clientId,
        type,
        amount,
        paymentFor,
        loanId,
        paymentMethod,
        remarks,
      } = req.body;

    //   find clients account from the account model
        const account = await Account.findOne({ clientId });
        if (!account) {
            return res.status(404).json({ success: false, message: 'Account not found' });
        }

        const client = await Client.findById(clientId);
        const assignedOfficer = client ? client.assignedOfficer : null;

  
      const newTransaction = new Transaction({
        transactionId: generateOrderId(),
        accountId: account._id,
        clientId,
        officerId: assignedOfficer,
        type,
        amount,
        paymentFor,
        loanId: loanId || null,
        paymentMethod,
        remarks
      });
  
      const transaction = await newTransaction.save();
      res.status(201).json({ success: true, message: 'Transaction created', transaction });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  };
  
  // ✅ Get all transactions
  const getTransactions = async (req, res) => {
    try {
      const transactions = await Transaction.find()
        .populate('accountId clientId officerId loanId');
      res.status(200).json({ success: true, count: transactions.length, transactions });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  };
  
  // ✅ Get a single transaction by ID
  const getTransaction = async (req, res) => {
    try {
      const transaction = await Transaction.findOne({ transactionId: req.params.transactionId })
        .populate('accountId clientId officerId loanId');
      if (!transaction) {
        return res.status(404).json({ success: false, message: 'Transaction not found' });
      }
      res.status(200).json({ success: true, transaction });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  };
  
// Reuse this function to calculate the next payment date
const calculateNextPaymentDate = (currentDate, schedule) => {
    const nextDate = new Date(currentDate);
    switch (schedule) {
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'quarterly':
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case 'annually':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
      default:
        nextDate.setMonth(nextDate.getMonth() + 1);
    }
    return nextDate;
  };
  
  const updateTransaction = async (req, res) => {
    try {
      const { transactionId } = req.params;
      const { status } = req.body;
  
      const transaction = await Transaction.findOne({ transactionId });
      if (!transaction) {
        return res.status(404).json({ success: false, message: 'Transaction not found' });
      }
  
      // If transaction is already approved or status is not 'approved', just update status/fields and exit
      if (transaction.status === 'approved' || status !== 'approved') {
        const updatedTransaction = await Transaction.findOneAndUpdate(
          { transactionId },
          { $set: req.body },
          { new: true }
        );
        return res.status(200).json({ success: true, message: 'Transaction updated', transaction: updatedTransaction });
      }

      // Handle deposits
      if (transaction.type === 'deposit') {
        const account = await Account.findById(transaction.accountId);
        if (!account) return res.status(404).json({ success: false, message: 'Account not found' });
  
        account.balance += transaction.amount;
        await account.save();
      }
  
      // Handle withdrawals
      else if (transaction.type === 'withdrawal') {
        const account = await Account.findById(transaction.accountId);
        if (!account) return res.status(404).json({ success: false, message: 'Account not found' });
  
        if (account.balance < transaction.amount) {
          return res.status(400).json({ success: false, message: 'Insufficient account balance' });
        }
  
        account.balance -= transaction.amount;
        await account.save();
      }
  
      // Handle loan payments
      else if (transaction.type === 'payment' && transaction.paymentFor === 'loan') {
        const loan = await Loan.findById(transaction.loanId);
        if (!loan) return res.status(404).json({ success: false, message: 'Loan not found' });
  
        loan.amountPaid += transaction.amount;
        loan.amountRemaining -= transaction.amount;
  
        if (loan.amountRemaining <= 0) {
          loan.paymentStatus = 'fully_paid';
          loan.amountRemaining = 0;
          loan.nextPaymentDate = null; // Loan is cleared
        } else {
          loan.paymentStatus = 'partially_paid';
  
          // ✅ Recalculate next payment date if loan is not fully paid
          const currentNextDate = loan.nextPaymentDate || loan.issuedDate;
          loan.nextPaymentDate = calculateNextPaymentDate(currentNextDate, loan.preferredPaymentSchedule);
        }
  
        await loan.save();
      }
  
      // ✅ Mark transaction as approved after processing
      transaction.status = 'approved';
      const updatedTransaction = await transaction.save();
  
      res.status(200).json({ success: true, message: 'Transaction processed and approved', transaction: updatedTransaction });
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  };
  
  
  // ✅ Delete a transaction
  const deleteTransaction = async (req, res) => {
    try {
      const transaction = await Transaction.findOneAndDelete({ transactionId: req.params.transactionId });
      if (!transaction) {
        return res.status(404).json({ success: false, message: 'Transaction not found' });
      }
      res.status(200).json({ success: true, message: 'Transaction deleted' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  };
  
module.exports = {
    createTransaction,
    getTransactions,
    getTransaction,
    updateTransaction,
    deleteTransaction
};
