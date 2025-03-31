import prisma from "../config/prismaClient.js";
import elasticClient from "../config/elasticsearchClient.js";
import { courseSchema } from "../validators/index.js";

export const getCourseVideos = async (req, res) => {
  try {
    const { courseId } = req.params;

    const videos = await prisma.videos.findMany({
      where: { courseId: courseId },
      orderBy: { createdAt: "asc" },
    });

    if (!videos) {
      return res.status(404).json({ message: "Course not found" });
    }

    return res.json({
      message: "Course details fetched successfully",
      videos,
    });
  } catch (error) {
    console.error("Error fetching course details:", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
};


export const getVideoDetails = async (req, res) => {
    try {
      const { VideoId } = req.params;
  
      const video = await prisma.videos.findUnique({
        where: { id: VideoId },
        include:{
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
        
      });
  
      if (!video) {
        return res.status(404).json({ message: "video not found" });
      }
  
      return res.json({
        message: "video details fetched successfully",
        video,
      });
    } catch (error) {
      console.error("Error fetching course details:", error);
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
              videoSteps:video.videoSteps,
              audioUrl: video.audioUrl,
              videoTranscript:video.videoTranscript,
              animationUrl: video.animationUrl,
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
                videoSteps:video.videoSteps,
                audioUrl: video.audioUrl,
                videoTranscript:video.videoTranscript,
                animationUrl: video.animationUrl,
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


export const markVideoAsWatched = async (req, res) => {
    try {
      const { videoId } = req.params;
      const userId = req.user.id; // Assuming user is authenticated
  
      // Check if the progress record exists
      let progress = await prisma.progress.findFirst({
        where: { userId, videoId },
      });
  
      if (!progress) {
        // Create progress record if not exists
        progress = await prisma.progress.create({
          data: {
            userId,
            videoId,
            completed: true,
            completedAt: new Date(),
          },
        });
      } else {
        // Update progress to mark video as watched
        progress = await prisma.progress.update({
          where: { id: progress.id },
          data: { completed: true, completedAt: new Date() },
        });
      }
  
      return res.json({
        message: "Video marked as watched",
        progress,
      });
    } catch (error) {
      console.error("Error marking video as watched:", error);
      return res.status(500).json({ error: "Something went wrong" });
    }
};