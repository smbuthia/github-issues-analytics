const Octokit = require('@octokit/rest');
const dotenv = require('dotenv').config();
const dbReader = require('./db-reader');

if (dotenv.error) {
  throw dotenv.error;
}

const getMonday = (date) => {
  date = new Date(date);
  const day = date.getDay();
  const diff = date.getDate() - day + (day == 0 ? -6:1); 
  return new Date(date.setDate(diff));
};

const addDaysToDate = (date, days) => {
  date.setDate(date.getDate() + days);
  return new Date(date);
};

const TODAY = new Date();
const LAST_MONDAY = getMonday(addDaysToDate(new Date(), -7));
const TWO_MONDAYS_BACK = getMonday(addDaysToDate(new Date(), -14));

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

const getTimeDiffInHrs = (date1, date2) => {
  if(!date1 || !date2){
    return null;
  }
  return round((new Date(date1) - new Date(date2)) / (1000 * 60 * 60), 0);
};

const hrsToDys = timeInHrs => {
  return round(timeInHrs / 24, 0);
};

const round = (value, precision) => {
  const multiplier = Math.pow(10, precision || 0);
  return Math.round(value * multiplier)/multiplier;
};

const getHrsToResolution = (issue) => {
  return issue.hours_to_resolution;
};

const getHrsToFirstResponse = (issue) => {
  return issue.hours_to_first_response;
};

const getIssueStats = async card => {
  const [owner, repo, , issueNumber] = card.content_url.replace('https://api.github.com/repos/', '').split('/');
  const issue = await getIssue(owner, repo, issueNumber);
  const issueData = issue.data;
  const issueCreatedAt = issueData.created_at;
  const issueClosedAt = issueData.closed_at;
  const issueComments = await getComments(owner, repo, issueNumber);
  const issueComment1CreatedAt = issueComments.data[0].created_at;
  return {
    issue_id: issueData.id, 
    created_at: issueCreatedAt,
    card_created_at: card.created_at,
    closed_at: issueClosedAt,
    issue_first_comment_at: issueComment1CreatedAt,
    hours_to_resolution: getTimeDiffInHrs(issueClosedAt, issueCreatedAt),
    hours_to_first_response: getTimeDiffInHrs(issueComment1CreatedAt, issueCreatedAt)
  };
};

const addValues = (runningTotal, hours) => {
  return runningTotal + hours;
};

const getAverage = (stats) => {
  return stats.reduce(addValues, 0) / stats.length;
};

const getLastUpdateDate = (table, selectColumn, orderColumn) => {
  return dbReader
    .getValue(table, selectColumn, orderColumn)
    .then(val => {
      if (val == -1) {
        return TWO_MONDAYS_BACK;
      } 
      return new Date(val[0].update_date);
    });
};

const output = columns => {
  getLastUpdateDate('week_stats', 'update_date', 'update_date')
    .then(lastUpdate => {
      const doneColumn = columns.filter(column => {
        return column[0] == 'Done';
      });
      let cards = doneColumn[0][1];

      console.log('Last update: ' + lastUpdate);
      addDaysToDate(lastUpdate, 7);
      const startDate = new Date(getMonday(lastUpdate).toDateString());
      addDaysToDate(lastUpdate, 7);
      const endDate = new Date(lastUpdate.toDateString());

      if (startDate > LAST_MONDAY) {
        console.log('The stats are up to date.');
        return;
      }

      cards = cards.filter(card => {
        const createdAt = new Date(card.created_at);
        return createdAt > startDate && createdAt < endDate;
      });

      if (cards.length <= 0) {
        console.log('No cards added in the time frame.');
        return;
      }

      Promise.all(cards.map(getIssueStats))
      .then(issueStats => {
        console.log(issueStats);
        const avgHrsToFirstResponse = getAverage(issueStats.map(getHrsToFirstResponse));
        console.log('Average hours to first response: ' + avgHrsToFirstResponse);
        const avgHrsToResolution = getAverage(issueStats.map(getHrsToResolution));
        console.log('Average hours to resolution: ' + avgHrsToResolution);
        //TODO: write metrics to table factoring in variations with time (current month, last month, and last 3 months)
      });
    });
};

Promise.resolve()
  .then(getProjectId)
  .then(getColumns)
  .then(output)
  .catch(console.error);