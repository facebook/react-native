/**
 * @flow strict
 * @format
 */

declare module 'promise/setimmediate/es6-extensions' {
  declare module.exports: Class<Promise>;
}

declare module 'promise/setimmediate/done' {
  declare module.exports: Class<Promise>;
}

declare module 'promise/setimmediate/finally' {
  declare module.exports: Class<Promise>;
}

declare module 'promise/setimmediate/rejection-tracking' {
  declare module.exports: {
    enable: (
      options?: ?{
        whitelist?: ?Array<mixed>,
        allRejections?: ?boolean,
        onUnhandled?: ?(number, mixed) => void,
        onHandled?: ?(number, mixed) => void,
      },
    ) => void,
    disable: () => void,
  };
}
