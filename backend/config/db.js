import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://ashishsurya2005:CNHcki6hb5C7OOnm@cluster0.wq2kx0i.mongodb.net/food-del';
        await mongoose.connect(mongoURI);
        console.log("✅ Database Connected Successfully to MongoDB Atlas");
        console.log("📊 Database Name:", mongoose.connection.db.databaseName);
    } catch (error) {
        console.error("❌ Database Connection Error:", error.message);
        process.exit(1);
    }
}

