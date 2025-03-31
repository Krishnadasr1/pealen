import prisma from "../config/prismaClient.js";
import elasticClient from "../config/elasticsearchClient.js";
import { courseSchema } from "../validators/index.js";



export const createCourse = async (req, res) => {
  try {
    const validatedData = courseSchema.parse(req.body);

    // Check if the instructor exists
    const instructor = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!instructor) {
      return res.status(403).json({ message: "Unauthorized: Only admins can create courses" });
    }

    // Check if the category exists
    const categoryExists = await prisma.category.findUnique({
      where: { id: validatedData.categoryId },
    });

    if (!categoryExists) {
      return res.status(400).json({ message: "Invalid categoryId: Category does not exist" });
    }

    // Use a transaction to create the course, videos, tests, questions, challenge, and community
    const result = await prisma.$transaction(async (prisma) => {
      // Step 1: Create the Course
      const newCourse = await prisma.course.create({
        data: {
          title: validatedData.title,
          description: validatedData.description,
          thumbnail: validatedData.thumbnail,
          courseContents: validatedData.courseContents,
          categoryId: validatedData.categoryId,
          price: 0,
          instructorId: req.user.id, // Instructor ID from authenticated user
        },
      });

      // Step 2: Create Videos with associated tests
      let createdVideos = [];
      if (validatedData.videos && validatedData.videos.length > 0) {
        for (const video of validatedData.videos) {
          // Create Video
          const createdVideo = await prisma.videos.create({
            data: {
              title: video.title,
              videoThumbnail: video.videoThumbnail,
              videoUrl: video.videoUrl,
              demoVideourl: video.demoVideourl,
              videoSteps: video.videoSteps,
              audioUrl: video.audioUrl,
              videoTranscript:video.videoTranscript,
              animationUrl: video.animationUrl,
              courseId: newCourse.id,
            },
          });

          createdVideos.push(createdVideo);

          // Create Test for this video
          if (video.testQuestions && video.testQuestions.length > 0) {
            const test = await prisma.test.create({
              data: {
                videoId: createdVideo.id, // Associate test with video
              },
            });

            // Create Questions
            for (const question of video.testQuestions) {
              await prisma.question.create({
                data: {
                  testId: test.id,
                  text: question.text,
                  options: question.options,
                  correctAnswer: question.correctAnswer,
                },
              });
            }

            // Create Challenge for the test (only one per test)
            if (video.challengeDescription) {
              await prisma.challenge.create({
                data: {
                  testId: test.id, // Associate challenge with the test
                  description: video.challengeDescription,
                },
              });
            }
          }
        }
      }

      // Step 3: Create a Community for the Course
      const community = await prisma.community.create({
        data: {
          courseId: newCourse.id,
          communityName: newCourse.title + " Community",
        },
      });

      console.log("Community Created:", community);

      // Step 4: Index the Course in ElasticSearch
      await elasticClient.index({
        index: "courses",
        id: newCourse.id,
        body: {
          title: newCourse.title,
          description: newCourse.description,
          instructor: `${instructor.firstName} ${instructor.lastName}`,
          category: categoryExists.name,
          price: newCourse.price,
          videos: validatedData.videos?.map((v) => v.title) || [],
          enrollments: 0,
        },
      });

      return { newCourse, createdVideos };
    });

    return res.status(201).json({
      message: "Course created successfully",
      course: result.newCourse,
      videos: result.createdVideos,
    });

  } catch (error) {
    console.error("Error creating course:", error);
    return res.status(400).json({ error: error.message });
  }
};


