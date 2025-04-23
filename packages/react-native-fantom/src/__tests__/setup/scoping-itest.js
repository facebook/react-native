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

beforeAll(() => log('1 - beforeAll'));
afterAll(() => {
  log('1 - afterAll');
  // Source https://jestjs.io/docs/setup-teardown#scoping
  expect(logs).toEqual([
    '1 - beforeAll',
    '1 - beforeEach',
    '1 - test',
    '1 - afterEach',
    '2 - beforeAll',
    '1 - beforeEach',
    '2 - beforeEach',
    '2 - test',
    '2 - afterEach',
    '1 - afterEach',
    '2 - afterAll',
    '1 - afterAll',
  ]);
});
beforeEach(() => log('1 - beforeEach'));
afterEach(() => log('1 - afterEach'));

test('root', () => log('1 - test'));

describe('Scoped / Nested block', () => {
  beforeAll(() => log('2 - beforeAll'));
  afterAll(() => log('2 - afterAll'));
  beforeEach(() => log('2 - beforeEach'));
  afterEach(() => log('2 - afterEach'));

  test('inner', () => log('2 - test'));
});
