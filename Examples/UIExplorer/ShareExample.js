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
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableHighlight,
  Share,
} = ReactNative;

exports.framework = 'React';
exports.title = 'Share';
exports.description = 'Share data with other Apps.';
exports.examples = [{
  title: 'Share Text Content',
  render() {
    return <ShareMessageExample />;
  }
}];

class ShareMessageExample extends React.Component {
  _shareMessage: Function;
  _shareText: Function;
  state: any;

  constructor(props) {
    super(props);

    this._shareMessage = this._shareMessage.bind(this);
    this._shareText = this._shareText.bind(this);

    this.state = {
      result: ''
    };
  }

  render() {
    return (
      <View>
        <TouchableHighlight style={styles.wrapper}
          onPress={this._shareMessage}>
          <View style={styles.button}>
            <Text>Click to share message</Text>
          </View>
        </TouchableHighlight>
        <TouchableHighlight style={styles.wrapper}
          onPress={this._shareText}>
          <View style={styles.button}>
            <Text>Click to share message, URL and title</Text>
          </View>
        </TouchableHighlight>
        <Text>{this.state.result}</Text>
      </View>
    );
  }

  _shareMessage() {
    Share.share({
      message: 'React Native | A framework for building native apps using React'
    })
    .then((result) => {
      if(result && result.activityType) {
        this.setState({result: 'success: shared with ' + result.activityType})
      } else {
        this.setState({result: 'success'})
      }
    })
    .catch((error) => this.setState({result: 'error: ' + error.message}))
  }

  _shareText() {
    Share.share({
      message: 'A framework for building native apps using React', 
      url: 'http://facebook.github.io/react-native/',
      title: 'React Native'
    }, {
      dialogTitle: 'Share React Native website',
      excludedActivityTypes: [
        'com.apple.UIKit.activity.PostToTwitter'
      ],
      tintColor: 'green'
    })
    .then((result) => {
      if(result && result.activityType) {
        this.setState({result: 'success: shared with ' + result.activityType})
      } else {
        this.setState({result: 'success'})
      }
    })
    .catch((error) => this.setState({result: 'error: ' + error.message}))
  }

}


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
