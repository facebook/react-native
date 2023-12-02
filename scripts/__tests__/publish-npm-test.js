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
const consoleErrorMock = jest.fn();
const isTaggedLatestMock = jest.fn();
const setReactNativeVersionMock = jest.fn();
const publishAndroidArtifactsToMavenMock = jest.fn();
const removeNewArchFlags = jest.fn();
const env = process.env;

jest
  .mock('shelljs', () => ({
    exec: execMock,
    echo: echoMock,
    exit: exitMock,
  }))
  .mock('./../scm-utils', () => ({
    exitIfNotOnGit: command => command(),
    getCurrentCommit: () => 'currentco_mmit',
    isTaggedLatest: isTaggedLatestMock,
  }))
  .mock('path', () => ({
    join: () => '../packages/react-native',
  }))
  .mock('fs')
  .mock('./../release-utils', () => ({
    generateAndroidArtifacts: jest.fn(),
    publishAndroidArtifactsToMaven: publishAndroidArtifactsToMavenMock,
  }))
  .mock('./../set-rn-version', () => setReactNativeVersionMock)
  .mock('../monorepo/get-and-update-packages')
  .mock('../releases/remove-new-arch-flags', () => removeNewArchFlags);

const date = new Date('2023-04-20T23:52:39.543Z');

const publishNpm = require('../publish-npm');
let consoleError;

