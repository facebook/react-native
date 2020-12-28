/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 * @format
 * @ts-check
 */
'use strict';

const child_process = require('child_process');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const findXcodeProject = require('./findXcodeProject');
const {
  logger,
  CLIError,
  getDefaultUserTerminal,
} = require('@react-native-community/cli-tools');

/**
 * @param {string[]} _
 * @param {Object.<string, *>} ctx
 * @param {{configuration: string, scheme?: string, projectPath: string, packager: boolean, verbose: boolean, port: number, terminal: string | undefined}} args
 */
function runMacOS(_, ctx, args) {
  if (!fs.existsSync(args.projectPath)) {
    throw new CLIError(
      'macOS project folder not found. Are you sure this is a React Native project?',
    );
  }

  process.chdir(args.projectPath);

  const xcodeProject = findXcodeProject(fs.readdirSync('.'));
  if (!xcodeProject) {
    throw new CLIError(
      `Could not find Xcode project files in "${args.projectPath}" folder`,
    );
  }

  const inferredSchemeName =
    path.basename(xcodeProject.name, path.extname(xcodeProject.name)) +
    '-macOS';
  const scheme = args.scheme || inferredSchemeName;

  logger.info(
    `Found Xcode ${
      xcodeProject.isWorkspace ? 'workspace' : 'project'
    } "${chalk.bold(xcodeProject.name)}"`,
  );

  return run(xcodeProject, scheme, args);
}

/**
 * @param {{name: string, isWorkspace: boolean}} xcodeProject
 * @param {string} scheme
 * @param {{configuration: string, scheme?: string, projectPath: string, packager: boolean, verbose: boolean, port: number, terminal: string | undefined}} args
 */
async function run(xcodeProject, scheme, args) {
  await buildProject(xcodeProject, scheme, args);

  const buildSettings = getBuildSettings(
    xcodeProject,
    args.configuration,
    scheme,
  );
  const appPath = path.join(
    buildSettings.TARGET_BUILD_DIR,
    buildSettings.FULL_PRODUCT_NAME,
  );
  const infoPlistPath = path.join(
    buildSettings.TARGET_BUILD_DIR,
    buildSettings.INFOPLIST_PATH,
  );

  const bundleID = child_process
    .execFileSync(
      '/usr/libexec/PlistBuddy',
      ['-c', 'Print:CFBundleIdentifier', infoPlistPath],
      {encoding: 'utf8'},
    )
    .trim();

  logger.info(
    `Launching app "${chalk.bold(bundleID)}" from "${chalk.bold(appPath)}"`,
  );

  child_process.exec(
    'open -b ' + bundleID + ' -a ' + '"' + appPath + '"',
    (error, stdout, stderr) => {
      if (error) {
        logger.error('Failed to launch the app', stderr);
      } else {
        logger.success('Successfully launched the app');
      }
    },
  );
}

/**
 * @param {{name: string, isWorkspace: boolean}} xcodeProject
 * @param {string} scheme
 * @param {{configuration: string, scheme?: string, projectPath: string, packager: boolean, verbose: boolean, port: number, terminal: string | undefined}} args
 */
