/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

const semver = require('semver');

// This test ensures that the electron dependency declared in our package.json
// is semver-satisfied by the actual version of the electron package we're using.
// While this is normally the job of a package manager like Yarn, in our case we
// may use Yarn forced resolutions that defeat versioning, so we want additional
// safety to ensure the target of the resolution is in sync with the declared dependency.
describe('Electron dependency', () => {
  test('should be semver-satisfied by the actual electron version', () => {
    // $FlowIssue[untyped-import] - package.json is not typed
    const ourPackageJson = require('../package.json');

    const declaredElectronVersion = ourPackageJson.dependencies.electron;
    expect(declaredElectronVersion).toBeTruthy();

    // $FlowIssue[untyped-import] - package.json is not typed
    const electronPackageJson = require('electron/package.json');

    const actualElectronVersion = electronPackageJson.version;
    expect(actualElectronVersion).toBeTruthy();

    const isSatisfied = semver.satisfies(
      actualElectronVersion,
      declaredElectronVersion,
    );

    expect(isSatisfied).toBe(true);
  });
});
