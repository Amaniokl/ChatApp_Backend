import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import { upload } from "./middlewares/multer.js"
import { server } from "socket.io"
const app=express();
  
const io=new server(app, {});

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended: true, limit:"16kb"}))
app.use(express.static("temp"))
app.use(cookieParser())
// app.use(upload.none());
import {router as UserRouter} from "./routes/user.routes.js" 
import {router as ChatRouter} from "./routes/chat.routes.js"
app.use("/api", UserRouter);
app.use("/api/chat", ChatRouter);

export {app}