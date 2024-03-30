import express, { Request, Response } from 'express'
import cors from 'cors'
import "dotenv/config"
import mongoose from 'mongoose'
import myUserRoute from "./routes/MyUserRoute"
import { v2 as cloudinary } from 'cloudinary'
import myRestaurantRoute from "./routes/MyRestaurantRoute"
import RestaurantRoute from "./routes/RestaurantRoute"

mongoose
    .connect(process.env.MONGODB_CONNECTION_STRING as string)
    .then(() => console.log("Connected to MongoDB!"))

//code from site
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

const app = express();
const port = 3000;

//builtin middleware that parses request with json payloads
app.use(express.json());
app.use(cors());

//this endpoint hit for health status(deployment)
app.get("/health", async (req: Request, res: Response) => {
    res.send({ message: "health OK!" })
})

app.use("/api/my/user", myUserRoute);
app.use("/api/my/restaurant", myRestaurantRoute);
app.use("/api/restaurant", RestaurantRoute)

app.listen(port, () => {
    console.log("server listening at port : ", port);
})