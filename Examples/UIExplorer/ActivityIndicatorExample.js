/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */
'use strict';

var React = require('react-native');
var {
  ActivityIndicatorIOS,
  StyleSheet,
  TimerMixin,
  View,
} = React;

var ToggleAnimatingActivityIndicator = React.createClass({
  mixins: [TimerMixin],

  getInitialState: function() {
    return {
      animating: true,
    };
  },

  setToggleTimeout: function() {
    this.setTimeout(
      () => {
        this.setState({animating: !this.state.animating});
        this.setToggleTimeout();
      },
      1200
    );
  },

  componentDidMount: function() {
    this.setToggleTimeout();
  },

  render: function() {
    return (
      <ActivityIndicatorIOS
        animating={this.state.animating}
        style={[styles.centering, {height: 80}]}
        size="large"
      />
    );
  }
});

exports.framework = 'React';
exports.title = '<ActivityIndicatorIOS>';
exports.description = 'Animated loading indicators.';

exports.examples = [
  {
    title: 'Default (small, white)',
    render: function() {
      return (
        <ActivityIndicatorIOS
          style={[styles.centering, styles.gray, {height: 40}]}
          color="white"
          />
      );
    }
  },
  {
    title: 'Gray',
    render: function() {
      return (
        <View>
          <ActivityIndicatorIOS
            style={[styles.centering, {height: 40}]}
          />
          <ActivityIndicatorIOS
            style={[styles.centering, {backgroundColor: '#eeeeee', height: 40}]}
          />
        </View>
      );
    }
  },
  {
    title: 'Custom colors',
    render: function() {
      return (
        <View style={styles.horizontal}>
          <ActivityIndicatorIOS color="#0000ff" />
          <ActivityIndicatorIOS color="#aa00aa" />
          <ActivityIndicatorIOS color="#aa3300" />
          <ActivityIndicatorIOS color="#00aa00" />
        </View>
      );
    }
  },
  {
    title: 'Large',
    render: function() {
      return (
        <ActivityIndicatorIOS
          style={[styles.centering, styles.gray, {height: 80}]}
          color="white"
          size="large"
        />
      );
    }
  },
  {
    title: 'Large, custom colors',
    render: function() {
      return (
        <View style={styles.horizontal}>
          <ActivityIndicatorIOS
            size="large"
            color="#0000ff"
          />
          <ActivityIndicatorIOS
            size="large"
            color="#aa00aa"
          />
          <ActivityIndicatorIOS
            size="large"
            color="#aa3300"
          />
          <ActivityIndicatorIOS
            size="large"
            color="#00aa00"
          />
        </View>
      );
    }
  },
  {
    title: 'Start/stop',
    render: function() {
      return <ToggleAnimatingActivityIndicator />;
    }
  },
];

var styles = StyleSheet.create({
  centering: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gray: {
    backgroundColor: '#cccccc',
  },
  horizontal: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
});
