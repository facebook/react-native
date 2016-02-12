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
  Notification,
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
  _last: null,

  render: function() {
    return (
      <View>
        <TouchableHighlight style={styles.wrapper}
          onPress={() => this._last = Notification.presentLocalNotification({
            title: 'Notification with title',
          })}>
          <View style={styles.button}>
            <Text>Notification with title</Text>
          </View>
        </TouchableHighlight>
        <TouchableHighlight style={styles.wrapper}
          onPress={() => this._last = Notification.presentLocalNotification({
            title: 'Notification with title, body and count',
            body: 'Notification body with some text',
            count: 3
          })}>
          <View style={styles.button}>
            <Text>Notification with title, body and count</Text>
          </View>
        </TouchableHighlight>
        <TouchableHighlight style={styles.wrapper}
          onPress={() => this._last = Notification.presentLocalNotification({
            title: 'Sticky Notification',
            body: 'You cannot dismiss this',
            sticky: true
          })}>
          <View style={styles.button}>
            <Text>Sticky Notification</Text>
          </View>
        </TouchableHighlight>
        <TouchableHighlight style={styles.wrapper}
          onPress={() => Notification.cancelLocalNotification(this._last)}>
          <View style={styles.button}>
            <Text>Close the last notification</Text>
          </View>
        </TouchableHighlight>
        <TouchableHighlight style={styles.wrapper}
          onPress={() => Notification.cancelAllLocalNotifications()}>
          <View style={styles.button}>
            <Text>Close all notifications</Text>
          </View>
        </TouchableHighlight>
      </View>
    );
  },
});

var NotificationExample = React.createClass({
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

NotificationExample.title = 'Notification';
NotificationExample.description = 'Local notifications';

module.exports = NotificationExample;
