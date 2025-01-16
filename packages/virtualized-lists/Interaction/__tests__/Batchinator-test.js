/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @oncall react_native
 */

'use strict';

describe('Batchinator', () => {
  const Batchinator = require('../Batchinator');

  it('executes vanilla tasks', () => {
    const callback = jest.fn();
    const batcher = new Batchinator(callback, 10000);
    batcher.schedule();
    jest.runAllTimers();
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('batches up tasks', () => {
    const callback = jest.fn();
    const batcher = new Batchinator(callback, 10000);
    batcher.schedule();
    batcher.schedule();
    batcher.schedule();
    batcher.schedule();
    expect(callback).not.toHaveBeenCalled();
    jest.runAllTimers();
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('does nothing after dispose', () => {
    const callback = jest.fn();
    const batcher = new Batchinator(callback, 10000);
    batcher.schedule();
    batcher.schedule();
    batcher.dispose();
    expect(callback).not.toHaveBeenCalled();
    jest.runAllTimers();
    expect(callback).not.toHaveBeenCalled();
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
    expect(callback).toHaveBeenCalledTimes(1);
    jest.runAllTimers();
    expect(callback).toHaveBeenCalledTimes(1);
    batcher.dispose();
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
