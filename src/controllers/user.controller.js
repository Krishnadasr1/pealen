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
    const token = jwt.sign({ phone }, JWT_SECRET);

    res.json({ message: "OTP verified successfully", token,exist:!!user });
    
  } catch (error) {
    res.status(500).json({ error: "Error verifying OTP" });
  }
};