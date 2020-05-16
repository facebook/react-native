'use strict';

const fs = require('fs');
const path = require('path');
const {
  copyProjectTemplateAndReplace,
  installDependencies,
  installPods,
  printFinishMessage,
} = require('./generator-macos');

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

  installPods(options);

  printFinishMessage(name);
}

module.exports = generateMacOS;
