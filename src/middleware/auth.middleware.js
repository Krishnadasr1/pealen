import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET;

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    const errorMessage = "Internal Server Error";
    logger.error(errorMessage);
    return null;
  }
};

export const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    const errorMessage = "Access Denied. No Token Provided.";
    logger.error(errorMessage);
    return res.status(401).json({ error: errorMessage });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    const errorMessage = "Invalid Token";

    logger.error(errorMessage);
    return res.status(401).json({ error: errorMessage });
  }

  req.user = decoded;
  next();
};
