/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const generateFiles = require('./generateFiles');
const path = require('path');

const REACT_NATIVE_PACKAGE_ROOT = path.join(__dirname, '..', '..');

function update() {
  generateFiles(
    {
      configPath: path.join(__dirname, 'ReactNativeFeatureFlags.json'),
      jsPath: path.join(
        REACT_NATIVE_PACKAGE_ROOT,
        'src',
        'private',
        'featureflags',
      ),
      commonCxxPath: path.join(
        REACT_NATIVE_PACKAGE_ROOT,
        'ReactCommon',
        'react',
        'featureflags',
      ),
      commonNativeModuleCxxPath: path.join(
        REACT_NATIVE_PACKAGE_ROOT,
        'ReactCommon',
        'react',
        'nativemodule',
        'featureflags',
      ),
      androidPath: path.join(
        REACT_NATIVE_PACKAGE_ROOT,
        'ReactAndroid',
        'src',
        'main',
        'java',
        'com',
        'facebook',
        'react',
        'internal',
        'featureflags',
      ),
      androidJniPath: path.join(
        REACT_NATIVE_PACKAGE_ROOT,
        'ReactAndroid',
        'src',
        'main',
        'jni',
        'react',
        'featureflags',
      ),
    },
    {
      verifyUnchanged: process.argv.includes('--verify-unchanged'),
    },
  );
}

if (require.main === module) {
  update();
}
