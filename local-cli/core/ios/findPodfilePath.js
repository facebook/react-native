/** @format */

'use strict';

const fs = require('fs');
const path = require('path');

module.exports = function findPodfilePath(projectFolder) {
  const podFilePath = path.join(projectFolder, '..', 'Podfile');
  const podFileExists = fs.existsSync(podFilePath);

  return podFileExists ? podFilePath : null;
};
