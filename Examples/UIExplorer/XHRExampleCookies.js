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
  TouchableHighlight,
  View,
} = React;

class XHRExampleCookies extends React.Component {

  xhr: XMLHttpRequest;
  cancelled: boolean;

  constructor(props: any) {
    super(props);
    this.cancelled = false;
    this.state = {
      status: '',
      cookies: '',
      downloaded: 0,
    };
  }

  download() {
    this.xhr && this.xhr.abort();

    var xhr = this.xhr || new XMLHttpRequest();
    xhr.onreadystatechange = () => {
      if (xhr.readyState === xhr.DONE) {
        if (this.cancelled) {
          this.cancelled = false;
          return;
        }
        if (xhr.status === 200) {
          this.setState({
            status: 'Download complete!',
            cookies: xhr.responseText
          });
        } else if (xhr.status !== 0) {
          this.setState({
            status: 'Error: Server returned HTTP status of ' + xhr.status + ' ' + xhr.responseText,
          });
        } else {
          this.setState({
            status: 'Error: ' + xhr.responseText,
          });
        }
      }
    };
    xhr.open('GET', 'https://httpbin.org/cookies/set?k2=v2&k1=v1');
    xhr.send();
    this.xhr = xhr;

    this.setState({status: 'Downloading...'});
  }

  componentWillUnmount() {
    this.cancelled = true;
    this.xhr && this.xhr.abort();
  }

  render() {
    var button = this.state.status === 'Downloading...' ? (
      <View style={styles.wrapper}>
        <View style={styles.button}>
          <Text>...</Text>
        </View>
      </View>
    ) : (
      <TouchableHighlight
        style={styles.wrapper}
        onPress={this.download.bind(this)}>
        <View style={styles.button}>
         <Text>Get cookies</Text>
        </View>
      </TouchableHighlight>
    );

    return (
      <View>
        {button}
        <Text>{this.state.cookies}</Text>
      </View>
    );
  }
}

var styles = StyleSheet.create({
  wrapper: {
    borderRadius: 5,
    marginBottom: 5,
  },
  button: {
    backgroundColor: '#eeeeee',
    padding: 8,
  },
});

module.exports = XHRExampleCookies;
