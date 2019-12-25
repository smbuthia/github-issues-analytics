const dbReader = require('./db-reader');

dbReader.getValue('week_stats', 'update_date', 'update_date')
  .then(val => {
    if(-1) {
      console.log('Table does not exist');
    } else {
      console.log(val[0].update_date);
    }
  });
