const moveComponentDocBlocks = require('../moveComponentDocBlocks.js');
const {parse, print} = require('hermes-transform');

const prettierOptions = {parser: 'babel'};

async function translate(code: string): Promise<string> {
  const parsed = await parse(code);
  const result = await moveComponentDocBlocks(parsed);
  return print(result.ast, result.mutatedCode, prettierOptions);
}

describe('moveComponentDocBlocks', () => {
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
});
