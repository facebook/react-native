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
  Modal,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} = React;

exports.displayName = (undefined: ?string);
exports.framework = 'React';
exports.title = '<Modal>';
exports.description = 'Component for presenting modal views.';

var ModalExample = React.createClass({
  getInitialState: function() {
    return {
      openModal: null,
    };
  },

  _closeModal: function() {
    this.setState({openModal: null});
  },

  _openAnimatedModal: function() {
    this.setState({openModal: 'animated'});
  },

  _openNotAnimatedModal: function() {
    this.setState({openModal: 'not-animated'});
  },

  render: function() {
    return (
      <View>
        <Modal animated={true} visible={this.state.openModal === 'animated'}>
          <View style={styles.container}>
            <Text>This modal was presented with animation.</Text>
            <TouchableHighlight underlayColor="#a9d9d4" onPress={this._closeModal}>
              <Text>Close</Text>
            </TouchableHighlight>
          </View>
        </Modal>

        <Modal visible={this.state.openModal === 'not-animated'}>
          <View style={styles.container}>
            <Text>This modal was presented immediately, without animation.</Text>
            <TouchableHighlight underlayColor="#a9d9d4" onPress={this._closeModal}>
              <Text>Close</Text>
            </TouchableHighlight>
          </View>
        </Modal>

        <TouchableHighlight underlayColor="#a9d9d4" onPress={this._openAnimatedModal}>
          <Text>Present Animated</Text>
        </TouchableHighlight>

        <TouchableHighlight underlayColor="#a9d9d4" onPress={this._openNotAnimatedModal}>
          <Text>Present Without Animation</Text>
        </TouchableHighlight>
      </View>
    );
  },
});

exports.examples = [
  {
    title: 'Modal Presentation',
    description: 'Modals can be presented with or without animation',
    render: () => <ModalExample />,
  },
];

var styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#f5fcff',
    flex: 1,
    justifyContent: 'center',
  },
});
