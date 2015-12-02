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
  NetInfo, // requires android.permission.ACCESS_NETWORK_STATE
  Text,
  View
} = React;
const TouchableWithoutFeedback = require('TouchableWithoutFeedback');

const ConnectionSubscription = React.createClass({
  getInitialState() {
    return {
      connectionHistory: [],
    };
  },
  componentDidMount: function() {
    NetInfo.addEventListener(
      'change',
      this._handleConnectionChange
    );
  },
  componentWillUnmount: function() {
    NetInfo.removeEventListener(
      'change',
      this._handleConnectionChange
    );
  },
  _handleConnectionChange: function(netInfo) {
    var connectionHistory = this.state.connectionHistory.slice();
    connectionHistory.push(netInfo);
    this.setState({
      connectionHistory,
    });
  },
  render() {
    return (
      <Text>{JSON.stringify(this.state.connectionHistory)}</Text>
    );
  }
});

const ConnectionCurrent = React.createClass({
  getInitialState() {
    return {
      netInfo: null,
    };
  },
  componentDidMount: function() {
    NetInfo.addEventListener(
      'change',
      this._handleConnectionChange
    );
    NetInfo.fetch().done(
      (netInfo) => { this.setState({netInfo}); }
    );
  },
  componentWillUnmount: function() {
    NetInfo.removeEventListener(
      'change',
      this._handleConnectionChange
    );
  },
  _handleConnectionChange: function(netInfo) {
    this.setState({
      netInfo,
    });
  },
  render() {
    return (
      <Text>{JSON.stringify(this.state.netInfo)}</Text>
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
      <Text>{this.state.isConnected ? 'Online' : 'Offline'}</Text>
    );
  }
});

const NetInfoExample = React.createClass({
  statics: {
    title: '<NetInfo>',
    description: 'Monitor network status.'
  },

  getInitialState() {
    return {
      isMetered: null,
    };
  },
  render() {
    return (
      <View >
        <Text> Is Connected: <IsConnected /> </Text>
        <Text> Current Connection Type: <ConnectionCurrent /> </Text>
        <Text> Connection History: <ConnectionSubscription /> </Text>
        <TouchableWithoutFeedback onPress={this.isConnectionMetered}>
          <View>
            <Text>Click to see if connection is metered: {this.state.isMetered}</Text>
          </View>
        </TouchableWithoutFeedback>
      </View>
    );
  },
  isConnectionMetered: function() {
    NetInfo.isConnectionMetered((isConnectionMetered) => {
      this.setState({
        isMetered: isConnectionMetered ? 'Is Metered' : 'Is Not Metered',
      });
    });
  }
});

module.exports = NetInfoExample;
