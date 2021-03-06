const dotenv = require('dotenv').config({path: __dirname + '/.env'});

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

const insertData = (table, data) => {
  knex(table)
    .insert(data)
    .then(() => {
      console.log('data inserted');
    })
    .catch(err => {
      throw err;
    })
    .finally(() => {
      knex.destroy();
    });
};

module.exports = {
  writeToStatsTable: (tableName, dataRows) => {
    knex.schema
      .hasTable(tableName)
      .then(exists => {
        if (!exists) {
          knex.schema
            .createTable(tableName, table => {
              table.increments('record_id');
              table.date('week');
              table.integer('no_of_issues');
              table.decimal('avg_hrs_resolution');
              table.decimal('avg_hrs_first_response');
              table.timestamp('row_updated_at', { precision: 6 }).defaultTo(knex.fn.now(6));
            })
            .then(() => {
              insertData(tableName, dataRows);
            });
        } else {
          insertData(tableName, dataRows);
        }
      })
      .catch(err => {
        throw err;
      });
  },
  destroyConn: () => {
    knex.destroy();
  }
};
