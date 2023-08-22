/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const getAndUpdateNightlies = require('../get-and-update-nightlies');

const NPM_NIGHTLY_VERSION = 'published-nightly-version';
const mockPackages = [
  {
    packageManifest: {name: '@react-native/packageA', version: 'local-version'},
    packageAbsolutePath: '/some/place/packageA',
    packageRelativePathFromRoot: './place/packageA',
  },
];

const execMock = jest.fn();
const writeFileSyncMock = jest.fn();
const diffPackagesMock = jest.fn();
const publishPackageMock = jest.fn();

jest
  .mock('shelljs', () => ({
    exec: execMock,
    rm: jest.fn(),
  }))
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
  .mock('../../scm-utils', () => ({
    restore: jest.fn(),
  }))
  .mock('../../npm-utils', () => ({
    getPackageVersionStrByTag: () => NPM_NIGHTLY_VERSION,
    diffPackages: diffPackagesMock,
    publishPackage: publishPackageMock,
    pack: jest.fn(),
  }));

describe('getAndUpdateNightlies', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('publishes because there are changes', () => {
    const nightlyVersion = '0.73.0-nightly-202108-shortcommit';
    publishPackageMock.mockImplementationOnce(() => ({code: 0}));
    diffPackagesMock.mockImplementationOnce(() => 'some-file-name.js\n');

    const latestNightlies = getAndUpdateNightlies(nightlyVersion);

    // ensure we set the version of the last published nightly (for diffing)
    expect(writeFileSyncMock.mock.calls[0][1]).toBe(
      '{\n  "name": "@react-native/packageA",\n  "version": "published-nightly-version"\n}\n',
    );

    expect(diffPackagesMock).toBeCalledWith(
      '@react-native/packageA@nightly',
      'react-native-packageA-published-nightly-version.tgz',
      {
        cwd: '/some/place/packageA',
      },
    );

    // when determining that we DO want to publish, ensure we update the version to the provded nightly version we want to use
    expect(writeFileSyncMock.mock.calls[1][1]).toBe(
      `{\n  "name": "@react-native/packageA",\n  "version": "${nightlyVersion}"\n}\n`,
    );

    expect(publishPackageMock).toBeCalled();

    // Expect the map returned to accurately list the latest nightly version
    expect(latestNightlies).toEqual({
      '@react-native/packageA': '0.73.0-nightly-202108-shortcommit',
    });
  });
  describe('fails to publish', () => {
    let consoleError;
    beforeEach(() => {
      consoleError = console.error;
      console.error = jest.fn();
    });

    afterEach(() => {
      console.error = consoleError;
    });

    it('doesnt update nightly version when fails to publish', () => {
      const nightlyVersion = '0.73.0-nightly-202108-shortcommit';
      publishPackageMock.mockImplementationOnce(() => ({
        code: 1,
        stderr: 'Some error about it failing to publish',
      }));
      diffPackagesMock.mockImplementationOnce(() => 'some-file-name.js\n');

      const latestNightlies = getAndUpdateNightlies(nightlyVersion);

      // Expect the map returned to accurately list the latest nightly version
      expect(latestNightlies).toEqual({});
    });
  });

  it('doesnt publish because no changes', () => {
    const nightlyVersion = '0.73.0-nightly-202108-shortcommit';
    diffPackagesMock.mockImplementationOnce(() => '\n');

    const latestNightlies = getAndUpdateNightlies(nightlyVersion);

    expect(writeFileSyncMock.mock.calls[0][1]).toBe(
      '{\n  "name": "@react-native/packageA",\n  "version": "published-nightly-version"\n}\n',
    );

    // in this test, we expect there to be no differences between last published nightly and local
    // so we never update the version and we don't publish
    expect(writeFileSyncMock.mock.calls.length).toBe(1);
    expect(publishPackageMock).not.toBeCalled();

    // Since we don't update, we expect the map to list the latest nightly on npm
    expect(latestNightlies).toEqual({
      '@react-native/packageA': 'published-nightly-version',
    });
  });
});
