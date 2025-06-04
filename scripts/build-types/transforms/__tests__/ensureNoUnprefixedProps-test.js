/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const ensureNoUnprefixedProps = require('../ensureNoUnprefixedProps.js');
const {parse, print} = require('hermes-transform');

const prettierOptions = {parser: 'babel'};

async function translate(code: string): Promise<string> {
  const parsed = await parse(code);
  const result = await ensureNoUnprefixedProps(parsed);
  return print(result.ast, result.mutatedCode, prettierOptions);
}

describe('ensureNoUnprefixedProps', () => {
  test('should throw when encountering unprefixed Props type', async () => {
    const code = `type Props = {}`;
    await expect(translate(code)).rejects.toThrow();
  });

  test('should throw when encountering unprefixed Props interface', async () => {
    const code = `interface Props {}`;
    await expect(translate(code)).rejects.toThrow();
  });

  test('should not throw when encountering prefixed Props type', async () => {
    const code = `type ViewProps = {}`;
    await expect(translate(code)).resolves.toBeDefined();
  });

  test('should not throw when encountering prefixed Props interface', async () => {
    const code = `interface ViewProps {}`;
    await expect(translate(code)).resolves.toBeDefined();
  });
});
