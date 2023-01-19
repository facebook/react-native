/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

'use strict';

declare type PackageManifest = {
  name: string,
  version: string,
  description?: string,
  private?: boolean,
  dependencies?: {[name: string]: string},
  devDependencies?: {[name: string]: string},
  ...
};
