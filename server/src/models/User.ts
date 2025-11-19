import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  role: 'user' | 'moderator' | 'admin';
  profile: {
    bio: string;
    interests: string[];
    languages: string[];
    photos: string[];
    cityLocation?: mongoose.Types.ObjectId;
  };
  settings: {
    messagingPrivacy: 'open' | 'friendsOnly';
    emailNotifications: boolean;
  };
  blockedUsers?: mongoose.Types.ObjectId[];
  savedPosts?: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  lastActive: Date;
}

const UserSchema = new Schema<IUser>({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'moderator', 'admin'],
    default: 'user'
  },
  profile: {
    bio: {
      type: String,
      default: '',
      maxlength: 500
    },
    interests: [{
      type: String
    }],
    languages: [{
      type: String
    }],
    photos: [{
      type: String
    }],
    cityLocation: {
      type: Schema.Types.ObjectId,
      ref: 'City'
    }
  },
  settings: {
    messagingPrivacy: {
      type: String,
      enum: ['open', 'friendsOnly'],
      default: 'open'
    },
    emailNotifications: {
      type: Boolean,
      default: true
    }
  },
  blockedUsers: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  savedPosts: [{
    type: Schema.Types.ObjectId,
    ref: 'Post'
  }],
  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export default mongoose.model<IUser>('User', UserSchema);
