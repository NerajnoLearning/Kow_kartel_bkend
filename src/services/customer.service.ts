import { customerRepository, bookingRepository } from '../repositories';
import { IUser } from '../models/user.model';
import {
  NotFoundError,
  ValidationError,
  AuthorizationError,
} from '../utils/errorHandler';
import {
  CustomerFilters,
  PaginationOptions,
} from '../repositories/customer.repository';

export interface UpdateCustomerProfileData {
  name?: string;
  phone?: string;
  address?: string;
}

export class CustomerService {
  /**
   * Get all customers (admin only)
   */
  async getAllCustomers(
    filters: CustomerFilters = {},
    options: PaginationOptions = {}
  ): Promise<{ data: IUser[]; total: number; page: number; totalPages: number }> {
    return await customerRepository.findAll(filters, options);
  }

  /**
   * Get customer by ID
   */
  async getCustomerById(
    id: string,
    requestUserId: string,
    requestUserRole: string
  ): Promise<IUser> {
    // Check authorization - only the customer themselves or admin can view
    if (requestUserRole !== 'admin' && requestUserRole !== 'logistics' && requestUserId !== id) {
      throw new AuthorizationError('You can only view your own profile');
    }

    const customer = await customerRepository.findById(id);
    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    return customer;
  }

  /**
   * Update customer profile
   */
  async updateCustomerProfile(
    id: string,
    data: UpdateCustomerProfileData,
    requestUserId: string,
    requestUserRole: string
  ): Promise<IUser> {
    // Check authorization - only the customer themselves or admin can update
    if (requestUserRole !== 'admin' && requestUserId !== id) {
      throw new AuthorizationError('You can only update your own profile');
    }

    // Validate data
    if (data.name && data.name.trim().length < 2) {
      throw new ValidationError('Name must be at least 2 characters long');
    }

    if (data.phone && !/^\+?[\d\s\-()]+$/.test(data.phone)) {
      throw new ValidationError('Invalid phone number format');
    }

    const customer = await customerRepository.findById(id);
    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    const updatedCustomer = await customerRepository.updateById(id, data);
    return updatedCustomer;
  }

  /**
   * Delete customer (admin only)
   */
  async deleteCustomer(id: string): Promise<void> {
    const customer = await customerRepository.findById(id);
    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    // Check if customer has active bookings
    const bookings = await bookingRepository.findByCustomerId(id);
    const activeBookings = bookings.filter(
      (booking) =>
        booking.status === 'pending' ||
        booking.status === 'confirmed' ||
        booking.status === 'active'
    );

    if (activeBookings.length > 0) {
      throw new ValidationError(
        'Cannot delete customer with active bookings. Cancel all bookings first.'
      );
    }

    await customerRepository.deleteById(id);
  }

  /**
   * Get customer statistics
   */
  async getCustomerStats(
    customerId: string,
    requestUserId: string,
    requestUserRole: string
  ): Promise<{
    totalBookings: number;
    activeBookings: number;
    completedBookings: number;
    totalSpent: number;
  }> {
    // Check authorization
    if (
      requestUserRole !== 'admin' &&
      requestUserRole !== 'logistics' &&
      requestUserId !== customerId
    ) {
      throw new AuthorizationError('You can only view your own statistics');
    }

    const customer = await customerRepository.findById(customerId);
    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    return await customerRepository.getCustomerStats(customerId);
  }

  /**
   * Get customer booking history
   */
  async getCustomerBookingHistory(
    customerId: string,
    requestUserId: string,
    requestUserRole: string
  ) {
    // Check authorization
    if (
      requestUserRole !== 'admin' &&
      requestUserRole !== 'logistics' &&
      requestUserId !== customerId
    ) {
      throw new AuthorizationError('You can only view your own booking history');
    }

    const customer = await customerRepository.findById(customerId);
    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    return await bookingRepository.findByCustomerId(customerId);
  }

  /**
   * Get top customers by spending (admin only)
   */
  async getTopCustomers(limit: number = 10): Promise<any[]> {
    if (limit < 1 || limit > 100) {
      throw new ValidationError('Limit must be between 1 and 100');
    }

    return await customerRepository.getTopCustomers(limit);
  }

  /**
   * Get customer overview statistics (admin only)
   */
  async getCustomerOverview(): Promise<{
    totalCustomers: number;
    verifiedCustomers: number;
    unverifiedCustomers: number;
  }> {
    const [totalCustomers, verifiedCustomers] = await Promise.all([
      customerRepository.countAll(),
      customerRepository.countVerified(),
    ]);

    return {
      totalCustomers,
      verifiedCustomers,
      unverifiedCustomers: totalCustomers - verifiedCustomers,
    };
  }
}

export default new CustomerService();
