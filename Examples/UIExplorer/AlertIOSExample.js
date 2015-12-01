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
  TouchableHighlight,
  AlertIOS,
} = React;

exports.framework = 'React';
exports.title = 'AlertIOS';
exports.description = 'iOS alerts and action sheets';
exports.examples = [{
  title: 'Alerts',
  render() {
    return (
      <View>
        <TouchableHighlight style={styles.wrapper}
          onPress={() => AlertIOS.alert(
            'Foo Title',
            'My Alert Msg'
          )}>
          <View style={styles.button}>
            <Text>Alert with message and default button</Text>
          </View>
        </TouchableHighlight>
        <TouchableHighlight style={styles.wrapper}
          onPress={() => AlertIOS.alert(
            'Foo Title',
            null,
            [
              {text: 'Button', onPress: () => console.log('Button Pressed!')},
            ]
          )}>
          <View style={styles.button}>
            <Text>Alert with only one button</Text>
          </View>
        </TouchableHighlight>
        <TouchableHighlight style={styles.wrapper}
          onPress={() => AlertIOS.alert(
            'Foo Title',
            'My Alert Msg',
            [
              {text: 'Foo', onPress: () => console.log('Foo Pressed!')},
              {text: 'Bar', onPress: () => console.log('Bar Pressed!')},
            ]
          )}>
          <View style={styles.button}>
            <Text>Alert with two buttons</Text>
          </View>
        </TouchableHighlight>
        <TouchableHighlight style={styles.wrapper}
          onPress={() => AlertIOS.alert(
            'Foo Title',
            null,
            [
              {text: 'Foo', onPress: () => console.log('Foo Pressed!')},
              {text: 'Bar', onPress: () => console.log('Bar Pressed!')},
              {text: 'Baz', onPress: () => console.log('Baz Pressed!')},
            ]
          )}>
          <View style={styles.button}>
            <Text>Alert with 3 buttons</Text>
          </View>
        </TouchableHighlight>
        <TouchableHighlight style={styles.wrapper}
          onPress={() => AlertIOS.alert(
            'Foo Title',
            'My Alert Msg',
            '..............'.split('').map((dot, index) => ({
              text: 'Button ' + index,
              onPress: () => console.log('Pressed ' + index)
            }))
          )}>
          <View style={styles.button}>
            <Text>Alert with too many buttons</Text>
          </View>
        </TouchableHighlight>
      </View>
    );
  }
},
{
  title: 'Alert Types',
  render() {
    return (
      <View>
        <TouchableHighlight
          style={styles.wrapper}
          onPress={() => AlertIOS.alert(
            'Hello World',
            null,
            [
              {text: 'OK', onPress: (text) => console.log('OK pressed')},
            ],
            'default'
          )}>

          <View style={styles.button}>
            <Text>
              {'default'}
            </Text>
          </View>
          
        </TouchableHighlight>
        <TouchableHighlight
          style={styles.wrapper}
          onPress={() => AlertIOS.alert(
            'Plain Text Entry',
            null,
            [
              {text: 'Submit', onPress: (text) => console.log('Text: ' + text)},
            ],
            'plain-text'
          )}>

          <View style={styles.button}>
            <Text>
              plain-text
            </Text>
          </View>
          
        </TouchableHighlight>
        <TouchableHighlight
          style={styles.wrapper}
          onPress={() => AlertIOS.alert(
            'Secure Text Entry',
            null,
            [
              {text: 'Submit', onPress: (text) => console.log('Password: ' + text)},
            ],
            'secure-text'
          )}>

          <View style={styles.button}>
            <Text>
              secure-text
            </Text>
          </View>
          
        </TouchableHighlight>
        <TouchableHighlight
          style={styles.wrapper}
          onPress={() => AlertIOS.alert(
            'Login & Password',
            null,
            [
              {text: 'Submit', onPress: (details) => console.log('Login: ' + details.login + '; Password: ' + details.password)},
            ],
            'login-password'
          )}>

          <View style={styles.button}>
            <Text>
              login-password
            </Text>
          </View>
          
        </TouchableHighlight>
      </View>
    );
  }
},
{
  title: 'Prompt',
  render(): React.Component {
    return <PromptExample />
  }
}];

class PromptExample extends React.Component {
  constructor(props) {
    super(props);

    this.promptResponse = this.promptResponse.bind(this);
    this.state = {
      promptValue: undefined,
    };

    this.title = 'Type a value';
    this.defaultValue = 'Default value';
    this.buttons = [{
      text: 'Custom OK',
      onPress: this.promptResponse
    }, {
      text: 'Custom Cancel',
      style: 'cancel',
    }];
  }

  render() {
    return (
      <View>
        <Text style={{marginBottom: 10}}>
          <Text style={{fontWeight: 'bold'}}>Prompt value:</Text> {this.state.promptValue}
        </Text>

        <TouchableHighlight
          style={styles.wrapper}
          onPress={this.prompt.bind(this, this.title, null, null, this.promptResponse)}>

          <View style={styles.button}>
            <Text>
              prompt with title & callback
            </Text>
          </View>
        </TouchableHighlight>

        <TouchableHighlight
          style={styles.wrapper}
          onPress={this.prompt.bind(this, this.title, null, this.buttons, null)}>

          <View style={styles.button}>
            <Text>
              prompt with title & custom buttons
            </Text>
          </View>
        </TouchableHighlight>

        <TouchableHighlight
          style={styles.wrapper}
          onPress={this.prompt.bind(this, this.title, this.defaultValue, null, this.promptResponse)}>

          <View style={styles.button}>
            <Text>
              prompt with title, default value & callback
            </Text>
          </View>
        </TouchableHighlight>

        <TouchableHighlight
          style={styles.wrapper}
          onPress={this.prompt.bind(this, this.title, this.defaultValue, this.buttons, null)}>

          <View style={styles.button}>
            <Text>
              prompt with title, default value & custom buttons
            </Text>
          </View>
        </TouchableHighlight>
      </View>
    );
  }

  prompt() {
    // Flow's apply support is broken: #7035621
    ((AlertIOS.prompt: any).apply: any)(AlertIOS, arguments);
  }

  promptResponse(promptValue) {
    this.setState({ promptValue });
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
