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

declare module 'debug' {
  declare module.exports: (namespace: string) => (...Array<mixed>) => void;
}
