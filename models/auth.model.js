import {
  registeredUsersCollection,
  verifyEmailTokensCollection,
} from "../mongodb/db-client.js";
import { shortenerCollection } from "../mongodb/db-client.js";
import { ObjectId } from "mongodb";
import argon2 from "argon2";

export const getRegisteredUsers = async () => {
  const registeredUsers = await registeredUsersCollection.find().toArray();
  return registeredUsers;
};

export const getRegisteredUser = async (userId) => {
  const registeredUser = await registeredUsersCollection.findOne({
    _id: new ObjectId(userId),
  });
  return registeredUser;
};

export const getTotalNoOfLinks = async (user) => {
  const registeredUsers = await shortenerCollection
    .find({ user_id: user.id })
    .toArray();
  return registeredUsers.length;
};

export const insertVerifyEmailTokenInDB = async (userId, token) => {
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + 2 * 60 * 1000); // 2 minutes later

  await verifyEmailTokensCollection.deleteMany({ user_id: userId });
  await verifyEmailTokensCollection.insertOne({
    user_id: userId,
    email_verification_token: token,
    created_at: createdAt,
    expires_at: expiresAt,
  });
};

export const updateUserPasswordInDB = async (userId, newPassword) => {
  try {
    const hashNewPassword = await argon2.hash(newPassword);
    await registeredUsersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { password: hashNewPassword } }
    );
  } catch (error) {
    console.log(error);
  }
};
