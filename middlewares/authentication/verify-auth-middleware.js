import { generateJwt, verifyJwt } from "../../controllers/auth.services.js";
import {
  registeredUsersCollection,
  sessionsCollection,
} from "../../mongodb/db-client.js";
import { ObjectId } from "mongodb";

export const verifyAuthentication = async (req, res, next) => {
  const access_token = req.cookies.access_token;
  const refreshToken = req.cookies.refresh_token;

  if (!access_token) {
    req.user = null;
    return next();
  }

  try {
    //verifyies access_token
    const decoded_token = verifyJwt(access_token);
    req.user = decoded_token;
    console.log("req.user==>", req.user);
  } catch (error) {
    //if verification fails then verify refresh_token and if the refresh_token is valid & not expired then generate new access_token

    if (error.name === "TokenExpiredError") {
      console.log("token Expiredddd==============");

      // if (!refreshToken)
      //   return res
      //     .status(401)
      //     .json({ message: "Session expired. Please log in again." });
      if (!refreshToken) {
        req.user = null;
        return next();
      }

      try {
        //refresh_token verification
        const decodedRefresh = await verifyJwt(refreshToken);
        console.log("setting refresh token");

        //Also match the incoming refresh token with the refresh_token stored in db
        const dbRefreshToken = await sessionsCollection.findOne({
          user_id: decodedRefresh.id,
          refresh_token: refreshToken,
        });

        if (!dbRefreshToken) return res.json("refresh token not found in db");

        console.log("Refresh Tokens::-", decodedRefresh, dbRefreshToken);

        if (dbRefreshToken.isRevoked) {
          //someone is trying to hack the session

          //revoke all sessions by making it true
          await sessionsCollection.updateMany(
            { user_id: decodedRefresh.id },
            { $set: { isRevoked: true } }
          );
          return res.json("refresh token invalid");
        }

        const registeredUser = await registeredUsersCollection.findOne({
          _id: new ObjectId(decodedRefresh.id),
        });

        console.log("registered_user::-", registeredUser);

        //Generate access token
        const payload = {
          id: registeredUser._id,
          name: registeredUser.name,
          email: registeredUser.email,
        };
        const access_token = generateJwt(payload, "1m");
        res.cookie("access_token", access_token);

        //Generate refresh token
        const payload2 = {
          id: registeredUser._id,
        };

        const newRefreshToken = generateJwt(payload2, "4m");
        //save the refresh token in session collection in db
        console.log(" new refresh token====------------", newRefreshToken);

        await sessionsCollection.updateOne(
          { user_id: decodedRefresh.id, refresh_token: refreshToken },
          { $set: { isRevoked: true } } // update operation
        );

        await sessionsCollection.insertOne({
          user_id: registeredUser._id.toString(),
          refresh_token: newRefreshToken,
          isRevoked: false,
        });

        res.cookie("refresh_token", newRefreshToken);
      } catch (err) {
        console.log(err);
        req.user = null;
        return next();
        // return res.status(403).json({ message: "Invalid refresh token." });
      }
    } else req.user = null;

    // return res.status(403).json({ message: "Invalid token." });

    // res.redirect("/login");
  }
  return next();
};
