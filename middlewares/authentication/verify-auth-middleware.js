import { verifyJwt } from "../../controllers/auth.services.js";

export const verifyAuthentication = (req, res, next) => {
  const token = req.cookies.access_token;
  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded_token = verifyJwt(token);
    req.user = decoded_token;
    console.log("req.user==>", req.user);
  } catch (error) {
    req.user = null;
  }
  return next();
};
