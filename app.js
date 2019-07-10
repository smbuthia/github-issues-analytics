var githubFetcher = require('./github-fetcher');
var dbWriter = require('./db-writer');

githubFetcher
  .getProjectsAndLabels()
  .then((result) => {
    githubFetcher
      .getUnassignedIssues(result.projects, result.labels, result.useProjectLabels)
      .then((result) => {
        dbWriter.writeToIssuesTable('unassigned_issues', result);
      });

    githubFetcher
      .getOpenIssues(result.projects, result.labels, result.useProjectLabels)
      .then((result) => {
        dbWriter.writeToIssuesTable('open_issues', result);
      });
  });