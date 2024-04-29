/**
 * @flow strict
 * @format
 */

type PrettyFormatPlugin =
  | {
      test: (value: mixed) => boolean,
      print: (value: mixed) => string,
    }
  | {
      test: (value: mixed) => boolean,
      serialize: (value: mixed) => string,
    };

declare module 'pretty-format' {
  declare module.exports: {
    (
      value: mixed,
      options?: ?{
        callToJSON?: ?boolean,
        escapeRegex?: ?boolean,
        escapeString?: ?boolean,
        highlight?: ?boolean,
        indent?: ?number,
        maxDepth?: ?number,
        min?: ?boolean,
        plugins?: ?Array<PrettyFormatPlugin>,
        printFunctionName?: ?boolean,
        theme?: ?{
          comment?: ?string,
          prop?: ?string,
          tag?: ?string,
          value: ?string,
        },
      },
    ): string,

    plugins: {
      AsymmetricMatcher: PrettyFormatPlugin,
      ConvertAnsi: PrettyFormatPlugin,
      DOMCollection: PrettyFormatPlugin,
      DOMElement: PrettyFormatPlugin,
      Immutable: PrettyFormatPlugin,
      ReactElement: PrettyFormatPlugin,
      ReactTestComponent: PrettyFormatPlugin,
    },
  };
}
