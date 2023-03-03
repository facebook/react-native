/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const yargs = require('yargs');
const fs = require('fs');

const CONFIG_FILE_NAME = 'react-native.config.js';
const LEGACY_COMPONENTS_FIELD = 'unstable_reactLegacyComponent';
const OUTPUT_FILE_NAME = 'RCTLegacyInteropComponents.mm';

const argv = yargs
  .option('p', {
    alias: 'path',
    description: 'Path to React Native application',
  })
  .option('o', {
    alias: 'outputPath',
    description: 'Path where generated artifacts will be output to',
  })
  .usage('Usage: $0 -p [path to app]')
  .demandOption(['p']).argv;

const appRoot = argv.path;
const outputPath = argv.outputPath;

function fileBody(components) {
  // eslint-disable duplicate-license-header
  return `
/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTLegacyInteropComponents.h"

@implementation RCTLegacyInteropComponents

+ (NSArray<NSString *> *)legacyInteropComponents
{
  return @[
${components}
  ];
}

@end
`;
  // eslint-enable duplicate-license-header
}

function generateRCTLegacyInteropComponents() {
  const configFilePath = `${appRoot}/${CONFIG_FILE_NAME}`;
  let reactNativeConfig = null;
  try {
    reactNativeConfig = require(configFilePath);
  } catch (error) {
    console.log(`No ${configFilePath}. Skip LegacyInterop generation`);
  }

  if (reactNativeConfig && reactNativeConfig[LEGACY_COMPONENTS_FIELD]) {
    let componentsArray = reactNativeConfig[LEGACY_COMPONENTS_FIELD].map(
      name => `\t\t\t@"${name}",`,
    );
    // Remove the last comma
    if (componentsArray.length > 0) {
      componentsArray[componentsArray.length - 1] = componentsArray[
        componentsArray.length - 1
      ].slice(0, -1);
    }

    const filePath = `${outputPath}/${OUTPUT_FILE_NAME}`;
    fs.writeFileSync(filePath, fileBody(componentsArray.join('\n')));
  } else {
    console.log(
      `No '${LEGACY_COMPONENTS_FIELD}' field. Skip LegacyInterop generation`,
    );
  }
}

generateRCTLegacyInteropComponents();
