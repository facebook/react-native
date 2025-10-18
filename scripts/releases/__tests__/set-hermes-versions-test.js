/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

const {setHermesVersions} = require('../set-hermes-versions');
const {
  updateHermesCompilerVersionInDependencies,
  updateHermesRuntimeDependenciesVersions,
} = require('../utils/hermes-utils');
const path = require('path');

jest.mock('../../shared/consts', () => ({
  REPO_ROOT: path.join(__dirname, '__fixtures__', 'set-hermes-versions'),
  PACKAGES_DIR: path.join(
    __dirname,
    '__fixtures__',
    'set-hermes-versions',
    'packages',
  ),
  REACT_NATIVE_PACKAGE_DIR: path.join(
    __dirname,
    '__fixtures__',
    'set-hermes-versions',
    'packages',
    'react-native',
  ),
}));

const writeFileMock = jest.fn().mockImplementation((filePath, content) => {
  const normalizedFilePath = path
    .relative(path.join(__dirname, '__fixtures__'), filePath)
    .split(path.sep)
    .join('/');

  expect(content).toMatchSnapshot(normalizedFilePath);
});

describe('setHermesVersions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  beforeAll(() => {
    jest.mock('fs', () => {
      // $FlowFixMe[underconstrained-implicit-instantiation]
      const originalFs = jest.requireActual('fs');

      return {
        ...originalFs,
        writeFileSync: writeFileMock,
        promises: {
          ...originalFs.promises,
          writeFile: writeFileMock,
        },
      };
    });
  });

  test('updates monorepo for with set hermes versions', async () => {
    await setHermesVersions('0.14.0', '250829098.0.0');
  });

  test('updates monorepo for with hermes runtime and compiler versons separately', async () => {
    await updateHermesCompilerVersionInDependencies('0.1.0');
    await updateHermesRuntimeDependenciesVersions('0.14.0', '250829098.0.0');
  });
});
