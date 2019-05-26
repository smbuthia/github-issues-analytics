const writer = require('./writer');
const getData = require('./requester');

const USER = 'smbuthia';
const REPO = 'lunch-ordering-system';

var ghOptions = {};
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
  urlParams,
  user,
  repo,
  label,
  state,
  createDate1,
  createDate2,
  closeDate1,
  closeDate2,
  missing
) {
  ghOptions.userAgent = userAgent;
  ghOptions.urlParams = urlParams;
  ghOptions.user = user;
  ghOptions.repo = repo;
  ghOptions.label = label;
  ghOptions.state = state;
  ghOptions.createDate1 = createDate1;
  ghOptions.createDate2 = createDate2;
  ghOptions.closeDate1 = closeDate1;
  ghOptions.closeDate2 = closeDate2;
  ghOptions.missing = missing;
}

// Get all labels
setGhOptions('smbuthia', 'repos/smbuthia/lunch-ordering-system/labels');
getData(getGhOptions(), true)
  .then(function (result) {
    // Run through all labels getting:
    for (let i = 0; i < result.length; i++) {
      console.log(result[i].name);
      // 1. Total issues currently open
      setGhOptions('smbuthia', '', USER, REPO, result[i].name, 'open');
      getData(getGhOptions(), false)
        .then(function (result) {
          writer.writeToIssuesTable('open_issues', result, result.total_count);
        });

      // 2. Total issues currently unassigned
      setGhOptions('smbuthia', '', USER, REPO, result[i].name, 'open', '', '', '', '', 'assignee');
      getData(getGhOptions(), false)
        .then(function (result) {
          writer.writeToIssuesTable('unassigned_issues', result, result.total_count);
        });

      // 3. Total issues reported daily - since start day to last full day


      // 4. Total issues closed daily - since start day to last full day


      // 5. Total issues reported weekly - since start week to last full week


      // 6. Total issues closed weekly - since start week to last full week


    }
});

/*
setGhOptions(
  userAgent = 'smbuthia',
  user = 'smbuthia',
  repo = 'lunch-ordering-system',
  label = 'active work',
  state = 'closed',
  createDate1 = '2019-01-01',
  createDate2 = '2019-01-01'
);
getData(getGhOptions(), false);*/
