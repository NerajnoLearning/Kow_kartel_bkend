import { createClerkClient } from '@clerk/backend';
import env from './env';
import logger from './logger';

/**
 * Clerk client for backend authentication and user management
 */
export const clerkClient = createClerkClient({
  secretKey: env.CLERK_SECRET_KEY,
});

/**
 * Verify Clerk webhook signature
 */
export const verifyClerkWebhook = async (payload: string, headers: Record<string, string>) => {
  const { Webhook } = await import('svix');
  const webhook = new Webhook(env.CLERK_WEBHOOK_SECRET);

  try {
    return webhook.verify(payload, {
      'svix-id': headers['svix-id'] || '',
      'svix-timestamp': headers['svix-timestamp'] || '',
      'svix-signature': headers['svix-signature'] || '',
    });
  } catch (error) {
    logger.error('Clerk webhook verification failed:', error);
    throw new Error('Invalid webhook signature');
  }
};

export default clerkClient;
