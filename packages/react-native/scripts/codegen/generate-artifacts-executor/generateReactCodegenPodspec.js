/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const {
  REACT_NATIVE_PACKAGE_ROOT_FOLDER,
  TEMPLATES_FOLDER_PATH,
  packageJson,
} = require('./constants');
const {codegenLog} = require('./utils');
const {execSync} = require('child_process');
const fs = require('fs');
const path = require('path');

const REACT_CODEGEN_PODSPEC_TEMPLATE_PATH = path.join(
  TEMPLATES_FOLDER_PATH,
  'ReactCodegen.podspec.template',
);

function generateReactCodegenPodspec(
  appPath,
  appPkgJson,
  outputPath,
  baseOutputPath,
) {
  const inputFiles = getInputFiles(appPath, appPkgJson);
  const codegenScript = codegenScripts(appPath, baseOutputPath);
  const template = fs.readFileSync(REACT_CODEGEN_PODSPEC_TEMPLATE_PATH, 'utf8');
  const finalPodspec = template
    .replace(/{react-native-version}/, packageJson.version)
    .replace(/{input-files}/, inputFiles)
    .replace(/{codegen-script}/, codegenScript);
  const finalPathPodspec = path.join(outputPath, 'ReactCodegen.podspec');
  fs.writeFileSync(finalPathPodspec, finalPodspec);
  codegenLog(`Generated podspec: ${finalPathPodspec}`);
}

function getInputFiles(appPath, appPkgJSon) {
  const jsSrcsDir = appPkgJSon.codegenConfig?.jsSrcsDir;
  if (!jsSrcsDir) {
    return '[]';
  }

  const xcodeproj = String(
    execSync(`find ${appPath} -type d -name "*.xcodeproj"`),
  )
    .trim()
    .split('\n')
    .filter(
      projectPath =>
        !projectPath.includes('/Pods/') && // exclude Pods/Pods.xcodeproj
        !projectPath.includes('/node_modules/'), // exclude all the xcodeproj in node_modules of libraries
    )[0];
  const jsFiles = '-name "Native*.js" -or -name "*NativeComponent.js"';
  const tsFiles = '-name "Native*.ts" -or -name "*NativeComponent.ts"';
  const findCommand = `find ${path.join(appPath, jsSrcsDir)} -type f \\( ${jsFiles} -or ${tsFiles} \\)`;
  const list = String(execSync(findCommand))
    .trim()
    .split('\n')
    .sort()
    .map(filepath => `"\${PODS_ROOT}/${path.relative(xcodeproj, filepath)}"`)
    .join(',\n');
  return `[${list}]`;
}

function codegenScripts(appPath, outputPath) {
  const relativeAppPath = path.relative(outputPath, appPath);
  return `<<-SCRIPT
pushd "$PODS_ROOT/../" > /dev/null
RCT_SCRIPT_POD_INSTALLATION_ROOT=$(pwd)
popd >/dev/null

export RCT_SCRIPT_RN_DIR="$RCT_SCRIPT_POD_INSTALLATION_ROOT/${path.relative(outputPath, REACT_NATIVE_PACKAGE_ROOT_FOLDER)}"
export RCT_SCRIPT_APP_PATH="$RCT_SCRIPT_POD_INSTALLATION_ROOT/${relativeAppPath.length === 0 ? '.' : relativeAppPath}"
export RCT_SCRIPT_OUTPUT_DIR="$RCT_SCRIPT_POD_INSTALLATION_ROOT"
export RCT_SCRIPT_TYPE="withCodegenDiscovery"

SCRIPT_PHASES_SCRIPT="$RCT_SCRIPT_RN_DIR/scripts/react_native_pods_utils/script_phases.sh"
WITH_ENVIRONMENT="$RCT_SCRIPT_RN_DIR/scripts/xcode/with-environment.sh"
/bin/sh -c "$WITH_ENVIRONMENT $SCRIPT_PHASES_SCRIPT"
SCRIPT`;
}

module.exports = {
  generateReactCodegenPodspec,
};
