import { readFile, writeFile } from "fs/promises";
import path from "path";
import { shortenerCollection } from "../mongodb/db-client.js";

const linkFilePath = path.join("data", "links.json");

async function getDataFromLinksFile() {
  try {
    const data = await readFile(linkFilePath, "utf-8");
    const dbdata = await shortenerCollection.find().toArray();
    console.log("data recieved from db", dbdata);
    return dbdata;
  } catch (err) {
    if (err.code === "ENONT") {
      //if links.json doesn't exists
      await writeFile(linkFilePath, JSON.stringify({}));
      return {};
    }
    throw err;
  }
}

async function pushLinksToLinksFile(newLink) {
  await shortenerCollection.insertOne(newLink);
  // await writeFile(linkFilePath, JSON.stringify(linksData));
  // console.log("Link added successfully", linksData);
}
export { getDataFromLinksFile, pushLinksToLinksFile };
