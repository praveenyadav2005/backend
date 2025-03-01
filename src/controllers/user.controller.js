import {asyncHandler} from "../utils/asyncHandler.js"

 const registerUser = asyncHandler( async (req,res)=>{
 res.status(200).json({
    name:"Praveen register",
    class:"2nd year"
 })
})
 const loginUser = asyncHandler( async (req,res)=>{
 res.status(200).json({
    name:"Praveen login",
    class:"2nd year"
 })
})

export {loginUser,registerUser}