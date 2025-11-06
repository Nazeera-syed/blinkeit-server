import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();


async function connectDB(){
    try {
        await mongoose.connect(process.env.MONGODB_URI)
        console.log("Database connected successfully")
    } catch (error) {
        console.log("Database connection error", error)
        process.exit(1);
    }
}
export default connectDB;