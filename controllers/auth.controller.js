import {
  getRegisteredUser,
  getRegisteredUsers,
  getTotalNoOfLinks,
  insertVerifyEmailTokenInDB,
  updateUserPasswordInDB,
} from "../models/auth.model.js";
import {
  registeredUsersCollection,
  sessionsCollection,
  verifyEmailTokensCollection,
} from "../mongodb/db-client.js";
import argon2 from "argon2";
import {
  createVerifyEmailLink,
  generateJwt,
  generateRandomToken,
} from "./auth.services.js";
import { ObjectId } from "mongodb";
import { sendEmail } from "../emails/services.nodemailer.js";
import fs from "fs/promises";
import path from "path";
import mjml2html from "mjml";
import { sendEmailUsingResend } from "../emails/send-email.resend.js";
import { sendEmailUsingSendGrid } from "../emails/send-email.sendgrid.js";

//GET SIGN UP & LOGIN PAGE---------------------------

//GET-LOGIN-PAGE
export const getLoginPage = (req, res) => {
  if (req.user) return res.redirect("/");
  try {
    // console.log("cookies==>", req.headers.cookie, typeof req.headers.cookie);
    console.log("cookie==>", req.signedCookies.idAdmin);

    return res.render("../views/auth/Login.ejs");
  } catch (err) {
    console.log(err);
    // res.redirect("/login");
  }
};

//GET-SIGNUP-PAGE
export const getSignupPage = (req, res) => {
  if (req.user) return res.redirect("/");

  try {
    return res.render("../views/auth/Signup.ejs");
  } catch (err) {}
};

// POST LOGIN & SIGNUP-----------------------

//POST-LOGIN--
export const postLoginUser = async (req, res) => {
  try {
    console.log("ReqBody==>", req.body);
    if (!req.body) return res.json("email or password is missing");
    const { email, password } = req.body; //get it from body

    //Find Matching User------------------------------
    const registeredUsers = await getRegisteredUsers(); //get all registered-user from db
    const registeredUser = registeredUsers.find((registeredUser) => {
      return registeredUser.email === email; //get current-user(who is trying to login) from registered-users
    });

    if (!registeredUser) return res.json({ success: false, error: "email" }); //user doesn't exist

    //Password hashing using bcrypt and argon2-------------------------

    //password hashing using bcrypt:-
    // const isPasswordMatch = await bcrypt.compare(
    //   password,
    //   registeredUser.password
    // );

    //password hashing using argon2
    const isPasswordMatch = await argon2.verify(
      registeredUser.password,
      password
    );
    if (!isPasswordMatch)
      return res.json({ success: false, error: "password" }); //password doesn't match

    //Generating Tokens------------------------------------------

    const payload = {
      id: registeredUser._id,
      name: registeredUser.name,
      email: registeredUser.email,
    };
    const access_token = generateJwt(payload, "1m"); //Generate access token with payload
    res.cookie("access_token", access_token); // set access token in cookie

    const payload2 = {
      id: registeredUser._id,
    };
    const refreshToken = generateJwt(payload2, "1d"); //Generate refresh token with payload2
    res.cookie("refresh_token", refreshToken); //set refresh token in cookie

    //Saving The Refresh Token Under Session Collection In DB---------------------------------------------
    await sessionsCollection.insertOne({
      user_id: registeredUser._id.toString(), //acts as foreign-key from User-Collection(it will help to track the user-session)
      refresh_token: refreshToken,
      isRefreshTokenRevoked: false,
    });
    res.json({ success: true });
    // res.redirect("/");
  } catch (err) {
    console.log(err);
  }
};

