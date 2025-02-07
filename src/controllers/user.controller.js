import { asyncHandler } from "../utils/asyncHandler.js"
import { upload } from '../middlewares/multer.js'
import { ApiError } from '../utils/ApiError.js'
import { User } from '../models/user.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"
// import { log } from "console"


const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = await user.generateAccessTokens()
        const refreshToken = await user.generateRefreshTokens()
        // console.log(" "+refreshToken)
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }
    }
    catch (error) {
        throw new ApiError(500,
            "Something went wrong while generating refresh and access token")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    
    // get user details from frontend
    const { fullName, username, password } = req.body
    // console.log("email: ", email);
    // console.log(fullName);
    console.log("Request Body:", req.body);
    console.log("Files:", req.file); // Check if the file is being received

    // validation - not empty
    if (!fullName || !username || !password) {
        throw new ApiError(400, "All fields are required !!");
    }

    // check if user already registered: username, email
    const existedUser = await User.findOne({username})
    if (existedUser) {
        throw new ApiError(409, "User with username already exists")
    }
    // console.log(req.files)
    // check for images, check for avatar
    let avatarLocalPath 
    // const coverImageLocalPath=req.files?.coverImage[0]?.path;
    // let coverImageLocalPath;
    // if (req.file && Array.isArray(req.file.avatar) && req.file.avatar.length > 0) {
    avatarLocalPath = req.file?.path;
    // }
    console.log("Avatar Local Path:", avatarLocalPath);
    
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    // const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar) {
        throw new ApiError(400, "Unable to upload on cloudinary")
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById((user._id)).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500,
            "Something went wrong while registering the user")
    }
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )
    //}
    // catch(error){
    //     throw new ApiError(400, "Error in registration",error)
    // }
})

const loginUser = asyncHandler(async (req, res) => {
    //recieve data from body
    const { username, password } = req.body
    console.log(req.body);
    
    //validate username and password
    if (!username || !password) {
        throw new ApiError(400, "Username or password is required");
    }

    const user = await User.findOne({
        username
    })

    if (!user) {
        throw new ApiError(404, "user does not exist")
    }

    //match username and password with data base
    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid login credentials")
    }

    //generate access tokens and refresh tokens
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)
    // console.log("accesstoken       "+accessToken)
    // console.log("                                             ")
    // console.log("refresh           "+refreshToken)
    const loggedInUser = await User
        .findById(user._id)
        .select("-password -refreshToken")

    //send cookie
    const options = {
        httpOnly: true,
        secure: true
    }

    //login user
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser, accessToken, refreshToken
                },
                "User logged In Successfully"
            )
        )

})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                // accessToken: undefined,
                refreshToken: undefined
            }
        }, {
        new: true
    }
    )
    const options = {
        httpOnly: true,
        secure: true
    }
    // console.log(refreshToken)
    //logout user
    return res
        .status(200)
        .cookie("accessToken", options)
        .cookie("refreshToken", options)
        .json(
            new ApiResponse(
                200,
                "User logged out Successfully"
            )
        )
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
            
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, refreshToken:newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {accessToken, refreshToken: newRefreshToken},
                "Access token refreshed"
            )
        )
        
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    if (!isPasswordCorrect) {
        throw new ApiError(401, "Incorrect oldPassword")
    }
    user.password = newPassword
    await user.save({ validateBeforeSave: false })
    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully"))
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "Current user fetched successfully"))
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName } = req.body
    if (fullName == "" ) {
        throw new ApiError(400, "Requires fullName")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName: fullName,
            }
        },
        { new: true }
    ).select("-password");
    // const retObject={
    //     id: user._id,
    //     fullName: user.fullName,
    //     email: user.email,
    // }
    // console.log(retObject);
    return res
        .status(200)
        .json(new ApiResponse(200, user,"Details updated successfully"))
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")
    }
    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {
            new: true
        }
    ).select("-password")
})

const searchUser=asyncHandler(async(req,res)=>{
    const {username}=req.body;
    const search=User.find({username});
    return res.json(new ApiResponse(200, "User fetched"))
})
export { 
    registerUser, 
    loginUser, 
    logoutUser, 
    refreshAccessToken, 
    changeCurrentPassword, 
    getCurrentUser, 
    updateAccountDetails,
    updateUserAvatar
}