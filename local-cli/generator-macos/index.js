'use strict';
const chalk = require('chalk');
const path = require('path');
const childProcess = require('child_process');
const fs = require('fs');
const {
  createDir,
  copyAndReplaceAll,
  copyAndReplaceWithChangedCallback,
} = require('../generator-common');

const macOSDir = 'macos';

function copyProjectTemplateAndReplace(
  srcRootPath,
  destPath,
  newProjectName,
  options = {}
) {
  if (!srcRootPath) {
    throw new Error('Need a path to copy from');
  }

  if (!destPath) {
    throw new Error('Need a path to copy to');
  }

  if (!newProjectName) {
    throw new Error('Need a project name');
  }

  const projectNameMacOS = newProjectName + '-macOS';
  const projectNameIOS = newProjectName;
  const xcodeProjName = newProjectName + '.xcodeproj';
  const schemeNameMacOS = newProjectName + '-macOS.xcscheme';
  const schemeNameIOS = newProjectName + '.xcscheme';

  createDir(path.join(destPath, macOSDir));
  createDir(path.join(destPath, macOSDir, projectNameIOS));
  createDir(path.join(destPath, macOSDir, projectNameMacOS));
  createDir(path.join(destPath, macOSDir, xcodeProjName));
  createDir(path.join(destPath, macOSDir, xcodeProjName, 'xcshareddata'));
  createDir(path.join(destPath, macOSDir, xcodeProjName, 'xcshareddata/xcschemes'));

  const templateVars = {
    'HelloWorld': newProjectName,
  };

  [
    { from: path.join(srcRootPath, 'macos/HelloWorld'), to: path.join(macOSDir, projectNameIOS) },
    { from: path.join(srcRootPath, 'macos/HelloWorld-macOS'), to: path.join(macOSDir, projectNameMacOS) },
    { from: path.join(srcRootPath, 'macos/HelloWorld.xcodeproj'), to: path.join(macOSDir, xcodeProjName) },
    { from: path.join(srcRootPath, 'macos/xcschemes/HelloWorld-macOS.xcscheme'), to: path.join(macOSDir, xcodeProjName, 'xcshareddata/xcschemes', schemeNameMacOS) },
    { from: path.join(srcRootPath, 'macos/xcschemes/HelloWorld.xcscheme'), to: path.join(macOSDir, xcodeProjName, 'xcshareddata/xcschemes', schemeNameIOS) },
  ].forEach((mapping) => copyAndReplaceAll(mapping.from, destPath, mapping.to, templateVars, options.overwrite));

  [
    { from: path.join(srcRootPath, 'react-native.config.js'), to: 'react-native.config.js' },
    { from: path.join(srcRootPath, 'metro.config.macos.js'), to: 'metro.config.macos.js' },
  ].forEach((mapping) => copyAndReplaceWithChangedCallback(mapping.from, destPath, mapping.to, templateVars, options.overwrite));

  console.log(`
  ${chalk.blue(`Run instructions for ${chalk.bold('macOS')}`)}:
    • npx react-native run-macos
    ${chalk.dim('- or -')}
    • Open ${macOSDir}/${xcodeProjName} in Xcode or run "xed -b ${macOSDir}"
    • yarn start:macos
    • Hit the Run button
`);
}

function installDependencies(options) {
  const cwd = process.cwd();

  // Patch package.json to have start:macos
  const projectPackageJsonPath = path.join(cwd, 'package.json');
  const projectPackageJson = JSON.parse(fs.readFileSync(projectPackageJsonPath, { encoding: 'UTF8' }));
  projectPackageJson.scripts['start:macos'] = 'node node_modules/react-native-macos/local-cli/cli.js start --use-react-native-macos';
  fs.writeFileSync(projectPackageJsonPath, JSON.stringify(projectPackageJson, null, 2));

  // Install dependencies using correct package manager
  const isYarn = fs.existsSync(path.join(cwd, 'yarn.lock'));
  const execOptions = options && options.verbose ? { stdio: 'inherit' } : {};
  childProcess.execSync(isYarn ? 'yarn' : 'npm i', execOptions);
}

module.exports = {
  copyProjectTemplateAndReplace,
  installDependencies,
};
