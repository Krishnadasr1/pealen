import express from 'express';

import {getCourseVideos,getVideoDetails,manageVideos,markVideoAsWatched} from '../controllers/video.controller.js';
import {authenticate,admin } from '../middleware/index.js';

const router = express.Router();


router.get('/getVideoDetails/:VideoId',authenticate,getVideoDetails);
router.get('/getCourseVideos/:courseId',authenticate,getCourseVideos);
router.put('/manageVideos/:courseId',authenticate,admin,manageVideos);
router.post('/markVideoAsWatched/:videoId',authenticate,markVideoAsWatched);

export default router;