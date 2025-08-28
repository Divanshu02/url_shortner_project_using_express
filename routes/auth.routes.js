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
  getForgotPasswordPage,
  sendResetPasswordLinkToGmail,
  verifyResetPassword,
  getResetPasswordPage,
  postResetPassword,
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

router.get("/forgot-password", getForgotPasswordPage);
router.post("/sendResetPasswordLinkToGmail", sendResetPasswordLinkToGmail);

router.get("/verify-reset-password", verifyResetPassword);

router.get("/reset-password/:token", getResetPasswordPage);
router.post("/reset-password/:token", postResetPassword);

export const authRoutes = router;
