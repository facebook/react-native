'use strict';

var path = require('path');
var fs = require('fs');

function init(projectDir, appName) {
  console.log('Setting up new React Native app in ' + projectDir);
  var source = path.resolve(__dirname, 'Examples/SampleApp');

  walk(source).forEach(function(f) {
    f = f.replace(source + '/', ''); // Strip off absolute path
    if(f === 'project.xcworkspace' || f === 'xcuserdata') { return; }

    var replacements = {
      'Examples/SampleApp/': '',
      '../../Libraries/': 'node_modules/react-native/Libraries/',
      '../../React/': 'node_modules/react-native/React/',
      'SampleApp': appName
    };

    var dest = f.replace(/SampleApp/g, appName).replace(/^_/, ".");
    copyAndReplace(
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

function copyAndReplace(src, dest, replacements) {
  if (fs.lstatSync(src).isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest);
    }
  }
  else {
    var content = fs.readFileSync(src, 'utf8');
    Object.keys(replacements).forEach(function(regex) {
      content = content.replace(new RegExp(regex, 'g'), replacements[regex]);
    });
    fs.writeFileSync(dest, content);
  }
}

function walk(current) {
  if(fs.lstatSync(current).isDirectory()) {
    var files = fs.readdirSync(current).map(function(child) {
      child = path.join(current, child);
      return walk(child);
    });
    return [].concat.apply([current], files);
  } else {
    return [current];
  }
}

module.exports = init;
