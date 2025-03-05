import express from "express";
import cors from "cors";
import userRoutes from '../src/routes/user.routes.js'
import courseRoutes from '../src/routes/course.routes.js'

const app = express();
app.use(express.json());

app.use(
    cors({
      origin: "*",
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    })
  );

app.use('/api/v1/users',userRoutes);
app.use('/api/v1/courses',courseRoutes);





export default app;