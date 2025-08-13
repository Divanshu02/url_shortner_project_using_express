import { getRegisteredUsers } from "../models/auth.model.js";
import {
  registeredUsersCollection,
  sessionsCollection,
} from "../mongodb/db-client.js";
import argon2 from "argon2";
import { generateJwt } from "./auth.services.js";
import { ObjectId } from "mongodb";

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
