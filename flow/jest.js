/**
 * Copyright (c) 2004-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Modified from https://raw.githubusercontent.com/flowtype/flow-typed/e3b0f3034929e0f0fb85c790450a201b380ac2fd/definitions/npm/jest_v17.x.x/flow_v0.33.x-/jest_v17.x.x.js
 * Duplicated from www/flow/shared/jest.js
 * @flow
 * @format
 */

'use strict';

type JestMockFn = {
  (...args: Array<any>): any,
  mock: {
    calls: Array<Array<any>>,
    instances: mixed,
  },
  mockClear(): Function,
  mockReset(): Function,
  mockImplementation(fn: Function): JestMockFn,
  mockImplementationOnce(fn: Function): JestMockFn,
  mockReturnThis(): void,
  mockReturnValue(value: any): JestMockFn,
  mockReturnValueOnce(value: any): JestMockFn,
};

type JestAsymmetricEqualityType = {
  asymmetricMatch(value: mixed): boolean,
};

type JestCallsType = {
  allArgs(): mixed,
  all(): mixed,
  any(): boolean,
  count(): number,
  first(): mixed,
  mostRecent(): mixed,
  reset(): void,
};

type JestClockType = {
  install(): void,
  mockDate(date: Date): void,
  tick(): void,
  uninstall(): void,
};

type JestMatcherResult = {
  message?: string | (() => string),
  pass: boolean,
};

type JestMatcher = (actual: any, expected: any) => JestMatcherResult;

type JestPromiseType = {
  /**
   * Use rejects to unwrap the reason of a rejected promise so any other
   * matcher can be chained. If the promise is fulfilled the assertion fails.
   */
  rejects: JestExpectType,
  /**
   * Use resolves to unwrap the value of a fulfilled promise so any other
   * matcher can be chained. If the promise is rejected the assertion fails.
   */
  resolves: JestExpectType,
};

type JestExpectType = {
  not: JestExpectType,
  lastCalledWith(...args: Array<any>): void,
  toBe(value: any): void,
  toBeCalled(): void,
  toBeCalledWith(...args: Array<any>): void,
  toBeCloseTo(num: number, delta: any): void,
  toBeDefined(): void,
  toBeFalsy(): void,
  toBeGreaterThan(number: number): void,
  toBeGreaterThanOrEqual(number: number): void,
  toBeLessThan(number: number): void,
  toBeLessThanOrEqual(number: number): void,
  toBeInstanceOf(cls: Class<*>): void,
  toBeNull(): void,
  toBeTruthy(): void,
  toBeUndefined(): void,
  toContain(item: any): void,
  toContainEqual(item: any): void,
  toEqual(value: any): void,
  toHaveBeenCalled(): void,
  toHaveBeenCalledTimes(number: number): void,
  toHaveBeenCalledWith(...args: Array<any>): void,
  toHaveProperty(path: string, value?: any): void,
  toMatch(regexp: RegExp): void,
  toMatchObject(object: Object): void,
  toMatchSnapshot(): void,
  toThrow(message?: string | Error | Class<Error>): void,
  toThrowError(message?: string | Error | Class<Error> | RegExp): void,
  toThrowErrorMatchingSnapshot(): void,
};

type JestSpyType = {
  calls: JestCallsType,
};

declare function afterEach(fn: Function): void;
declare function beforeEach(fn: Function): void;
declare function afterAll(fn: Function): void;
declare function beforeAll(fn: Function): void;
declare function describe(name: string, fn: Function): void;
declare var it: {
  (name: string, fn: Function): ?Promise<void>,
  only(name: string, fn: Function): ?Promise<void>,
  skip(name: string, fn: Function): ?Promise<void>,
};
declare function fit(name: string, fn: Function): ?Promise<void>;
declare function pit(name: string, fn: () => Promise<any>): Promise<void>;
declare var test: typeof it;
declare var xdescribe: typeof describe;
declare var fdescribe: typeof describe;
declare var xit: typeof it;
declare var xtest: typeof it;

declare var expect: {
  (value: any): JestExpectType & JestPromiseType,
  any: any,
  extend(matchers: {[name: string]: JestMatcher}): void,
  objectContaining(any): void,
};
declare function fail(message?: string): void;

// TODO handle return type
// http://jasmine.github.io/2.4/introduction.html#section-Spies
declare function spyOn(value: mixed, method: string): Object;

type Jest = {
  autoMockOff(): Jest,
  autoMockOn(): Jest,
  resetAllMocks(): Jest,
  clearAllTimers(): void,
  currentTestPath(): void,
  disableAutomock(): Jest,
  doMock(moduleName: string, moduleFactory?: any): void,
  dontMock(moduleName: string): Jest,
  enableAutomock(): Jest,
  fn(implementation?: Function): JestMockFn,
  genMockFromModule(moduleName: string): any,
  isMockFunction(fn: Function): boolean,
  mock(
    moduleName: string,
    moduleFactory?: any,
    options?: {virtual?: boolean},
  ): Jest,
  resetModuleRegistry(): Jest, // undocumented alias for resetModuleRegistry
  resetModules(): Jest,
  restoreAllMocks(): Jest,
  runAllTicks(): Jest,
  runAllTimers(): Jest,
  runTimersToTime(msToRun: number): Jest,
  runOnlyPendingTimers(): Jest,
  setMock(moduleName: string, moduleExports: any): Jest,
  unmock(moduleName: string): Jest,
  useFakeTimers(): Jest,
  useRealTimers(): Jest,
};

declare var jest: Jest;

declare var jasmine: {
  DEFAULT_TIMEOUT_INTERVAL: number,
  any(value: mixed): JestAsymmetricEqualityType,
  anything(): void,
  arrayContaining(value: Array<mixed>): void,
  clock(): JestClockType,
  createSpy(name: string): JestSpyType,
  objectContaining(value: Object): void,
  stringMatching(value: string): void,
};
