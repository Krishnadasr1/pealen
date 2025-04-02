import prisma from "../config/prismaClient.js";
import axios from "axios";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const userRegister = async (req, res) => {

  try {
      
      const { firstName, lastName, email ,phone} = req.body;

      const existingUser = await prisma.user.findUnique({ where: { email } });
      
      if(existingUser){
        return res.status(400).json({message:"user already exists"})
      }
  
      const user = await prisma.user.create({
        data: { firstName, lastName, email,phone},
      });
  
      res.status(200).json({message:"user registered successfully",user});
    } catch (error) {
      console.log(error);
      
      res.status(500).json({ message: "User registration failed" });
    }
};

export const sendOtp = async(req,res)=>{

  try{

    const {phone} = req.body;
    
    if (!phone) {
      return res.status(400).json({ error: "Phone number is required" });
    }

    const existingUser = await prisma.user.findUnique({ where: { phone } });
      
      if(!existingUser){
        return res.status(400).json({message:"user not found,please register to continue",existingUser:false})
      }

    const API_KEY = process.env.TWO_FACTOR_API_KEY


    const response = await axios.get(
      `https://2factor.in/API/V1/${API_KEY}/SMS/${phone}/AUTOGEN3`
    );

    if (response.data.Status !== "Success") {
      return res.status(500).json({ error: "Failed to send OTP" });
    }

    res.json({ message: "OTP sent successfully", session_id: response.data.Details });

  }

  catch (error) {
    console.log(error);
    
    res.status(500).json({ error: "Error sending OTP" });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ error: "Phone number and OTP are required" });
    }

    const API_KEY = process.env.TWO_FACTOR_API_KEY

    const response = await axios.get(
      `https://2factor.in/API/V1/${API_KEY}/SMS/VERIFY3/${phone}/${otp}`
    );

    if (response.data.Status !== "Success") {
      return res.status(401).json({ error: "Invalid OTP" });
    }

    const JWT_SECRET = process.env.JWT_SECRET

    const user = await prisma.user.findUnique({
      where: { phone },
    });

    //  Generate JWT Token
    const token = jwt.sign({ phone,id:user.id,isAdmin:user.isAdmin }, JWT_SECRET);
    const name = user.firstName;
    res.json({ message: "OTP verified successfully", token,name,isLoggedinonce});
    
  } catch (error) {
    console.log(error);
    
    res.status(500).json({ error: "Error verifying OTP" });
  }
};

export const firstLogin = async(req,res) => {
  try{
    const id = req.user.id;
    if(!id){
      res.status(400).json({message:"id required"});
    }
    const user = await prisma.user.findUnique({where:{id}});
    if(!user){
      res.status(404).json({message:"user not found"});
    }
    const updatedUser = await prisma.user.update({
      where:{id},
      data:{isLoggedinonce:true}
    });

    res.status(200).json({message:"success"});
  }
  catch(error){
    console.log(error);
    res.status(500).json({message:"failed"});
    
  }

};

export const getUserProfile = async(req,res) => {
  try{
    const userId = req.user.id;
    
    if(!userId){
      return res.status(401).json({message:"User not found"});
    }
    const user = await prisma.user.findUnique({
      where:{id:req.user.id},
      select:{
        firstName:true,
        lastName:true,
        email:true,
        ageRange:true,
        location:true,
        phone:true,
        profilePicture:true
      }
    });
    return res.status(200).json({message:"success",user});
    }
  catch(error){
    console.log(error);
    return res.status(500).json({message:"failed to fetch user profile"});
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!userId) {
      return res.status(401).json({ message: "User not found" });
    }

    const userData = req.body;

    if (req.file) {
      userData.profilePicture = req.file.path; 
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: userData,
    });

    return res
      .status(200)
      .json({ message: "Profile updated successfully", updatedUser });
  } catch (error) {
    console.log("Error updating user profile:", error);
    return res.status(500).json({ message: "Failed to update user profile" });
  }
};

// export const deleteUserAccount = async(req,res) => {
//   try{
//     const userId = req.user.id;

//     if(!userId){
//       return res.status(401).json({message:"user not found"});
//     }

//     await prisma.user.delete({where:{id:userId}});

//     return res.status(200).json({message:"Account deleted successfully"});
//   }
//   catch(error){
//     console.log(error);
    
//     return res.status(500).json({message:"Failed to delete account"});
//   }
//}