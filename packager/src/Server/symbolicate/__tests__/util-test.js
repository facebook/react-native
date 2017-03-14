/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

jest.disableAutomock();

const {LazyPromise, LockingPromise} = require('../util');

describe('Lazy Promise', () => {
  let factory;
  const value = {};

  beforeEach(() => {
    factory = jest.fn();
    factory.mockReturnValue(Promise.resolve(value));
  });

  it('does not run the factory by default', () => {
    new LazyPromise(factory); // eslint-disable-line no-new
    expect(factory).not.toBeCalled();
  });

  it('calling `.then()` returns a promise', () => {
    expect(new LazyPromise(factory).then()).toBeInstanceOf(Promise);
  });

  it('does not invoke the factory twice', () => {
    const p = new LazyPromise(factory);
    p.then(x => x);
    p.then(x => x);
    expect(factory).toHaveBeenCalledTimes(1);
  });

  describe('value and error propagation', () => {
    it('resolves to the value provided by the factory', () => {
      expect.assertions(1);
      return new LazyPromise(factory)
        .then(v => expect(v).toBe(value));
    });

    it('passes through errors if not handled', () => {
      const error = new Error('Unhandled');
      factory.mockReturnValue(Promise.reject(error));

      expect.assertions(1);
      return new LazyPromise(factory)
        .then()
        .catch(e => expect(e).toBe(error));
    });

    it('uses rejection handlers passed to `then()`', () => {
      const error = new Error('Must be handled');
      factory.mockReturnValue(Promise.reject(error));

      expect.assertions(1);
      return new LazyPromise(factory)
        .then(() => {}, e => expect(e).toBe(error));
    });

    it('uses rejection handlers passed to `catch()`', () => {
      const error = new Error('Must be handled');
      factory.mockReturnValue(Promise.reject(error));

      expect.assertions(1);
      return new LazyPromise(factory)
        .catch(e => expect(e).toBe(error));
    });
  });
});

describe('Locking Promise', () => {
  it('resolves to the value of the passed-in promise', () => {
    const value = {};

    expect.assertions(1);
    return new LockingPromise(Promise.resolve(value))
      .then(v => expect(v).toBe(value));
  });

  it('passes through rejections', () => {
    const error = new Error('Rejection');

    expect.assertions(1);
    return new LockingPromise(Promise.reject(error))
      .then()
      .catch(e => expect(e).toBe(error));
  });

  it('uses rejection handlers passed to `then()`', () => {
    const error = new Error('Must be handled');

    expect.assertions(1);
    return new LockingPromise(Promise.reject(error))
      .then(x => x, e => expect(e).toBe(error));
  });

  it('uses rejection handlers passed to `catch()`', () => {
    const error = new Error('Must be handled');

    expect.assertions(1);
    return new LockingPromise(Promise.reject(error))
      .catch(e => expect(e).toBe(error));
  });

  describe('locking', () => {
    const value = Symbol;
    let locking;
    beforeEach(() => {
      locking = new LockingPromise(Promise.resolve(value));
    });


    it('only allows one handler to access the promise value', () => {
      const deferred = defer();
      const secondHandler = jest.fn();
      locking.then(() => deferred.promise);
      locking.then(secondHandler);
      return Promise.resolve() // wait for the next tick
        .then(() => expect(secondHandler).not.toBeCalled());
    });

    it('allows waiting handlers to access the value after the current handler resolves', () => {
      let counter = 0;

      const deferred = defer();
      const x = locking.then(v => {
        const result = [++counter, v];
        return deferred.promise.then(() => result);
      });
      const y = locking.then(v => [++counter, v]);
      const z = locking.then(v => [++counter, v]);

      deferred.resolve();

      return Promise.all([x, y, z])
        .then(([first, second, third]) => {
          expect(first).toEqual([1, value]);
          expect(second).toEqual([2, value]);
          expect(third).toEqual([3, value]);
        });
    });
  });
});


function defer() {
  let resolve;
  const promise = new Promise(res => { resolve = res; });
  return {promise, resolve};
}
