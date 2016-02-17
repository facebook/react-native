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

const React = require('react-native');
const {
  StyleSheet,
  View,
  Text,
  TouchableHighlight,
  StatusBar,
} = React;

type BarStyle = 'default' | 'light-content';
type ShowHideTransition = 'fade' | 'slide';

type State = {
  animated: boolean,
  backgroundColor: string,
  hidden?: boolean,
  showHideTransition: ShowHideTransition,
  translucent?: boolean,
  barStyle?: BarStyle,
  networkActivityIndicatorVisible?: boolean
};

exports.framework = 'React';
exports.title = '<StatusBar>';
exports.description = 'Component for controlling the status bar';

const colors = [
  '#ff0000',
  '#00ff00',
  '#0000ff',
];

const barStyles = [
  'default',
  'light-content',
];

const showHideTransitions = [
  'fade',
  'slide',
];

function getValue(values: Array<any>, index: number): any {
  return values[index % values.length];
}

const StatusBarExample = React.createClass({
  getInitialState(): State {
    return {
      animated: true,
      backgroundColor: getValue(colors, 0),
      showHideTransition: getValue(showHideTransitions, 0),
    };
  },

  _colorIndex: 0,
  _barStyleIndex: 0,
  _showHideTransitionIndex: 0,

  render() {
    return (
      <View>
        <StatusBar
          backgroundColor={this.state.backgroundColor}
          translucent={this.state.translucent}
          hidden={this.state.hidden}
          showHideTransition={this.state.showHideTransition}
          animated={this.state.animated}
          barStyle={this.state.barStyle}
          networkActivityIndicatorVisible={this.state.networkActivityIndicatorVisible}
        />
        <View>
          <TouchableHighlight
            style={styles.wrapper}
            onPress={() => this.setState({animated: !this.state.animated})}>
            <View style={styles.button}>
              <Text>animated: {this.state.animated ? 'true' : 'false'}</Text>
            </View>
          </TouchableHighlight>
        </View>
        <View>
          <TouchableHighlight
            style={styles.wrapper}
            onPress={() => this.setState({hidden: !this.state.hidden})}>
            <View style={styles.button}>
              <Text>hidden: {this.state.hidden ? 'true' : 'false'}</Text>
            </View>
          </TouchableHighlight>
        </View>
        <Text style={styles.title}>iOS</Text>
        <View>
          <TouchableHighlight
            style={styles.wrapper}
            onPress={() => {
              this._barStyleIndex++;
              this.setState({barStyle: getValue(barStyles, this._barStyleIndex)});
            }}>
            <View style={styles.button}>
              <Text>style: '{getValue(barStyles, this._barStyleIndex)}'</Text>
            </View>
          </TouchableHighlight>
        </View>
        <View>
          <TouchableHighlight
            style={styles.wrapper}
            onPress={() => this.setState({
              networkActivityIndicatorVisible: !this.state.networkActivityIndicatorVisible,
            })}>
            <View style={styles.button}>
              <Text>
                networkActivityIndicatorVisible:
                {this.state.networkActivityIndicatorVisible ? 'true' : 'false'}
              </Text>
            </View>
          </TouchableHighlight>
        </View>
        <View>
          <TouchableHighlight
            style={styles.wrapper}
            onPress={() => {
              this._showHideTransitionIndex++;
              this.setState({
                showHideTransition:
                getValue(showHideTransitions, this._showHideTransitionIndex),
              });
            }}>
            <View style={styles.button}>
              <Text>
                showHideTransition:
                '{getValue(showHideTransitions, this._showHideTransitionIndex)}'
              </Text>
            </View>
          </TouchableHighlight>
        </View>
        <Text style={styles.title}>Android</Text>
        <View>
          <TouchableHighlight
            style={styles.wrapper}
            onPress={() => {
              this._colorIndex++;
              this.setState({backgroundColor: getValue(colors, this._colorIndex)});
            }}>
            <View style={styles.button}>
              <Text>backgroundColor: '{getValue(colors, this._colorIndex)}'</Text>
            </View>
          </TouchableHighlight>
        </View>
        <View>
          <TouchableHighlight
            style={styles.wrapper}
            onPress={() => {
              this.setState({
                translucent: !this.state.translucent,
                backgroundColor: !this.state.translucent ? 'rgba(0, 0, 0, 0.4)' : 'black',
              });
            }}>
            <View style={styles.button}>
              <Text>translucent: {this.state.translucent ? 'true' : 'false'}</Text>
            </View>
          </TouchableHighlight>
        </View>
      </View>
    );
  },
});

