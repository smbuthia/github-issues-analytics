const requester = require('./requester');
const chalk = require('chalk');
const dotenv = require('dotenv').config();

if (dotenv.error) {
  throw dotenv.error;
}

const ORG = process.env.GH_ORGANIZATION;
const USER = process.env.GH_USER;
const REPO = process.env.GH_REPOSITORY;
const USER_AGENT = process.env.GH_USER_AGENT;

var getMonday = (date) => {
  date = new Date(date);
  let day = date.getDay();
  let diff = date.getDate() - day + (day == 0 ? -6:1); 
  return new Date(date.setDate(diff));
};

var addDaysToDate = (date, days) => {
  date.setDate(date.getDate() + days);
  return new Date(date);
};

const TODAY = new Date();

var formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

var ghOptions = {};
/**
 * Get GitHub request parameters
 */
var getGhOptions = () => {
  return ghOptions;
};
/**
 * This function sets the options that will be used to make your GitHub api request
 * @param {string} userAgent - The userAgent used to make the request
 * @param {string} user - The user making the request
 * @param {string} repo - The GitHub repository
 * @param {Array} label - The issue label/s to filter by
 * @param {string} state - The state of the issue (open or closed)
 * @param {string} createDate1 - YYYY-MM-DD The lower limit create date ie. issues created after this date. To find issue created on this date, set createDate1 and createDate2 to be equal.
 * @param {string} createDate2 - YYYY-MM-DD The upper limit create date ie. issues created before this date. To find issue created on this date, set createDate1 and createDate2 to be equal.
 * @param {string} closeDate1 - YYYY-MM-DD The lower limit close date ie. issues closed after this date. To find issue closed on this date, set closeDate1 and closeDate2 to be equal.
 * @param {string} closeDate2 - YYYY-MM-DD The upper limit close date ie. issues closed before this date. To find issue closed on this date, set closeDate1 and closeDate2 to be equal.
 */
var setGhOptions = (
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
) => {
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
};

