import express from 'express';

import{listCommunities,searchCommunities} from '../controllers/community.controller.js'
import {authenticate,admin } from '../middleware/index.js';


const router = express.Router();

router.get('/listCommunities',authenticate,listCommunities);
router.get('/searchCommunities',authenticate,searchCommunities);


export default router;