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

import type {CustomResolver} from 'metro-resolver';

/**
 * This is an implementation of a metro resolveRequest option which will remap react-native imports
 * to different npm packages based on the platform requested. This allows a single metro instance/config
 * to produce bundles for multiple out of tree platforms at a time.
 *
 * This resolver also supports custom `variant` option, which is intended to be used for resolving
 * different variants of the same platform, like "visionos" or "tvos" based on "ios".
 *
 * Ex (in the devserver query string):
 * - `?platform=ios&resolver.variant=visionos`
 * - `?platform=ios&resolver.variant=tvos`
 *
 * @param platformImplementations
 * A map of platform to npm package that implements that platform
 *
 * Ex:
 * {
 *    windows: 'react-native-windows'
 *    macos: 'react-native-macos'
 * }
 */
export function reactNativePlatformResolver(platformImplementations: {
  [platform: string]: string,
}): CustomResolver {
  return (context, moduleName, platform) => {
    let platformOrVariant: string | null =
      // $FlowFixMe
      context.customResolverOptions.variant || platform;
    let modifiedModuleName = moduleName;
    if (
      platformOrVariant != null &&
      platformImplementations[platformOrVariant]
    ) {
      if (moduleName === 'react-native') {
        modifiedModuleName = platformImplementations[platformOrVariant];
      } else if (moduleName.startsWith('react-native/')) {
        modifiedModuleName = `${
          platformImplementations[platformOrVariant]
        }/${modifiedModuleName.slice('react-native/'.length)}`;
      }
    }
    return context.resolveRequest(context, modifiedModuleName, platform);
  };
}
