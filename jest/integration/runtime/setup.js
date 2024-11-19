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

import nullthrows from 'nullthrows';

export type TestCaseResult = {
  ancestorTitles: Array<string>,
  title: string,
  fullName: string,
  status: 'passed' | 'failed' | 'pending',
  duration: number,
  failureMessages: Array<string>,
  numPassingAsserts: number,
  // location: string,
};

export type TestSuiteResult =
  | {
      testResults: Array<TestCaseResult>,
    }
  | {
      error: {
        message: string,
        stack: string,
      },
    };

const tests: Array<{
  title: string,
  ancestorTitles: Array<string>,
  implementation: () => mixed,
  isFocused: boolean,
  isSkipped: boolean,
  result?: TestCaseResult,
}> = [];

const ancestorTitles: Array<string> = [];

const globalModifiers: Array<'focused' | 'skipped'> = [];

const globalDescribe = (global.describe = (
  title: string,
  implementation: () => mixed,
) => {
  ancestorTitles.push(title);
  implementation();
  ancestorTitles.pop();
});

const globalIt =
  (global.it =
  global.test =
    (title: string, implementation: () => mixed) =>
      tests.push({
        title,
        implementation,
        ancestorTitles: ancestorTitles.slice(),
        isFocused:
          globalModifiers.length > 0 &&
          globalModifiers[globalModifiers.length - 1] === 'focused',
        isSkipped:
          globalModifiers.length > 0 &&
          globalModifiers[globalModifiers.length - 1] === 'skipped',
      }));

// $FlowExpectedError[prop-missing]
global.fdescribe = global.describe.only = (
  title: string,
  implementation: () => mixed,
) => {
  globalModifiers.push('focused');
  globalDescribe(title, implementation);
  globalModifiers.pop();
};

// $FlowExpectedError[prop-missing]
global.it.only =
  global.fit =
  // $FlowExpectedError[prop-missing]
  global.test.only =
    (title: string, implementation: () => mixed) => {
      globalModifiers.push('focused');
      globalIt(title, implementation);
      globalModifiers.pop();
    };

// $FlowExpectedError[prop-missing]
global.xdescribe = global.describe.skip = (
  title: string,
  implementation: () => mixed,
) => {
  globalModifiers.push('skipped');
  globalDescribe(title, implementation);
  globalModifiers.pop();
};

// $FlowExpectedError[prop-missing]
global.it.skip =
  global.xit =
  // $FlowExpectedError[prop-missing]
  global.test.skip =
  global.xtest =
    (title: string, implementation: () => mixed) => {
      globalModifiers.push('skipped');
      globalIt(title, implementation);
      globalModifiers.pop();
    };

global.jest = {
  fn: createMockFunction,
};

const MOCK_FN_TAG = Symbol('mock function');

function createMockFunction<TArgs: $ReadOnlyArray<mixed>, TReturn>(
  initialImplementation?: (...TArgs) => TReturn,
): JestMockFn<TArgs, TReturn> {
  let implementation: ?(...TArgs) => TReturn = initialImplementation;

  const mock: JestMockFn<TArgs, TReturn>['mock'] = {
    calls: [],
    // $FlowExpectedError[incompatible-type]
    lastCall: undefined,
    instances: [],
    contexts: [],
    results: [],
  };

  const mockFunction = function (this: mixed, ...args: TArgs): TReturn {
    let result: JestMockFn<TArgs, TReturn>['mock']['results'][number] = {
      isThrow: false,
      // $FlowExpectedError[incompatible-type]
      value: undefined,
    };

    if (implementation != null) {
      try {
        result.value = implementation.apply(this, args);
      } catch (error) {
        result.isThrow = true;
        result.value = error;
      }
    }

    mock.calls.push(args);
    mock.lastCall = args;
    // $FlowExpectedError[incompatible-call]
    mock.instances.push(new.target ? this : undefined);
    mock.contexts.push(this);
    mock.results.push(result);

    if (result.isThrow) {
      throw result.value;
    }

    return result.value;
  };

  mockFunction.mock = mock;
  // $FlowExpectedError[invalid-computed-prop]
  mockFunction[MOCK_FN_TAG] = true;

  // $FlowExpectedError[prop-missing]
  return mockFunction;
}

// flowlint unsafe-getters-setters:off

class Expect {
  #received: mixed;
  #isNot: boolean = false;

  constructor(received: mixed) {
    this.#received = received;
  }

