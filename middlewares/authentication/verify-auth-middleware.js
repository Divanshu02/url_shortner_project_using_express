import { generateJwt, verifyJwt } from "../../controllers/auth.services.js";
import {
  registeredUsersCollection,
  sessionsCollection,
} from "../../mongodb/db-client.js";
import { ObjectId } from "mongodb";

const REFRESH_TOKEN_EXPIRES_SECONDS = 7 * 24 * 60 * 60; // 7 days

/*
This method will be called every time when use  r tries to access protected-route.
*/

export const verifyAuthentication = async (req, res, next) => {
  //Get access and refresh tokens from cookies
  const accessToken = req.cookies.access_token;
  const refreshToken = req.cookies.refresh_token;

  if (!refreshToken) {
    req.user = null;
    return next();
  }

  try {
    // Verify Access Token
    const decodedAccessToken = verifyJwt(accessToken);
    req.user = decodedAccessToken;
    console.log("req.user==>", req.user);
  } catch (error) {
    if (
      error.name === "TokenExpiredError" ||
      error.name === "JsonWebTokenError"
    ) {
      //This block runs If Access Token Expires

      console.log("token Expiredddd==============");

      //Refresh Token Logic----------------------
      // if (!refreshToken)
      //   return res
      //     .status(401)
      //     .json({ message: "Session expired. Please log in again." });

      try {
        console.log("NO ACCESS TOKEN=========>");

        const decodedRefreshToken = verifyJwt(refreshToken); // Verify Refresh Token

        // Get the Current-LoggedIn Session Associated With the Session in DB with matching user_id & refresh_token
        //It helps to know whether the session even exists that user is currently logged-in or not or any hacker is trying to access the session.
        const currentLoggedinSession = await sessionsCollection.findOne({
          user_id: decodedRefreshToken.id,
          refresh_token: refreshToken,
        });

        if (!currentLoggedinSession) {
          req.user = null;
          return next();
          // return res.json("User || Refresh-token INVALID"); //Session doesn't exits
        }

        console.log(
          "Refresh Tokens::-",
          decodedRefreshToken,
          currentLoggedinSession
        );

        /*Below condition checks whether the refresh-token is used before to update the access-token or not.
          If it  becomes true, it means the refresh token that has been sent through cookie 've been already used before and someone(hacker) is
          trying to hack the session.*/
        if (currentLoggedinSession.isRefreshTokenRevoked) {
          //revoke all sessions by making the isRefreshTokenRevoked true
          await sessionsCollection.updateMany(
            { user_id: decodedRefreshToken.id },
            { $set: { isRefreshTokenRevoked: true } }
          );
          // res.json("refresh token invalid");
          return next();
        } else {
          //If it reaches this block, it means that the actual user has logged in and everything is valid..

          /*
          Now Just update the isRefreshTokenRevoked prop to true to tell that the db Refresh-Token that has been sent through cookie is used now & it 
          ensures that even if hacker has your refresh token, he will not able to use that again as the above cond'n becomes true and further it will revoke
          all  sessions of that user.
          */
          await sessionsCollection.updateOne(
            { user_id: decodedRefreshToken.id, refresh_token: refreshToken },
            { $set: { isRefreshTokenRevoked: true } } // update operation
          );
        }

        //Get the User from registeredUsersCollection from db associated with current-loggedin-user
        const registeredUser = await registeredUsersCollection.findOne({
          _id: new ObjectId(currentLoggedinSession.user_id),
        });
        console.log("registered_user::-", registeredUser);

        req.user = registeredUser;

        //Generate new access token
        const payload = {
          id: registeredUser._id,
          name: registeredUser.name,
          email: registeredUser.email,
        };
        const newAccessToken = generateJwt(payload, "1m");
        res.cookie("access_token", newAccessToken);

        const payload2 = {
          id: registeredUser._id,
        };

        //Generate new refresh token----

        // Calculate remaining time from original token
        const expiresInMs = decodedRefreshToken.exp * 1000 - Date.now();
        const expiresInSec = Math.floor(expiresInMs / 1000);
        console.log("New Refresh token expires in:", expiresInSec);

        const newRefreshToken = generateJwt(payload2, expiresInSec);
        //save the refresh token in session collection in db
        console.log(" new refresh token====------------", newRefreshToken);

        await sessionsCollection.insertOne({
          user_id: registeredUser._id.toString(),
          refresh_token: newRefreshToken,
          isRefreshTokenRevoked: false,
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
