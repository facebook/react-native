/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

// Modified from https://raw.githubusercontent.com/flow-typed/flow-typed/master/definitions/npm/jest_v29.x.x/flow_v0.134.x-/jest_v29.x.x.js
// Modifications are explained inline by comments beginning with `// MODIFIED`.

// MODIFIED: Added ESLint suppression comment - no-unused-vars doesn't understand declaration files
/* eslint-disable no-unused-vars */

type JestMockFn<TArguments: $ReadOnlyArray<any>, TReturn> = {
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
     * An array containing the call arguments of the last call that was made
     * to this mock function. If the function was not called, it will return
     * undefined.
     */
    lastCall: TArguments,
    /**
     * An array that contains all the object instances that have been
     * instantiated from this mock function.
     */
    instances: Array<TReturn>,
    /**
     * An array that contains the contexts for all calls of the mock function.
     */
    contexts: Array<mixed>,
    /**
     * An array that contains all the object results that have been
     * returned by this mock function call
     */
    results: Array<{
      isThrow: boolean,
      value: TReturn,
      ...
    }>,
    ...
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
   * Just a simple sugar function for returning `this`
   */
  mockReturnThis(): void,
  /**
   * Accepts a value that will be returned whenever the mock function is called.
   */
  mockReturnValue(value: TReturn): JestMockFn<TArguments, TReturn>,
  /**
   * Sugar for only returning a value once inside your mock
   */
  mockReturnValueOnce(value: TReturn): JestMockFn<TArguments, TReturn>,
  /**
   * Sugar for jest.fn().mockImplementation(() => Promise.resolve(value))
   */
  mockResolvedValue(value: TReturn): JestMockFn<TArguments, Promise<TReturn>>,
  /**
   * Sugar for jest.fn().mockImplementationOnce(() => Promise.resolve(value))
   */
  mockResolvedValueOnce(
    value: TReturn,
  ): JestMockFn<TArguments, Promise<TReturn>>,
  /**
   * Sugar for jest.fn().mockImplementation(() => Promise.reject(value))
   */
  mockRejectedValue(value: TReturn): JestMockFn<TArguments, Promise<any>>,
  /**
   * Sugar for jest.fn().mockImplementationOnce(() => Promise.reject(value))
   */
  mockRejectedValueOnce(value: TReturn): JestMockFn<TArguments, Promise<any>>,
  ...
};

type JestAsymmetricEqualityType = {
  /**
   * A custom Jasmine equality tester
   */
  asymmetricMatch(value: mixed): boolean,
  ...
};

type JestCallsType = {
  allArgs(): mixed,
  all(): mixed,
  any(): boolean,
  count(): number,
  first(): mixed,
  mostRecent(): mixed,
  reset(): void,
  ...
};

type JestClockType = {
  install(): void,
  mockDate(date: Date): void,
  tick(milliseconds?: number): void,
  uninstall(): void,
  ...
};

type JestMatcherResult = {
  message?: string | (() => string),
  pass: boolean,
  ...
};

type JestMatcher = (
  received: any,
  ...actual: Array<any>
) => JestMatcherResult | Promise<JestMatcherResult>;

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
  ...
};

/**
 * Jest allows functions and classes to be used as test names in test() and
 * describe()
 */
type JestTestName = string | Function;

type FakeableAPI =
  | 'Date'
  | 'hrtime'
  | 'nextTick'
  | 'performance'
  | 'queueMicrotask'
  | 'requestAnimationFrame'
  | 'cancelAnimationFrame'
  | 'requestIdleCallback'
  | 'cancelIdleCallback'
  | 'setImmediate'
  | 'clearImmediate'
  | 'setInterval'
  | 'clearInterval'
  | 'setTimeout'
  | 'clearTimeout';

type FakeTimersConfig = {
  advanceTimers?: boolean | number,
  doNotFake?: Array<FakeableAPI>,
  now?: number | Date,
  timerLimit?: number,
  legacyFakeTimers?: boolean,
  ...
};

/**
 *  Plugin: jest-styled-components
 */

type JestStyledComponentsMatcherValue =
  | string
  | JestAsymmetricEqualityType
  | RegExp
  | typeof undefined;

