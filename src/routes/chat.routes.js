import mongoose from "mongoose";
import express from "express"
import { upload } from "../middlewares/multer.js";
import { verifyJWT } from "../middlewares/auth.js";
import {
    getMyChats,
    newGroupChat,
    getMyGroups,
    addMembers,
    removeMember,
    leaveGroup,
    sendAttachments,
    getChatDetails,
    renameGroup,
    deleteChat,
    getMessages
} from "../controllers/chat.controller.js";
const router = express.Router();

// Secured routes (require JWT authentication)
router.use(verifyJWT);
router.post("/newgroup", newGroupChat);
router.get("/getmychats", getMyChats);
router.get("/getmygroups", getMyGroups);
router.post("/addmembers", addMembers);
router.post("/removemember", removeMember);
router.delete("/leavegroup/:Id", leaveGroup);
router.post("/sendattachments", upload.array("attachments", 5), sendAttachments);
router.get("/chatdetails/:id", getChatDetails);
router.patch("/renamegroup/:id", renameGroup);
router.delete("/deletechat/:id", deleteChat);
router.get("/getmessages/:id", getMessages);
export { router };