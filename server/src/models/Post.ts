import mongoose, { Document, Schema } from 'mongoose';

export interface IPost extends Document {
  userId: mongoose.Types.ObjectId;
  cityId: mongoose.Types.ObjectId;
  type: 'insight' | 'photo' | 'food' | 'recipe' | 'story' | 'music' | 'workExchange' | 'forum';
  status: 'pending' | 'approved' | 'rejected';

  title: string;
  description: string;
  photos: string[];
  tags: string[];

  metadata: {
    // Work Exchange
    workType?: 'farm' | 'teaching' | 'hospitality' | 'construction' | 'creative' | 'other';
    duration?: string;
    offered?: string;
    requirements?: string;
    contactPreference?: 'dm' | 'external';

    // Recipe
    ingredients?: string[];
    instructions?: string[];
    servings?: string;
    prepTime?: string;
    cookTime?: string;

    // Story
    storyCategory?: 'personal' | 'legend' | 'historical' | 'other';

    // Music
    artist?: string;
    musicType?: 'folk' | 'traditional' | 'local' | 'street' | 'other';
    language?: string;
    lyrics?: string;
    audioLink?: string;

    // Food & Culture
    foodType?: 'restaurant' | 'streetFood' | 'tradition' | 'festival' | 'other';
    locationDetails?: string;

    // Photo
    photoCategory?: 'landscape' | 'people' | 'architecture' | 'dailyLife' | 'other';

    // Forum
    forumCategory?: 'question' | 'discussion' | 'meetup' | 'announcement' | 'other';
  };

  flagged: boolean;
  flagReasons: string[];

  likes: mongoose.Types.ObjectId[];
  comments: {
    _id?: mongoose.Types.ObjectId;
    user: mongoose.Types.ObjectId;
    text: string;
    parentCommentId?: mongoose.Types.ObjectId; // For nested replies
    createdAt: Date;
    updatedAt?: Date;
  }[];

  createdAt: Date;
  updatedAt: Date;
  approvedAt?: Date;
  moderatorId?: mongoose.Types.ObjectId;
}

const PostSchema = new Schema<IPost>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  cityId: {
    type: Schema.Types.ObjectId,
    ref: 'City',
    required: true
  },
  type: {
    type: String,
    enum: ['insight', 'photo', 'food', 'recipe', 'story', 'music', 'workExchange', 'forum'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  moderatorId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    maxlength: 5000
  },
  photos: [{
    type: String
  }],
  tags: [{
    type: String,
    trim: true
  }],
  metadata: {
    workType: String,
    duration: String,
    offered: String,
    requirements: String,
    contactPreference: String,
    ingredients: [String],
    instructions: [String],
    servings: String,
    prepTime: String,
    cookTime: String,
    storyCategory: String,
    artist: String,
    musicType: String,
    language: String,
    lyrics: String,
    audioLink: String,
    foodType: String,
    locationDetails: String,
    photoCategory: String,
    forumCategory: String
  },
  flagged: {
    type: Boolean,
    default: false
  },
  flagReasons: [{
    type: String
  }],
  likes: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      required: true,
      maxlength: 1000
    },
    parentCommentId: {
      type: Schema.Types.ObjectId,
      default: null
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date
    }
  }],
  approvedAt: Date
}, {
  timestamps: true
});

// Text index for search functionality
PostSchema.index({
  title: 'text',
  description: 'text',
  tags: 'text',
  'metadata.artist': 'text',
  'metadata.locationDetails': 'text'
});

// Index for filtering and pagination
PostSchema.index({ type: 1, status: 1, cityId: 1 });
PostSchema.index({ status: 1, _id: -1 }); // For cursor pagination on approved posts
PostSchema.index({ userId: 1, status: 1, _id: -1 }); // For user feed pagination
PostSchema.index({ cityId: 1, status: 1, _id: -1 }); // For city posts pagination

export default mongoose.model<IPost>('Post', PostSchema);
