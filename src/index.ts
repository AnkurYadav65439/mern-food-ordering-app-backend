import express, { Request, Response } from 'express'
import cors from 'cors'
import "dotenv/config"
import mongoose from 'mongoose';
import myUserRoute from "./routes/MyUserRoute"

mongoose
    .connect(process.env.MONGODB_CONNECTION_STRING as string)
    .then(() => console.log("Connected to MongoDB!"))

const app = express();
const port = 3000;

//builtin middleware that parses request with json payloads
app.use(express.json());
app.use(cors());

//this endpoint hit for health status(deployment)
app.get("/health", async (req: Request, res: Response) => {
    res.send({ message: "health OK!" })
})

app.use("/api/my/user", myUserRoute)

app.listen(port, () => {
    console.log("server listening at port : ", port);
})