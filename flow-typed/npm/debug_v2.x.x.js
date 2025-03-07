/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

// https://github.com/visionmedia/debug
// https://www.npmjs.com/package/debug

interface DebugFN {
  (...args: Array<mixed>): void;
  enable(match: string): void;
  disable(): void;
  enabled: () => boolean;
}

declare module 'debug' {
  declare module.exports: {
    (namespace: string): DebugFN,
    enable(match: string): void,
    disable(): void,
    enabled: () => boolean,
  };
}
