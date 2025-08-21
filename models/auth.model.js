import { registeredUsersCollection } from "../mongodb/db-client.js";
import { shortenerCollection } from "../mongodb/db-client.js";
import { ObjectId } from "mongodb";

export const getRegisteredUsers = async () => {
  const registeredUsers = await registeredUsersCollection.find().toArray();
  return registeredUsers;
};

export const getRegisteredUser = async (user) => {
  const registeredUser = await registeredUsersCollection.findOne({
    _id: new ObjectId(user.id),
  });
  return registeredUser;
};

export const getTotalNoOfLinks = async (user) => {
  const registeredUsers = await shortenerCollection
    .find({ user_id: user.id })
    .toArray();
  return registeredUsers.length;
};
