'use strict';

const {
  copyProjectTemplateAndReplace,
  installDependencies,
  installPods,
  printFinishMessage,
} = require('./generator-macos');
const fs = require('fs');
const path = require('path');

/**
 * Simple utility for running the macOS generator.
 *
 * @param  {String} projectDir root project directory (i.e. contains index.js)
 * @param  {String} name       name of the root JS module for this app
 * @param  {Object} options    command line options container
 */
function generateMacOS (projectDir, name, options) {
  if (!fs.existsSync(projectDir)) {
    fs.mkdirSync(projectDir);
  }

  installDependencies(options);

  copyProjectTemplateAndReplace(
    path.join(__dirname, 'generator-macos', 'templates'),
    projectDir,
    name,
    { overwrite: options.overwrite }
  );

  printFinishMessage(name);
}

module.exports = generateMacOS;