type JestStyledComponentsMatcherOptions = {
  media?: string,
  modifier?: string,
  supports?: string,
  ...
};

type JestStyledComponentsMatchersType = {
  toHaveStyleRule(
    property: string,
    value: JestStyledComponentsMatcherValue,
    options?: JestStyledComponentsMatcherOptions,
  ): void,
  ...
};

/**
 *  Plugin: jest-enzyme
 */
type EnzymeMatchersType = {
  // 5.x
  toBeEmpty(): void,
  toBePresent(): void,
  // 6.x
  toBeChecked(): void,
  toBeDisabled(): void,
  toBeEmptyRender(): void,
  toContainMatchingElement(selector: string): void,
  toContainMatchingElements(n: number, selector: string): void,
  toContainExactlyOneMatchingElement(selector: string): void,
  toContainReact(element: React.MixedElement): void,
  toExist(): void,
  toHaveClassName(className: string): void,
  toHaveHTML(html: string): void,
  toHaveProp: ((propKey: string, propValue?: any) => void) &
    ((props: {...}) => void),
  toHaveRef(refName: string): void,
  toHaveState: ((stateKey: string, stateValue?: any) => void) &
    ((state: {...}) => void),
  toHaveStyle: ((styleKey: string, styleValue?: any) => void) &
    ((style: {...}) => void),
  toHaveTagName(tagName: string): void,
  toHaveText(text: string): void,
  toHaveValue(value: any): void,
  toIncludeText(text: string): void,
  toMatchElement(
    element: React.MixedElement,
    options?: {|ignoreProps?: boolean, verbose?: boolean|},
  ): void,
  toMatchSelector(selector: string): void,
  // 7.x
  toHaveDisplayName(name: string): void,
  ...
};

// DOM testing library extensions (jest-dom)
// https://github.com/testing-library/jest-dom
type DomTestingLibraryType = {
  /**
   * @deprecated
   */
  toBeInTheDOM(container?: HTMLElement): void,

  // 4.x
  toBeInTheDocument(): void,
  toBeVisible(): void,
  toBeEmpty(): void,
  toBeDisabled(): void,
  toBeEnabled(): void,
  toBeInvalid(): void,
  toBeRequired(): void,
  toBeValid(): void,
  toContainElement(element: HTMLElement | null): void,
  toContainHTML(htmlText: string): void,
  toHaveAttribute(attr: string, value?: any): void,
  toHaveClass(...classNames: string[]): void,
  toHaveFocus(): void,
  toHaveFormValues(expectedValues: {[name: string]: any, ...}): void,
  toHaveStyle(css: string | {[name: string]: any, ...}): void,
  toHaveTextContent(
    text: string | RegExp,
    options?: {|normalizeWhitespace: boolean|},
  ): void,
  toHaveValue(value?: string | string[] | number): void,

  // 5.x
  toHaveDisplayValue(value: string | string[]): void,
  toBeChecked(): void,
  toBeEmptyDOMElement(): void,
  toBePartiallyChecked(): void,
  toHaveDescription(text: string | RegExp): void,
  ...
};

// Jest JQuery Matchers: https://github.com/unindented/custom-jquery-matchers
type JestJQueryMatchersType = {
  toExist(): void,
  toHaveLength(len: number): void,
  toHaveId(id: string): void,
  toHaveClass(className: string): void,
  toHaveTag(tag: string): void,
  toHaveAttr(key: string, val?: any): void,
  toHaveProp(key: string, val?: any): void,
  toHaveText(text: string | RegExp): void,
  toHaveData(key: string, val?: any): void,
  toHaveValue(val: any): void,
  toHaveCss(css: {[key: string]: any, ...}): void,
  toBeChecked(): void,
  toBeDisabled(): void,
  toBeEmpty(): void,
  toBeHidden(): void,
  toBeSelected(): void,
  toBeVisible(): void,
  toBeFocused(): void,
  toBeInDom(): void,
  toBeMatchedBy(sel: string): void,
  toHaveDescendant(sel: string): void,
  toHaveDescendantWithText(sel: string, text: string | RegExp): void,
  ...
};

