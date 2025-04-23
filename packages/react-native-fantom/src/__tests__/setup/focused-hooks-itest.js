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

afterAll(() => {
  expect(logs).toEqual([
    '1 - beforeAll',
    '1.1 - beforeAll',
    '1.1 - test 1',
    '1.1 - afterAll',
    '1 - test 2',
    '1 - afterAll',
  ]);
});

describe('1', () => {
  beforeAll(() => {
    logs.push('1 - beforeAll');
  });

  afterAll(() => {
    logs.push('1 - afterAll');
  });

  describe('1.1', () => {
    beforeAll(() => {
      // this is what we want to test
      logs.push('1.1 - beforeAll');
    });

    afterAll(() => {
      // this is what we want to test
      logs.push('1.1 - afterAll');
    });

    // this is part of the test suite
    // eslint-disable-next-line jest/no-focused-tests
    it.only('1.1 - test 1', () => {
      logs.push('1.1 - test 1');
    });

    it('1.1 - test 2', () => {
      logs.push('1.1 - test 2');
    });
  });

  // this is part of the test suite
  // eslint-disable-next-line jest/no-disabled-tests
  describe.skip('1.2', () => {
    beforeAll(() => {
      logs.push('1.2 - beforeAll');
    });

    // this is part of the test suite
    // eslint-disable-next-line jest/no-focused-tests
    it.only('1.2 - test 1', () => {
      logs.push('1.2 - test 1');
    });

    it('1.2 - test 2', () => {
      logs.push('1.2 - test 2');
    });
  });

  it('1 - test 1', () => {
    logs.push('1 - test 1');
  });

  // this is part of the test suite
  // eslint-disable-next-line jest/no-focused-tests
  it.only('1 - test 2', () => {
    logs.push('1 - test 2');
  });
});
