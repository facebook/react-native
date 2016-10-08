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
 * @providesModule TextUpdateTest
 * @flow
 */
'use strict';

var React = require('react');
var ReactNative = require('react-native');
var TimerMixin = require('react-timer-mixin');
var {
  NativeModules,
  StyleSheet,
  Text,
} = ReactNative;

var TestManager = NativeModules.TestManager || NativeModules.SnapshotTestManager;

var TextUpdateTest = React.createClass({
  mixins: [TimerMixin],
  getInitialState: function() {
    return {seeMore: true};
  },
  componentDidMount: function() {
    this.requestAnimationFrame(
      () => this.setState(
        {seeMore: false},
        TestManager.markTestCompleted
      )
    );
  },
  render: function() {
    return (
      <Text
        style={styles.container}
        onPress={() => this.setState({seeMore: !this.state.seeMore})}>
        <Text>Tap to see more (bugs)...</Text>
        {this.state.seeMore && 'raw text'}
      </Text>
    );
  },
});

var styles = StyleSheet.create({
  container: {
    margin: 10,
    marginTop: 100,
  },
});

module.exports = TextUpdateTest;
