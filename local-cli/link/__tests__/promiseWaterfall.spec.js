/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+javascript_foundation
 */

'use strict';

const promiseWaterfall = require('../promiseWaterfall');

describe('promiseWaterfall', () => {
  it('should run promises in a sequence', async () => {
    const tasks = [jest.fn(), jest.fn()];

    await promiseWaterfall(tasks);

    // Check that tasks[0] is executed before tasks[1].
    expect(tasks[0].mock.invocationCallOrder[0]).toBeLessThan(
      tasks[1].mock.invocationCallOrder[0],
    );
  });

  it('should resolve with last promise value', async () => {
    const tasks = [jest.fn().mockReturnValue(1), jest.fn().mockReturnValue(2)];

    expect(await promiseWaterfall(tasks)).toEqual(2);
  });

  it('should stop the sequence when one of promises is rejected', done => {
    const error = new Error();
    const tasks = [
      jest.fn().mockImplementation(() => {
        throw error;
      }),
      jest.fn().mockReturnValue(2),
    ];

    promiseWaterfall(tasks).catch(err => {
      expect(err).toEqual(error);
      expect(tasks[1].mock.calls.length).toEqual(0);
      done();
    });
  });
});
