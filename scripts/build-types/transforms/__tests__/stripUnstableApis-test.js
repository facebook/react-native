/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const stripUnstableApisVisitor = require('../stripUnstableApis.js');
const babel = require('@babel/core');

async function translate(code: string): Promise<string> {
  const result = await babel.transformAsync(code, {
    plugins: ['@babel/plugin-syntax-typescript', stripUnstableApisVisitor],
  });

  return result.code;
}

describe('stripUnstableApis', () => {
  test('should delete type properties beginning with unstable_', async () => {
    const code = `
      type Foo = {
        unstable_Foo: () => void,
        unstable_Bar: string,
        unstable_Baz(): void,
        property: string,
      };
    `;
    const result = await translate(code);
    expect(result).toMatchInlineSnapshot(`
      "type Foo = {
        property: string;
      };"
    `);
  });

  test('should delete interface properties beginning with unstable_', async () => {
    const code = `
      interface Foo {
        unstable_Foo: () => void;
        unstable_Bar: string;
        unstable_Baz(): void;
        property: string;
      }
    `;
    const result = await translate(code);
    expect(result).toMatchInlineSnapshot(`
      "interface Foo {
        property: string;
      }"
    `);
  });

  test('should delete class members beginning with unstable_', async () => {
    const code = `
      class Foo {
        unstable_Foo: () => void;
        unstable_Bar: string;
        unstable_Baz(): void;
        property: string;
      }
    `;
    const result = await translate(code);
    expect(result).toMatchInlineSnapshot(`
      "class Foo {
        property: string;
      }"
    `);
  });

  test('should delete top-level symbols beginning with unstable_', async () => {
    const code = `
      class unstable_Foo {}
      function unstable_Bar() {}
      const unstable_Baz = () => {};
      declare var unstable_Qux: string;
      declare function unstable_Quux(): string;
      declare class unstable_Corge {}
    `;
    const result = await translate(code);
    expect(result).toMatchInlineSnapshot(`""`);
  });

  test('should delete type properties beginning with experimental_', async () => {
    const code = `
      type Foo = {
        experimental_Foo: () => void,
        experimental_Bar: string,
        experimental_Baz(): void,
        property: string,
      };
    `;
    const result = await translate(code);
    expect(result).toMatchInlineSnapshot(`
      "type Foo = {
        property: string;
      };"
    `);
  });

  test('should delete interface properties beginning with experimental_', async () => {
    const code = `
      interface Foo {
        experimental_Foo: () => void;
        experimental_Bar: string;
        experimental_Baz(): void;
        property: string;
      }
    `;
    const result = await translate(code);
    expect(result).toMatchInlineSnapshot(`
      "interface Foo {
        property: string;
      }"
    `);
  });

  test('should delete class members beginning with experimental_', async () => {
    const code = `
      class Foo {
        experimental_Foo: () => void;
        experimental_Bar: string;
        experimental_Baz(): void;
        property: string;
      }
    `;
    const result = await translate(code);
    expect(result).toMatchInlineSnapshot(`
      "class Foo {
        property: string;
      }"
    `);
  });

  test('should delete top-level symbols beginning with experimental_', async () => {
    const code = `
      class experimental_Foo {}
      function experimental_Bar() {}
      const experimental_Baz = () => {};
      declare var experimental_Qux: string;
      declare function experimental_Quux(): string;
      declare class experimental_Corge {}
    `;
    const result = await translate(code);
    expect(result).toMatchInlineSnapshot(`""`);
  });
});
