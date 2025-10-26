import { equipmentRepository } from '../repositories';
import { IEquipment, EquipmentStatus } from '../models/equipment.model';
import { NotFoundError, ValidationError } from '../utils/errorHandler';
import { EquipmentFilters, PaginationOptions } from '../repositories/equipment.repository';

export interface CreateEquipmentData {
  name: string;
  category: string;
  description: string;
  dailyRate: number;
  imageUrls?: string[];
  specifications?: Record<string, any>;
  status?: EquipmentStatus;
}

export interface UpdateEquipmentData {
  name?: string;
  category?: string;
  description?: string;
  dailyRate?: number;
  imageUrls?: string[];
  specifications?: Record<string, any>;
  status?: EquipmentStatus;
}

export class EquipmentService {
  async createEquipment(data: CreateEquipmentData): Promise<IEquipment> {
    // Validate daily rate
    if (data.dailyRate <= 0) {
      throw new ValidationError('Daily rate must be greater than 0');
    }

    // Create equipment
    const equipment = await equipmentRepository.create({
      ...data,
      status: data.status || EquipmentStatus.AVAILABLE,
      imageUrls: data.imageUrls || [],
      specifications: data.specifications || {},
    });

    return equipment;
  }

  async getEquipmentById(id: string): Promise<IEquipment> {
    const equipment = await equipmentRepository.findById(id);

    if (!equipment) {
      throw new NotFoundError('Equipment not found');
    }

    return equipment;
  }

  async getAllEquipment(
    filters: EquipmentFilters = {},
    options: PaginationOptions = {}
  ): Promise<{ data: IEquipment[]; total: number; page: number; totalPages: number }> {
    return await equipmentRepository.findAll(filters, options);
  }

  async updateEquipment(id: string, data: UpdateEquipmentData): Promise<IEquipment> {
    // Check if equipment exists
    const equipment = await equipmentRepository.findById(id);
    if (!equipment) {
      throw new NotFoundError('Equipment not found');
    }

    // Validate daily rate if provided
    if (data.dailyRate !== undefined && data.dailyRate <= 0) {
      throw new ValidationError('Daily rate must be greater than 0');
    }

    // Update equipment
    const updatedEquipment = await equipmentRepository.updateById(id, data);
    return updatedEquipment;
  }

  async deleteEquipment(id: string): Promise<void> {
    // Check if equipment exists
    const equipment = await equipmentRepository.findById(id);
    if (!equipment) {
      throw new NotFoundError('Equipment not found');
    }

    // TODO: Check if equipment has active bookings before deletion
    // const hasActiveBookings = await bookingRepository.hasActiveBookings(id);
    // if (hasActiveBookings) {
    //   throw new ValidationError('Cannot delete equipment with active bookings');
    // }

    await equipmentRepository.deleteById(id);
  }

  async updateEquipmentStatus(id: string, status: EquipmentStatus): Promise<IEquipment> {
    const equipment = await equipmentRepository.findById(id);
    if (!equipment) {
      throw new NotFoundError('Equipment not found');
    }

    return await equipmentRepository.updateById(id, { status });
  }

  async addEquipmentImages(id: string, imageUrls: string[]): Promise<IEquipment> {
    const equipment = await equipmentRepository.findById(id);
    if (!equipment) {
      throw new NotFoundError('Equipment not found');
    }

    // Append new images to existing ones
    const updatedImageUrls = [...equipment.imageUrls, ...imageUrls];

    return await equipmentRepository.updateById(id, { imageUrls: updatedImageUrls });
  }

  async removeEquipmentImage(id: string, imageUrl: string): Promise<IEquipment> {
    const equipment = await equipmentRepository.findById(id);
    if (!equipment) {
      throw new NotFoundError('Equipment not found');
    }

    // Remove the specified image URL
    const updatedImageUrls = equipment.imageUrls.filter((url) => url !== imageUrl);

    // TODO: Delete image from S3
    // await s3Service.deleteFile(imageUrl);

    return await equipmentRepository.updateById(id, { imageUrls: updatedImageUrls });
  }

  async getCategories(): Promise<string[]> {
    return await equipmentRepository.getCategories();
  }

  async searchEquipment(
    searchTerm: string,
    options: PaginationOptions = {}
  ): Promise<{ data: IEquipment[]; total: number; page: number; totalPages: number }> {
    return await equipmentRepository.findAll({ search: searchTerm }, options);
  }

  async getAvailableEquipment(
    filters: Omit<EquipmentFilters, 'status'> = {},
    options: PaginationOptions = {}
  ): Promise<{ data: IEquipment[]; total: number; page: number; totalPages: number }> {
    return await equipmentRepository.findAll(
      { ...filters, status: EquipmentStatus.AVAILABLE },
      options
    );
  }

  async checkEquipmentAvailability(id: string): Promise<boolean> {
    const equipment = await equipmentRepository.findById(id);
    if (!equipment) {
      throw new NotFoundError('Equipment not found');
    }

    return equipment.status === EquipmentStatus.AVAILABLE;
  }
}

export default new EquipmentService();
