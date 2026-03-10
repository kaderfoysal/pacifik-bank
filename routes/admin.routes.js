import express from 'express';
import { getAllUsers, addPoints, deleteUser } from '../controllers/admin.controller.js';
import { verifyToken, isAdmin } from '../middlewares/authJwt.js';

// Create the router using import
const router = express.Router();

// Use the imported middleware functions directly
// These middleware will apply to all routes defined below in this file
router.use(verifyToken, isAdmin);

// GET /api/admin/users -> Get all users
router.get("/users", getAllUsers);

// PUT /api/admin/users/:userId/add-points -> Add points to a user
router.put("/users/:userId/add-points", addPoints);
router.delete('/users/:userId', deleteUser);
// Use a default export for the router
export default router;