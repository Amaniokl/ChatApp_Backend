import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Chat } from "../models/chat.js";
import { ALERT, REFETCH_CHATS } from "../constants/events.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { emitEvent } from "../utils/feature.js"
import mongoose from "mongoose";
import { User } from "../models/user.js";
import { Message } from "../models/message.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { NEW_MESSAGE, NEW_ATTACHMENT, NEW_MESSAGE_ALERT } from "../constants/events.js";

const newGroupChat = asyncHandler(async (req, res) => {
    const { name, members } = req.body;
    if (members.length < 2) {
        throw new ApiError(400, "Must have atleast three Members")
    }
    const allMembers = [...members, req.user];
    const data = await Chat.create({
        name,
        groupChat: true,
        creator: req.user,
        members: allMembers
    });
    emitEvent(req, ALERT, allMembers, `Welcome to ${name} group`);
    emitEvent(req, REFETCH_CHATS, members);
    return res.json(new ApiResponse(200, data, "Group created"))
})

const getMyChats = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const chats = await Chat.aggregate([
        {
            $match: { members: userId } // Match chats where the user is a member
        },
        {
            $lookup: {
                from: "users", // The name of the users collection
                localField: "members", // Field from the Chat collection
                foreignField: "_id", // Field from the User collection
                as: "membersInfo" // Output array field
            }
        },
        {
            $project: {
                _id: 1,
                name: 1,
                groupChat: 1,
                membersInfo: {
                    $filter: {
                        input: "$membersInfo",
                        as: "member",
                        cond: { $ne: ["$$member._id", userId] } // Exclude the current user
                    }
                }
            }
        },
        {
            $addFields: {
                avatar: {
                    $cond: {
                        if: { $eq: ["$groupChat", true] },
                        then: { $slice: ["$membersInfo.avatar", 3] }, // Get avatars for group chats
                        else: { $arrayElemAt: ["$membersInfo.avatar", 0] } // Get the avatar of the other member
                    }
                },
                name: {
                    $cond: {
                        if: { $eq: ["$groupChat", true] },
                        then: "$name", // Use the chat name for group chats
                        else: { $arrayElemAt: ["$membersInfo.name", 0] } // Use the other member's name
                    }
                },
                members: {
                    $map: {
                        input: "$membersInfo",
                        as: "member",
                        in: {
                            $cond: {
                                if: { $ne: ["$$member._id", userId] },
                                then: "$$member._id",
                                else: null
                            }
                        }
                    }
                }
            }
        },
        {
            $project: {
                _id: 1,
                groupChat: 1,
                avatar: 1,
                name: 1,
                members: {
                    $filter: {
                        input: "$members",
                        as: "member",
                        cond: { $ne: ["$$member", null] } // Remove null values
                    }
                }
            }
        }
    ]);

    return res.status(200).json({
        success: true,
        chats: chats,
    });
});
// })
const getMyGroups = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const groups = await Chat.aggregate([
        {
            $match: {
                members: userId, // Match chats where the user is a member
                groupChat: true, // Only include group chats
                creator: userId // Only include chats created by the user
            }
        },
        {
            $lookup: {
                from: "users", // The name of the users collection
                localField: "members", // Field from the Chat collection
                foreignField: "_id", // Field from the User collection
                as: "membersInfo" // Output array field
            }
        },
        {
            $project: {
                _id: 1,
                groupChat: 1,
                name: 1,
                avatar: {
                    $slice: ["$membersInfo.avatar", 3] // Get the first three avatars
                }
            }
        }
    ]);

    return res.status(200).json({
        success: true,
        groups,
    });
})

