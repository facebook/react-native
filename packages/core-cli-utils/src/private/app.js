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
import type {ExecaPromise} from 'execa';

import {task} from './utils';
import execa from 'execa';
import path from 'path';

type AppOptions = {
  cwd: string,
};

type BundleOptions =
  | {mode: 'bundle', ...AppOptions}
  | {mode: 'watch', callback?: (metro: ExecaPromise) => void, ...AppOptions};

const FIRST = 1,
  SECOND = 2;

function getNodePackagePath(packageName: string): string {
  // $FlowFixMe[prop-missing] type definition is incomplete
  return require.resolve(packageName, {cwd: [process.cwd(), ...module.paths]});
}

function metro(...args: $ReadOnlyArray<string>): ExecaPromise {
  return execa('node', [
    getNodePackagePath(path.join('metro', 'src', 'cli.js')),
    ...args,
  ]);
}

const noMetro = new Error('Metro is not available');

export const tasks = {
  bundle: (
    options: BundleOptions,
    ...args: $ReadOnlyArray<string>
  ): {
    validate: Task<void>,
    run: Task<ExecaPromise>,
  } => ({
    /* eslint-disable sort-keys */
    validate: task(FIRST, 'Check if Metro is available', () => {
      try {
        require('metro');
      } catch {
        throw noMetro;
      }
    }),

    run:
      options.mode === 'bundle'
        ? task(SECOND, 'Metro generating an .jsbundle', () =>
            metro('bundle', ...args),
          )
        : task(SECOND, 'Metro watching for changes', () => {
            const proc = metro('serve', ...args);
            return proc;
          }),
  }),
};
