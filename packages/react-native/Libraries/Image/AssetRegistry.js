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

import type {PackagerAsset} from '@react-native/assets-registry/registry';

const AssetRegistry = require('@react-native/assets-registry/registry') as {
  registerAsset: (asset: PackagerAsset) => number,
  getAssetByID: (assetId: number) => PackagerAsset,
};

module.exports = AssetRegistry;
