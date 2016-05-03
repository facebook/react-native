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

const React = require('react');
const ReactNative = require('react-native');
const {
  NetInfo,
  Text,
  View,
  TouchableWithoutFeedback,
} = ReactNative;

const ConnectionInfoSubscription = React.createClass({
  getInitialState() {
    return {
      connectionInfoHistory: [],
    };
  },
  componentDidMount: function() {
    NetInfo.addEventListener(
        'change',
        this._handleConnectionInfoChange
    );
  },
  componentWillUnmount: function() {
    NetInfo.removeEventListener(
        'change',
        this._handleConnectionInfoChange
    );
  },
  _handleConnectionInfoChange: function(connectionInfo) {
    const connectionInfoHistory = this.state.connectionInfoHistory.slice();
    connectionInfoHistory.push(connectionInfo);
    this.setState({
      connectionInfoHistory,
    });
  },
  render() {
    return (
        <View>
          <Text>{JSON.stringify(this.state.connectionInfoHistory)}</Text>
        </View>
    );
  }
});

const ConnectionInfoCurrent = React.createClass({
  getInitialState() {
    return {
      connectionInfo: null,
    };
  },
  componentDidMount: function() {
    NetInfo.addEventListener(
        'change',
        this._handleConnectionInfoChange
    );
    NetInfo.fetch().done(
        (connectionInfo) => { this.setState({connectionInfo}); }
    );
  },
  componentWillUnmount: function() {
    NetInfo.removeEventListener(
        'change',
        this._handleConnectionInfoChange
    );
  },
  _handleConnectionInfoChange: function(connectionInfo) {
    this.setState({
      connectionInfo,
    });
  },
  render() {
    return (
        <View>
          <Text>{this.state.connectionInfo}</Text>
        </View>
    );
  }
});

const IsConnected = React.createClass({
  getInitialState() {
    return {
      isConnected: null,
    };
  },
  componentDidMount: function() {
    NetInfo.isConnected.addEventListener(
        'change',
        this._handleConnectivityChange
    );
    NetInfo.isConnected.fetch().done(
        (isConnected) => { this.setState({isConnected}); }
    );
  },
  componentWillUnmount: function() {
    NetInfo.isConnected.removeEventListener(
        'change',
        this._handleConnectivityChange
    );
  },
  _handleConnectivityChange: function(isConnected) {
    this.setState({
      isConnected,
    });
  },
  render() {
    return (
        <View>
          <Text>{this.state.isConnected ? 'Online' : 'Offline'}</Text>
        </View>
    );
  }
});

const IsConnectionExpensive = React.createClass({
  getInitialState() {
    return {
      isConnectionExpensive: (null : ?boolean),
    };
  },
  _checkIfExpensive() {
    NetInfo.isConnectionExpensive().then(
        isConnectionExpensive => { this.setState({isConnectionExpensive}); }
    );
  },
  render() {
    return (
        <View>
          <TouchableWithoutFeedback onPress={this._checkIfExpensive}>
            <View>
              <Text>Click to see if connection is expensive:
                {this.state.isConnectionExpensive === true ? 'Expensive' :
                this.state.isConnectionExpensive === false ? 'Not expensive'
                : 'Unknown'}
              </Text>
            </View>
          </TouchableWithoutFeedback>
        </View>
    );
  }
});

exports.title = 'NetInfo';
exports.description = 'Monitor network status';
exports.examples = [
  {
    title: 'NetInfo.isConnected',
    description: 'Asynchronously load and observe connectivity',
    render(): ReactElement { return <IsConnected />; }
  },
  {
    title: 'NetInfo.update',
    description: 'Asynchronously load and observe connectionInfo',
    render(): ReactElement { return <ConnectionInfoCurrent />; }
  },
  {
    title: 'NetInfo.updateHistory',
    description: 'Observed updates to connectionInfo',
    render(): ReactElement { return <ConnectionInfoSubscription />; }
  },
  {
    platform: 'android',
    title: 'NetInfo.isConnectionExpensive (Android)',
    description: 'Asynchronously check isConnectionExpensive',
    render(): ReactElement { return <IsConnectionExpensive />; }
  },
];
