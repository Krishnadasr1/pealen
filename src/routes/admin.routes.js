import express from 'express';

import { createAdmin,adminLogin,adminCreatecourse } from '../controllers/admin.controller.js';
import {authenticate,admin } from '../middleware/index.js';


const router = express.Router();

router.post('/createAdmin',createAdmin);
router.post('/adminLogin',adminLogin);
router.post('/adminCreatecourse',authenticate,admin,adminCreatecourse);

export default router;