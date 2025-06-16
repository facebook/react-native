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
  test('should inline type non-generic type aliases', async () => {
    const code = `
      type AnimatedNodeConfig = {
        readonly debugID?: string | undefined;
      };

      export type Example = Omit<
        AnimatedNodeConfig,
        keyof {
          useNativeDriver: boolean;
        }
      > & {
        useNativeDriver: boolean;
      };
    `;

    const result = await applyPostTransforms(code);
    expect(result).toMatchInlineSnapshot(`
      "export type Example = {
        readonly debugID?: string | undefined;
      } & {
        useNativeDriver: boolean;
      };"
    `);
  });

  test('should skip recursive definitions', async () => {
    const code = `
      export type LinkedNode = {
        value: number;
        next: LinkedNode;
      };
    `;

    const result = await applyPostTransforms(code);
    expect(result).toMatchInlineSnapshot(`
      "export type LinkedNode = {
        value: number;
        next: LinkedNode;
      };"
    `);
  });

  test('should skip co-recursive definitions', async () => {
    const code = `
      export type Expr = Add | Multiply | number;

      export type Add = {
        type: 'add';
        lhs: Expr;
        rhs: Expr;
      };

      export type Multiply = {
        type: 'multiply';
        lhs: Expr;
        rhs: Expr;
      };
    `;

    const result = await applyPostTransforms(code);
    expect(result).toMatchInlineSnapshot(`
      "export type Expr = Add | Multiply | number;
      export type Add = {
        type: 'add';
        lhs: Add | Multiply | number;
        rhs: Expr;
      };
      export type Multiply = {
        type: 'multiply';
        lhs: Expr;
        rhs: Expr;
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
