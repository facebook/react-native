/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule GeoLocationExample
 */
/* eslint no-console: 0 */
'use strict';


var React = require('react-native');
var {
  StyleSheet,
  Text,
  View,
} = React;

exports.framework = 'React';
exports.title = 'GeoLocation';
exports.description = 'Examples of using the GeoLocation API.';

exports.examples = [
  {
    title: 'navigator.geolocation',
    render: function() {
      return <GeoLocationExample />;
    },
  }
];

var GeoLocationExample = React.createClass({
  getInitialState: function() {
    return {
      initialPosition: 'unknown',
      lastPosition: 'unknown',
    };
  },

  componentDidMount: function() {
    navigator.geolocation.getCurrentPosition(
      (initialPosition) => this.setState({initialPosition}),
      (error) => console.error(error)
    );
    this.watchID = navigator.geolocation.watchPosition((lastPosition) => {
      this.setState({lastPosition});
    });
  },

  componentWillUnmount: function() {
    navigator.geolocation.clearWatch(this.watchID);
  },

  render: function() {
    return (
      <View>
        <Text>
          <Text style={styles.title}>Initial position: </Text>
          {JSON.stringify(this.state.initialPosition)}
        </Text>
        <Text>
          <Text style={styles.title}>Current position: </Text>
          {JSON.stringify(this.state.lastPosition)}
        </Text>
      </View>
    );
  }
});

var styles = StyleSheet.create({
  title: {
    fontWeight: 'bold',
  },
});