const StatusBarStaticExample = React.createClass({
  _colorIndex: 0,
  _barStyleIndex: 0,
  _showHideTransitionIndex: 0,

  getInitialState() {
    return {
      backgroundColor: getValue(colors, 0),
      barStyle: getValue(barStyles, 0),
      hidden: false,
      networkActivityIndicatorVisible: false,
      translucent: false,
    };
  },

  render() {
    return (
      <View>
        <View>
          <TouchableHighlight
            style={styles.wrapper}
            onPress={() => {
              const hidden = !this.state.hidden;
              StatusBar.setHidden(hidden, 'slide');
              this.setState({hidden});
            }}>
            <View style={styles.button}>
              <Text>hidden: {this.state.hidden ? 'true' : 'false'}</Text>
            </View>
          </TouchableHighlight>
        </View>
        <Text style={styles.title}>iOS</Text>
        <View>
          <TouchableHighlight
            style={styles.wrapper}
            onPress={() => {
              this._barStyleIndex++;
              const barStyle = getValue(barStyles, this._barStyleIndex);
              StatusBar.setBarStyle(barStyle, true);
              this.setState({barStyle});
            }}>
            <View style={styles.button}>
              <Text>style: '{getValue(barStyles, this._barStyleIndex)}'</Text>
            </View>
          </TouchableHighlight>
        </View>
        <View>
          <TouchableHighlight
            style={styles.wrapper}
            onPress={() => {
              const networkActivityIndicatorVisible = !this.state.networkActivityIndicatorVisible;
              StatusBar.setNetworkActivityIndicatorVisible(networkActivityIndicatorVisible);
              this.setState({networkActivityIndicatorVisible});
            }}>
            <View style={styles.button}>
              <Text>
                networkActivityIndicatorVisible:
                {this.state.networkActivityIndicatorVisible ? 'true' : 'false'}
              </Text>
            </View>
          </TouchableHighlight>
        </View>
        <Text style={styles.title}>Android</Text>
        <View>
          <TouchableHighlight
            style={styles.wrapper}
            onPress={() => {
              this._colorIndex++;
              const backgroundColor = getValue(colors, this._colorIndex);
              StatusBar.setBackgroundColor(backgroundColor, true);
              this.setState({backgroundColor});
            }}>
            <View style={styles.button}>
              <Text>backgroundColor: '{getValue(colors, this._colorIndex)}'</Text>
            </View>
          </TouchableHighlight>
        </View>
        <View>
          <TouchableHighlight
            style={styles.wrapper}
            onPress={() => {
              const translucent = !this.state.translucent;
              const backgroundColor = !this.state.translucent ? 'rgba(0, 0, 0, 0.4)' : 'black';
              StatusBar.setTranslucent(translucent);
              StatusBar.setBackgroundColor(backgroundColor, true);
              this.setState({
                translucent,
                backgroundColor,
              });
            }}>
            <View style={styles.button}>
              <Text>translucent: {this.state.translucent ? 'true' : 'false'}</Text>
            </View>
          </TouchableHighlight>
        </View>
      </View>
    );
  },
});

exports.examples = [{
  title: 'StatusBar',
  render() {
    return <StatusBarExample />;
  },
}, {
  title: 'StatusBar static API',
  render() {
    return <StatusBarStaticExample />;
  },
}];

var styles = StyleSheet.create({
  wrapper: {
    borderRadius: 5,
    marginBottom: 5,
  },
  button: {
    borderRadius: 5,
    backgroundColor: '#eeeeee',
    padding: 10,
  },
  title: {
    marginTop: 16,
    marginBottom: 8,
    fontWeight: 'bold',
  }
});