export const listCourses = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const courses = await prisma.course.findMany({
      skip,
      take: limit,
      include: {
        instructor: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        category: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" }, 
    });

    const totalCourses = await prisma.course.count();

    return res.json({
      message: "Courses fetched successfully",
      page,
      totalPages: Math.ceil(totalCourses / limit),
      totalCourses,
      courses,
    });
  } catch (error) {
    console.error("Error fetching courses:", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
};


export const getCourseDetails = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id; // Assuming user ID is available from authentication middleware

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        instructor: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        category: {
          select: { id: true, name: true },
        },
        videos: {
          select: {
            id: true,
            title: true,
            videoThumbnail: true,
            videoUrl: true,
            demoVideourl: true,
            videoSteps: true,
            audioUrl: true,
            videoTranscript:true,
            animationUrl: true,
            createdAt: true,
            test: {
              select: {
                id: true,
                questions: {
                  select: {
                    id: true,
                    text: true,
                    options: true,
                    correctAnswer: true,
                  },
                },
                challenge: {
                  select: {
                    id: true,
                    description: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Fetch user progress for the course
    const progressRecords = await prisma.progress.findMany({
      where: {
        userId,
        video: {
          courseId,
        },
      },
    });

    // Convert progress records to a map for easy lookup
    const progressMap = new Map(
      progressRecords.map((p) => [p.videoId, p])
    );

    let isPreviousCompleted = true; // First video should be unlocked

    // Map videos with `isUnlocked` flag
    const videosWithProgress = course.videos.map((video, index) => {
      const progress = progressMap.get(video.id);
      const isWatched = progress?.completed || false;
      const isTestCompleted = progress?.testCompleted || false;

      // Unlock the first video or if the previous one is completed
      const isUnlocked = index === 0 || isPreviousCompleted;
      isPreviousCompleted = isWatched && isTestCompleted; // Update for next iteration

      return {
        ...video,
        isUnlocked,
      };
    });

    return res.json({
      message: "Course details fetched successfully",
      course: {
        ...course,
        videos: videosWithProgress,
      },
    });
  } catch (error) {
    console.error("Error fetching course details:", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
};


export const enrollInCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return res.status(404).json({ message: "Course not found" });

    const existingEnrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });

    if (existingEnrollment) return res.status(400).json({ message: "Already enrolled" });

    const result = await prisma.$transaction(async (prisma) => {
      const enrollment = await prisma.enrollment.create({
        data: { userId, courseId },
      });

      const community = await prisma.community.findUnique({ where: { courseId } });
      if (community) {
        await prisma.communityMember.create({
          data: { userId, communityId: community.id },
        });
      }

      return { enrollment, community };
    });

    return res.status(201).json({
      message: "Enrolled successfully",
      enrollment: result.enrollment,
      community: result.community,
    });
  } catch (error) {
    console.error("Error enrolling in course:", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
};


export const getEnrolledCourses = async (req, res) => {
  try {
    const userId = req.user.id;

    const enrolledCourses = await prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            thumbnail: true,
            price: true,
            category: {
              select: { name: true },
            },
            instructor: {
              select: { firstName: true, lastName: true },
            },
            createdAt: true,
          },
        },
      },
    });

    const courses = enrolledCourses.map((enrollment) => ({
      id: enrollment.course.id,
      title: enrollment.course.title,
      description: enrollment.course.description,
      thumbnail: enrollment.course.thumbnail,
      price: enrollment.course.price,
      category: enrollment.course.category.name,
      instructor: `${enrollment.course.instructor.firstName} ${enrollment.course.instructor.lastName}`,
      enrolledAt: enrollment.enrolledAt,
    }));

    return res.status(200).json({ enrolledCourses: courses });
  } catch (error) {
    console.error("Error fetching enrolled courses:", error);
    return res.status(500).json({ error: "Failed to retrieve enrolled courses" });
  }
};


