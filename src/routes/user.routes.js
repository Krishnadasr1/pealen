import express from 'express';

import {userRegister,sendOtp,verifyOtp,firstLogin} from '../controllers/user.controller.js';
import {userSchema} from '../validators/index.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/register',validateRequest(userSchema),userRegister);
router.post('/sendOtp',sendOtp);
router.post('/verifyOtp',verifyOtp);
router.post('/firstLogin',firstLogin);
 

export default router;