/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const {
  applyPackageVersions,
  getNpmInfo,
  getPackageVersionStrByTag,
  getVersionsBySpec,
  publishPackage,
} = require('../npm-utils');

const execMock = jest.fn();
const getCurrentCommitMock = jest.fn();

jest.mock('shelljs', () => ({
  exec: execMock,
}));

jest.mock('./../scm-utils', () => ({
  getCurrentCommit: getCurrentCommitMock,
}));

describe('npm-utils', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.resetAllMocks();
  });

  describe('applyPackageVersions', () => {
    it('should replace package.json with dependencies', () => {
      const originalPackageJson = {
        name: 'my-package',
        dependencies: {
          'my-dependency-a': 'nightly',
          'my-dependency-b': '^1.2.3',
        },
        devDependencies: {
          'my-dev-dependency-a': 'nightly',
          'my-dev-dependency-b': '^1.2.3',
        },
        someOtherField: {
          'my-dependency-a': 'should-be-untouched',
        },
      };

      const dependencies = {
        'my-dependency-a': '0.72.0-nightly-shortcommit',
        'my-dev-dependency-a': 'updated-version',
        'my-non-existant-dep': 'some-version',
      };

      const package = applyPackageVersions(originalPackageJson, dependencies);
      expect(package).toEqual({
        name: 'my-package',
        dependencies: {
          'my-dependency-a': '0.72.0-nightly-shortcommit',
          'my-dependency-b': '^1.2.3',
        },
        devDependencies: {
          'my-dev-dependency-a': 'updated-version',
          'my-dev-dependency-b': '^1.2.3',
        },
        someOtherField: {
          'my-dependency-a': 'should-be-untouched',
        },
      });
    });
  });

  describe('getPackageVersionStrByTag', () => {
    it('should return package version string', () => {
      execMock.mockImplementationOnce(() => ({code: 0, stdout: '0.34.2 \n'}));
      const versionStr = getPackageVersionStrByTag('my-package', 'next');
      expect(versionStr).toBe('0.34.2');
    });
    it('should throw error when invalid result', () => {
      execMock.mockImplementationOnce(() => ({
        code: 1,
        stderr: 'Some error message',
      }));

      expect(() => {
        getPackageVersionStrByTag('my-package', 'next');
      }).toThrow('Failed to get next version from npm\nSome error message');
    });
  });

  describe('publishPackage', () => {
    it('should run publish command', () => {
      publishPackage(
        'path/to/my-package',
        {tags: ['latest'], otp: 'otp'},
        {silent: true, cwd: 'i/expect/this/to/be/overriden'},
      );
      expect(execMock).toHaveBeenCalledWith(
        'npm publish --tag latest --otp otp',
        {silent: true, cwd: 'path/to/my-package'},
      );
    });

    it('should run publish command when no execOptions', () => {
      publishPackage('path/to/my-package', {tags: ['latest'], otp: 'otp'});
      expect(execMock).toHaveBeenCalledWith(
        'npm publish --tag latest --otp otp',
        {cwd: 'path/to/my-package'},
      );
    });

    it('should handle multiple tags', () => {
      publishPackage('path/to/my-package', {
        tags: ['next', '0.72-stable'],
        otp: 'otp',
      });
      expect(execMock).toHaveBeenCalledWith(
        'npm publish --tag next --tag 0.72-stable --otp otp',
        {cwd: 'path/to/my-package'},
      );
    });
  });

  describe('getNpmInfo', () => {
    it('return the expected format for prealpha', () => {
      const isoStringSpy = jest.spyOn(Date.prototype, 'toISOString');
      isoStringSpy.mockReturnValue('2023-10-04T15:43:55.123Z');
      getCurrentCommitMock.mockImplementation(() => 'abcd1234');

      const returnedValue = getNpmInfo('prealpha');
      expect(returnedValue).toMatchObject({
        version: `0.0.0-prealpha-2023100415`,
        tag: 'prealpha',
      });
    });
  });

  describe('getVersionsBySpec', () => {
    it('should return array when single version returned', () => {
      execMock.mockImplementationOnce(() => ({code: 0, stdout: '"0.72.0" \n'}));

      const versions = getVersionsBySpec('mypackage', '^0.72.0');
      expect(versions).toEqual(['0.72.0']);
    });

    it('should return array of versions', () => {
      execMock.mockImplementationOnce(() => ({
        code: 0,
        stdout: '[\n"0.73.0",\n"0.73.1"\n]\n',
      }));

      const versions = getVersionsBySpec('mypackage', '^0.73.0');
      expect(versions).toEqual(['0.73.0', '0.73.1']);
    });

    it('should return error summary if E404', () => {
      const error =
        `npm ERR! code E404\n` +
        `npm ERR! 404 No match found for version ^0.72.0\n` +
        `npm ERR! 404\n` +
        `npm ERR! 404  '@react-native/community-cli-plugin@^0.72.0' is not in this registry.\n` +
        `npm ERR! 404\n` +
        `npm ERR! 404 Note that you can also install from a\n` +
        `npm ERR! 404 tarball, folder, http url, or git url.\n` +
        `{\n` +
        `  "error": {\n` +
        `    "code": "E404",\n` +
        `    "summary": "No match found for version ^0.72.0",\n` +
        `    "detail": "\n '@react-native/community-cli-plugin@^0.72.0' is not in this registry.\n\nNote that you can also install from a\ntarball, folder, http url, or git url."\n` +
        `  }\n` +
        `}\n`;
      execMock.mockImplementationOnce(() => ({
        code: 1,
        stderr: error,
      }));

      expect(() => {
        getVersionsBySpec('mypackage', '^0.72.0');
      }).toThrow('No match found for version ^0.72.0');
    });
  });
});
