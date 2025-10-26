import mongoose, { Document, Schema } from 'mongoose';

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface IBooking extends Document {
  customerId: mongoose.Types.ObjectId;
  equipmentId: mongoose.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  deliveryAddress: string;
  status: BookingStatus;
  totalAmount: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Customer ID is required'],
      index: true,
    },
    equipmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Equipment',
      required: [true, 'Equipment ID is required'],
      index: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
      validate: {
        validator: function (value: Date) {
          return value >= new Date();
        },
        message: 'Start date must be in the future',
      },
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
      validate: {
        validator: function (this: IBooking, value: Date) {
          return value > this.startDate;
        },
        message: 'End date must be after start date',
      },
    },
    deliveryAddress: {
      type: String,
      required: [true, 'Delivery address is required'],
    },
    status: {
      type: String,
      enum: Object.values(BookingStatus),
      default: BookingStatus.PENDING,
      index: true,
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount must be positive'],
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for performance and conflict checking
bookingSchema.index({ equipmentId: 1, startDate: 1, endDate: 1 });
bookingSchema.index({ customerId: 1, status: 1 });
bookingSchema.index({ startDate: 1, endDate: 1 });

export const Booking = mongoose.model<IBooking>('Booking', bookingSchema);
