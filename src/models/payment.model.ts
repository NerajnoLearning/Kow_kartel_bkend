import mongoose, { Document, Schema } from 'mongoose';

export enum PaymentStatus {
  PENDING = 'pending',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export interface IPayment extends Document {
  bookingId: mongoose.Types.ObjectId;
  stripePaymentIntentId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  metadata: Record<string, any>;
  refundAmount?: number;
  refundDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking ID is required'],
      index: true,
    },
    stripePaymentIntentId: {
      type: String,
      required: [true, 'Stripe Payment Intent ID is required'],
      unique: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount must be positive'],
    },
    currency: {
      type: String,
      required: [true, 'Currency is required'],
      default: 'usd',
      uppercase: true,
    },
    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    refundAmount: {
      type: Number,
      min: [0, 'Refund amount must be positive'],
    },
    refundDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
paymentSchema.index({ bookingId: 1, status: 1 });
paymentSchema.index({ stripePaymentIntentId: 1 });

export const Payment = mongoose.model<IPayment>('Payment', paymentSchema);
