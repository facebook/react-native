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
import type {Node} from 'React';
import {ActivityIndicator, StyleSheet, View, Text, Button} from 'react-native';
import React, {Component} from 'react';

type State = {|animating: boolean, message: string|};
type Props = $ReadOnly<{||}>;
type Timer = TimeoutID;

class ToggleAnimatingActivityIndicator extends Component<Props, State> {
  _timer: Timer;

  constructor(props: Props) {
    super(props);
    this.state = {
      animating: true,
      message: 'Loading...',
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
      this.setState({
        animating: !this.state.animating,
        message: this.state.animating ? 'Information Loaded!' : 'Loading...',
      });
      this.setToggleTimeout();
    }, 2000);
  }

  render(): Node {
    return (
      <View style={styles.centering}>
        <Text>{this.state.message}</Text>
        <ActivityIndicator
          animating={this.state.animating}
          style={{height: 80}}
          size="large"
        />
      </View>
    );
  }
}

class ButtonToggleActivityIndicator extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      animating: true,
      message: 'Loading...',
    };
  }

  toggleState = () => {
    this.setState({
      animating: !this.state.animating,
      message: this.state.animating ? 'Information Loaded!' : 'Loading...',
    });
  };

  render(): Node {
    return (
      <View style={styles.centering}>
        <Text>{this.state.message}</Text>
        <ActivityIndicator
          animating={this.state.animating}
          style={{height: 80}}
          size="large"
          hidesWhenStopped={false}
        />
        <Button title="toggle" onPress={this.toggleState} />
      </View>
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
  spaced: {
    marginBottom: 10,
  },
});

exports.displayName = (undefined: ?string);
exports.framework = 'React';
exports.title = '<ActivityIndicator>';
exports.description = 'Animated loading indicators.';

exports.examples = [
  {
    title: 'Default (small, white)',
    render(): Node {
      return (
        <View style={[styles.gray, styles.centering]}>
          <Text style={styles.spaced}>
            Please wait while we fetch your information...
          </Text>
          <ActivityIndicator color="white" />
        </View>
      );
    },
  },
  {
    title: 'Gray',
    render(): Node {
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
    render(): Node {
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
    render(): Node {
      return (
        <View style={[styles.centering, styles.gray]}>
          <Text style={styles.spaced}>
            Processing transaction, do not close this tab.
          </Text>
          <ActivityIndicator size="large" color="white" />
        </View>
      );
    },
  },
  {
    title:
      'Start/stop, with the activity indicator disappearing when it stops animating',
    render(): Node {
      return <ToggleAnimatingActivityIndicator />;
    },
  },
  {
    title:
      'Button-toggled start/stop, with the activity indicator remaining visible when it is not animated',
    render(): Node {
      return <ButtonToggleActivityIndicator />;
    },
  },
  {
    title: 'Custom size',
    render(): Node {
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
    render(): Node {
      return <ActivityIndicator style={styles.centering} size={75} />;
    },
  },
];
