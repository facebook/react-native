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
 * @providesModule AppStateIOSExample
 * @flow
 */
'use strict';

var React = require('react');
var ReactNative = require('react-native');
var {
  AppStateIOS,
  Text,
  View
} = ReactNative;

var AppStateSubscription = React.createClass({
  getInitialState() {
    return {
      appState: AppStateIOS.currentState,
      previousAppStates: [],
      memoryWarnings: 0,
    };
  },
  componentDidMount: function() {
    AppStateIOS.addEventListener('change', this._handleAppStateChange);
    AppStateIOS.addEventListener('memoryWarning', this._handleMemoryWarning);
  },
  componentWillUnmount: function() {
    AppStateIOS.removeEventListener('change', this._handleAppStateChange);
    AppStateIOS.removeEventListener('memoryWarning', this._handleMemoryWarning);
  },
  _handleMemoryWarning: function() {
    this.setState({memoryWarnings: this.state.memoryWarnings + 1});
  },
  _handleAppStateChange: function(appState) {
    var previousAppStates = this.state.previousAppStates.slice();
    previousAppStates.push(this.state.appState);
    this.setState({
      appState,
      previousAppStates,
    });
  },
  render() {
    if (this.props.showMemoryWarnings) {
      return (
        <View>
          <Text>{this.state.memoryWarnings}</Text>
        </View>
      );
    }
    if (this.props.showCurrentOnly) {
      return (
        <View>
          <Text>{this.state.appState}</Text>
        </View>
      );
    }
    return (
      <View>
        <Text>{JSON.stringify(this.state.previousAppStates)}</Text>
      </View>
    );
  }
});

exports.title = 'AppStateIOS';
exports.description = 'iOS app background status';
exports.examples = [
  {
    title: 'AppStateIOS.currentState',
    description: 'Can be null on app initialization',
    render() { return <Text>{AppStateIOS.currentState}</Text>; }
  },
  {
    title: 'Subscribed AppStateIOS:',
    description: 'This changes according to the current state, so you can only ever see it rendered as "active"',
    render(): ReactElement<any> { return <AppStateSubscription showCurrentOnly={true} />; }
  },
  {
    title: 'Previous states:',
    render(): ReactElement<any> { return <AppStateSubscription showCurrentOnly={false} />; }
  },
  {
    title: 'Memory Warnings',
    description: 'In the simulator, hit Shift+Command+M to simulate a memory warning.',
    render(): ReactElement<any> { return <AppStateSubscription showMemoryWarnings={true} />; }
  },
];
