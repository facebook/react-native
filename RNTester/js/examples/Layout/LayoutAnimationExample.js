/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const React = require('react');
const {
  LayoutAnimation,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} = require('react-native');

class AddRemoveExample extends React.Component<{...}, $FlowFixMeState> {
  state = {
    views: [],
  };

  UNSAFE_componentWillUpdate() {
    LayoutAnimation.easeInEaseOut(args =>
      console.log('AddRemoveExample completed', args),
    );
  }

  _onPressAddView = () => {
    this.setState(state => ({views: [...state.views, {}]}));
  };

  _onPressRemoveView = () => {
    this.setState(state => ({views: state.views.slice(0, -1)}));
  };

  render() {
    const views = this.state.views.map((view, i) => (
      <View key={i} style={styles.view}>
        <Text>{i}</Text>
      </View>
    ));
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={this._onPressAddView}>
          <View style={styles.button}>
            <Text>Add view</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={this._onPressRemoveView}>
          <View style={styles.button}>
            <Text>Remove view</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.viewContainer}>{views}</View>
      </View>
    );
  }
}

const GreenSquare = () => (
  <View style={styles.greenSquare}>
    <Text>Green square</Text>
  </View>
);

const BlueSquare = () => (
  <View style={styles.blueSquare}>
    <Text>Blue square</Text>
  </View>
);

class CrossFadeExample extends React.Component<{...}, $FlowFixMeState> {
  state = {
    toggled: false,
  };

  _onPressToggle = () => {
    LayoutAnimation.easeInEaseOut(args =>
      console.log('CrossFadeExample completed', args),
    );
    this.setState(state => ({toggled: !state.toggled}));
  };

  render() {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={this._onPressToggle}>
          <View style={styles.button}>
            <Text>Toggle</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.viewContainer}>
          {this.state.toggled ? <GreenSquare /> : <BlueSquare />}
        </View>
      </View>
    );
  }
}

class LayoutUpdateExample extends React.Component<{...}, $FlowFixMeState> {
  state = {
    width: 200,
    height: 100,
  };

  timeout = null;

  componentWillUnmount() {
    this._clearTimeout();
  }

  _clearTimeout = () => {
    if (this.timeout !== null) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  };

  _onPressToggle = () => {
    this._clearTimeout();
    this.setState({width: 150});

    LayoutAnimation.configureNext(
      {
        duration: 1000,
        update: {
          type: LayoutAnimation.Types.linear,
        },
      },
      args => console.log('LayoutUpdateExample completed', args),
    );

    this.timeout = setTimeout(() => this.setState({width: 100}), 500);
  };

  render() {
    const {width, height} = this.state;

    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={this._onPressToggle}>
          <View style={styles.button}>
            <Text>Make box square</Text>
          </View>
        </TouchableOpacity>
        <View style={[styles.view, {width, height}]}>
          <Text>
            {width}x{height}
          </Text>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  button: {
    borderRadius: 5,
    backgroundColor: '#eeeeee',
    padding: 10,
    marginBottom: 10,
  },
  viewContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  view: {
    height: 54,
    width: 54,
    backgroundColor: 'red',
    margin: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greenSquare: {
    width: 150,
    height: 150,
    backgroundColor: 'green',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blueSquare: {
    width: 150,
    height: 150,
    backgroundColor: 'blue',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

exports.title = 'Layout Animation';
exports.description = 'Layout animation';
exports.examples = [
  {
    title: 'Add and remove views',
    render(): React.Element<any> {
      return <AddRemoveExample />;
    },
  },
  {
    title: 'Cross fade views',
    render(): React.Element<any> {
      return <CrossFadeExample />;
    },
  },
  {
    title: 'Layout update during animation',
    render(): React.Element<any> {
      return <LayoutUpdateExample />;
    },
  },
];
