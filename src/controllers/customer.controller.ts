import { Request, Response } from 'express';
import customerService from '../services/customer.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import logger from '../config/logger';

/**
 * Get all customers (admin only)
 * GET /api/v1/customers
 */
export const getAllCustomers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { verified, search, page, limit, sortBy, sortOrder } = req.query;

    const filters = {
      verified: verified === 'true' ? true : verified === 'false' ? false : undefined,
      search: search as string,
    };

    const options = {
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 20,
      sortBy: (sortBy as string) || 'createdAt',
      sortOrder: (sortOrder as 'asc' | 'desc') || 'desc',
    };

    const result = await customerService.getAllCustomers(filters, options);

    res.status(200).json({
      status: 'success',
      data: result,
    });
    return;
  } catch (error) {
    logger.error('Get all customers error:', error);
    throw error;
  }
};

/**
 * Get customer by ID
 * GET /api/v1/customers/:id
 */
export const getCustomerById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    const customer = await customerService.getCustomerById(id, userId, userRole);

    res.status(200).json({
      status: 'success',
      data: customer,
    });
    return;
  } catch (error) {
    logger.error('Get customer by ID error:', error);
    throw error;
  }
};

/**
 * Update customer profile
 * PUT /api/v1/customers/:id
 */
export const updateCustomerProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role;
    const updateData = req.body;

    const customer = await customerService.updateCustomerProfile(
      id,
      updateData,
      userId,
      userRole
    );

    res.status(200).json({
      status: 'success',
      data: customer,
      message: 'Profile updated successfully',
    });
    return;
  } catch (error) {
    logger.error('Update customer profile error:', error);
    throw error;
  }
};

/**
 * Delete customer (admin only)
 * DELETE /api/v1/customers/:id
 */
export const deleteCustomer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await customerService.deleteCustomer(id);

    res.status(200).json({
      status: 'success',
      message: 'Customer deleted successfully',
    });
    return;
  } catch (error) {
    logger.error('Delete customer error:', error);
    throw error;
  }
};

/**
 * Get customer statistics
 * GET /api/v1/customers/:id/stats
 */
export const getCustomerStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    const stats = await customerService.getCustomerStats(id, userId, userRole);

    res.status(200).json({
      status: 'success',
      data: stats,
    });
    return;
  } catch (error) {
    logger.error('Get customer stats error:', error);
    throw error;
  }
};

/**
 * Get customer booking history
 * GET /api/v1/customers/:id/bookings
 */
export const getCustomerBookingHistory = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    const bookings = await customerService.getCustomerBookingHistory(id, userId, userRole);

    res.status(200).json({
      status: 'success',
      data: bookings,
    });
    return;
  } catch (error) {
    logger.error('Get customer booking history error:', error);
    throw error;
  }
};

/**
 * Get top customers by spending (admin only)
 * GET /api/v1/customers/top
 */
export const getTopCustomers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { limit } = req.query;
    const limitNumber = limit ? parseInt(limit as string, 10) : 10;

    const topCustomers = await customerService.getTopCustomers(limitNumber);

    res.status(200).json({
      status: 'success',
      data: topCustomers,
    });
    return;
  } catch (error) {
    logger.error('Get top customers error:', error);
    throw error;
  }
};

/**
 * Get customer overview statistics (admin only)
 * GET /api/v1/customers/overview
 */
export const getCustomerOverview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const overview = await customerService.getCustomerOverview();

    res.status(200).json({
      status: 'success',
      data: overview,
    });
    return;
  } catch (error) {
    logger.error('Get customer overview error:', error);
    throw error;
  }
};