// Jest Extended Matchers: https://github.com/jest-community/jest-extended
type JestExtendedMatchersType = {
  /**
   * Note: Currently unimplemented
   * Passing assertion
   *
   * @param {String} message
   */
  //  pass(message: string): void;

  /**
   * Note: Currently unimplemented
   * Failing assertion
   *
   * @param {String} message
   */
  //  fail(message: string): void;

  /**
   * Use .toBeEmpty when checking if a String '', Array [] or Object {} is empty.
   */
  toBeEmpty(): void,
  /**
   * Use .toBeOneOf when checking if a value is a member of a given Array.
   * @param {Array.<*>} members
   */
  toBeOneOf(members: any[]): void,
  /**
   * Use `.toBeNil` when checking a value is `null` or `undefined`.
   */
  toBeNil(): void,
  /**
   * Use `.toSatisfy` when you want to use a custom matcher by supplying a predicate function that returns a `Boolean`.
   * @param {Function} predicate
   */
  toSatisfy(predicate: (n: any) => boolean): void,
  /**
   * Use `.toBeArray` when checking if a value is an `Array`.
   */
  toBeArray(): void,
  /**
   * Use `.toBeArrayOfSize` when checking if a value is an `Array` of size x.
   * @param {Number} x
   */
  toBeArrayOfSize(x: number): void,
  /**
   * Use `.toIncludeAllMembers` when checking if an `Array` contains all of the same members of a given set.
   * @param {Array.<*>} members
   */
  toIncludeAllMembers(members: any[]): void,
  /**
   * Use `.toIncludeAnyMembers` when checking if an `Array` contains any of the members of a given set.
   * @param {Array.<*>} members
   */
  toIncludeAnyMembers(members: any[]): void,
  /**
   * Use `.toSatisfyAll` when you want to use a custom matcher by supplying a predicate function that returns a `Boolean` for all values in an array.
   * @param {Function} predicate
   */
  toSatisfyAll(predicate: (n: any) => boolean): void,
  /**
   * Use `.toBeBoolean` when checking if a value is a `Boolean`.
   */
  toBeBoolean(): void,
  /**
   * Use `.toBeTrue` when checking a value is equal (===) to `true`.
   */
  toBeTrue(): void,
  /**
   * Use `.toBeFalse` when checking a value is equal (===) to `false`.
   */
  toBeFalse(): void,
  /**
   * Use .toBeDate when checking if a value is a Date.
   */
  toBeDate(): void,
  /**
   * Use `.toBeFunction` when checking if a value is a `Function`.
   */
  toBeFunction(): void,
  /**
   * Use `.toHaveBeenCalledBefore` when checking if a `Mock` was called before another `Mock`.
   *
   * Note: Required Jest version >22
   * Note: Your mock functions will have to be asynchronous to cause the timestamps inside of Jest to occur in a differentJS event loop, otherwise the mock timestamps will all be the same
   *
   * @param {Mock} mock
   */
  toHaveBeenCalledBefore(mock: JestMockFn<any, any>): void,
  /**
   * Use `.toBeNumber` when checking if a value is a `Number`.
   */
  toBeNumber(): void,
  /**
   * Use `.toBeNaN` when checking a value is `NaN`.
   */
  toBeNaN(): void,
  /**
   * Use `.toBeFinite` when checking if a value is a `Number`, not `NaN` or `Infinity`.
   */
  toBeFinite(): void,
  /**
   * Use `.toBePositive` when checking if a value is a positive `Number`.
   */
  toBePositive(): void,
  /**
   * Use `.toBeNegative` when checking if a value is a negative `Number`.
   */
  toBeNegative(): void,
  /**
   * Use `.toBeEven` when checking if a value is an even `Number`.
   */
  toBeEven(): void,
  /**
   * Use `.toBeOdd` when checking if a value is an odd `Number`.
   */
  toBeOdd(): void,
  /**
   * Use `.toBeWithin` when checking if a number is in between the given bounds of: start (inclusive) and end (exclusive).
   *
   * @param {Number} start
   * @param {Number} end
   */
  toBeWithin(start: number, end: number): void,
  /**
   * Use `.toBeObject` when checking if a value is an `Object`.
   */
  toBeObject(): void,
  /**
   * Use `.toContainKey` when checking if an object contains the provided key.
   *
   * @param {String} key
   */
  toContainKey(key: string): void,
  /**
   * Use `.toContainKeys` when checking if an object has all of the provided keys.
   *
   * @param {Array.<String>} keys
   */
  toContainKeys(keys: string[]): void,
  /**
   * Use `.toContainAllKeys` when checking if an object only contains all of the provided keys.
   *
   * @param {Array.<String>} keys
   */
  toContainAllKeys(keys: string[]): void,
  /**
   * Use `.toContainAnyKeys` when checking if an object contains at least one of the provided keys.
   *
   * @param {Array.<String>} keys
   */
  toContainAnyKeys(keys: string[]): void,
  /**
   * Use `.toContainValue` when checking if an object contains the provided value.
   *
   * @param {*} value
   */
  toContainValue(value: any): void,
  /**
   * Use `.toContainValues` when checking if an object contains all of the provided values.
   *
   * @param {Array.<*>} values
   */
  toContainValues(values: any[]): void,
  /**
   * Use `.toContainAllValues` when checking if an object only contains all of the provided values.
   *
   * @param {Array.<*>} values
   */
  toContainAllValues(values: any[]): void,
  /**
   * Use `.toContainAnyValues` when checking if an object contains at least one of the provided values.
   *
   * @param {Array.<*>} values
   */
  toContainAnyValues(values: any[]): void,
  /**
   * Use `.toContainEntry` when checking if an object contains the provided entry.
   *
   * @param {Array.<String, String>} entry
   */
  toContainEntry(entry: [string, string]): void,
  /**
   * Use `.toContainEntries` when checking if an object contains all of the provided entries.
   *
   * @param {Array.<Array.<String, String>>} entries
   */
  toContainEntries(entries: [string, string][]): void,
  /**
   * Use `.toContainAllEntries` when checking if an object only contains all of the provided entries.
   *
   * @param {Array.<Array.<String, String>>} entries
   */
  toContainAllEntries(entries: [string, string][]): void,
  /**
   * Use `.toContainAnyEntries` when checking if an object contains at least one of the provided entries.
   *
   * @param {Array.<Array.<String, String>>} entries
   */
  toContainAnyEntries(entries: [string, string][]): void,
  /**
   * Use `.toBeExtensible` when checking if an object is extensible.
   */
  toBeExtensible(): void,
  /**
   * Use `.toBeFrozen` when checking if an object is frozen.
   */
  toBeFrozen(): void,
  /**
   * Use `.toBeSealed` when checking if an object is sealed.
   */
  toBeSealed(): void,
  /**
   * Use `.toBeString` when checking if a value is a `String`.
   */
  toBeString(): void,
  /**
   * Use `.toEqualCaseInsensitive` when checking if a string is equal (===) to another ignoring the casing of both strings.
   *
   * @param {String} string
   */
  toEqualCaseInsensitive(string: string): void,
  /**
   * Use `.toStartWith` when checking if a `String` starts with a given `String` prefix.
   *
   * @param {String} prefix
   */
  toStartWith(prefix: string): void,
  /**
   * Use `.toEndWith` when checking if a `String` ends with a given `String` suffix.
   *
   * @param {String} suffix
   */
  toEndWith(suffix: string): void,
  /**
   * Use `.toInclude` when checking if a `String` includes the given `String` substring.
   *
   * @param {String} substring
   */
  toInclude(substring: string): void,
  /**
   * Use `.toIncludeRepeated` when checking if a `String` includes the given `String` substring the correct number of times.
   *
   * @param {String} substring
   * @param {Number} times
   */
  toIncludeRepeated(substring: string, times: number): void,
  /**
   * Use `.toIncludeMultiple` when checking if a `String` includes all of the given substrings.
   *
   * @param {Array.<String>} substring
   */
  toIncludeMultiple(substring: string[]): void,
  ...
};

