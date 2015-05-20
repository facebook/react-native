'use strict';

var path = require('path');
var utils = require('./generator-utils');

function init(projectDir, appName) {
  console.log('Setting up new React Native app in ' + projectDir);
  var source = path.resolve(__dirname, '..', 'Examples/SampleApp');

  utils.walk(source).forEach(function(f) {
    f = f.replace(source + '/', ''); // Strip off absolute path
    if (f === 'project.xcworkspace' || f.indexOf('.xcodeproj/xcuserdata') !== -1) {
      return;
    }

    var replacements = {
      'Examples/SampleApp/': '',
      '../../Libraries/': 'node_modules/react-native/Libraries/',
      '../../React/': 'node_modules/react-native/React/',
      'SampleApp': appName
    };

    var dest = f.replace(/SampleApp/g, appName).replace(/^_/, '.');
    utils.copyAndReplace(
      path.resolve(source, f),
      path.resolve(projectDir, dest),
      replacements
    );
  });

  console.log('Next Steps:');
  console.log('   Open ' + path.resolve(projectDir, appName) + '.xcodeproj in Xcode');
  console.log('   Hit Run button');
  console.log('');
}

module.exports = init;
