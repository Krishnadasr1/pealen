import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET;

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const authenticate = (req, res, next) => {
  const token = req.header('Authorization') ;

  if (!token) {
    const errorMessage = "Access Denied. No Token Provided.";
    return res.status(401).json({ error: errorMessage });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    const errorMessage = "Invalid Token";
    return res.status(401).json({ error: errorMessage });
  }

  req.user = decoded;
  next();
};
