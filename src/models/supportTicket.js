const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['user', 'admin'], required: true },
    message: { type: String, required: true },
    files: [{ 
      description: String,
      originalName: String,
      path: String,
    }],
    createdAt: { type: Date, default: Date.now }
  });
  

const supportTicketSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    ticketId: { type: String, required: true },
    officerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Officer', required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    reviewer: { type: String },
    category: { type: String , default: 'Customer Service and General Inquiries'},
    comments: { type: String, default: '' },
    feedback: { type: String, default: '' },
    status: { type: String, enum: ['open', 'closed', 'pending', 'resolved', 'deleted'], default: 'pending' },
    files: [{ 
        description: String,
        originalName: String,
        path: String,
    }],
    replies: [replySchema],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }

}, { timestamps: true });


supportTicketSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

supportTicketSchema.pre('update', function(next) {
    this.updatedAt = new Date();
    next();
});


supportTicketSchema.pre('find', function(next) {
    this.populate({
      path: 'officerId',
      populate: {
        path: 'userId',
        model: 'User'
      }
    });
    next();
  });
  
  supportTicketSchema.pre('findOne', function(next) {
    this.populate({
      path: 'officerId',
      populate: {
        path: 'userId',
        model: 'User'
      }
    });
    next();
  });
  


module.exports = mongoose.model('SupportTicket', supportTicketSchema);