describe('publish-npm', () => {
  beforeAll(() => {
    jest.setSystemTime(date);
  });
  beforeEach(() => {
    consoleError = console.error;
    console.error = consoleErrorMock;
  });

  afterEach(() => {
    process.env = env;
    console.error = consoleError;
  });

  afterEach(() => {
    jest.resetModules();
    jest.resetAllMocks();
  });

  describe('publish-npm.js', () => {
    it('Fails when invalid build type is passed', () => {
      expect(() => publishNpm('invalid')).toThrowError(
        'Unsupported build type: invalid',
      );
    });
  });

  describe('dry-run', () => {
    it('should set version and not publish', () => {
      publishNpm('dry-run');

      expect(removeNewArchFlags).not.toHaveBeenCalled();
      expect(exitMock).toHaveBeenCalledWith(0);
      expect(isTaggedLatestMock.mock.calls).toHaveLength(0);
      expect(echoMock).toHaveBeenCalledWith(
        'Skipping `npm publish` because --dry-run is set.',
      );
      expect(setReactNativeVersionMock).toBeCalledWith(
        '1000.0.0-currentco',
        null,
        'dry-run',
      );
    });
  });

  describe('nightly', () => {
    it('should publish', () => {
      execMock
        .mockReturnValueOnce({stdout: '0.81.0-rc.1\n', code: 0})
        .mockReturnValueOnce({code: 0});
      const expectedVersion = '0.82.0-nightly-20230420-currentco';

      publishNpm('nightly');

      expect(removeNewArchFlags).not.toHaveBeenCalled();
      expect(publishAndroidArtifactsToMavenMock).toHaveBeenCalledWith(
        expectedVersion,
        'nightly',
      );
      expect(execMock.mock.calls[0][0]).toBe(
        `npm view react-native@next version`,
      );
      expect(execMock.mock.calls[1][0]).toBe('npm publish --tag nightly');
      expect(echoMock).toHaveBeenCalledWith(
        `Published to npm ${expectedVersion}`,
      );
      expect(exitMock).toHaveBeenCalledWith(0);
    });

    it('should fail to set version', () => {
      execMock.mockReturnValueOnce({stdout: '0.81.0-rc.1\n', code: 0});
      const expectedVersion = '0.82.0-nightly-20230420-currentco';
      setReactNativeVersionMock.mockImplementation(() => {
        throw new Error('something went wrong');
      });

      publishNpm('nightly');

      expect(removeNewArchFlags).not.toHaveBeenCalled();
      expect(publishAndroidArtifactsToMavenMock).not.toBeCalled();
      expect(execMock.mock.calls[0][0]).toBe(
        `npm view react-native@next version`,
      );
      expect(consoleErrorMock).toHaveBeenCalledWith(
        `Failed to set version number to ${expectedVersion}`,
      );
      expect(exitMock).toHaveBeenCalledWith(1);
    });
  });

  describe('release', () => {
    it('should fail with invalid release version', () => {
      process.env.CIRCLE_TAG = '1.0.1';
      expect(() => {
        publishNpm('release');
      }).toThrow('Version 1.0.1 is not valid for Release');
      expect(publishAndroidArtifactsToMavenMock).not.toBeCalled();
    });

    it('should publish non-latest', () => {
      execMock.mockReturnValueOnce({code: 0});
      isTaggedLatestMock.mockReturnValueOnce(false);
      process.env.CIRCLE_TAG = '0.81.1';
      process.env.NPM_CONFIG_OTP = 'otp';

      publishNpm('release');

      expect(removeNewArchFlags).not.toHaveBeenCalled();
      const expectedVersion = '0.81.1';
      expect(publishAndroidArtifactsToMavenMock).toHaveBeenCalledWith(
        expectedVersion,
        'release',
      );
      expect(execMock).toHaveBeenCalledWith(
        `npm publish --tag 0.81-stable --otp otp`,
        {cwd: '../packages/react-native'},
      );
      expect(echoMock).toHaveBeenCalledWith(
        `Published to npm ${expectedVersion}`,
      );
      expect(exitMock).toHaveBeenCalledWith(0);
      expect(execMock.mock.calls).toHaveLength(1);
    });

    it('should publish latest stable', () => {
      execMock.mockReturnValueOnce({code: 0});
      isTaggedLatestMock.mockReturnValueOnce(true);
      process.env.CIRCLE_TAG = '0.81.1';
      process.env.NPM_CONFIG_OTP = 'otp';

      publishNpm('release');

      expect(removeNewArchFlags).not.toHaveBeenCalled();
      const expectedVersion = '0.81.1';
      expect(publishAndroidArtifactsToMavenMock).toHaveBeenCalledWith(
        expectedVersion,
        'release',
      );
      expect(execMock).toHaveBeenCalledWith(
        `npm publish --tag latest --otp ${process.env.NPM_CONFIG_OTP}`,
        {cwd: '../packages/react-native'},
      );
      expect(echoMock).toHaveBeenCalledWith(
        `Published to npm ${expectedVersion}`,
      );
      expect(exitMock).toHaveBeenCalledWith(0);
      expect(execMock.mock.calls).toHaveLength(1);
    });

    it('should fail to publish latest stable', () => {
      execMock.mockReturnValueOnce({code: 1});
      isTaggedLatestMock.mockReturnValueOnce(true);
      process.env.CIRCLE_TAG = '0.81.1';
      process.env.NPM_CONFIG_OTP = 'otp';

      publishNpm('release');

      expect(removeNewArchFlags).not.toHaveBeenCalled();
      const expectedVersion = '0.81.1';
      expect(publishAndroidArtifactsToMavenMock).toHaveBeenCalledWith(
        expectedVersion,
        'release',
      );
      expect(execMock).toHaveBeenCalledWith(
        `npm publish --tag latest --otp ${process.env.NPM_CONFIG_OTP}`,
        {cwd: '../packages/react-native'},
      );
      expect(echoMock).toHaveBeenCalledWith(`Failed to publish package to npm`);
      expect(exitMock).toHaveBeenCalledWith(1);
      expect(execMock.mock.calls).toHaveLength(1);
    });

    it('should publish next', () => {
      execMock.mockReturnValueOnce({code: 0});
      isTaggedLatestMock.mockReturnValueOnce(true);
      process.env.CIRCLE_TAG = '0.81.0-rc.4';
      process.env.NPM_CONFIG_OTP = 'otp';

      publishNpm('release');

      expect(removeNewArchFlags).not.toHaveBeenCalled();
      const expectedVersion = '0.81.0-rc.4';
      expect(publishAndroidArtifactsToMavenMock).toHaveBeenCalledWith(
        expectedVersion,
        'release',
      );
      expect(execMock).toHaveBeenCalledWith(
        `npm publish --tag next --otp ${process.env.NPM_CONFIG_OTP}`,
        {cwd: '../packages/react-native'},
      );
      expect(echoMock).toHaveBeenCalledWith(
        `Published to npm ${expectedVersion}`,
      );
      expect(exitMock).toHaveBeenCalledWith(0);
      expect(execMock.mock.calls).toHaveLength(1);
    });
  });
});
