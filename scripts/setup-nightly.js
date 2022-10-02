#!/usr/bin/env node
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const fs = require('fs');
const path = require('path');
const {exit} = require('process');

const ROOT_DIR = path.join(__dirname, '..');

// Version for nightly build. Since third party libraries used to check the minor version for feature detections.
// The nightly build version we published to npm is `0.0.0` which will break third party libraries assumption.
// This script will overwrite the nightly build version as `999.999.999`.
const NIGHTLY_VERSION = '999.999.999';

async function main() {
  // Rewrite version in _package.json_
  const packageJsonPath = path.join(ROOT_DIR, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  packageJson.version = NIGHTLY_VERSION;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

  // Rewrite version in _ReactAndroid/gradle.properties_
  const gradlePropertiesPath = path.join(
    ROOT_DIR,
    'ReactAndroid',
    'gradle.properties',
  );
  let content = fs.readFileSync(gradlePropertiesPath, 'utf-8');
  content = content.replace(/^(VERSION_NAME)(.*)$/gm, `$1=${NIGHTLY_VERSION}`);
  fs.writeFileSync(gradlePropertiesPath, content);
}

main().then(() => {
  exit(0);
});
