# Clerk Authentication Migration Guide

This guide explains how to migrate from JWT-based authentication to Clerk for the KitchenOnWheels backend.

## Overview

The backend now supports **Clerk authentication** as the primary authentication method, while maintaining backward compatibility with legacy JWT authentication.

## What Changed

### 1. User Model
- Added `clerkId` field (required, unique, indexed)
- Made `password` field optional (for Clerk users)
- Added `phone` and `address` fields
- Default `verified` to `true` (Clerk handles email verification)

### 2. Authentication Middleware
- Updated to verify Clerk session tokens
- Extracts user data from Clerk SDK
- Reads role from Clerk `publicMetadata`
- Legacy JWT authentication still available via `authenticateLegacy`

### 3. New Endpoints
- `POST /api/v1/webhooks/clerk` - Clerk webhook handler
- `GET /api/v1/auth/me` - Get current authenticated user
- `PATCH /api/v1/auth/metadata` - Update user metadata

### 4. Environment Variables
```bash
# Required Clerk variables
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# JWT now optional (for legacy support)
JWT_SECRET=...
REFRESH_TOKEN_SECRET=...
```

## Setting Up Clerk

### 1. Create Clerk Application
1. Sign up at [clerk.com](https://clerk.com)
2. Create a new application
3. Copy your API keys from the dashboard

### 2. Configure Webhooks
1. In Clerk Dashboard → Webhooks
2. Add endpoint: `https://your-api.com/api/v1/webhooks/clerk`
3. Subscribe to events:
   - `user.created`
   - `user.updated`
   - `user.deleted`
4. Copy the webhook signing secret

### 3. Set User Roles
Clerk uses `publicMetadata` for role-based access control:

```typescript
// In Clerk Dashboard → Users → User → Metadata
{
  "role": "customer" // or "admin", "logistics"
}
```

Or via API:
```typescript
await clerkClient.users.updateUser(userId, {
  publicMetadata: { role: 'admin' }
});
```

## Frontend Integration

### 1. Install Clerk SDK
```bash
npm install @clerk/clerk-react
# or
npm install @clerk/nextjs
```

### 2. Wrap App with ClerkProvider
```tsx
import { ClerkProvider } from '@clerk/clerk-react';

function App() {
  return (
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
      {/* Your app */}
    </ClerkProvider>
  );
}
```

### 3. Get Session Token
```tsx
import { useAuth } from '@clerk/clerk-react';

function MyComponent() {
  const { getToken } = useAuth();

  const fetchData = async () => {
    const token = await getToken();

    const response = await fetch('https://api.com/endpoint', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  };
}
```

## Authentication Flow

### Clerk Flow (Primary)
1. User signs in via Clerk (frontend)
2. Frontend gets session token from Clerk
3. Frontend sends token in `Authorization: Bearer <token>` header
4. Backend verifies token with Clerk SDK
5. Backend attaches user data to request
6. Request processed with role-based access control

### Legacy JWT Flow (Backward Compatibility)
1. User logs in via `POST /api/v1/auth/login`
2. Backend returns JWT access token
3. Frontend sends token in `Authorization: Bearer <token>` header
4. Backend verifies JWT signature
5. Request processed normally

## Webhook Sync

When users sign up or update their profile in Clerk, webhooks automatically sync data to your database:

```
User signs up in Clerk
  → Clerk sends webhook to /api/v1/webhooks/clerk
  → Webhook verified with signature
  → User created in MongoDB with clerkId
  → User data synced (name, email, role)
```

## Migration Strategy

### For New Projects
✅ Use Clerk authentication exclusively
✅ All new users automatically use Clerk
✅ No JWT setup required

### For Existing Projects with JWT Users

#### Option 1: Keep Both Systems (Recommended)
- Existing users continue using JWT
- New users use Clerk
- Gradually migrate users over time

#### Option 2: Force Migration
1. Create Clerk accounts for all existing users
2. Email users with migration instructions
3. Disable JWT authentication after grace period
4. Update user records with `clerkId`

#### Option 3: Hybrid Approach
```typescript
// Check if user has clerkId
if (user.clerkId) {
  // Use Clerk authentication
  await authenticate(req, res, next);
} else {
  // Use legacy JWT
  await authenticateLegacy(req, res, next);
}
```

## Testing with Clerk

### Using Clerk Test Mode
Clerk provides test mode for development:
- Use `pk_test_...` and `sk_test_...` keys
- Create test users in Clerk Dashboard
- Webhooks work in test mode

### Testing Webhooks Locally
Use Clerk's webhook testing or ngrok:

```bash
# Install ngrok
npm install -g ngrok

# Start your server
npm run dev

# Expose localhost
ngrok http 5000

# Update Clerk webhook URL to ngrok URL
https://abc123.ngrok.io/api/v1/webhooks/clerk
```

## Role-Based Access Control

### Setting Roles via Clerk Dashboard
1. Go to Users → Select User
2. Click "Metadata" tab
3. Add to Public Metadata:
```json
{
  "role": "admin"
}
```

### Setting Roles via API
```typescript
// In your backend
const { clerkClient } = require('@clerk/backend');

await clerkClient.users.updateUser(userId, {
  publicMetadata: { role: 'admin' }
});
```

### Checking Roles in Middleware
```typescript
// Already handled in auth.middleware.ts
req.user = {
  userId: clerkUser.id,
  email: clerkUser.emailAddresses[0]?.emailAddress,
  role: clerkUser.publicMetadata?.role || 'customer'
};
```

## Common Issues & Solutions

### Issue: "Invalid webhook signature"
**Solution:** Verify `CLERK_WEBHOOK_SECRET` matches Clerk Dashboard

### Issue: "User not found in database"
**Solution:** Check webhook is properly configured and firing. Manually sync user:
```typescript
await clerkService.syncUserFromClerk(clerkId);
```

### Issue: "Role not being set"
**Solution:** Ensure `publicMetadata.role` is set in Clerk Dashboard or via API

### Issue: "Token verification fails"
**Solution:** Check `CLERK_SECRET_KEY` is correct and matches your environment (test vs production)

## Security Best Practices

1. **Never expose secret keys** - Use environment variables
2. **Verify webhook signatures** - Always validate incoming webhooks
3. **Use HTTPS** - Required for production webhooks
4. **Rotate secrets regularly** - Update keys periodically
5. **Monitor authentication logs** - Track failed auth attempts

## Production Checklist

- [ ] Clerk production keys configured
- [ ] Webhook endpoint secured with HTTPS
- [ ] Webhook signature verification enabled
- [ ] User roles properly configured in Clerk
- [ ] Frontend using production Clerk keys
- [ ] Legacy JWT authentication disabled (if applicable)
- [ ] All environment variables set correctly
- [ ] Database migration completed (if needed)
- [ ] Email templates configured in Clerk
- [ ] OAuth providers configured (if using social login)

## Support & Resources

- **Clerk Documentation:** https://clerk.com/docs
- **Clerk Discord:** https://discord.com/invite/clerk
- **Backend Issues:** https://github.com/your-org/kitchenonwheels-backend/issues

## Next Steps

1. Set up Clerk account and copy API keys
2. Add keys to `.env` file
3. Configure webhooks in Clerk Dashboard
4. Test authentication flow with Clerk
5. Migrate existing users (if applicable)
6. Update frontend to use Clerk SDK
7. Deploy and monitor
