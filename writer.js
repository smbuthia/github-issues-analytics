const knex = require('knex')({
  client: 'pg',
  connection: {
    host: '127.0.0.1',
    user: 'samuel',
    password: 'samuel',
    database: 'support_analytics'
  }
});

module.exports = {
  writeToIssuesTable: function writeToIssuesTable(tableName, data, label) {
    var dataRows = [
      {
        date_reported: new Date().getTime(),
        issues_label: label,
        issues_count: data.total_count
      }
    ];
    knex.schema
      .hasTable(tableName)
      .then(exists => {
        if (!exists) {
          knex.schema
            .createTable(tableName, table => {
              table.increments('record_id');
              table.timestamp('date_reported');
              table.string('issues_label');
              table.integer('issues_count');
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
            });
        } else {
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
        }
      })
      .catch(err => {
        console.log(err);
        throw err;
      });
  }
};
