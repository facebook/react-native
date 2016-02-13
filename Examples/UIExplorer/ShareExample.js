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
  View,
  Text,
  TextInput,
  TouchableHighlight,
  Share,
} = React;

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

  constructor(props) {
    super(props);

    this.shareMessage = this.shareMessage.bind(this);
    this.shareTextContent = this.shareTextContent.bind(this);

    this.state = {
      result: ''
    };
  }

  render() {
    return (
      <View>
        <TouchableHighlight style={styles.wrapper}
          onPress={this.shareMessage}>
          <View style={styles.button}>
            <Text>Click to share message</Text>
          </View>
        </TouchableHighlight>
        <TouchableHighlight style={styles.wrapper}
          onPress={this.shareTextContent}>
          <View style={styles.button}>
            <Text>Click to share message, URL and subject</Text>
          </View>
        </TouchableHighlight>
        <Text>{this.state.result}</Text>
      </View>
    );
  }

  shareMessage() {
    Share.shareTextContent({
      message: 'React Native | A framework for building native apps using React'
    })
    .then((result) => {
      if(!result) {
        this.setState({result:'Canceled'})
      } else {
        this.setState({result:result})
      }
    })
    .catch((err) => console.error(err))
  }
  shareTextContent() {
    Share.shareTextContent({
      message: 'A framework for building native apps using React', 
      url: 'http://facebook.github.io/react-native/',
      subject: 'React Native'
    }, {
      dialogTitle: 'Share React Native website',
      excludedActivityTypes: [
        'com.apple.UIKit.activity.PostToTwitter'
      ]
    })
    .then((result) => this.setState({result:result}))
    .catch(()=> this.setState({result:'Canceled'}))
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
