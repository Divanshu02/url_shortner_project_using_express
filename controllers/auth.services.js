import jwt from "jsonwebtoken";

const secret_key = process.env.JWT_SECRET;

export const generateJwt = (payload) => {
  return jwt.sign(payload, secret_key, {
    expiresIn: "30d",
  });
};

export const verifyJwt = (token) => {
  return jwt.verify(token, secret_key);
};
