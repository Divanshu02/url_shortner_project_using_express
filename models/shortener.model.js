import { readFile, writeFile } from "fs/promises";
import { ObjectId } from "mongodb";
import path from "path";
import { shortenerCollection } from "../mongodb/db-client.js";

const linkFilePath = path.join("data", "links.json");

async function getDataFromLinksFile(id) {
  try {
    // const data = await readFile(linkFilePath, "utf-8");
    const dbdata = await shortenerCollection.find({ user_id: id }).toArray();
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

async function updateLinkInDB(updatedLink) {
  await shortenerCollection.updateOne(
    { _id: new ObjectId(updatedLink.id) }, // Filter
    { $set: { url: updatedLink.url, shortcode: updatedLink.shortcode } } // Update operation
  );
}

async function deleteLinkFromDB(id) {
  await shortenerCollection.deleteOne({ _id: new ObjectId(id) });
}

async function findUniqueLinkFromDb(id) {
  const link = await shortenerCollection.findOne({ _id: new ObjectId(id) });
  return link;
}
export {
  getDataFromLinksFile,
  pushLinksToLinksFile,
  deleteLinkFromDB,
  updateLinkInDB,
  findUniqueLinkFromDb,
};
