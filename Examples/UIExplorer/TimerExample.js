/**
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
 */
'use strict';

var React = require('react-native');
var {
  AlertIOS,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} = React;
var TimerMixin = require('react-timer-mixin');

var Button = React.createClass({
  render: function() {
    return (
      <TouchableHighlight
        onPress={this.props.onPress}
        style={styles.button}
        underlayColor="#eeeeee">
        <Text>
          {this.props.children}
        </Text>
      </TouchableHighlight>
    );
  },
});

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
      <Button onPress={this._run}>
        Measure: {this.props.type}({args}) - {this._ii || 0}
      </Button>
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
      AlertIOS.alert(msg);
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

var styles = StyleSheet.create({
  button: {
    borderColor: 'gray',
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    margin: 5,
    alignItems: 'center',
    justifyContent: 'center',
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
    render: function(): ReactElement {
      var IntervalExample = React.createClass({
        getInitialState: function() {
          return {
            showTimer: true,
          };
        },

        render: function() {
          if (this.state.showTimer) {
            var timer =
              <TimerTester ref="interval" dt={25} type="setInterval" />;
            var toggleText = 'Unmount timer';
          } else {
            var timer = null;
            var toggleText = 'Mount new timer';
          }
          return (
            <View>
              {timer}
              <Button onPress={() => this.refs.interval.clear() }>
                Clear interval
              </Button>
              <Button onPress={this._toggleTimer}>
                {toggleText}
              </Button>
            </View>
          );
        },

        _toggleTimer: function() {
          this.setState({showTimer: !this.state.showTimer});
        },
      });
      return <IntervalExample />;
    },
  },
];
