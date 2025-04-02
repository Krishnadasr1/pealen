import express from 'express';

import {userRegister,sendOtp,verifyOtp,firstLogin,updateUserProfile,getUserProfile} from '../controllers/user.controller.js';
import {userSchema} from '../validators/index.js';
import { validateRequest,authenticate,admin,uploadImage,uploadMultipleImages } from '../middleware/index.js';

const router = express.Router();

router.post('/register',validateRequest(userSchema),userRegister);
router.post('/sendOtp',sendOtp);
router.post('/verifyOtp',verifyOtp);
router.post('/firstLogin',authenticate,firstLogin);
router.put('/updateProfile',authenticate,uploadImage,updateUserProfile);
router.get('/getUserProfile',authenticate,getUserProfile);
 

export default router;