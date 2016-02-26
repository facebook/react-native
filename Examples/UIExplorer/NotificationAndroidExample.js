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
  NotificationAndroid,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} = React;

var UIExplorerBlock = require('./UIExplorerBlock');

/**
 * Simple Notification examples.
 */
var SimpleNotificationExampleBlock = React.createClass({
  _last: [],

  render: function() {
    return (
      <View>
        <TouchableHighlight style={styles.wrapper}
          onPress={() => this._last.push(NotificationAndroid.show({ title: 'Notification with title' }))}>
          <View style={styles.button}>
            <Text>Notification with title</Text>
          </View>
        </TouchableHighlight>
        <TouchableHighlight style={styles.wrapper}
          onPress={() => this._last.push(NotificationAndroid.show({
            title: 'Notification with TAG',
            body: 'This will not replace the previous notification',
            tag: 'notification_with_tag',
          }))}>
          <View style={styles.button}>
            <Text>Notification with TAG</Text>
          </View>
        </TouchableHighlight>
        <TouchableHighlight style={styles.wrapper}
          onPress={() => this._last.push(NotificationAndroid.show({
            title: 'Notification with body and count and vibration',
            body: 'Notification body with some text',
            vibrate: [200, 100, 200],
            count: 3,
          }))}>
          <View style={styles.button}>
            <Text>Notification with body and count and vibration</Text>
          </View>
        </TouchableHighlight>
        <TouchableHighlight style={styles.wrapper}
          onPress={() => this._last.push(NotificationAndroid.show({
            title: 'Notification with link',
            body: 'This will open a link on tapping',
            link: 'http://facebook.github.io/react-native/',
          }))}>
          <View style={styles.button}>
            <Text>Notification with link</Text>
          </View>
        </TouchableHighlight>
        <TouchableHighlight style={styles.wrapper}
          onPress={() => this._last.push(NotificationAndroid.show({
            title: 'High Priority Notification',
            body: 'This will show a heads-up notification',
            priority: 'high',
          }))}>
          <View style={styles.button}>
            <Text>High Priority Notification</Text>
          </View>
        </TouchableHighlight>
        <TouchableHighlight style={styles.wrapper}
          onPress={() => this._last.push(NotificationAndroid.show({
            title: 'Silent Notification',
            body: 'This will not issue any sounds or vibrations',
            silent: true,
          }))}>
          <View style={styles.button}>
            <Text>Silent Notification</Text>
          </View>
        </TouchableHighlight>
        <TouchableHighlight style={styles.wrapper}
          onPress={() => this._last.push(NotificationAndroid.show({
            title: 'Sticky Notification',
            body: 'You cannot dismiss this',
            sticky: true,
          }))}>
          <View style={styles.button}>
            <Text>Sticky Notification</Text>
          </View>
        </TouchableHighlight>
        <TouchableHighlight style={styles.wrapper}
          onPress={() => {
            const n = this._last.pop();
            n && n.dismiss();
          }}>
          <View style={styles.button}>
            <Text>Dismiss the last notification</Text>
          </View>
        </TouchableHighlight>
        <TouchableHighlight style={styles.wrapper}
          onPress={() => NotificationAndroid.dismissAll()}>
          <View style={styles.button}>
            <Text>Dismiss all notifications</Text>
          </View>
        </TouchableHighlight>
      </View>
    );
  },
});

var NotificationAndroidExample = React.createClass({
  render: function() {
    return (
      <UIExplorerBlock title={'Notification'}>
        <SimpleNotificationExampleBlock />
      </UIExplorerBlock>
    );
  }
});

var styles = StyleSheet.create({
  wrapper: {
    borderRadius: 5,
    marginBottom: 5,
  },
  button: {
    backgroundColor: '#eeeeee',
    padding: 10,
  },
});

NotificationAndroidExample.title = 'NotificationAndroid';
NotificationAndroidExample.description = 'Manage statusbar notifications on Android';

module.exports = NotificationAndroidExample;
