import express from 'express';

import {createCourse,listCourses,getCourseDetails,enrollInCourse,getEnrolledCourses} from '../controllers/course.controller.js';
import {authenticate,admin } from '../middleware/index.js';

const router = express.Router();

router.post('/createCourse',authenticate,admin,createCourse);
router.get('/listCourses',authenticate,listCourses);
router.get('/getCourseDetails/:courseId',authenticate,getCourseDetails);
router.post('/enrollInCourse/:courseId',authenticate,enrollInCourse);
router.get('/getEnrolledCourses',authenticate,getEnrolledCourses);

export default router;