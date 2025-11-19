import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
  sender: mongoose.Types.ObjectId;
  receiver: mongoose.Types.ObjectId;
  content: string;
  read: boolean;
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>({
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
  read: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Compound indexes for message queries and cursor pagination
MessageSchema.index({ sender: 1, receiver: 1, _id: -1 });
MessageSchema.index({ receiver: 1, read: 1 }); // For unread count queries

export default mongoose.model<IMessage>('Message', MessageSchema);
