/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

const APPLE_PLATFORMS_MACRO_MAP = {
  ios: 'TARGET_OS_IOS',
  macos: 'TARGET_OS_OSX',
  tvos: 'TARGET_OS_TV',
  visionos: 'TARGET_OS_VISION',
};

/**
 * Adds compiler macros to the file template to exclude unsupported platforms.
 */
function generateSupportedApplePlatformsMacro(
  fileTemplate: string,
  supportedPlatformsMap: ?{[string]: boolean},
): string {
  if (!supportedPlatformsMap) {
    return fileTemplate;
  }

  const compilerMacroString = Object.keys(supportedPlatformsMap)
    .reduce((acc: string[], platform) => {
      if (!supportedPlatformsMap[platform]) {
        return [...acc, `!${APPLE_PLATFORMS_MACRO_MAP[platform]}`];
      }
      return acc;
    }, [])
    .join(' && ');

  if (!compilerMacroString) {
    return fileTemplate;
  }

  return `#if ${compilerMacroString}
${fileTemplate}
#endif
`;
}

module.exports = {
  generateSupportedApplePlatformsMacro,
};
