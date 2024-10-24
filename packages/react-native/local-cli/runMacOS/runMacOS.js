// @ts-check
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 * @format
 */
'use strict';

/**
 * @typedef {{
 *   configuration: string;
 *   mode: string;
 *   packager: boolean;
 *   port: number;
 *   projectPath: string;
 *   scheme?: string;
 *   terminal: string | undefined;
 *   verbose: boolean;
 * }} Options
 *
 * @typedef {{
 *   name: string;
 *   path?: string;
 *   isWorkspace: boolean;
 * }} XcodeProject
 *
 * @typedef {{
 *   project?: {
 *     macos?: {
 *       sourceDir: string;
 *       xcodeProject: XcodeProject;
 *     }
 *   }
 * }} ProjectConfig
 */

const chalk = require('chalk');
const child_process = require('child_process');
const path = require('path');
const {logger, CLIError, getDefaultUserTerminal} = (() => {
  const cli = require.resolve('@react-native-community/cli/package.json');
  const options = {paths: [path.dirname(cli)]};
  const tools = require.resolve('@react-native-community/cli-tools', options);
  return require(tools);
})();

/**
 * @param {ProjectConfig} ctx
 * @param {Options} args
 * @returns {{ sourceDir: string, xcodeProject: XcodeProject, scheme: string }}
 */
function parseArgs(ctx, args) {
  if (args.configuration) {
    logger.warn(
      'Argument --configuration has been deprecated and will be removed in a future release, please use --mode instead.',
    );

    if (!args.mode) {
      args.mode = args.configuration;
    }
  }

  const {sourceDir, xcodeProject} = ctx.project?.macos ?? {};
  if (!sourceDir) {
    throw new CLIError(
      'macOS project folder not found. Are you sure this is a React Native project?',
    );
  }

  if (!xcodeProject) {
    throw new CLIError(
      'Xcode project for macOS not found. Did you forget to run `pod install`?',
    );
  }

  // TODO: Find schemes using https://github.com/microsoft/rnx-kit/blob/2b4c569cda9e3755ba7afce42d846601bcc7c4e3/packages/tools-apple/src/scheme.ts#L5
  const inferredSchemeName =
    path.basename(xcodeProject.name, path.extname(xcodeProject.name)) +
    '-macOS';
  const scheme = args.scheme || inferredSchemeName;

  logger.info(
    `Found Xcode ${
      xcodeProject.isWorkspace ? 'workspace' : 'project'
    } "${chalk.bold(xcodeProject.name)}"`,
  );

  return {sourceDir, xcodeProject, scheme};
}

/**
 * @param {string[]} _
 * @param {ProjectConfig} ctx
 * @param {Options} args
 */
function buildMacOS(_, ctx, args) {
  const {sourceDir, xcodeProject, scheme} = parseArgs(ctx, args);
  return buildProject(sourceDir, xcodeProject, scheme, {...args, packager: false});
}

/**
 * @param {string[]} _
 * @param {ProjectConfig} ctx
 * @param {Options} args
 */
function runMacOS(_, ctx, args) {
  const {sourceDir, xcodeProject, scheme} = parseArgs(ctx, args);
  return run(sourceDir, xcodeProject, scheme, args);
}

/**
 * @param {string} sourceDir
 * @param {XcodeProject} xcodeProject
 * @param {string} scheme
 * @param {Options} args
 */
async function run(sourceDir, xcodeProject, scheme, args) {
  await buildProject(sourceDir, xcodeProject, scheme, args);

  const buildSettings = getBuildSettings(xcodeProject, args.mode, scheme);
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
    (error, _stdout, stderr) => {
      if (error) {
        logger.error('Failed to launch the app', stderr);
      } else {
        logger.success('Successfully launched the app');
      }
    },
  );
}

/**
 * @param {string} sourceDir
 * @param {XcodeProject} xcodeProject
 * @param {string} scheme
 * @param {Options} args
 * @returns {Promise<void>}
 */
function buildProject(sourceDir, xcodeProject, scheme, args) {
  return new Promise((resolve, reject) => {
    const xcodebuildArgs = [
      xcodeProject.isWorkspace ? '-workspace' : '-project',
      path.join(sourceDir, xcodeProject.path || '.', xcodeProject.name),
      '-configuration',
      args.mode,
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
 * @param {XcodeProject} xcodeProject
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
 * @param {Options} args
 * @returns {import('child_process').ProcessEnvOptions}
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

const commonOptions = [
  {
    name: '--mode [string]',
    description:
      'Explicitly set the scheme configuration to use, corresponds to `--configuration` in `xcodebuild` command, e.g. Debug, Release.',
  },
  {
    name: '--scheme [string]',
    description:
      'Explicitly set Xcode scheme to use, corresponds to `--scheme` in `xcodebuild` command.',
  },
  {
    name: '--project-path [string]',
    description:
      'Path relative to project root where the Xcode project (.xcodeproj) lives.',
    default: 'macos',
  },
  {
    name: '--verbose',
    description: 'Do not use xcpretty even if installed',
  },
];

module.exports = [
  {
    name: 'build-macos',
    description: 'builds your app',
    func: buildMacOS,
    examples: [
      {
        desc: 'Build the macOS app',
        cmd: 'react-native build-macos',
      },
    ],
    options: commonOptions,
  },
  {
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
        description:
          '[Deprecated] Explicitly set the scheme configuration to use',
        default: 'Debug',
      },
      ...commonOptions,
      {
        name: '--no-packager',
        description: 'Do not launch packager while building',
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
  },
];
