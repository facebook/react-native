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
  result?: TestCaseResult,
}> = [];

const ancestorTitles: Array<string> = [];

global.describe = (title: string, implementation: () => mixed) => {
  ancestorTitles.push(title);
  implementation();
  ancestorTitles.pop();
};

global.it = (title: string, implementation: () => mixed) =>
  tests.push({
    title,
    implementation,
    ancestorTitles: ancestorTitles.slice(),
  });

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
        `expected ${String(this.#received)}${this.#maybeNotLabel()} to be close to ${expected}`,
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
        `expected ${String(this.#received)}${this.#maybeNotLabel()} to throw`,
      );
    }
  }

  #isExpectedResult(pass: boolean): boolean {
    return this.#isNot ? !pass : pass;
  }

  #maybeNotLabel(): string {
    return this.#isNot ? ' not' : '';
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
  for (const test of tests) {
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

    test.result = {
      title: test.title,
      fullName: [...test.ancestorTitles, test.title].join(' '),
      ancestorTitles: test.ancestorTitles,
      status,
      duration: Date.now() - start,
      failureMessages: status === 'failed' && error ? [error.message] : [],
      numPassingAsserts: 0,
    };
  }

  reportTestSuiteResult({
    testResults: tests.map(test => nullthrows(test.result)),
  });
}

function reportTestSuiteResult(testSuiteResult: TestSuiteResult): void {
  console.log(JSON.stringify(testSuiteResult));
}

export function registerTest(setUpTest: () => void) {
  runWithGuard(() => {
    setUpTest();
    executeTests();
  });
}
