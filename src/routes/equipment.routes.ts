import { Router } from 'express';
import equipmentController from '../controllers/equipment.controller';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/role.middleware';
import {
  createEquipmentSchema,
  updateEquipmentSchema,
  getEquipmentSchema,
  listEquipmentSchema,
  deleteEquipmentSchema,
  updateEquipmentStatusSchema,
  addImagesSchema,
  removeImageSchema,
} from '../validators/equipment.schema';

const router = Router();

/**
 * @route   GET /api/v1/equipment
 * @desc    Get all equipment with filters and pagination
 * @access  Public
 */
router.get('/', validate(listEquipmentSchema), equipmentController.getAllEquipment);

/**
 * @route   GET /api/v1/equipment/available
 * @desc    Get only available equipment
 * @access  Public
 */
router.get('/available', validate(listEquipmentSchema), equipmentController.getAvailableEquipment);

/**
 * @route   GET /api/v1/equipment/categories
 * @desc    Get all equipment categories
 * @access  Public
 */
router.get('/categories', equipmentController.getCategories);

/**
 * @route   GET /api/v1/equipment/search
 * @desc    Search equipment by name or description
 * @access  Public
 */
router.get('/search', equipmentController.searchEquipment);

/**
 * @route   GET /api/v1/equipment/:id
 * @desc    Get equipment by ID
 * @access  Public
 */
router.get('/:id', validate(getEquipmentSchema), equipmentController.getEquipmentById);

/**
 * @route   GET /api/v1/equipment/:id/availability
 * @desc    Check equipment availability
 * @access  Public
 */
router.get('/:id/availability', validate(getEquipmentSchema), equipmentController.checkAvailability);

/**
 * @route   POST /api/v1/equipment
 * @desc    Create new equipment (Admin only)
 * @access  Private/Admin
 */
router.post(
  '/',
  authenticate,
  requireAdmin,
  validate(createEquipmentSchema),
  equipmentController.createEquipment
);

/**
 * @route   PUT /api/v1/equipment/:id
 * @desc    Update equipment (Admin only)
 * @access  Private/Admin
 */
router.put(
  '/:id',
  authenticate,
  requireAdmin,
  validate(updateEquipmentSchema),
  equipmentController.updateEquipment
);

/**
 * @route   PATCH /api/v1/equipment/:id/status
 * @desc    Update equipment status (Admin only)
 * @access  Private/Admin
 */
router.patch(
  '/:id/status',
  authenticate,
  requireAdmin,
  validate(updateEquipmentStatusSchema),
  equipmentController.updateEquipmentStatus
);

/**
 * @route   POST /api/v1/equipment/:id/images
 * @desc    Add images to equipment (Admin only)
 * @access  Private/Admin
 */
router.post(
  '/:id/images',
  authenticate,
  requireAdmin,
  validate(addImagesSchema),
  equipmentController.addEquipmentImages
);

/**
 * @route   DELETE /api/v1/equipment/:id/images
 * @desc    Remove image from equipment (Admin only)
 * @access  Private/Admin
 */
router.delete(
  '/:id/images',
  authenticate,
  requireAdmin,
  validate(removeImageSchema),
  equipmentController.removeEquipmentImage
);

/**
 * @route   DELETE /api/v1/equipment/:id
 * @desc    Delete equipment (Admin only)
 * @access  Private/Admin
 */
router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  validate(deleteEquipmentSchema),
  equipmentController.deleteEquipment
);

export default router;
