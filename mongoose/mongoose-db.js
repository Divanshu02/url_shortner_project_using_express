// import mongoose, { mongo } from "mongoose";

// //connect to mongodb server
// try {
//   await mongoose.connect("mongodb://127.0.0.1/mongoose_database");
// } catch (err) {
//   console.log(err);
// }

// //create schema
// const userSchema = mongoose.Schema({
//   name: { type: String, required: true },
//   email: { type: String, required: true },
//   age: { type: Number },
// });

// //create model/collection
// const Users = mongoose.model("users", userSchema);

// await Users.create({ name: "Ram", age: 30, email: "ram@gmail.com" });

// await mongoose.connection.close();
