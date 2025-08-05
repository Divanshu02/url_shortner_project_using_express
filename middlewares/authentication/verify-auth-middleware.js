import { generateJwt, verifyJwt } from "../../controllers/auth.services.js";

export const verifyAuthentication = (req, res, next) => {
  const token = req.cookies.access_token;
  const refreshToken = req.cookies.refresh_token;

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded_token = verifyJwt(token);
    req.user = decoded_token;
    // next();
    console.log("req.user==>", req.user);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      console.log("token Expiredddd==============");

      if (!refreshToken)
        return res
          .status(401)
          .json({ message: "Session expired. Please log in again." });

      try {
        const decodedRefresh = verifyJwt(refreshToken);
        console.log("setting refresh token");

        // generate new access token
        const newAccessToken = generateJwt(
          {
            id: decodedRefresh.session_id,
          },
          "2m"
        );

        // optionally set new cookie
        res.cookie("access_token", newAccessToken);

        req.user = decodedRefresh; // or decodedRefresh
      } catch (err) {
        console.log(err);
        return res.status(403).json({ message: "Invalid refresh token." });
      }
    } else {
      req.user = null;

      return res.status(403).json({ message: "Invalid token." });
    }

    // res.redirect("/");
  }
  return next();
};
