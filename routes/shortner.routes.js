import express from "express";
import {
  getShortenerPage,
  postURLshortner,
  redirectToShortLink,
  getEditShortenerPage,
  updateShortener,
  getDeleteShortenerPage,
  postDeleteShortener,
} from "../controllers/shortener.controller.js";

const router = express.Router();

// 👇 Serve index.html properly
router.get("/", getShortenerPage);

router.post("/", postURLshortner);

router.get("/shortlink/:shortcode", redirectToShortLink);

router.get("/deleteShortener/:id", getDeleteShortenerPage);
router.post("/deleteShortener/:id", postDeleteShortener);

router.get("/editShortener/:id", getEditShortenerPage);
router.post("/updateShortener/:id", updateShortener);

export const shortnerRoutes = router;
