/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 * @oncall react_native
 */

const readFileMock = jest.fn();
const writeFileMock = jest.fn();
const updateTemplatePackageMock = jest.fn();

jest.mock('fs', () => ({
  ...jest.requireActual<$FlowFixMe>('fs'),
  promises: {
    ...jest.requireActual<$FlowFixMe>('fs').promises,
    readFile: readFileMock,
    writeFile: writeFileMock,
  },
}));
jest.mock('./../update-template-package', () => updateTemplatePackageMock);

const {REPO_ROOT} = require('../../consts');
const {setReactNativeVersion} = require('../set-rn-version');
const path = require('path');

describe('setReactNativeVersion', () => {
  beforeAll(() => {
    readFileMock.mockImplementation(filePath => {
      if (
        filePath ===
        path.join(
          REPO_ROOT,
          'packages/react-native/ReactAndroid/gradle.properties',
        )
      ) {
        return 'VERSION_NAME=1000.0.0\n';
      }
      if (
        filePath === path.join(REPO_ROOT, 'packages/react-native/package.json')
      ) {
        return JSON.stringify({
          name: 'react-native',
          version: '1000.0.0',
          dependencies: {
            '@react-native/package-a': '1000.0.0',
          },
        });
      }
    });
  });

  afterEach(() => {
    writeFileMock.mockReset();
  });

  test('should set nightly version', async () => {
    const version = '0.81.0-nightly-29282302-abcd1234';
    const dependencyVersions = {
      '@react-native/package-a': version,
    };
    await setReactNativeVersion(version, dependencyVersions, 'nightly');

    expect(updateTemplatePackageMock).toHaveBeenCalledWith({
      '@react-native/package-a': version,
      'react-native': version,
    });

    for (const [filePath, contents] of writeFileMock.mock.calls) {
      // Make snapshot names resilient to platform path sep differences
      expect(formatGeneratedFile(contents)).toMatchSnapshot(
        path.relative(REPO_ROOT, filePath).split(path.sep).join('/'),
      );
    }
  });

  test('should set release version', async () => {
    const version = '0.81.0';
    await setReactNativeVersion(version, null, 'release');

    expect(updateTemplatePackageMock).toHaveBeenCalledWith({
      'react-native': version,
    });

    for (const [filePath, contents] of writeFileMock.mock.calls) {
      // Make snapshot names resilient to platform path sep differences
      expect(formatGeneratedFile(contents)).toMatchSnapshot(
        path.relative(REPO_ROOT, filePath).split(path.sep).join('/'),
      );
    }
  });
});

function formatGeneratedFile(source: string) {
  // Strip \@\generated annotation
  return source.replace(
    new RegExp('^ \\* @' + 'generated.*', 'gm'),
    ' * << GENERATED >>',
  );
}
