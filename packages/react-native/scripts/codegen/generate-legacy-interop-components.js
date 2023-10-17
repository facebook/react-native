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
const p = require('path');

const CONFIG_FILE_NAME = 'react-native.config.js';
const PROJECT_FIELD = 'project';
const IOS_FIELD = 'ios';
const LEGACY_COMPONENTS_FIELD = 'unstable_reactLegacyComponentNames';
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

function extractComponentsNames(reactNativeConfig) {
  if (!reactNativeConfig) {
    console.log('No reactNativeConfig in the react-native.config.js file');
    return null;
  }

  const project = reactNativeConfig[PROJECT_FIELD];

  if (!project) {
    console.log(`No ${PROJECT_FIELD} in the react-native config`);
    return null;
  }

  const ios = project[IOS_FIELD];

  if (!ios) {
    console.log(
      `No ${IOS_FIELD} in the ${PROJECT_FIELD} object of the config file`,
    );
    return null;
  }

  const componentNames = ios[LEGACY_COMPONENTS_FIELD];

  if (!componentNames) {
    console.log(
      `No '${LEGACY_COMPONENTS_FIELD}' field in the ${PROJECT_FIELD}.${IOS_FIELD} object`,
    );
    return null;
  }
  return componentNames;
}

function generateRCTLegacyInteropComponents() {
  const cwd = process.cwd();
  const configFilePath = p.join(cwd, appRoot, CONFIG_FILE_NAME);
  console.log(
    `Looking for a react-native.config.js file at ${configFilePath}...`,
  );
  let reactNativeConfig = null;
  try {
    reactNativeConfig = require(configFilePath);
  } catch (error) {
    console.log(`No ${configFilePath}. Skip LegacyInterop generation`);
    return;
  }

  const componentNames = extractComponentsNames(reactNativeConfig);
  if (!componentNames) {
    console.log('Skip LegacyInterop generation');
    return;
  }
  console.log(`Components found: ${componentNames}`);
  let componentsArray = componentNames.map(name => `\t\t\t@"${name}",`);
  // Remove the last comma
  if (componentsArray.length > 0) {
    componentsArray[componentsArray.length - 1] = componentsArray[
      componentsArray.length - 1
    ].slice(0, -1);
  }

  const filePath = `${outputPath}/${OUTPUT_FILE_NAME}`;
  fs.writeFileSync(filePath, fileBody(componentsArray.join('\n')));
  console.log(`${filePath} updated!`);
}

generateRCTLegacyInteropComponents();
