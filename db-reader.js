const dotenv = require('dotenv').config();

if (dotenv.error) {
  throw dotenv.error;
}

const knex = require('knex')({
  client: 'pg',
  connection: {
    host: process.env.PG_HOST,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_DATABASE
  }
});

var lastReportedDates = {
  lastDailyReportedUpdateDate: new Date(),
  lastDailyClosedUpdateDate: new Date(),
  lastWeeklyReportedUpdateDate: new Date(),
  lastWeeklyClosedUpdateDate: new Date()
};

module.exports = {
  getLastReportedDates: (dailyReportedIssuesTable, dailyClosedIssuesTable, weeklyReportedIssuesTable, weeklyClosedIssuesTable) => {
    return new Promise((resolve, reject) => {
      knex
        .from(dailyReportedIssuesTable)
        .select('last_reported_date')
        .then((lastDailyReportedUpdateDate) => {
          lastReportedDates.lastDailyReportedUpdateDate = lastDailyReportedUpdateDate;
        })
        .from(dailyClosedIssuesTable)
        .select('last_reported_date')
        .then((lastDailyClosedUpdateDate) => {
          lastReportedDates.lastDailyClosedUpdateDate = lastDailyClosedUpdateDate;
        })
        .from(weeklyReportedIssuesTable)
        .select('last_reported_date')
        .then((lastWeeklyReportedUpdateDate) => {
          lastReportedDates.lastWeeklyReportedUpdateDate = lastWeeklyReportedUpdateDate;
        })
        .from(weeklyClosedIssuesTable)
        .select('last_reported_date')
        .then((lastWeeklyClosedUpdateDate) => {
          lastReportedDates.lastWeeklyClosedUpdateDate = lastWeeklyClosedUpdateDate;
        })
        .then(() => {
          resolve(lastReportedDates);
        });
    });
  }
};