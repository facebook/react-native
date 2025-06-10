/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const renameDefaultExportedIdentifiersVisitor = require('../renameDefaultExportedIdentifiers.js');
const babel = require('@babel/core');

async function translate(code: string): Promise<string> {
  const result = await babel.transformAsync(code, {
    plugins: [
      '@babel/plugin-syntax-typescript',
      renameDefaultExportedIdentifiersVisitor,
    ],
  });

  return result.code;
}

describe('renameDefaultExportedIdentifiers', () => {
  test('should rename local variable which is default-exported', async () => {
    const code = `
      declare const LocalType;
      declare const ExportedAlias: typeof LocalType;
      declare type ExportedAlias = typeof ExportedAlias;
      export default ExportedAlias;`;
    const result = await translate(code);
    expect(result).toMatchInlineSnapshot(`
      "declare const LocalType_default;
      declare const ExportedAlias: typeof LocalType_default;
      declare type ExportedAlias = typeof ExportedAlias;
      export default ExportedAlias;"
    `);
  });

  test('should rename local class name which is default-exported inline', async () => {
    const code = `
      export default class ExportedClass {}`;
    const result = await translate(code);
    expect(result).toMatchInlineSnapshot(
      `"export default class ExportedClass_default {}"`,
    );
  });

  test('should rename local class name which is default-exported', async () => {
    const code = `
      class ExportedClass {}
      export default ExportedClass;`;
    const result = await translate(code);
    expect(result).toMatchInlineSnapshot(`
      "class ExportedClass_default {}
      export default ExportedClass_default;"
    `);
  });

  test('should rename local function name which is default-exported inline', async () => {
    const code = `
      export default function exportedFunction() {}`;
    const result = await translate(code);
    expect(result).toMatchInlineSnapshot(
      `"export default function exportedFunction_default() {}"`,
    );
  });

  test('should rename local function name which is default-exported', async () => {
    const code = `
      function exportedFunction() {}
      export default exportedFunction;`;
    const result = await translate(code);
    expect(result).toMatchInlineSnapshot(`
      "function exportedFunction_default() {}
      export default exportedFunction_default;"
    `);
  });

  test('should not rename identifiers with the same name in member expressions', async () => {
    const code = `
      import Other from 'Other';
      type Type = typeof Other.Exported;
      class Exported {}
      export default Exported;`;
    const result = await translate(code);
    expect(result).toMatchInlineSnapshot(`
      "import Other from 'Other';
      type Type = typeof Other.Exported;
      class Exported_default {}
      export default Exported_default;"
    `);
  });
});
