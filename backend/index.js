const express = require("express");
const jsdom = require("jsdom");
const axios = require("axios").default;

const app = express();

app.use(express.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.get("/amazon_search_data", (req, res, next) => {
  const QUERY = req.query.keyword;

  axios
    .get(
      `https://www.amazon.com.br/s?k=${QUERY}&__mk_pt_BR=%C3%85M%C3%85%C5%BD%C3%95%C3%91&ref=nb_sb_noss`,
      {
        headers: {
          "User-Agent": "axios 1.6.8",
        },
      }
    )
    .then((res) => res.data)
    .then((response) => {
      const dom = new jsdom.JSDOM(response, {
        runScripts: "dangerously",
        virtualConsole: new jsdom.VirtualConsole(),
      });

      if (!dom) {
        const error = new Error("Could not parse page.");
        error.statusCode = 400;
        throw error;
      }

      const imgs = [
        ...dom?.window?.document?.getElementsByClassName("s-image"),
      ];
      const ariaLabelElements = [
        ...dom?.window?.document?.querySelectorAll("[aria-label]"),
      ];
      const parentElements = [...dom?.window?.document?.querySelectorAll("h2")];
      parentElements.map((h2) => h2.children.item(0));

      let titles = [];

      for (let anchorTag of parentElements) {
        titles.push(anchorTag.children.item(0).textContent);
      }

      let reviews = [];
      let ratings = [];

      for (let element of ariaLabelElements) {
        let attribute = element.getAttribute("aria-label");
        if (attribute.includes("estrelas")) ratings.push(attribute);
        if (attribute.includes("classificações")) reviews.push(attribute);
      }

      const urls = imgs.map((img) => img.src);

      console.log("reviews", reviews.length);
      console.log("ratings", ratings.length);
      console.log("ulrs", urls.length);
      console.log("titles", titles.length);

      res
        .json({ message: "Success", data: { reviews, ratings, urls, titles } })
        .status(200);
    })
    .catch((err) => {
      if (!err.statusCode) err.statusCode = 500;
      next(err);
    });
});

app.use((error, req, res, next) => {
  const status = error.statusCode;
  const message = error.message;
  const data = error.data;
  res.status(status).json({ message, data });
});

app.listen(3000, () => console.log("server running"));
