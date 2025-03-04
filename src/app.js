import express from "express";
import cors from "cors";
import userRoutes from '../src/routes/user.routes.js'

const app = express();
app.use(express.json());

app.use(
    cors({
      origin: "*",
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    })
  );

app.use('/api/v1/users',userRoutes)





export default app;