//POST-SIGNUP---
export const postSignupUser = async (req, res) => {
  const { name, email, password } = req.body;

  console.log("Sign-up ReqBody==>", { name, email, password });

  const registeredUsers = await getRegisteredUsers();

  //check If same email already registered before
  const isEmailAlreadyRegistered = registeredUsers.some((registeredUser) => {
    return registeredUser.email === email;
  });

  if (isEmailAlreadyRegistered)
    return res.json({ success: false, error: "email" });

  // const hashedPassword = await bcrypt.hash(password, 10);
  const hashedPassword = await argon2.hash(password);

  await registeredUsersCollection.insertOne({
    name,
    email,
    password: hashedPassword,
    createdAt: Date.now(),
    isEmailValid: false,
  });
  res.json({ success: true });
};

//LOGOUT----
export const logoutUser = async (req, res) => {
  console.log("under-logout", req.user);
  await sessionsCollection.updateMany(
    { user_id: req.user.id },
    { $set: { isRefreshTokenRevoked: true } }
  );
  res.clearCookie("access_token");
  res.clearCookie("refresh_token");
  res.redirect("/login");
};

//PROFILE-PAGE

export const getProfilePage = async (req, res) => {
  if (!req.user) return res.redirect("/login");
  const registeredUser = await getRegisteredUser(req.user);
  const totalLinks = await getTotalNoOfLinks(req.user);
  console.log("registeredUser======>", registeredUser);

  return res.render("../views/pages/profile.ejs", {
    totalLinks,
    registeredUser,
  });
};

export const getVerifyEmailPage = (req, res) => {
  if (!req.user) return res.redirect("/");

  return res.render("../views/pages/verifyemail.ejs", {
    email: req.user.email,
  });
};

export const postResendVerificationEmail = async (req, res) => {
  if (!req.user) return res.redirect("/");
  // const user = await getRegisteredUser(req.user);
  const randomToken = generateRandomToken();
  await insertVerifyEmailTokenInDB(req.user.id, randomToken);

  const verifyEmailLink = createVerifyEmailLink({
    email: req.user.email,
    token: randomToken,
  });

  console.log("verifyEmailLink===>", verifyEmailLink);

  const mjmlTemplate = await fs.readFile(
    path.join(import.meta.dirname, "../", "emails", "verify-email.mjml"),
    "utf-8"
  );

  const filledTemplate = mjmlTemplate
    .replaceAll("{{token}}", randomToken)
    .replaceAll("{{verifyUrl}}", verifyEmailLink);

  const { html } = mjml2html(filledTemplate);

  await sendEmailUsingSendGrid({
    to: req.user.email,
    sub: "VERIFY YOUR EMAIL",
    html: html,
  }).catch(console.error);

  return res.redirect("/verify-email");
};

//It will verify the token
export const VerifyEmailToken = async (req, res) => {
  try {
    // const email = req.query.email;
    const token = req.query.token;

    const verifyEmailToken = await verifyEmailTokensCollection.findOne({
      user_id: req.user.id,
      email_verification_token: token,
    });
    console.log(
      token,
      "under VerifyEmailToken====>",
      req.user.id,
      verifyEmailToken
    );

    if (
      verifyEmailToken &&
      new Date(verifyEmailToken.expires_at) > Date.now() &&
      verifyEmailToken.email_verification_token === token
    ) {
      await registeredUsersCollection.updateOne(
        { _id: new ObjectId(req.user.id) },
        { $set: { isEmailValid: true } }
      );
      return res.redirect("/profile");
    } else return res.redirect("/verify-email");
  } catch (error) {
    console.log(error);
  }
};

export const getEditProfilePage = (req, res) => {
  try {
  } catch {}
};

export const getChangePasswordPage = (req, res) => {
  return res.render("../views/pages/change-password.ejs", {
    title: "Change Password",
    user: req.user,
  });
};

//-----------------------------------------------------------

export const postChangePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user.id;

    // Validate inputs
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New passwords do not match",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long",
      });
    }

    // Get user from database
    const user = await getRegisteredUser(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify current password
    const isMatch = await argon2.verify(user.password, currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Update password in database
    await updateUserPasswordInDB(currentUser, newPassword);

    // Return success response
    res.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Password change error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while changing password",
    });
  }
};
