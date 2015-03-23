/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule AppStateIOSExample
 * @flow
 */
'use strict';

var React = require('react-native');
var {
  AppStateIOS,
  Text,
  View
} = React;

var AppStateSubscription = React.createClass({
  getInitialState() {
    return {
      appState: AppStateIOS.currentState,
      previousAppStates: [],
    };
  },
  componentDidMount: function() {
    AppStateIOS.addEventListener('change', this._handleAppStateChange);
  },
  componentWillUnmount: function() {
    AppStateIOS.removeEventListener('change', this._handleAppStateChange);
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
    render(): ReactElement { return <AppStateSubscription showCurrentOnly={true} />; }
  },
  {
    title: 'Previous states:',
    render(): ReactElement { return <AppStateSubscription showCurrentOnly={false} />; }
  },
];
