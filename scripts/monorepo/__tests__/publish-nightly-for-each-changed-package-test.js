/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const publishNightlyForEachChangedPackage = require('../publish-nightly-for-each-changed-package');

const mockPackages = [
  {
    packageManifest: {name: 'packageA', version: 'local-version'},
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
    getPackageVersionStrByTag: () => 'published-nightly-version',
    diffPackages: diffPackagesMock,
    publishPackage: publishPackageMock,
    pack: jest.fn(),
  }));

describe('publishNightlyForEachChangedPackage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('publishes because there are changes', () => {
    const nightlyVersion = '0.73.0-nightly-202108-shortcommit';
    publishPackageMock.mockImplementationOnce(() => ({code: 0}));
    diffPackagesMock.mockImplementationOnce(() => 'some-file-name.js\n');

    publishNightlyForEachChangedPackage(nightlyVersion);

    // ensure we set the version of the last published nightly (for diffing)
    expect(writeFileSyncMock.mock.calls[0][1]).toBe(
      '{\n  "name": "packageA",\n  "version": "published-nightly-version"\n}\n',
    );

    expect(diffPackagesMock).toBeCalledWith(
      'packageA@nightly',
      'packageA-published-nightly-version.tgz',
      {
        cwd: '/some/place/packageA',
      },
    );

    // when determining that we DO want to publish, ensure we update the version to the provded nightly version we want to use
    expect(writeFileSyncMock.mock.calls[1][1]).toBe(
      `{\n  "name": "packageA",\n  "version": "${nightlyVersion}"\n}\n`,
    );

    expect(publishPackageMock).toBeCalled();
  });

  it('doesnt publish because no changes', () => {
    const nightlyVersion = '0.73.0-nightly-202108-shortcommit';
    diffPackagesMock.mockImplementationOnce(() => '\n');

    publishNightlyForEachChangedPackage(nightlyVersion);

    expect(writeFileSyncMock.mock.calls[0][1]).toBe(
      '{\n  "name": "packageA",\n  "version": "published-nightly-version"\n}\n',
    );

    // in this test, we expect there to be no differences between last published nightly and local
    // so we never update the version and we don't publish
    expect(writeFileSyncMock.mock.calls.length).toBe(1);
    expect(publishPackageMock).not.toBeCalled();
  });
});
