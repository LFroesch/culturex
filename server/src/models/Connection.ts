import mongoose, { Document, Schema } from 'mongoose';

export interface IConnection extends Document {
  user1: mongoose.Types.ObjectId;
  user2: mongoose.Types.ObjectId;
  status: 'pending' | 'accepted' | 'rejected';
  requestedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ConnectionSchema = new Schema<IConnection>({
  user1: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  user2: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  requestedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

ConnectionSchema.index({ user1: 1, user2: 1 }, { unique: true });

export default mongoose.model<IConnection>('Connection', ConnectionSchema);
