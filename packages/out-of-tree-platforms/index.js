/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {CustomResolver} from 'metro-resolver';

type ResolverConfig = {
  platformNameMap: {[platform: string]: string},
};

/**
 * Creates a custom Metro resolver that maps platform extensions to package names.
 * To be used in app's `metro.config.js` as `resolver.resolveRequest`.
 */
const getPlatformResolver = (config: ResolverConfig): CustomResolver => {
  return (context, moduleName, platform) => {
    // `customResolverOptions` is populated through `?resolver.platformExtension` query params
    // in the jsBundleURLForBundleRoot method of the react-native/React/Base/RCTBundleURLProvider.mm
    const platformExtension = context.customResolverOptions?.platformExtension;
    let modifiedModuleName = moduleName;

    if (
      typeof platformExtension === 'string' &&
      config.platformNameMap?.[platformExtension]
    ) {
      const packageName = config.platformNameMap[platformExtension];
      if (moduleName === 'react-native') {
        modifiedModuleName = packageName;
      } else if (moduleName.startsWith('react-native/')) {
        modifiedModuleName = `${packageName}/${modifiedModuleName.slice(
          'react-native/'.length,
        )}`;
      }
    }

    return context.resolveRequest(context, modifiedModuleName, platform);
  };
};

module.exports = {getPlatformResolver};
