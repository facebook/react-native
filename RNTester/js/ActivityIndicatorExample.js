/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

import React, {Component} from 'react';
import {ActivityIndicator, StyleSheet, View} from 'react-native';

type State = {|animating: boolean|};
type Props = $ReadOnly<{||}>;
type Timer = TimeoutID;

class ToggleAnimatingActivityIndicator extends Component<Props, State> {
  _timer: Timer;

  constructor(props: Props) {
    super(props);
    this.state = {
      animating: true,
    };
  }

  componentDidMount() {
    this.setToggleTimeout();
  }

  componentWillUnmount() {
    clearTimeout(this._timer);
  }

  setToggleTimeout() {
    this._timer = setTimeout(() => {
      this.setState({animating: !this.state.animating});
      this.setToggleTimeout();
    }, 2000);
  }

  render() {
    return (
      <ActivityIndicator
        animating={this.state.animating}
        style={[styles.centering, {height: 80}]}
        size="large"
      />
    );
  }
}

const styles = StyleSheet.create({
  centering: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  gray: {
    backgroundColor: '#cccccc',
  },
  horizontal: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 8,
  },
});

exports.displayName = (undefined: ?string);
exports.framework = 'React';
exports.title = '<ActivityIndicator>';
exports.description = 'Animated loading indicators.';

exports.examples = [
  {
    title: 'Default (small, white)',
    render() {
      return (
        <ActivityIndicator
          style={[styles.centering, styles.gray]}
          color="white"
        />
      );
    },
  },
  {
    title: 'Gray',
    render() {
      return (
        <View>
          <ActivityIndicator style={[styles.centering]} />
          <ActivityIndicator style={[styles.centering, styles.gray]} />
        </View>
      );
    },
  },
  {
    title: 'Custom colors',
    render() {
      return (
        <View style={styles.horizontal}>
          <ActivityIndicator color="#0000ff" />
          <ActivityIndicator color="#aa00aa" />
          <ActivityIndicator color="#aa3300" />
          <ActivityIndicator color="#00aa00" />
        </View>
      );
    },
  },
  {
    title: 'Large',
    render() {
      return (
        <ActivityIndicator
          style={[styles.centering, styles.gray]}
          size="large"
          color="white"
        />
      );
    },
  },
  {
    title: 'Large, custom colors',
    render() {
      return (
        <View style={styles.horizontal}>
          <ActivityIndicator size="large" color="#0000ff" />
          <ActivityIndicator size="large" color="#aa00aa" />
          <ActivityIndicator size="large" color="#aa3300" />
          <ActivityIndicator size="large" color="#00aa00" />
        </View>
      );
    },
  },
  {
    title: 'Start/stop',
    render() {
      return <ToggleAnimatingActivityIndicator />;
    },
  },
  {
    title: 'Custom size',
    render() {
      return (
        <ActivityIndicator
          style={[styles.centering, {transform: [{scale: 1.5}]}]}
          size="large"
        />
      );
    },
  },
  {
    platform: 'android',
    title: 'Custom size (size: 75)',
    render() {
      return <ActivityIndicator style={styles.centering} size={75} />;
    },
  },
];
