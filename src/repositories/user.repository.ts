import { User, IUser } from '../models/user.model';
import { DatabaseError, NotFoundError } from '../utils/errorHandler';

export class UserRepository {
  async create(userData: Partial<IUser>): Promise<IUser> {
    try {
      const user = new User(userData);
      return await user.save();
    } catch (error) {
      throw new DatabaseError('Failed to create user', error);
    }
  }

  async findById(id: string): Promise<IUser | null> {
    try {
      return await User.findById(id).select('-password');
    } catch (error) {
      throw new DatabaseError('Failed to find user by ID', error);
    }
  }

  async findByEmail(email: string): Promise<IUser | null> {
    try {
      return await User.findOne({ email }).select('+password');
    } catch (error) {
      throw new DatabaseError('Failed to find user by email', error);
    }
  }

  async findByIdWithPassword(id: string): Promise<IUser | null> {
    try {
      return await User.findById(id).select('+password');
    } catch (error) {
      throw new DatabaseError('Failed to find user by ID', error);
    }
  }

  async existsByEmail(email: string): Promise<boolean> {
    try {
      const count = await User.countDocuments({ email });
      return count > 0;
    } catch (error) {
      throw new DatabaseError('Failed to check user existence', error);
    }
  }

  async updateById(id: string, updateData: Partial<IUser>): Promise<IUser> {
    try {
      const user = await User.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        throw new NotFoundError('User not found');
      }

      return user;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to update user', error);
    }
  }

  async deleteById(id: string): Promise<void> {
    try {
      const result = await User.findByIdAndDelete(id);
      if (!result) {
        throw new NotFoundError('User not found');
      }
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to delete user', error);
    }
  }

  async setVerified(id: string): Promise<IUser> {
    try {
      const user = await User.findByIdAndUpdate(
        id,
        { $set: { verified: true }, $unset: { verificationToken: 1 } },
        { new: true }
      ).select('-password');

      if (!user) {
        throw new NotFoundError('User not found');
      }

      return user;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to verify user', error);
    }
  }

  async setResetToken(id: string, token: string, expires: Date): Promise<void> {
    try {
      const result = await User.findByIdAndUpdate(id, {
        $set: { resetPasswordToken: token, resetPasswordExpires: expires },
      });

      if (!result) {
        throw new NotFoundError('User not found');
      }
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to set reset token', error);
    }
  }

  async findByResetToken(token: string): Promise<IUser | null> {
    try {
      return await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: new Date() },
      }).select('+resetPasswordToken +resetPasswordExpires');
    } catch (error) {
      throw new DatabaseError('Failed to find user by reset token', error);
    }
  }

  async clearResetToken(id: string): Promise<void> {
    try {
      await User.findByIdAndUpdate(id, {
        $unset: { resetPasswordToken: 1, resetPasswordExpires: 1 },
      });
    } catch (error) {
      throw new DatabaseError('Failed to clear reset token', error);
    }
  }
}

export default new UserRepository();
