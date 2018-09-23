/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const React = require('React');

const setter = function(_setter: Function, key: string, _clearer?: ?Function) {
  return function(callback: Function, delta: number, ...args: Array<any>) {
    const id = _setter(() => {
      _clearer && _clearer.call(this, id);
      callback.apply(this, args);
    }, delta);

    if (!this[key]) {
      this[key] = [id];
    } else {
      this[key].push(id);
    }

    return id;
  };
};

const clearer = function(_clearer: Function, key: string) {
  return function(id: any): void {
    if (this[key]) {
      const index = this[key].indexOf(id);
      if (index !== -1) {
        this[key].splice(index, 1);
      }
    }
    _clearer(id);
  };
};

const _clearTimeout = clearer(clearTimeout, '_timeouts');
const _setTimeout = setter(setTimeout, '_timeouts', _clearTimeout);

const _clearInterval = clearer(clearInterval, '_intervals');
const _setInterval = setter(setInterval, '_intervals');

const _clearImmediate = clearer(clearImmediate, '_immediates');
const _setImmediate = setter(setImmediate, '_immediates', _clearImmediate);

const _cancelAnimationFrame = clearer(cancelAnimationFrame, '_rafs');
const _requestAnimationFrame = setter(
  requestAnimationFrame,
  '_rafs',
  _cancelAnimationFrame,
);

/**
 * A simple Timer component that provides timers that will be automatically
 * cleared when it is unmounted.
 *
 * Use it by getting a handle to it via the ref api:
 *   <Timer ref={timer => { this._timer = timer; }} />
 *
 * And in one of your class' methods after the component was mounted:
 *   this._timer.setTimeout(() => {}, 1000);
 *
 * This component accepts no child components.
 */
class Timer extends React.Component<{}> {
  _timeouts: ?Array<TimeoutID>;
  _intervals: ?Array<IntervalID>;
  _immediates: ?Array<number>;
  _rafs: ?Array<AnimationFrameID>;

  componentWillUnmount() {
    this._timeouts &&
      this._timeouts.forEach(id => {
        clearTimeout(id);
      });
    this._timeouts = null;
    this._intervals &&
      this._intervals.forEach(id => {
        clearInterval(id);
      });
    this._intervals = null;
    this._immediates &&
      this._immediates.forEach(id => {
        clearImmediate(id);
      });
    this._immediates = null;
    this._rafs &&
      this._rafs.forEach(id => {
        cancelAnimationFrame(id);
      });
    this._rafs = null;
  }

  setTimeout = _setTimeout;
  clearTimeout = _clearTimeout;

  setInterval = _setInterval;
  clearInterval = _clearInterval;

  setImmediate = _setImmediate;
  clearImmediate = _clearImmediate;

  requestAnimationFrame = _requestAnimationFrame;
  cancelAnimationFrame = _cancelAnimationFrame;

  render() {
    return null;
  }
}

module.exports = Timer;
