const express = require("express");
const jsdom = require("jsdom");
const axios = require("axios").default;

const app = express();

app.use(express.json());

//sets access headers
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

      const imgs = [...dom.window.document.getElementsByClassName("s-image")];
      const ariaLabelElements = [
        ...dom.window.document.querySelectorAll("[aria-label]"),
      ];
      const parentElements = [...dom.window.document.querySelectorAll("h2")];

      if (!imgs.length || !ariaLabelElements.length || !parentElements.length) {
        const error = new Error("Could not retrive products.");
        error.statusCode = 400;
        throw error;
      }

      //titles are nested inside an h2 and an anchor tag;
      //first all h2s were retrieved, now we extract the anchor tags
      parentElements.map((h2) => h2.children.item(0));

      let titles = [];

      //finally, access the nested span and save its text content
      for (let anchorTag of parentElements) {
        titles.push(anchorTag.children.item(0).textContent);
      }

      let reviews = [];
      let ratings = [];

      //filtering with String.endsWith since not all aria-label attributes pertain
      //to product reviews.
      //The ones that do, follow the pattern:
      //  ratings -> X de 5 estrelas;
      //  reviews -> X classificações;
      for (let element of ariaLabelElements) {
        let attribute = element.getAttribute("aria-label");
        if (attribute.endsWith("estrelas")) ratings.push(attribute);
        if (attribute.endsWith("classificações")) reviews.push(attribute);
      }

      const urls = [];

      //extracts url from img elements
      //filtering with the "AC_UL320" substring since only product images contain it.
      for (let img of imgs) {
        let src = img.getAttribute("src");
        if (src && src.includes("AC_UL320")) urls.push(src);
      }

      res
        .json({ message: "Success", data: { reviews, ratings, urls, titles } })
        .status(200);
    })
    .catch((err) => {
      if (!err.statusCode) err.statusCode = 500;
      next(err);
    });
});

//handles forwarded errors
app.use((error, req, res, next) => {
  const status = error.statusCode;
  let message = error.message;
  if (status == 500) message = "Server failed processing request.";
  const data = error.data;

  res.status(status).json({ message, data });
});

app.listen(3000, () => console.log("server running"));
