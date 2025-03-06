import mongoose from "mongoose";

const subsSchema = new mongoose.Schema({
   subscriber:{
    type:mongoose.Schema.Types.ObjectId, //user who is subscribing
    ref:"User"
   } ,
   channel:{
    type:mongoose.Schema.Types.ObjectId, //user to whome subscribers are subscribing
    ref:"User"
   } 
},{timestamps:true})

export const Subscription = mongoose.model("Subscription",subsSchema)