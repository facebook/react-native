/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 * @nolint
 */

declare module 'fbjs/lib/countDistinct' {
  declare module.exports: {|
    <T1, T2>(iter: Iterable<T1>, selector: (item: T1) => T2): number,
  |};
}

declare module 'fbjs/lib/warning' {
  declare module.exports: {|
    (condition: mixed, format: string, ...args: $ReadOnlyArray<mixed>): void,
  |};
}

declare module 'fbjs/lib/shallowEqual' {
  declare module.exports: {|
    (objA: mixed, objB: mixed): boolean,
  |};
}

declare module 'fbjs/lib/EventListener' {
  declare module.exports: {|
    listen(
      target: EventTarget,
      eventType: string,
      callback: any,
    ): {remove(): void, ...},
    capture(
      target: EventTarget,
      eventType: string,
      callback: any,
    ): {remove(): void, ...},
  |};
}

declare module 'fbjs/lib/ExecutionEnvironment' {
  declare module.exports: {|
    +canUseDOM: boolean,
    +canUseWorkers: boolean,
    +canUseEventListeners: boolean,
    +canUseViewport: boolean,
    +isInWorker: boolean,
  |};
}

declare module 'fbjs/lib/UserAgentData' {
  declare module.exports: {|
    +browserArchitecture: string,
    +browserFullVersion: string,
    +browserMinorVersion: string,
    +browserName: string,
    +browserVersion: string,
    +deviceName: string,
    +engineName: string,
    +engineVersion: string,
    +platformArchitecture: string,
    +platformName: string,
    +platformVersion: string,
    +platformFullVersion: string,
  |};
}

declare module 'fbjs/lib/VersionRange' {
  declare module.exports: {|
    contains(range: string, version: string): boolean,
  |};
}

declare module 'fbjs/lib/base62' {
  declare module.exports: {|
    (number: number): string,
  |};
}

declare module 'fbjs/lib/compactArray' {
  declare module.exports: {|
    <T>(array: Array<T | null | void>): Array<T>,
  |};
}

declare module 'fbjs/lib/concatAllArray' {
  declare module.exports: any;
}

declare module 'fbjs/lib/crc32' {
  declare module.exports: {|
    (str: string): number,
  |};
}

declare module 'fbjs/lib/distinctArray' {
  declare module.exports: {|
    <T>(xs: Iterable<T>): Array<T>,
  |};
}

declare module 'fbjs/lib/emptyObject' {
  declare module.exports: {||};
}

declare module 'fbjs/lib/equalsSet' {
  declare module.exports: {|
    <T>(one: Set<T>, two: Set<T>): boolean,
  |};
}

declare module 'fbjs/lib/everyObject' {
  declare module.exports: {|
    (
      object: mixed,
      callback: (value: any, name: string, object: mixed) => any,
      context?: any,
    ): boolean,
  |};
}

declare module 'fbjs/lib/everySet' {
  declare module.exports: {|
    <T>(
      object: ?Set<T>,
      callback: (value: any, name: string, object: Set<T>) => any,
      context?: any,
    ): boolean,
  |};
}

declare module 'fbjs/lib/filterObject' {
  declare module.exports: any;
}

declare module 'fbjs/lib/forEachObject' {
  declare module.exports: any;
}

declare module 'fbjs/lib/groupArray' {
  declare module.exports: any;
}

declare module 'fbjs/lib/joinClasses' {
  declare module.exports: {|
    (className: mixed): string,
  |};
}

declare module 'fbjs/lib/keyMirrorRecursive' {
  declare module.exports: any;
}

declare module 'fbjs/lib/keyOf' {
  declare module.exports: any;
}

declare module 'fbjs/lib/maxBy' {
  declare module.exports: {|
    <A, B>(
      as: Iterable<A>,
      f: (a: A) => B,
      compare?: ?(u: B, v: B) => number,
    ): ?A,
  |};
}

declare module 'fbjs/lib/memoizeStringOnly' {
  declare module.exports: {|
    <T>(callback: (s: string) => T): (s: string) => T,
  |};
}

declare module 'fbjs/lib/minBy' {
  declare module.exports: {|
    <A, B>(
      as: Iterable<A>,
      f: (a: A) => B,
      compare?: ?(u: B, v: B) => number,
    ): ?A,
  |};
}

declare module 'fbjs/lib/partitionArray' {
  declare module.exports: {|
    <Tv>(
      array: Array<Tv>,
      predicate: (value: Tv, index: number, array: Array<Tv>) => boolean,
      context?: any,
    ): [Array<Tv>, Array<Tv>],
  |};
}

declare module 'fbjs/lib/partitionObject' {
  declare module.exports: {|
    <Tv>(
      object: {[key: string]: Tv, ...},
      callback: (
        value: Tv,
        key: string,
        object: {[key: string]: Tv, ...},
      ) => boolean,
      context?: any,
    ): [{[key: string]: Tv, ...}, {[key: string]: Tv, ...}],
  |};
}

declare module 'fbjs/lib/partitionObjectByKey' {
  declare module.exports: any;
}

declare module 'fbjs/lib/performance' {
  declare module.exports: any;
}

declare module 'fbjs/lib/performanceNow' {
  declare module.exports: any;
}

declare module 'fbjs/lib/requestAnimationFrame' {
  declare module.exports: any;
}

declare module 'fbjs/lib/someObject' {
  declare module.exports: {|
    (
      object: mixed,
      callback: (value: any, name: string, object: mixed) => any,
      context?: any,
    ): boolean,
  |};
}

declare module 'fbjs/lib/someSet' {
  declare module.exports: {|
    <T>(
      set: Set<T>,
      callback: (value: T, key: T, set: Set<T>) => boolean,
      context?: any,
    ): boolean,
  |};
}

declare module 'fbjs/lib/keyMirror' {
  declare module.exports: {|
    <T: {...}>(obj: T): $ObjMapi<T, <K>(K) => K>,
  |};
}

declare module 'fbjs/lib/invariant' {
  declare module.exports: {|
    (condition: mixed, format: string, ...args: Array<mixed>): void,
  |};
}
