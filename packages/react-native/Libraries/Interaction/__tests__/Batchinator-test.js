/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+react_native
 */

'use strict';

jest
  .mock('../../vendor/core/ErrorUtils')
  .mock('../../BatchedBridge/BatchedBridge');

function expectToBeCalledOnce(fn) {
  expect(fn.mock.calls.length).toBe(1);
}

describe('Batchinator', () => {
  const Batchinator = require('../Batchinator');

  it('executes vanilla tasks', () => {
    const callback = jest.fn();
    const batcher = new Batchinator(callback, 10000);
    batcher.schedule();
    jest.runAllTimers();
    expectToBeCalledOnce(callback);
  });

  it('batches up tasks', () => {
    const callback = jest.fn();
    const batcher = new Batchinator(callback, 10000);
    batcher.schedule();
    batcher.schedule();
    batcher.schedule();
    batcher.schedule();
    expect(callback).not.toBeCalled();
    jest.runAllTimers();
    expectToBeCalledOnce(callback);
  });

  it('flushes on dispose', () => {
    const callback = jest.fn();
    const batcher = new Batchinator(callback, 10000);
    batcher.schedule();
    batcher.schedule();
    batcher.dispose();
    expectToBeCalledOnce(callback);
    jest.runAllTimers();
    expectToBeCalledOnce(callback);
  });

  it('should call tasks scheduled by the callback', () => {
    let batcher = null;
    let hasRescheduled = false;
    const callback = jest.fn(() => {
      if (!hasRescheduled) {
        batcher.schedule();
        hasRescheduled = true;
      }
    });
    batcher = new Batchinator(callback, 10000);
    batcher.schedule();
    jest.runAllTimers();
    expect(callback.mock.calls.length).toBe(2);
  });

  it('does not run callbacks more than once', () => {
    const callback = jest.fn();
    const batcher = new Batchinator(callback, 10000);
    batcher.schedule();
    batcher.schedule();
    jest.runAllTimers();
    expectToBeCalledOnce(callback);
    jest.runAllTimers();
    expectToBeCalledOnce(callback);
    batcher.dispose();
    expectToBeCalledOnce(callback);
  });
});
