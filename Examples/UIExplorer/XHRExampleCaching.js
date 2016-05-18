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
  Text,
  TouchableHighlight,
  View,
  TextInput,
  } = ReactNative;

var {setCachePolicy} = require('NativeModules').HTTPRequestHandler;

class XHRExampleCaching extends React.Component {
  state: any;
  _cacheDuration: any;

  constructor(props: any) {
    super(props);
    this.state = {
      cachePolicy: 'UseProtocolCachePolicy'
    };
    this._cacheDuration = 20;
  }

  request() {
    if (!isNaN(this._cacheDuration)) {
      this.setState({responseText: ''}, () => {
        fetch(`https://httpbin.org/cache/${this._cacheDuration}`)
        .then(response => response.text())
        .then(responseText => this.setState({responseText}));
      });
    } else {
      this.setState({responseText: 'Please enter an integer for cache duration.'});
    }
  }

  renderCacheSelector(cachePolicy: string) {
    return (
      <TouchableHighlight
        style={[styles.cacheSelector, cachePolicy === this.state.cachePolicy && styles.selectedCacheSelector]}
        onPress={() => {
          setCachePolicy(cachePolicy);
          this.setState({cachePolicy, responseText: ''});
        }}>
        <Text style={{textAlign: 'center'}}>{cachePolicy}</Text>
      </TouchableHighlight>
    );
  }

  render() {
    var requestButton =
      <TouchableHighlight
        style={styles.requestButtonWrapper}
        onPress={this.request.bind(this)}>
        <View style={styles.requestButton}>
          <Text>Make Request</Text>
        </View>
      </TouchableHighlight>;

    return (
      <View>
        <Text style={styles.label}>Enter number of seconds to cache for:</Text>
        <TextInput
          returnKeyType="go"
          defaultValue={'' + this._cacheDuration}
          keyboardType="numeric"
          onChangeText={(value)=> {
            this._cacheDuration = value;
          }}
          style={styles.textInput}
          />
        <Text style={styles.label}>Select Cache Policy:</Text>
        <View style={styles.cacheSelectorWrapper}>
          {this.renderCacheSelector('UseProtocolCachePolicy')}
          {this.renderCacheSelector('ReturnCacheDataDontLoad')}
        </View>
        {requestButton}
        <Text style={styles.textResponse}>{this.state.responseText}</Text>
      </View>
    );
  }
}


var styles = StyleSheet.create({
  requestButtonWrapper: {
    borderRadius: 5,
    marginTop: 5,
    marginBottom: 5,
  },
  requestButton: {
    backgroundColor: '#eeeeee',
    padding: 8,
  },
  cacheSelectorWrapper: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  cacheSelector: {
    flex: 0.5,
  },
  selectedCacheSelector: {
    borderColor: 'black',
    borderWidth: 1,
    backgroundColor: '#eeeeee',
  },
  label: {
    flex: 1,
    color: '#aaa',
    fontWeight: '500',
    height: 20,
  },
  textInput: {
    flex: 1,
    borderRadius: 3,
    borderColor: 'grey',
    borderWidth: 1,
    height: 20,
    paddingLeft: 8,
    marginBottom: 5,
  },
  textResponse: {
    flex: 1,
    fontSize: 12,
    borderRadius: 3,
    borderColor: 'grey',
    borderWidth: 1,
    height: 210,
    paddingLeft: 8,
  },
});

module.exports = XHRExampleCaching;
