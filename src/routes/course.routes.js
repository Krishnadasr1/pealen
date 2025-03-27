import express from 'express';

import {createCourse,listCourses,getCourseDetails,getVideoDetails,enrollInCourse,getEnrolledCourses,searchCourses,updateCourse,
        deleteCourse,manageVideos,getCourseVideos,getUsersByCourseId,getUserCountByCourse,markVideoAsWatched,markTestAsCompleted
         } from '../controllers/course.controller.js';
import {authenticate,admin } from '../middleware/index.js';

const router = express.Router();

router.post('/createCourse',authenticate,createCourse);
router.get('/listCourses',authenticate,listCourses);
router.get('/getCourseDetails/:courseId',authenticate,getCourseDetails);
router.get('/getVideoDetails/:VideoId',authenticate,getVideoDetails);
router.get('/getCourseVideos/:courseId',authenticate,getCourseVideos);
router.post('/enrollInCourse/:courseId',authenticate,enrollInCourse);
router.get('/getEnrolledCourses',authenticate,getEnrolledCourses);
router.get('/search', searchCourses);
router.put('/updateCourse/:courseId', authenticate,admin, updateCourse);
router.put('/manageVideos/:courseId',authenticate,admin,manageVideos);
router.delete('/deleteCourse/:courseId',authenticate,admin, deleteCourse);
router.get('/getUsersByCourseId/:courseId',authenticate,getUsersByCourseId);
router.get('/getUserCountByCourseId/:courseId',authenticate,getUserCountByCourse);
router.post('/markVideoAsWatched/:videoId',authenticate,markVideoAsWatched);
router.post('/markTestAsCompleted/:videoId',authenticate,markTestAsCompleted);


export default router;