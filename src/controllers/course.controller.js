import prisma from "../config/prismaClient.js";
import elasticClient from "../config/elasticsearchClient.js";
import { courseSchema } from "../validators/index.js";

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
            demoVideourl:video.demoVideourl,
            audioUrl: video.audioUrl,
            demoAudiourl:video.demoAudiourl,
            courseId: newCourse.id, // Associate videos with the newly created course
          })),
        });
      }

      await elasticClient.index({
        index: "courses",
        id: newCourse.id,
        body: {
          title: newCourse.title,
          description: newCourse.description,
          instructor: `${instructor.firstName} ${instructor.lastName}`,
          category: categoryExists.name,
          price: newCourse.price,
          videos: validatedData.videos?.map(v => v.title) || [],
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
            demoVideourl:true,
            audioUrl: true,
            demoAudiourl:true,
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


export const manageVideos = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { addVideos, updateVideos, removeVideoIds } = req.body;

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { videos: true },
    });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    let updatedVideos = [...course.videos];

    await prisma.$transaction(async (prisma) => {
      // 🔹 Add new videos
      if (addVideos && addVideos.length > 0) {
        const newVideos = await prisma.videos.createMany({
          data: addVideos.map((video) => ({
            title: video.title,
            videoThumbnail: video.videoThumbnail,
            videoUrl: video.videoUrl,
            demoVideourl: video.demoVideourl,
            audioUrl: video.audioUrl,
            demoAudiourl: video.demoAudiourl,
            courseId: course.id,
          })),
        });

        const newlyAddedVideos = await prisma.videos.findMany({
          where: { courseId: course.id },
          orderBy: { createdAt: "asc" },
        });

        updatedVideos = newlyAddedVideos;
      }

      // 🔹 Update existing videos
      if (updateVideos && updateVideos.length > 0) {
        for (const video of updateVideos) {
          await prisma.videos.update({
            where: { id: video.id },
            data: {
              title: video.title,
              videoThumbnail: video.videoThumbnail,
              videoUrl: video.videoUrl,
              demoVideourl: video.demoVideourl,
              audioUrl: video.audioUrl,
              demoAudiourl: video.demoAudiourl,
            },
          });

          // Update in the list
          const index = updatedVideos.findIndex((v) => v.id === video.id);
          if (index !== -1) updatedVideos[index] = video;
        }
      }

      // 🔹 Remove videos
      if (removeVideoIds && removeVideoIds.length > 0) {
        await prisma.videos.deleteMany({
          where: { id: { in: removeVideoIds } },
        });

        updatedVideos = updatedVideos.filter((v) => !removeVideoIds.includes(v.id));
      }
    });

    // 🔹 Update Elasticsearch immediately
    await elasticClient.update({
      index: "courses",
      id: course.id,
      doc: {
        videos: updatedVideos.map((v) => v.title), // Store only video titles in Elasticsearch
      },
    });

    return res.json({ message: "Videos updated successfully", videos: updatedVideos });
  } catch (error) {
    console.error("Error managing videos:", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
};


export const deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { videos: true },
    });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    await prisma.$transaction(async (prisma) => {
      // 🔹 Delete all related videos first
      await prisma.videos.deleteMany({ where: { courseId } });

      // 🔹 Now delete the course
      await prisma.course.delete({ where: { id: courseId } });
    });

    // 🔹 Remove from Elasticsearch
    await elasticClient.delete({
      index: "courses",
      id: courseId,
    });

    return res.json({ message: "Course and all related videos deleted successfully" });
  } catch (error) {
    console.error("Error deleting course:", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
};