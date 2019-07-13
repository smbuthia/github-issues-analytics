var githubFetcher = require('./github-fetcher');
var dbWriter = require('./db-writer');

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;
const TODAY = new Date();
const LAST_MONDAY = getMonday(addDaysToDate(new Date(), -7));
// TODO: Set the start date to be the date of last update fetched from the last_updated table
var lastDailyReportedUpdateDate = new Date();
var lastDailyClosedUpdateDate = new Date();
var lastWeeklyReportedUpdateDate = new Date();
var lastWeeklyClosedUpdateDate = new Date();

githubFetcher
  .getProjectsAndLabels()
  .then((result) => {
    result.projects.forEach((project) => {
      githubFetcher
        .getUnassignedIssues(project.name, result.labels, result.useProjectLabels)
        .then((result) => {
          dbWriter.writeToIssuesTable('unassigned_issues', result);
        });

      githubFetcher
        .getOpenIssues(project.name, result.labels, result.useProjectLabels)
        .then((result) => {
          dbWriter.writeToIssuesTable('open_issues', result);
        });
      
      if (Math.round((TODAY - lastDailyReportedUpdateDate) / DAY_IN_MILLISECONDS) >= 2) {
        githubFetcher
          .getDailyReportedIssues(project.name, result.labels, result.useProjectLabels, lastDailyReportedUpdateDate)
          .then((result) => {
            dbWriter.writeToIssuesTable('daily_reported_issues', result);
          });
      }

      if (Math.round((TODAY - lastDailyClosedUpdateDate) / DAY_IN_MILLISECONDS) >= 2) {
        githubFetcher
          .getDailyClosedIssues(project.name, result.labels, result.useProjectLabels, lastDailyClosedUpdateDate)
          .then((result) => {
            dbWriter.writeToIssuesTable('daily_closed_issues', result);
          });
      }
      
      if (lastWeeklyReportedUpdateDate <= LAST_MONDAY) {
        githubFetcher
          .getWeeklyReportedIssues(project.name, result.labels, result.useProjectLabels, lastWeeklyReportedUpdateDate)
          .then((result) => {
            dbWriter.writeToIssuesTable('weekly_reported_issues', result);
          });
      }

      if (lastWeeklyClosedUpdateDate <= LAST_MONDAY) {
        githubFetcher
          .getWeeklyClosedIssues(project.name, result.labels, result.useProjectLabels, lastWeeklyClosedUpdateDate)
          .then((result) => {
            dbWriter.writeToIssuesTable('weekly_closed_issues', result);
          });
      }
    });
  });