import { MongoClient } from "mongodb";

const client = new MongoClient("mongodb://127.0.0.1");
await client.connect();

const db = client.db("UrlShortenerDB");
export const shortenerCollection = db.collection("links");
export const registeredUsersCollection = db.collection("registered_users");
