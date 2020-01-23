const Octokit = require('@octokit/rest');
const dotenv = require('dotenv').config({path: __dirname + '/.env'});
const dbWriter = require('./db-writer');
const misc = require('./miscellaneous');

if (dotenv.error) {
  throw dotenv.error;
}

const ORG = process.env.GH_ORGANIZATION;

const octokit = new Octokit({
  'user-agent': process.env.GH_USER_AGENT,
  'auth': process.env.GH_TOKEN
});

const projectByName = (projects, name) => projects.find(project => project.name === name);

const getOrgProject = name => {
  return octokit.projects.listForOrg({ org: ORG })
    .then(response => projectByName(response.data, name));
};

const getProjectId = () => {
  const PROJECT_NAME = process.env.GH_PROJECT;
  if (!PROJECT_NAME) {
    throw new Error('Specify a project name');
  }
  return getOrgProject(PROJECT_NAME)
    .then(project => {
      return project;
    })
    .then(project => {
      if (!project) {
        throw new Error(`Could not find project with the name ${PROJECT_NAME}`);
      }
      return project.id;
    });
};

const getCardsForColumn = id => {
  const options = octokit.projects.listCards.endpoint.merge({ column_id: id });
  return octokit.paginate(options);
};

const getColumns = projectId => {
  return octokit.projects.listColumns({ project_id: projectId })
    .then(response => Promise.all(response.data.map(column => {
      return getCardsForColumn(column.id)
        .then(cards => [ column.name, cards ]);
    })));
};

const getIssue = (owner, repo, issueNumber) => {
  return octokit.issues.get({ owner: owner, repo: repo, issue_number: issueNumber });
};

const getComments = (owner, repo, issueNumber) => {
  return octokit.issues.listComments({ owner: owner, repo: repo, issue_number: issueNumber });
};

const getHrsToResolution = issue => {
  return issue.hours_to_resolution;
};

const getHrsToFirstResponse = issue => {
  return issue.hours_to_first_response;
};

const getIssueStats = async card => {
  const [owner, repo, , issueNumber] = card.content_url.replace('https://api.github.com/repos/', '').split('/');
  const issue = await getIssue(owner, repo, issueNumber);
  const issueData = issue.data;
  const issueCreatedAt = issueData.created_at;
  const issueClosedAt = issueData.closed_at;
  const issueComments = await getComments(owner, repo, issueNumber);
  let issueComment1CreatedAt = null;
  if(issueComments.data.length > 0) {
    issueComment1CreatedAt = issueComments.data[0].created_at;
  }
  return {
    issue_id: issueData.id, 
    created_at: issueCreatedAt,
    card_created_at: card.created_at,
    closed_at: issueClosedAt,
    issue_first_comment_at: issueComment1CreatedAt,
    hours_to_resolution: misc.getTimeDiffInHrs(issueClosedAt, issueCreatedAt),
    hours_to_first_response: misc.getTimeDiffInHrs(issueComment1CreatedAt, issueCreatedAt)
  };
};

const output = columns => {
  const doneColumn = columns.filter(column => {
    return column[0] == 'Done';
  });
  const allDoneCards = doneColumn[0][1];

  const LAST_MONDAY = misc.getMonday(misc.addDaysToDate(new Date(), -7));
  let startMonday = misc.getMonday(misc.addDaysToDate(new Date(), -(13 * 7)));
  let endMonday = misc.getMonday(misc.addDaysToDate(new Date(), -(12 * 7)));
  let allData = [];

  while (startMonday <= LAST_MONDAY) {
    const startDate = new Date(startMonday.toDateString());
    const endDate = new Date(endMonday.toDateString());

    const doneCards = allDoneCards.filter(card => {
      const createdAt = new Date(card.created_at);
      return createdAt >= startDate && createdAt < endDate;
    });
    
    if (doneCards.length <= 0) {
      console.log('No cards added in the time frame between ' + startMonday + ' and ' + endMonday);
      misc.addDaysToDate(startMonday, 7);
      misc.addDaysToDate(endMonday, 7);
      continue;
    }
    allData.push({week: startDate, cards: doneCards});
    misc.addDaysToDate(startMonday, 7);
    misc.addDaysToDate(endMonday, 7);
  }

  Promise.all(allData.map(async data => {
    const issueStats = await Promise.all(data.cards.map(getIssueStats));
      return {
        week: data.week,
        no_of_issues: issueStats.length,
        avg_hrs_resolution: misc.getAverage(issueStats.map(getHrsToResolution)),
        avg_hrs_first_response: misc.getAverage(issueStats.map(getHrsToFirstResponse))
      };
    })
  )
    .then(allStats => {
      dbWriter.writeToStatsTable('weekly_stats', allStats);
    });
  console.log('The stats are up to date.');
};

Promise.resolve()
  .then(getProjectId)
  .then(getColumns)
  .then(output)
  .catch(console.error);