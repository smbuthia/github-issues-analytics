const request = require("request"),
  chalk = require("chalk");

const GITHUB_API_URL = "https://api.github.com/";
const GITHUB_ISSUES_QUERY_URL = GITHUB_API_URL + "search/issues?q=";

const options = {};
//const response = null;

function getOptions() {
  return options;
}

function isValidDateString(dateString) {
  return (
    dateString.match(/^\d{4}-\d{2}-\d{2}$/) &&
    !isNaN(new Date(dateString).getTime())
  );
}

function setOptions(ghOptions) {
  let searchString = "repo:" + ghOptions.user + "/" + ghOptions.repo;

  if (ghOptions.label && ghOptions.label !== "" && ghOptions !== "all") {
    searchString += "+label:" + ghOptions.label;
  }

  if (
    ghOptions.state &&
    (ghOptions.state === "open" || ghOptions.state === "closed")
  ) {
    searchString += "+state:" + ghOptions.state;
  }

  if (
    ghOptions.createDate1 &&
    ghOptions.createDate2 &&
    isValidDateString(ghOptions.createDate1) &&
    isValidDateString(ghOptions.createDate2) &&
    ghOptions.createDate1 === ghOptions.createDate2
  ) {
    searchString += "+created:" + ghOptions.createDate1;
  } else {
    if (ghOptions.createDate1 && isValidDateString(ghOptions.createDate1)) {
      searchString += "+created:>" + ghOptions.createDate1;
    }
    if (ghOptions.createDate2 && isValidDateString(ghOptions.createDate2)) {
      searchString += "+created:<" + ghOptions.createDate2;
    }
  }

  if (
    ghOptions.closeDate1 &&
    ghOptions.closeDate2 &&
    isValidDateString(ghOptions.closeDate1) &&
    isValidDateString(ghOptions.closeDate2) &&
    ghOptions.closeDate1 === ghOptions.closeDate2
  ) {
    searchString += "+closed:" + ghOptions.closeDate1;
  } else {
    if (ghOptions.closeDate1 && isValidDateString(ghOptions.closeDate1)) {
      searchString += "+closed:>" + ghOptions.closeDate1;
    }
    if (ghOptions.closeDate2 && isValidDateString(ghOptions.closeDate2)) {
      searchString += "+closed:>" + ghOptions.closeDate2;
    }
  }

  const url = encodeURI(GITHUB_ISSUES_QUERY_URL + searchString);

  options.url = url;
  options.headers = {
    "User-Agent": ghOptions.userAgent
  };
}

function callback(error, response, body) {
  if (!error && response.statusCode == 200) {
    var info = JSON.parse(body);
  } else if (error) {
    console.log(
      chalk.red.bold.inverse("Error code: ") +
        chalk.red.bold(response.statusCode)
    );
    console.log(chalk.red(error));
  }
}

function getData(ghOptions, writer) {
  setOptions(ghOptions);

  const req = request(getOptions(), callback);

  let body = "";

  req.on("data", chunk => {
    body += chunk;
  });

  req.on("end", () => {
    try {
      var tableName = ghOptions.state + "_issues";
      var data = JSON.parse(body);
      writer(tableName, data, ghOptions.label);
      return data;
    } catch (error) {
      console.log(chalk.red.bold("Oops! Something went wrong."));
      console.log(error);
      return 0;
    }
  });
}

module.exports = getData;
