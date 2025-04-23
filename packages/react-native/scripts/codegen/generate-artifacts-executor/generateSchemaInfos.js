/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const CodegenUtils = require('../codegen-utils');
const {codegenLog} = require('./utils');
const fs = require('fs');
const glob = require('glob');
const path = require('path');

function generateSchemaInfos(libraries) {
  return libraries.map(generateSchemaInfo);
}

function generateSchemaInfo(library, platform) {
  const pathToJavaScriptSources = path.join(
    library.libraryPath,
    library.config.jsSrcsDir,
  );
  codegenLog(`Processing ${library.config.name}`);

  const supportedApplePlatforms = extractSupportedApplePlatforms(
    library.config.name,
    library.libraryPath,
  );

  // Generate one schema for the entire library...
  return {
    library: library,
    supportedApplePlatforms,
    schema: CodegenUtils.getCombineJSToSchema().combineSchemasInFileList(
      [pathToJavaScriptSources],
      platform,
      /NativeSampleTurboModule/,
    ),
  };
}

const APPLE_PLATFORMS = ['ios', 'macos', 'tvos', 'visionos'];

function extractSupportedApplePlatforms(dependency, dependencyPath) {
  codegenLog('Searching for podspec in the project dependencies.', true);
  const podspecs = glob.sync('*.podspec', {cwd: dependencyPath});

  if (podspecs.length === 0) {
    return;
  }

  // Take the first podspec found
  const podspec = fs.readFileSync(
    path.join(dependencyPath, podspecs[0]),
    'utf8',
  );

  /**
   * Podspec can have platforms defined in two ways:
   * 1. `spec.platforms = { :ios => "11.0", :tvos => "11.0" }`
   * 2. `s.ios.deployment_target = "11.0"`
   *    `s.tvos.deployment_target = "11.0"`
   */
  const supportedPlatforms = podspec
    .split('\n')
    .filter(
      line => line.includes('platform') || line.includes('deployment_target'),
    )
    .join('');

  // Generate a map of supported platforms { [platform]: true/false }
  const supportedPlatformsMap = APPLE_PLATFORMS.reduce(
    (acc, platform) => ({
      ...acc,
      [platform]: supportedPlatforms.includes(
        getCocoaPodsPlatformKey(platform),
      ),
    }),
    {},
  );

  const supportedPlatformsList = Object.keys(supportedPlatformsMap).filter(
    key => supportedPlatformsMap[key],
  );

  if (supportedPlatformsList.length > 0) {
    codegenLog(
      `Supported Apple platforms: ${supportedPlatformsList.join(
        ', ',
      )} for ${dependency}`,
    );
  }

  return supportedPlatformsMap;
}

// Cocoapods specific platform keys
function getCocoaPodsPlatformKey(platformName) {
  if (platformName === 'macos') {
    return 'osx';
  }
  return platformName;
}

module.exports = {
  generateSchemaInfos,
  generateSchemaInfo,
  extractSupportedApplePlatforms,
};
