import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import "dotenv/config"

const userSchema= new mongoose.Schema({
username:{
    type:String,
    required:true,
    unique:true,
    lowercase:true,
    trim:true,
    index:true,
},
email:{
    type:String,
    required:true,
    unique:true,
    trim:true
},

password:{
    type:String,
    required:[true,"Password is required"],
    trim:true,   
},
fullName:{
    type:String,
    required:true,
    trim:true,
    index:true
},
avatar:{
    type:String,
    default:'default_avatar.jpg'
},
coverImage:{
    type:String,
    default:'default_cover.jpg'
},
watchHistory:[
    {
        type: mongoose.Schema.Types.ObjectId,
        ref:'Video'
    },
],
likedVideos:[
    {
        type: mongoose.Schema.Types.ObjectId,
        ref:'Video'
    },
],
refreshToken:{
    type:String
}
},{timestamps:true});

userSchema.pre("save",async function (next){
if(!this.isModified("password")) return next();
this.password = await bcrypt.hash(this.password,10);
next();
})
userSchema.methods.isPasswordCorrect = async function(password){
 return await bcrypt.compare(password,this.password);
}
userSchema.methods.generateAccessToken= function(){
    console.log(this._id,this.username);
    return jwt.sign(
        {
            _id:this._id,
            username:this.username,
            email:this.email,
            fullName:this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken= function(){
    return jwt.sign(
        {
            _id:this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User =mongoose.model('User',userSchema);