import { Router } from 'express';
import PrivyAuthController from '../controllers/privy-auth.controller';
import { requireInternalAuth } from '../middleware/auth';

const router: Router = Router();

/**
 * POST /auth/sync
 * Sync user from Privy to our database
 * Called after frontend successfully authenticates with Privy
 * 
 * Body: { idToken: string }
 */
router.post('/sync', PrivyAuthController.syncUser);

/**
 * POST /auth/verify
 * Verify Privy access token
 * 
 * Headers: Authorization: Bearer <accessToken>
 */
router.post('/verify', PrivyAuthController.verifyToken);

/**
 * POST /auth/server-create
 * Create user from server side
 * For admin/bulk operations only
 * 
 * Body: { phoneNumber?: string, email?: string }
 */
router.post('/server-create', PrivyAuthController.createServerUser);

/**
 * GET /auth/me
 * Get current authenticated user
 * 
 * Note: Add auth middleware here when you create it
 */
router.get('/me', requireInternalAuth, PrivyAuthController.getCurrentUser);

/**
 * POST /auth/refresh
 * Refresh user data from Privy
 * 
 * Body: { idToken: string }
 * 
 * Note: Add auth middleware here when you create it
 */
router.post('/refresh', requireInternalAuth, PrivyAuthController.refreshFromPrivy);

/**
 * Catch-all route
 * Must be last
 */
router.use((req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.status(200);
    return res.json({ service: process.env.SERVICE_NAME || 'Kiota Auth Service' });
});

export default router;
