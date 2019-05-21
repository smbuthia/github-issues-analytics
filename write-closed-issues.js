const knex = require('knex')({
  client: 'pg',
  connection: process.env.PG_CONNECTION_STRING
})
/** This is a description of the writeToClosedIssuesTable function. */
function writeToClosedIssuesTable(tableName, data) {
  knex.schema.hasTable(tableName)
    .then((exists) => {
      if (!exists) {
        knex.schema.createTable(tableName, (table) => {
          table.increments('id')
          table.date('date_reported')
          table.string('label')
          table.integer('issues_closed')
        }).then(() => {
          knex(tableName).insert(data)
            .then(() => {
              console.log("data inserted")
            })
            .catch((err) => {
              console.log(err)
              throw err
            })
            .finally(() => {
              knex.destroy()
            })
        })
      } else {
        knex(tableName).insert(data)
          .then(() => {
            console.log("data inserted")
          })
          .catch((err) => {
            console.log(err)
            throw err
          })
          .finally(() => {
            knex.destroy()
          })
      }
    })
    .catch((err) => {
      console.log(err)
      throw err
    })
}

module.exports = writeToClosedIssuesTable