const addMembers = asyncHandler(async (req, res) => {
    const { chatId, members } = req.body;

    // Validate the chat ID and find the chat
    const chat = await Chat.findById(chatId);
    if (!chat) throw new ApiError(404, "Chat not found");

    // Ensure the chat is a group chat
    if (!chat.groupChat) throw new ApiError(400, "This is not a group chat");

    // Verify if the user is authorized to add members
    if (chat.creator.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to add members");
    }
    // if(){

    // }
    // Fetch all new members by their IDs
    const allNewMembersPromise = members.map((id) =>
        User.findById(id, "name")
    );
    const allNewMembers = await Promise.all(allNewMembersPromise);

    // Remove duplicate members already in the group
    const uniqueMembers = allNewMembers
        .filter((member) => !chat.members.includes(member._id.toString()))
        .map((member) => member._id);

    // Update the chat members list
    chat.members.push(...uniqueMembers);

    // Check for group member limit
    if (chat.members.length > 100) {
        throw new ApiError(400, "Group members limit reached");
    }

    // Save the updated chat document
    await chat.save();

    // Notify all group members about the new additions
    const allUsersName = allNewMembers.map((member) => member.name).join(", ");
    emitEvent(req, ALERT, chat.members, `${allUsersName} has been added to the group`);
    emitEvent(req, REFETCH_CHATS, chat.members);

    // Send success response
    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Members added successfully"));
});

const removeMember = asyncHandler(async (req, res) => {
    const { userId, chatId } = req.body;

    // Fetch chat and user to be removed in parallel
    const [chat, userThatWillBeRemoved] = await Promise.all([
        Chat.findById(chatId),
        User.findById(userId, "name"),
    ]);

    // Validate if chat exists
    if (!chat) {
        throw new ApiError(404, "Chat not found");
    }

    // Validate if chat is a group chat
    if (!chat.groupChat) {
        throw new ApiError(400, "This is not a group chat");
    }

    // Validate if the user is the creator of the group
    if (chat.creator.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to remove members");
    }

    // Validate if the group has at least 3 members
    if (chat.members.length <= 3) {
        throw new ApiError(400, "Group must have at least 3 members");
    }

    // Remove the user from the members array
    chat.members = chat.members.filter(
        (memberId) => memberId.toString() !== userId.toString()
    );

    // Save the updated chat document
    await chat.save();

    // Emit event to notify all members that a user has been removed
    emitEvent(req, ALERT, chat.members, {
        message: `${userThatWillBeRemoved.name} has been removed from the group`,
        chatId,
    });

    // Emit event to refresh chats
    emitEvent(req, REFETCH_CHATS, chat.members);

    // Send success response
    return res.status(200).json({
        success: true,
        message: "Member removed successfully",
    });
});


// Leave Group
const leaveGroup = asyncHandler(async (req, res) => {
    const chatId = req.params.Id;
    const userId = req.user._id.toString();
    const chat = await Chat.findById(chatId);
    if (!chat) throw new ApiError(404, "Chat not found");

    if (!chat.groupChat) throw new ApiError(400, "This is not a group chat");

    const remainingMembers = chat.members.filter(
        (member) => member.toString() !== req.user._id.toString()
    );

    if (remainingMembers.length < 3)
        throw new ApiError(400, "Group must have at least 3 members");

    if (chat.creator.toString() === req.user._id.toString()) {
        throw new ApiError(400, "You can not leave the group as you are creator of the group")
    }

    chat.members = remainingMembers;

    const [user] = await Promise.all([
        User.findById(req.user._id, "name"),
        chat.save(),
    ]);

    emitEvent(req, ALERT, chat.members, {
        chatId,
        message: `User ${user.name} has left the group`,
    });

    return res.status(200).json({
        success: true,
        message: "Group Leaved Successfully",
    });
});

// Send Attachments
const sendAttachments = asyncHandler(async (req, res) => {
    const { chatId } = req.body;
    const files = req.files || [];
    console.log(files);

    if (files.length < 1)
        throw new ApiError(400, "Please Upload Attachments");

    if (files.length > 5)
        throw new ApiError(400, "Files Can't be more than 5");

    const [chat, me] = await Promise.all([
        Chat.findById(chatId),
        User.findById(req.user, "name"),
    ]);

    if (!chat) throw new ApiError(404, "Chat not found");
    console.log(files[0].path);

    let attachments = [];
    for (let i = 0; i < files.length; i++) {
        const uploadResult = await uploadOnCloudinary(files[i].path);
        attachments.push(uploadResult);
    }
    // const attachments = await uploadOnCloudinary(files[0].path);

    const messageForDB = {
        content: "",
        attachments,
        sender: me._id,
        chat: chatId,
    };

    const messageForRealTime = {
        ...messageForDB,
        sender: {
            _id: me._id,
            name: me.name,
        },
    };

    const message = await Message.create(messageForDB);

    emitEvent(req, NEW_MESSAGE, chat.members, {
        message: messageForRealTime,
        chatId,
    });

    emitEvent(req, NEW_MESSAGE_ALERT, chat.members, { chatId });

    return res.status(200).json({
        success: true,
        message,
    });
});

