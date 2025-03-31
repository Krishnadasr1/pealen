import express from "express";
import cors from "cors";
import userRoutes from '../src/routes/user.routes.js'
import courseRoutes from '../src/routes/course.routes.js'
import adminRoutes from '../src/routes/admin.routes.js'
import categoryRoutes from '../src/routes/category.routes.js'
import communityRoutes from '../src/routes/community.routes.js'
import videoRoutes from '../src/routes/video.routes.js'

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
app.use('/api/v1/admin',adminRoutes);
app.use('/api/v1/category',categoryRoutes);
app.use('/api/v1/community',communityRoutes);
app.use('/api/v1/videos',videoRoutes);



export default app;