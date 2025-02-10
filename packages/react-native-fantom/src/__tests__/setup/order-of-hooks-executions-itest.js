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

beforeEach(() => log('connection setup'));
beforeEach(() => log('database setup'));

afterEach(() => log('database teardown'));
afterEach(() => log('connection teardown'));
afterAll(() => {
  // Source https://jestjs.io/docs/setup-teardown#order-of-execution
  expect(logs).toEqual([
    'connection setup',
    'database setup',
    'test 1',
    'database teardown',
    'connection teardown',

    'connection setup',
    'database setup',
    'extra database setup',
    'test 2',
    'extra database teardown',
    'database teardown',
    'connection teardown',
  ]);
});

test('test 1', () => log('test 1'));

describe('extra', () => {
  beforeEach(() => log('extra database setup'));
  afterEach(() => log('extra database teardown'));

  test('test 2', () => log('test 2'));
});
