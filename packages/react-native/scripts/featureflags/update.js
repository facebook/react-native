/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import generateFiles from './generateFiles';
import fs from 'fs';
import path from 'path';

const REACT_NATIVE_PACKAGE_ROOT = path.join(__dirname, '..', '..');

export default function update(verifyUnchanged: boolean): void {
  generateFiles(
    {
      featureFlagDefinitions: JSON.parse(
        fs.readFileSync(
          path.join(__dirname, 'ReactNativeFeatureFlags.json'),
          'utf8',
        ),
      ),
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
      verifyUnchanged,
    },
  );
}
