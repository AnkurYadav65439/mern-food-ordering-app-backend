import express, { Request, Response } from 'express'
import cors from 'cors'
import "dotenv/config"
import mongoose from 'mongoose'
import myUserRoute from "./routes/MyUserRoute"
import { v2 as cloudinary } from 'cloudinary'
import myRestaurantRoute from "./routes/MyRestaurantRoute"
import RestaurantRoute from "./routes/RestaurantRoute"
import OrderRoute from './routes/OrderRoute'

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

app.use(cors());

//for stripe validation, it needs to go raw request and NOT json unlike all other endpoints
//that why express.json() middlew. placed below 
app.use("/api/order/checkout/webhook", express.raw({ type: "*/*" }));

//builtin middleware that parses request with json payloads(for all other endpoints except stripe webhook)
app.use(express.json());

//this endpoint hit for health status(deployment)
app.get("/health", async (req: Request, res: Response) => {
    res.send({ message: "health OK!" })
})

app.use("/api/my/user", myUserRoute);
app.use("/api/my/restaurant", myRestaurantRoute);
app.use("/api/restaurant", RestaurantRoute);
app.use("/api/order", OrderRoute);

app.listen(port, () => {
    console.log("server listening at port : ", port);
})