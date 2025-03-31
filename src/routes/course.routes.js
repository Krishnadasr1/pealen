import express from 'express';

import {createCourse,listCourses,getCourseDetails,enrollInCourse,getEnrolledCourses,searchCourses,updateCourse,
        deleteCourse,getUsersByCourseId,getUserCountByCourse,markTestAsCompleted
         } from '../controllers/course.controller.js';
import {authenticate,admin } from '../middleware/index.js';

const router = express.Router();

router.post('/createCourse',authenticate,createCourse);
router.get('/listCourses',authenticate,listCourses);
router.get('/getCourseDetails/:courseId',authenticate,getCourseDetails);
router.post('/enrollInCourse/:courseId',authenticate,enrollInCourse);
router.get('/getEnrolledCourses',authenticate,getEnrolledCourses);
router.get('/search', searchCourses);
router.put('/updateCourse/:courseId', authenticate,admin, updateCourse);
router.delete('/deleteCourse/:courseId',authenticate,admin, deleteCourse);
router.get('/getUsersByCourseId/:courseId',authenticate,getUsersByCourseId);
router.get('/getUserCountByCourseId/:courseId',authenticate,getUserCountByCourse);
router.post('/markTestAsCompleted/:videoId',authenticate,markTestAsCompleted);


export default router;