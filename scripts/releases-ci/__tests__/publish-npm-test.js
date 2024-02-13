/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @oncall react_native
 */

const execMock = jest.fn();
const echoMock = jest.fn();
const exitMock = jest.fn();
const consoleErrorMock = jest.fn();
const isTaggedLatestMock = jest.fn();
const setVersionMock = jest.fn();
const setReactNativeVersionMock = jest.fn();
const publishAndroidArtifactsToMavenMock = jest.fn();
const removeNewArchFlags = jest.fn();
const env = process.env;

const publishPackageMock = jest.fn();
const getNpmInfoMock = jest.fn();

jest
  .mock('shelljs', () => ({
    exec: execMock,
    echo: echoMock,
    exit: exitMock,
  }))
  .mock('./../../scm-utils', () => ({
    exitIfNotOnGit: command => command(),
    getCurrentCommit: () => 'currentco_mmit',
    isTaggedLatest: isTaggedLatestMock,
  }))
  .mock('../../releases/utils/release-utils', () => ({
    generateAndroidArtifacts: jest.fn(),
    publishAndroidArtifactsToMaven: publishAndroidArtifactsToMavenMock,
  }))
  .mock('../../releases/set-version', () => setVersionMock)
  .mock('../../releases/set-rn-version', () => ({
    setReactNativeVersion: setReactNativeVersionMock,
  }))
  .mock('../../releases/remove-new-arch-flags', () => ({
    removeNewArchFlags,
  }));

const date = new Date('2023-04-20T23:52:39.543Z');

const {publishNpm} = require('../publish-npm');
const path = require('path');

