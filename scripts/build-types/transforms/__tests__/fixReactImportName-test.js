/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const fixReactImportNameVisitor = require('../fixReactImportName.js');
const babel = require('@babel/core');

async function translate(code: string): Promise<string> {
  const result = await babel.transformAsync(code, {
    plugins: ['@babel/plugin-syntax-typescript', fixReactImportNameVisitor],
  });

  return result.code;
}

describe('fixReactImportName', () => {
  test('should fix wrong React import symbol', async () => {
    const code = `
      import * as React_2 from 'react';
      export type Cmp = React_2.Component<{}, {}>;
    `;
    const result = await translate(code);
    expect(result).toMatchInlineSnapshot(`
      "import * as React from 'react';
      export type Cmp = React.Component<{}, {}>;"
    `);
  });
});
