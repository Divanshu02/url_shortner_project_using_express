import { readFile, writeFile } from "fs/promises";
import path from "path";

const linkFilePath = path.join("data", "links.json");

async function getDataFromLinksFile() {
  try {
    const data = await readFile(linkFilePath, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    if (err.code === "ENONT") {
      //if links.json doesn't exists
      await writeFile(linkFilePath, JSON.stringify({}));
      return {};
    }
    throw err;
  }
}

async function pushLinksToLinksFile(linksData) {
  await writeFile(linkFilePath, JSON.stringify(linksData));
  console.log("Link added successfully", linksData);
}
export { getDataFromLinksFile, pushLinksToLinksFile };
