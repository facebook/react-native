/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

declare module 'console' {
  declare function assert(value: any, ...message: any): void;
  declare function dir(
    obj: Object,
    options: {showHidden: boolean, depth: number, colors: boolean},
  ): void;
  declare function error(...data: any): void;
  declare function info(...data: any): void;
  declare function log(...data: any): void;
  declare function time(label: any): void;
  declare function timeEnd(label: any): void;
  declare function trace(first: any, ...rest: any): void;
  declare function warn(...data: any): void;
  declare class Console {
    constructor(stdout: stream$Writable, stdin?: stream$Writable): void;
    assert(value: any, ...message: any): void,
    dir(
      obj: Object,
      options: {showHidden: boolean, depth: number, colors: boolean},
    ): void,
    error(...data: any): void,
    info(...data: any): void,
    log(...data: any): void,
    time(label: any): void,
    timeEnd(label: any): void,
    trace(first: any, ...rest: any): void,
    warn(...data: any): void,
  }
}
