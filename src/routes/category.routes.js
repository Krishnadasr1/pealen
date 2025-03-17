import express from 'express';

import { addCategory,listCategories } from '../controllers/category.controller.js';
import {authenticate,admin } from '../middleware/index.js';


const router = express.Router();

router.post('/addCategory',authenticate,admin,addCategory);
router.get('/listCategories',listCategories);


export default router;