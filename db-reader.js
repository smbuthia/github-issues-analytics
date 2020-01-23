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

module.exports = {
  getValue: (table) => {
    return new Promise((resolve) => {
      knex.schema
        .hasTable(table)
        .then(exists => {
          if (!exists) {
            resolve(-1);
          } else {
            knex(table)
              .select(selectColumn)
              .distinct(selectColumn)
              .orderBy(orderColumn, 'desc')
              .limit(1)
              .then(returnValue => {
                resolve(returnValue);
              })
              .catch(err => {
                throw err;
              });
          }
        })
        .finally(() => {
          knex.destroy();
        });
    });
  }
};