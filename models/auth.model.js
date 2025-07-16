import { registeredUsersCollection } from "../mongodb/db-client.js";

export const getRegisteredUsers = async () => {
  const registeredUsers = await registeredUsersCollection.find().toArray();
  return registeredUsers;
};
