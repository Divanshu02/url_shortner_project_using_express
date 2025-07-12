import express from "express";
import {
  getShortenerPage,
  postURLshortner,
  redirectToShortLink,
} from "../controllers/shortener.controller.js";
 

const router = express.Router();

// 👇 Serve index.html properly
router.get("/", getShortenerPage);

router.post("/", postURLshortner);

router.get("/:shortcode", redirectToShortLink);

export const shortnerRoutes = router;
