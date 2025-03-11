import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../config/prismaClient.js";
import { adminSchema,courseSchema } from "../validators/index.js";

export const createAdmin = async (req, res) => {
    try {
      // Validate request body
      const validatedData = adminSchema.parse(req.body);
      const { username, password } = validatedData;
  
      // Check if username already exists
      const existingAdmin = await prisma.admin.findUnique({
        where: { username },
      });
  
      if (existingAdmin) {
        return res.status(400).json({ message: "Username already taken" });
      }
  
      // Hash password before saving
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Create new admin
      const newAdmin = await prisma.admin.create({
        data: {
          username,
          password: hashedPassword,
        },
      });
  
      return res.status(201).json({ message: "Admin created successfully", admin: { id: newAdmin.id, username: newAdmin.username } });
    } catch (error) {
      console.error("Error creating admin:", error);
      return res.status(400).json({ error: error.errors || "Something went wrong" });
    }
};

export const adminLogin = async (req, res) => {
  try {
    const validatedData = adminSchema.parse(req.body);
    const { username, password } = validatedData;

    // Check if the admin exists
    const admin = await prisma.admin.findUnique({
      where: { username },
    });

    if (!admin) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Validate password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const JWT_SECRET = process.env.JWT_SECRET;

    const token = jwt.sign(
      { id: admin.id, username: admin.username, isAdmin: admin.isAdmin },
      JWT_SECRET
    );

    return res.json({ message: "Login successful", token });
  } catch (error) {
    console.error("Admin login error:", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
};

export const adminCreatecourse = async (req, res) => {
    try { 
      const validatedData = courseSchema.parse(req.body);
  
      const instructor = await prisma.admin.findUnique({
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