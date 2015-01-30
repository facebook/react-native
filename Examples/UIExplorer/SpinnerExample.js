/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule SpinnerExample
 */
'use strict';

var React = require('react-native');
var {
  SpinnerIOS,
  StyleSheet,
  TimerMixin,
  View,
} = React;

var ToggleAnimatingSpinner = React.createClass({
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
      <SpinnerIOS
        animating={this.state.animating}
        style={[styles.centering, {height: 80}]}
        size={SpinnerIOS.size.large}
      />
    );
  }
});

exports.framework = 'React';
exports.title = '<SpinnerIOS>';
exports.description = 'Animated loading indicators.';

exports.examples = [
  {
    title: 'Default (small, white)',
    render: function() {
      return (
        <SpinnerIOS
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
          <SpinnerIOS
            style={[styles.centering, {height: 40}]}
          />
          <SpinnerIOS
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
          <SpinnerIOS color="#0000ff" />
          <SpinnerIOS color="#aa00aa" />
          <SpinnerIOS color="#aa3300" />
          <SpinnerIOS color="#00aa00" />
        </View>
      );
    }
  },
  {
    title: 'Large',
    render: function() {
      return (
        <SpinnerIOS
          style={[styles.centering, styles.gray, {height: 80}]}
          color="white"
          size={SpinnerIOS.size.large}
        />
      );
    }
  },
  {
    title: 'Large, custom colors',
    render: function() {
      return (
        <View style={styles.horizontal}>
          <SpinnerIOS
            size={SpinnerIOS.size.large}
            color="#0000ff"
          />
          <SpinnerIOS
            size={SpinnerIOS.size.large}
            color="#aa00aa"
          />
          <SpinnerIOS
            size={SpinnerIOS.size.large}
            color="#aa3300"
          />
          <SpinnerIOS
            size={SpinnerIOS.size.large}
            color="#00aa00"
          />
        </View>
      );
    }
  },
  {
    title: 'Start/stop',
    render: function() {
      return <ToggleAnimatingSpinner />;
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
