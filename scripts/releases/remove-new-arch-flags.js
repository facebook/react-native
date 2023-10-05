/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 * @oncall react-native
 */

'use strict';

const fs = require('fs');

function removeNewArchFlags() {
  console.log('Removing new arch flags');
  const cwd = getValidCwd();

  const iosBackups = removeFlagsForiOS(cwd);

  const androidBackups = flipNewArchFlagForAndroid(cwd);

  iosBackups.concat(androidBackups).forEach(file => {
    fs.unlinkSync(file);
  });
}

// === Helpers ===
function getValidCwd() /*: string*/ {
  const cwd = process.cwd();

  if (!cwd.endsWith('react-native-github')) {
    throw new Error(
      `Please call this script from react-native root folder. Current path: ${cwd}`,
    );
  }
  return cwd;
}

function replaceContentsOfFile(
  contentToBeReplaced /*: string | RegExp*/,
  replacement /*: string*/,
  path /*: string*/,
) /*: string*/ {
  console.log(contentToBeReplaced);
  console.log(replacement);
  const content = fs.readFileSync(path, 'utf8');

  const backupPath = `${path}.bak`;
  fs.writeFileSync(backupPath, content, 'utf8');
  let newContent = content.replaceAll(contentToBeReplaced, replacement);
  fs.writeFileSync(path, newContent, 'utf8');
  return backupPath;
}

function removeContentsFromFile(
  contentToBeRemoved /*: string | RegExp*/,
  path /*: string*/,
) /*: string*/ {
  return replaceContentsOfFile(contentToBeRemoved, '', path);
}

function removeFlagsForiOS(cwd /*: string*/) /*: $ReadOnlyArray<string>*/ {
  let backupPath /*: Array<string>*/ = [];
  const iosPath = `${cwd}/packages/react-native/scripts/react_native_pods.rb`;
  backupPath.push(
    removeContentsFromFile(
      / {2}fabric_enabled: false,\n {2}new_arch_enabled: NewArchitectureHelper.new_arch_enabled,\n/g,
      iosPath,
    ),
  );
  return backupPath;
}

function newArchEnabledGradleProps(boolValue /*: boolean*/) /*: string */ {
  return `newArchEnabled=${boolValue.toString()}`;
}

function flipNewArchFlagForAndroid(
  cwd /*: string */,
) /*: $ReadOnlyArray<string>*/ {
  let backupPath /*: Array<string> */ = [];

  // Gradle.properties
  const gradlePropertiesPath = `${cwd}/packages/react-native/template/android/gradle.properties`;
  backupPath.push(
    replaceContentsOfFile(
      new RegExp(newArchEnabledGradleProps(false), 'g'),
      newArchEnabledGradleProps(true),
      gradlePropertiesPath,
    ),
  );

  return backupPath;
}
// ===============

module.exports = removeNewArchFlags;

if (require.main === module) {
  removeNewArchFlags();
}
