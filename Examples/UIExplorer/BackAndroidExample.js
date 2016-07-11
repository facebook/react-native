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
 */

'use strict';

var React = require('react-native');
var {
  Text,
  View,
  BackAndroid,
} = React;

var BackAndroidExample = React.createClass({

  getInitialState: function() {
    return {
      defaultBackHandler: false
    };
  },

  componentDidMount: function() {
    BackAndroid.addEventListener('hardwareBackPress', this._handleBackButton);
  },

  componentWillUnmount: function() {
    BackAndroid.removeEventListener('hardwareBackPress', this._handleBackButton);
  },

  _handleBackButton: function() {
    if (!this.state.defaultBackHandler) {
      this.setState({defaultBackHandler: true});
      return true;
    }

    return false;
  },

  render: function() {
    return (
      <View>
        <Text>{this.state.defaultBackHandler ? 'Ok, I\'ll quit.' : 'I won\'t quit.'}</Text>
      </View>
    );
  },
});

exports.title = 'BackAndroid';
exports.description = 'Custom back button handler';
exports.examples = [
  {
    title: 'Custom back button handler',
    render(): ReactElement { return <BackAndroidExample />; }
  }
];
