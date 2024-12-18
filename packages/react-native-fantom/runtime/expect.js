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

import {ensureMockFunction} from './mocks';
import {snapshotContext} from './snapshotContext';
import deepEqual from 'deep-equal';
import {diff} from 'jest-diff';
import {format, plugins} from 'pretty-format';

class ErrorWithCustomBlame extends Error {
  // Initially 5 to ignore all the frames from Babel helpers to instantiate this
  // custom error class.
  #ignoredFrameCount: number = 5;
  #cachedProcessedStack: ?string;
  #customStack: ?string;

  blameToPreviousFrame(): this {
    this.#cachedProcessedStack = null;
    this.#ignoredFrameCount++;
    return this;
  }

  // $FlowExpectedError[unsafe-getters-setters]
  get stack(): string {
    if (this.#cachedProcessedStack == null) {
      const originalStack = this.#customStack ?? super.stack;

      const lines = originalStack.split('\n');
      const index = lines.findIndex(line =>
        /at (.*) \((.*):(\d+):(\d+)\)/.test(line),
      );
      lines.splice(index > -1 ? index : 1, this.#ignoredFrameCount);
      this.#cachedProcessedStack = lines.join('\n');
    }

    return this.#cachedProcessedStack;
  }

  // $FlowExpectedError[unsafe-getters-setters]
  set stack(value: string) {
    this.#cachedProcessedStack = null;
    this.#customStack = value;
  }

  static fromError(error: Error): ErrorWithCustomBlame {
    const errorWithCustomBlame = new ErrorWithCustomBlame(error.message);
    // In this case we're inheriting the error and we don't know if the stack
    // contains helpers that we need to ignore.
    errorWithCustomBlame.#ignoredFrameCount = 0;
    errorWithCustomBlame.stack = error.stack;
    return errorWithCustomBlame;
  }
}

class Expect {
  #received: mixed;
  #isNot: boolean = false;

  constructor(received: mixed) {
    this.#received = received;
  }

  // $FlowExpectedError[unsafe-getters-setters]
  get not(): this {
    this.#isNot = !this.#isNot;
    return this;
  }

