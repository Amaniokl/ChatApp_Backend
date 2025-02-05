import dotenv from "dotenv"
import mongoose, { connect }  from "mongoose";  
import { DB_NAME } from "./constants/constant.js";
import express from "express"
import connectDB from "./db/index.js"
import {app} from "./app.js"

dotenv.config({
    path: './.env'
})

console.log(process.env.PORT);

connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`Server is running at port : ${process.env.PORT}`);
    })
})
.catch((error)=>{
    app.on("error", ()=>{
        console.log("ERROR:", error);
        throw error
    })
})