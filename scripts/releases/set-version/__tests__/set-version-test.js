/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

const setVersion = require('../index');
const path = require('path');

let customWriteFileExpect = null;
const writeFileMock = jest.fn().mockImplementation((filePath, content) => {
  if (customWriteFileExpect != null) {
    customWriteFileExpect(filePath, content);
  }

  expect(content).toMatchSnapshot(
    // Make snapshot names resilient to platform path sep differences
    path
      .relative(path.join(__dirname, '__fixtures__'), filePath)
      .split(path.sep)
      .join('/'),
  );
});

describe('setVersion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  beforeAll(() => {
    jest.mock('path', () => {
      // $FlowIgnore[underconstrained-implicit-instantiation]
      const originalPath = jest.requireActual('path');
      return {
        ...originalPath,
        dirname: () => originalPath.join(__dirname, '__fixtures__/two/levels'),
      };
    });

    jest.mock('fs', () => {
      // $FlowIgnore[underconstrained-implicit-instantiation]
      const originalFs = jest.requireActual('fs');

      return {
        ...originalFs,
        promises: {
          ...originalFs.promises,
          writeFile: writeFileMock,
        },
      };
    });
  });

  test('updates monorepo for release-candidate', async () => {
    await setVersion('0.80.0-rc.3');
  });

  test('updates monorepo for stable version', async () => {
    await setVersion('0.80.1');
  });

  test('updates monorepo for nightly', async () => {
    await setVersion('0.81.0-nightly-29282302-abcd1234');
  });

  test('updates monorepo on main after release cut', async () => {
    customWriteFileExpect = (filePath /*: string */, content /*: string */) => {
      const reactNativePath = path.join('react-native', 'package.json');
      if (filePath.endsWith(reactNativePath)) {
        expect(JSON.parse(content).version).toBe('1000.0.0');
      }
      const templatePath = path.join(
        'react-native',
        'template',
        'package.json',
      );
      if (filePath.endsWith(templatePath)) {
        expect(JSON.parse(content).dependencies['react-native']).toBe(
          '1000.0.0',
        );
      }
    };

    await setVersion('0.82.0-main', true);

    // Make sure we don't update any react-native source or build files
    writeFileMock.mock.calls.forEach(([filePath, content]) => {
      if (!filePath.endsWith('package.json')) {
        throw new Error(
          `set-version should not update any react-native source or build files. Updated ${filePath}`,
        );
      }
    });
  });

  afterAll(() => {
    jest.unmock('path');
    jest.unmock('fs');
  });
});
