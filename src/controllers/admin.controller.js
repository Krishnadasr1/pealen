import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../config/prismaClient.js";
import elasticClient from "../config/elasticsearchClient.js";
import { courseSchema } from "../validators/index.js";


export const createAdmin = async (req, res) => {
    try {
     
      const { firstName, password } = req.body;
  
      // Check if username already exists
      const existingAdmin = await prisma.user.findFirst({
        where: { firstName },
      });
  
      if (existingAdmin) {
        return res.status(400).json({ message: "Username already taken" });
      }
  
      // Hash password before saving
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Create new admin
      const newAdmin = await prisma.user.create({
        data: {
          firstName,
          password: hashedPassword,
          isAdmin:true
        },
      });
  
      return res.status(201).json({ message: "Admin created successfully", admin: { id: newAdmin.id, username: newAdmin.firstName } });
    } catch (error) {
      console.error("Error creating admin:", error);
      return res.status(400).json({ error: error.errors || "Something went wrong" });
    }
};

export const adminLogin = async (req, res) => {
  try {

    const { firstName, password } = req.body;

    // Check if the admin exists
    const admin = await prisma.user.findFirst({
      where: { firstName },
    });

    if (!admin) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Validate password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid username or password" });
    }
    
    const adminDetails = {id:admin.id ,username:admin.firstName,isAdmin:admin.isAdmin}
    const JWT_SECRET = process.env.JWT_SECRET;

    const token = jwt.sign(
      { id: admin.id, username: admin.username, isAdmin: admin.isAdmin },
      JWT_SECRET
    );

    return res.json({ message: "Login successful", token ,adminDetails});
  } catch (error) {
    console.error("Admin login error:", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
};

export const admincreateCourse = async (req, res) => {
  try {
    const validatedData = courseSchema.parse(req.body);

    // Check if the instructor exists
    const instructor = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!instructor || !instructor.isAdmin) {
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