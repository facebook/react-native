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

import type {Task} from './types';
import type {Options as ExecaOptions} from 'execa';

import {isMacOS, isWindows, task} from './utils';
import execa from 'execa';
import {existsSync, readdirSync, rm} from 'fs';
import os from 'os';
import path from 'path';

type CleanTasks = {
  android: (androidSrcDir: ?string) => Task[],
  cocoapods?: (projectRootDir: string) => Task[],
  metro: () => Task[],
  npm: (projectRootDir: string, verifyCache?: boolean) => Task[],
  watchman: (projectRootDir: string) => Task[],
  yarn: (projectRootDir: string) => Task[],
};

const rmrf = (pathname: string) => {
  if (!existsSync(pathname)) {
    return;
  }
  rm(pathname, {force: true, maxRetries: 3, recursive: true});
};

/**
 * Removes the contents of a directory matching a given pattern, but keeps the directory.
 * @private
 */
export function deleteDirectoryContents(
  directory: string,
  filePattern: RegExp,
): Task['action'] {
  return async function deleteDirectoryContentsAction() {
    const base = path.dirname(directory);
    const files = readdirSync(base).filter((filename: string) =>
      filePattern.test(filename),
    );
    for (const filename of files) {
      rmrf(path.join(base, filename));
    }
  };
}

/**
 * Removes a directory recursively.
 * @private
 */
export function deleteDirectory(directory: string): Task['action'] {
  return async function cleanDirectoryAction() {
    rmrf(directory);
  };
}

/**
 * Deletes the contents of the tmp directory matching a given pattern.
 * @private
 */
export function deleteTmpDirectoryContents(
  filepattern: RegExp,
): ReturnType<typeof deleteDirectoryContents> {
  return deleteDirectoryContents(os.tmpdir(), filepattern);
}

// The tasks that cleanup various build artefacts.
export const tasks: CleanTasks = {
  /**
   * Cleans up the Android Gradle cache
   */
  android: (androidSrcDir: ?string) => [
    task('🧹 Clean Gradle cache', async function gradle(opts?: ExecaOptions) {
      const gradlew = path.join(
        androidSrcDir ?? 'android',
        isWindows ? 'gradlew.bat' : 'gradlew',
      );

      if (!existsSync(gradlew)) {
        return;
      }
      const script = path.basename(gradlew);
      const cwd = path.dirname(gradlew);
      await execa(isWindows ? script : `./${script}`, ['clean'], {
        cwd,
        ...opts,
      });
    }),
  ],

  /**
   * Agressively cleans up all Metro caches.
   */
  metro: () => [
    task('🧹 Clean Metro cache', deleteTmpDirectoryContents(/^metro-.+/)),
    task('🧹 Clean Haste cache', deleteTmpDirectoryContents(/^haste-map-.+/)),
    task(
      '🧹 Clean React Native cache',
      deleteTmpDirectoryContents(/^react-.+/),
    ),
  ],

  /**
   * Cleans up the `node_modules` folder and optionally garbage collects the npm cache.
   */
  npm: (projectRootDir: string, verifyCache = false) => {
    const _tasks = [
      task(
        '🧹 Clean node_modules',
        deleteDirectory(path.join(projectRootDir, 'node_modules')),
      ),
    ];
    if (verifyCache) {
      _tasks.push(
        task('🔬 Verify npm cache', (opts?: ExecaOptions) =>
          execa('npm', ['cache', 'verify'], {cwd: projectRootDir, ...opts}),
        ),
      );
    }
    return _tasks;
  },

  /**
   * Stops Watchman and clears its cache
   */
  watchman: (projectRootDir: string) => [
    task('✋ Stop Watchman', (opts?: ExecaOptions) =>
      execa(isWindows ? 'tskill' : 'killall', ['watchman'], {
        cwd: projectRootDir,
        ...opts,
      }),
    ),
    task('🧹 Delete Watchman cache', (opts?: ExecaOptions) =>
      execa('watchman', ['watch-del-all'], {cwd: projectRootDir, ...opts}),
    ),
  ],

  /**
   * Cleans up the Yarn cache
   */
  yarn: (projectRootDir: string) => [
    task('🧹 Clean Yarn cache', (opts?: ExecaOptions) =>
      execa('yarn', ['cache', 'clean'], {cwd: projectRootDir, ...opts}),
    ),
  ],
};

if (isMacOS) {
  /**
   * Cleans up the local and global CocoaPods cache
   */
  tasks.cocoapods = (projectRootDir: string) => [
    // TODO: add project root
    task(
      '🧹 Clean CocoaPods pod cache',
      function removePodCache(opts?: ExecaOptions) {
        return execa('bundle', ['exec', 'pod', 'deintegrate'], {
          cwd: projectRootDir,
          ...opts,
        });
      },
    ),
  ];
}

//
// Internal CLI
//
