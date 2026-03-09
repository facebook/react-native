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
const {parse, print} = require('hermes-transform');

const prettierOptions = {parser: 'babel'};

async function translate(code: string): Promise<string> {
  const parsed = await parse(code);
  const result = await replaceSymbolSyntax(parsed);
  return print(result.ast, result.mutatedCode, prettierOptions);
}

describe('replaceSymbolSyntax', () => {
  test('replaces @@iterator in an interface', async () => {
    const result = await translate(
      'interface Foo { @@iterator(): Iterator<[string, string]> }',
    );

    expect(result).toBe(
      'interface Foo {\n  __iterator(): Iterator<[string, string]>;\n}\n',
    );
  });

  test('replaces @@asyncIterator in an interface', async () => {
    const result = await translate(
      'interface Foo { @@asyncIterator(): AsyncIterator<string> }',
    );

    expect(result).toBe(
      'interface Foo {\n  __asyncIterator(): AsyncIterator<string>;\n}\n',
    );
  });

  test('replaces @@dispose in an interface', async () => {
    const result = await translate('interface Foo { @@dispose(): void }');

    expect(result).toBe('interface Foo {\n  __dispose(): void;\n}\n');
  });

  test('replaces @@asyncDispose in an interface', async () => {
    const result = await translate(
      'interface Foo { @@asyncDispose(): Promise<void> }',
    );

    expect(result).toBe(
      'interface Foo {\n  __asyncDispose(): Promise<void>;\n}\n',
    );
  });

  test('replaces @@iterator in a declare class', async () => {
    const result = await translate(
      'declare class Foo { @@iterator(): Iterator<[string, string]> }',
    );

    expect(result).toBe(
      'declare class Foo {\n  __iterator(): Iterator<[string, string]>;\n}\n',
    );
  });

  test('replaces @@iterator in a type alias', async () => {
    const result = await translate(
      'type Foo = { @@iterator(): Iterator<[string, string]> }',
    );

    expect(result).toBe(
      'type Foo = { __iterator(): Iterator<[string, string]> };\n',
    );
  });

  test('does not replace @@iterator when it is not a method', async () => {
    const result = await translate(
      'type Foo = { @@iterator: () => Iterator<[string, string]> }',
    );

    expect(result).toBe(
      'type Foo = { @@iterator: () => Iterator<[string, string]> };\n',
    );
  });
});
