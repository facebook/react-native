/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

// metro-visualizer is not listed as a dependency of metro since it pulls a lot
// of transitive dependencies so we need to tell flow that it may exist.
declare module 'metro-visualizer' {
  declare module.exports: any;
}
