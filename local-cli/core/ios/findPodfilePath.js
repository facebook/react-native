'use strict';

const fs = require('fs');
const path = require('path');

module.exports = function findPodfilePath(projectFolder) {
  const podFilePath = path.join(projectFolder, '..', 'Podfile');
  console.log('asdf', path.join(projectFolder, '..'));
  const podFileExists = fs.existsSync(podFilePath);

  return podFileExists ? podFilePath : null;
};
