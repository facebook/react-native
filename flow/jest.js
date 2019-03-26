/**
 * Copyright (c) 2004-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Modified from https://raw.githubusercontent.com/flowtype/flow-typed/b43dff3e0ed5ccf7033839045f4819e8db40faa9/definitions/npm/jest_v20.x.x/flow_v0.22.x-/jest_v20.x.x.js
 * Duplicated from www/flow/shared/jest.js
 * List of modifications:
 *  - added function fail
 *  - added jest.requireActual
 *  - added jest.requireMock
 *  - added JestMockFn.mockName
 *  - added JestMockFn.mockRejectedValue
 *  - added JestMockFn.mockRejectedValueOnce
 *  - added JestMockFn.mockResolvedValue
 *  - added JestMockFn.mockResolvedValueOnce
 *  - added JestMockFn.mock.thrownErrors
 *  - added JestMockFn.mock.returnValues
 *  - added jest.setTimeout
 * @flow strict
 * @format
 */

/* eslint-disable lint/no-unclear-flowtypes */

type JestMockFn<TArguments: $ReadOnlyArray<*>, TReturn> = {
  (...args: TArguments): TReturn,
  /**
   * An object for introspecting mock calls
   */
  mock: {
    /**
     * An array that represents all calls that have been made into this mock
     * function. Each call is represented by an array of arguments that were
     * passed during the call.
     */
    calls: Array<TArguments>,
    /**
     * An array that contains all the object instances that have been
     * instantiated from this mock function.
     */
    instances: Array<TReturn>,
    /**
     * An array containing the results of a method, and whether they were
     * returned or thrown.
     */
    results: Array<{isThrown: boolean}>,
  },
  /**
   * Resets all information stored in the mockFn.mock.calls and
   * mockFn.mock.instances arrays. Often this is useful when you want to clean
   * up a mock's usage data between two assertions.
   */
  mockClear(): void,
  /**
   * Resets all information stored in the mock. This is useful when you want to
   * completely restore a mock back to its initial state.
   */
  mockReset(): void,
  /**
   * Removes the mock and restores the initial implementation. This is useful
   * when you want to mock functions in certain test cases and restore the
   * original implementation in others. Beware that mockFn.mockRestore only
   * works when mock was created with jest.spyOn. Thus you have to take care of
   * restoration yourself when manually assigning jest.fn().
   */
  mockRestore(): void,
  /**
   * Accepts a function that should be used as the implementation of the mock.
   * The mock itself will still record all calls that go into and instances
   * that come from itself -- the only difference is that the implementation
   * will also be executed when the mock is called.
   */
  mockImplementation(
    fn: (...args: TArguments) => TReturn,
  ): JestMockFn<TArguments, TReturn>,
  /**
   * Accepts a function that will be used as an implementation of the mock for
   * one call to the mocked function. Can be chained so that multiple function
   * calls produce different results.
   */
  mockImplementationOnce(
    fn: (...args: TArguments) => TReturn,
  ): JestMockFn<TArguments, TReturn>,
  /**
   * Accepts a string to use in test result output in place of "jest.fn()" to
   * indicate which mock function is being referenced.
   */
  mockName(name: string): JestMockFn<TArguments, TReturn>,
  /**
   * Sugar for: jest.fn().mockReturnValue(Promise.reject(value));
   */
  mockRejectedValue(value: TReturn): JestMockFn<TArguments, TReturn>,
  /**
   * Sugar for: jest.fn().mockReturnValueOnce(Promise.reject(value));
   */
  mockRejectedValueOnce(value: TReturn): JestMockFn<TArguments, TReturn>,
  /**
   * Sugar for: jest.fn().mockReturnValue(Promise.resolve(value));
   */
  mockResolvedValue(value: TReturn): JestMockFn<TArguments, TReturn>,
  /**
   * Sugar for: jest.fn().mockReturnValueOnce(Promise.resolve(value));
   */
  mockResolvedValueOnce(value: TReturn): JestMockFn<TArguments, TReturn>,
  /**
   * Just a simple sugar function for returning `this`
   */
  mockReturnThis(): void,
  /**
   * Deprecated: use jest.fn(() => value) instead
   */
  mockReturnValue(value: TReturn): JestMockFn<TArguments, TReturn>,
  /**
   * Sugar for only returning a value once inside your mock
   */
  mockReturnValueOnce(value: TReturn): JestMockFn<TArguments, TReturn>,
};

