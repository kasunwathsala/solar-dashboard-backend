import { NextFunction, Request, Response } from "express";
import { User } from "../infrastructure/entities/User";
import { createClerkClient } from "@clerk/express";

console.log('🔑 Initializing Clerk client with secret key:', process.env.CLERK_SECRET_KEY ? 'Found ✓' : 'Missing ✗');
const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

export const getAllUsers = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const users = await User.find();
      res.status(200).json(users);
    } catch (error) {
      next(error);
    }
  };

export const syncUsersFromClerk = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('🔄 Starting user sync from Clerk...');
    
    // Get all users from Clerk
    const clerkUsers = await clerkClient.users.getUserList();
    console.log(`📊 Found ${clerkUsers.data.length} users in Clerk`);
    
    let syncedCount = 0;
    let skippedCount = 0;
    
    // Sync each user to MongoDB
    for (const clerkUser of clerkUsers.data) {
      const existingUser = await User.findOne({ clerkUserId: clerkUser.id });
      
      if (!existingUser) {
        await User.create({
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          email: clerkUser.emailAddresses[0]?.emailAddress,
          clerkUserId: clerkUser.id,
          role: clerkUser.publicMetadata?.role || 'user',
        });
        syncedCount++;
        console.log(`✅ Synced user: ${clerkUser.emailAddresses[0]?.emailAddress}`);
      } else {
        skippedCount++;
        console.log(`⏭️  Skipped existing user: ${clerkUser.emailAddresses[0]?.emailAddress}`);
      }
    }
    
    console.log(`✅ User sync completed - Synced: ${syncedCount}, Skipped: ${skippedCount}`);
    
    res.status(200).json({
      message: 'User sync completed',
      synced: syncedCount,
      skipped: skippedCount,
      total: clerkUsers.data.length,
    });
  } catch (error: any) {
    console.error('❌ Error syncing users from Clerk:', error);
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    });
    res.status(500).json({
      message: 'Failed to sync users',
      error: error?.message || 'Unknown error',
    });
  }
};