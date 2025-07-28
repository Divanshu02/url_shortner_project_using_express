import { Router } from "express";
import {
  getLoginPage,
  getSignupPage,
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

export const authRoutes = router;
