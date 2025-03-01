import {asyncHandler} from "../utils/asyncHandler.js"
import {apiError} from "../utils/apiError.js"
import {apiResponse} from "../utils/apiResponse.js"
import {User} from "../models/user.models.js"
import {fileUploader} from "../utils/cloudinary.js"

 const registerUser = asyncHandler( async (req,res)=>{
 const {username,email,password,fullName}=req.body;
//We added multer middleware to register route 

 //validation of empty
if([username,email,password,fullName].some((field)=>field.trim()==="")){
   throw new apiError("All feild are required",400);
}
//checking if user exits
  const existedUser = await User.findOne({
   $or:[{email},{username}]
  })
  if(existedUser)throw new apiError("User with email or username already exits",409)

   // checking for multer file specially avatar
   const localAvatarPath= req.files?.avatar[0]?.path;
   const localCoverImagePath = req.files?.coverImage?.[0]?.path ?? null;


  if(!localAvatarPath) throw new apiError("Avatar file is required",400);
  
  //uploading files to cloudinary
const avatar= await fileUploader(localAvatarPath);
const coverImage= await fileUploader(localCoverImagePath);

if(!avatar) throw new apiError("Avatar file is required",400);

//creating entry to database
const user = await User.create({
   email,
   fullName,
   username:username.toLowerCase(),
   password,
   avatar:avatar.url,
   coverImage:coverImage?.url ||""
})
//checking if user created and removing password and refreshToken feild
const createdUser = await User.findById(user._id).select("-password -refreshToken");

if(!createdUser) throw new apiError("Something went wrong while registering the user",500)

//returning response   
console.log("User registered successfully !") 
   return res.status(201).json(
      new apiResponse(createdUser,201,"User registered successfully !")
   )
})
 
export {registerUser}