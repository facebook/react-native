/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const babel = require('@babel/core');

const postTransforms = [require('../inlineTypes')];

async function applyPostTransforms(inSrc: string): Promise<string> {
  const result = await babel.transformAsync(inSrc, {
    plugins: ['@babel/plugin-syntax-typescript', ...postTransforms],
  });

  return result.code;
}

describe('inlineTypes', () => {
  test('should resolve `keyof` operator on a type literal', async () => {
    const code = `
      export type FooKeys = keyof {
        A: number;
        B: string;
        C: boolean;
      };
    `;

    const result = await applyPostTransforms(code);
    expect(result).toMatchInlineSnapshot(
      `"export type FooKeys = \\"A\\" | \\"B\\" | \\"C\\";"`,
    );
  });

  test('should resolve the builtin Omit<T, K> type on a type literal', async () => {
    const code = `

      export type Bar = Omit<
        {
          A: number;
          B: string;
          C: boolean;
          D: 123;
        },
        'B' | 'D'
      >;
    `;

    const result = await applyPostTransforms(code);
    expect(result).toMatchInlineSnapshot(`
      "export type Bar = {
        A: number;
        C: boolean;
      };"
    `);
  });

  test('keyof {} is never', async () => {
    const code = `
      export type NeverInDisguise = keyof {};
    `;

    const result = await applyPostTransforms(code);
    expect(result).toMatchInlineSnapshot(
      `"export type NeverInDisguise = never;"`,
    );
  });

  test('keyof for objects with computed string properties', async () => {
    const code = `
      export type Foo = keyof { 'a-key': number, 'b-key': number };
    `;

    const result = await applyPostTransforms(code);
    expect(result).toMatchInlineSnapshot(
      `"export type Foo = \\"a-key\\" | \\"b-key\\";"`,
    );
  });

  test('resolves Readonly type', async () => {
    const code = `
    export type Foo = Readonly<{ a?: number, 'b-key': number }>;
  `;

    const result = await applyPostTransforms(code);
    expect(result).toMatchInlineSnapshot(`
      "export type Foo = {
        readonly a?: number;
        readonly 'b-key': number;
      };"
    `);
  });
});
