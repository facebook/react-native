/**
 * The examples provided by Facebook are for non-commercial testing and
 * evaluation purposes only.
 *
 * Facebook reserves all rights not expressly granted.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS
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
  ApplicationShortcutsIOS,
  Text,
  View,
} = React;

var SHORTCUTS = [
  {
    type: 'ApplicationShortcutsExample',
    title: 'Application Shortcuts Example'
  },
  {
    type: 'ActionSheetExample',
    title: 'Action Sheet Example',
    subtitle: 'An another example'
  }
]

var ApplicationShortcutsExample = React.createClass({
  componentWillMount() {
    ApplicationShortcutsIOS.setApplicationShortcutsWithList(SHORTCUTS);
    this.state = {
      shortcutType: ApplicationShortcutsIOS.popShortcutType()
    };
  },

  render() {
    return (
      <View>
        <Text>
          Return to your home screen and hard press on the app icon (6s only).
        </Text>
        {this.state.shortcutType ?
          <Text>
            You opened the app with a shorcut with type:
            {this.state.shortcutType}
          </Text> : null}
      </View>
    );
  }
});

exports.title = 'ApplicationShortcutsIOS';
exports.description = 'Dynamic 3d touch App Shortcuts';
exports.examples = [
  {
    title: 'Quick Actions',
    render(): ReactElement { return <ApplicationShortcutsExample />; }
  }
];
