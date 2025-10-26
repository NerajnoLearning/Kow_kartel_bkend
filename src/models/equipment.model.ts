import mongoose, { Document, Schema } from 'mongoose';

export enum EquipmentStatus {
  AVAILABLE = 'available',
  MAINTENANCE = 'maintenance',
  RETIRED = 'retired',
}

export interface IEquipment extends Document {
  name: string;
  category: string;
  description: string;
  dailyRate: number;
  imageUrls: string[];
  specifications: Record<string, any>;
  status: EquipmentStatus;
  createdAt: Date;
  updatedAt: Date;
}

const equipmentSchema = new Schema<IEquipment>(
  {
    name: {
      type: String,
      required: [true, 'Equipment name is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    dailyRate: {
      type: Number,
      required: [true, 'Daily rate is required'],
      min: [0, 'Daily rate must be positive'],
    },
    imageUrls: {
      type: [String],
      default: [],
    },
    specifications: {
      type: Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: Object.values(EquipmentStatus),
      default: EquipmentStatus.AVAILABLE,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
equipmentSchema.index({ category: 1, status: 1 });
equipmentSchema.index({ name: 'text', description: 'text' });

export const Equipment = mongoose.model<IEquipment>('Equipment', equipmentSchema);
