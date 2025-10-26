import { Payment, IPayment, PaymentStatus } from '../models/payment.model';
import { DatabaseError, NotFoundError } from '../utils/errorHandler';
import mongoose from 'mongoose';

export class PaymentRepository {
  async create(paymentData: Partial<IPayment>): Promise<IPayment> {
    try {
      const payment = new Payment(paymentData);
      return await payment.save();
    } catch (error) {
      throw new DatabaseError('Failed to create payment', error);
    }
  }

  async findById(id: string): Promise<IPayment | null> {
    try {
      return await Payment.findById(id).populate('bookingId');
    } catch (error) {
      throw new DatabaseError('Failed to find payment', error);
    }
  }

  async findByBookingId(bookingId: string): Promise<IPayment | null> {
    try {
      return await Payment.findOne({
        bookingId: new mongoose.Types.ObjectId(bookingId),
      });
    } catch (error) {
      throw new DatabaseError('Failed to find payment by booking ID', error);
    }
  }

  async findByStripePaymentIntentId(stripePaymentIntentId: string): Promise<IPayment | null> {
    try {
      return await Payment.findOne({ stripePaymentIntentId });
    } catch (error) {
      throw new DatabaseError('Failed to find payment by Stripe Payment Intent ID', error);
    }
  }

  async updateById(id: string, updateData: Partial<IPayment>): Promise<IPayment> {
    try {
      const payment = await Payment.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      ).populate('bookingId');

      if (!payment) {
        throw new NotFoundError('Payment not found');
      }

      return payment;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to update payment', error);
    }
  }

  async updateStatus(id: string, status: PaymentStatus): Promise<IPayment> {
    try {
      const payment = await Payment.findByIdAndUpdate(
        id,
        { $set: { status } },
        { new: true }
      ).populate('bookingId');

      if (!payment) {
        throw new NotFoundError('Payment not found');
      }

      return payment;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to update payment status', error);
    }
  }

  async setRefund(id: string, refundAmount: number): Promise<IPayment> {
    try {
      const payment = await Payment.findByIdAndUpdate(
        id,
        {
          $set: {
            status: PaymentStatus.REFUNDED,
            refundAmount,
            refundDate: new Date(),
          },
        },
        { new: true }
      ).populate('bookingId');

      if (!payment) {
        throw new NotFoundError('Payment not found');
      }

      return payment;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to set refund', error);
    }
  }

  async findAll(): Promise<IPayment[]> {
    try {
      return await Payment.find().populate('bookingId').sort({ createdAt: -1 });
    } catch (error) {
      throw new DatabaseError('Failed to fetch payments', error);
    }
  }

  async getTotalRevenue(): Promise<number> {
    try {
      const result = await Payment.aggregate([
        {
          $match: { status: PaymentStatus.SUCCEEDED },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
          },
        },
      ]);

      return result.length > 0 ? result[0].total : 0;
    } catch (error) {
      throw new DatabaseError('Failed to calculate total revenue', error);
    }
  }
}

export default new PaymentRepository();
