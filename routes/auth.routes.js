import { Router } from "express";
import {
  getChangePasswordPage,
  getEditProfilePage,
  getLoginPage,
  getProfilePage,
  getSignupPage,
  getVerifyEmailPage,
  VerifyEmailToken,
  logoutUser,
  postLoginUser,
  postResendVerificationEmail,
  postSignupUser,
  postChangePassword,
} from "../controllers/auth.controller.js";

const router = Router();

router.get("/login", getLoginPage);
router.post("/login", postLoginUser);

router.get("/signup", getSignupPage);
router.post("/signup", postSignupUser);
router.get("/logout", logoutUser);

router.get("/profile", getProfilePage);
router.get("/verify-email", getVerifyEmailPage);
router.post("/resend-verification-email", postResendVerificationEmail);
router.get("/verify-email-token", VerifyEmailToken);

router.get("/edit-profile", getEditProfilePage);

router.get("/change-password", getChangePasswordPage);
router.post("/change-password", postChangePassword);

export const authRoutes = router;
