import path from "path";
import { readFile } from "fs/promises";
import {
  deleteLinkFromDB,
  findUniqueLinkFromDb,
  getDataFromLinksFile,
  pushLinksToLinksFile,
  updateLinkInDB,
} from "../models/shortener.model.js";

const getShortenerPage = async (req, res) => {
  try {
    if (req.user) {
      const allLinks = await getDataFromLinksFile(req.user.id); //get data from model
      // console.log("allLinks==>", allLinks);

      //render index.ejs file under views
      return res.render("index", { allLinks, host: req.host });
    } else {
      res.redirect("/login");
    }
  } catch (err) {
    console.log(err);
    return res.status(500).send("Internal Server Error");
  }
};

const getEditShortenerPage = async (req, res) => {
  const { id } = req.params;
  console.log("under edit-shortener-page", id);

  const link = await findUniqueLinkFromDb(id);

  res.render("../views/pages/Edit.ejs", { link, action: "edit" });
};

const postURLshortner = async (req, res) => {
  console.log("post req made", req.body);
  const payload = req.body;
  const { url, shortcode } = payload;
  console.log(url, shortcode);

  const linksData = await getDataFromLinksFile(req.user.id);

  if (!url && !shortcode) {
    res.status(302).send("URL or shortcode cannot be empty");
    return res.redirect("/");
  }

  console.log("under post shortner==>", linksData);
  const isShortCodePresent = linksData.find(
    (link) => link.shortcode === shortcode
  );

  if (isShortCodePresent) {
    //shortcode already exists
    return res.status(400).send("shortCode already exists, pls choose diff");
  } else {
    const newLink = { user_id: req.user.id, shortcode: shortcode, url: url };

    //push newlink to Database
    await pushLinksToLinksFile(newLink);
    res.redirect("/");
  }
};

const redirectToShortLink = async (req, res) => {
  const { shortcode } = req.params;

  const linksData = await getDataFromLinksFile(req?.user?.id); //get data from model

  //get data from db whose obj matched with the params shortcode
  const link = linksData.find((link) => link.shortcode === shortcode);
  if (!link) return res.status(400).send("404 error occured");

  return res.redirect(link?.url);
};

export const updateShortener = async (req, res) => {
  const { id } = req.params;
  const { url, shortcode } = req.body;
  const updatedLink = { id, url, shortcode };

  await updateLinkInDB(updatedLink);
  console.log("updateShortener==>", url, shortcode, id, updatedLink);

  return res.redirect("/");

  //find unique link in db
  // const link = await findUniqueLinkFromDb(id);
};

const getDeleteShortenerPage = async (req, res) => {
  const { id } = req.params;
  console.log("under delete-shortener-page", id);

  const link = await findUniqueLinkFromDb(id);

  res.render("../views/pages/Edit.ejs", { link, action: "delete" });
};

const postDeleteShortener = async (req, res) => {
  const { id } = req.params;
  console.log("deleteshortttttt=====", id);

  await deleteLinkFromDB(id);
  res.redirect("/");
};

export {
  getShortenerPage,
  postURLshortner,
  redirectToShortLink,
  getEditShortenerPage,
  getDeleteShortenerPage,
  postDeleteShortener,
};
