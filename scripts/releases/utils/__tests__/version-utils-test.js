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

const {
  isNightly,
  isReleaseBranch,
  parseVersion,
  validateBuildType,
} = require('../version-utils');

jest.mock('shelljs', () => ({
  exec: () => {
    return {
      stdout: null,
    };
  },
  echo: message => {
    console.log(message);
  },
  exit: jest.fn(),
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

  describe('parseVersion', () => {
    it('should throw error if buildType is not `release`, `dry-run` or `nightly`', () => {
      function testInvalidVersion() {
        // $FlowExpectedError[incompatible-call]
        parseVersion('v0.10.5', 'invalid_build_type');
      }
      expect(testInvalidVersion).toThrowErrorMatchingInlineSnapshot(
        `"Unsupported build type: invalid_build_type"`,
      );
    });

    it('should throw error if invalid match with release', () => {
      function testInvalidVersion() {
        parseVersion('<invalid version>', 'release');
      }
      expect(testInvalidVersion).toThrowErrorMatchingInlineSnapshot(
        `"You must pass a correctly formatted version; couldn't parse <invalid version>"`,
      );
    });

    it('should throw error if invalid match with dry-run', () => {
      function testInvalidVersion() {
        parseVersion('<invalid version>', 'dry-run');
      }
      expect(testInvalidVersion).toThrowErrorMatchingInlineSnapshot(
        `"You must pass a correctly formatted version; couldn't parse <invalid version>"`,
      );
    });
    it('should throw error if invalid match with nightly', () => {
      function testInvalidVersion() {
        parseVersion('<invalid version>', 'nightly');
      }
      expect(testInvalidVersion).toThrowErrorMatchingInlineSnapshot(
        `"You must pass a correctly formatted version; couldn't parse <invalid version>"`,
      );
    });

    it('should parse pre-release version with release and `.`', () => {
      const {version, major, minor, patch, prerelease} = parseVersion(
        '0.66.0-rc.4',
        'release',
      );
      expect(version).toBe('0.66.0-rc.4');
      expect(major).toBe('0');
      expect(minor).toBe('66');
      expect(patch).toBe('0');
      expect(prerelease).toBe('rc.4');
    });

    it('should parse pre-release version with release and `-`', () => {
      const {version, major, minor, patch, prerelease} = parseVersion(
        '0.66.0-rc-4',
        'release',
      );
      expect(version).toBe('0.66.0-rc-4');
      expect(major).toBe('0');
      expect(minor).toBe('66');
      expect(patch).toBe('0');
      expect(prerelease).toBe('rc-4');
    });

    it('should reject pre-release version with random prerelease pattern', () => {
      function testInvalidVersion() {
        parseVersion('0.66.0-something_invalid', 'release');
      }
      expect(testInvalidVersion).toThrowErrorMatchingInlineSnapshot(
        `"Version 0.66.0-something_invalid is not valid for Release"`,
      );
    });

    it('should parse stable version', () => {
      const {version, major, minor, patch, prerelease} = parseVersion(
        '0.66.0',
        'release',
      );
      expect(version).toBe('0.66.0');
      expect(major).toBe('0');
      expect(minor).toBe('66');
      expect(patch).toBe('0');
      expect(prerelease).toBeUndefined();
    });

    it('should parse pre-release version from tag', () => {
      const {version, major, minor, patch, prerelease} = parseVersion(
        'v0.66.0-rc.4',
        'release',
      );
      expect(version).toBe('0.66.0-rc.4');
      expect(major).toBe('0');
      expect(minor).toBe('66');
      expect(patch).toBe('0');
      expect(prerelease).toBe('rc.4');
    });

    it('should parse patch pre-release version from tag', () => {
      const {version, major, minor, patch, prerelease} = parseVersion(
        'v0.66.1-rc.4',
        'release',
      );
      expect(version).toBe('0.66.1-rc.4');
      expect(major).toBe('0');
      expect(minor).toBe('66');
      expect(patch).toBe('1');
      expect(prerelease).toBe('rc.4');
    });

    it('should reject pre-release version from tag with random prerelease pattern', () => {
      function testInvalidVersion() {
        parseVersion('v0.66.0-something_invalid', 'release');
      }
      expect(testInvalidVersion).toThrowErrorMatchingInlineSnapshot(
        `"Version 0.66.0-something_invalid is not valid for Release"`,
      );
    });

    it('should parse stable version from tag', () => {
      const {version, major, minor, patch, prerelease} = parseVersion(
        'v0.66.0',
        'release',
      );
      expect(version).toBe('0.66.0');
      expect(major).toBe('0');
      expect(minor).toBe('66');
      expect(patch).toBe('0');
      expect(prerelease).toBeUndefined();
    });

    it('should parse nightly with no prerelease', () => {
      // this should fail

      const {version, major, minor, patch, prerelease} = parseVersion(
        '0.0.0',
        'nightly',
      );

      expect(version).toBe('0.0.0');
      expect(major).toBe('0');
      expect(minor).toBe('0');
      expect(patch).toBe('0');
      expect(prerelease).toBeUndefined();
    });

    it('should reject nightly with prerelease but wrong version numbers', () => {
      // this should fail
      function testInvalidFunction() {
        parseVersion('1.2.3-pre-release', 'nightly');
      }
      expect(testInvalidFunction).toThrowErrorMatchingInlineSnapshot(
        `"Version 1.2.3-pre-release is not valid for nightlies"`,
      );
    });

    it('should parse nightly with 0.0.0 and a prerelease part', () => {
      // this should fail
      const {version, major, minor, patch, prerelease} = parseVersion(
        '0.0.0-pre-release',
        'nightly',
      );

      expect(version).toBe('0.0.0-pre-release');
      expect(major).toBe('0');
      expect(minor).toBe('0');
      expect(patch).toBe('0');
      expect(prerelease).toBe('pre-release');
    });
    it('should parse dryrun with release version', () => {
      const {version, major, minor, patch, prerelease} = parseVersion(
        '0.7.3',
        'dry-run',
      );
      expect(version).toBe('0.7.3');
      expect(major).toBe('0');
      expect(minor).toBe('7');
      expect(patch).toBe('3');
      expect(prerelease).toBeUndefined();
    });

    it('should parse dryrun with prerelease . version', () => {
      const {version, major, minor, patch, prerelease} = parseVersion(
        '0.20.0-rc.0',
        'dry-run',
      );
      expect(version).toBe('0.20.0-rc.0');
      expect(major).toBe('0');
      expect(minor).toBe('20');
      expect(patch).toBe('0');
      expect(prerelease).toBe('rc.0');
    });

    it('should parse dryrun with prerelease - version', () => {
      const {version, major, minor, patch, prerelease} = parseVersion(
        '0.20.0-rc-0',
        'dry-run',
      );
      expect(version).toBe('0.20.0-rc-0');
      expect(major).toBe('0');
      expect(minor).toBe('20');
      expect(patch).toBe('0');
      expect(prerelease).toBe('rc-0');
    });

    it('should parse dryrun with main version', () => {
      const {version, major, minor, patch, prerelease} = parseVersion(
        '1000.0.0',
        'dry-run',
      );
      expect(version).toBe('1000.0.0');
      expect(major).toBe('1000');
      expect(minor).toBe('0');
      expect(patch).toBe('0');
      expect(prerelease).toBeUndefined();
    });

    it('should fail for dryrun with v1000.0.1 version', () => {
      function testInvalidFunction() {
        parseVersion('v1000.0.1', 'dry-run');
      }
      expect(testInvalidFunction).toThrowErrorMatchingInlineSnapshot(
        `"Version 1000.0.1 is not valid for dry-runs"`,
      );
    });
    it('should parse dryrun with nightly version', () => {
      const {version, major, minor, patch, prerelease} = parseVersion(
        '0.0.0-something-else',
        'dry-run',
      );
      expect(version).toBe('0.0.0-something-else');
      expect(major).toBe('0');
      expect(minor).toBe('0');
      expect(patch).toBe('0');
      expect(prerelease).toBe('something-else');
    });

    it('should reject dryrun invalid values', () => {
      function testInvalidFunction() {
        parseVersion('1000.0.4', 'dry-run');
      }
      expect(testInvalidFunction).toThrowErrorMatchingInlineSnapshot(
        `"Version 1000.0.4 is not valid for dry-runs"`,
      );
    });

    it('should reject dryrun for invalid prerelease', () => {
      function testInvalidFunction() {
        parseVersion('0.6.4-something-else', 'dry-run');
      }
      expect(testInvalidFunction).toThrowErrorMatchingInlineSnapshot(
        `"Version 0.6.4-something-else is not valid for dry-runs"`,
      );
    });

    it('should parse dryrun for nightlies with no prerelease', () => {
      const {version, major, minor, patch, prerelease} = parseVersion(
        '0.0.0',
        'dry-run',
      );

      expect(version).toBe('0.0.0');
      expect(major).toBe('0');
      expect(minor).toBe('0');
      expect(patch).toBe('0');
      expect(prerelease).toBeUndefined();
    });

    it('should reject stable releases with major > 0', () => {
      expect(() => parseVersion('1.0.1', 'release')).toThrow(
        'Version 1.0.1 is not valid for Release',
      );
    });
  });

  describe('isNightly', () => {
    it('should match old version of nightlies', () => {
      expect(
        isNightly({
          version: '0.0.0-20230420-2108-f84256a92',
          major: '0',
          minor: '0',
          patch: '0',
          prerelease: '20230420-2108-f84256a92',
        }),
      ).toBe(true);
    });

    it('should match nightlies', () => {
      expect(
        isNightly({
          version: '0.81.0-nightly-20230420-f84256a92',
          major: '0',
          minor: '81',
          patch: '0',
          prerelease: 'nightly-20230420-f84256a92',
        }),
      ).toBe(true);
    });
  });

  describe('Validate version', () => {
    test('should return false if the buildType is unknown', () => {
      expect(validateBuildType('wrong_build')).toBe(false);
    });

    test.each(['release', 'nightly', 'dry-run'])(
      'should return true if the buildType is %s',
      buildType => {
        expect(validateBuildType(buildType)).toBe(true);
      },
    );
  });
});