// Diffing snapshot utility for Jest (snapshot-diff)
// https://github.com/jest-community/snapshot-diff
type SnapshotDiffType = {
  /**
   * Compare the difference between the actual in the `expect()`
   * vs the object inside `valueB` with some extra options.
   */
  toMatchDiffSnapshot(
    valueB: any,
    options?: {|
      expand?: boolean,
      colors?: boolean,
      contextLines?: number,
      stablePatchmarks?: boolean,
      aAnnotation?: string,
      bAnnotation?: string,
    |},
    testName?: string,
  ): void,
  ...
};

interface JestExpectType {
  not: JestExpectType &
    EnzymeMatchersType &
    DomTestingLibraryType &
    JestJQueryMatchersType &
    JestStyledComponentsMatchersType &
    JestExtendedMatchersType &
    SnapshotDiffType;
  /**
   * If you have a mock function, you can use .lastCalledWith to test what
   * arguments it was last called with.
   */
  lastCalledWith(...args: Array<any>): void;
  /**
   * toBe just checks that a value is what you expect. It uses === to check
   * strict equality.
   */
  toBe(value: any): void;
  /**
   * Use .toBeCalledWith to ensure that a mock function was called with
   * specific arguments.
   */
  toBeCalledWith(...args: Array<any>): void;
  /**
   * Using exact equality with floating point numbers is a bad idea. Rounding
   * means that intuitive things fail.
   */
  toBeCloseTo(num: number, delta: any): void;
  /**
   * Use .toBeDefined to check that a variable is not undefined.
   */
  toBeDefined(): void;
  /**
   * Use .toBeFalsy when you don't care what a value is, you just want to
   * ensure a value is false in a boolean context.
   */
  toBeFalsy(): void;
  /**
   * To compare floating point numbers, you can use toBeGreaterThan.
   */
  toBeGreaterThan(number: number): void;
  /**
   * To compare floating point numbers, you can use toBeGreaterThanOrEqual.
   */
  toBeGreaterThanOrEqual(number: number): void;
  /**
   * To compare floating point numbers, you can use toBeLessThan.
   */
  toBeLessThan(number: number): void;
  /**
   * To compare floating point numbers, you can use toBeLessThanOrEqual.
   */
  toBeLessThanOrEqual(number: number): void;
  /**
   * Use .toBeInstanceOf(Class) to check that an object is an instance of a
   * class.
   */
  toBeInstanceOf(cls: Class<any>): void;
  /**
   * .toBeNull() is the same as .toBe(null) but the error messages are a bit
   * nicer.
   */
  toBeNull(): void;
  /**
   * Use .toBeTruthy when you don't care what a value is, you just want to
   * ensure a value is true in a boolean context.
   */
  toBeTruthy(): void;
  /**
   * Use .toBeUndefined to check that a variable is undefined.
   */
  toBeUndefined(): void;
  /**
   * Use .toContain when you want to check that an item is in a list. For
   * testing the items in the list, this uses ===, a strict equality check.
   */
  toContain(item: any): void;
  /**
   * Use .toContainEqual when you want to check that an item is in a list. For
   * testing the items in the list, this matcher recursively checks the
   * equality of all fields, rather than checking for object identity.
   */
  toContainEqual(item: any): void;
  /**
   * Use .toEqual when you want to check that two objects have the same value.
   * This matcher recursively checks the equality of all fields, rather than
   * checking for object identity.
   */
  toEqual(value: any): void;
  /**
   * Use .toHaveBeenCalled to ensure that a mock function got called.
   */
  toHaveBeenCalled(): void;
  toBeCalled(): void;
  /**
   * Use .toHaveBeenCalledTimes to ensure that a mock function got called exact
   * number of times.
   */
  toHaveBeenCalledTimes(number: number): void;
  toBeCalledTimes(number: number): void;
  /**
   *
   */
  toHaveBeenNthCalledWith(nthCall: number, ...args: Array<any>): void;
  nthCalledWith(nthCall: number, ...args: Array<any>): void;
  /**
   *
   */
  toHaveReturned(): void;
  toReturn(): void;
  /**
   *
   */
  toHaveReturnedTimes(number: number): void;
  toReturnTimes(number: number): void;
  /**
   *
   */
  toHaveReturnedWith(value: any): void;
  toReturnWith(value: any): void;
  /**
   *
   */
  toHaveLastReturnedWith(value: any): void;
  lastReturnedWith(value: any): void;
  /**
   *
   */
  toHaveNthReturnedWith(nthCall: number, value: any): void;
  nthReturnedWith(nthCall: number, value: any): void;
  /**
   * Use .toHaveBeenCalledWith to ensure that a mock function was called with
   * specific arguments.
   */
  toHaveBeenCalledWith(...args: Array<any>): void;
  toBeCalledWith(...args: Array<any>): void;
  /**
   * Use .toHaveBeenLastCalledWith to ensure that a mock function was last called
   * with specific arguments.
   */
  toHaveBeenLastCalledWith(...args: Array<any>): void;
  lastCalledWith(...args: Array<any>): void;
  /**
   * Check that an object has a .length property and it is set to a certain
   * numeric value.
   */
  toHaveLength(number: number): void;
  /**
   *
   */
  toHaveProperty(propPath: string | $ReadOnlyArray<string>, value?: any): void;
  /**
   * Use .toMatch to check that a string matches a regular expression or string.
   */
  toMatch(regexpOrString: RegExp | string): void;
  /**
   * Use .toMatchObject to check that a javascript object matches a subset of the properties of an object.
   */
  toMatchObject(object: Object | Array<Object>): void;
  /**
   * Use .toStrictEqual to check that a javascript object matches a subset of the properties of an object.
   */
  toStrictEqual(value: any): void;
  /**
   * This ensures that an Object matches the most recent snapshot.
   */
  toMatchSnapshot(propertyMatchers?: any, name?: string): void;
  /**
   * This ensures that an Object matches the most recent snapshot.
   */
  toMatchSnapshot(name: string): void;

