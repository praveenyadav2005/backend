import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { User } from "../models/user.models.js";
import { fileUploader } from "../utils/cloudinary.js";

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

  //   const localCoverImagePath = req.files?.coverImage?.[0]?.path ?? null;
  const localAvatarPath = req.files?.avatar[0]?.path;
  if (!localAvatarPath) throw new apiError("Avatar file is required", 400);

  // if (req.files &&  Array.isArray(req.files.avatar) && req.files.avatar.length > 0) {
  //    const localAvatarPath = req.files.avatar[0].path;
  // }
  // else throw new apiError("Avatar file is required", 400);

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

export { registerUser, loginUser, logoutUser };
