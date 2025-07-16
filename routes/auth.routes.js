import { Router } from "express";
import {
  getLoginPage,
  getSignupPage,
  postLoginUser,
  postSignupUser,
} from "../controllers/auth.controller.js";

const router = Router();

router.get("/login", getLoginPage);
router.post("/login", postLoginUser);

router.get("/signup", getSignupPage);
router.post("/signup", postSignupUser);

export const authRoutes = router;
