/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

// $FlowFixMe[untyped-import] - Flow lib is not configured.
import {ESLint} from 'eslint';
import path from 'path';

const REPO_DIR = path.resolve(__dirname, '..', '..', '..');

describe('react-native/.eslintrc.js', () => {
  describe('lint/sort-imports', () => {
    const testDirectories = [
      '.',
      'packages/react-native',
      'packages/react-native/Libraries',
      'packages/virtualized-lists',
      'tools',
    ];
    const testFilenames = ['file.js', 'file.js.flow', 'file.jsx'];

    const testPaths = testDirectories.flatMap(testDirectory =>
      testFilenames.map(testFilename => path.join(testDirectory, testFilename)),
    );

    it.each(testPaths)('checks `%s`', async testPath => {
      const eslint = new ESLint({cwd: REPO_DIR});
      const config = await eslint.calculateConfigForFile(testPath);
      expect(config).toHaveProperty(
        'rules',
        expect.objectContaining({
          'lint/sort-imports': expect.arrayContaining([1]),
        }),
      );
    });
  });
});
