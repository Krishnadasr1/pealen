import prisma from "../config/prismaClient.js";
import { courseSchema } from "../validators/course.validator.js";

export const createCourse = async (req, res) => {
  try { 
    const validatedData = courseSchema.parse(req.body);

    const instructor = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!instructor || !instructor.isAdmin) {
      return res.status(403).json({ message: "Unauthorized: Only admins can create courses" });
    }

    const categoryExists = await prisma.category.findUnique({
      where: { id: validatedData.categoryId },
    });

    if (!categoryExists) {
      return res.status(400).json({ message: "Invalid categoryId: Category does not exist" });
    }

    // Use a transaction to ensure course and videos are created together
    const result = await prisma.$transaction(async (prisma) => {
    
      const newCourse = await prisma.course.create({
        data: {
          title: validatedData.title,
          description: validatedData.description,
          thumbnail: validatedData.thumbnail,
          courseContents: validatedData.courseContents,
          categoryId: validatedData.categoryId,
          price:0,
          instructorId: req.user.id, // Instructor ID from authenticated user
        },
      });

      let createdVideos = [];
      if (validatedData.videos && validatedData.videos.length > 0) {
        createdVideos = await prisma.videos.createMany({
          data: validatedData.videos.map((video) => ({
            title: video.title,
            videoThumbnail: video.videoThumbnail,
            videoUrl: video.videoUrl,
            audioUrl: video.audioUrl,
            courseId: newCourse.id, // Associate videos with the newly created course
          })),
        });
      }

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
      orderBy: { createdAt: "desc" }, // Newest courses first
    });

    // Count total courses for pagination info
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
            audioUrl: true,
            createdAt: true,
          },
          orderBy: { createdAt: "asc" }, 
        },
      },
    });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    return res.json({
      message: "Course details fetched successfully",
      course,
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
    // Check if the course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Check if the user is already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    if (existingEnrollment) {
      return res.status(400).json({ message: "User is already enrolled in this course" });
    }

  
    const enrollment = await prisma.enrollment.create({
      data: {
        userId,
        courseId,
      },
    });

    return res.status(201).json({
      message: "Enrolled successfully",
      enrollment,
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