module.exports = {
  getProjectsAndLabels: () => {
    return new Promise((resolve, reject) => {
      setGhOptions(USER_AGENT, 'repos/' + ORG + '/' + REPO + '/labels');

      requester.getData(getGhOptions(), true)
        .then((result) => {
          
          let ghDetails = {};
        
          ghDetails.projects = result.filter((res) => {
            return res.name.toLowerCase().includes('project');
          });
    
          if (ghDetails.projects.length === 0) {
            ghDetails.projects = [{name: REPO}];
            ghDetails.useProjectLabels = false;
          } else {
            ghDetails.useProjectLabels = true;
          }
    
          ghDetails.labels = result.filter((res) => {
            return !res.name.toLowerCase().includes('project:');
          });

          resolve(ghDetails);
        })
        .catch((err) => {
          console.log(chalk.red.bold('Oops! Something went wrong.'));
          console.log(err);
          reject(err);
          throw err;
        })
        .finally(() => {});
    });
  },
  getOpenIssues: (projectName, labels, useProjectLabel) => {
    return new Promise((resolve, reject) => {
      try {
        let openIssuesDataRows = [];
        let processedLabels = 0;

        labels.forEach((label) => {
          const labelName = label.name;
          let labelNameArr = [];

          if (useProjectLabel) {
            labelNameArr = [projectName, labelName];
          } else {
            labelNameArr = [labelName];
          }
          
          setGhOptions(USER_AGENT, '', USER, REPO, labelNameArr, 'open');
          requester.getData(getGhOptions(), false)
            .then((result) => {
              if (!isNaN(result.total_count)) {
                openIssuesDataRows.push({
                  reported: TODAY,
                  repo: REPO,
                  project: projectName,
                  label: labelName,
                  issue_count: result.total_count
                });
                processedLabels++;
                if (processedLabels === labels.length) {
                  resolve(openIssuesDataRows);
                }
              } else {
                console.log(result);
              }
            })
            .catch((err) => {
              throw err;
            })
            .finally(() => {});
        });
      } catch (err) {
        reject(err);
      }
    });
  },
  getUnassignedIssues: (projectName, labels, useProjectLabel) => {
    return new Promise((resolve, reject) => {
      try {
        let unassignedIssuesDataRows = [];
        let processedLabels = 0;

        labels.forEach((label) => {
          const labelName = label.name;
          let labelNameArr = [];

          if (useProjectLabel) {
            labelNameArr = [projectName, labelName];
          } else {
            labelNameArr = [labelName];
          }

          setGhOptions(
            USER,
            '',
            ORG,
            REPO,
            labelNameArr,
            'open',
            '',
            '',
            '',
            '',
            'assignee'
          );
          requester.getData(getGhOptions(), false)
            .then((result) => {
              if (!isNaN(result.total_count)) {
                unassignedIssuesDataRows.push({
                  reported: TODAY,
                  repo: REPO,
                  project: projectName,
                  label: labelName,
                  issue_count: result.total_count
                });
                processedLabels++;
                if (processedLabels === labels.length) {
                  resolve(unassignedIssuesDataRows);
                }
              } else {
                console.log(result);
              }
            })
            .catch((err) => {
              throw err;
            })
            .finally(() => {});
        });
      } catch (err) {
        reject(err);
      }
    });
  },
  getDailyReportedIssues: (projectName, labels, useProjectLabel, lastUpdateDate) => {
    return new Promise((resolve, reject) => {
      try {
        let dailyReportedIssuesDataRows = [];
        let processedLabels = 0;
  
        labels.forEach((label) => {
          const labelName = label.name;
          let labelNameArr = [];

          if (useProjectLabel) {
            labelNameArr = [projectName, labelName];
          } else {
            labelNameArr = [labelName];
          }

          let drWorkingDate = addDaysToDate(lastUpdateDate, 1);
          let createDate = formatDate(drWorkingDate);
          setGhOptions(
            USER,
            '',
            ORG,
            REPO,
            labelNameArr,
            '',
            createDate,
            createDate
          );
          
          requester.getData(getGhOptions(), false)
            .then((result) => {
              if (!isNaN(result.total_count)) {
                dailyReportedIssuesDataRows.push({
                  reported: drWorkingDate,
                  repo: REPO,
                  project: projectName,
                  label: labelName,
                  issue_count: result.total_count
                });
                if (processedLabels === labels.length) {
                  resolve(dailyReportedIssuesDataRows);
                }
              } else {
                console.log(result);
              }
            })
            .catch((err) => {
              throw err;
            })
            .finally(() => {});
        });
      } catch (err) {
        reject(err);
      }
    });
  },
  getDailyClosedIssues: (projectName, labels, useProjectLabel, lastUpdateDate) => {
    return new Promise((resolve, reject) => {
      try {
        let dailyClosedIssuesDataRows = [];
        let processedLabels = 0;

        labels.forEach((label) => {
          const labelName = label.name;
          let labelNameArr = [];

          if (useProjectLabel) {
            labelNameArr = [projectName, labelName];
          } else {
            labelNameArr = [labelName];
          }

          let dcWorkingDate = addDaysToDate(lastUpdateDate, 1);
          let closeDate = formatDate(dcWorkingDate);

          setGhOptions(
            USER,
            '',
            ORG,
            REPO,
            labelNameArr,
            'closed',
            '',
            '',
            closeDate,
            closeDate
          );
          requester.getData(getGhOptions(), false)
            .then((result) => {
              if (!isNaN(result.total_count)) {
                dailyClosedIssuesDataRows.push({
                  reported: dcWorkingDate,
                  repo: REPO,
                  project: projectName,
                  label: labelName,
                  issue_count: result.total_count
                });
                processedLabels++;
                if (processedLabels === labels.length) {
                  resolve(dailyClosedIssuesDataRows);
                }
              } else {
                console.log(result);
              }
            })
            .catch((err) => {
              throw err;
            })
            .finally(() => {});
        });
      } catch (err) {
        reject(err);
      }
    });
  },
  getWeeklyReportedIssues: (projectName, labels, useProjectLabel, lastUpdateDate) => {
    return new Promise((reject, resolve) => {
      try {
        let weeklyReportedIssuesDataRows = [];
        let processedLabels = 0;
  
        labels.forEach((label) => {
          const labelName = label.name;
          let labelNameArr = [];

          if (useProjectLabel) {
            labelNameArr = [projectName, labelName];
          } else {
            labelNameArr = [labelName];
          }

          let wrWorkingMonday = getMonday(lastUpdateDate);
          let wrWorkingDate = addDaysToDate(wrWorkingMonday, 7);
          let createDate1 = formatDate(wrWorkingDate);
          let createDate2 = formatDate(addDaysToDate(wrWorkingDate, 7));
  
          setGhOptions(
            USER,
            '',
            ORG,
            REPO,
            labelNameArr,
            '',
            createDate1,
            createDate2
          );
  
          requester.getData(getGhOptions(), false)
            .then((result) => {
              if (!isNaN(result.total_count)) {
                weeklyReportedIssuesDataRows.push({
                  reported: wrWorkingDate,
                  repo: REPO,
                  project: projectName,
                  label: labelName,
                  issue_count: result.total_count
                });
                processedLabels++;
                if (processedLabels === labels.length) {
                  resolve(weeklyReportedIssuesDataRows);
                }
              } else {
                console.log(result);
              }
            })
            .catch((err) => {
              throw err;
            })
            .finally(() => {});
        });
      } catch (err) {
        reject(err);
      }
    });
  },
  getWeeklyClosedIssues: (projectName, labels, useProjectLabel, lastUpdateDate) => {
    return new Promise((resolve, reject) => {
      try {
        let weeklyClosedIssuesDataRows = [];
        let processedLabels = 0;
  
        labels.forEach((label) => {
          const labelName = label.name;
          let labelNameArr = [];

          if (useProjectLabel) {
            labelNameArr = [projectName, labelName];
          } else {
            labelNameArr = [labelName];
          }

          let wcWorkingMonday = getMonday(lastUpdateDate);
          let wcWorkingDate = addDaysToDate(wcWorkingMonday, 7);
          let createDate1 = formatDate(wcWorkingDate);
          let createDate2 = formatDate(addDaysToDate(wcWorkingDate, 7));

          setGhOptions(
            USER,
            '',
            ORG,
            REPO,
            labelNameArr,
            '',
            createDate1,
            createDate2
          );
          requester.getData(getGhOptions(), false)
            .then((result) => {
              if (!isNaN(result.total_count)) {
                weeklyClosedIssuesDataRows.push({
                  reported: wcWorkingDate,
                  repo: REPO,
                  project: projectName,
                  label: labelName,
                  issue_count: result.total_count
                });
                processedLabels++;
                if (processedLabels === labels.length) {
                  resolve(weeklyClosedIssuesDataRows);
                }
              } else {
                console.log(result);
              }
            })
            .catch((err) => {
              throw err;
            })
            .finally(() => {});
        });
      } catch (err) {
        reject(err);
      }
    });
  }
};