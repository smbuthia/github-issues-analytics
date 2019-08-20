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
  .then((lastReported) => {
    return lastReported;
  })
  .then(() => {

  })


githubFetcher
  .getLastReportedDates(dailyReportedIssuesTable, dailyClosedIssuesTable, weeklyReportedIssuesTable, weeklyClosedIssuesTable)
  .then((lastReported) => {
    githubFetcher
      .getProjectsAndLabels()
      .then((projectsAndLabels) => {
        projectsAndLabels.projects.forEach((project) => {
          githubFetcher
            .getUnassignedIssues(project.name, projectsAndLabels.labels, projectsAndLabels.useProjectLabels)
            .then((unassignedIssues) => {
              dbWriter.writeToIssuesTable(unassignedIssuesTable, unassignedIssues);
            });

          githubFetcher
            .getOpenIssues(project.name, projectsAndLabels.labels, projectsAndLabels.useProjectLabels)
            .then((openIssues) => {
              dbWriter.writeToIssuesTable(openIssuesTable, openIssues);
            });
          
          if (Math.round((TODAY - lastReported.lastDailyReportedUpdateDate) / DAY_IN_MILLISECONDS) >= 2) {
            githubFetcher
              .getDailyReportedIssues(project.name, projectsAndLabels.labels, projectsAndLabels.useProjectLabels, lastReported.lastDailyReportedUpdateDate)
              .then((dailyReportedIssues) => {
                dbWriter.writeToIssuesTable(dailyReportedIssuesTable, dailyReportedIssues);
              });
          }

          if (Math.round((TODAY - lastReported.lastDailyClosedUpdateDate) / DAY_IN_MILLISECONDS) >= 2) {
            githubFetcher
              .getDailyClosedIssues(project.name, projectsAndLabels.labels, projectsAndLabels.useProjectLabels, lastReported.lastDailyClosedUpdateDate)
              .then((resultD) => {
                dbWriter.writeToIssuesTable(dailyClosedIssuesTable, resultD);
              });
          }
          
          if (lastReported.lastWeeklyReportedUpdateDate <= LAST_MONDAY) {
            githubFetcher
              .getWeeklyReportedIssues(project.name, projectsAndLabels.labels, projectsAndLabels.useProjectLabels, lastReported.lastWeeklyReportedUpdateDate)
              .then((weeklyReportedIssues) => {
                dbWriter.writeToIssuesTable(weeklyReportedIssuesTable, weeklyReportedIssues);
              });
          }

          if (lastReported.lastWeeklyClosedUpdateDate <= LAST_MONDAY) {
            githubFetcher
              .getWeeklyClosedIssues(project.name, projectsAndLabels.labels, projectsAndLabels.useProjectLabels, lastReported.lastWeeklyClosedUpdateDate)
              .then((weeklyClosedIssues) => {
                dbWriter.writeToIssuesTable(weeklyClosedIssuesTable, weeklyClosedIssues);
              });
          }
        });
      });
  });


