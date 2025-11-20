import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'friendRequest' | 'friendAccepted' | 'message' | 'postApproved' | 'postRejected' | 'postLiked' | 'postCommented' | 'commentReplied';
  relatedId: mongoose.Types.ObjectId;
  fromUserId?: mongoose.Types.ObjectId;
  content: string;
  read: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['friendRequest', 'friendAccepted', 'message', 'postApproved', 'postRejected', 'postLiked', 'postCommented', 'commentReplied'],
    required: true
  },
  relatedId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  fromUserId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  content: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

export default mongoose.model<INotification>('Notification', NotificationSchema);
