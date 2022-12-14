/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const {exec} = require('shelljs');

const forEachPackage = require('../monorepo/for-each-package');
const findAndPublishAllBumpedPackages = require('../monorepo/find-and-publish-all-bumped-packages');

jest.mock('shelljs', () => ({exec: jest.fn()}));
jest.mock('../monorepo/for-each-package', () => jest.fn());

describe('findAndPublishAllBumpedPackages', () => {
  it('throws an error if updated version is not 0.x.y', () => {
    const mockedPackageNewVersion = '1.0.0';

    forEachPackage.mockImplementationOnce(callback => {
      callback('absolute/path/to/package', 'to/package', {
        version: mockedPackageNewVersion,
      });
    });
    exec.mockImplementationOnce(() => ({
      stdout: `-  "version": "0.72.0"\n+  "version": "${mockedPackageNewVersion}"\n`,
    }));

    expect(() => findAndPublishAllBumpedPackages()).toThrow(
      `Package version expected to be 0.x.y, but received ${mockedPackageNewVersion}`,
    );
  });
});
