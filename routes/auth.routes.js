// /routes/auth.routes.js

import express from 'express';
import { signup, signin, updateProfilePicture, changePassword } from '../controllers/auth.controller.js';
import { checkDuplicateEmail } from '../middlewares/verifySignUp.js';
import { verifyToken } from "../middlewares/authJwt.js";
const router = express.Router();

router.post(
  "/signup",
  [checkDuplicateEmail], // Use the imported function directly
  signup
);

router.post(
  "/signin",
  signin
);

router.put(
  "/user/profile-picture",
  [verifyToken], // <-- THIS IS THE MOST IMPORTANT PART
  updateProfilePicture
);

router.post('/change-password', [verifyToken], changePassword);

// Use the default export for the router
export default router;