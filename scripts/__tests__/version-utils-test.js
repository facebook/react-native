/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const {
  parseVersion,
  isTaggedLatest,
  isReleaseBranch,
} = require('../version-utils');

let execResult = null;
jest.mock('shelljs', () => ({
  exec: () => {
    return {
      stdout: execResult,
    };
  },
}));

describe('version-utils', () => {
  describe('isReleaseBranch', () => {
    it('should identify as release branch', () => {
      expect(isReleaseBranch('v0.66-stable')).toBe(true);
      expect(isReleaseBranch('0.66-stable')).toBe(true);
      expect(isReleaseBranch('made-up-stuff-stable')).toBe(true);
    });
    it('should not identify as release branch', () => {
      expect(isReleaseBranch('main')).toBe(false);
      expect(isReleaseBranch('pull/32659')).toBe(false);
    });
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

  describe('parseVersion', () => {
    it('should throw error if invalid match', () => {
      function testInvalidVersion() {
        parseVersion('<invalid version>');
      }
      expect(testInvalidVersion).toThrowErrorMatchingInlineSnapshot(
        `"You must pass a correctly formatted version; couldn't parse <invalid version>"`,
      );
    });

    it('should parse pre-release version with .', () => {
      const {version, major, minor, patch, prerelease} =
        parseVersion('0.66.0-rc.4');
      expect(version).toBe('0.66.0-rc.4');
      expect(major).toBe('0');
      expect(minor).toBe('66');
      expect(patch).toBe('0');
      expect(prerelease).toBe('rc.4');
    });

    it('should parse pre-release version with -', () => {
      const {version, major, minor, patch, prerelease} =
        parseVersion('0.66.0-rc-4');
      expect(version).toBe('0.66.0-rc-4');
      expect(major).toBe('0');
      expect(minor).toBe('66');
      expect(patch).toBe('0');
      expect(prerelease).toBe('rc-4');
    });

    it('should parse stable version', () => {
      const {version, major, minor, patch, prerelease} = parseVersion('0.66.0');
      expect(version).toBe('0.66.0');
      expect(major).toBe('0');
      expect(minor).toBe('66');
      expect(patch).toBe('0');
      expect(prerelease).toBeUndefined();
    });
    it('should parse pre-release version from tag', () => {
      const {version, major, minor, patch, prerelease} =
        parseVersion('v0.66.1-rc.4');
      expect(version).toBe('0.66.1-rc.4');
      expect(major).toBe('0');
      expect(minor).toBe('66');
      expect(patch).toBe('1');
      expect(prerelease).toBe('rc.4');
    });

    it('should parse stable version from tag', () => {
      const {version, major, minor, patch, prerelease} =
        parseVersion('v0.66.0');
      expect(version).toBe('0.66.0');
      expect(major).toBe('0');
      expect(minor).toBe('66');
      expect(patch).toBe('0');
      expect(prerelease).toBeUndefined();
    });

    it('should parse nightly fake version', () => {
      const {version, major, minor, patch, prerelease} = parseVersion('0.0.0');
      expect(version).toBe('0.0.0');
      expect(major).toBe('0');
      expect(minor).toBe('0');
      expect(patch).toBe('0');
      expect(prerelease).toBeUndefined();
    });

    it('should parse dryrun fake version', () => {
      const {version, major, minor, patch, prerelease} =
        parseVersion('1000.0.0');
      expect(version).toBe('1000.0.0');
      expect(major).toBe('1000');
      expect(minor).toBe('0');
      expect(patch).toBe('0');
      expect(prerelease).toBeUndefined();
    });
  });
});
