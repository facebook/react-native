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
  TextInput,
  View,
  Platform,
} = React;


class XHRExampleFetch extends React.Component {
  state: any;
  responseURL: ?string;

  constructor(props: any) {
    super(props);
    this.state = {
     responseText: null,
    };
    this.responseURL = null;
  }

  submit(uri: String) {
    fetch(uri).then((response) => {
      this.responseURL = response.url;
      return response.text();
    }).then((body) => {
      this.setState({responseText: body});
    });
  }

  render() {

    var responseURL = this.responseURL ? (
      <View style={{marginTop: 10}}>
        <Text style={styles.label}>Server response URL:</Text>
        <Text>{this.responseURL}</Text>
      </View>
    ) : null;

    var response = this.state.responseText ? (
      <View style={{marginTop: 10}}>
        <Text style={styles.label}>Server response:</Text>
        <TextInput
          editable={false}
          multiline={true}
          defaultValue={this.state.responseText}
          style={styles.textOutput}
        />
      </View>
    ) : null;

    return (
      <View>
        <Text style={styles.label}>Edit URL to submit:</Text>
        <TextInput
          returnKeyType="go"
          defaultValue="http://www.posttestserver.com/post.php"
          onSubmitEditing={(event)=> {
            this.submit(event.nativeEvent.text);
          }}
          style={styles.textInput}
        />
        {responseURL}
        {response}
      </View>
    );
  }
}

var styles = StyleSheet.create({
  textInput: {
    flex: 1,
    borderRadius: 3,
    borderColor: 'grey',
    borderWidth: 1,
    height: Platform.OS === 'android' ? 44 : 30,
    paddingLeft: 8,
  },
  label: {
    flex: 1,
    color: '#aaa',
    fontWeight: '500',
    height: 20,
  },
  textOutput: {
    flex: 1,
    fontSize: 17,
    borderRadius: 3,
    borderColor: 'grey',
    borderWidth: 1,
    height: 200,
    paddingLeft: 8,
  },
});

module.exports = XHRExampleFetch;
