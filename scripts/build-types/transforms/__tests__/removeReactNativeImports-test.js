/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const removeReactNativeImports = require('../removeReactNativeImports.js');
const babel = require('@babel/core');

async function translate(code: string): Promise<string> {
  const result = await babel.transformAsync(code, {
    plugins: ['@babel/plugin-syntax-typescript', removeReactNativeImports],
  });

  return result.code;
}

describe('removeReactNativeImports', () => {
  test('should remove import and remove suffix', async () => {
    const code = `
      import {View as View_2} from 'react-native';
      const Foo = View_2;
      export default Foo;
    `;
    const result = await translate(code);
    expect(result).toMatchInlineSnapshot(`
      "const Foo = View;
      export default Foo;"
    `);
  });

  test('should remove import and decrease suffix', async () => {
    const code = `
      import {View as View_3} from 'react-native';
      const Foo = View_3;
      export default Foo;
    `;
    const result = await translate(code);
    expect(result).toMatchInlineSnapshot(`
      "const Foo = View_2;
      export default Foo;"
    `);
  });
});
