import express from 'express';

import { createAdmin,adminLogin,admincreateCourse } from '../controllers/admin.controller.js';
import {authenticate,admin } from '../middleware/index.js';


const router = express.Router();

router.post('/createAdmin',createAdmin);
router.post('/adminLogin',adminLogin);
router.post('/adminCreateCourse',authenticate,admin,admincreateCourse);

export default router;