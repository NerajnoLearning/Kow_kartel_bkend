import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/common.types';
import equipmentService from '../services/equipment.service';
import { HTTP_STATUS } from '../utils/constants';
import { EquipmentStatus } from '../models/equipment.model';

export class EquipmentController {
  async createEquipment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const equipment = await equipmentService.createEquipment(req.body);

      res.status(HTTP_STATUS.CREATED).json({
        status: HTTP_STATUS.CREATED,
        message: 'Equipment created successfully',
        data: equipment,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllEquipment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { category, status, search, minRate, maxRate, page, limit, sortBy, sortOrder } =
        req.query;

      const filters = {
        category: category as string | undefined,
        status: status as EquipmentStatus | undefined,
        search: search as string | undefined,
        minRate: minRate ? parseFloat(minRate as string) : undefined,
        maxRate: maxRate ? parseFloat(maxRate as string) : undefined,
      };

      const options = {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        sortBy: sortBy as string | undefined,
        sortOrder: sortOrder as 'asc' | 'desc' | undefined,
      };

      const result = await equipmentService.getAllEquipment(filters, options);

      res.status(HTTP_STATUS.OK).json({
        status: HTTP_STATUS.OK,
        data: result.data,
        pagination: {
          page: result.page,
          totalPages: result.totalPages,
          total: result.total,
          limit: options.limit,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getEquipmentById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const equipment = await equipmentService.getEquipmentById(id);

      res.status(HTTP_STATUS.OK).json({
        status: HTTP_STATUS.OK,
        data: equipment,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateEquipment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const equipment = await equipmentService.updateEquipment(id, req.body);

      res.status(HTTP_STATUS.OK).json({
        status: HTTP_STATUS.OK,
        message: 'Equipment updated successfully',
        data: equipment,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteEquipment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await equipmentService.deleteEquipment(id);

      res.status(HTTP_STATUS.OK).json({
        status: HTTP_STATUS.OK,
        message: 'Equipment deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async updateEquipmentStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const equipment = await equipmentService.updateEquipmentStatus(id, status);

      res.status(HTTP_STATUS.OK).json({
        status: HTTP_STATUS.OK,
        message: 'Equipment status updated successfully',
        data: equipment,
      });
    } catch (error) {
      next(error);
    }
  }

  async addEquipmentImages(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { imageUrls } = req.body;

      const equipment = await equipmentService.addEquipmentImages(id, imageUrls);

      res.status(HTTP_STATUS.OK).json({
        status: HTTP_STATUS.OK,
        message: 'Images added successfully',
        data: equipment,
      });
    } catch (error) {
      next(error);
    }
  }

  async removeEquipmentImage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { imageUrl } = req.body;

      const equipment = await equipmentService.removeEquipmentImage(id, imageUrl);

      res.status(HTTP_STATUS.OK).json({
        status: HTTP_STATUS.OK,
        message: 'Image removed successfully',
        data: equipment,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCategories(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const categories = await equipmentService.getCategories();

      res.status(HTTP_STATUS.OK).json({
        status: HTTP_STATUS.OK,
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  }

  async searchEquipment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { q, page, limit, sortBy, sortOrder } = req.query;

      if (!q) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          status: HTTP_STATUS.BAD_REQUEST,
          error: 'Search query parameter "q" is required',
        });
        return;
      }

      const options = {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        sortBy: sortBy as string | undefined,
        sortOrder: sortOrder as 'asc' | 'desc' | undefined,
      };

      const result = await equipmentService.searchEquipment(q as string, options);

      res.status(HTTP_STATUS.OK).json({
        status: HTTP_STATUS.OK,
        data: result.data,
        pagination: {
          page: result.page,
          totalPages: result.totalPages,
          total: result.total,
          limit: options.limit,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getAvailableEquipment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { category, search, minRate, maxRate, page, limit, sortBy, sortOrder } = req.query;

      const filters = {
        category: category as string | undefined,
        search: search as string | undefined,
        minRate: minRate ? parseFloat(minRate as string) : undefined,
        maxRate: maxRate ? parseFloat(maxRate as string) : undefined,
      };

      const options = {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        sortBy: sortBy as string | undefined,
        sortOrder: sortOrder as 'asc' | 'desc' | undefined,
      };

      const result = await equipmentService.getAvailableEquipment(filters, options);

      res.status(HTTP_STATUS.OK).json({
        status: HTTP_STATUS.OK,
        data: result.data,
        pagination: {
          page: result.page,
          totalPages: result.totalPages,
          total: result.total,
          limit: options.limit,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async checkAvailability(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const isAvailable = await equipmentService.checkEquipmentAvailability(id);

      res.status(HTTP_STATUS.OK).json({
        status: HTTP_STATUS.OK,
        data: { available: isAvailable },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new EquipmentController();
