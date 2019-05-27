const writer = require('./writer');
const getData = require('./requester');
const dotenv = require('dotenv').config();

if (dotenv.error) {
  throw dotenv.error
}

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const ORG = process.env.ORGANIZATION;
const USER = process.env.USER;
const REPO = process.env.REPOSITORY;

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;
const TODAY = new Date();
const LAST_MONDAY = getMonday(addDaysToDate(new Date(), -7));
// TODO: Set the start date to be the date of last update fetched from the last_updated table
const START_DATE = new Date();

function addDaysToDate(date, days) {
  date.setDate(date.getDate() + days);
  return new Date(date);
}

function getMonday(date) {
  date = new Date(date);
  let day = date.getDay();
  let diff = date.getDate() - day + (day == 0 ? -6:1); 
  return new Date(d.setDate(diff));
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}


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
setGhOptions('smbuthia', 'repos/' + ORG + '/' + REPO + '/labels');

getData(getGhOptions(), true)
  .then(function(result) {
    // Run through all labels getting:
    let openIssuesDataRows = [];
    let unassignedIssuesDataRows = [];
    let dailyReportedIssuesDataRows = [];
    let dailyClosedIssuesDataRows = [];
    let weeklyReportedIssuesDataRows = [];
    let weeklyClosedIssuesDataRows = [];

    let projects = result.filter(function(res) {
      return res.name.toLowerCase().includes('project');
    });

    if (projects.length === 0) {
      projects = [REPO];
    }

    let labels = result.filter(function(res) {
      return !res.name.toLowerCase().includes('project');
    });

    for (const project of projects) {
      for (const label of labels) {
        // 1. Total issues currently open
        setGhOptions('smbuthia', '', USER, REPO, label, 'open');
        getData(getGhOptions(), false)
          .then(function(result) {
            if (!isNaN(result.total_count)) {
              openIssuesDataRows.push({
                reported: START_DATE,
                repo: REPO,
                project: project,
                label: label,
                issue_count: result.total_count
              });
            } else {
              console.log(result);
            }
          })
          .catch(err => {
            console.log(err);
            throw err;
          })
          .finally(() => {});

        // 2. Total issues currently unassigned
        setGhOptions(
          USER,
          '',
          ORG,
          REPO,
          label,
          'open',
          '',
          '',
          '',
          '',
          'assignee'
        );
        getData(getGhOptions(), false)
          .then(function(result) {
            if (!isNaN(result.total_count)) {
              unassignedIssuesDataRows.push({
                reported: START_DATE,
                repo: REPO,
                project: project,
                label: label,
                issue_count: result.total_count
              });
            } else {
              console.log(result);
            }
          })
          .catch(err => {
            console.log(err);
            throw err;
          })
          .finally(() => {});

        // 3. Total issues reported daily - since start day to last full day
        let drWorkingDate = START_DATE;
        
        if (START_DATE !== addDaysToDate(TODAY, -1)) {
          while (Math.round((TODAY - drWorkingDate)/DAY_IN_MILLISECONDS) >= 2) {
            let createDate = formatDate(drWorkingDate);
  
            setGhOptions(USER, '', ORG, REPO, label, '', createDate, createDate);
  
            getData(getGhOptions(), false)
            .then(function(result) {
              if (!isNaN(result.total_count)) {
                dailyReportedIssuesDataRows.push({
                  reported: drWorkingDate,
                  repo: REPO,
                  project: project,
                  label: label,
                  issue_count: result.total_count
                });
              } else {
                console.log(result);
              }
              drWorkingDate = addDaysToDate(drWorkingDate, 1);
            })
            .catch(err => {
              console.log(err);
              throw err;
            })
            .finally(() => {});
          }
        }

        // 4. Total issues closed daily - since start day to last full day
        let dcWorkingDate = START_DATE;

        if (START_DATE !== addDaysToDate(TODAY, -1)) {
          while (Math.round((TODAY - dcWorkingDate)/DAY_IN_MILLISECONDS) >= 1) {
            let closeDate = formatDate(dcWorkingDate);
  
            setGhOptions(USER, '', ORG, REPO, label, 'closed', '', '', closeDate, closeDate);
  
            getData(getGhOptions(), false)
            .then(function(result) {
              if (!isNaN(result.total_count)) {
                dailyClosedIssuesDataRows.push({
                  reported: dcWorkingDate,
                  repo: REPO,
                  project: project,
                  label: label,
                  issue_count: result.total_count
                });
              } else {
                console.log(result);
              }
              dcWorkingDate = addDaysToDate(dcWorkingDate, 1)
            })
            .catch(err => {
              console.log(err);
              throw err;
            })
            .finally(() => {});
          }
        }

        // 5. Total issues reported weekly - since start week to last full week
        let wrWorkingDate = START_DATE;

        if (getMonday(START_DATE) !== LAST_MONDAY) {
          let wrWorkingMonday = getMonday(wrWorkingDate);

          while (wrWorkingMonday <= LAST_MONDAY) {
            let createDate1 = formatDate(wrWorkingMonday);
            let createDate2 = formatDate(addDaysToDate(wrWorkingMonday, 7));

            setGhOptions(USER, '', ORG, REPO, label, '', createDate1, createDate2);

            getData(getGhOptions(), false)
            .then(function(result) {
              if (!isNaN(result.total_count)) {
                weeklyReportedIssuesDataRows.push({
                  reported: wrWorkingMonday,
                  repo: REPO,
                  project: project,
                  label: label,
                  issue_count: result.total_count
                });
              } else {
                console.log(result);
              }
              wrWorkingMonday = addDaysToDate(wrWorkingMonday, 7);
            })
            .catch(err => {
              console.log(err);
              throw err;
            })
            .finally(() => {});
          } 
        }

        // 6. Total issues closed weekly - since start week to last full week
        let wcWorkingDate = START_DATE;
        
        if (getMonday(START_DATE) !== LAST_MONDAY) {
          let wcWorkingMonday = getMonday(wcWorkingDate);

          while (wcWorkingMonday <= LAST_MONDAY) {
            let createDate1 = formatDate(wcWorkingMonday);
            let createDate2 = formatDate(addDaysToDate(wcWorkingMonday, 7));

            setGhOptions(USER, '', ORG, REPO, label, '', createDate1, createDate2);

            getData(getGhOptions(), false)
            .then(function(result) {
              if (!isNaN(result.total_count)) {
                weeklyClosedIssuesDataRows.push({
                  reported: wcWorkingMonday,
                  repo: REPO,
                  project: project,
                  label: label,
                  issue_count: result.total_count
                });
              } else {
                console.log(result);
              }
              wcWorkingMonday = addDaysToDate(wcWorkingMonday, 7);
            })
            .catch(err => {
              console.log(err);
              throw err;
            })
            .finally(() => {});
          } 
        }
      }
    }
    // TODO: Update the last_updated table with value of last update
    writer.writeToIssuesTable('open_issues', openIssuesDataRows);
    writer.writeToIssuesTable('unassigned_issues', unassignedIssuesDataRows);
    writer.writeToIssuesTable('daily_reported_issues', dailyReportedIssuesDataRows);
    writer.writeToIssuesTable('daily_closed_issues', dailyClosedIssuesDataRows);
    writer.writeToIssuesTable('weekly_reported_issues', weeklyReportedIssuesDataRows);
    writer.writeToIssuesTable('weekly_closed_issues', weeklyClosedIssuesDataRows);
  })
  .catch(err => {
    console.log(err);
    throw err;
  })
  .finally(() => {});