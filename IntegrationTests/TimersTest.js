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

const React = require('react');
const createReactClass = require('create-react-class');
const ReactNative = require('react-native');

const {StyleSheet, Text, View} = ReactNative;
const {TestModule} = ReactNative.NativeModules;

const TimersTest = createReactClass({
  displayName: 'TimersTest',
  _timeoutIDs: ([]: Array<TimeoutID>),
  _intervalIDs: ([]: Array<IntervalID>),
  _immediateIDs: ([]: Array<Object>),
  _rafIDs: ([]: Array<AnimationFrameID>),

  _nextTest: () => {},
  _interval: -1,

  getInitialState() {
    return {
      count: 0,
      done: false,
    };
  },

  componentDidMount() {
    this._setTimeout(this.testSetTimeout0, 1000);
  },

  componentWillUnmount: function() {
    this._timeoutIDs.forEach(clearTimeout);
    this._timeoutIDs = [];
    this._intervalIDs.forEach(clearInterval);
    this._intervalIDs = [];
    this._immediateIDs.forEach(clearImmediate);
    this._immediateIDs = [];
    this._rafIs.forEach(cancelAnimationFrame);
    this._rafIDs = [];
  },

  testSetTimeout0() {
    this._setTimeout(this.testSetTimeout1, 0);
  },

  testSetTimeout1() {
    this._setTimeout(this.testSetTimeout50, 1);
  },

  testSetTimeout50() {
    this._setTimeout(this.testRequestAnimationFrame, 50);
  },

  testRequestAnimationFrame() {
    this._requestAnimationFrame(this.testSetInterval0);
  },

  testSetInterval0() {
    this._nextTest = this.testSetInterval20;
    this._interval = this._setInterval(this._incrementInterval, 0);
  },

  testSetInterval20() {
    this._nextTest = this.testSetImmediate;
    this._interval = this._setInterval(this._incrementInterval, 20);
  },

  testSetImmediate() {
    this._setImmediate(this.testClearTimeout0);
  },

  testClearTimeout0() {
    const timeout = this._setTimeout(() => this._fail('testClearTimeout0'), 0);
    this._clearTimeout(timeout);
    this.testClearTimeout30();
  },

  testClearTimeout30() {
    const timeout = this._setTimeout(
      () => this._fail('testClearTimeout30'),
      30,
    );
    this._clearTimeout(timeout);
    this._setTimeout(this.testClearMulti, 50);
  },

  testClearMulti() {
    const fails = [];
    fails.push(this._setTimeout(() => this._fail('testClearMulti-1'), 20));
    fails.push(this._setTimeout(() => this._fail('testClearMulti-2'), 50));
    const delayClear = this._setTimeout(
      () => this._fail('testClearMulti-3'),
      50,
    );
    fails.push(this._setTimeout(() => this._fail('testClearMulti-4'), 0));
    fails.push(this._setTimeout(() => this._fail('testClearMulti-5'), 10));

    fails.forEach(timeout => this._clearTimeout(timeout));
    this._setTimeout(() => this._clearTimeout(delayClear), 20);

    this._setTimeout(this.testOrdering, 50);
  },

  testOrdering() {
    // Clear timers are set first because it's more likely to uncover bugs.
    let fail0;
    this._setImmediate(() => this._clearTimeout(fail0));
    fail0 = this._setTimeout(
      () =>
        this._fail(
          'testOrdering-t0, setImmediate should happen before ' +
            'setTimeout 0',
        ),
      0,
    );
    let failAnim; // This should fail without the t=0 fastpath feature.
    this._setTimeout(() => this._cancelAnimationFrame(failAnim), 0);
    failAnim = this._requestAnimationFrame(() =>
      this._fail(
        'testOrdering-Anim, setTimeout 0 should happen before ' +
          'requestAnimationFrame',
      ),
    );
    let fail25;
    this._setTimeout(() => {
      this._clearTimeout(fail25);
    }, 20);
    fail25 = this._setTimeout(
      () =>
        this._fail(
          'testOrdering-t25, setTimeout 20 should happen before ' +
            'setTimeout 25',
        ),
      25,
    );
    this._setTimeout(this.done, 50);
  },

  done() {
    this.setState({done: true}, () => {
      TestModule.markTestCompleted();
    });
  },

  render() {
    return (
      <View style={styles.container}>
        <Text>
          {this.constructor.displayName + ': \n'}
          Intervals: {this.state.count + '\n'}
          {this.state.done ? 'Done' : 'Testing...'}
        </Text>
      </View>
    );
  },

  _setTimeout: function(fn: () => void, ms?: number): void {
    const timeoutID = setTimeout(() => {
      this._timeoutIDs.splice(this._timeoutIDs.indexOf(timeoutID));
      fn();
    }, ms);
    this._timeoutIDs.push(timeoutID);
  },

  _setInterval: function(fn: () => void, ms?: number): void {
    const intervalID = setInterval(() => {
      this._intervalIDs.splice(this._intervalIDs.indexOf(intervalID));
      fn();
    }, ms);
    this._intervalIDs.push(intervalID);
  },

  _setImmediate: function(fn: () => void): void {
    const immediateID = setImmediate(() => {
      this._immediateIDs.splice(this._immediateIDs.indexOf(immediateID));
      fn();
    });
    this._immediateIDs.push(immediateID);
  },

  _requestAnimationFrame: function(fn: () => void): void {
    const rafID = requestAnimationFrame(() => {
      this._rafIDs.splice(this._rafIDs.indexOf(rafID));
      fn();
    });
    this._rafIDs.push(rafID);
  },

  _clearTimeout: function(timeoutID: TimeoutID) {
    clearTimeout(timeoutID);
    this._timeoutIDs = this._timeoutIDs.filter(id => id !== timeoutID);
  },

  _clearInterval: function(intervalID: IntervalID) {
    clearInterval(intervalID);
    this._intervalIDs = this._intervalIDs.filter(id => id !== intervalID);
  },

  _cancelAnimationFrame: function(rafID: AnimationFrameID) {
    cancelAnimationFrame(rafID);
    this._rafIDs = this._rafIDs.filter(id => id !== rafID);
  },

  _incrementInterval() {
    if (this.state.count > 3) {
      throw new Error('interval incremented past end.');
    }
    if (this.state.count === 3) {
      this._clearInterval(this._interval);
      this.setState({count: 0}, this._nextTest);
      return;
    }
    this.setState({count: this.state.count + 1});
  },

  _fail(caller: string): void {
    throw new Error('_fail called by ' + caller);
  },
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    padding: 40,
  },
});

TimersTest.displayName = 'TimersTest';

module.exports = TimersTest;
