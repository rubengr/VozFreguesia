import mongoose from 'mongoose';

const replySchema = new mongoose.Schema({
  fromRole: String, // 'resident' ou 'president'
  text: String,
  timestamp: { type: Date, default: Date.now }
});

const auditSchema = new mongoose.Schema({
  action: String,
  user: String,
  timestamp: Date,
});

const voteSchema = new mongoose.Schema({
  adminId: mongoose.Schema.Types.ObjectId
});

const submissionSchema = new mongoose.Schema({
  title: String,
  description: String,
  attachments: [String],
  authorName: String,
  authorEmail: String,
  anonymous: Boolean,
  status: { type: String, enum: ['Pending', 'In Progress', 'Resolved', 'Rejected'], default: 'Pending' },
  createdAt: { type: Date, default: Date.now },
  replies: [replySchema],
  votesToReject: [voteSchema],
  auditTrail: [auditSchema]
});

export default mongoose.model('Submission', submissionSchema);
