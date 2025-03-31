import express from 'express';

import {markTestAsCompleted,manageTests} from '../controllers/test.controller.js';
import {authenticate,admin } from '../middleware/index.js';

const router = express.Router();

router.post('/markTestAsCompleted/:videoId',authenticate,markTestAsCompleted);
router.put('/manageTests/:videoId',authenticate,manageTests);


export default router;