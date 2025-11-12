import { User, UserRole } from '../models/user.model';
import logger from '../config/logger';
import { NotFoundError } from '../utils/errorHandler';

/**
 * Clerk webhook event types
 */
export enum ClerkWebhookEvent {
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
  USER_DELETED = 'user.deleted',
}

interface ClerkUserData {
  id: string;
  email_addresses: Array<{ email_address: string; id: string }>;
  first_name: string;
  last_name: string;
  public_metadata?: {
    role?: string;
  };
  phone_numbers?: Array<{ phone_number: string }>;
  unsafe_metadata?: {
    address?: string;
  };
}

interface ClerkWebhookPayload {
  type: ClerkWebhookEvent;
  data: ClerkUserData;
}

export class ClerkService {
  /**
   * Handle user.created webhook
   * Creates a new user in our database when they sign up via Clerk
   */
  async handleUserCreated(data: ClerkUserData) {
    try {
      const email = data.email_addresses[0]?.email_address;
      const name = `${data.first_name || ''} ${data.last_name || ''}`.trim();
      const role = (data.public_metadata?.role as UserRole) || UserRole.CUSTOMER;
      const phone = data.phone_numbers?.[0]?.phone_number;
      const address = data.unsafe_metadata?.address;

      // Check if user already exists
      const existingUser = await User.findOne({ clerkId: data.id });
      if (existingUser) {
        logger.warn(`User with Clerk ID ${data.id} already exists`);
        return existingUser;
      }

      // Create new user
      const user = await User.create({
        clerkId: data.id,
        email,
        name: name || email,
        role,
        verified: true, // Clerk handles email verification
        phone,
        address,
      });

      logger.info(`User created from Clerk webhook: ${user.email}`);
      return user;
    } catch (error) {
      logger.error('Error creating user from Clerk webhook:', error);
      throw error;
    }
  }

  /**
   * Handle user.updated webhook
   * Syncs user updates from Clerk to our database
   */
  async handleUserUpdated(data: ClerkUserData) {
    try {
      const user = await User.findOne({ clerkId: data.id });

      if (!user) {
        logger.warn(`User with Clerk ID ${data.id} not found, creating new user`);
        return await this.handleUserCreated(data);
      }

      // Update user fields
      const email = data.email_addresses[0]?.email_address;
      const name = `${data.first_name || ''} ${data.last_name || ''}`.trim();
      const role = (data.public_metadata?.role as UserRole) || user.role;
      const phone = data.phone_numbers?.[0]?.phone_number;
      const address = data.unsafe_metadata?.address;

      user.email = email || user.email;
      user.name = name || user.name;
      user.role = role;
      user.phone = phone || user.phone;
      user.address = address || user.address;

      await user.save();

      logger.info(`User updated from Clerk webhook: ${user.email}`);
      return user;
    } catch (error) {
      logger.error('Error updating user from Clerk webhook:', error);
      throw error;
    }
  }

  /**
   * Handle user.deleted webhook
   * Marks user as deleted or removes them from database
   */
  async handleUserDeleted(data: ClerkUserData) {
    try {
      const user = await User.findOne({ clerkId: data.id });

      if (!user) {
        logger.warn(`User with Clerk ID ${data.id} not found for deletion`);
        return;
      }

      // Option 1: Soft delete (recommended to preserve booking history)
      // You could add a 'deleted' or 'active' field to the user model

      // Option 2: Hard delete
      await User.deleteOne({ clerkId: data.id });

      logger.info(`User deleted from Clerk webhook: ${user.email}`);
    } catch (error) {
      logger.error('Error deleting user from Clerk webhook:', error);
      throw error;
    }
  }

  /**
   * Process Clerk webhook event
   */
  async processWebhookEvent(payload: ClerkWebhookPayload) {
    const { type, data } = payload;

    logger.info(`Processing Clerk webhook: ${type}`);

    switch (type) {
      case ClerkWebhookEvent.USER_CREATED:
        return await this.handleUserCreated(data);

      case ClerkWebhookEvent.USER_UPDATED:
        return await this.handleUserUpdated(data);

      case ClerkWebhookEvent.USER_DELETED:
        return await this.handleUserDeleted(data);

      default:
        logger.warn(`Unknown Clerk webhook event type: ${type}`);
    }
  }

  /**
   * Get or create user from Clerk ID
   * Useful for ensuring user exists before creating bookings
   */
  async getOrCreateUser(clerkId: string, clerkData?: ClerkUserData) {
    let user = await User.findOne({ clerkId });

    if (!user && clerkData) {
      user = await this.handleUserCreated(clerkData);
    }

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  /**
   * Sync user from Clerk by ID
   * Fetches latest user data from Clerk and updates database
   */
  async syncUserFromClerk(clerkId: string) {
    try {
      const { clerkClient } = await import('../config/clerk');
      const clerkUser = await clerkClient.users.getUser(clerkId);

      const userData: ClerkUserData = {
        id: clerkUser.id,
        email_addresses: clerkUser.emailAddresses.map((e) => ({
          email_address: e.emailAddress,
          id: e.id,
        })),
        first_name: clerkUser.firstName || '',
        last_name: clerkUser.lastName || '',
        public_metadata: clerkUser.publicMetadata as { role?: string },
        phone_numbers: clerkUser.phoneNumbers?.map((p) => ({ phone_number: p.phoneNumber })),
        unsafe_metadata: clerkUser.unsafeMetadata as { address?: string },
      };

      return await this.handleUserUpdated(userData);
    } catch (error) {
      logger.error(`Error syncing user from Clerk: ${clerkId}`, error);
      throw error;
    }
  }
}

export default new ClerkService();
