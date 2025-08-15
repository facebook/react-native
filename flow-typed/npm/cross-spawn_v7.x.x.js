/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

declare module 'cross-spawn' {
  import * as child_process from 'child_process';

  type spawn = typeof child_process.spawn & {
    spawn: spawn,
    sync: typeof child_process.spawnSync,
  };

  declare module.exports: spawn;
}
