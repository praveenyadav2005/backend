import { Router } from "express";
import { registerUser ,loginUser,logoutUser, refreshAccessToken, changePassword,
  getCurrentUser,
  updateAccountDetail,
  updateAvatar,
  updateCoverImage} from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"


const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]),
    registerUser)

router.route("/login").post(loginUser)

//*Secure routes
router.route("/logout").post(verifyJWT,logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/password-change").patch(verifyJWT,changePassword)
router.route("/get-current-user").get(verifyJWT,getCurrentUser)
router.route("/update-account").patch(verifyJWT,updateAccountDetail)
router.route("/update-avatar").patch(verifyJWT,upload.single("avatar"),updateAvatar)
router.route("/update-cover-image").patch(verifyJWT,upload.single("coverImage"),updateCoverImage)


export default router