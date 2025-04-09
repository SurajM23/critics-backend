

const Dev_Type = process.env.Dev_Type || 'development';

const MongoUrl = Dev_Type === "production" ? process.env.MONGO_URI : Dev_Type  === 'development' ? process.env.MONGO_URI : process.env.MONGO_URI_PROD;

export const MyConfig = {
    // Your configuration settings
    Mongo_Uri: MongoUrl,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRE: process.env.JWT_EXPIRE,
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,





}
