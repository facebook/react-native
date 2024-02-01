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
        writeFileSync: (packagePath, content) => {
          expect(content).toMatchSnapshot(
            path.basename(path.join(packagePath, '..')),
          );
        },
      };
    });
  });
  test('updates all public packages to version', () => {
    setVersion('0.80.0');
  });
  afterAll(() => {
    jest.unmock('path');
    jest.unmock('fs');
  });
});
