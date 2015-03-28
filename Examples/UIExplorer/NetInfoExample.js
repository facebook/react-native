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
  NetInfo,
  Text,
  View
} = React;

var ReachabilitySubscription = React.createClass({
  getInitialState() {
    return {
      reachabilityHistory: [],
    };
  },
  componentDidMount: function() {
    NetInfo.reachabilityIOS.addEventListener(
      'change',
      this._handleReachabilityChange
    );
  },
  componentWillUnmount: function() {
    NetInfo.reachabilityIOS.removeEventListener(
      'change',
      this._handleReachabilityChange
    );
  },
  _handleReachabilityChange: function(reachability) {
    var reachabilityHistory = this.state.reachabilityHistory.slice();
    reachabilityHistory.push(reachability);
    this.setState({
      reachabilityHistory,
    });
  },
  render() {
    return (
      <View>
        <Text>{JSON.stringify(this.state.reachabilityHistory)}</Text>
      </View>
    );
  }
});

var ReachabilityCurrent = React.createClass({
  getInitialState() {
    return {
      reachability: null,
    };
  },
  componentDidMount: function() {
    NetInfo.reachabilityIOS.addEventListener(
      'change',
      this._handleReachabilityChange
    );
    NetInfo.reachabilityIOS.fetch().done(
      (reachability) => { this.setState({reachability}); }
    );
  },
  componentWillUnmount: function() {
    NetInfo.reachabilityIOS.removeEventListener(
      'change',
      this._handleReachabilityChange
    );
  },
  _handleReachabilityChange: function(reachability) {
    this.setState({
      reachability,
    });
  },
  render() {
    return (
      <View>
        <Text>{this.state.reachability}</Text>
      </View>
    );
  }
});

var IsConnected = React.createClass({
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

exports.title = 'NetInfo';
exports.description = 'Monitor network status';
exports.examples = [
  {
    title: 'NetInfo.isConnected',
    description: 'Asyncronously load and observe connectivity',
    render(): ReactElement { return <IsConnected />; }
  },
  {
    title: 'NetInfo.reachabilityIOS',
    description: 'Asyncronously load and observe iOS reachability',
    render(): ReactElement { return <ReachabilityCurrent />; }
  },
  {
    title: 'NetInfo.reachabilityIOS',
    description: 'Observed updates to iOS reachability',
    render(): ReactElement { return <ReachabilitySubscription />; }
  },
];