  toMatchInlineSnapshot(snapshot?: string): void;
  toMatchInlineSnapshot(propertyMatchers?: any, snapshot?: string): void;
  /**
   * Use .toThrow to test that a function throws when it is called.
   * If you want to test that a specific error gets thrown, you can provide an
   * argument to toThrow. The argument can be a string for the error message,
   * a class for the error, or a regex that should match the error.
   *
   * Alias: .toThrowError
   */
  toThrow(message?: string | Error | Class<Error> | RegExp): void;
  toThrowError(message?: string | Error | Class<Error> | RegExp): void;
  /**
   * Use .toThrowErrorMatchingSnapshot to test that a function throws a error
   * matching the most recent snapshot when it is called.
   */
  toThrowErrorMatchingSnapshot(): void;
  toThrowErrorMatchingInlineSnapshot(snapshot?: string): void;
}

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
   * Returns the number of fake timers still left to run.
   */
  getTimerCount(): number,
  /**
   * Set the current system time used by fake timers.
   * Simulates a user changing the system clock while your program is running.
   * It affects the current time but it does not in itself cause
   * e.g. timers to fire; they will fire exactly as they would have done
   * without the call to jest.setSystemTime().
   */
  setSystemTime(now?: number | Date): void,
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
  // MODIFIED: Added defaults to type arguments.
  fn<TArguments: $ReadOnlyArray<mixed> = $ReadOnlyArray<any>, TReturn = any>(
    implementation?: (...args: TArguments) => TReturn,
  ): JestMockFn<TArguments, TReturn>,
  /**
   * Determines if the given function is a mocked function.
   */
  isMockFunction(fn: Function): boolean,
  /**
   * Alias of `createMockFromModule`.
   */
  genMockFromModule(moduleName: string): any,
  /**
   * Given the name of a module, use the automatic mocking system to generate a
   * mocked version of the module for you.
   */
  createMockFromModule(moduleName: string): any,
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
   * Returns the actual module instead of a mock, bypassing all checks on
   * whether the module should receive a mock implementation or not.
   */
  requireActual<T>(m: $Flow$ModuleRef<T> | string): T,
  /**
   * Returns a mock module instead of the actual module, bypassing all checks
   * on whether the module should be required normally or not.
   */
  requireMock(moduleName: string): any,
  /**
   * Resets the module registry - the cache of all required modules. This is
   * useful to isolate modules where local state might conflict between tests.
   */
  resetModules(): JestObjectType,
  /**
   * Creates a sandbox registry for the modules that are loaded inside the
   * callback function. This is useful to isolate specific modules for every
   * test so that local module state doesn't conflict between tests.
   */
  isolateModules(fn: () => void): JestObjectType,
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
  useFakeTimers(fakeTimersConfig?: FakeTimersConfig): JestObjectType,
  /**
   * Instructs Jest to use the real versions of the standard timer functions.
   */
  useRealTimers(): JestObjectType,
  /**
   * Creates a mock function similar to jest.fn but also tracks calls to
   * object[methodName].
   */
  spyOn(
    object: Object,
    methodName: string,
    accessType?: 'get' | 'set',
  ): JestMockFn<any, any>,
  /**
   * Set the default timeout interval for tests and before/after hooks in milliseconds.
   * Note: The default timeout interval is 5 seconds if this method is not called.
   */
  setTimeout(timeout: number): JestObjectType,
  ...
};

