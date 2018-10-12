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
const ReactNative = require('react-native');
/* $FlowFixMe(>=0.54.0 site=react_native_oss) This comment suppresses an error
 * found when Flow v0.54 was deployed. To see the error delete this comment and
 * run Flow. */

const {StyleSheet, Text, View} = ReactNative;
const {TestModule} = ReactNative.NativeModules;
const requestAnimationFrame = require('fbjs/lib/requestAnimationFrame');

type Props = $ReadOnly<{||}>;

type State = {|
  count: number,
  done: boolean,
|};
class TimersTest extends React.Component<Props, State> {
  _nextTest = () => {};
  _timeoutID: ?TimeoutID = null;
  // $FlowFixMe
  _intervalId: ?IntervalID = -1;
  _immediateId: ?Object = null;

  state = {
    count: 0,
    done: false,
  };

  componentDidMount() {
    this._timeoutID = setTimeout(this.testSetTimeout0, 1000);
  }

  testSetTimeout0() {
    this._timeoutID = setTimeout(this.testSetTimeout1, 0);
  }

  testSetTimeout1() {
    this._timeoutID = setTimeout(this.testSetTimeout50, 1);
  }

  testSetTimeout50() {
    this._timeoutID = setTimeout(this.testRequestAnimationFrame, 50);
  }

  testRequestAnimationFrame() {
    requestAnimationFrame(this.testSetInterval0);
  }

  testSetInterval0() {
    this._nextTest = this.testSetInterval20;
    this._intervalId = setInterval(this._incrementInterval, 0);
  }

  testSetInterval20() {
    this._nextTest = this.testSetImmediate;
    this._intervalId = setInterval(this._incrementInterval, 20);
  }

  testSetImmediate() {
    this._immediateId = setImmediate(this.testClearTimeout0);
  }

  testClearTimeout0() {
    const timeout = setTimeout(() => this._fail('testClearTimeout0'), 0);
    clearTimeout(timeout);
    this.testClearTimeout30();
  }

  testClearTimeout30() {
    const timeout = setTimeout(() => this._fail('testClearTimeout30'), 30);
    clearTimeout(timeout);
    this._timeoutID = setTimeout(this.testClearMulti, 50);
  }

  testClearMulti() {
    const fails = [];
    fails.push(
      (this._timeoutID = setTimeout(() => this._fail('testClearMulti-1'), 20)),
    );
    fails.push(
      (this._timeoutID = setTimeout(() => this._fail('testClearMulti-2'), 50)),
    );
    const delayClear = setTimeout(() => this._fail('testClearMulti-3'), 50);
    fails.push(
      (this._timeoutID = setTimeout(() => this._fail('testClearMulti-4'), 0)),
    );
    fails.push(
      (this._timeoutID = setTimeout(() => this._fail('testClearMulti-5'), 10)),
    );

    fails.forEach(timeout => clearTimeout(timeout));
    this._timeoutID = setTimeout(() => clearTimeout(delayClear), 20);

    this._timeoutID = setTimeout(this.testOrdering, 50);
  }

  testOrdering() {
    // Clear timers are set first because it's more likely to uncover bugs.
    let fail0;
    this._immediateId = setImmediate(() => clearTimeout(fail0));
    fail0 = setTimeout(
      () =>
        this._fail(
          'testOrdering-t0, setImmediate should happen before ' +
            'setTimeout 0',
        ),
      0,
    );
    let failAnim; // This should fail without the t=0 fastpath feature.
    this._timeoutID = setTimeout(() => cancelAnimationFrame(failAnim), 0);
    failAnim = requestAnimationFrame(() =>
      this._fail(
        'testOrdering-Anim, setTimeout 0 should happen before ' +
          'requestAnimationFrame',
      ),
    );
    let fail25;
    this._timeoutID = setTimeout(() => {
      clearTimeout(fail25);
    }, 20);
    fail25 = setTimeout(
      () =>
        this._fail(
          'testOrdering-t25, setTimeout 20 should happen before ' +
            'setTimeout 25',
        ),
      25,
    );
    this._timeoutID = setTimeout(this.done, 50);
  }

  done() {
    this.setState({done: true}, () => {
      TestModule.markTestCompleted();
    });
  }

  componentWillUnmount() {
    if (this._timeoutID != null) {
      clearTimeout(this._timeoutID);
    }
    if (this._immediateId != null) {
      clearImmediate(this._immediateId);
    }
    if (this._intervalId != null) {
      clearInterval(this._intervalId);
    }
  }

  render() {
    return (
      <View style={styles.container}>
        <Text>
          {/* $FlowFixMe(>=0.54.0 site=react_native_fb,react_native_oss) This
             * comment suppresses an error found when Flow v0.54 was deployed.
             * To see the error delete this comment and run Flow. */
          this.constructor.displayName + ': \n'}
          Intervals: {this.state.count + '\n'}
          {this.state.done ? 'Done' : 'Testing...'}
        </Text>
      </View>
    );
  }

  _incrementInterval() {
    if (this.state.count > 3) {
      throw new Error('interval incremented past end.');
    }
    if (this.state.count === 3) {
      clearInterval(this._intervalId);
      this.setState({count: 0}, this._nextTest);
      return;
    }
    this.setState({count: this.state.count + 1});
  }

  _fail(caller: string): void {
    throw new Error('_fail called by ' + caller);
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    padding: 40,
  },
});

TimersTest.displayName = 'TimersTest';

module.exports = TimersTest;