type JestAsymmetricEqualityType = {
  /**
   * A custom Jasmine equality tester
   */
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
  tick(milliseconds?: number): void,
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

/**
 *  Plugin: jest-enzyme
 */
type EnzymeMatchersType = {
  toBeChecked(): void,
  toBeDisabled(): void,
  toBeEmpty(): void,
  toBePresent(): void,
  toContainReact(element: React$Element<any>): void,
  toHaveClassName(className: string): void,
  toHaveHTML(html: string): void,
  toHaveProp(propKey: string, propValue?: any): void,
  toHaveRef(refName: string): void,
  toHaveState(stateKey: string, stateValue?: any): void,
  toHaveStyle(styleKey: string, styleValue?: any): void,
  toHaveTagName(tagName: string): void,
  toHaveText(text: string): void,
  toIncludeText(text: string): void,
  toHaveValue(value: any): void,
  toMatchElement(element: React$Element<any>): void,
  toMatchSelector(selector: string): void,
};

type JestExpectType = {
  not: JestExpectType & EnzymeMatchersType,
  /**
   * If you have a mock function, you can use .lastCalledWith to test what
   * arguments it was last called with.
   */
  lastCalledWith(...args: Array<any>): void,
  /**
   * toBe just checks that a value is what you expect. It uses === to check
   * strict equality.
   */
  toBe(value: any): void,
  /**
   * Use .toHaveBeenCalled to ensure that a mock function got called.
   */
  toBeCalled(): void,
  /**
   * Use .toBeCalledWith to ensure that a mock function was called with
   * specific arguments.
   */
  toBeCalledWith(...args: Array<any>): void,
  /**
   * Using exact equality with floating point numbers is a bad idea. Rounding
   * means that intuitive things fail.
   */
  toBeCloseTo(num: number, delta: any): void,
  /**
   * Use .toBeDefined to check that a variable is not undefined.
   */
  toBeDefined(): void,
  /**
   * Use .toBeFalsy when you don't care what a value is, you just want to
   * ensure a value is false in a boolean context.
   */
  toBeFalsy(): void,
  /**
   * To compare floating point numbers, you can use toBeGreaterThan.
   */
  toBeGreaterThan(number: number): void,
  /**
   * To compare floating point numbers, you can use toBeGreaterThanOrEqual.
   */
  toBeGreaterThanOrEqual(number: number): void,
  /**
   * To compare floating point numbers, you can use toBeLessThan.
   */
  toBeLessThan(number: number): void,
  /**
   * To compare floating point numbers, you can use toBeLessThanOrEqual.
   */
  toBeLessThanOrEqual(number: number): void,
  /**
   * Use .toBeInstanceOf(Class) to check that an object is an instance of a
   * class.
   */
  toBeInstanceOf(cls: Class<*>): void,
  /**
   * .toBeNull() is the same as .toBe(null) but the error messages are a bit
   * nicer.
   */
  toBeNull(): void,
  /**
   * Use .toBeTruthy when you don't care what a value is, you just want to
   * ensure a value is true in a boolean context.
   */
  toBeTruthy(): void,
  /**
   * Use .toBeUndefined to check that a variable is undefined.
   */
  toBeUndefined(): void,
  /**
   * Use .toContain when you want to check that an item is in a list. For
   * testing the items in the list, this uses ===, a strict equality check.
   */
  toContain(item: any): void,
  /**
   * Use .toContainEqual when you want to check that an item is in a list. For
   * testing the items in the list, this matcher recursively checks the
   * equality of all fields, rather than checking for object identity.
   */
  toContainEqual(item: any): void,
  /**
   * Use .toEqual when you want to check that two objects have the same value.
   * This matcher recursively checks the equality of all fields, rather than
   * checking for object identity.
   */
  toEqual(value: any): void,
  /**
   * Use .toHaveBeenCalled to ensure that a mock function got called.
   */
  toHaveBeenCalled(): void,
  /**
   * Use .toHaveBeenCalledTimes to ensure that a mock function got called exact
   * number of times.
   */
  toHaveBeenCalledTimes(number: number): void,
  /**
   * Use .toHaveBeenCalledWith to ensure that a mock function was called with
   * specific arguments.
   */
  toHaveBeenCalledWith(...args: Array<any>): void,
  /**
   * Use .toHaveBeenLastCalledWith to ensure that a mock function was last called
   * with specific arguments.
   */
  toHaveBeenLastCalledWith(...args: Array<any>): void,
  /**
   * Check that an object has a .length property and it is set to a certain
   * numeric value.
   */
  toHaveLength(number: number): void,
  /**
   *
   */
  toHaveProperty(propPath: string, value?: any): void,
  /**
   * Use .toMatch to check that a string matches a regular expression or string.
   */
  toMatch(regexpOrString: RegExp | string): void,
  /**
   * Use .toMatchObject to check that a javascript object matches a subset of the properties of an object.
   */
  toMatchObject(object: Object): void,
  /**
   * This ensures that a React component matches the most recent snapshot.
   */
  toMatchSnapshot(name?: string): void,
  /**
   * Use .toThrow to test that a function throws when it is called.
   * If you want to test that a specific error gets thrown, you can provide an
   * argument to toThrow. The argument can be a string for the error message,
   * a class for the error, or a regex that should match the error.
   *
   * Alias: .toThrowError
   */
  toThrow(message?: string | Error | RegExp): void,
  toThrowError(message?: string | Error | RegExp): void,
  /**
   * Use .toThrowErrorMatchingSnapshot to test that a function throws a error
   * matching the most recent snapshot when it is called.
   */
  toThrowErrorMatchingSnapshot(): void,
};

type JestObjectType = {
  /**
   *  Disables automatic mocking in the module loader.
   *
   *  After this method is called, all `require()`s will return the real
   *  versions of each module (rather than a mocked version).
   */
  disableAutomock(): JestObjectType,
  /**
   * An un-hoisted version of disableAutomock
   */
  autoMockOff(): JestObjectType,
  /**
   * Enables automatic mocking in the module loader.
   */
  enableAutomock(): JestObjectType,
  /**
   * An un-hoisted version of enableAutomock
   */
  autoMockOn(): JestObjectType,
  /**
   * Clears the mock.calls and mock.instances properties of all mocks.
   * Equivalent to calling .mockClear() on every mocked function.
   */
  clearAllMocks(): JestObjectType,
  /**
   * Resets the state of all mocks. Equivalent to calling .mockReset() on every
   * mocked function.
   */
  resetAllMocks(): JestObjectType,
  /**
   * Restores all mocks back to their original value.
   */
  restoreAllMocks(): JestObjectType,
  /**
   * Removes any pending timers from the timer system.
   */
  clearAllTimers(): void,
  /**
   * The same as `mock` but not moved to the top of the expectation by
   * babel-jest.
   */
  doMock(moduleName: string, moduleFactory?: any): JestObjectType,
  /**
   * The same as `unmock` but not moved to the top of the expectation by
   * babel-jest.
   */
  dontMock(moduleName: string): JestObjectType,
  /**
   * Returns a new, unused mock function. Optionally takes a mock
   * implementation.
   */
  fn<TArguments: $ReadOnlyArray<*>, TReturn>(
    implementation?: (...args: TArguments) => TReturn,
  ): JestMockFn<TArguments, TReturn>,
  /**
   * Determines if the given function is a mocked function.
   */
  isMockFunction(fn: Function): boolean,
  /**
   * Given the name of a module, use the automatic mocking system to generate a
   * mocked version of the module for you.
   */
  genMockFromModule(moduleName: string): any,
  /**
   * Mocks a module with an auto-mocked version when it is being required.
   *
   * The second argument can be used to specify an explicit module factory that
   * is being run instead of using Jest's automocking feature.
   *
   * The third argument can be used to create virtual mocks -- mocks of modules
   * that don't exist anywhere in the system.
   */
  mock(
    moduleName: string,
    moduleFactory?: any,
    options?: Object,
  ): JestObjectType,
  /**
   * Resets the module registry - the cache of all required modules. This is
   * useful to isolate modules where local state might conflict between tests.
   */
  resetModules(): JestObjectType,
  /**
   * Exhausts the micro-task queue (usually interfaced in node via
   * process.nextTick).
   */
  runAllTicks(): void,
  /**
   * Exhausts the macro-task queue (i.e., all tasks queued by setTimeout(),
   * setInterval(), and setImmediate()).
   */
  runAllTimers(): void,
  /**
   * Exhausts all tasks queued by setImmediate().
   */
  runAllImmediates(): void,
  /**
   * Executes only the macro task queue (i.e. all tasks queued by setTimeout()
   * or setInterval() and setImmediate()).
   */
  advanceTimersByTime(msToRun: number): void,
  /**
   * Executes only the macro task queue (i.e. all tasks queued by setTimeout()
   * or setInterval() and setImmediate()).
   *
   * Renamed to `advanceTimersByTime`.
   */
  runTimersToTime(msToRun: number): void,
  /**
   * Executes only the macro-tasks that are currently pending (i.e., only the
   * tasks that have been queued by setTimeout() or setInterval() up to this
   * point)
   */
  runOnlyPendingTimers(): void,
  /**
   * Explicitly supplies the mock object that the module system should return
   * for the specified module. Note: It is recommended to use jest.mock()
   * instead.
   */
  setMock(moduleName: string, moduleExports: any): JestObjectType,
  /**
   * Indicates that the module system should never return a mocked version of
   * the specified module from require() (e.g. that it should always return the
   * real module).
   */
  unmock(moduleName: string): JestObjectType,
  /**
   * Instructs Jest to use fake versions of the standard timer functions
   * (setTimeout, setInterval, clearTimeout, clearInterval, nextTick,
   * setImmediate and clearImmediate).
   */
  useFakeTimers(): JestObjectType,
  /**
   * Instructs Jest to use the real versions of the standard timer functions.
   */
  useRealTimers(): JestObjectType,
  /**
   * Creates a mock function similar to jest.fn but also tracks calls to
   * object[methodName].
   */
  spyOn(object: Object, methodName: string): JestMockFn<any, any>,
  /**
   * Set the default timeout interval for tests and before/after hooks in milliseconds.
   * Note: The default timeout interval is 5 seconds if this method is not called.
   */
  setTimeout(timeout: number): JestObjectType,

  // These methods are added separately and not a part of flow-typed OSS
  // version of this file. They were added in jest@21.0.0.alpha-2 which is not
  // yet publicly released yet.
  // TODO T21262347 Add them to OSS version of flow-typed
  requireActual(module: string): any,
  requireMock(module: string): any,
};

type JestSpyType = {
  calls: JestCallsType,
};

/** Runs this function after every test inside this context */
declare function afterEach(
  fn: (done: () => void) => ?Promise<mixed>,
  timeout?: number,
): void;
/** Runs this function before every test inside this context */
declare function beforeEach(
  fn: (done: () => void) => ?Promise<mixed>,
  timeout?: number,
): void;
/** Runs this function after all tests have finished inside this context */
declare function afterAll(
  fn: (done: () => void) => ?Promise<mixed>,
  timeout?: number,
): void;
/** Runs this function before any tests have started inside this context */
declare function beforeAll(
  fn: (done: () => void) => ?Promise<mixed>,
  timeout?: number,
): void;

/** A context for grouping tests together */
declare var describe: {
  /**
   * Creates a block that groups together several related tests in one "test suite"
   */
  (name: string, fn: () => void): void,

  /**
   * Only run this describe block
   */
  only(name: string, fn: () => void): void,

  /**
   * Skip running this describe block
   */
  skip(name: string, fn: () => void): void,
};

/** An individual test unit */
declare var it: {
  /**
   * An individual test unit
   *
   * @param {string} Name of Test
   * @param {Function} Test
   * @param {number} Timeout for the test, in milliseconds.
   */
  (
    name: string,
    fn?: (done: () => void) => ?Promise<mixed>,
    timeout?: number,
  ): void,
  /**
   * Only run this test
   *
   * @param {string} Name of Test
   * @param {Function} Test
   * @param {number} Timeout for the test, in milliseconds.
   */
  only(
    name: string,
    fn?: (done: () => void) => ?Promise<mixed>,
    timeout?: number,
  ): void,
  /**
   * Skip running this test
   *
   * @param {string} Name of Test
   * @param {Function} Test
   * @param {number} Timeout for the test, in milliseconds.
   */
  skip(
    name: string,
    fn?: (done: () => void) => ?Promise<mixed>,
    timeout?: number,
  ): void,
  /**
   * Run the test concurrently
   *
   * @param {string} Name of Test
   * @param {Function} Test
   * @param {number} Timeout for the test, in milliseconds.
   */
  concurrent(
    name: string,
    fn?: (done: () => void) => ?Promise<mixed>,
    timeout?: number,
  ): void,
};
declare function fit(
  name: string,
  fn: (done: () => void) => ?Promise<mixed>,
  timeout?: number,
): void;
/** An individual test unit */
declare var test: typeof it;
/** A disabled group of tests */
declare var xdescribe: typeof describe;
/** A focused group of tests */
declare var fdescribe: typeof describe;
/** A disabled individual test */
declare var xit: typeof it;
/** A disabled individual test */
declare var xtest: typeof it;

/** The expect function is used every time you want to test a value */
declare var expect: {
  /** The object that you want to make assertions against */
  (value: any): JestExpectType & JestPromiseType & EnzymeMatchersType,
  /** Add additional Jasmine matchers to Jest's roster */
  extend(matchers: {[name: string]: JestMatcher}): void,
  /** Add a module that formats application-specific data structures. */
  addSnapshotSerializer(serializer: (input: Object) => string): void,
  assertions(expectedAssertions: number): void,
  hasAssertions(): void,
  any(value: mixed): JestAsymmetricEqualityType,
  anything(): void,
  arrayContaining(value: Array<mixed>): void,
  objectContaining(value: Object): void,
  /** Matches any received string that contains the exact expected string. */
  stringContaining(value: string): void,
  stringMatching(value: string | RegExp): void,
};

declare function fail(message?: string): void;

// TODO handle return type
// http://jasmine.github.io/2.4/introduction.html#section-Spies
declare function spyOn(value: mixed, method: string): Object;

/** Holds all functions related to manipulating test runner */
declare var jest: JestObjectType;

/**
 * The global Jamine object, this is generally not exposed as the public API,
 * using features inside here could break in later versions of Jest.
 */
declare var jasmine: {
  DEFAULT_TIMEOUT_INTERVAL: number,
  any(value: mixed): JestAsymmetricEqualityType,
  anything(): void,
  arrayContaining(value: Array<mixed>): void,
  clock(): JestClockType,
  createSpy(name: string): JestSpyType,
  createSpyObj(
    baseName: string,
    methodNames: Array<string>,
  ): {[methodName: string]: JestSpyType},
  objectContaining(value: Object): void,
  stringMatching(value: string): void,
};
