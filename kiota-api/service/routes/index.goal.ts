import { Router } from 'express';
import GoalController from '../controllers/goal.controller';
import { requireInternalAuth } from '../middleware/auth';

const router = Router();

/**
 * Goal Routes
 * Supports Goal-Driven Milestones deposit pathway (Pathway 3)
 */

// Get goal categories (public - no auth needed)
router.get('/categories', GoalController.getCategories);

// Create a new goal
router.post('/', requireInternalAuth, GoalController.createGoal);

// Get all user goals
router.get('/', requireInternalAuth, GoalController.getGoals);

// Get single goal details
router.get('/:goalId', requireInternalAuth, GoalController.getGoal);

// Update goal
router.put('/:goalId', requireInternalAuth, GoalController.updateGoal);

// Delete/archive goal
router.delete('/:goalId', requireInternalAuth, GoalController.deleteGoal);

// Contribute to goal
router.post('/:goalId/contribute', requireInternalAuth, GoalController.contribute);

export default router;