function buildProject(xcodeProject, scheme, args) {
  return new Promise((resolve, reject) => {
    const xcodebuildArgs = [
      xcodeProject.isWorkspace ? '-workspace' : '-project',
      xcodeProject.name,
      '-configuration',
      args.configuration,
      '-scheme',
      scheme,
    ];
    logger.info(
      `Building ${chalk.dim(
        `(using "xcodebuild ${xcodebuildArgs.join(' ')}")`,
      )}`,
    );
    let xcpretty;
    if (!args.verbose) {
      xcpretty =
        xcprettyAvailable() &&
        child_process.spawn('xcpretty', [], {
          stdio: ['pipe', process.stdout, process.stderr],
        });
    }
    const buildProcess = child_process.spawn(
      'xcodebuild',
      xcodebuildArgs,
      getProcessOptions(args),
    );
    let buildOutput = '';
    let errorOutput = '';
    buildProcess.stdout.on('data', data => {
      const stringData = data.toString();
      buildOutput += stringData;
      if (xcpretty) {
        xcpretty.stdin.write(data);
      } else {
        if (logger.isVerbose()) {
          logger.debug(stringData);
        } else {
          process.stdout.write('.');
        }
      }
    });
    buildProcess.stderr.on('data', data => {
      errorOutput += data;
    });
    buildProcess.on('close', code => {
      if (xcpretty) {
        xcpretty.stdin.end();
      } else {
        process.stdout.write('\n');
      }
      if (code !== 0) {
        reject(
          new CLIError(
            `
            Failed to build macOS project.

            We ran "xcodebuild" command but it exited with error code ${code}. To debug build
            logs further, consider building your app with Xcode.app, by opening
            ${xcodeProject.name}.
          `,
            buildOutput + '\n' + errorOutput,
          ),
        );
        return;
      }
      resolve();
    });
  });
}

/**
 * @param {{name: string, isWorkspace: boolean}} xcodeProject
 * @param {string} configuration
 * @param {string} scheme
 * @returns {{ FULL_PRODUCT_NAME: string, INFOPLIST_PATH: string, TARGET_BUILD_DIR: string }}
 */
function getBuildSettings(xcodeProject, configuration, scheme) {
  const settings = JSON.parse(
    child_process.execFileSync(
      'xcodebuild',
      [
        xcodeProject.isWorkspace ? '-workspace' : '-project',
        xcodeProject.name,
        '-scheme',
        scheme,
        '-sdk',
        'macosx',
        '-configuration',
        configuration,
        '-showBuildSettings',
        '-json',
      ],
      {encoding: 'utf8'},
    ),
  );

  // Find app in all building settings - look for WRAPPER_EXTENSION: 'app',
  for (const i in settings) {
    const appSettings = settings[i].buildSettings;
    if (appSettings.WRAPPER_EXTENSION === 'app') {
      return appSettings;
    }
  }

  throw new CLIError('Failed to get the target build settings.');
}

function xcprettyAvailable() {
  try {
    child_process.execSync('xcpretty --version', {
      stdio: [0, 'pipe', 'ignore'],
    });
  } catch (error) {
    return false;
  }
  return true;
}

/**
 * @param {Object} args
 * @param {boolean} args.packager
 * @param {string|undefined} args.terminal
 * @param {number} args.port
 */
function getProcessOptions({packager, terminal, port}) {
  if (packager) {
    return {
      env: {
        ...process.env,
        RCT_TERMINAL: terminal,
        RCT_METRO_PORT: port.toString(),
      },
    };
  }

  return {
    env: {
      ...process.env,
      RCT_TERMINAL: terminal,
      RCT_NO_LAUNCH_PACKAGER: 'true',
    },
  };
}

module.exports = {
  name: 'run-macos',
  description: 'builds your app and starts it',
  func: runMacOS,
  examples: [
    {
      desc: 'Run the macOS app',
      cmd: 'react-native run-macos',
    },
  ],
  options: [
    {
      name: '--configuration [string]',
      description: 'Explicitly set the scheme configuration to use',
      default: 'Debug',
    },
    {
      name: '--scheme [string]',
      description: 'Explicitly set Xcode scheme to use',
    },
    {
      name: '--project-path [string]',
      description:
        'Path relative to project root where the Xcode project ' +
        '(.xcodeproj) lives.',
      default: 'macos',
    },
    {
      name: '--no-packager',
      description: 'Do not launch packager while building',
    },
    {
      name: '--verbose',
      description: 'Do not use xcpretty even if installed',
    },
    {
      name: '--port [number]',
      default: process.env.RCT_METRO_PORT || 8081,
      parse: val => Number(val),
    },
    {
      name: '--terminal [string]',
      description:
        'Launches the Metro Bundler in a new window using the specified terminal path.',
      default: getDefaultUserTerminal,
    },
  ],
};
