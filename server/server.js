import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './configs/db.js';
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js"
import { clerkMiddleware } from "@clerk/express";
import showRouter from './Routes/showRouter.js';
import bookingRouter from './Routes/bookingRouter.js';
import adminRouter from './Routes/adminRouter.js';
import userRouter from './Routes/userRoutes.js';
import fileUpload from "express-fileupload";
import snackRouter from './Routes/SnacksRouter.js';
import reserveRoute from "./Routes/reserveRoute.js";


import dotenv from "dotenv";
import upcomingRouter from './Routes/upcomingRouter.js';


const app = express();
const port = 3000;

await connectDB()

dotenv.config();

//middleware
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

app.use(express.json())

app.use(cors())

app.use(clerkMiddleware());

app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: "/tmp/", // optional

}));




//Api Routes


app.get('/', (req, res)=> res.send('Server is Live'))
app.use('/api/inggest',  serve({ client: inngest, functions }))
app.use('/api/show', showRouter)
app.use('/api/booking', bookingRouter)
app.use("/api/admin", adminRouter)
app.use('/api/user', userRouter)
app.use('/api/snacks', snackRouter)
app.use("/api/reserve", reserveRoute)
app.use('/api/upcoming', upcomingRouter)

app.listen(port, ()=> console.log(  `Server listening at http://localhost:${port}`));
