import jwt from "jsonwebtoken";
import crypto from "crypto";

const secret_key = process.env.JWT_ACCESS_SECRET;

export const generateJwt = (payload, time) => {
  return jwt.sign(payload, secret_key, {
    expiresIn: time,
  });
};

//jwt token can never be revoked or deleted or stopped until the expiry time is not completed, so instead you can use session to store token on db and you can revoke it and make changes you want and implement auth properly

export const verifyJwt = (token) => {
  console.log("verifying jwt...");

  return jwt.verify(token, secret_key);
};

export const generateRandomToken = (digit = 8) => {
  const min = 10 ** (digit - 1);
  const max = 10 ** digit;

  return crypto.randomInt(min, max).toString();
};

export const createVerifyEmailLink = ({ email, token }) => {
  // const uriEncodedEmail = encodeURIComponent(email);
  // return `${process.env.FRONTEND_URL}/verify-email-token?email=${uriEncodedEmail}&token=${token} `;

  const url = new URL(`${process.env.FRONTEND_URL}/verify-email-token`);
  url.searchParams.append("email", email);
  url.searchParams.append("token", token);
  return url;
};




