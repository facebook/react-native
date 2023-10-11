/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const getAndUpdatePackages = require('../get-and-update-packages');
const path = require('path');
const {
  mockPackages,
  expectedPackages,
} = require('./__fixtures__/get-and-update-packages-fixtures');

const writeFileSyncMock = jest.fn();
const publishPackageMock = jest.fn();
const getPackageVersionStrByTag = jest.fn();

function forEachPackageThatShouldBePublished(callback) {
  mockPackages.forEach(package => {
    if (
      package.packageManifest.name === 'react-native' ||
      package.packageManifest.private ||
      package.packageManifest.name === '@react-native/not_published'
    ) {
      return;
    }
    callback(package);
  });
}

jest
  .mock('fs', () => ({
    writeFileSync: writeFileSyncMock,
  }))
  .mock('../for-each-package', () => callback => {
    mockPackages.forEach(
      ({packageManifest, packageAbsolutePath, packageRelativePathFromRoot}) =>
        callback(
          packageAbsolutePath,
          packageRelativePathFromRoot,
          packageManifest,
        ),
    );
  })
  .mock('../../npm-utils', () => ({
    publishPackage: publishPackageMock,
    getPackageVersionStrByTag: getPackageVersionStrByTag,
  }));

describe('getAndUpdatePackages', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    getPackageVersionStrByTag.mockImplementation(packageName => {
      if (packageName === '@react-native/not_published') {
        throw new Error(`Can't find package with name ${packageName}`);
      }
      return '';
    });
  });

  it('Publishes the nightly version', () => {
    const nightlyVersion = '0.73.0-nightly-202108-shortcommit';
    publishPackageMock.mockImplementation(() => ({code: 0}));

    const updatedPackages = getAndUpdatePackages(nightlyVersion, 'nightly');

    expect(writeFileSyncMock).toHaveBeenCalledTimes(6);
    forEachPackageThatShouldBePublished(package => {
      expect(writeFileSyncMock).toHaveBeenCalledWith(
        path.join(package.packageAbsolutePath, 'package.json'),
        JSON.stringify(
          expectedPackages[package.packageManifest.name](nightlyVersion),
          null,
          2,
        ) + '\n',
        'utf-8',
      );
    });

    expect(publishPackageMock).toHaveBeenCalledTimes(6);
    forEachPackageThatShouldBePublished(package => {
      expect(publishPackageMock).toHaveBeenCalledWith(
        package.packageAbsolutePath,
        {otp: undefined, tag: 'nightly'},
      );
    });

    let expectedResult = {};
    forEachPackageThatShouldBePublished(package => {
      expectedResult[package.packageManifest.name] =
        package.packageManifest.version;
    });
    expect(updatedPackages).toEqual(expectedResult);
  });

  it('Throws when a package fails to publish', () => {
    const nightlyVersion = '0.73.0-nightly-202108-shortcommit';
    let publishCalls = 0;
    publishPackageMock.mockImplementation(() => {
      publishCalls += 1;
      if (publishCalls === 3) {
        return {code: -1};
      }
      return {code: 0};
    });

    expect(() => {
      getAndUpdatePackages(nightlyVersion, 'nightly');
    }).toThrow();

    expect(writeFileSyncMock).toHaveBeenCalledTimes(6);
    forEachPackageThatShouldBePublished(package => {
      expect(writeFileSyncMock).toHaveBeenCalledWith(
        path.join(package.packageAbsolutePath, 'package.json'),
        JSON.stringify(
          expectedPackages[package.packageManifest.name](nightlyVersion),
          null,
          2,
        ) + '\n',
        'utf-8',
      );
    });

    expect(publishPackageMock).toHaveBeenCalledTimes(3);
  });

  it('Publishes the prealpha versions', () => {
    const version = '0.0.0-prealpha-2023100416';
    publishPackageMock.mockImplementation(() => ({code: 0}));

    const updatedPackages = getAndUpdatePackages(version, 'prealpha');

    expect(writeFileSyncMock).toHaveBeenCalledTimes(6);
    forEachPackageThatShouldBePublished(package => {
      expect(writeFileSyncMock).toHaveBeenCalledWith(
        path.join(package.packageAbsolutePath, 'package.json'),
        JSON.stringify(
          expectedPackages[package.packageManifest.name](version),
          null,
          2,
        ) + '\n',
        'utf-8',
      );
    });

    expect(publishPackageMock).toHaveBeenCalledTimes(6);
    forEachPackageThatShouldBePublished(package => {
      expect(publishPackageMock).toHaveBeenCalledWith(
        package.packageAbsolutePath,
        {otp: undefined, tag: 'prealpha'},
      );
    });

    let expectedResult = {};
    forEachPackageThatShouldBePublished(package => {
      expectedResult[package.packageManifest.name] =
        package.packageManifest.version;
    });
    expect(updatedPackages).toEqual(expectedResult);
  });

  it('Throws when a package fails to publish with prealpha', () => {
    const version = '0.0.0-prealpha-2023100416';
    let publishCalls = 0;
    publishPackageMock.mockImplementation(() => {
      publishCalls += 1;
      if (publishCalls === 3) {
        return {code: -1};
      }
      return {code: 0};
    });

    expect(() => {
      getAndUpdatePackages(version, 'prealpha');
    }).toThrow();

    expect(writeFileSyncMock).toHaveBeenCalledTimes(6);
    forEachPackageThatShouldBePublished(package => {
      expect(writeFileSyncMock).toHaveBeenCalledWith(
        path.join(package.packageAbsolutePath, 'package.json'),
        JSON.stringify(
          expectedPackages[package.packageManifest.name](version),
          null,
          2,
        ) + '\n',
        'utf-8',
      );
    });

    expect(publishPackageMock).toHaveBeenCalledTimes(3);
  });
});
