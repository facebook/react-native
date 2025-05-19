/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const sortTypeDefinitionsVisitor = require('../sortTypeDefinitions.js');
const babel = require('@babel/core');
const {promises: fs} = require('fs');
const path = require('path');

async function translate(code: string): Promise<string> {
  const result = await babel.transformAsync(code, {
    plugins: ['@babel/plugin-syntax-typescript', sortTypeDefinitionsVisitor],
  });

  return result.code;
}

describe('sortTypeDefinitions', () => {
  test('should divide top-lelvel declarations into exported and non-exported sections', async () => {
    const code = await fs.readFile(
      path.join(__dirname, '../__fixtures__/sortTypeDefinitions.d.ts'),
      'utf-8',
    );
    const result = await translate(code);
    expect(result).toMatchSnapshot();
  });
});
