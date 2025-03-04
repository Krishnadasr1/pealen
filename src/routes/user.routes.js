import express from 'express';

import {userRegister} from '../controllers/user.controller.js';
import {userSchema} from '../validators/index.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = express.Router();

router.post('/register',validateRequest(userSchema),userRegister);
 

export default router;