import { Router } from "express";
import {
  getChangePasswordPage,
  getEditProfilePage,
  getLoginPage,
  getProfilePage,
  getSignupPage,
  getVerifyEmailPage,
  logoutUser,
  postLoginUser,
  postSignupUser,
} from "../controllers/auth.controller.js";

const router = Router();

router.get("/login", getLoginPage);
router.post("/login", postLoginUser);

router.get("/signup", getSignupPage);
router.post("/signup", postSignupUser);
router.get("/logout", logoutUser);

router.get("/profile", getProfilePage);
router.get("/verify-email", getVerifyEmailPage);

router.get("/edit-profile", getEditProfilePage);
router.get("/change-password", getChangePasswordPage);

export const authRoutes = router;
