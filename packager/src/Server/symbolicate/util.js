/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

'use strict';

type PromiseLike<R> = {
  catch<U>(onReject?: (error: any) => ?Promise<U> | U): Promise<U>,
  then<U>(
    fulfilled?: R => Promise<U> | U,
    rejected?: (error: any) => Promise<U> | U,
  ): Promise<U>,
};

/**
 * A promise-like object that only creates the underlying value lazily
 * when requested.
 */
exports.LazyPromise = class LazyPromise<T> {
  _promise: PromiseLike<T>;

  constructor(factory: () => PromiseLike<T>) {
    //$FlowIssue #16209141
    Object.defineProperty(this, '_promise', {
      configurable: true,
      enumerable: true,
      get: () => (this._promise = factory()),
      set: value => Object.defineProperty(this, '_promise', {value}),
    });
  }

  then<U>(
    fulfilled?: (value: T) => Promise<U> | U,
    rejected?: (error: any) => Promise<U> | U
  ): Promise<U> {
    return this._promise.then(fulfilled, rejected);
  }

  catch<U>(
    rejected?: (error: any) => ?Promise<U> | U
  ): Promise<U> {
    return this._promise.catch(rejected);
  }
};

/**
 * A promise-like object that allows only one `.then()` handler to access
 * the wrapped value simultaneously. Can be used to lock resources that do
 * asynchronous work.
 */
exports.LockingPromise = class LockingPromise<T> {
  _gate: PromiseLike<any>
  _promise: PromiseLike<T>

  constructor(promise: PromiseLike<T>) {
    this._gate = this._promise = promise;
  }

  then<U>(
    fulfilled?: (value: T) => Promise<U> | U,
    rejected?: (error: any) => Promise<U> | U
  ): Promise<U> {
    const whenUnlocked = () => {
      const promise = this._promise.then(fulfilled, rejected);
      this._gate = promise.then(empty); // avoid retaining the result of promise
      return promise;
    };

    return this._gate.then(whenUnlocked, whenUnlocked);
  }

  catch<U>(
    rejected?: (error: any) => ?Promise<U> | U
  ): Promise<U> {
    return this._promise.catch(rejected);
  }
};

function empty() {}
