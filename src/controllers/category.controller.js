import prisma from "../config/prismaClient.js";


export const addCategory = async (req, res) => {

    try {
        
        const { name } = req.body;
  
        const existingCategory = await prisma.category.findUnique({ where: { name } });
        
        if(existingCategory){
          return res.status(400).json({message:"category already exists"})
        }
    
        const category = await prisma.category.create({
          data: { name },
        });
    
        res.status(200).json({message:"category created successfully",category});
      } catch (error) {
        console.log(error);
        
        res.status(500).json({ message: "failed" });
      }
};

export const listCategories = async (req, res) => {
    try {
      
      const categories = await prisma.category.findMany({});
  
      return res.json({
        message: "categories fetched successfully",
        categories,
      });
    } catch (error) {
      console.error("Error fetching courses:", error);
      return res.status(500).json({ error: "Something went wrong" });
    }
};