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

const LOG_LEVELS = {
  trace: 0,
  info: 1,
  warn: 2,
  error: 3,
};

describe('console', () => {
  describe('.table(data, rows)', () => {
    it('should print the passed array as a table', () => {
      const originalNativeLoggingHook = global.nativeLoggingHook;
      const logFn = (global.nativeLoggingHook = jest.fn());

      // TODO: replace with `beforeEach` when supported.
      try {
        console.table([
          {name: 'First', value: 500},
          {name: 'Second', value: 600},
          {name: 'Third', value: 700},
          {name: 'Fourth', value: 800, extraValue: true},
        ]);

        expect(logFn).toHaveBeenCalledTimes(1);
        expect(logFn.mock.lastCall).toEqual([
          `
name   | value
-------|------
First  | 500 \u0020
Second | 600 \u0020
Third  | 700 \u0020
Fourth | 800  `,
          LOG_LEVELS.info,
        ]);
      } finally {
        global.nativeLoggingHook = originalNativeLoggingHook;
      }
    });

    it('should print the passed dictionary as a table', () => {
      const originalNativeLoggingHook = global.nativeLoggingHook;
      const logFn = (global.nativeLoggingHook = jest.fn());

      // TODO: replace with `beforeEach` when supported.
      try {
        console.table({
          first: {name: 'First', value: 500},
          second: {name: 'Second', value: 600},
          third: {name: 'Third', value: 700},
          fourth: {name: 'Fourth', value: 800, extraValue: true},
        });

        expect(logFn).toHaveBeenCalledTimes(1);
        expect(logFn.mock.lastCall).toEqual([
          `
(index) | name   | value
--------|--------|------
first   | First  | 500 \u0020
second  | Second | 600 \u0020
third   | Third  | 700 \u0020
fourth  | Fourth | 800  `,
          LOG_LEVELS.info,
        ]);
      } finally {
        global.nativeLoggingHook = originalNativeLoggingHook;
      }
    });

    it('should print an empty string for empty arrays', () => {
      const originalNativeLoggingHook = global.nativeLoggingHook;
      const logFn = (global.nativeLoggingHook = jest.fn());

      // TODO: replace with `beforeEach` when supported.
      try {
        console.table([]);

        expect(logFn).toHaveBeenCalledTimes(1);
        expect(logFn.mock.lastCall).toEqual([``, LOG_LEVELS.info]);
      } finally {
        global.nativeLoggingHook = originalNativeLoggingHook;
      }
    });

    it('should print an empty string for empty dictionaries', () => {
      const originalNativeLoggingHook = global.nativeLoggingHook;
      const logFn = (global.nativeLoggingHook = jest.fn());

      // TODO: replace with `beforeEach` when supported.
      try {
        console.table({});

        expect(logFn).toHaveBeenCalledTimes(1);
        expect(logFn.mock.lastCall).toEqual([``, LOG_LEVELS.info]);
      } finally {
        global.nativeLoggingHook = originalNativeLoggingHook;
      }
    });

    // This test is currently failing
    it.skip('should print an indices table for an array of empty objects', () => {
      const originalNativeLoggingHook = global.nativeLoggingHook;
      const logFn = (global.nativeLoggingHook = jest.fn());

      // TODO: replace with `beforeEach` when supported.
      try {
        console.table([{}, {}, {}, {}]);

        expect(logFn).toHaveBeenCalledTimes(1);
        expect(logFn.mock.lastCall).toEqual([
          `
(index)
-------
0     \u0020
1     \u0020
2     \u0020
3      `,
          LOG_LEVELS.info,
        ]);
      } finally {
        global.nativeLoggingHook = originalNativeLoggingHook;
      }
    });

    it('should print an indices table for a dictionary of empty objects', () => {
      const originalNativeLoggingHook = global.nativeLoggingHook;
      const logFn = (global.nativeLoggingHook = jest.fn());

      // TODO: replace with `beforeEach` when supported.
      try {
        console.table({
          first: {},
          second: {},
          third: {},
          fourth: {},
        });

        expect(logFn).toHaveBeenCalledTimes(1);
        expect(logFn.mock.lastCall).toEqual([
          `
(index)
-------
first \u0020
second\u0020
third \u0020
fourth `,
          LOG_LEVELS.info,
        ]);
      } finally {
        global.nativeLoggingHook = originalNativeLoggingHook;
      }
    });
  });
});