  toEqual(expected: mixed): void {
    const pass = deepEqual(this.#received, expected, {strict: true});
    if (!this.#isExpectedResult(pass)) {
      throw new ErrorWithCustomBlame(
        `Expected${this.#maybeNotLabel()} to equal:\n${
          diff(expected, this.#received, {
            contextLines: 1,
            expand: false,
            omitAnnotationLines: true,
          }) ?? 'Failed to compare outputs'
        }`,
      ).blameToPreviousFrame();
    }
  }

  toBe(expected: mixed): void {
    const pass = this.#received === expected;
    if (!this.#isExpectedResult(pass)) {
      throw new ErrorWithCustomBlame(
        `Expected${this.#maybeNotLabel()} ${String(expected)} but received ${String(this.#received)}.`,
      ).blameToPreviousFrame();
    }
  }

  toBeInstanceOf(expected: Class<mixed>): void {
    const pass = this.#received instanceof expected;
    if (!this.#isExpectedResult(pass)) {
      throw new ErrorWithCustomBlame(
        `expected ${String(this.#received)}${this.#maybeNotLabel()} to be an instance of ${String(expected)}`,
      ).blameToPreviousFrame();
    }
  }

  toBeCloseTo(expected: number, precision: number = 2): void {
    const pass =
      Math.abs(expected - Number(this.#received)) < Math.pow(10, -precision);
    if (!this.#isExpectedResult(pass)) {
      throw new ErrorWithCustomBlame(
        `Expected ${String(this.#received)}${this.#maybeNotLabel()} to be close to ${expected}`,
      ).blameToPreviousFrame();
    }
  }

  toBeNull(): void {
    const pass = this.#received == null;
    if (!this.#isExpectedResult(pass)) {
      throw new ErrorWithCustomBlame(
        `Expected ${String(this.#received)}${this.#maybeNotLabel()} to be null`,
      ).blameToPreviousFrame();
    }
  }

  toThrow(expected?: string): void {
    if (expected != null && typeof expected !== 'string') {
      throw new ErrorWithCustomBlame(
        'toThrow() implementation only accepts strings as arguments.',
      ).blameToPreviousFrame();
    }

    let pass = false;
    try {
      // $FlowExpectedError[not-a-function]
      this.#received();
    } catch (error) {
      pass = expected != null ? error.message === expected : true;
    }
    if (!this.#isExpectedResult(pass)) {
      throw new ErrorWithCustomBlame(
        `Expected ${String(this.#received)}${this.#maybeNotLabel()} to throw`,
      ).blameToPreviousFrame();
    }
  }

  toHaveBeenCalled(): void {
    const mock = this.#requireMock();
    const pass = mock.calls.length > 0;
    if (!this.#isExpectedResult(pass)) {
      throw new ErrorWithCustomBlame(
        `Expected ${String(this.#received)}${this.#maybeNotLabel()} to have been called, but it was${this.#isNot ? '' : "n't"}`,
      ).blameToPreviousFrame();
    }
  }

  toHaveBeenCalledTimes(times: number): void {
    const mock = this.#requireMock();
    const pass = mock.calls.length === times;
    if (!this.#isExpectedResult(pass)) {
      throw new ErrorWithCustomBlame(
        `Expected ${String(this.#received)}${this.#maybeNotLabel()} to have been called ${times} times, but it was called ${mock.calls.length} times`,
      ).blameToPreviousFrame();
    }
  }

  toBeGreaterThan(expected: number): void {
    if (typeof this.#received !== 'number') {
      throw new ErrorWithCustomBlame(
        `Expected ${String(this.#received)} to be a number but it was a ${typeof this.#received}`,
      ).blameToPreviousFrame();
    }

    if (typeof expected !== 'number') {
      throw new ErrorWithCustomBlame(
        `Expected ${String(expected)} to be a number but it was a ${typeof expected}`,
      ).blameToPreviousFrame();
    }

    const pass = this.#received > expected;
    if (!this.#isExpectedResult(pass)) {
      throw new ErrorWithCustomBlame(
        `Expected ${String(this.#received)}${this.#maybeNotLabel()} to be greater than or equal to ${expected}`,
      ).blameToPreviousFrame();
    }
  }

  toBeGreaterThanOrEqual(expected: number): void {
    if (typeof this.#received !== 'number') {
      throw new ErrorWithCustomBlame(
        `Expected ${String(this.#received)} to be a number but it was a ${typeof this.#received}`,
      ).blameToPreviousFrame();
    }

    if (typeof expected !== 'number') {
      throw new ErrorWithCustomBlame(
        `Expected ${String(expected)} to be a number but it was a ${typeof expected}`,
      ).blameToPreviousFrame();
    }

    const pass = this.#received >= expected;
    if (!this.#isExpectedResult(pass)) {
      throw new ErrorWithCustomBlame(
        `Expected ${String(this.#received)}${this.#maybeNotLabel()} to be greater than or equal to ${expected}`,
      ).blameToPreviousFrame();
    }
  }

  toBeLessThan(expected: number): void {
    if (typeof this.#received !== 'number') {
      throw new ErrorWithCustomBlame(
        `Expected ${String(this.#received)} to be a number but it was a ${typeof this.#received}`,
      ).blameToPreviousFrame();
    }

    if (typeof expected !== 'number') {
      throw new ErrorWithCustomBlame(
        `Expected ${String(expected)} to be a number but it was a ${typeof expected}`,
      ).blameToPreviousFrame();
    }

    const pass = this.#received < expected;
    if (!this.#isExpectedResult(pass)) {
      throw new ErrorWithCustomBlame(
        `Expected ${String(this.#received)}${this.#maybeNotLabel()} to be less than or equal to ${expected}`,
      ).blameToPreviousFrame();
    }
  }

  toBeLessThanOrEqual(expected: number): void {
    if (typeof this.#received !== 'number') {
      throw new ErrorWithCustomBlame(
        `Expected ${String(this.#received)} to be a number but it was a ${typeof this.#received}`,
      ).blameToPreviousFrame();
    }

    if (typeof expected !== 'number') {
      throw new ErrorWithCustomBlame(
        `Expected ${String(expected)} to be a number but it was a ${typeof expected}`,
      ).blameToPreviousFrame();
    }

    const pass = this.#received <= expected;
    if (!this.#isExpectedResult(pass)) {
      throw new ErrorWithCustomBlame(
        `Expected ${String(this.#received)}${this.#maybeNotLabel()} to be less than or equal to ${expected}`,
      ).blameToPreviousFrame();
    }
  }

  toMatchSnapshot(expected?: string): void {
    if (this.#isNot) {
      throw new ErrorWithCustomBlame(
        'Snapshot matchers cannot be used with not.',
      ).blameToPreviousFrame();
    }

    const receivedValue = format(this.#received, {
      plugins: [plugins.ReactElement],
    });

    try {
      snapshotContext.toMatchSnapshot(receivedValue, expected);
    } catch (err) {
      throw new ErrorWithCustomBlame(err.message).blameToPreviousFrame();
    }
  }

  #isExpectedResult(pass: boolean): boolean {
    return this.#isNot ? !pass : pass;
  }

  #maybeNotLabel(): string {
    return this.#isNot ? ' not' : '';
  }

  #requireMock(): JestMockFn<Array<mixed>, mixed>['mock'] {
    try {
      return ensureMockFunction(this.#received).mock;
    } catch (error) {
      const errorWithCustomBlame = ErrorWithCustomBlame.fromError(error);
      errorWithCustomBlame.message = `Expected ${String(this.#received)} to be a mock function, but it wasn't`;
      errorWithCustomBlame
        .blameToPreviousFrame() // ignore `ensureMockFunction`
        .blameToPreviousFrame() // ignore `requireMock`
        .blameToPreviousFrame(); // ignore `expect().[method]`
      throw errorWithCustomBlame;
    }
  }
}

const expect: mixed => Expect = (received: mixed) => new Expect(received);

export default expect;
