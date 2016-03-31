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
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableWithoutFeedback,
} = React;

var UIExplorerBlock = require('UIExplorerBlock');
var UIExplorerPage = require('UIExplorerPage');

var ToastExample = React.createClass({

  statics: {
    title: 'Toast Example',
    description: 'Example that demonstrates the use of an Android Toast to provide feedback.',
  },

  getInitialState: function() {
    return {};
  },

  render: function() {
    return (
      <UIExplorerPage title="ToastAndroid">
        <UIExplorerBlock title="Simple toast">
          <TouchableWithoutFeedback
            onPress={() =>
              ToastAndroid.show('This is a toast with short duration', ToastAndroid.SHORT)}>
            <Text style={styles.text}>Click me.</Text>
          </TouchableWithoutFeedback>
        </UIExplorerBlock>
        <UIExplorerBlock title="Toast with long duration">
          <TouchableWithoutFeedback
            onPress={() =>
              ToastAndroid.show('This is a toast with long duration', ToastAndroid.LONG)}>
            <Text style={styles.text}>Click me too.</Text>
          </TouchableWithoutFeedback>
        </UIExplorerBlock>
      </UIExplorerPage>
    );
  },
});

var styles = StyleSheet.create({
  text: {
    color: 'black',
  },
});

module.exports = ToastExample;
