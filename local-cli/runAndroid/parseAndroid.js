/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */
const fs = require('fs');

/**
 * Finds the `package=` line in AndroidManifest.xml
 */
function getPackageNameFromManifest() {
  const packageName = fs.readFileSync(
    'app/src/main/AndroidManifest.xml',
    'utf8'
  ).match(/package="(.+?)"/)[1];
  return packageName;
}

/**
 * Looks at app/build.gradle and tries to determine the appIdSuffix for the supplied variant
 */
function getAppIdFromGradle(variantName) {
  const gradleFile = fs.readFileSync('app/build.gradle', 'utf8');

  const appIdMatch = gradleFile.match(/applicationId "(.+?)"/);
  if (!appIdMatch) {
    return null;
  }
  const appId = appIdMatch[1];
  const buildTypes = gradleFile.substr(gradleFile.indexOf('buildTypes'));
  const buildLoc = buildTypes.indexOf(variantName);
  let appIdSuffix = '';

  if (buildLoc >= 0) {
    const buildSectionPlus = buildTypes.substr(buildLoc);
    const buildSection = buildSectionPlus.substr(0, buildSectionPlus.indexOf('}'));
    const appIdSuffixMatch = buildSection.match(/applicationIdSuffix "(.+?)"/);
    if (appIdSuffixMatch) {
      appIdSuffix = appIdSuffixMatch[1];
    }
  }
  return appId + appIdSuffix;
}

module.exports = {
  getPackageNameFromManifest: getPackageNameFromManifest,
  getAppIdFromGradle: getAppIdFromGradle
};