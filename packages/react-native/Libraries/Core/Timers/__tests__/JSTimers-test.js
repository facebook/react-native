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

const NativeTiming = {
  createTimer: jest.fn(),
  deleteTimer: jest.fn(),
  setSendIdleEvents: jest.fn(),
};

jest
  .enableAutomock()
  .mock('../NativeTiming', () => ({
    __esModule: true,
    default: NativeTiming,
  }))
  .unmock('../JSTimers');

const JSTimers = require('../JSTimers');

describe('JSTimers', function () {
  beforeEach(function () {
    jest.spyOn(console, 'warn').mockReturnValue(undefined);
    global.setTimeout = JSTimers.setTimeout;
  });

  afterEach(() => {
    console.warn.mockRestore();
  });

  it('should call function with setTimeout', function () {
    let didCall = false;
    const id = JSTimers.setTimeout(function () {
      didCall = true;
    });
    JSTimers.callTimers([id]);
    expect(didCall).toBe(true);
  });

  it('should call nested setTimeout when cleared', function () {
    let id1, id2, id3;
    let callCount = 0;

    id1 = JSTimers.setTimeout(function () {
      JSTimers.clearTimeout(id1);
      id2 = JSTimers.setTimeout(function () {
        JSTimers.clearTimeout(id2);
        id3 = JSTimers.setTimeout(function () {
          callCount += 1;
        });
      });
    });
    JSTimers.callTimers([id1]);
    JSTimers.callTimers([id2]);
    JSTimers.callTimers([id3]);

    expect(callCount).toBe(1);
  });

  it('should call nested queueReactNativeMicrotask when cleared', function () {
    let id1, id2, id3;
    let callCount = 0;

    id1 = JSTimers.queueReactNativeMicrotask(function () {
      JSTimers.clearReactNativeMicrotask(id1);
      id2 = JSTimers.queueReactNativeMicrotask(function () {
        JSTimers.clearReactNativeMicrotask(id2);
        id3 = JSTimers.queueReactNativeMicrotask(function () {
          callCount += 1;
        });
      });
    });
    JSTimers.callTimers([id1]);
    JSTimers.callTimers([id2]);
    JSTimers.callTimers([id3]);

    expect(callCount).toBe(1);
  });

  it('should call nested requestAnimationFrame when cleared', function () {
    let id1, id2, id3;
    let callCount = 0;

    id1 = JSTimers.requestAnimationFrame(function () {
      JSTimers.cancelAnimationFrame(id1);
      id2 = JSTimers.requestAnimationFrame(function () {
        JSTimers.cancelAnimationFrame(id2);
        id3 = JSTimers.requestAnimationFrame(function () {
          callCount += 1;
        });
      });
    });
    JSTimers.callTimers([id1]);
    JSTimers.callTimers([id2]);
    JSTimers.callTimers([id3]);

    expect(callCount).toBe(1);
  });

  it('should call nested setInterval when cleared', function () {
    let id1, id2, id3;
    let callCount = 0;

    id1 = JSTimers.setInterval(function () {
      JSTimers.clearInterval(id1);
      id2 = JSTimers.setInterval(function () {
        JSTimers.clearInterval(id2);
        id3 = JSTimers.setInterval(function () {
          callCount += 1;
        });
      });
    });
    JSTimers.callTimers([id1]);
    JSTimers.callTimers([id2]);
    JSTimers.callTimers([id3]);

    expect(callCount).toBe(1);
  });

  it('should call function with setInterval', function () {
    const callback = jest.fn();
    const id = JSTimers.setInterval(callback);
    JSTimers.callTimers([id]);
    expect(callback).toBeCalledTimes(1);
  });

  it('should call function with queueReactNativeMicrotask', function () {
    const callback = jest.fn();
    JSTimers.queueReactNativeMicrotask(callback);
    JSTimers.callReactNativeMicrotasks();
    expect(callback).toBeCalledTimes(1);
  });

  it('should not call function with clearReactNativeMicrotask', function () {
    const callback = jest.fn();
    const id = JSTimers.queueReactNativeMicrotask(callback);
    JSTimers.clearReactNativeMicrotask(id);
    JSTimers.callReactNativeMicrotasks();
    expect(callback).not.toBeCalled();
  });

  it('should call functions in the right order with queueReactNativeMicrotask', function () {
    let count = 0;
    let firstCalled = null;
    let secondCalled = null;
    JSTimers.queueReactNativeMicrotask(function () {
      firstCalled = count++;
    });
    JSTimers.queueReactNativeMicrotask(function () {
      secondCalled = count++;
    });
    JSTimers.callReactNativeMicrotasks();
    expect(firstCalled).toBe(0);
    expect(secondCalled).toBe(1);
  });

  it('should call functions in the right order with nested queueReactNativeMicrotask', function () {
    let count = 0;
    let firstCalled = null;
    let secondCalled = null;
    let thirdCalled = null;
    JSTimers.queueReactNativeMicrotask(function () {
      firstCalled = count++;
      JSTimers.queueReactNativeMicrotask(function () {
        thirdCalled = count++;
      });
      secondCalled = count++;
    });
    JSTimers.callReactNativeMicrotasks();
    expect(firstCalled).toBe(0);
    expect(secondCalled).toBe(1);
    expect(thirdCalled).toBe(2);
  });

  it('should call nested queueReactNativeMicrotask', function () {
    let firstCalled = false;
    let secondCalled = false;
    JSTimers.queueReactNativeMicrotask(function () {
      firstCalled = true;
      JSTimers.queueReactNativeMicrotask(function () {
        secondCalled = true;
      });
    });
    JSTimers.callReactNativeMicrotasks();
    expect(firstCalled).toBe(true);
    expect(secondCalled).toBe(true);
  });

  it('should call function with requestAnimationFrame', function () {
    const callback = jest.fn();
    const id = JSTimers.requestAnimationFrame(callback);
    JSTimers.callTimers([id]);
    expect(callback).toBeCalledTimes(1);
  });

  it("should not call function if we don't callTimers", function () {
    const callback = jest.fn();
    JSTimers.setTimeout(callback, 10);
    expect(callback).not.toBeCalled();
    JSTimers.setInterval(callback, 10);
    expect(callback).not.toBeCalled();
    JSTimers.requestAnimationFrame(callback);
    expect(callback).not.toBeCalled();
  });

  it('should call setInterval as many times as callTimers is called', function () {
    const callback = jest.fn();
    const id = JSTimers.setInterval(callback, 10);
    JSTimers.callTimers([id]);
    JSTimers.callTimers([id]);
    JSTimers.callTimers([id]);
    JSTimers.callTimers([id]);
    expect(callback).toBeCalledTimes(4);
  });

  it("should only call the function who's id we pass in", function () {
    let firstCalled = false;
    let secondCalled = false;
    JSTimers.setTimeout(function () {
      firstCalled = true;
    });
    const secondID = JSTimers.setTimeout(function () {
      secondCalled = true;
    });
    JSTimers.callTimers([secondID]);
    expect(firstCalled).toBe(false);
    expect(secondCalled).toBe(true);
  });

  it('should work with calling multiple timers', function () {
    let firstCalled = false;
    let secondCalled = false;
    const firstID = JSTimers.setTimeout(function () {
      firstCalled = true;
    });
    const secondID = JSTimers.setTimeout(function () {
      secondCalled = true;
    });
    JSTimers.callTimers([firstID, secondID]);
    expect(firstCalled).toBe(true);
    expect(secondCalled).toBe(true);
  });

  it('should still execute all callbacks even if one throws', function () {
    const firstID = JSTimers.setTimeout(function () {
      throw new Error('error');
    }, 10);
    let secondCalled = false;
    const secondID = JSTimers.setTimeout(function () {
      secondCalled = true;
    }, 10);
    expect(JSTimers.callTimers.bind(null, [firstID, secondID])).toThrow();
    expect(secondCalled).toBe(true);
  });

  it('should clear timers even if callback throws', function () {
    const timerID = JSTimers.setTimeout(function () {
      throw new Error('error');
    }, 10);
    expect(JSTimers.callTimers.bind(null, [timerID])).toThrow('error');
    JSTimers.callTimers.bind(null, [timerID]);
  });

  it('should not warn if callback is called on cancelled timer', function () {
    const callback = jest.fn();
    const timerID = JSTimers.setTimeout(callback, 10);
    JSTimers.clearTimeout(timerID);
    JSTimers.callTimers([timerID]);
    expect(callback).not.toBeCalled();
    expect(console.warn).not.toBeCalled();
  });

  it('should warn when callTimers is called with garbage timer id', function () {
    JSTimers.callTimers([1337]);
    expect(console.warn).toBeCalled();
  });

  it('should only call callback once for setTimeout', function () {
    const callback = jest.fn();
    const timerID = JSTimers.setTimeout(callback, 10);
    // First time the timer fires, should call callback
    JSTimers.callTimers([timerID]);
    expect(callback).toBeCalledTimes(1);
    // Second time it should be ignored
    JSTimers.callTimers([timerID]);
    expect(callback).toBeCalledTimes(1);
    expect(console.warn).not.toBeCalled();
  });

  it('should only call callback once for requestAnimationFrame', function () {
    const callback = jest.fn();
    const timerID = JSTimers.requestAnimationFrame(callback, 10);
    // First time the timer fires, should call callback
    JSTimers.callTimers([timerID]);
    expect(callback).toBeCalledTimes(1);
    // Second time it should be ignored
    JSTimers.callTimers([timerID]);
    expect(callback).toBeCalledTimes(1);
    expect(console.warn).not.toBeCalled();
  });

  it('should re-throw first exception', function () {
    const timerID1 = JSTimers.setTimeout(function () {
      throw new Error('first error');
    });
    const timerID2 = JSTimers.setTimeout(function () {
      throw new Error('second error');
    });
    expect(JSTimers.callTimers.bind(null, [timerID1, timerID2])).toThrowError(
      'first error',
    );
  });

  it('should pass along errors thrown from queueReactNativeMicrotask', function () {
    JSTimers.queueReactNativeMicrotask(function () {
      throw new Error('error within queueReactNativeMicrotask');
    });

    NativeTiming.createTimer = jest.fn();
    JSTimers.callReactNativeMicrotasks();

    // The remaining errors should be called within setTimeout, in case there
    // are a series of them
    expect(NativeTiming.createTimer).toBeCalled();
    const timerID = NativeTiming.createTimer.mock.calls[0][0];
    expect(JSTimers.callTimers.bind(null, [timerID])).toThrowError(
      'error within queueReactNativeMicrotask',
    );
  });

  it('should throw all errors from queueReactNativeMicrotask', function () {
    JSTimers.queueReactNativeMicrotask(function () {
      throw new Error('first error');
    });

    JSTimers.queueReactNativeMicrotask(function () {
      throw new Error('second error');
    });

    NativeTiming.createTimer = jest.fn();
    JSTimers.callReactNativeMicrotasks();

    expect(NativeTiming.createTimer.mock.calls.length).toBe(2);

    const firstTimerID = NativeTiming.createTimer.mock.calls[0][0];
    expect(JSTimers.callTimers.bind(null, [firstTimerID])).toThrowError(
      'first error',
    );

    const secondTimerID = NativeTiming.createTimer.mock.calls[1][0];
    expect(JSTimers.callTimers.bind(null, [secondTimerID])).toThrowError(
      'second error',
    );
  });

  it('should pass along errors thrown from setTimeout', function () {
    const timerID = JSTimers.setTimeout(function () {
      throw new Error('error within setTimeout');
    });

    expect(JSTimers.callTimers.bind(null, [timerID])).toThrowError(
      'error within setTimeout',
    );
  });

  it('should throw all errors from setTimeout', function () {
    const firstTimerID = JSTimers.setTimeout(function () {
      throw new Error('first error');
    });
    const secondTimerID = JSTimers.setTimeout(function () {
      throw new Error('second error');
    });

    NativeTiming.createTimer = jest.fn();
    expect(
      JSTimers.callTimers.bind(null, [firstTimerID, secondTimerID]),
    ).toThrowError('first error');

    expect(NativeTiming.createTimer.mock.calls.length).toBe(1);
    const thirdTimerID = NativeTiming.createTimer.mock.calls[0][0];
    expect(JSTimers.callTimers.bind(null, [thirdTimerID])).toThrowError(
      'second error',
    );
  });

  it('should pass along errors thrown from setInterval', function () {
    const timerID = JSTimers.setInterval(function () {
      throw new Error('error within setInterval');
    });
    expect(JSTimers.callTimers.bind(null, [timerID])).toThrowError(
      'error within setInterval',
    );
  });

  it('should not call to native when clearing a null timer', function () {
    const timerID = JSTimers.setTimeout(() => {});
    JSTimers.clearTimeout(timerID);
    NativeTiming.deleteTimer = jest.fn();

    JSTimers.clearTimeout(null);
    expect(NativeTiming.deleteTimer.mock.calls.length).toBe(0);
  });
});
