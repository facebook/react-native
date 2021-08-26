// Copyright 2004-present Facebook. All Rights Reserved.

// flow-typed signature: 715c2f8b80fc0049acaff07253098596
// flow-typed version: a7cda84c32/qs_v6.5.x/flow_>=v0.45.x

declare module 'qs' {
  declare type ParseOptions = {
    allowPrototypes?: boolean,
    arrayLimit?: number,
    decoder?: Function,
    delimiter?: string,
    depth?: number,
    parameterLimit?: number,
    plainObjects?: boolean,
    strictNullHandling?: boolean,
    ignoreQueryPrefix?: boolean,
    parseArrays?: boolean,
    allowDots?: boolean,
  ...};

  declare type ArrayFormat = "brackets" | "indices" | "repeat";

  declare type FilterFunction = (prefix: string, value: any) => any;
  declare type FilterArray = Array<string | number>;
  declare type Filter = FilterArray | FilterFunction;

  declare type StringifyOptions = {
    encoder?: Function,
    delimiter?: string,
    strictNullHandling?: boolean,
    skipNulls?: boolean,
    encode?: boolean,
    sort?: Function,
    allowDots?: boolean,
    serializeDate?: Function,
    encodeValuesOnly?: boolean,
    format?: string,
    addQueryPrefix?: boolean,
    arrayFormat?: ArrayFormat,
    filter?: Filter,
  ...};

  declare type Formatter = (any) => string;

  declare type Formats = {
    RFC1738: string,
    RFC3986: string,
    "default": string,
    formatters: {
      RFC1738: Formatter,
      RFC3986: Formatter,
    ...},
  ...};

  declare module.exports: {
    parse(str: string, opts?: ParseOptions): Object,
    stringify(obj: Object | Array<any>, opts?: StringifyOptions): string,
    formats: Formats,
  ...};
}
