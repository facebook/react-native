/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const execMock = jest.fn();
const echoMock = jest.fn();
const exitMock = jest.fn();
const catMock = jest.fn();
const sedMock = jest.fn();
const writeFileSyncMock = jest.fn();

jest
  .mock('shelljs', () => ({
    exec: execMock,
    echo: echoMock,
    exit: exitMock,
    cat: catMock,
    sed: sedMock,
  }))
  .mock('./../scm-utils', () => ({
    saveFiles: jest.fn(),
  }))
  .mock('path', () => ({
    join: () => '../packages/react-native',
  }))
  .mock('fs', () => ({
    writeFileSync: writeFileSyncMock,
    mkdtempSync: () => './rn-set-version/',
  }))
  .mock('os');

const setReactNativeVersion = require('../set-rn-version');

describe('set-rn-version', () => {
  afterEach(() => {
    jest.resetModules();
    jest.resetAllMocks();
  });

  it('should set nightly version', () => {
    catMock.mockImplementation(path => {
      if (path === 'packages/react-native/package.json') {
        return '{"name": "myPackage", "version": 2}';
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

    execMock
      .mockReturnValueOnce({code: 0})
      .mockReturnValueOnce({stdout: 'line1\nline2\nline3\n'});
    sedMock.mockReturnValueOnce({code: 0});

    const version = '0.81.0-nightly-29282302-abcd1234';
    setReactNativeVersion(version, 'nightly');

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
    expect(writeFileSyncMock.mock.calls[4][1]).toBe(
      `{\n  "name": "myPackage",\n  "version": "${version}"\n}`,
    );

    expect(exitMock.mock.calls[0][0]).toBe(0);
    expect(execMock.mock.calls[0][0]).toBe(
      `node scripts/set-rn-template-version.js ${version}`,
    );
  });

  it('should set release version', () => {
    catMock.mockImplementation(path => {
      if (path === 'packages/react-native/package.json') {
        return '{"name": "myPackage", "version": 2}';
      }
      return 'exports.version = {major: ${major}, minor: ${minor}, patch: ${patch}, prerelease: ${prerelease}}';
    });

    execMock
      .mockReturnValueOnce({code: 0})
      .mockReturnValueOnce({stdout: 'line1\nline2\nline3\n'});
    sedMock.mockReturnValueOnce({code: 0});

    const version = '0.81.0';
    setReactNativeVersion(version, 'release');

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

    expect(exitMock.mock.calls[0][0]).toBe(0);
    expect(execMock.mock.calls[0][0]).toBe(
      `node scripts/set-rn-template-version.js ${version}`,
    );
    expect(execMock.mock.calls[1][0]).toBe(
      `diff -r ./rn-set-version/ . | grep '^[>]' | grep -c ${version} `,
    );
  });

  it('should fail validation', () => {
    catMock.mockReturnValue('{}');

    execMock
      .mockReturnValueOnce({code: 0})
      .mockReturnValueOnce({stdout: 'line1\nline2\n'});
    sedMock.mockReturnValueOnce({code: 0});
    const filesToValidate = [
      'packages/react-native/package.json',
      'packages/react-native/ReactAndroid/gradle.properties',
      'packages/react-native/template/package.json',
    ];

    const version = '0.81.0';
    setReactNativeVersion(version, 'release');

    expect(exitMock).toHaveBeenCalledWith(0);
    expect(echoMock).toHaveBeenNthCalledWith(
      1,
      'The tmp versioning folder is ./rn-set-version/',
    );

    expect(echoMock).toHaveBeenNthCalledWith(2, 'WARNING:');

    expect(echoMock.mock.calls[2][0]).toBe(
      `Failed to update all the files: [${filesToValidate.join(
        ', ',
      )}] must have versions in them`,
    );
    expect(echoMock.mock.calls[3][0]).toBe(
      `These files already had version ${version} set.`,
    );
  });
});
