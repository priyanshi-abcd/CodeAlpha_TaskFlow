const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.register = async (req,res)=>{
    const {name,email,password} = req.body;
    try{
        if(!name || !email ||!password){
            return res.status(400).json({message:"All fields are required"});
        }
        const normalizedEmail = email.toLowerCase().trim();
        const existingEmail = await User.findOne({email:normalizedEmail});
        if(existingEmail){
            return res.status(400).json({message:"You are already registred please login"});
        }

    const hashPassword = await bcrypt.hash(password,10);
    const user = await User.create({
        name,
        email: normalizedEmail,
        password: hashPassword
    });
    const userResponse = { id: user.id, name: user.name, email: user.email };
        return res.status(201).json(userResponse);
    }catch(err){
        return res.status(500).json({message:err.message});
    }
};

exports.login = async(req,res)=>{
    try{
        const {email,password} = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const normalizedEmail = email.toLowerCase().trim();

        const user = await User.findOne({email:normalizedEmail});

        if(!user){
            return res.status(400).json({message:"User Not Found Register First"});
        }
        const isMatch = await bcrypt.compare(password,user.password);

        if(!isMatch){
            return res.status(400).json({message:"Password Not Matched"});
        }
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "fallback_secret", {
            expiresIn: "30d"
        });
        return res.status(200).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    }catch(err){
        return res.status(500).json({message:err.message});
    }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ message: "Name field cannot be empty." });
    }

    // Find user by ID (attached by auth middleware) and update their name
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { name: name.trim() },
      { new: true, runValidators: true } 
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: "User node not found." });
    }

    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser
    });
  } catch (error) {
    console.error("Error in updateProfile controller:", error);
    res.status(500).json({ message: "Internal server error structural fault." });
  }
};