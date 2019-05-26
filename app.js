const writer = require("./writer");
const getData = require("./requester");

const ghOptions = {};
/**
 * Get GitHub request parameters
 */
function getGhOptions() {
  return ghOptions;
}
/**
 * This function sets the options that will be used to make your GitHub api request
 * @param {string} userAgent - The userAgent used to make the request
 * @param {string} user - The user making the request
 * @param {string} repo - The GitHub repository
 * @param {string} label - The issue label
 * @param {string} state - The state of the issue (open or closed)
 * @param {string} createDate1 - YYYY-MM-DD The lower limit create date ie. issues created after this date. To find issue created on this date, set createDate1 and createDate2 to be equal.
 * @param {string} createDate2 - YYYY-MM-DD The upper limit create date ie. issues created before this date. To find issue created on this date, set createDate1 and createDate2 to be equal.
 * @param {string} closeDate1 - YYYY-MM-DD The lower limit close date ie. issues closed after this date. To find issue closed on this date, set closeDate1 and closeDate2 to be equal.
 * @param {string} closeDate2 - YYYY-MM-DD The upper limit close date ie. issues closed before this date. To find issue closed on this date, set closeDate1 and closeDate2 to be equal.
 */
function setGhOptions(
  userAgent,
  user,
  repo,
  label,
  state,
  createDate1,
  createDate2,
  closeDate1,
  closeDate2
) {
  ghOptions.userAgent = userAgent;
  ghOptions.user = user;
  ghOptions.repo = repo;
  ghOptions.label = label;
  ghOptions.state = state;
  ghOptions.createDate1 = createDate1;
  ghOptions.createDate2 = createDate2;
  ghOptions.closeDate1 = closeDate1;
  ghOptions.closeDate2 = closeDate2;
}

setGhOptions(
  "smbuthia",
  "smbuthia",
  "lunch-ordering-system",
  "active work",
  "closed",
  "2019-01-01",
  "2019-01-01",
  "",
  ""
);
getData(getGhOptions(), writer.writeToIssuesTable);