type JestSpyType = {calls: JestCallsType, ...};

type JestDoneFn = {|
  (error?: Error): void,
  fail: (error: Error) => void,
|};

/** Runs this function after every test inside this context */
declare function afterEach(
  fn: (done: JestDoneFn) => ?Promise<mixed>,
  timeout?: number,
): void;
/** Runs this function before every test inside this context */
declare function beforeEach(
  fn: (done: JestDoneFn) => ?Promise<mixed>,
  timeout?: number,
): void;
/** Runs this function after all tests have finished inside this context */
declare function afterAll(
  fn: (done: JestDoneFn) => ?Promise<mixed>,
  timeout?: number,
): void;
/** Runs this function before any tests have started inside this context */
declare function beforeAll(
  fn: (done: JestDoneFn) => ?Promise<mixed>,
  timeout?: number,
): void;

/** A context for grouping tests together */
declare var describe: {
  /**
   * Creates a block that groups together several related tests in one "test suite"
   */
  (name: JestTestName, fn: () => void): void,
  /**
   * Only run this describe block
   */
  only(name: JestTestName, fn: () => void): void,
  /**
   * Skip running this describe block
   */
  skip(name: JestTestName, fn: () => void): void,
  /**
   * each runs this test against array of argument arrays per each run
   *
   * @param {table} table of Test
   */
  each(
    ...table: Array<Array<mixed> | mixed> | [Array<string>, string]
  ): (
    name: JestTestName,
    fn?: (...args: Array<any>) => ?Promise<mixed>,
    timeout?: number,
  ) => void,
  ...
};

