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

var React = require('react');
var ReactNative = require('react-native');
var {
  Text,
  View,
} = ReactNative;

var AccessibilityIOSExample = React.createClass({
  render() {
    return (
      <View>
        <View
          onAccessibilityTap={() => alert('onAccessibilityTap success')}
          accessible={true}>
          <Text>
            Accessibility normal tap example
          </Text>
        </View>
        <View onMagicTap={() => alert('onMagicTap success')}
              accessible={true}>
          <Text>
            Accessibility magic tap example
          </Text>
        </View>
        <View accessibilityLabel="Some announcement"
              accessible={true}>
          <Text>
            Accessibility label example
          </Text>
        </View>
        <View accessibilityTraits={['button', 'selected']}
              accessible={true}>
          <Text>
            Accessibility traits example
          </Text>
        </View>
      </View>
    );
  },
});

exports.title = 'AccessibilityIOS';
exports.description = 'Interface to show iOS\' accessibility samples';
exports.examples = [
  {
    title: 'Accessibility elements',
    render(): ReactElement { return <AccessibilityIOSExample />; }
  },
];
