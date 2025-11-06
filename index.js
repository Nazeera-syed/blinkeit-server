import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
dotenv.config();
import morgan from 'morgan';
import helmet from 'helmet';
import connectDB from './config/connectDB.js';
import userRouter from './route/user.route.js';
import "./firebase.js"; 
import categoryRouter from './route/category.route.js';
import uploadRouter from './route/upload.router.js';
import subCategoryRouter from './route/subCategory.route.js';
import productRouter from './route/product.route.js';
import cartRouter from './route/cart.route.js';
import addressRouter from './route/address.route.js';
import orderRouter from './route/order.route.js';
import bodyParser from "body-parser";
import { webhookStripe } from "./controllers/order.controller.js";



const app = express();

app.post(
  "/api/order/webhook",
  bodyParser.raw({ type: "application/json" }),
 webhookStripe
);


app.use(cors({
    credentials:true,
    origin:process.env.FRONTEND_URL
}))

app.use(express.json());
app.use(cookieParser());
app.use(morgan());
app.use(helmet({
    crossOriginResourcePolicy:false
}))

const PORT = process.env.PORT || 8080;
 

app.get("/",(req,res)=>{
    res.json({
        message:"server is running"+ PORT
    })
})

app.use('/api/user',userRouter)
app.use('/api/category',categoryRouter)
app.use('/api/file',uploadRouter)
app.use('/api/subcategory',subCategoryRouter)
app.use('/api/product',productRouter)
app.use('/api/cart',cartRouter)
app.use('/api/address',addressRouter)
app.use('/api/order',orderRouter)



connectDB();

app.listen(PORT,()=>{
    console.log("server is running", PORT)
})