var w = require('./write-to-db').getUnassignedIssues([{name: 'lunch-ordering-system'}], [{name: 'bug'}, {name: 'question'}], false);

w.then(function(result) {console.log(result)});