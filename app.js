var githubFetcher = require('./github-fetcher');
var dbWriter = require('./db-writer');

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;
const TODAY = new Date();
const LAST_MONDAY = getMonday(addDaysToDate(new Date(), -7));

const unassignedIssuesTable = 'unassigned_issues';
const openIssuesTable = 'open_issues';
const dailyReportedIssuesTable = 'daily_reported_issues';
const dailyClosedIssuesTable = 'daily_closed_issues';
const weeklyReportedIssuesTable = 'weekly_reported_issues';
const weeklyClosedIssuesTable = 'weekly_closed_issues';

githubFetcher
  .getLastReportedDates(dailyReportedIssuesTable, dailyClosedIssuesTable, weeklyReportedIssuesTable, weeklyClosedIssuesTable)
  .then((result1) => {
    githubFetcher
      .getProjectsAndLabels()
      .then((result2) => {
        result2.projects.forEach((project) => {
          githubFetcher
            .getUnassignedIssues(project.name, result2.labels, result2.useProjectLabels)
            .then((resultA) => {
              dbWriter.writeToIssuesTable(unassignedIssuesTable, resultA);
            });

          githubFetcher
            .getOpenIssues(project.name, result2.labels, result2.useProjectLabels)
            .then((resultB) => {
              dbWriter.writeToIssuesTable(openIssuesTable, resultB);
            });
          
          if (Math.round((TODAY - result1.lastDailyReportedUpdateDate) / DAY_IN_MILLISECONDS) >= 2) {
            githubFetcher
              .getDailyReportedIssues(project.name, result2.labels, result2.useProjectLabels, result1.lastDailyReportedUpdateDate)
              .then((resultC) => {
                dbWriter.writeToIssuesTable(dailyReportedIssuesTable, resultC);
              });
          }

          if (Math.round((TODAY - result1.lastDailyClosedUpdateDate) / DAY_IN_MILLISECONDS) >= 2) {
            githubFetcher
              .getDailyClosedIssues(project.name, result2.labels, result2.useProjectLabels, result1.lastDailyClosedUpdateDate)
              .then((resultD) => {
                dbWriter.writeToIssuesTable(dailyClosedIssuesTable, resultD);
              });
          }
          
          if (result1.lastWeeklyReportedUpdateDate <= LAST_MONDAY) {
            githubFetcher
              .getWeeklyReportedIssues(project.name, result2.labels, result2.useProjectLabels, result1.lastWeeklyReportedUpdateDate)
              .then((resultE) => {
                dbWriter.writeToIssuesTable(weeklyReportedIssuesTable, resultE);
              });
          }

          if (result1.lastWeeklyClosedUpdateDate <= LAST_MONDAY) {
            githubFetcher
              .getWeeklyClosedIssues(project.name, result2.labels, result2.useProjectLabels, result1.lastWeeklyClosedUpdateDate)
              .then((resultF) => {
                dbWriter.writeToIssuesTable(weeklyClosedIssuesTable, resultF);
              });
          }
        });
      });
  });


