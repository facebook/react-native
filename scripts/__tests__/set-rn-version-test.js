/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const echoMock = jest.fn();
const catMock = jest.fn();
const sedMock = jest.fn();
const writeFileSyncMock = jest.fn();
const updateTemplatePackageMock = jest.fn();

jest
  .mock('shelljs', () => ({
    echo: echoMock,
    cat: catMock,
    sed: sedMock,
  }))
  .mock('./../update-template-package', () => updateTemplatePackageMock)
  .mock('fs', () => ({
    writeFileSync: writeFileSyncMock,
    mkdtempSync: () => './rn-set-version/',
  }));

const setReactNativeVersion = require('../set-rn-version');

describe('set-rn-version', () => {
  afterEach(() => {
    jest.resetModules();
    jest.resetAllMocks();
  });

  it('should set nightly version', () => {
    catMock.mockImplementation(path => {
      if (path === 'packages/react-native/package.json') {
        return '{"name": "myPackage", "version": 2, "dependencies": {"@react-native/package-a": "nightly", "@react-native/package-b": "^0.73.0"}}';
      } else if (
        path === 'scripts/versiontemplates/ReactNativeVersion.java.template' ||
        path === 'scripts/versiontemplates/RCTVersion.m.template' ||
        path === 'scripts/versiontemplates/ReactNativeVersion.h.template' ||
        path === 'scripts/versiontemplates/ReactNativeVersion.js.template'
      ) {
        return '{major: ${major}, minor: ${minor}, patch: ${patch}, prerelease: ${prerelease}}';
      } else {
        throw new Error(`Invalid path passed for package dir. Path: ${path}`);
      }
    });

    sedMock.mockReturnValueOnce({code: 0});

    const version = '0.81.0-nightly-29282302-abcd1234';
    const nightlyVersions = {
      '@react-native/package-a': version,
    };
    setReactNativeVersion(version, nightlyVersions, 'nightly');

    expect(sedMock).toHaveBeenCalledWith(
      '-i',
      /^VERSION_NAME=.*/,
      `VERSION_NAME=${version}`,
      'packages/react-native/ReactAndroid/gradle.properties',
    );
    expect(writeFileSyncMock.mock.calls.length).toBe(5);
    expect(writeFileSyncMock.mock.calls[0][0]).toBe(
      'packages/react-native/ReactAndroid/src/main/java/com/facebook/react/modules/systeminfo/ReactNativeVersion.java',
    );
    expect(writeFileSyncMock.mock.calls[0][1]).toBe(
      '{major: 0, minor: 81, patch: 0, prerelease: "nightly-29282302-abcd1234"}',
    );
    expect(writeFileSyncMock.mock.calls[1][0]).toBe(
      'packages/react-native/React/Base/RCTVersion.m',
    );
    expect(writeFileSyncMock.mock.calls[2][0]).toBe(
      'packages/react-native/ReactCommon/cxxreact/ReactNativeVersion.h',
    );
    expect(writeFileSyncMock.mock.calls[3][0]).toBe(
      'packages/react-native/Libraries/Core/ReactNativeVersion.js',
    );
    expect(writeFileSyncMock.mock.calls[4][0]).toBe(
      'packages/react-native/package.json',
    );
    expect(writeFileSyncMock.mock.calls[4][1]).toBe(`{
  "name": "myPackage",
  "version": "${version}",
  "dependencies": {
    "@react-native/package-a": "0.81.0-nightly-29282302-abcd1234",
    "@react-native/package-b": "^0.73.0"
  }
}`);

    expect(updateTemplatePackageMock).toHaveBeenCalledWith({
      '@react-native/package-a': '0.81.0-nightly-29282302-abcd1234',
      'react-native': version,
    });
  });

  it('should set release version', () => {
    catMock.mockImplementation(path => {
      if (path === 'packages/react-native/package.json') {
        return '{"name": "myPackage", "version": 2}';
      }
      return 'exports.version = {major: ${major}, minor: ${minor}, patch: ${patch}, prerelease: ${prerelease}}';
    });

    sedMock.mockReturnValueOnce({code: 0});

    const version = '0.81.0';
    setReactNativeVersion(version, null, 'release');

    expect(sedMock).toHaveBeenCalledWith(
      '-i',
      /^VERSION_NAME=.*/,
      `VERSION_NAME=${version}`,
      'packages/react-native/ReactAndroid/gradle.properties',
    );
    expect(writeFileSyncMock.mock.calls.length).toBe(5);
    expect(writeFileSyncMock.mock.calls[0][0]).toBe(
      'packages/react-native/ReactAndroid/src/main/java/com/facebook/react/modules/systeminfo/ReactNativeVersion.java',
    );
    expect(writeFileSyncMock.mock.calls[0][1]).toBe(
      'exports.version = {major: 0, minor: 81, patch: 0, prerelease: null}',
    );
    expect(writeFileSyncMock.mock.calls[4][0]).toBe(
      'packages/react-native/package.json',
    );
    expect(writeFileSyncMock.mock.calls[4][1]).toBe(
      `{\n  "name": "myPackage",\n  "version": "${version}"\n}`,
    );

    expect(updateTemplatePackageMock).toHaveBeenCalledWith({
      'react-native': version,
    });
  });

  it('should set prealpha version', () => {
    catMock.mockImplementation(path => {
      if (path === 'packages/react-native/package.json') {
        return '{"name": "myPackage", "version": 2, "dependencies": {"@react-native/package-a": "prealpha", "@react-native/package-b": "^0.73.0"}}';
      } else if (
        path === 'scripts/versiontemplates/ReactNativeVersion.java.template' ||
        path === 'scripts/versiontemplates/RCTVersion.m.template' ||
        path === 'scripts/versiontemplates/ReactNativeVersion.h.template' ||
        path === 'scripts/versiontemplates/ReactNativeVersion.js.template'
      ) {
        return '{major: ${major}, minor: ${minor}, patch: ${patch}, prerelease: ${prerelease}}';
      } else {
        throw new Error(`Invalid path passed for package dir. Path: ${path}`);
      }
    });

    sedMock.mockReturnValueOnce({code: 0});

    const version = '0.0.0-prealpha-2023100415';
    const nightlyVersions = {
      '@react-native/package-a': version,
    };
    setReactNativeVersion(version, nightlyVersions, 'prealpha');

    expect(sedMock).toHaveBeenCalledWith(
      '-i',
      /^VERSION_NAME=.*/,
      `VERSION_NAME=${version}`,
      'packages/react-native/ReactAndroid/gradle.properties',
    );
    expect(writeFileSyncMock.mock.calls.length).toBe(5);
    expect(writeFileSyncMock.mock.calls[0][0]).toBe(
      'packages/react-native/ReactAndroid/src/main/java/com/facebook/react/modules/systeminfo/ReactNativeVersion.java',
    );
    expect(writeFileSyncMock.mock.calls[0][1]).toBe(
      '{major: 0, minor: 0, patch: 0, prerelease: "prealpha-2023100415"}',
    );
    expect(writeFileSyncMock.mock.calls[1][0]).toBe(
      'packages/react-native/React/Base/RCTVersion.m',
    );
    expect(writeFileSyncMock.mock.calls[2][0]).toBe(
      'packages/react-native/ReactCommon/cxxreact/ReactNativeVersion.h',
    );
    expect(writeFileSyncMock.mock.calls[3][0]).toBe(
      'packages/react-native/Libraries/Core/ReactNativeVersion.js',
    );
    expect(writeFileSyncMock.mock.calls[4][0]).toBe(
      'packages/react-native/package.json',
    );
    expect(writeFileSyncMock.mock.calls[4][1]).toBe(`{
  "name": "myPackage",
  "version": "${version}",
  "dependencies": {
    "@react-native/package-a": "0.0.0-prealpha-2023100415",
    "@react-native/package-b": "^0.73.0"
  }
}`);

    expect(updateTemplatePackageMock).toHaveBeenCalledWith({
      '@react-native/package-a': '0.0.0-prealpha-2023100415',
      'react-native': version,
    });
  });
});
