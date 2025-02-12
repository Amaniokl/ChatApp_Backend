import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import { upload } from "./middlewares/multer.js"
import { Server } from "socket.io"
import {createServer} from "http" 
import {router as UserRouter} from "./routes/user.routes.js" 
import {router as ChatRouter} from "./routes/chat.routes.js"
import { NEW_MESSAGE, NEW_MESSAGE_ALERT } from "./constants/events.js"

import { randomUUID } from "crypto"
import { getSockets } from "./utils/feature.js"
const app=express();

const server= createServer(app);
const io=new Server(server, {
    cors:{
        origin: process.env.CORS_ORIGIN,
        credentials:true
    }
});

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended: true, limit:"16kb"}))
app.use(express.static("temp"))
app.use(cookieParser())
// app.use(upload.none());

app.use("/api", UserRouter);
app.use("/api", ChatRouter);

const userSocketIds= new Map();


io.on("connection", (socket)=>{
    const user={
        _id: "asdsda",
        fullName: "asdsda"
    }
    userSocketIds.set(user._id.toString(), socket.id);
    console.log("a user connected", socket.id);
    socket.on(NEW_MESSAGE, async({chatId, members, messages})=>{
        const messageForRealTime={
            content: messages,
            _id: randomUUID(),
            sender:{
                _id: user._id,
                fullName: user.fullName
            },
            chat: chatId,
            createdAt: new Date().toISOString(),
        };
        const messageForDB={
            content: messages,
            sender: user._id,
            chat: chatId
        }
        const memberSocket=getSockets(members);
        io.to(memberSocket).emit(NEW_MESSAGE, {
            chatId,
            message: messageForRealTime,
        });
        io.to(memberSocket).emit(NEW_MESSAGE_ALERT, {chatId})
        console.log("New Message", messageForRealTime); 
    });
    socket.on("disconnect", ()=>{
        console.log("user disconnected");
        userSocketIds.delete(user._id.toString());
    })
})

export {app, server, userSocketIds}