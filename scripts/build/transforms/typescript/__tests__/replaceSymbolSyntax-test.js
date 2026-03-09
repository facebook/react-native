/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const replaceSymbolSyntax = require('../replaceSymbolSyntax');
const babel = require('@babel/core');

async function translate(code: string): Promise<string> {
  const result = await babel.transformAsync(code, {
    plugins: ['@babel/plugin-syntax-typescript', replaceSymbolSyntax],
  });

  return result.code;
}

describe('replaceSymbolSyntax', () => {
  test('replaces __iterator in an interface', async () => {
    const result = await translate(
      'interface Foo { __iterator(): Iterator<[string, string]> }',
    );

    expect(result).toBe(
      'interface Foo {\n  [Symbol.iterator](): Iterator<[string, string]>;\n}',
    );
  });

  test('replaces __asyncIterator in an interface', async () => {
    const result = await translate(
      'interface Foo { __asyncIterator(): AsyncIterator<string> }',
    );

    expect(result).toBe(
      'interface Foo {\n  [Symbol.asyncIterator](): AsyncIterator<string>;\n}',
    );
  });

  test('replaces __dispose in an interface', async () => {
    const result = await translate('interface Foo { __dispose(): void }');

    expect(result).toBe(
      'interface Foo {\n  [Symbol.dispose](): void;\n}',
    );
  });

  test('replaces __asyncDispose in an interface', async () => {
    const result = await translate(
      'interface Foo { __asyncDispose(): Promise<void> }',
    );

    expect(result).toBe(
      'interface Foo {\n  [Symbol.asyncDispose](): Promise<void>;\n}',
    );
  });

  test('replaces __iterator in a declare class', async () => {
    const result = await translate(
      'declare class Foo { __iterator(): Iterator<[string, string]> }',
    );

    expect(result).toBe(
      'declare class Foo {\n  __iterator(): Iterator<[string, string]>;\n}',
    );
  });

  test('replaces __iterator in a type alias', async () => {
    const result = await translate(
      'type Foo = { __iterator(): Iterator<[string, string]> }',
    );

    expect(result).toBe(
      'type Foo = {\n  [Symbol.iterator](): Iterator<[string, string]>;\n};',
    );
  });

  test('does not replace __iterator when it is not a method', async () => {
    const result = await translate(
      'interface Foo { __iterator: () => Iterator<[string, string]> }',
    );

    expect(result).toBe(
      'interface Foo {\n  __iterator: () => Iterator<[string, string]>;\n}',
    );
  });
});
