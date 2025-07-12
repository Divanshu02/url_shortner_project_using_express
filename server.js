import express from "express";
import { shortnerRoutes } from "./routes/shortner.routes.js";

const app = express();

// 👇 Middleware
app.use(express.static("public")); //serve static files
app.use(express.urlencoded({ extended: true })); //parses form data
app.use(shortnerRoutes); //middleware having routes

app.set("view engine", "ejs");

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`server running on ${PORT} port`);
});
