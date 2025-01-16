/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @flow strict
 * @format
 * @oncall react_native
 */
declare type Print = (value: mixed) => string;
declare type Indent = (value: string) => string;
declare type PluginOptions = {
  edgeSpacing: string,
  min: boolean,
  spacing: string,
};
declare type Colors = {
  comment: {close: string, open: string},
  content: {close: string, open: string},
  prop: {close: string, open: string},
  tag: {close: string, open: string},
  value: {close: string, open: string},
};

declare type PrettyFormatPlugin =
  | {
      print: (
        value: mixed,
        print?: ?Print,
        indent?: ?Indent,
        options?: ?PluginOptions,
        colors?: ?Colors,
      ) => string,
      test: (value: mixed) => boolean,
    }
  | {
      serialize: (value: mixed) => string,
      test: (value: mixed) => boolean,
    };

declare module 'pretty-format' {
  declare export type CompareKeys =
    | ((a: string, b: string) => number)
    | null
    | void;
  declare export function format(
    value: mixed,
    options?: ?{
      callToJSON?: ?boolean,
      compareKeys?: CompareKeys,
      escapeRegex?: ?boolean,
      escapeString?: ?boolean,
      highlight?: ?boolean,
      indent?: ?number,
      maxDepth?: ?number,
      maxWidth?: ?number,
      min?: ?boolean,
      plugins?: ?Array<PrettyFormatPlugin>,
      printBasicPrototype?: ?boolean,
      printFunctionName?: ?boolean,
      theme?: ?{
        comment?: ?string,
        content?: ?string,
        prop?: ?string,
        tag?: ?string,
        value: ?string,
      },
    },
  ): string;
  declare export const plugins: {
    AsymmetricMatcher: PrettyFormatPlugin,
    DOMCollection: PrettyFormatPlugin,
    DOMElement: PrettyFormatPlugin,
    Immutable: PrettyFormatPlugin,
    ReactElement: PrettyFormatPlugin,
    ReactTestComponent: PrettyFormatPlugin,
  };
}
