import path from "path";
import { readFile } from "fs/promises";
import {
  getDataFromLinksFile,
  pushLinksToLinksFile,
} from "../models/shortener.model.js";

const getShortenerPage = async (req, res) => {
  try {
    const allLinks = await getDataFromLinksFile(); //get data from model

    return res.render("index", { allLinks, host: req.host });
  } catch (err) {
    console.log(err);
    return res.status(500).send("Internal Server Error");
  }
};
const redirectToShortLink = async (req, res) => {
  const { shortcode } = req.params;

  const linksData = await getDataFromLinksFile(); //get data from model
  if (!linksData[shortcode]) return res.status(400).send("404 error occured");
  return res.redirect(linksData[shortcode]);
};

const postURLshortner = async (req, res) => {
  console.log("post req made", req.body);
  const payload = req.body;
  const { url, shortcode } = payload;
  console.log(url, shortcode);

  const linksData = await getDataFromLinksFile();

  if (!url && !shortcode) {
    res.status(302).send("URL or shortcode cannot be empty");
    return res.redirect("/");
  }
  
  if (linksData[shortcode]) {
    //shortcode already exists
    return res.status(400).send("shortCode already exists, pls choose diff");
  } else {
    //update linksObject and push to links.json
    linksData[shortcode] = url;

    //push links to links.json file
    await pushLinksToLinksFile(linksData);
    res.redirect("/");
  }
};

export { getShortenerPage, postURLshortner, redirectToShortLink };
