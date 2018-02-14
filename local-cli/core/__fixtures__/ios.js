const fs = require.requireActual('fs');
const path = require('path');

exports.valid = {
  'demoProject.xcodeproj': {
    'project.pbxproj': fs.readFileSync(path.join(__dirname, './files/project.pbxproj')),
  },
  'TestPod.podspec': 'empty'
};

exports.validTestName = {
  'MyTestProject.xcodeproj': {
    'project.pbxproj': fs.readFileSync(path.join(__dirname, './files/project.pbxproj')),
  },
};

exports.pod = {
  'TestPod.podspec': 'empty'
};
