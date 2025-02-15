import { app } from "./app.js";
import connect from "./db/index.js";
import "dotenv/config"

const port = process.env.PORT || 8000;
connect()
.then(()=>{
app.listen(port,()=>{
    console.log(`Server is running on port ${port}`);
});
})
.catch(err=>{
    console.error(err);
    process.exit(1);
})




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