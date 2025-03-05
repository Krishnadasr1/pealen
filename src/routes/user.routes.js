import express from 'express';

import {userRegister,sendOtp,verifyOtp,firstLogin} from '../controllers/user.controller.js';
import {userSchema} from '../validators/index.js';
import { validateRequest,authenticate,admin } from '../middleware/index.js';

const router = express.Router();

router.post('/register',validateRequest(userSchema),userRegister);
router.post('/sendOtp',sendOtp);
router.post('/verifyOtp',verifyOtp);
router.post('/firstLogin',firstLogin);
 

export default router;