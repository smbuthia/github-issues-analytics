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

module.exports = {
  writeToIssuesTable: (tableName, dataRows) => {
    knex.schema
      .hasTable(tableName)
      .then(exists => {
        if (!exists) {
          knex.schema
            .createTable(tableName, table => {
              table.increments('record_id');
              table.date('reported');
              table.string('repo');
              table.string('project');
              table.string('label');
              table.integer('issue_count');
            });
        }
      })
      .then(() => {
        knex(tableName)
          .insert(dataRows)
          .then(() => {
            console.log('data inserted');
          })
          .catch(err => {
            console.log(err);
            throw err;
          })
          .finally(() => {
            knex.destroy();
          });
      })
      .catch(err => {
        console.log(err);
        throw err;
      });
  },
  writeToColumnsTable: (tableName, dataRows) => {
    knex.schema
      .hasTable(tableName)
      .then(exists => {
        if (!exists) {
          knex.schema
            .createTable(tableName, table => {
              table.increments('record_id');
              table.date('reported');
              table.string('project');
              table.string('column');
              table.integer('issue_count');
            });
        }
      })
      .then(() => {
        knex(tableName)
          .insert(dataRows)
          .then(() => {
            console.log('data inserted');
          })
          .catch(err => {
            console.log(err);
            throw err;
          })
          .finally(() => {
            knex.destroy();
          });
      })
      .catch(err => {
        console.log(err);
        throw err;
      });
  },
  destroyConn: () => {
    knex.destroy();
  }
};