// Get Chat Details
const getChatDetails = asyncHandler(async (req, res) => {
    if (req.query.populate === "true") {
        const chat = await Chat.findById(req.params.id)
            .populate("members", "fullName avatar")
            .lean();
        console.log(chat);

        if (!chat) throw new ApiError(404, "Chat not found");

        chat.members = chat.members.map(({ _id, fullName, avatar }) => ({
            _id,
            fullName,
            avatar: avatar,
        }));

        return res.status(200).json({
            success: true,
            chat,
        });
    } else {
        const chat = await Chat.findById(req.params.id);
        if (!chat) throw new ApiError(404, "Chat not found");

        return res.status(200).json({
            success: true,
            chat,
        });
    }
});

// Rename Group
const renameGroup = asyncHandler(async (req, res) => {
    const chatId = req.params.id;
    const { name } = req.body;

    const chat = await Chat.findById(chatId);

    if (!chat) throw new ApiError(404, "Chat not found");

    if (!chat.groupChat)
        throw new ApiError(400, "This is not a group chat");

    if (chat.creator.toString() !== req.user._id.toString())
        throw new ApiError(403, "You are not allowed to rename the group");

    chat.name = name;

    const update = await chat.save();

    emitEvent(req, REFETCH_CHATS, chat.members);

    return res.status(200).json({
        success: true,
        update,
        message: "Group renamed successfully",
    });
});

// Delete Chat
const deleteChat = asyncHandler(async (req, res) => {
    const chatId = req.params.id;

    const chat = await Chat.findById(chatId);
    if (!chat) throw new ApiError(404, "Chat not found");

    const members = chat.members;

    if (chat.groupChat && chat.creator.toString() !== req.user._id.toString())
        throw new ApiError(403, "You are not allowed to delete the group chat");

    if (!chat.groupChat && !chat.members.includes(req.user._id.toString())) {
        throw new ApiError(403, "You are not allowed to delete the chat");
    }

    const messagesWithAttachments = await Message.find({
        chat: chatId,
        attachments: { $exists: true, $ne: [] },
    });

    const public_ids = [];

    messagesWithAttachments.forEach(({ attachments }) =>
        attachments.forEach(({ public_id }) => public_ids.push(public_id))
    );

    await Promise.all([
        deletFilesFromCloudinary(public_ids),
        chat.deleteOne(),
        Message.deleteMany({ chat: chatId }),
    ]);

    emitEvent(req, REFETCH_CHATS, members);

    return res.status(200).json({
        success: true,
        message: "Chat deleted successfully",
    });
});

// Get Messages
const getMessages = asyncHandler(async (req, res) => {
    const chatId = req.params.id;
    const { page = 1 } = req.query;

    const resultPerPage = 20;
    const skip = (page - 1) * resultPerPage;

    const chat = await Chat.findById(chatId);

    if (!chat) throw new ApiError(404, "Chat not found");

    if (!chat.members.includes(req.user.toString()))
        throw new ApiError(403, "You are not allowed to access this chat");

    const [messages, totalMessagesCount] = await Promise.all([
        Message.find({ chat: chatId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(resultPerPage)
            .populate("sender", "name")
            .lean(),
        Message.countDocuments({ chat: chatId }),
    ]);

    const totalPages = Math.ceil(totalMessagesCount / resultPerPage) || 0;

    return res.status(200).json({
        success: true,
        messages: messages.reverse(),
        totalPages,
    });
});



export {
    newGroupChat, getMyChats, getChatDetails, getMyGroups, addMembers, removeMember, leaveGroup, sendAttachments,
    renameGroup, deleteChat
};