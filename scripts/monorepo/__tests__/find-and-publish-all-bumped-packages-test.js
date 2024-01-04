/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const {PUBLISH_PACKAGES_TAG} = require('../constants');
const {
  findAndPublishAllBumpedPackages,
  getTagsFromCommitMessage,
} = require('../find-and-publish-all-bumped-packages');
const forEachPackage = require('../for-each-package');
const {spawnSync} = require('child_process');

jest.mock('child_process', () => ({spawnSync: jest.fn()}));
jest.mock('../for-each-package', () => jest.fn());

describe('findAndPublishAllBumpedPackages', () => {
  beforeEach(() => {
    // Silence logs.
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });
  it('throws an error if updated version is not 0.x.y', () => {
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

    expect(() => findAndPublishAllBumpedPackages()).toThrow(
      `Package version expected to be 0.x.y, but received ${mockedPackageNewVersion}`,
    );
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
