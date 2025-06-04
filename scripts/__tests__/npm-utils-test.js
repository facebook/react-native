/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const {getNpmInfo, getVersionsBySpec, publishPackage} = require('../npm-utils');

const execMock = jest.fn();
const getCurrentCommitMock = jest.fn();
const exitIfNotOnGitMock = jest.fn();

jest.mock('shelljs', () => ({
  exec: execMock,
}));

jest.mock('./../scm-utils', () => ({
  getCurrentCommit: getCurrentCommitMock,
  exitIfNotOnGit: exitIfNotOnGitMock,
}));

describe('npm-utils', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.resetAllMocks();
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

    it('should handle -no-tag', () => {
      publishPackage('path/to/my-package', {tags: ['--no-tag'], otp: 'otp'});
      expect(execMock).toHaveBeenCalledWith('npm publish --no-tag --otp otp', {
        cwd: 'path/to/my-package',
      });
    });
  });

  describe('getNpmInfo', () => {
    beforeEach(() => {
      process.env.GITHUB_REF = '';
      process.env.GITHUB_REF_NAME = '';
    });

    it('return the expected format for patch-prereleases on GHA', () => {
      const isoStringSpy = jest.spyOn(Date.prototype, 'toISOString');
      isoStringSpy.mockReturnValue('2023-10-04T15:43:55.123Z');
      getCurrentCommitMock.mockImplementation(() => 'abcd1234');
      // exitIfNotOnGit takes a function as a param and it:
      // 1. checks if we are on git => if not it exits
      // 2. run the function passed as a param and return the output to the caller
      // For the mock, we are assuming we are on github and we are returning `false`
      // as the `getNpmInfo` function will pass a function that checks if the
      // current commit is a tagged with 'latest'.
      // In the Mock, we are assuming that we are on git (it does not exits) and the
      // checkIfLatest function returns `false`
      exitIfNotOnGitMock.mockImplementation(() => false);

      process.env.GITHUB_REF = 'refs/tags/v0.74.1-rc.0';
      process.env.GITHUB_REF_NAME = 'v0.74.1-rc.0';
      const returnedValue = getNpmInfo('release');
      expect(returnedValue).toMatchObject({
        version: `0.74.1-rc.0`,
        tag: '--no-tag',
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
