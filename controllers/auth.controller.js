import { getRegisteredUsers } from "../models/auth.model.js";
import { registeredUsersCollection } from "../mongodb/db-client.js";
import argon2 from "argon2";
import { generateJwt } from "./auth.services.js";

//GET SIGN UP & LOGIN PAGE---------------------------
export const getLoginPage = (req, res) => {
  try {
    // console.log("cookies==>", req.headers.cookie, typeof req.headers.cookie);
    console.log("cookie==>", req.signedCookies.idAdmin);

    return res.render("../views/auth/Login.ejs");
  } catch (err) {
    console.log(err);
  }
};

export const getSignupPage = (req, res) => {
  try {
    return res.render("../views/auth/Signup.ejs");
  } catch (err) {}
};


// POST LOGIN & SIGNUP-----------------------

export const postLoginUser = async (req, res) => {
  try {
    console.log("ReqBody==>", req.body);

    const { email, password } = req.body;
    // res.setHeader("Set-Cookie", [
    //   `isLoggedIn=true; Path=/; `,
    //   `email=${email}; Path=/; HttpOnly`,
    // ]);
    // res.cookie("isLoggedIn", true, {
    //   signed: true,
    // });

    const registeredUsers = await getRegisteredUsers();
    const isEmailRegistered = registeredUsers.some((registeredUser) => {
      return registeredUser.email === email;
    });

    if (!isEmailRegistered) return res.json({ success: false, error: "email" });

    //get user
    const registeredUser = registeredUsers.find((registeredUser) => {
      return registeredUser.email === email;
    });

    //check if password matches

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
      return res.json({ success: false, error: "password" });

    const payload = {
      id: registeredUser._id,
      name: registeredUser.name,
      email: registeredUser.email,
    };
    const token = generateJwt(payload);
    res.cookie("access_token", token);
    res.json({ success: true });
    res.redirect("/");
  } catch (err) {
    console.log(err);
  }
};

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

export const logoutUser = (req, res) => {
  res.clearCookie("access_token");
  res.redirect("/login");
};
