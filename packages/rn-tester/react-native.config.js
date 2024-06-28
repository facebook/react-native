/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

// Inside the React Native monorepo, we need to explicitly extend the base
// CLI config as the adjacent package will not be conventionally discovered.
const config = require('../react-native/react-native.config.js');
const path = require('path');

const folder = (dep, ...folders) => path.join(path.dirname(require.resolve(dep)), ...folders);

// Hard coding these to drop the @react-native-community/cli-platform-{ios,android} dependencies. This
// is the cleaned up output from npx @react-native-community/cli config.
const dependencies = {
  '@react-native/oss-library-example': {
    root: folder('@react-native/oss-library-example'),
    name: '@react-native/oss-library-example',
    platforms: {
      ios: {
        podspecPath: folder('@react-native/oss-library-example', 'OSSLibraryExample.podspec'),
        version: '0.76.0-main',
        configurations: [],
        scriptPhases: [],
      },
      android: {
        sourceDir: folder('@react-native/oss-library-example', 'android'),
        packageImportPath: 'import com.facebook.react.osslibraryexample.OSSLibraryExamplePackage;',
        packageInstance: 'new OSSLibraryExamplePackage()',
        buildTypes: [],
        libraryName: 'OSSLibraryExampleSpec',
        componentDescriptors: [
          'SampleNativeComponentComponentDescriptor',
        ],
        cmakeListsPath: folder('@react-native/oss-library-example', 'android', 'src', 'main', 'jni', 'CMakeLists.txt'),
        cxxModuleCMakeListsModuleName: null,
        cxxModuleCMakeListsPath: null,
        cxxModuleHeaderName: null,
      },
    },
  },
  '@react-native/popup-menu-android': {
    root: folder('@react-native/popup-menu-android'),
    name: '@react-native/popup-menu-android',
    platforms: {
      ios: null,
      android: {
        sourceDir: folder('@react-native/popup-menu-android', 'android'),
        packageImportPath: 'import com.facebook.react.popupmenu.PopupMenuPackage;',
        packageInstance: 'new PopupMenuPackage()',
        buildTypes: [],
        libraryName: 'ReactPopupMenuAndroidSpecs',
        componentDescriptors: [
          'AndroidPopupMenuComponentDescriptor',
        ],
        cmakeListsPath: folder('@react-native/popup-menu-android/android/src/main/jni/CMakeLists.txt'),
        cxxModuleCMakeListsModuleName: null,
        cxxModuleCMakeListsPath: null,
        cxxModuleHeaderName: null,
      },
    },
  },
};


module.exports = {
  ...config,
  root: path.resolve('.'),
  reactNativePath: path.resolve('../react-native'),
  dependencies,
  project: {
    ios: {
      sourceDir: path.resolve('.'),
    },
    android: {
      sourceDir: path.resolve('../../'),
      // To remove once the CLI fix for manifestPath search path is landed.
      manifestPath:
        'packages/rn-tester/android/app/src/main/AndroidManifest.xml',
      packageName: 'com.facebook.react.uiapp',
      watchModeCommandParams: ['--mode HermesDebug'],
    },
  },
};
