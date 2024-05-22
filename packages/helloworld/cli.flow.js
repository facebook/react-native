/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

import type {IOSDevice} from './lib/ios';

import {run} from './lib/cli';
import {getExistingPath, pauseWatchman} from './lib/filesystem';
import {
  bootSimulator,
  getSimulatorDetails,
  getXcodeBuildSettings,
  launchApp,
  launchSimulator,
} from './lib/ios';
import {app, apple} from '@react-native/core-cli-utils';
import chalk from 'chalk';
import {Option, program} from 'commander';
import {readFileSync} from 'fs';
import Listr from 'listr';
import path from 'path';

program.version(JSON.parse(readFileSync('./package.json', 'utf8')).version);

const FIRST = 1;

const bootstrap = program.command('bootstrap');

const cwd = {
  ios: path.join(__dirname, 'ios'),
  android: path.join(__dirname, 'android'),
  root: __dirname,
};

const possibleHermescPaths = [
  // OSS checkout
  path.join(cwd.ios, 'Pods/hermes-engine/destroot/bin/hermesc'),
  // internal
  path.join(cwd.ios, 'Pods/hermes-engine/build_host_hermesc/bin/hermesc'),
];

bootstrap
  .command('ios')
  .description('Bootstrap iOS')
  .option('--hermes', 'Enable Hermes', true)
  .option('--new-architecture', 'Enable new architecture', true)
  .addOption(
    new Option('--framework <type>', 'Use frameworks')
      .choices(['static', 'dynamic'])
      .default('static'),
  )
  .action(
    async (
      _,
      options: {
        newArchitecture: boolean,
        hermes: boolean,
        framework: 'static' | 'dynamic',
      },
    ) => {
      await pauseWatchman(async () => {
        await run(
          apple.bootstrap({
            framework: options.framework,
            cwd: cwd.ios,
            hermes: options.hermes,
            newArchitecture: options.newArchitecture,
          }),
        );
      });
    },
  );

const build = program.command('build');

type BuildOptions = {
  hermes: boolean,
  onlyBuild: boolean,
  device: string,
};

const optionalBool = (value: string | void) => value?.toLowerCase() === 'true';

type BuildSettings = {
  appPath: string,
  bundleId: string,
  bundleBuildDir: string,
  bundleResourceDir: string,
};

const _buildSettings: Partial<BuildSettings> = {};
const getBuildSettings = (): BuildSettings => {
  if (_buildSettings.appPath == null) {
    const xcode = getXcodeBuildSettings(cwd.ios)[0].buildSettings;
    _buildSettings.appPath = path.join(
      xcode.TARGET_BUILD_DIR,
      xcode.EXECUTABLE_FOLDER_PATH,
    );
    _buildSettings.bundleId = xcode.PRODUCT_BUNDLE_IDENTIFIER;
    _buildSettings.bundleBuildDir = xcode.CONFIGURATION_BUILD_DIR;
    _buildSettings.bundleResourceDir = path.join(
      xcode.CONFIGURATION_BUILD_DIR,
      xcode.UNLOCALIZED_RESOURCES_FOLDER_PATH,
    );
  }
  // $FlowIgnore[prop-missing]
  return Object.assign({}, _buildSettings);
};

// $FlowIgnore[prop-missing]
let _device: IOSDevice = {};
const getIOSDevice = async (
  device: string = 'simulator',
): Promise<IOSDevice> => {
  if (_device.udid == null) {
    try {
      _device = await getSimulatorDetails(device);
    } catch (e) {
      console.log(chalk.bold.red(e.message));
      process.exit(1);
    }
  }
  // $FlowIgnore[prop-missing]
  return Object.assign({}, _device);
};

type IOSEnvironment = {
  device: IOSDevice,
  settings: BuildSettings,
};

const getIOSBuildEnvironment = async (
  device: string = 'simulator',
): Promise<IOSEnvironment> => {
  return await new Listr<IOSEnvironment>(
    [
      {
        title: 'Getting devices',
        task: async (ctx, task) => {
          ctx.device = await getIOSDevice(device);
        },
      },
      {
        title: 'Getting settings',
        task: async (ctx, task) => {
          ctx.settings = getBuildSettings();
        },
      },
    ],
    // $FlowIgnore[prop-missing]
  ).run({});
};

build
  .command('ios')
  .description('Builds your app for iOS')
  .option('--debug [bool]', 'Production build', optionalBool, true)
  .option(
    '--hermes [bool]',
    'Use Hermes or point to a prebuilt tarball',
    optionalBool,
    true,
  )
  .option(
    '--device',
    'Any simulator or a specific device (choices: "simulator", "device", other)',
    'simulator',
  )
  .action(async (options: BuildOptions) => {
    let destination = 'simulator';
    switch (options.device) {
      case 'simulator':
        break;
      case 'device':
        const {device} = await getIOSBuildEnvironment(options.device);
        destination = `id=${device.udid}`;
        break;
      default:
        destination = options.device;
        break;
    }

    await pauseWatchman(async () => {
      await run(
        apple.build({
          isWorkspace: true,
          name: 'HelloWorld.xcworkspace',
          mode: 'Debug',
          scheme: 'HelloWorld',
          cwd: cwd.ios,
          env: {
            FORCE_BUNDLING: 'true',
          },
          destination,
        }),
      );
    });
  });

const bundle = program.command('bundle');

bundle
  .command('ios')
  .addOption(
    new Option('--vm <type>', 'JavaScript VM')
      .choices(['hermes', 'jsc'])
      .default('hermes'),
  )
  .action(async (options: {vm: 'hermes' | 'jsc'}) => {
    const {settings, device} = await getIOSBuildEnvironment();

    // Metro: src -> js
    const jsBundlePath = path.join(settings.bundleBuildDir, 'main.jsbundle.js');
    // Hermes: js -> Hermes Byte Code
    const binaryBundlePath = path.join(
      settings.bundleResourceDir,
      'main.jsbundle',
    );

    const hermesc = getExistingPath(possibleHermescPaths);

    if (hermesc == null) {
      throw new Error(
        `Unable to find hermesc at:\n-${possibleHermescPaths
          .map(line => ' - ' + line)
          .join('\n')}`,
      );
    }

    await run(
      app.bundle({
        mode: 'bundle',
        cwd: cwd.root,
        entryFile: 'index.js',
        platform: 'ios',
        outputJsBundle: jsBundlePath,
        minify: false,
        optimize: false,
        outputSourceMap: settings.bundleResourceDir,
        outputBundle: binaryBundlePath,
        dev: true,
        target: options.vm,
        hermes: {
          hermesc,
        },
      }),
    );
  });

const upload = program.command('upload');

upload
  .command('ios')
  .option('--device', 'Any simulator or a specific device', 'simulator')
  .action(async (options: {device: string}) => {
    const {device, settings} = await getIOSBuildEnvironment(options.device);

    const {install} = apple.ios.install({
      cwd: cwd.ios,
      device: device.udid,
      appPath: settings.appPath,
      bundleId: settings.bundleId,
    });

    await new Listr([
      {
        title: 'Booting simulator',
        task: (_: mixed, task) => {
          if (device.state === 'Booted') {
            task.skip('Simulator currently Booted');
          } else {
            return bootSimulator(device);
          }
        },
      },
      {
        title: 'Launching simulator',
        task: () => launchSimulator(device),
      },
      {
        title: 'Installing app on simulator',
        task: () => install.action(),
      },
      {
        title: 'Launching app on simulator',
        task: () => launchApp(device.udid, settings.bundleId),
      },
    ]).run();
  });

if (require.main === module) {
  program.parse();
}

export default program;
