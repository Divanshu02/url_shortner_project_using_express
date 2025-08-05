import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGO_URI);
await client.connect();

const db = client.db("mongodb_nodejs_db");
const userCollection = db.collection("users");
// userCollection.insertOne({ name: "Vansh", age: 20 });

// userCollection.insertMany([
//   {
//     name: "Rahul",
//     age: 25,
//     department: "Development",
//   },
//   {
//     name: "Ankit",
//     age: 22,
//     department: "Devops",
//   },
//   {
//     name: "Rakesh",
//     age: 27,
//     department: "Development",
//   },
// ]);

//Read
//(i)
// const users = await userCollection.find().toArray(); //returns cursor
// console.log(users);

const userCursor = userCollection.find();
for await (const user of userCursor) {
  console.log(user); // prints one document at a time
}

// const user = await userCollection.findOne({ department: "Development" ,age:28});
// console.log(user);

// const updatedData = await userCollection.updateOne(
//   { name: "Vansh" },
//   { $set: { blood_group: "O+" }, $inc: { age: 1 } }
// );

// const user1 = await userCollection.findOne({ name: "Rahul" });
// console.log("user1===>", user1);

// await userCollection.updateMany(
//   {
//     department: "Development",
//   },
//   {
//     $set: { active: false, mode: "Success" },
//   }
// );



