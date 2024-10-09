// flow-typed signature: b1b274e8ae71623bf11c20224c446842
// flow-typed version: c6154227d1/mkdirp_v0.5.x/flow_>=v0.104.x

declare module 'mkdirp' {
  declare type Options = number | {
    mode?: number,
    fs?: mixed,
    ...
  };

  declare type Callback = (err: ?Error, path: ?string) => void;

  declare module.exports: {
    (path: string, options?: Options | Callback, callback?: Callback): void,
    sync(path: string, options?: Options): void,
    ...
  };
}
