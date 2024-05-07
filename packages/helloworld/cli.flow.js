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

import {handlePipedArgs, run} from './lib/cli';
import {pauseWatchman} from './lib/filesystem';
import {
  bootSimulator,
  getSimulatorDetails,
  getXcodeBuildSettings,
  launchApp,
  launchSimulator,
} from './lib/ios';
import {app, apple} from '@react-native/core-cli-utils';
import chalk from 'chalk';
import {program} from 'commander';
import {readFileSync} from 'fs';
import Listr from 'listr';
import path from 'path';

program.version(JSON.parse(readFileSync('./package.json', 'utf8')).version);

const bootstrap = program.command('bootstrap');

const cwd = {
  ios: path.join(__dirname, 'ios'),
  android: path.join(__dirname, 'android'),
  root: __dirname,
};

bootstrap
  .command('ios')
  .description('Bootstrap iOS')
  .option('--new-architecture', 'Enable new architecture', true)
  .action(async (_, options: {newArchitecture: boolean}) => {
    await pauseWatchman(async () => {
      await run(
        apple.bootstrap({
          cwd: cwd.ios,
          hermes: true,
          newArchitecture: options.newArchitecture,
        }),
      );
    });
  });

const build = program.command('build');

type BuildOptions = {
  newArchitecture: boolean,
  hermes: boolean,
  onlyBuild: boolean,
  device: string,
};

build
  .command('ios')
  .description('Builds & run your app for iOS')
  .option('--new-architecture', 'Enable new architecture')
  .option('--hermes', 'Use Hermes or point to a prebuilt tarball', true)
  .option('--only-build', 'Build but do not run', false)
  .option('--device', 'Any simulator or a specific device', 'simulator')
  .action(async (options: BuildOptions) => {
    let device: IOSDevice;
    try {
      device = await getSimulatorDetails(options.device);
    } catch (e) {
      console.log(chalk.bold.red(e.message));
      process.exit(1);
    }

    if (device == null) {
      return;
    }

    const settings = {
      appPath: '',
      bundleId: '',
      bundleBuildDir: '',
      bundleResourceDir: '',
    };

    await pauseWatchman(async () => {
      await run({
        buildSettings: {
          order: 1,
          label: 'Getting your build settings',
          action: (): void => {
            const xcode = getXcodeBuildSettings(cwd.ios)[0].buildSettings;
            settings.appPath = path.join(
              xcode.TARGET_BUILD_DIR,
              xcode.EXECUTABLE_FOLDER_PATH,
            );
            settings.bundleId = xcode.PRODUCT_BUNDLE_IDENTIFIER;
            settings.bundleBuildDir = xcode.CONFIGURATION_BUILD_DIR;
            settings.bundleResourceDir = path.join(
              xcode.CONFIGURATION_BUILD_DIR,
              xcode.UNLOCALIZED_RESOURCES_FOLDER_PATH,
            );
          },
        },
      });

      // Metro: src -> js
      const jsBundlePath = path.join(
        settings.bundleBuildDir,
        'main.jsbundle.js',
      );
      // Hermes: js -> Hermes Byte Code
      const binaryBundlePath = path.join(
        settings.bundleResourceDir,
        'main.jsbundle',
      );

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
          destination: `id=${device.udid}`,
        }),
      );

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
          target: 'hermes',
          hermes: {
            hermesc: path.join(
              cwd.ios,
              'Pods',
              'hermes-engine',
              'build_host_hermesc',
              'bin',
              'hermesc',
            ),
          },
        }),
      );
    });

    if (!options.onlyBuild) {
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
    }
  });

program
  .command('ping', {hidden: true})
  .option('--pong <text>', 'Whom?')
  .action((options: null | {pong: string}) => {
    if (options?.pong === 'hello') {
      process.stdout.write('Donkey Kong!');
    }
  });

if (require.main === module) {
  // Built for our CI to add arguments more easily
  handlePipedArgs()
    .then(args => program.parse([...process.argv, ...args]))
    .catch(e => process.stderr.write(e));
}

export default program;
