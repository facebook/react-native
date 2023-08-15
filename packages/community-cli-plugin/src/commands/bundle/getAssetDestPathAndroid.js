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

import type {PackagerAsset} from './assetPathUtils';

import path from 'path';
import assetPathUtils from './assetPathUtils';

function getAssetDestPathAndroid(asset: PackagerAsset, scale: number): string {
  const androidFolder = assetPathUtils.getAndroidResourceFolderName(
    asset,
    scale,
  );
  const fileName = assetPathUtils.getResourceIdentifier(asset);
  return path.join(androidFolder, `${fileName}.${asset.type}`);
}

export default getAssetDestPathAndroid;
