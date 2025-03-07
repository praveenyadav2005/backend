import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { User } from "../models/user.models.js";
import { fileUploader } from "../utils/cloudinary.js";
import {deleteFromCloudinary} from "../utils/deleteCloudinary.js";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new apiError(
      "something went wrong while generating access and refresh token ",
      500
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password, fullName } = req.body;
  //We added multer middleware to register route

  //validation of empty
  if (
    [username, email, password, fullName].some((field) => field.trim() === "")
  ) {
    throw new apiError("All feild are required", 400);
  }
  //checking if user exits
  const existedUser = await User.findOne({
    $or: [{ email }, { username }],
  });
  if (existedUser)
    throw new apiError("User with email or username already exits", 409);

  //* checking for multer file specially avatar
  const localAvatarPath = req.files?.avatar[0]?.path;
  if (!localAvatarPath) throw new apiError("Avatar file is required", 400);

  //   const localCoverImagePath = req.files?.coverImage?.[0]?.path ?? null;
  let localCoverImagePath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    localCoverImagePath = req.files.coverImage[0].path;
  }

  //uploading files to cloudinary
  const avatar = await fileUploader(localAvatarPath);
  const coverImage = await fileUploader(localCoverImagePath);

  if (!avatar) throw new apiError("Avatar file is required", 400);

  //creating entry to database
  const user = await User.create({
    email,
    fullName,
    username: username.toLowerCase(),
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });
  //checking if user created and removing password and refreshToken feild
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser)
    throw new apiError("Something went wrong while registering the user", 500);

  //returning response
  console.log("User registered successfully !");
  return res
    .status(201)
    .json(new apiResponse(createdUser, 201, "User registered successfully !"));
});

const loginUser = asyncHandler(async (req, res) => {
  //req->body ->data
  //check if non empty
  //find user
  // password check
  // access and refresh token
  // send cookie(secure)
  const { username, email, password } = req.body;
  //   console.log(req.body);

  if (!username && !email) {
    throw new apiError("username or email is required! ", 400);
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) throw new apiError("user do not exit! ", 404);

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) throw new apiError("Invalid user credentials ", 404);
  // console.log(user);
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );
  const loggedInUser = user.toObject(); // Convert safely
  delete loggedInUser.password;
  delete loggedInUser.refreshToken;

  //   const loggedInUser = user.select("-password -refreshToken");

  const options = {
    httpOnly: true,
    secure: true,
  };

  res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new apiResponse(
        {
          user: loggedInUser,
          refreshToken,
          accessToken,
        },
        200,
        "User logged In successfully! "
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true, //returns new updated user
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new apiResponse({}, 200, "Logged out successfully! "));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incommingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incommingRefreshToken)
    throw new apiError("Refresh token is required", 400);
  try {
    const decodedToken = jwt.verify(
      incommingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    if (!decodedToken) throw new apiError("Refresh token is invalid", 400);

    const user = await User.findById(decodedToken?._id);
    if (!user) throw new apiError("Unauthorized access", 400);
    if (incommingRefreshToken !== user.refreshToken)
      throw new apiError("Unauthorized access", 400);

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user._id
    );
    const options = {
      httpOnly: true,
      secure: true,
    };
    res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshoken", refreshToken, options)
      .json(
        new apiResponse(
          { accessToken, refreshToken },
          200,
          "Access token refreshed successfully! "
        )
      );
  } catch (error) {
    throw new apiError("Invalid refesh token", 401);
  }
});

const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) throw new apiError("unauthorized access", 401);
  const correctPassword = await user.isPasswordCorrect(oldPassword);
  if (!correctPassword) throw new apiError("Old password is not correct", 401);
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  return;
  res
    .status(200)
    .json(new apiResponse({}, 200, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new apiResponse(req.user, 200, "user fetched successfully! "));
});

const updateAccountDetail = asyncHandler(async (req, res) => {
  //verify that user is logged in by auth middleware
  const { email, fullName } = req.body;
  if (!email || !fullName)
    throw new apiError("email and fullname are required ", 401);
  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        email,
        fullName,
      },
    },
    { new: true }
  ).select("-password");
  if (!updatedUser) throw new apiError("unauthorized access");

  return res
    .status(200)
    .json(
      new apiResponse(
        updatedUser,
        200,
        "email and password updated successfully"
      )
    );
});

const updateAvatar = asyncHandler(async (req, res) => {
  //verify that user is logged in by auth middleware
  // file upload by multer middleware
  const localAvatarPath = req.file?.path;
  if (!localAvatarPath) throw new apiError("Avatar file is missing", 400);
  const avatarUrl = await fileUploader(localAvatarPath);
  if (!avatarUrl.url) throw new apiError("Error while uploading avatar file");
  const oldAvatarUrl = req.user.avatar;
  const updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatarUrl.url,
      },
    },
    { new: true }
  ).select("-password");

  //deleting old avatar from cloudinary
    await deleteFromCloudinary(oldAvatarUrl);

  return res
    .status(200)
    .json(
      new apiResponse(updatedUser, 200, "Avatar file updated successfully! ")
    );
});

const updateCoverImage = asyncHandler(async (req, res) => {
  //verify that user is logged in by auth middleware
  // file upload by multer middleware
  const localCoverImagePath = req.file?.path;
  if (!localCoverImagePath)
    throw new apiError("CoverImage file is missing", 400);
  const CoverImageUrl = await fileUploader(localCoverImagePath);
  if (!CoverImageUrl.url)
    throw new apiError("Error while uploading CoverImage file");
  const oldCoverImageUrl = req.user.coverImage;
  const updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: CoverImageUrl.url,
      },
    },
    { new: true }
  ).select("-password");

  if(oldCoverImageUrl) {
    //deleting old coverImage from cloudinary
    await deleteFromCloudinary(oldCoverImageUrl);
  }
  return res
    .status(200)
    .json(
      new apiResponse(
        updatedUser,
        200,
        "CoverImage file updated successfully! "
      )
    );
});

const getChannelProfile = asyncHandler(async (req, res) => {
  const {username} = req.params
  if(!username) throw new apiError("invalid username",400)
    const channel = await User.aggregate([
      {
        $match: {
          username: username?.trim(),
        },
      },
      {
        $lookup: {
          from: "subscriptions",
          foreignField: "channel",
          localField: "_id",
          as: "subscribers",
        },
      },
      {
        $lookup: {
          from: "subscriptions",
          foreignField: "subscriber",
          localField: "_id",
          as: "subscribedTo",
        },
      },
      {
        $addFields: {
          subscriberCount: {
            $size: "$subscribers",
          },
          subscribedToCount: {
            $size: "$subscribedTo",
          },
          isSubscribed: {
            $cond: {
              if: {
                $in: [req.user?._id, "$subscribers.subscriber"],
              },
              then: true,
              else: false,
            },
          },
        },
      },
      {
        $project:{
          fullName:1,
          email:1,
          avatar:1,
          coverImage:1,
          username:1,
          subscriberCount:1,
          subscribedToCount:1,
          isSubscribed:1
        }
      }
    ]);

    if (!channel || channel.length === 0) {
      throw new apiError("Channel not found", 404);
    }

    return res
      .status(200)
      .json(new apiResponse(channel[0], 200, "Channel profile fetched successfully!"));
})
export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changePassword,
  getCurrentUser,
  updateAccountDetail,
  updateAvatar,
  updateCoverImage,
  getChannelProfile
};
