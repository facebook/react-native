/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 * @oncall react_native
 */

import type {ExecaPromise, SyncResult} from 'execa';

import path from 'path';
import fs from 'fs';
import execa from 'execa';
import {
  CLIError,
  logger,
  resolveNodeModuleDir,
} from '@react-native-community/cli-tools';

export function startServerInNewWindow(
  port: number,
  terminal: string,
  projectRoot: string,
  reactNativePath: string,
): SyncResult | ExecaPromise | CLIError | void {
  /**
   * Set up OS-specific filenames and commands
   */
  const isWindows = /^win/.test(process.platform);
  const scriptFile = isWindows
    ? 'launchPackager.bat'
    : 'launchPackager.command';
  const packagerEnvFilename = isWindows ? '.packager.bat' : '.packager.env';
  const packagerEnvFileExportContent = isWindows
    ? `set RCT_METRO_PORT=${port}\nset PROJECT_ROOT=${projectRoot}\nset REACT_NATIVE_PATH=${reactNativePath}`
    : `export RCT_METRO_PORT=${port}\nexport PROJECT_ROOT=${projectRoot}\nexport REACT_NATIVE_PATH=${reactNativePath}`;
  const nodeModulesPath = resolveNodeModuleDir(projectRoot, '.bin');
  const cliPluginMetroPath = path.join(
    path.dirname(
      require.resolve('@react-native/community-cli-plugin/package.json'),
    ),
    'build',
  );

  /**
   * Set up the `.packager.(env|bat)` file to ensure the packager starts on the right port and in right directory.
   */
  const packagerEnvFile = path.join(nodeModulesPath, `${packagerEnvFilename}`);

  /**
   * Set up the `launchPackager.(command|bat)` file.
   * It lives next to `.packager.(bat|env)`
   */
  const launchPackagerScript = path.join(nodeModulesPath, scriptFile);
  const procConfig = {cwd: path.dirname(packagerEnvFile)};

  /**
   * Ensure we overwrite file by passing the `w` flag
   */
  fs.writeFileSync(packagerEnvFile, packagerEnvFileExportContent, {
    encoding: 'utf8',
    flag: 'w',
  });

  /**
   * Copy files into `node_modules/.bin`.
   */

  try {
    if (isWindows) {
      fs.copyFileSync(
        path.join(cliPluginMetroPath, 'launchPackager.bat'),
        path.join(nodeModulesPath, 'launchPackager.bat'),
      );
    } else {
      fs.copyFileSync(
        path.join(cliPluginMetroPath, 'launchPackager.command'),
        path.join(nodeModulesPath, 'launchPackager.command'),
      );
    }
  } catch (error) {
    return new CLIError(
      `Couldn't copy the script for running bundler. Please check if the "${scriptFile}" file exists in the "node_modules/@react-native/community-cli-plugin" folder and try again.`,
      error,
    );
  }

  if (process.platform === 'darwin') {
    try {
      return execa.sync(
        'open',
        ['-a', terminal, launchPackagerScript],
        procConfig,
      );
    } catch (error) {
      return execa.sync('open', [launchPackagerScript], procConfig);
    }
  }
  if (process.platform === 'linux') {
    try {
      return execa.sync(terminal, ['-e', `sh ${launchPackagerScript}`], {
        ...procConfig,
        detached: true,
      });
    } catch (error) {
      // By default, the child shell process will be attached to the parent
      return execa.sync('sh', [launchPackagerScript], procConfig);
    }
  }
  if (isWindows) {
    // Awaiting this causes the CLI to hang indefinitely, so this must execute without await.
    return execa('cmd.exe', ['/C', launchPackagerScript], {
      ...procConfig,
      detached: true,
      stdio: 'ignore',
    });
  }
  logger.error(
    `Cannot start the packager. Unknown platform ${process.platform}`,
  );
  return;
}