/** An individual test unit */
declare var it: {
  /**
   * An individual test unit
   *
   * @param {JestTestName} Name of Test
   * @param {Function} Test
   * @param {number} Timeout for the test, in milliseconds.
   */
  (
    name: JestTestName,
    fn?: (done: JestDoneFn) => ?Promise<mixed>,
    timeout?: number,
  ): void,
  /**
   * Only run this test
   *
   * @param {JestTestName} Name of Test
   * @param {Function} Test
   * @param {number} Timeout for the test, in milliseconds.
   */
  only: {|
    (
      name: JestTestName,
      fn?: (done: JestDoneFn) => ?Promise<mixed>,
      timeout?: number,
    ): void,
    each(
      ...table: Array<Array<mixed> | mixed> | [Array<string>, string]
    ): (
      name: JestTestName,
      fn?: (...args: Array<any>) => ?Promise<mixed>,
      timeout?: number,
    ) => void,
  |},
  /**
   * Skip running this test
   *
   * @param {JestTestName} Name of Test
   * @param {Function} Test
   * @param {number} Timeout for the test, in milliseconds.
   */
  skip: {|
    (
      name: JestTestName,
      fn?: (done: JestDoneFn) => ?Promise<mixed>,
      timeout?: number,
    ): void,
    each(
      ...table: Array<Array<mixed> | mixed> | [Array<string>, string]
    ): (
      name: JestTestName,
      fn?: (...args: Array<any>) => ?Promise<mixed>,
      timeout?: number,
    ) => void,
  |},
  /**
   * Highlight planned tests in the summary output
   *
   * @param {String} Name of Test to do
   */
  todo(name: string): void,
  /**
   * Run the test concurrently
   *
   * @param {JestTestName} Name of Test
   * @param {Function} Test
   * @param {number} Timeout for the test, in milliseconds.
   */
  concurrent(
    name: JestTestName,
    fn?: (done: JestDoneFn) => ?Promise<mixed>,
    timeout?: number,
  ): void,
  /**
   * each runs this test against array of argument arrays per each run
   *
   * @param {table} table of Test
   */
  each(
    ...table: Array<Array<mixed> | mixed> | [Array<string>, string]
  ): (
    name: JestTestName,
    fn?: (...args: Array<any>) => ?Promise<mixed>,
    timeout?: number,
  ) => void,
  ...
};

