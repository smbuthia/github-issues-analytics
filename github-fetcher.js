const getData = require('./requester');
const chalk = require('chalk');
const dotenv = require('dotenv').config();

if (dotenv.error) {
  throw dotenv.error;
}

const ORG = process.env.GH_ORGANIZATION;
const USER = process.env.GH_USER;
const REPO = process.env.GH_REPOSITORY;
const USER_AGENT = process.env.GH_USER_AGENT;

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;
const TODAY = new Date();
const LAST_MONDAY = getMonday(addDaysToDate(new Date(), -7));
// TODO: Set the start date to be the date of last update fetched from the last_updated table
const START_DATE = new Date('2019-05-27');

var addDaysToDate = (date, days) => {
  date.setDate(date.getDate() + days);
  return new Date(date);
};

var getMonday = (date) => {
  date = new Date(date);
  let day = date.getDay();
  let diff = date.getDate() - day + (day == 0 ? -6:1); 
  return new Date(date.setDate(diff));
};

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

module.exports = {
  getProjectsAndLabels: () => {
    return new Promise((resolve, reject) => {
      setGhOptions(USER_AGENT, 'repos/' + ORG + '/' + REPO + '/labels');

      getData(getGhOptions(), true)
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
  getOpenIssues: (projects, labels, useProjectLabel) => {
    return new Promise((resolve, reject) => {
      try {
        let openIssuesDataRows = [];

        for (const project of projects) {
          let projectName = project.name;

          for (const label of labels) {
            let labelName = label.name;
            let labelNameArr = [];

            if (useProjectLabel) {
              labelNameArr = [projectName, labelName];
            } else {
              labelNameArr = [labelName];
            }
            
            setGhOptions(USER_AGENT, '', USER, REPO, labelNameArr, 'open');
            getData(getGhOptions(), false)
              .then((result) => {
                if (!isNaN(result.total_count)) {
                  openIssuesDataRows.push({
                    reported: TODAY,
                    repo: REPO,
                    project: projectName,
                    label: labelName,
                    issue_count: result.total_count
                  });
                  if (label === labels[labels.length - 1]) {
                    resolve(openIssuesDataRows);
                  }
                } else {
                  console.log(result);
                }
              })
              .catch((err) => {
                console.log(err);
                throw err;
              })
              .finally(() => {});
          }
        }
      } catch (err) {
        reject(err);
      }
    });
  },
  getUnassignedIssues: (projects, labels, useProjectLabel) => {
    return new Promise((resolve, reject) => {
      try {
        let unassignedIssuesDataRows = [];

        for (const project of projects) {
          let projectName = project.name;

          for (const label of labels) {
            let labelName = label.name;
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

            getData(getGhOptions(), false)
              .then((result) => {
                if (!isNaN(result.total_count)) {
                  unassignedIssuesDataRows.push({
                    reported: TODAY,
                    repo: REPO,
                    project: projectName,
                    label: labelName,
                    issue_count: result.total_count
                  });
                  if (label === labels[labels.length - 1]) {
                    resolve(unassignedIssuesDataRows);
                  }
                } else {
                  console.log(result);
                }
              })
              .catch((err) => {
                console.log(err);
                throw err;
              })
              .finally(() => {});
          }
        }
      } catch (err) {
        reject(err);
      }
    });
  },
  getDailyReportedIssues: (projects, labels, useProjectLabel) => {
    return new Promise((resolve, reject) => {
      try {
        let dailyReportedIssuesDataRows = [];
  
        for (const project of projects) {
          let projectName = project.name;
  
          for (const label of labels) {
            let labelName = label.name;
            let labelNameArr = [];
  
            if (useProjectLabel) {
              labelNameArr = [projectName, labelName];
            } else {
              labelNameArr = [labelName];
            }
  
            let drWorkingDate = new Date(START_DATE);
  
            while (Math.round((TODAY - drWorkingDate) / DAY_IN_MILLISECONDS) >= 2) {
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
              
              getData(getGhOptions(), false)
                .then((result) => {
                  if (!isNaN(result.total_count)) {
                    dailyReportedIssuesDataRows.push({
                      reported: drWorkingDate,
                      repo: REPO,
                      project: projectName,
                      label: labelName,
                      issue_count: result.total_count
                    });
                    if (label === labels[labels.length - 1]) {
                      resolve(dailyReportedIssuesDataRows);
                    }
                  } else {
                    console.log(result);
                  }
                })
                .catch(err => {
                  console.log(err);
                  throw err;
                })
                .finally(() => {});
  
              drWorkingDate = addDaysToDate(drWorkingDate, 1);
            }
          }
        }
      } catch (err) {
        reject(err);
      }
    });
  },
  getDailyClosedIssues: (projects, labels, useProjectLabel) => {
    return new Promise((resolve, reject) => {
      try {
        let dailyClosedIssuesDataRows = [];
  
        for (const project of projects) {
          let projectName = project.name;
  
          for (const label of labels) {
            let labelName = label.name;
            let labelNameArr = [];
  
            if (useProjectLabel) {
              labelNameArr = [projectName, labelName];
            } else {
              labelNameArr = [labelName];
            }
  
            let dcWorkingDate = new Date(START_DATE);
  
            while (Math.round((TODAY - dcWorkingDate) / DAY_IN_MILLISECONDS) >= 2) {
              let closeDate = formatDate(dcWorkingDate);
              console.log(
                'Debug: ' + Math.round((TODAY - dcWorkingDate) / DAY_IN_MILLISECONDS)
              );
              console.log('closeDate (' + labelName + '): ' + closeDate);
  
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
  
              getData(getGhOptions(), false)
                .then((result) => {
                  if (!isNaN(result.total_count)) {
                    dailyClosedIssuesDataRows.push({
                      reported: dcWorkingDate,
                      repo: REPO,
                      project: projectName,
                      label: labelName,
                      issue_count: result.total_count
                    });
                    if (label === labels[labels.length - 1]) {
                      resolve(dailyClosedIssuesDataRows);
                    }
                  } else {
                    console.log(result);
                  }
                })
                .catch((err) => {
                  console.log(err);
                  throw err;
                })
                .finally(() => {});
  
              dcWorkingDate = addDaysToDate(dcWorkingDate, 1);
            }
          }
        }
      } catch (err) {
        reject(err);
      }
    });
  },
  getWeeklyReportedIssues: (projects, labels, useProjectLabel) => {
    return new Promise((reject, resolve) => {
      try {
        let weeklyReportedIssuesDataRows = [];
  
        for (const project of projects) {
          let projectName = project.name;
  
          for (const label of labels) {
            let labelName = label.name;
            let labelNameArr = [];
  
            if (useProjectLabel) {
              labelNameArr = [projectName, labelName];
            } else {
              labelNameArr = [labelName];
            }
  
            let wrWorkingDate = new Date(START_DATE);
  
            let wrWorkingMonday = getMonday(wrWorkingDate);
  
            while (wrWorkingMonday <= LAST_MONDAY) {
              let createDate1 = formatDate(wrWorkingMonday);
              let createDate2 = formatDate(addDaysToDate(wrWorkingMonday, 7));
      
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
      
              getData(getGhOptions(), false)
                .then((result) => {
                  if (!isNaN(result.total_count)) {
                    weeklyReportedIssuesDataRows.push({
                      reported: wrWorkingMonday,
                      repo: REPO,
                      project: projectName,
                      label: labelName,
                      issue_count: result.total_count
                    });
                    if (label === labels[labels.length - 1]) {
                      resolve(weeklyReportedIssuesDataRows);
                    }
                  } else {
                    console.log(result);
                  }
                })
                .catch((err) => {
                  console.log(err);
                  throw err;
                })
                .finally(() => {});
              wrWorkingMonday = addDaysToDate(wrWorkingMonday, 7);
            }
          }
        }
      } catch (err) {
        reject(err);
      }
    });
  },
  getWeeklyClosedIssues: (projects, labels, useProjectLabel) => {
    return new Promise((resolve, reject) => {
      try {
        let weeklyClosedIssuesDataRows = [];
  
        for (const project of projects) {
          let projectName = project.name;
  
          for (const label of labels) {
            let labelName = label.name;
            let labelNameArr = [];
  
            if (useProjectLabel) {
              labelNameArr = [projectName, labelName];
            } else {
              labelNameArr = [labelName];
            }
  
            let wcWorkingDate = new Date(START_DATE);
            let wcWorkingMonday = getMonday(wcWorkingDate);
  
            while (wcWorkingMonday <= LAST_MONDAY) {
              let createDate1 = formatDate(wcWorkingMonday);
              let createDate2 = formatDate(addDaysToDate(wcWorkingMonday, 7));
  
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
  
              getData(getGhOptions(), false)
                .then((result) => {
                  if (!isNaN(result.total_count)) {
                    weeklyClosedIssuesDataRows.push({
                      reported: wcWorkingMonday,
                      repo: REPO,
                      project: projectName,
                      label: labelName,
                      issue_count: result.total_count
                    });
                    if (label === labels[labels.length - 1]) {
                      resolve(weeklyClosedIssuesDataRows);
                    }
                  } else {
                    console.log(result);
                  }
                })
                .catch((err) => {
                  console.log(err);
                  throw err;
                })
                .finally(() => {});
  
              wcWorkingMonday = addDaysToDate(wcWorkingMonday, 7);
            }
          }
        }
      } catch (err) {
        reject(err);
      }
    });
  }
};