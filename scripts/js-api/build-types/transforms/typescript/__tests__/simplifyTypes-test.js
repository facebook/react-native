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

const postTransforms = [require('../simplifyTypes')];

async function applyPostTransforms(inSrc: string): Promise<string> {
  const result = await babel.transformAsync(inSrc, {
    plugins: ['@babel/plugin-syntax-typescript', ...postTransforms],
  });

  return result.code;
}

describe('simplifyTypes', () => {
  test('should resolve Readonly on a type literal', async () => {
    const code = `
      type Baz = Readonly<{
        foo: string;
      }>;
    `;

    const result = await applyPostTransforms(code);
    expect(result).toMatchInlineSnapshot(`
      "type Baz = {
        readonly foo: string;
      };"
    `);
  });

  test('should keep Readonly on a type reference', async () => {
    const code = `
      type Foo = {
        foo: string;
      };

      type Baz = Readonly<Foo>;
    `;

    const result = await applyPostTransforms(code);
    expect(result).toMatchInlineSnapshot(`
      "type Foo = {
        foo: string;
      };
      type Baz = Readonly<Foo>;"
    `);
  });

  test('should resolve Partial on a type literal', async () => {
    const code = `
      type Baz = Partial<{
        foo: string;
      }>;
    `;

    const result = await applyPostTransforms(code);
    expect(result).toMatchInlineSnapshot(`
      "type Baz = {
        foo?: string;
      };"
    `);
  });

  test('should keep Partial on a type reference', async () => {
    const code = `
      type Foo = {
        foo: string;
      };

      type Baz = Partial<Foo>;
    `;

    const result = await applyPostTransforms(code);
    expect(result).toMatchInlineSnapshot(`
      "type Foo = {
        foo: string;
      };
      type Baz = Partial<Foo>;"
    `);
  });

  test('should resolve nested utility types on a type literal', async () => {
    const code = `
      type Baz = Readonly<Partial<{
        foo: string;
      }>>;
    `;

    const result = await applyPostTransforms(code);
    expect(result).toMatchInlineSnapshot(`
      "type Baz = {
        readonly foo?: string;
      };"
    `);
  });

  test('should resolve intersection on type literals', async () => {
    const code = `
      type Baz = {
        foo: string;
      } & {
        bar: number;
      };
    `;

    const result = await applyPostTransforms(code);
    expect(result).toMatchInlineSnapshot(`
      "type Baz = {
        foo: string;
        bar: number;
      };"
    `);
  });

  test('should resolve intersection with an empty type', async () => {
    const code = `
      type Foo = {
        foo: string;
      };

      type Baz = Foo & {};
    `;

    const result = await applyPostTransforms(code);
    expect(result).toMatchInlineSnapshot(`
      "type Foo = {
        foo: string;
      };
      type Baz = Foo;"
    `);
  });

  test('should resolve a simple Omit', async () => {
    const code = `
      type Foo = {
        foo: string;
      };

      type Baz = (arg: Omit<Foo, 'bar'>) => void;
    `;

    const result = await applyPostTransforms(code);
    expect(result).toMatchInlineSnapshot(`
      "type Foo = {
        foo: string;
      };
      type Baz = (arg: Foo) => void;"
    `);
  });

  test('should resolve Omit with keyof', async () => {
    const code = `
      type Foo = {
        foo: string;
      };

      type Bar = {
        bar: number;
      };

      type Baz = (arg: Omit<Foo, keyof Bar>) => void;
    `;

    const result = await applyPostTransforms(code);
    expect(result).toMatchInlineSnapshot(`
      "type Foo = {
        foo: string;
      };
      type Bar = {
        bar: number;
      };
      type Baz = (arg: Foo) => void;"
    `);
  });

  test('should resolve Omit with keyof {}', async () => {
    const code = `
      type Foo = {
        foo: string;
      };

      type baz = Omit<Foo, keyof {}>
    `;

    const result = await applyPostTransforms(code);
    expect(result).toMatchInlineSnapshot(`
      "type Foo = {
        foo: string;
      };
      type baz = Foo;"
    `);
  });

  test('should resolve Omit with keyof when types overlap', async () => {
    const code = `
      type Foo = {
        foo: string;
        bar: number;
      };

      type Baz = (arg: Omit<Foo, 'bar' | 'baz'>) => void;
    `;

    const result = await applyPostTransforms(code);
    expect(result).toMatchInlineSnapshot(`
      "type Foo = {
        foo: string;
        bar: number;
      };
      type Baz = (arg: Omit<Foo, \\"bar\\">) => void;"
    `);
  });

  test('should resolve Omit when types overlap', async () => {
    const code = `
      type Foo = {
        foo: string;
        bar: number;
      };

      type Bar = {
        bar: number;
        baz: string;
      };

      type Baz = (arg: Omit<Foo, keyof Bar>) => void;
    `;

    const result = await applyPostTransforms(code);
    expect(result).toMatchInlineSnapshot(`
      "type Foo = {
        foo: string;
        bar: number;
      };
      type Bar = {
        bar: number;
        baz: string;
      };
      type Baz = (arg: Omit<Foo, \\"bar\\">) => void;"
    `);
  });

  test('should resolve Omit keys when the object type is unresolvable', async () => {
    const code = `
      type Foo<T> = Omit<Bar, keyof { touchHistory: string }>
    `;

    const result = await applyPostTransforms(code);
    expect(result).toMatchInlineSnapshot(
      `"type Foo<T> = Omit<Bar, \\"touchHistory\\">;"`,
    );
  });
});
