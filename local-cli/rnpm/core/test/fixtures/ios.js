const fs = require('fs');
const path = require('path');

exports.valid = {
  'demoProject.xcodeproj': {
    'project.pbxproj': fs.readFileSync(path.join(__dirname, './files/project.pbxproj')),
  },
};

exports.validTestName = {
  'MyTestProject.xcodeproj': {
    'project.pbxproj': fs.readFileSync(path.join(__dirname, './files/project.pbxproj')),
  },
};