declare function fit(
  name: JestTestName,
  fn: (done: JestDoneFn) => ?Promise<mixed>,
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

type JestPrettyFormatColors = {
  comment: {
    close: string,
    open: string,
    ...
  },
  content: {
    close: string,
    open: string,
    ...
  },
  prop: {
    close: string,
    open: string,
    ...
  },
  tag: {
    close: string,
    open: string,
    ...
  },
  value: {
    close: string,
    open: string,
    ...
  },
  ...
};

type JestPrettyFormatIndent = string => string;
type JestPrettyFormatRefs = Array<any>;
type JestPrettyFormatPrint = any => string;
type JestPrettyFormatStringOrNull = string | null;

type JestPrettyFormatOptions = {|
  callToJSON: boolean,
  edgeSpacing: string,
  escapeRegex: boolean,
  highlight: boolean,
  indent: number,
  maxDepth: number,
  min: boolean,
  plugins: JestPrettyFormatPlugins,
  printFunctionName: boolean,
  spacing: string,
  theme: {|
    comment: string,
    content: string,
    prop: string,
    tag: string,
    value: string,
  |},
|};

type JestPrettyFormatPlugin = {
  print: (
    val: any,
    serialize: JestPrettyFormatPrint,
    indent: JestPrettyFormatIndent,
    opts: JestPrettyFormatOptions,
    colors: JestPrettyFormatColors,
  ) => string,
  test: any => boolean,
  ...
};

type JestPrettyFormatPlugins = Array<JestPrettyFormatPlugin>;

/** The expect function is used every time you want to test a value */
declare var expect: {
  /** The object that you want to make assertions against */
  (
    value: any,
  ): JestExpectType &
    JestPromiseType &
    EnzymeMatchersType &
    DomTestingLibraryType &
    JestJQueryMatchersType &
    JestStyledComponentsMatchersType &
    JestExtendedMatchersType &
    SnapshotDiffType,
  /** Add additional Jasmine matchers to Jest's roster */
  extend(matchers: {[name: string]: JestMatcher, ...}): void,
  /** Add a module that formats application-specific data structures. */
  addSnapshotSerializer(pluginModule: JestPrettyFormatPlugin): void,
  assertions(expectedAssertions: number): void,
  hasAssertions(): void,
  any(value: mixed): JestAsymmetricEqualityType,
  anything(): any,
  // MODIFIED: Array -> $ReadOnlyArray
  arrayContaining(value: $ReadOnlyArray<mixed>): Array<mixed>,
  objectContaining(value: Object): Object,
  /** Matches any received string that contains the exact expected string. */
  stringContaining(value: string): string,
  stringMatching(value: string | RegExp): string,
  not: {
    arrayContaining: (value: $ReadOnlyArray<mixed>) => Array<mixed>,
    objectContaining: (value: {...}) => Object,
    stringContaining: (value: string) => string,
    stringMatching: (value: string | RegExp) => string,
    ...
  },
  ...
};

// TODO handle return type
// http://jasmine.github.io/2.4/introduction.html#section-Spies
declare function spyOn(value: mixed, method: string): Object;

/** Holds all functions related to manipulating test runner */
declare var jest: JestObjectType;

/**
 * The global Jasmine object, this is generally not exposed as the public API,
 * using features inside here could break in later versions of Jest.
 */
declare var jasmine: {
  DEFAULT_TIMEOUT_INTERVAL: number,
  any(value: mixed): JestAsymmetricEqualityType,
  anything(): any,
  arrayContaining(value: Array<mixed>): Array<mixed>,
  clock(): JestClockType,
  createSpy(name: string): JestSpyType,
  createSpyObj(
    baseName: string,
    methodNames: Array<string>,
  ): {[methodName: string]: JestSpyType, ...},
  objectContaining(value: Object): Object,
  stringMatching(value: string): string,
  ...
};
