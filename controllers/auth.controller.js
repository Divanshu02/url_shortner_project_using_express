import {
  getRegisteredUser,
  getRegisteredUsers,
  getTotalNoOfLinks,
  insertVerifyEmailTokenInDB,
  storeResetPasswordLinkInDB,
  updateUserPasswordInDB,
} from "../models/auth.model.js";
import {
  registeredUsersCollection,
  resetPasswordCollection,
  sessionsCollection,
  verifyEmailTokensCollection,
} from "../mongodb/db-client.js";
import argon2 from "argon2";
import {
  createResetPasswordLink,
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
import { Error } from "mongoose";

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
  if (!req.user) return res.redirect("/login");

  console.log("under-logout", req.user);
  const registeredUser = await getRegisteredUser(req.user.id);
  await sessionsCollection.updateMany(
    { user_id: registeredUser._id.toString() },
    { $set: { isRefreshTokenRevoked: true } }
  );
  res.clearCookie("access_token");
  res.clearCookie("refresh_token");
  res.redirect("/login");
};

//PROFILE-PAGE

export const getProfilePage = async (req, res) => {
  if (!req.user) return res.redirect("/login");
  const registeredUser = await getRegisteredUser(req.user.id);
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

export const verifyResetPassword = async (req, res) => {
  try {
    console.log("verifying reset password token------------------");

    const email = req.query.email;
    const token = req.query.token;
    const registeredUsers = await getRegisteredUsers();
    const registeredUser = registeredUsers.find((user) => user.email === email);
    console.log(registeredUser);

    const verifyResetPasswordToken = await resetPasswordCollection.findOne({
      user_id: registeredUser._id.toString(),
      reset_password_token: token,
    });
    console.log(
      token,
      "under VerifyResetPasswordToken====>",
      registeredUser._id.toString(),
      verifyResetPasswordToken
    );

    if (
      verifyResetPasswordToken &&
      new Date(verifyResetPasswordToken.expires_at) > Date.now() &&
      argon2.verify(verifyResetPasswordToken.reset_password_token, token)
    ) {
      const encodedToken = encodeURIComponent(token);

      return res.redirect(`/reset-password/${encodedToken}`);
    } else return res.redirect("/forgot-password");
  } catch (error) {
    console.log(error);
  }
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
        field: "currentPassword", // Indicate which field has error
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New passwords do not match",
        field: "confirmPassword",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long",
        field: "newPassword",
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
        field: "currentPassword",
      });
    }

    // Update password in database
    await updateUserPasswordInDB(userId, newPassword);

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

export const getForgotPasswordPage = (req, res) => {
  return res.render("../views/pages/forgot-password.ejs");
};

export const getResetPasswordPage = async (req, res) => {
  const { token } = req.params;
  const decodedToken = decodeURIComponent(token);

  const resetPasswordToken = await resetPasswordCollection.findOne({
    reset_password_token: decodedToken,
  });

  if (!resetPasswordToken) return res.status(400).send("INTERNAL SERVER ERROR");
  return res.render("../views/pages/reset-password.ejs", { token });
};

export const postResetPassword = async (req, res) => {
  try {
    console.log("post reset password--------------------------------");

    const { token } = req.params;
    if (!token) throw new Error("INTERVAL SERVER ERROR");

    const decodedToken = decodeURIComponent(token); // ✅ Decode first!

    const { newPassword, confirmPassword } = req.body;

    const resetPasswordToken = await resetPasswordCollection.findOne({
      reset_password_token: decodedToken,
    });

    console.log("resetPasswordToken===>", resetPasswordToken, token);

    if (!resetPasswordToken)
      return res.status(400).send("Sorry, you are not permitted");

    const userId = resetPasswordToken.user_id;

    // Validate inputs
    if (!newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
        field: "currentPassword", // Indicate which field has error
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New passwords do not match",
        field: "confirmPassword",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long",
        field: "newPassword",
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

    // Update password in database
    await updateUserPasswordInDB(userId, newPassword);

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
export const sendResetPasswordLinkToGmail = async (req, res) => {
  const { email } = req.body;
  try {
    const registeredUsers = await getRegisteredUsers();
    const user = registeredUsers.find((user) => user.email === email);
    if (!user)
      return res.status(400).json({
        success: false,
        message: "Email doesn't exists",
      });

    //Store token in db
    await storeResetPasswordLinkInDB(user);

    const resetPasswordLink = await resetPasswordCollection.findOne({
      user_id: user._id.toString(),
    });

    const newResetPasswordLink = createResetPasswordLink({
      email: user.email,
      token: resetPasswordLink.reset_password_token,
    });

    const mjmlTemplate = await fs.readFile(
      path.join(
        import.meta.dirname,
        "../",
        "views",
        "pages",
        "reset-password-gmail-template.mjml"
      ),
      "utf-8"
    );

    const filledTemplate = mjmlTemplate.replaceAll(
      "{{resetLink}}",
      newResetPasswordLink
    );

    const { html } = mjml2html(filledTemplate);

    await sendEmailUsingSendGrid({
      to: email,
      sub: "Reset Your Password",
      html: html,
    }).catch(console.error);

    // await sendEmail({
    //   to: user.email,
    //   sub: "Reset your Password",
    //   html: `
    //   <p>The token to reset the password is: ${resetPasswordLink.token}</p>
    //   <a href=${newResetPasswordLink}>Click here </a>
    //   Link:${newResetPasswordLink}
    //   `,
    // });

    return res.status(200).json({
      success: true,
      message: "Link Sent successfully",
    });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred. Please try again.",
    });
  }
};