  get not(): this {
    this.#isNot = !this.#isNot;
    return this;
  }

  toBe(expected: mixed): void {
    const pass = this.#received === expected;
    if (!this.#isExpectedResult(pass)) {
      throw new Error(
        `Expected${this.#maybeNotLabel()} ${String(expected)} but received ${String(this.#received)}.`,
      );
    }
  }

  toBeInstanceOf(expected: Class<mixed>): void {
    const pass = this.#received instanceof expected;
    if (!this.#isExpectedResult(pass)) {
      throw new Error(
        `expected ${String(this.#received)}${this.#maybeNotLabel()} to be an instance of ${String(expected)}`,
      );
    }
  }

  toBeCloseTo(expected: number, precision: number = 2): void {
    const pass =
      Math.abs(expected - Number(this.#received)) < Math.pow(10, -precision);
    if (!this.#isExpectedResult(pass)) {
      throw new Error(
        `Expected ${String(this.#received)}${this.#maybeNotLabel()} to be close to ${expected}`,
      );
    }
  }

  toThrow(error: mixed): void {
    if (error != null) {
      throw new Error('toThrow() implementation does not accept arguments.');
    }

    let pass = false;
    try {
      // $FlowExpectedError[not-a-function]
      this.#received();
    } catch {
      pass = true;
    }
    if (!this.#isExpectedResult(pass)) {
      throw new Error(
        `Expected ${String(this.#received)}${this.#maybeNotLabel()} to throw`,
      );
    }
  }

  toHaveBeenCalled(): void {
    const mock = this.#requireMock();
    const pass = mock.calls.length > 0;
    if (!this.#isExpectedResult(pass)) {
      throw new Error(
        `Expected ${String(this.#received)}${this.#maybeNotLabel()} to have been called, but it was${this.#isNot ? '' : "n't"}`,
      );
    }
  }

  toHaveBeenCalledTimes(times: number): void {
    const mock = this.#requireMock();
    const pass = mock.calls.length === times;
    if (!this.#isExpectedResult(pass)) {
      throw new Error(
        `Expected ${String(this.#received)}${this.#maybeNotLabel()} to have been called ${times} times, but it was called ${mock.calls.length} times`,
      );
    }
  }

  #isExpectedResult(pass: boolean): boolean {
    return this.#isNot ? !pass : pass;
  }

  #maybeNotLabel(): string {
    return this.#isNot ? ' not' : '';
  }

  #requireMock(): JestMockFn<$ReadOnlyArray<mixed>, mixed>['mock'] {
    // $FlowExpectedError[incompatible-use]
    if (!this.#received?.[MOCK_FN_TAG]) {
      throw new Error(
        `Expected ${String(this.#received)} to be a mock function, but it wasn't`,
      );
    }

    // $FlowExpectedError[incompatible-use]
    return this.#received.mock;
  }
}

global.expect = (received: mixed) => new Expect(received);

function runWithGuard(fn: () => void) {
  try {
    fn();
  } catch (error) {
    let reportedError =
      error instanceof Error ? error : new Error(String(error));
    reportTestSuiteResult({
      error: {
        message: reportedError.message,
        stack: reportedError.stack,
      },
    });
  }
}

function executeTests() {
  const hasFocusedTests = tests.some(test => test.isFocused);

  for (const test of tests) {
    const result: TestCaseResult = {
      title: test.title,
      fullName: [...test.ancestorTitles, test.title].join(' '),
      ancestorTitles: test.ancestorTitles,
      status: 'pending',
      duration: 0,
      failureMessages: [],
      numPassingAsserts: 0,
    };

    test.result = result;

    if (!test.isSkipped && (!hasFocusedTests || test.isFocused)) {
      let status;
      let error;

      const start = Date.now();

      try {
        test.implementation();
        status = 'passed';
      } catch (e) {
        error = e;
        status = 'failed';
      }

      result.status = status;
      result.duration = Date.now() - start;
      result.failureMessages =
        status === 'failed' && error ? [error.message] : [];
    }
  }

  reportTestSuiteResult({
    testResults: tests.map(test => nullthrows(test.result)),
  });
}

function reportTestSuiteResult(testSuiteResult: TestSuiteResult): void {
  console.log(JSON.stringify(testSuiteResult));
}

global.$$RunTests$$ = () => {
  executeTests();
};

export function registerTest(setUpTest: () => void) {
  runWithGuard(() => {
    setUpTest();
  });
}
