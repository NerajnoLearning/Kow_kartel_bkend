import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

export enum UserRole {
  CUSTOMER = 'customer',
  ADMIN = 'admin',
  LOGISTICS = 'logistics',
}

export interface IUser extends Document {
  clerkId: string; // Clerk user ID (primary identifier)
  email: string;
  password?: string; // Optional for legacy users
  name: string;
  role: UserRole;
  verified: boolean;
  verificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  phone?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    clerkId: {
      type: String,
      required: [true, 'Clerk ID is required'],
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: false, // Optional for Clerk users
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Don't return password by default
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.CUSTOMER,
    },
    verified: {
      type: Boolean,
      default: true, // Clerk handles verification
    },
    verificationToken: {
      type: String,
      select: false,
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      select: false,
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving (only for legacy users with passwords)
userSchema.pre('save', async function (next) {
  if (!this.password || !this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ clerkId: 1 });

export const User = mongoose.model<IUser>('User', userSchema);
