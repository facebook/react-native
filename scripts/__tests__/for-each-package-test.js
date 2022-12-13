/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const path = require('path');
const {readdirSync, readFileSync} = require('fs');

const forEachPackage = require('../monorepo/for-each-package');

jest.mock('fs', () => ({
  readdirSync: jest.fn(),
  readFileSync: jest.fn(),
}));

describe('forEachPackage', () => {
  it('executes callback call with parameters', () => {
    const callback = jest.fn();
    const mockedPackageManifest = '{"name": "my-new-package"}';
    const mockedParsedPackageManifest = JSON.parse(mockedPackageManifest);
    const mockedPackageName = 'my-new-package';

    readdirSync.mockImplementationOnce(() => [
      {name: mockedPackageName, isDirectory: () => true},
    ]);
    readFileSync.mockImplementationOnce(() => mockedPackageManifest);

    forEachPackage(callback);

    expect(callback).toHaveBeenCalledWith(
      path.join(__dirname, '..', '..', 'packages', mockedPackageName),
      path.join('packages', mockedPackageName),
      mockedParsedPackageManifest,
    );
  });

  it('filters react-native folder', () => {
    const callback = jest.fn();
    readdirSync.mockImplementationOnce(() => [
      {name: 'react-native', isDirectory: () => true},
    ]);

    forEachPackage(callback);

    expect(callback).not.toHaveBeenCalled();
  });
});
