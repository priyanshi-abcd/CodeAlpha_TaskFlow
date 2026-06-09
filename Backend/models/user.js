const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
    name:{
        type:String,
        required:true,
        trim: true
    },
    email:{
        type:String,
        required: true,
        unique: true
    },
    password:{
        type:String,
        required:true
    },
    resetPasswordToken:{
        type: String,
        default: undefined
    },
    resetPasswordExpire:{
        type: Date,
        default: undefined
    }
},{timestamps: true});

module.exports = mongoose.model("user",userSchema);