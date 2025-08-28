import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGO_URI);
await client.connect();

const db = client.db("UrlShortenerDB");
export const shortenerCollection = db.collection("links");
export const registeredUsersCollection = db.collection("registered_users");
export const sessionsCollection = db.collection("sessions");
export const verifyEmailTokensCollection = db.collection("verify_email_tokens");

export const resetPasswordCollection = db.collection(
  "verify_reset_password_tokens"
);
