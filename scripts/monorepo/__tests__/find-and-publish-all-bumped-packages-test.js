/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

const {PUBLISH_PACKAGES_TAG} = require('../constants');
const {
  findAndPublishAllBumpedPackages,
  getTagsFromCommitMessage,
} = require('../find-and-publish-all-bumped-packages');

const spawnSync = jest.fn();
const forEachPackage = jest.fn();
const execMock = jest.fn();

jest.mock('child_process', () => ({spawnSync}));
jest.mock('shelljs', () => ({exec: execMock}));
jest.mock('../for-each-package', () => forEachPackage);

describe('findAndPublishAllBumpedPackages', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  test('should throw an error if updated version is not 0.x.y', async () => {
    const mockedPackageNewVersion = '1.0.0';

    forEachPackage.mockImplementationOnce(callback => {
      callback('absolute/path/to/package', 'to/package', {
        version: mockedPackageNewVersion,
      });
    });

    spawnSync.mockImplementationOnce(() => ({
      stdout: `-  "version": "0.72.0"\n+  "version": "${mockedPackageNewVersion}"\n`,
    }));

    spawnSync.mockImplementationOnce(() => ({
      stdout: `This is my commit message\n\n${PUBLISH_PACKAGES_TAG}`,
    }));

    await expect(findAndPublishAllBumpedPackages()).rejects.toThrow(
      `Package version expected to be 0.x.y, but received ${mockedPackageNewVersion}`,
    );
  });

  test('should publish all changed packages', async () => {
    forEachPackage.mockImplementationOnce(callback => {
      callback('absolute/path/to/package-a', 'to/package-a', {
        version: '0.72.1',
      });
      callback('absolute/path/to/package-b', 'to/package-b', {
        version: '0.72.1',
      });
      callback('absolute/path/to/package-c', 'to/package-b', {
        version: '0.72.0',
      });
    });

    spawnSync.mockImplementationOnce(() => ({
      stdout: `-  "version": "0.72.0"\n+  "version": "0.72.1"\n`,
    }));
    spawnSync.mockImplementationOnce(() => ({
      stdout: `This is my commit message\n\n${PUBLISH_PACKAGES_TAG}`,
    }));
    spawnSync.mockImplementationOnce(() => ({
      stdout: `-  "version": "0.72.0"\n+  "version": "0.72.1"\n`,
    }));
    spawnSync.mockImplementationOnce(() => ({
      stdout: `This is my commit message\n\n${PUBLISH_PACKAGES_TAG}`,
    }));
    spawnSync.mockImplementationOnce(() => ({
      stdout: '\n',
    }));
    spawnSync.mockImplementationOnce(() => ({
      stdout: `This is my commit message\n\n${PUBLISH_PACKAGES_TAG}`,
    }));

    execMock.mockImplementation(() => ({code: 0}));

    await findAndPublishAllBumpedPackages();

    expect(execMock.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          "npm publish",
          Object {
            "cwd": "absolute/path/to/package-a",
          },
        ],
        Array [
          "npm publish",
          Object {
            "cwd": "absolute/path/to/package-b",
          },
        ],
      ]
    `);
  });
});

describe('getTagsFromCommitMessage', () => {
  it('should parse tags out', () => {
    const commitMsg = `This may be any commit message before it like tag a \n\n${PUBLISH_PACKAGES_TAG}&tagA&tagB&tagA\n`;
    expect(getTagsFromCommitMessage(commitMsg)).toEqual([
      'tagA',
      'tagB',
      'tagA',
    ]);
  });
});
