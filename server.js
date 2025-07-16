import express from "express";
import { shortnerRoutes } from "./routes/shortner.routes.js";
import { authRoutes } from "./routes/auth.routes.js";
import expressLayouts from "express-ejs-layouts";
import cookieParser from "cookie-parser";

const app = express();

app.use(express.static("public")); //serve static files
app.use(express.urlencoded({ extended: true })); //parses form data
app.set("view engine", "ejs");
app.use(cookieParser("my-super-secret-key"));

// 👇 Middleware
app.use(express.json()); // ✅ add this at the top

app.use(authRoutes); //middleware having auth routes
app.use(shortnerRoutes); //middleware having routes

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`server running on ${PORT} port`);
});
