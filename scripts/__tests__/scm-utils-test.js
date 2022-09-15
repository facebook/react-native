/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const {isTaggedLatest, saveFiles, revertFiles} = require('../scm-utils');

let execResult = null;
const cpMock = jest.fn();
// const existsSyncMock = jest.fn();
const mkdirpSyncMock = jest.fn();
jest
  .mock('shelljs', () => ({
    exec: () => {
      return {
        stdout: execResult,
      };
    },
    echo: message => {
      console.log(message);
    },
    exit: exitCode => {
      exit(exitCode);
    },
    cp: cpMock,
  }))
  .mock('fs', () => ({
    existsSync: jest.fn().mockImplementation(_ => true),
  }))
  .mock('path', () => ({
    dirname: jest
      .fn()
      .mockImplementation(filePath =>
        filePath.includes('/') ? filePath.split('/')[0] : '.',
      ),
  }))
  .mock('mkdirp', () => ({
    sync: mkdirpSyncMock,
  }));

describe('scm-utils', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.resetAllMocks();
  });

  describe('isTaggedLatest', () => {
    it('it should identify commit as tagged `latest`', () => {
      execResult = '6c19dc3266b84f47a076b647a1c93b3c3b69d2c5\n';
      expect(isTaggedLatest('6c19dc3266b84f47a076b647a1c93b3c3b69d2c5')).toBe(
        true,
      );
    });
    it('it should not identify commit as tagged `latest`', () => {
      execResult = '6c19dc3266b84f47a076b647a1c93b3c3b69d2c5\n';
      expect(isTaggedLatest('6c19dc3266b8')).toBe(false);
    });
  });

  describe('saveFiles', () => {
    it('it should save files in the temp folder', () => {
      process.env.TMP_PUBLISH_DIR = '/tmp';
      saveFiles('package.json', 'android/package.json');
      expect(mkdirpSyncMock).toHaveBeenCalledWith(`/tmp/android`);
      expect(cpMock).toHaveBeenNthCalledWith(
        1,
        'package.json',
        '/tmp/package.json',
      );
      expect(cpMock).toHaveBeenNthCalledWith(
        2,
        'android/package.json',
        '/tmp/android/package.json',
      );
      process.env.TMP_PUBLISH_DIR = '';
    });
  });

  describe('revertFiles', () => {
    it('it should revert files from the temp folder', () => {
      process.env.TMP_PUBLISH_DIR = '/tmp';
      revertFiles('package.json', 'android/package.json');
      expect(cpMock).toHaveBeenNthCalledWith(
        1,
        '/tmp/package.json',
        'package.json',
      );
      expect(cpMock).toHaveBeenNthCalledWith(
        2,
        '/tmp/android/package.json',
        'android/package.json',
      );
      process.env.TMP_PUBLISH_DIR = '';
    });
  });
});
