import { Equipment, IEquipment, EquipmentStatus } from '../models/equipment.model';
import { DatabaseError, NotFoundError } from '../utils/errorHandler';
import { PAGINATION } from '../utils/constants';

export interface EquipmentFilters {
  category?: string;
  status?: EquipmentStatus;
  search?: string;
  minRate?: number;
  maxRate?: number;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class EquipmentRepository {
  async create(equipmentData: Partial<IEquipment>): Promise<IEquipment> {
    try {
      const equipment = new Equipment(equipmentData);
      return await equipment.save();
    } catch (error) {
      throw new DatabaseError('Failed to create equipment', error);
    }
  }

  async findById(id: string): Promise<IEquipment | null> {
    try {
      return await Equipment.findById(id);
    } catch (error) {
      throw new DatabaseError('Failed to find equipment', error);
    }
  }

  async findAll(
    filters: EquipmentFilters = {},
    options: PaginationOptions = {}
  ): Promise<{ data: IEquipment[]; total: number; page: number; totalPages: number }> {
    try {
      const page = options.page || PAGINATION.DEFAULT_PAGE;
      const limit = Math.min(
        options.limit || PAGINATION.DEFAULT_LIMIT,
        PAGINATION.MAX_LIMIT
      );
      const skip = (page - 1) * limit;
      const sortBy = options.sortBy || 'createdAt';
      const sortOrder = options.sortOrder === 'asc' ? 1 : -1;

      // Build query
      const query: Record<string, unknown> = {};

      if (filters.category) {
        query.category = filters.category;
      }

      if (filters.status) {
        query.status = filters.status;
      }

      if (filters.search) {
        query.$text = { $search: filters.search };
      }

      if (filters.minRate !== undefined || filters.maxRate !== undefined) {
        query.dailyRate = {};
        if (filters.minRate !== undefined) {
          (query.dailyRate as Record<string, unknown>).$gte = filters.minRate;
        }
        if (filters.maxRate !== undefined) {
          (query.dailyRate as Record<string, unknown>).$lte = filters.maxRate;
        }
      }

      const [data, total] = await Promise.all([
        Equipment.find(query)
          .sort({ [sortBy]: sortOrder })
          .skip(skip)
          .limit(limit),
        Equipment.countDocuments(query),
      ]);

      return {
        data,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      throw new DatabaseError('Failed to fetch equipment list', error);
    }
  }

  async updateById(id: string, updateData: Partial<IEquipment>): Promise<IEquipment> {
    try {
      const equipment = await Equipment.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!equipment) {
        throw new NotFoundError('Equipment not found');
      }

      return equipment;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to update equipment', error);
    }
  }

  async deleteById(id: string): Promise<void> {
    try {
      const result = await Equipment.findByIdAndDelete(id);
      if (!result) {
        throw new NotFoundError('Equipment not found');
      }
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to delete equipment', error);
    }
  }

  async getCategories(): Promise<string[]> {
    try {
      return await Equipment.distinct('category');
    } catch (error) {
      throw new DatabaseError('Failed to fetch categories', error);
    }
  }

  async existsById(id: string): Promise<boolean> {
    try {
      const count = await Equipment.countDocuments({ _id: id });
      return count > 0;
    } catch (error) {
      throw new DatabaseError('Failed to check equipment existence', error);
    }
  }
}

export default new EquipmentRepository();
