/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const reattachDocComments = require('../reattachDocComments.js');
const {parse, print} = require('hermes-transform');

const prettierOptions = {parser: 'babel'};

async function translate(code: string): Promise<string> {
  const parsed = await parse(code);
  const result = await reattachDocComments(parsed);
  return print(result.ast, result.mutatedCode, prettierOptions);
}

describe('reattachDocComments', () => {
  test('should move component doc block', async () => {
    const code = `
        import Bar from './Bar';

        /**
         * Foo documentation
         */
        let Foo: component(
        ref?: React.RefSetter<
            React.ElementRef<FooType>,
        >,
        ...props: FooProps
        );

        export default Foo;
    `;

    const result = await translate(code);
    expect(result).toMatchInlineSnapshot(`
      "import Bar from \\"./Bar\\";

      let Foo: component(
        ref?: React.RefSetter<React.ElementRef<FooType>>,
        ...props: FooProps
      );

      /**
       * Foo documentation
       */
      export default Foo;
      "
    `);
  });
  test('should move variable doc block', async () => {
    const code = `
        const bar = 'bar';
        /**
         * Foo documentation
         */
        const Foo: component(
        ref?: React.RefSetter<
            React.ElementRef<FooType>,
        >,
        ...props: FooProps
        ) = () => {};

        export default Foo;
    `;
    const result = await translate(code);
    expect(result).toMatchInlineSnapshot(`
      "const bar = \\"bar\\";
      const Foo: component(
        ref?: React.RefSetter<React.ElementRef<FooType>>,
        ...props: FooProps
      ) = () => {};

      /**
       * Foo documentation
       */
      export default Foo;
      "
    `);
  });
});
