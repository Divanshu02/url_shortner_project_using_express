import path from "path";
import { readFile } from "fs/promises";
import {
  getDataFromLinksFile,
  pushLinksToLinksFile,
} from "../models/shortener.model.js";

const getShortenerPage = async (req, res) => {
  try {
    const allLinks = await getDataFromLinksFile(); //get data from model
    // console.log("allLinks==>", allLinks);

    return res.render("index", { allLinks, host: req.host });
  } catch (err) {
    console.log(err);
    return res.status(500).send("Internal Server Error");
  }
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
    
    const newLink = { shortcode: shortcode, url: url };

    //push newlink to Database 
    await pushLinksToLinksFile(newLink);
    res.redirect("/");
  }
};

const redirectToShortLink = async (req, res) => {
  const { shortcode } = req.params;

  const linksData = await getDataFromLinksFile(); //get data from model

  //get data from db whose obj matched with the params shortcode
  const link = linksData.find(
    (link) => link.shortcode === shortcode
  );
  if (!link) return res.status(400).send("404 error occured");

  return res.redirect(link?.url);
};

export { getShortenerPage, postURLshortner, redirectToShortLink };
