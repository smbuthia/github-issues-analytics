const assert = require('chai').assert;
const misc = require('../miscellaneous');

const startDate = new Date('01-10-2019');
misc.addDaysToDate(startDate, 7);
let resultDate = new Date('01-17-2019').toString();

assert.equal(startDate.toString(), resultDate);