export const searchCourses = async (req, res) => {
  try {
    const { query, category, minPrice, maxPrice, sortBy, order } = req.query;

    const esQuery = {
      index: "courses",
      body: {
        query: {
          bool: {
            must: query
              ? [
                  {
                    bool: {
                      should: [
                        { match_phrase_prefix: { title: query } }, // Autocomplete
                        { match: { title: { query, fuzziness: "AUTO" } } }, // Fuzzy search
                        { match: { description: { query, fuzziness: "AUTO" } } },
                        { match: { instructor: { query, fuzziness: "AUTO" } } },
                        { match: { videos: { query, fuzziness: "AUTO" } } },
                      ],
                      minimum_should_match: 1,
                    },
                  },
                ]
              : [],
            filter: [],
          },
        },
        sort: [],
      },
    };

    if (category) esQuery.body.query.bool.filter.push({ term: { category } });
    if (minPrice || maxPrice) {
      esQuery.body.query.bool.filter.push({
        range: { price: { gte: minPrice || 0, lte: maxPrice || 9999 } },
      });
    }
    if (sortBy) {
      esQuery.body.sort.push({ [sortBy]: { order: order || "desc" } });
    }

    const { hits } = await elasticClient.search(esQuery);
    const courses = hits.hits.map(hit => ({ id: hit._id, ...hit._source }));

    return res.json({ courses });
  } catch (error) {
    console.error("Error searching courses:", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
};


export const updateCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const validatedData = courseSchema.parse(req.body);

    const existingCourse = await prisma.course.findUnique({
      where: { id: courseId },
      include: { videos: true, instructor: true, category: true }, // Fetch related data
    });

    if (!existingCourse) {
      return res.status(404).json({ message: "Course not found" });
    }

    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: {
        title: validatedData.title,
        description: validatedData.description,
        thumbnail: validatedData.thumbnail,
        courseContents: validatedData.courseContents,
        categoryId: validatedData.categoryId,
        price: validatedData.price || existingCourse.price,
      },
      include: { videos: true }, // Fetch updated videos
    });

    // Fetch the updated list of videos to sync with Elasticsearch
    const updatedVideos = await prisma.videos.findMany({
      where: { courseId },
      select: { title: true },
    });

    // 🔹 Update Elasticsearch Index with Course + Videos
    await elasticClient.update({
      index: "courses",
      id: updatedCourse.id,
      body: {
        doc: {
          title: updatedCourse.title,
          description: updatedCourse.description,
          instructor: `${existingCourse.instructor.firstName} ${existingCourse.instructor.lastName}`,
          category: existingCourse.category.name,
          price: updatedCourse.price,
          videos: updatedVideos.map(v => v.title), // Sync updated videos
        },
      },
    });

    return res.json({ message: "Course updated successfully", course: updatedCourse });
  } catch (error) {
    console.error("Error updating course:", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
};


export const deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        videos: { select: { id: true } },
        community: { select: { id: true } },
      },
    });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    await prisma.$transaction(async (prisma) => {
      await prisma.enrollment.deleteMany({ where: { courseId } });
      await prisma.review.deleteMany({ where: { courseId } });
      await prisma.courseProgress.deleteMany({ where: { courseId } });

      const videoIds = course.videos.map((video) => video.id);
      if (videoIds.length > 0) {
        await prisma.progress.deleteMany({ where: { videoId: { in: videoIds } } });
      }

      const tests = await prisma.test.findMany({
        where: { videoId: { in: videoIds } },
        select: { id: true },
      });

      const testIds = tests.map((test) => test.id);
      if (testIds.length > 0) {
        await prisma.question.deleteMany({ where: { testId: { in: testIds } } });
        await prisma.challenge.deleteMany({ where: { testId: { in: testIds } } });
        await prisma.test.deleteMany({ where: { videoId: { in: videoIds } } });

      }

      await prisma.videos.deleteMany({ where: { courseId } });

      if (course.community) {
        await prisma.communityMember.deleteMany({ where: { communityId: course.community.id } });
        await prisma.community.delete({ where: { id: course.community.id } });
      }

      await prisma.course.delete({ where: { id: courseId } });
    });

    await elasticClient.delete({
      index: "courses",
      id: courseId,
    });

    return res.json({ message: "Course and all related data deleted successfully" });
  } catch (error) {
    console.error("Error deleting course:", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
};


export const getUsersByCourseId = async (req,res) => {
  try{
    const {courseId} = req.params;

    if(!courseId){
      return res.status(401).json({message:"Course id required"});
    }

    const checkCourse = await prisma.course.findUnique({where:{id:courseId}});

    if(!checkCourse){
      return res.status(401).json({message:"Course not found"});
    }

    const enrollments = await prisma.enrollment.findMany({
      where:{courseId:courseId},
      include:{
        user:{
          select:{
            firstName : true,
            lastName : true,
            email : true,
            phone : true
          }
        }
      }
    });
    
    if(!enrollments){
      return res.status(404).json({message:"No users enrolled in the course"});
    }

    const users = enrollments.map(enrollment => enrollment.user);

    return res.status(200).json({message:"Enrolled users retrieved successfully",users});
  }
  catch(error){
    console.log(error);
    return res.status(500).json({message:"Failed to retrieve users enrolled"});
  }
};


export const getUserCountByCourse = async (req,res) => {
  try{
    const {courseId} = req.params;

    if(!courseId){
      return res.status(401).json({message:"Course id required"});
    }

    const checkCourse = await prisma.course.findUnique({where:{id:courseId}});

    if(!checkCourse){
      return res.status(401).json({message:"Course not found"});
    }

    const enrollments = await prisma.enrollment.count({
      where:{courseId:courseId},
    });
    
    if(!enrollments){
      return res.status(404).json({message:"No users enrolled in the course"});
    }


    return res.status(200).json({message:"Enrolled users retrieved successfully",enrollments});
  }
  catch(error){
    console.log(error);
    return res.status(500).json({message:"Failed to retrieve users enrolled"});
  }
};

