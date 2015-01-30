var path = require('path');
var DependecyGraph = require('./');

var example_project = path.resolve(__dirname, '../../../../example_project');
var watcher = new (require('../../../FileWatcher'))({projectRoot: example_project});
var graph = new DependecyGraph({
  fileWatcher: watcher,
  root: example_project
});

graph.load().then(function() {
  var index = path.join(example_project, 'index.js');
  console.log(graph.getOrderedDependencies(index));
}).done();

watcher.getWatcher().then(function(watcher) {
  watcher.on('all', function() {
    setImmediate(function() {
      graph.load().then(function() {
        var index = path.join(example_project, 'index.js');
        console.log(graph.getOrderedDependencies(index));
      });
    })
  });
});
