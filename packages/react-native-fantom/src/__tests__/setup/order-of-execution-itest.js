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

const logs: string[] = [];
const log = (message: string): void => {
  logs.push(message);
};

afterAll(() => {
  // Source https://jestjs.io/docs/setup-teardown#order-of-execution
  expect(logs).toEqual([
    'describe outer-a',
    'describe inner 1',
    'describe outer-b',
    'describe inner 2',
    'describe outer-c',
    'test 1',
    'test 2',
    'test 3',
  ]);
});

describe('describe outer', () => {
  log('describe outer-a');

  describe('describe inner 1', () => {
    log('describe inner 1');

    test('test 1', () => log('test 1'));
  });

  log('describe outer-b');

  test('test 2', () => log('test 2'));

  describe('describe inner 2', () => {
    log('describe inner 2');

    test('test 3', () => log('test 3'));
  });

  log('describe outer-c');
});
