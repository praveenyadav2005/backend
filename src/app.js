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
})); // for parsing application/x-www-form-urlencoded

app.use(express.static('public')); // serve static files from public directory  
app.use(cookieParser());


export { app };