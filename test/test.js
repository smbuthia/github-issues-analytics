var assert = require('assert');
var assert = require('chai').assert;
var writer = require('../github-fetcher');


describe('getProjectsAndLabels', () => {
  it('should pass if getProjectsAndLabels returns an object with {projects: array, labels: array, useProjectLabels: boolen}', () => {
    writer.getProjectsAndLabels()
      .then((result) => {
        assert.typeOf(result.projects, 'array');
        assert.typeOf(result.labels, 'array');
        assert.typeOf(result.useProjectLabels, 'boolean');
      })
  });
});
  

describe('write-to-db', () => {
  describe('#isArray', () => {
    it('should pass if getOpenIssues returns an array of objects', () => {
      writer.getOpenIssues([{name: 'lunch-ordering-system'}], [{name: 'bug'}, {name: 'question'}], false)
        .then((result) => {
          assert.typeOf(result, 'array');
        });
    });
    it('should pass if getUnassignedIssues returns an array of objects', () => {
      writer.getUnassignedIssues([{name: 'lunch-ordering-system'}], [{name: 'bug'}, {name: 'question'}], false)
        .then((result) => {
          assert.typeOf(result, 'array');
        });
    });
    it('should pass if getDailyReportedIssues returns an array of objects', () => {
      writer.getDailyReportedIssues([{name: 'lunch-ordering-system'}], [{name: 'bug'}, {name: 'question'}], false)
        .then((result) => {
          assert.typeOf(result, 'array');
        });
    });
    it('should pass if getDailyClosedIssues returns an array of objects', () => {
      writer.getDailyClosedIssues([{name: 'lunch-ordering-system'}], [{name: 'bug'}, {name: 'question'}], false)
        .then((result) => {
          assert.typeOf(result, 'array');
        });
    });
    it('should pass if getWeeklyReportedIssues returns an array of objects', () => {
      writer.getWeeklyReportedIssues([{name: 'lunch-ordering-system'}], [{name: 'bug'}, {name: 'question'}], false)
        .then((result) => {
          assert.typeOf(result, 'array');
        });
    });
    it('should pass if getWeeklyClosedIssues returns an array of objects', () => {
      writer.getWeeklyClosedIssues([{name: 'lunch-ordering-system'}], [{name: 'bug'}, {name: 'question'}], false)
        .then((result) => {
          assert.typeOf(result, 'array');
        });
    });
  });
});

