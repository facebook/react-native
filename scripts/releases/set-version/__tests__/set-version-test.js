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

describe('setVersion', () => {
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
          writeFile: (filePath, content) => {
            expect(content).toMatchSnapshot(
              // Make snapshot names resilient to platform path sep differences
              path
                .relative(path.join(__dirname, '__fixtures__'), filePath)
                .split(path.sep)
                .join('/'),
            );
          },
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

  afterAll(() => {
    jest.unmock('path');
    jest.unmock('fs');
  });
});
