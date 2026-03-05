import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";
import userModel from "../models/userModel.js";

//create token
const createToken = (id) => {
    return jwt.sign({id}, process.env.JWT_SECRET || "your_jwt_secret_key_here");
}

//login user
const loginUser = async (req,res) => {
    const {email, password} = req.body;
    try{
        const user = await userModel.findOne({email})

        if(!user){
            return res.json({success:false,message: "User does not exist"})
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if(!isMatch){
            return res.json({success:false,message: "Invalid credentials"})
        }

        const token = createToken(user._id)
        res.json({success:true,token})
    } catch (error) {
        console.log(error);
        res.json({success:false,message:"Error"})
    }
}

//register user
const registerUser = async (req,res) => {
    const {name, email, password} = req.body;
    console.log("Registration attempt:", {name, email, password: password ? "***" : "missing"});
    
    try{
        //check if user already exists
        const exists = await userModel.findOne({email})
        if(exists){
            console.log("User already exists:", email);
            return res.json({success:false,message: "User already exists"})
        }

        // validating email format & strong password
        if(!validator.isEmail(email)){
            console.log("Invalid email format:", email);
            return res.json({success:false,message: "Please enter a valid email"})
        }
        if(password.length<8){
            console.log("Password too short:", password.length);
            return res.json({success:false,message: "Please enter a strong password"})
        }

        // hashing user password
        const salt = await bcrypt.genSalt(10); // the more no. round the more time it will take
        const hashedPassword = await bcrypt.hash(password, salt)

        const newUser = new userModel({name, email, password: hashedPassword})
        console.log("Attempting to save user:", {name, email});
        const user = await newUser.save()
        console.log("User saved successfully:", user._id);
        
        const token = createToken(user._id)
        console.log("Token created for user:", user._id);
        res.json({success:true,token})

    } catch(error){
        console.log("Registration error:", error);
        res.json({success:false,message:"Error: " + error.message})
    }
}

export {loginUser, registerUser}