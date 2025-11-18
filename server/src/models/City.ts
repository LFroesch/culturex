import mongoose, { Document, Schema } from 'mongoose';

export interface ICity extends Document {
  name: string;
  country: string;
  coordinates: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
  contentCount: number;
  hasContent: boolean;
  moderators: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const CitySchema = new Schema<ICity>({
  name: {
    type: String,
    required: true
  },
  country: {
    type: String,
    required: true
  },
  coordinates: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  contentCount: {
    type: Number,
    default: 0
  },
  hasContent: {
    type: Boolean,
    default: false
  },
  moderators: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Create geospatial index
CitySchema.index({ coordinates: '2dsphere' });
CitySchema.index({ name: 1, country: 1 });

export default mongoose.model<ICity>('City', CitySchema);
