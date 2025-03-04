import prisma from "../config/prismaClient.js";

export const userRegister = async (req, res) => {

  try {
      
      const { firstName, lastName, email } = req.body;

      const existingUser = await prisma.user.findUnique({ where: { email } });
      
      if(existingUser){
        return res.status(400).json({message:"user already exists"})
      }
  
      const user = await prisma.user.create({
        data: { firstName, lastName, email},
      });
  
      res.status(200).json({message:"user registered successfully",user});
    } catch (error) {
      console.log(error);
      
      res.status(500).json({ message: "User registration failed" });
    }
};

