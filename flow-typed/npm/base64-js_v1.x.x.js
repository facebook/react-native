/**
 * @flow strict
 * @format
 */

declare module 'base64-js' {
  declare module.exports: {
    byteLength: string => number,
    fromByteArray: (Uint8Array | Array<number>) => string,
    toByteArray: string => Uint8Array,
  };
}
