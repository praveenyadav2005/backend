import connect from "./db/index.js";
import "dotenv/config"

connect();




/*
import mongoose from "mongoose";
import {DB_NAME} from "./constants.js"
import express from "express";
const app = express();
;( async()=>{
try {
   await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
    app.on('error',()=>{
        console.error('Failed to connect to MongoDB');
        throw error;
    })
    app.listen(process.env.PORT,()=>{
        console.log(`Server is running on port ${process.env.PORT}`);
    })

} catch (error) {
    console.error(error);
    throw error;
}
})()
*/