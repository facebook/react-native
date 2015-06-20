/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */

 'use strict';

var fs = require('fs');
var path = require('path');
var exec = require('child_process').exec;

var NODE_MODULE_PATH = path.resolve(__dirname, 'node_modules');

var PODFILE_PATH = path.resolve(__dirname, 'Podfile');

function addDependency(name, path) {
  console.log('Found dependency: ' + name);

  var podfileText;
  try {
    podfileText = fs.readFileSync(PODFILE_PATH, 'utf8');
  } catch(e) {}

  if (podfileText.indexOf('pod \'' + name + '\'') === -1) {
    var indexOfReactComponents = podfileText.indexOf('#</React-Native>') - 1;

    var insertedDependency = '\npod \'' + name + '\', :path => \'' + path + '\'\n';
    var newPodfileText = [podfileText.slice(0, indexOfReactComponents),
      insertedDependency,
      podfileText.slice(indexOfReactComponents)].join('');

    fs.writeFileSync(PODFILE_PATH, newPodfileText);
    console.log('Added ' + name + ' to Podfile.');
  } else {
    console.log(name + ' already in Podfile');
  }
}

function installDependecies() {
  console.log('Installing dependencies...');
  exec('pod install', function(error, stdout, stderr) {
    if (!stderr) {
      console.log('Installed Pod dependencies.');
    } else {
      console.error('Error installing Pod dependencies.', stderr);
    }
    process.exit(1);
  });
}

module.exports = {
  setupPodfile: function() {
    var returnArgs = {
      created: false
    };

    var podfileText;
    try {
      podfileText = fs.readFileSync(PODFILE_PATH, 'utf8');
    } catch(e) {}

    var openingReactTag = '#<React-Native>';
    var closingReactTag = '\n#</React-Native>';
    var reactPodfileBoilerplate = openingReactTag + closingReactTag;

    if (!podfileText) {
      returnArgs.created = true;
      fs.appendFileSync(PODFILE_PATH, reactPodfileBoilerplate);
    } else {
      if (podfileText.indexOf(openingReactTag) === -1 || podfileText.indexOf(closingReactTag) === -1) {
        fs.appendFileSync(PODFILE_PATH, reactPodfileBoilerplate);
      }
    }

    try {
      podfileText = fs.readFileSync(PODFILE_PATH, 'utf8');
      returnArgs.podfileText = podfileText;
    } catch(e) {}

    if (podfileText.indexOf('pod \'React\'') === -1) {
      var indexOfReactComponents = podfileText.indexOf(openingReactTag) + openingReactTag.length;

      var insertedReactDependency = '\npod \'React\', :path => \'node_modules/react-native\'\n';
      try {
        var newPodfileText = [podfileText.slice(0, indexOfReactComponents),
          insertedReactDependency,
          podfileText.slice(indexOfReactComponents)].join('');

        fs.writeFileSync(PODFILE_PATH, newPodfileText);
        returnArgs.podfileText = newPodfileText;
      } catch(e) {
        throw e;
      }
    }

    return returnArgs;
  },
  init: function(arguement) {
    // arguement is available for future arguement commands
    console.log('Searching for installable React Native components...');
    this.setupPodfile();

    var nodeModuleList = fs.readdirSync(NODE_MODULE_PATH);

    if (nodeModuleList.length > 0) {
      nodeModuleList.forEach(function(nodeModule) {
        // Module would not start with '.' hidden file identifier
        if (nodeModule.charAt(0) !== '.') {
          var modulePath = './node_modules/' + nodeModule;

          var nodeModulePackage;
          try {
            nodeModulePackage = fs.readFileSync(modulePath + '/package.json', 'utf8');
          } catch(error) {
            console.error('Error reading Node Module: `%s` package.json', nodeModule);
            throw error;
          }

          var packageJSON = JSON.parse(nodeModulePackage);
          console.log(packageJSON.hasOwnProperty('react-native-component'));
          if (packageJSON.hasOwnProperty('react-native-component')) {
            addDependency(nodeModule, modulePath);
          }
        }
      });

      installDependecies();
    } else {
      console.error('./node_modules directory contains 0 modules');
      console.log('No React Native components found.');
      process.exit(1);
    }
  }
};
