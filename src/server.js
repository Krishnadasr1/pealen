import dotenv from "dotenv";
import app from "./app.js";
import prisma from "./config/prismaClient.js";

dotenv.config();

const PORT = process.env.PORT || 3000;

// Ensure database connection before starting server
async function startServer() {
  try {
    await prisma.$connect();
    console.log("Connected to the database");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to connect to the database", error);
    process.exit(1);
  }
}

startServer();