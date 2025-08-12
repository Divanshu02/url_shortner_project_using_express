import jwt from "jsonwebtoken";

const secret_key = process.env.JWT_SECRET;

export const generateJwt = (payload, time) => {
  return jwt.sign(payload, secret_key, {
    expiresIn: time,
  });
};

export const verifyJwt = (token) => {
  console.log("verifying jwt...");

  return jwt.verify(token, secret_key);
};

//jwt token can never be revoked or deleted or stopped until the expiry time is not completed, so instead you can use session to store token on db and you can revoke it and make changes you want and implement auth properly
