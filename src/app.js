import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';

const app = express();

app.use(cors({
    origin:process.env.CORS_ORIGIN, // default origin
    credentials: true 
}));
app.use(express.json({
    limit: "10kb",// limit
}));

app.use(express.urlencoded({ 
    extended: true ,limit:"10kb"
})); 

app.use(express.static('public'));   
app.use(cookieParser());

import router from './routes/user.routes.js';
app.use("/api/user",router)

export { app };