const REPO_ROOT = path.resolve(__filename, '../../../..');

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
    jest.resetModules();
    jest.resetAllMocks();
  });

  describe('publish-npm.js', () => {
    it('Fails when invalid build type is passed', async () => {
      await expect(publishNpm('invalid')).rejects.toThrow(
        'Unsupported build type: invalid',
      );
    });
  });

  describe('dry-run', () => {
    it('should set version and not publish', async () => {
      await publishNpm('dry-run');

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
      expect(setVersionMock).not.toBeCalled();
    });
  });

  describe('nightly', () => {
    let consoleLog;
    beforeAll(() => {
      consoleLog = console.log;
      console.log = jest.fn();
      jest.mock('../../npm-utils', () => ({
        ...jest.requireActual('../../npm-utils'),
        publishPackage: publishPackageMock,
        getNpmInfo: getNpmInfoMock,
      }));
    });

    afterAll(() => {
      console.log = consoleLog;
      jest.unmock('../../npm-utils');
    });

    beforeEach(() => {
      jest.resetAllMocks();
    });

    it('should publish', async () => {
      publishPackageMock.mockImplementation(() => ({
        code: 0,
      }));
      getNpmInfoMock.mockImplementation(() => ({
        version: expectedVersion,
        tag: 'nightly',
      }));
      const expectedVersion = '0.82.0-nightly-20230420-currentco';

      await publishNpm('nightly');

      expect(removeNewArchFlags).not.toHaveBeenCalled();
      expect(setVersionMock).toBeCalledWith(expectedVersion);
      expect(publishAndroidArtifactsToMavenMock).toHaveBeenCalledWith(
        expectedVersion,
        'nightly',
      );
      publishPackageMock.mock.calls.forEach(params => {
        expect(params[1]).toEqual({
          tags: ['nightly'],
          otp: undefined,
        });
      });
      expect(publishPackageMock).toHaveBeenCalledWith(
        path.join(REPO_ROOT, 'packages/react-native'),
        {otp: undefined, tags: ['nightly']},
      );
      expect(echoMock).toHaveBeenCalledWith(
        `Published to npm ${expectedVersion}`,
      );
      expect(exitMock).toHaveBeenCalledWith(0);
    });

    it('should fail to set version', async () => {
      const expectedVersion = '0.82.0-nightly-20230420-currentco';
      publishPackageMock.mockImplementation(() => ({
        code: 0,
      }));
      getNpmInfoMock.mockImplementation(() => ({
        version: expectedVersion,
        tag: 'nightly',
      }));
      setVersionMock.mockImplementation(() => {
        throw new Error('something went wrong');
      });

      await publishNpm('nightly');

      expect(removeNewArchFlags).not.toHaveBeenCalled();
      expect(publishAndroidArtifactsToMavenMock).not.toBeCalled();
      expect(consoleErrorMock).toHaveBeenCalledWith(
        `Failed to set version number to ${expectedVersion}`,
      );
      expect(exitMock).toHaveBeenCalledWith(1);
    });
    it('should fail to publish react-native if some monorepo packages fail', async () => {
      publishPackageMock.mockImplementation(packagePath => ({
        code: 1,
      }));

      getNpmInfoMock.mockImplementation(() => ({
        version: expectedVersion,
        tag: 'nightly',
      }));

      const expectedVersion = '0.82.0-nightly-20230420-currentco';

      await publishNpm('nightly');

      expect(removeNewArchFlags).not.toHaveBeenCalled();
      expect(setVersionMock).toBeCalledWith(expectedVersion);
      expect(publishAndroidArtifactsToMavenMock).toHaveBeenCalledWith(
        expectedVersion,
        'nightly',
      );
      expect(exitMock).toHaveBeenCalledWith(1);
      publishPackageMock.mock.calls.forEach(params => {
        expect(params[1]).toEqual({
          tags: ['nightly'],
          otp: undefined,
        });
      });
      expect(echoMock).toHaveBeenCalledWith('Failed to publish package to npm');
    });
  });

  describe('release', () => {
    it('should fail with invalid release version', async () => {
      process.env.CIRCLE_TAG = '1.0.1';
      await expect(publishNpm('release')).rejects.toThrow(
        'Version 1.0.1 is not valid for Release',
      );
      expect(publishAndroidArtifactsToMavenMock).not.toBeCalled();
    });

    it('should publish non-latest', async () => {
      execMock.mockReturnValueOnce({code: 0});
      isTaggedLatestMock.mockReturnValueOnce(false);
      process.env.CIRCLE_TAG = '0.81.1';
      process.env.NPM_CONFIG_OTP = 'otp';

      await publishNpm('release');

      expect(removeNewArchFlags).not.toHaveBeenCalled();
      const expectedVersion = '0.81.1';
      expect(publishAndroidArtifactsToMavenMock).toHaveBeenCalledWith(
        expectedVersion,
        'release',
      );
      expect(execMock).toHaveBeenCalledWith(
        `npm publish --tag 0.81-stable --otp otp`,
        {cwd: path.join(REPO_ROOT, 'packages/react-native')},
      );
      expect(echoMock).toHaveBeenCalledWith(
        `Published to npm ${expectedVersion}`,
      );
      expect(exitMock).toHaveBeenCalledWith(0);
      expect(execMock.mock.calls).toHaveLength(1);
    });

    it('should publish latest stable', async () => {
      execMock.mockReturnValueOnce({code: 0});
      isTaggedLatestMock.mockReturnValueOnce(true);
      process.env.CIRCLE_TAG = '0.81.1';
      process.env.NPM_CONFIG_OTP = 'otp';

      await publishNpm('release');

      expect(removeNewArchFlags).not.toHaveBeenCalled();
      const expectedVersion = '0.81.1';
      expect(publishAndroidArtifactsToMavenMock).toHaveBeenCalledWith(
        expectedVersion,
        'release',
      );
      expect(execMock).toHaveBeenCalledWith(
        `npm publish --tag latest --otp ${process.env.NPM_CONFIG_OTP}`,
        {cwd: path.join(REPO_ROOT, 'packages/react-native')},
      );
      expect(echoMock).toHaveBeenCalledWith(
        `Published to npm ${expectedVersion}`,
      );
      expect(exitMock).toHaveBeenCalledWith(0);
      expect(execMock.mock.calls).toHaveLength(1);
    });

    it('should fail to publish latest stable', async () => {
      execMock.mockReturnValueOnce({code: 1});
      isTaggedLatestMock.mockReturnValueOnce(true);
      process.env.CIRCLE_TAG = '0.81.1';
      process.env.NPM_CONFIG_OTP = 'otp';

      await publishNpm('release');

      expect(removeNewArchFlags).not.toHaveBeenCalled();
      const expectedVersion = '0.81.1';
      expect(publishAndroidArtifactsToMavenMock).toHaveBeenCalledWith(
        expectedVersion,
        'release',
      );
      expect(execMock).toHaveBeenCalledWith(
        `npm publish --tag latest --otp ${process.env.NPM_CONFIG_OTP}`,
        {cwd: path.join(REPO_ROOT, 'packages/react-native')},
      );
      expect(echoMock).toHaveBeenCalledWith(`Failed to publish package to npm`);
      expect(exitMock).toHaveBeenCalledWith(1);
      expect(execMock.mock.calls).toHaveLength(1);
    });

    it('should publish next', async () => {
      execMock.mockReturnValueOnce({code: 0});
      isTaggedLatestMock.mockReturnValueOnce(true);
      process.env.CIRCLE_TAG = '0.81.0-rc.4';
      process.env.NPM_CONFIG_OTP = 'otp';

      await publishNpm('release');

      expect(removeNewArchFlags).not.toHaveBeenCalled();
      const expectedVersion = '0.81.0-rc.4';
      expect(publishAndroidArtifactsToMavenMock).toHaveBeenCalledWith(
        expectedVersion,
        'release',
      );
      expect(execMock).toHaveBeenCalledWith(
        `npm publish --tag next --otp ${process.env.NPM_CONFIG_OTP}`,
        {cwd: path.join(REPO_ROOT, 'packages/react-native')},
      );
      expect(echoMock).toHaveBeenCalledWith(
        `Published to npm ${expectedVersion}`,
      );
      expect(exitMock).toHaveBeenCalledWith(0);
      expect(execMock.mock.calls).toHaveLength(1);
    });
  });
});
