import express from 'express';
import {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    searchUser,
    sendFriendRequest,
    acceptFriendRequest,
    getMyNotifications,
    getMyFriends
} from '../controllers/user.controller.js';

import { upload } from "../middlewares/multer.js";
import { verifyJWT } from "../middlewares/auth.js";

const router = express.Router();

// Route for user registration
router.route("/register").post(
    upload.single('avatar'),
    registerUser
);

// Route for user login
router.route("/login").post(loginUser);

// Secured routes (require JWT authentication)
router.use(verifyJWT);

// Route for user logout
router.route("/logout").post(logoutUser);

// Route for refreshing access token
router.route("/refresh-token").post(refreshAccessToken);

// Route for changing current password
router.route("/change-password").post(changeCurrentPassword);

// Route for getting current user details
router.route("/current-user").get(getCurrentUser);

// Route for updating account details
router.route("/update-account").patch(updateAccountDetails);

// Route for updating user avatar
router.route("/update-avatar").patch(
    upload.single("avatar"),
    updateUserAvatar
);

router.route('/search').get(searchUser);

// Send Friend Request
router.route('/friend-request/send').post(sendFriendRequest);

// Accept Friend Request
router.route('/friend-request/accept').post(acceptFriendRequest);

// Get My Notifications
router.route('/notifications').get(getMyNotifications);

// Get My Friends
router.route('/friends').get(getMyFriends);

export {router};