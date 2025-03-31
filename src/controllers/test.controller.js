import prisma from "../config/prismaClient.js";
import elasticClient from "../config/elasticsearchClient.js";
import { courseSchema } from "../validators/index.js";

export const manageTests = async (req, res) => {
    try {
      const { videoId } = req.params;
      const { addTest, updateTest, removeTestId } = req.body;
  
      // Check if the video exists
      const video = await prisma.videos.findUnique({
        where: { id: videoId },
        include: { test: true },
      });
  
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }
  
      let updatedTest = video.test || null;
  
      await prisma.$transaction(async (prisma) => {
        //  Add new test
        if (addTest) {
          const newTest = await prisma.test.create({
            data: {
              videoId: video.id,
              questions: {
                create: addTest.questions.map((q) => ({
                  text: q.text,
                  options: q.options,
                  correctAnswer: q.correctAnswer,
                })),
              },
              challenge: addTest.challenge
                ? {
                    create: {
                      description: addTest.challenge.description,
                    },
                  }
                : undefined,
            },
            include: { questions: true, challenge: true },
          });
  
          updatedTest = newTest;
        }
  
        //  Update existing test
        if (updateTest) {
          const { testId, questions, challenge } = updateTest;
  
          // Check if the test exists
          const existingTest = await prisma.test.findUnique({
            where: { id: testId },
            include: { questions: true, challenge: true },
          });
  
          if (!existingTest) {
            return res.status(404).json({ message: "Test not found" });
          }
  
          //  Update test questions
          for (const q of questions) {
            await prisma.question.upsert({
              where: { id: q.id || "non-existing-id" }, // Avoid errors if ID doesn't exist
              update: {
                text: q.text,
                options: q.options,
                correctAnswer: q.correctAnswer,
              },
              create: {
                testId: testId,
                text: q.text,
                options: q.options,
                correctAnswer: q.correctAnswer,
              },
            });
          }
  
          //  Update or create challenge
          if (challenge) {
            await prisma.challenge.upsert({
              where: { testId },
              update: { description: challenge.description },
              create: { testId, description: challenge.description },
            });
          }
  
          // Fetch updated test
          updatedTest = await prisma.test.findUnique({
            where: { id: testId },
            include: { questions: true, challenge: true },
          });
        }
  
        //  Remove test
        if (removeTestId) {
  
          await prisma.question.deleteMany({
            where: { testId: removeTestId },
          });
  
          await prisma.challenge.deleteMany({
            where: { testId: removeTestId },
          });
  
          await prisma.test.delete({
            where: { id: removeTestId },
          });
  
          updatedTest = null;
        }
      });
  
      return res.json({ message: "Test updated successfully", test: updatedTest });
    } catch (error) {
      console.error("Error managing test:", error);
      return res.status(500).json({ error: "Something went wrong" });
    }
};


export const markTestAsCompleted = async (req, res) => {
    try {
      const { videoId } = req.params;
      const userId = req.user.id;
      const { answers } = req.body; // Answers should be an array of {questionId, selectedOption}
      
  
      if (!Array.isArray(answers) || answers.length === 0) {
        return res.status(400).json({ message: "Answers are required" });
      }
  
      // Check video progress
      let progress = await prisma.progress.findFirst({
        where: { videoId, userId }
      });
      
      if (!progress) {
        return res.status(400).json({ message: "Video progress not found" });
      }
  
      // Fetch test questions
      const test = await prisma.test.findUnique({
        where: { videoId },
        include: { questions: true }
      });
  
      if (!test || !Array.isArray(test.questions) || test.questions.length === 0) {
        return res.status(404).json({ message: "Test not found or no questions available" });
      }
      
      let score = 0;
      test.questions.forEach((question) => {
        const userAnswer = answers.find((a) => String(a.questionId) === String(question.id));
        
        
        if (userAnswer && userAnswer.selectedOption === question.correctAnswer) {
          score++;
        }
      });
  
      const totalQuestions = test.questions.length;
      
      const percentage = Math.floor((score / totalQuestions) * 100);
  
      if (percentage >= 50) {
        await prisma.progress.update({
          where: {id:progress.id},
          data: { testCompleted: true }
        });
        return res.status(200).json({ message: "Test passed", percentage });
      } else {
        return res.status(400).json({ message: "Test failed", percentage });
      }
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "Failed to mark test as completed" });
    }
};