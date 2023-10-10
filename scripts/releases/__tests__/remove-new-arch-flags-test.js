/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @oncall react-native
 */

const fs = require('fs');
const path = require('path');
const removeNewArchFlags = require('../remove-new-arch-flags');
const {
  validReactNativePodsFile,
  invalidReactNativePodsFile,
  expectedReactNativePodsFile,
  validGradlePropertiesFile,
  invalidGradlePropertiesFile,
  expectedGradlePropertiesFile,
} = require('./__fixtures__/remove-new-arch-flags-fixture');

describe('removeNewArchFlags', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });
  it('throws an exception if not run from react-native-github', async () => {
    jest.spyOn(process, 'cwd').mockReturnValue('/path/to/react-native');
    expect(removeNewArchFlags).toThrow();
  });

  it('it updates the required files', async () => {
    const cwd = '/path/to/react-native-github';
    const reactNativePodsPath =
      '/packages/react-native/scripts/react_native_pods.rb';
    const templateGradlePropertiesPath =
      '/packages/react-native/template/android/gradle.properties';
    jest.spyOn(process, 'cwd').mockReturnValue(cwd);
    jest.spyOn(fs, 'readFileSync').mockImplementation(filename => {
      if (filename === path.join(cwd, reactNativePodsPath)) {
        return validReactNativePodsFile;
      } else if (filename === path.join(cwd, templateGradlePropertiesPath)) {
        return validGradlePropertiesFile;
      } else {
        throw new Error(`Unexpected call to fs.readFileSync(${filename}).`);
      }
    });
    let returnedReactNativePodsBackup = '';
    let returnedReactNativePods = '';
    let returnedGradlePropertiesBackup = '';
    let returnedGradleProperties = '';
    jest.spyOn(fs, 'writeFileSync').mockImplementation((filename, content) => {
      if (filename === path.join(cwd, `${reactNativePodsPath}.bak`)) {
        returnedReactNativePodsBackup = content;
      } else if (filename === path.join(cwd, reactNativePodsPath)) {
        returnedReactNativePods = content;
      } else if (
        filename === path.join(cwd, `${templateGradlePropertiesPath}.bak`)
      ) {
        returnedGradlePropertiesBackup = content;
      } else if (filename === path.join(cwd, templateGradlePropertiesPath)) {
        returnedGradleProperties = content;
      } else {
        throw new Error(`Unexpected call to fs.writeFileSync(${filename}).`);
      }
    });

    let deletedFiles = [];
    jest.spyOn(fs, 'unlinkSync').mockImplementation(filename => {
      deletedFiles.push(filename);
    });
    removeNewArchFlags();

    expect(returnedReactNativePodsBackup).toEqual(validReactNativePodsFile);
    expect(returnedReactNativePods).toEqual(expectedReactNativePodsFile);
    expect(returnedGradlePropertiesBackup).toEqual(validGradlePropertiesFile);
    expect(returnedGradleProperties).toEqual(expectedGradlePropertiesFile);
    expect(deletedFiles).toEqual([
      path.join(cwd, `${reactNativePodsPath}.bak`),
      path.join(cwd, `${templateGradlePropertiesPath}.bak`),
    ]);
  });

  it('does not update the required files if they are not valid', async () => {
    const cwd = '/path/to/react-native-github';
    const reactNativePodsPath =
      '/packages/react-native/scripts/react_native_pods.rb';
    const templateGradlePropertiesPath =
      '/packages/react-native/template/android/gradle.properties';
    jest.spyOn(process, 'cwd').mockReturnValue(cwd);
    jest.spyOn(fs, 'readFileSync').mockImplementation(filename => {
      if (filename === path.join(cwd, reactNativePodsPath)) {
        return invalidReactNativePodsFile;
      } else if (filename === path.join(cwd, templateGradlePropertiesPath)) {
        return invalidGradlePropertiesFile;
      } else {
        throw new Error(`Unexpected call to fs.readFileSync(${filename}).`);
      }
    });
    let returnedReactNativePodsBackup = '';
    let returnedReactNativePods = '';
    let returnedGradlePropertiesBackup = '';
    let returnedGradleProperties = '';
    jest.spyOn(fs, 'writeFileSync').mockImplementation((filename, content) => {
      if (filename === path.join(cwd, `${reactNativePodsPath}.bak`)) {
        returnedReactNativePodsBackup = content;
      } else if (filename === path.join(cwd, reactNativePodsPath)) {
        returnedReactNativePods = content;
      } else if (
        filename === path.join(cwd, `${templateGradlePropertiesPath}.bak`)
      ) {
        returnedGradlePropertiesBackup = content;
      } else if (filename === path.join(cwd, templateGradlePropertiesPath)) {
        returnedGradleProperties = content;
      } else {
        throw new Error(`Unexpected call to fs.writeFileSync(${filename}).`);
      }
    });

    let deletedFiles = [];
    jest.spyOn(fs, 'unlinkSync').mockImplementation(filename => {
      deletedFiles.push(filename);
    });
    removeNewArchFlags();

    expect(returnedReactNativePodsBackup).toEqual(invalidReactNativePodsFile);
    expect(returnedReactNativePods).toEqual(invalidReactNativePodsFile);
    expect(returnedGradlePropertiesBackup).toEqual(invalidGradlePropertiesFile);
    expect(returnedGradleProperties).toEqual(invalidGradlePropertiesFile);
    expect(deletedFiles).toEqual([
      path.join(cwd, `${reactNativePodsPath}.bak`),
      path.join(cwd, `${templateGradlePropertiesPath}.bak`),
    ]);
  });
});
