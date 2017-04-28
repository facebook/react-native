/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * The examples provided by Facebook are for non-commercial testing and
 * evaluation purposes only.
 *
 * Facebook reserves all rights not expressly granted.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NON INFRINGEMENT. IN NO EVENT SHALL
 * FACEBOOK BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN
 * AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * @flow
 * @providesModule TimerExample
 */
'use strict';

var React = require('react');
var ReactNative = require('react-native');
var {
  AlertIOS,
  Platform,
  ToastAndroid,
  Text,
  View,
} = ReactNative;
var TimerMixin = require('react-timer-mixin');
var UIExplorerButton = require('./UIExplorerButton');
var performanceNow = require('fbjs/lib/performanceNow');

function burnCPU(milliseconds) {
  const start = performanceNow();
  while (performanceNow() < (start + milliseconds)) {}
}

class RequestIdleCallbackTester extends React.Component {
  state = {
    message: '-',
  };

  _idleTimer: any = null;
  _iters = 0;

  componentWillUnmount() {
    cancelIdleCallback(this._idleTimer);
  }

  render() {
    return (
      <View>
        <UIExplorerButton onPress={this._run.bind(this, false)}>
          Run requestIdleCallback
        </UIExplorerButton>

        <UIExplorerButton onPress={this._run.bind(this, true)}>
          Burn CPU inside of requestIdleCallback
        </UIExplorerButton>

        <UIExplorerButton onPress={this._runBackground}>
          Run background task
        </UIExplorerButton>

        <UIExplorerButton onPress={this._stopBackground}>
          Stop background task
        </UIExplorerButton>

        <Text>{this.state.message}</Text>
      </View>
    );
  }

  _run = (shouldBurnCPU) => {
    cancelIdleCallback(this._idleTimer);
    this._idleTimer = requestIdleCallback((deadline) => {
      let message = '';

      if (shouldBurnCPU) {
        burnCPU(10);
        message = 'Burned CPU for 10ms,';
      }
      this.setState({message: `${message} ${deadline.timeRemaining()}ms remaining in frame`});
    });
  };

  _runBackground = () => {
    cancelIdleCallback(this._idleTimer);
    const handler = (deadline) => {
      while (deadline.timeRemaining() > 5) {
        burnCPU(5);
        this.setState({message: `Burned CPU for 5ms ${this._iters++} times, ${deadline.timeRemaining()}ms remaining in frame`});
      }

      this._idleTimer = requestIdleCallback(handler);
    };
    this._idleTimer = requestIdleCallback(handler);
  };

  _stopBackground = () => {
    this._iters = 0;
    cancelIdleCallback(this._idleTimer);
  };
}

var TimerTester = React.createClass({
  mixins: [TimerMixin],

  _ii: 0,
  _iters: 0,
  _start: 0,
  _timerFn: (null : ?(() => any)),
  _handle: (null : any),

  render: function() {
    var args = 'fn' + (this.props.dt !== undefined ? ', ' + this.props.dt : '');
    return (
      <UIExplorerButton onPress={this._run}>
        Measure: {this.props.type}({args}) - {this._ii || 0}
      </UIExplorerButton>
    );
  },

  _run: function() {
    if (!this._start) {
      var d = new Date();
      this._start = d.getTime();
      this._iters = 100;
      this._ii = 0;
      if (this.props.type === 'setTimeout') {
        if (this.props.dt < 1) {
          this._iters = 5000;
        } else if (this.props.dt > 20) {
          this._iters = 10;
        }
        this._timerFn = () => this.setTimeout(this._run, this.props.dt);
      } else if (this.props.type === 'requestAnimationFrame') {
        this._timerFn = () => this.requestAnimationFrame(this._run);
      } else if (this.props.type === 'setImmediate') {
        this._iters = 5000;
        this._timerFn = () => this.setImmediate(this._run);
      } else if (this.props.type === 'setInterval') {
        this._iters = 30; // Only used for forceUpdate periodicidy
        this._timerFn = null;
        this._handle = this.setInterval(this._run, this.props.dt);
      }
    }
    if (this._ii >= this._iters && !this._handle) {
      var d = new Date();
      var e = (d.getTime() - this._start);
      var msg = 'Finished ' + this._ii + ' ' + this.props.type + ' calls.\n' +
        'Elapsed time: ' + e + ' ms\n' + (e / this._ii) + ' ms / iter';
      console.log(msg);
      if (Platform.OS === 'ios') {
        AlertIOS.alert(msg);
      } else if (Platform.OS === 'android') {
        ToastAndroid.show(msg, ToastAndroid.SHORT);
      }
      this._start = 0;
      this.forceUpdate(() => { this._ii = 0; });
      return;
    }
    this._ii++;
    // Only re-render occasionally so we don't slow down timers.
    if (this._ii % (this._iters / 5) === 0) {
      this.forceUpdate();
    }
    this._timerFn && this._timerFn();
  },

  clear: function() {
    this.clearInterval(this._handle); // invalid handles are ignored
    if (this._handle) {
      // Configure things so we can do a final run to update UI and reset state.
      this._handle = null;
      this._iters = this._ii;
      this._run();
    }
  },
});

exports.framework = 'React';
exports.title = 'Timers, TimerMixin';
exports.description = 'The TimerMixin provides timer functions for executing ' +
  'code in the future that are safely cleaned up when the component unmounts.';

exports.examples = [
  {
    title: 'this.setTimeout(fn, t)',
    description: 'Execute function fn t milliseconds in the future.  If ' +
      't === 0, it will be enqueued immediately in the next event loop.  ' +
      'Larger values will fire on the closest frame.',
    render: function() {
      return (
        <View>
          <TimerTester type="setTimeout" dt={0} />
          <TimerTester type="setTimeout" dt={1} />
          <TimerTester type="setTimeout" dt={100} />
        </View>
      );
    },
  },
  {
    title: 'this.requestAnimationFrame(fn)',
    description: 'Execute function fn on the next frame.',
    render: function() {
      return (
        <View>
          <TimerTester type="requestAnimationFrame" />
        </View>
      );
    },
  },
  {
    title: 'this.requestIdleCallback(fn)',
    description: 'Execute function fn on the next JS frame that has idle time',
    render: function() {
      return (
        <View>
          <RequestIdleCallbackTester />
        </View>
      );
    },
  },
  {
    title: 'this.setImmediate(fn)',
    description: 'Execute function fn at the end of the current JS event loop.',
    render: function() {
      return (
        <View>
          <TimerTester type="setImmediate" />
        </View>
      );
    },
  },
  {
    title: 'this.setInterval(fn, t)',
    description: 'Execute function fn every t milliseconds until cancelled ' +
      'or component is unmounted.',
    render: function(): React.Element<any> {
      class IntervalExample extends React.Component {
        state = {
          showTimer: true,
        };

        render() {
          return (
            <View>
              {this.state.showTimer && this._renderTimer()}
              <UIExplorerButton onPress={this._toggleTimer}>
                {this.state.showTimer ? 'Unmount timer' : 'Mount new timer'}
              </UIExplorerButton>
            </View>
          );
        }

        _renderTimer = () => {
          return (
            <View>
              <TimerTester ref="interval" dt={25} type="setInterval" />
              <UIExplorerButton onPress={() => this.refs.interval.clear() }>
                Clear interval
              </UIExplorerButton>
            </View>
          );
        };

        _toggleTimer = () => {
          this.setState({showTimer: !this.state.showTimer});
        };
      }

      return <IntervalExample />;
    },
  },
];
