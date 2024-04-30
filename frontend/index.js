const form = document.getElementsByTagName("form")[0];

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const resultsDisplayDiv = document.getElementById("display_results");

  const QUERY = document.getElementById("query").value;

  if (QUERY == "") {
    resultsDisplayDiv.insertAdjacentHTML(
      "afterbegin",
      `<p>Please enter a search term</p>`
    );
    return;
  }

  //displays loading spinner
  resultsDisplayDiv.innerHTML = `<svg width="50" height="50" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><style>.spinner_z9k8{transform-origin:center;animation:spinner_StKS .75s infinite linear}@keyframes spinner_StKS{100%{transform:rotate(360deg)}}</style><path d="M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,19a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z" opacity=".25"/><path d="M12,4a8,8,0,0,1,7.89,6.7A1.53,1.53,0,0,0,21.38,12h0a1.5,1.5,0,0,0,1.48-1.75,11,11,0,0,0-21.72,0A1.5,1.5,0,0,0,2.62,12h0a1.53,1.53,0,0,0,1.49-1.3A8,8,0,0,1,12,4Z" class="spinner_z9k8"/></svg>`;

  let response = await fetch(
    `http://localhost:3000/amazon_search_data?keyword=${QUERY}`
  );

  if (!response.ok) {
    //displays error message
    let error = await response.json();

    let html = `
      <div class="error-box">
        <h2>An error has occured!</h2>
        <p>${error.message}</p>
        <p>Please try again.</p>
      </div>
    `;

    resultsDisplayDiv.innerHTML = html;
    return;
  }

  const parsedData = await response.json();
  const data = parsedData.data;

  resultsDisplayDiv.innerHTML = "";

  //loops through data and inserts an item div into the page
  for (let i = 0; i < data.ratings.length; i++) {
    const title = data.titles[i];
    const url = data.urls[i];
    const reviews = data.reviews[i];
    const ratingStr = data.ratings[i].slice(0, 4).replace(",", ".");
    //gets rounded down rating
    let ratingInt = Math.floor(Number(ratingStr));
    //gets difference from rating to the max value;
    let diference = 5 - ratingInt;
    let stars = [];

    //generates yellow stars from product rating
    while (ratingInt) {
      let star = `<span class="material-symbols-outlined marked">
      star_rate
      </span>`;

      stars.push(star);

      ratingInt--;
    }

    //generates gray stars from difference from max rating value
    while (diference) {
      let star = `<span class="material-symbols-outlined unmarked">
      star_rate
      </span>`;

      stars.push(star);

      diference--;
    }

    let html = `
      <div class="search-item">
        <div>
          <img src="${url}" alt="product image">
        </div>
        <div class="info-box">
          <p>${title}</p>
          <div>${stars.toString().replaceAll(",", " ")}</div>
          <span>${reviews}</span>
        <div>
      </div>
    `;

    resultsDisplayDiv.insertAdjacentHTML("beforeend", html);
  }
});
