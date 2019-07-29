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

const React = require('react');
const {
  StatusBar,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
  Modal,
} = require('react-native');

const colors = ['#ff0000', '#00ff00', '#0000ff', 'rgba(0, 0, 0, 0.4)'];

const barStyles = ['default', 'light-content'];

const showHideTransitions = ['fade', 'slide'];

function getValue<T>(values: Array<T>, index: number): T {
  return values[index % values.length];
}

class StatusBarHiddenExample extends React.Component<{}, $FlowFixMeState> {
  state = {
    animated: true,
    hidden: false,
    showHideTransition: getValue(showHideTransitions, 0),
  };

  _showHideTransitionIndex = 0;

  _onChangeAnimated = () => {
    this.setState({animated: !this.state.animated});
  };

  _onChangeHidden = () => {
    this.setState({hidden: !this.state.hidden});
  };

  _onChangeTransition = () => {
    this._showHideTransitionIndex++;
    this.setState({
      showHideTransition: getValue(
        showHideTransitions,
        this._showHideTransitionIndex,
      ),
    });
  };

  render() {
    return (
      <View>
        <StatusBar
          hidden={this.state.hidden}
          showHideTransition={this.state.showHideTransition}
          animated={this.state.animated}
        />
        <TouchableHighlight
          style={styles.wrapper}
          onPress={this._onChangeHidden}>
          <View style={styles.button}>
            <Text>hidden: {this.state.hidden ? 'true' : 'false'}</Text>
          </View>
        </TouchableHighlight>
        <TouchableHighlight
          style={styles.wrapper}
          onPress={this._onChangeAnimated}>
          <View style={styles.button}>
            <Text>
              animated (ios only): {this.state.animated ? 'true' : 'false'}
            </Text>
          </View>
        </TouchableHighlight>
        <TouchableHighlight
          style={styles.wrapper}
          onPress={this._onChangeTransition}>
          <View style={styles.button}>
            <Text>
              showHideTransition (ios only): '
              {getValue(showHideTransitions, this._showHideTransitionIndex)}'
            </Text>
          </View>
        </TouchableHighlight>
        <ModalExample />
      </View>
    );
  }
}

class StatusBarStyleExample extends React.Component<{}, $FlowFixMeState> {
  _barStyleIndex = 0;

  _onChangeBarStyle = () => {
    this._barStyleIndex++;
    this.setState({barStyle: getValue(barStyles, this._barStyleIndex)});
  };

  _onChangeAnimated = () => {
    this.setState({animated: !this.state.animated});
  };

  state = {
    animated: true,
    barStyle: getValue(barStyles, this._barStyleIndex),
  };

  render() {
    return (
      <View>
        <StatusBar
          animated={this.state.animated}
          barStyle={this.state.barStyle}
        />
        <TouchableHighlight
          style={styles.wrapper}
          onPress={this._onChangeBarStyle}>
          <View style={styles.button}>
            <Text>style: '{getValue(barStyles, this._barStyleIndex)}'</Text>
          </View>
        </TouchableHighlight>
        <TouchableHighlight
          style={styles.wrapper}
          onPress={this._onChangeAnimated}>
          <View style={styles.button}>
            <Text>animated: {this.state.animated ? 'true' : 'false'}</Text>
          </View>
        </TouchableHighlight>
      </View>
    );
  }
}

class StatusBarNetworkActivityExample extends React.Component<
  {},
  $FlowFixMeState,
> {
  state = {
    networkActivityIndicatorVisible: false,
  };

  _onChangeNetworkIndicatorVisible = () => {
    this.setState({
      networkActivityIndicatorVisible: !this.state
        .networkActivityIndicatorVisible,
    });
  };

  render() {
    return (
      <View>
        <StatusBar
          networkActivityIndicatorVisible={
            this.state.networkActivityIndicatorVisible
          }
        />
        <TouchableHighlight
          style={styles.wrapper}
          onPress={this._onChangeNetworkIndicatorVisible}>
          <View style={styles.button}>
            <Text>
              networkActivityIndicatorVisible:
              {this.state.networkActivityIndicatorVisible ? 'true' : 'false'}
            </Text>
          </View>
        </TouchableHighlight>
      </View>
    );
  }
}

class StatusBarBackgroundColorExample extends React.Component<
  {},
  $FlowFixMeState,
> {
  state = {
    animated: true,
    backgroundColor: getValue(colors, 0),
  };

  _colorIndex = 0;

  _onChangeBackgroundColor = () => {
    this._colorIndex++;
    this.setState({backgroundColor: getValue(colors, this._colorIndex)});
  };

  _onChangeAnimated = () => {
    this.setState({animated: !this.state.animated});
  };

  render() {
    return (
      <View>
        <StatusBar
          backgroundColor={this.state.backgroundColor}
          animated={this.state.animated}
        />
        <TouchableHighlight
          style={styles.wrapper}
          onPress={this._onChangeBackgroundColor}>
          <View style={styles.button}>
            <Text>backgroundColor: '{getValue(colors, this._colorIndex)}'</Text>
          </View>
        </TouchableHighlight>
        <TouchableHighlight
          style={styles.wrapper}
          onPress={this._onChangeAnimated}>
          <View style={styles.button}>
            <Text>animated: {this.state.animated ? 'true' : 'false'}</Text>
          </View>
        </TouchableHighlight>
      </View>
    );
  }
}

class StatusBarTranslucentExample extends React.Component<{}, $FlowFixMeState> {
  state = {
    translucent: false,
  };

  _onChangeTranslucent = () => {
    this.setState({
      translucent: !this.state.translucent,
    });
  };

  render() {
    return (
      <View>
        <StatusBar translucent={this.state.translucent} />
        <TouchableHighlight
          style={styles.wrapper}
          onPress={this._onChangeTranslucent}>
          <View style={styles.button}>
            <Text>
              translucent: {this.state.translucent ? 'true' : 'false'}
            </Text>
          </View>
        </TouchableHighlight>
      </View>
    );
  }
}

class StatusBarStaticIOSExample extends React.Component<{}> {
  render() {
    return (
      <View>
        <TouchableHighlight
          style={styles.wrapper}
          onPress={() => {
            StatusBar.setHidden(true, 'slide');
          }}>
          <View style={styles.button}>
            <Text>setHidden(true, 'slide')</Text>
          </View>
        </TouchableHighlight>
        <TouchableHighlight
          style={styles.wrapper}
          onPress={() => {
            StatusBar.setHidden(false, 'fade');
          }}>
          <View style={styles.button}>
            <Text>setHidden(false, 'fade')</Text>
          </View>
        </TouchableHighlight>
        <TouchableHighlight
          style={styles.wrapper}
          onPress={() => {
            StatusBar.setBarStyle('default', true);
          }}>
          <View style={styles.button}>
            <Text>setBarStyle('default', true)</Text>
          </View>
        </TouchableHighlight>
        <TouchableHighlight
          style={styles.wrapper}
          onPress={() => {
            StatusBar.setBarStyle('light-content', true);
          }}>
          <View style={styles.button}>
            <Text>setBarStyle('light-content', true)</Text>
          </View>
        </TouchableHighlight>
        <TouchableHighlight
          style={styles.wrapper}
          onPress={() => {
            StatusBar.setNetworkActivityIndicatorVisible(true);
          }}>
          <View style={styles.button}>
            <Text>setNetworkActivityIndicatorVisible(true)</Text>
          </View>
        </TouchableHighlight>
        <TouchableHighlight
          style={styles.wrapper}
          onPress={() => {
            StatusBar.setNetworkActivityIndicatorVisible(false);
          }}>
          <View style={styles.button}>
            <Text>setNetworkActivityIndicatorVisible(false)</Text>
          </View>
        </TouchableHighlight>
      </View>
    );
  }
}

class StatusBarStaticAndroidExample extends React.Component<{}> {
  render() {
    return (
      <View>
        <TouchableHighlight
          style={styles.wrapper}
          onPress={() => {
            StatusBar.setHidden(true);
          }}>
          <View style={styles.button}>
            <Text>setHidden(true)</Text>
          </View>
        </TouchableHighlight>
        <TouchableHighlight
          style={styles.wrapper}
          onPress={() => {
            StatusBar.setHidden(false);
          }}>
          <View style={styles.button}>
            <Text>setHidden(false)</Text>
          </View>
        </TouchableHighlight>
        <TouchableHighlight
          style={styles.wrapper}
          onPress={() => {
            StatusBar.setBackgroundColor('#ff00ff', true);
          }}>
          <View style={styles.button}>
            <Text>setBackgroundColor('#ff00ff', true)</Text>
          </View>
        </TouchableHighlight>
        <TouchableHighlight
          style={styles.wrapper}
          onPress={() => {
            StatusBar.setBackgroundColor('#00ff00', true);
          }}>
          <View style={styles.button}>
            <Text>setBackgroundColor('#00ff00', true)</Text>
          </View>
        </TouchableHighlight>
        <TouchableHighlight
          style={styles.wrapper}
          onPress={() => {
            StatusBar.setTranslucent(true);
            StatusBar.setBackgroundColor('rgba(0, 0, 0, 0.4)', true);
          }}>
          <View style={styles.button}>
            <Text>
              setTranslucent(true) and setBackgroundColor('rgba(0, 0, 0, 0.4)',
              true)
            </Text>
          </View>
        </TouchableHighlight>
        <TouchableHighlight
          style={styles.wrapper}
          onPress={() => {
            StatusBar.setTranslucent(false);
            StatusBar.setBackgroundColor('black', true);
          }}>
          <View style={styles.button}>
            <Text>
              setTranslucent(false) and setBackgroundColor('black', true)
            </Text>
          </View>
        </TouchableHighlight>
      </View>
    );
  }
}

class ModalExample extends React.Component<{}, $FlowFixMeState> {
  state = {
    modalVisible: false,
  };

  _onChangeModalVisible = () => {
    this.setState({modalVisible: !this.state.modalVisible});
  };

  render() {
    return (
      <View>
        <TouchableHighlight
          style={styles.wrapper}
          onPress={this._onChangeModalVisible}>
          <View style={styles.button}>
            <Text>modal visible: {this.state.hidden ? 'true' : 'false'}</Text>
          </View>
        </TouchableHighlight>
        <Modal
          visible={this.state.modalVisible}
          transparent={true}
          onRequestClose={this._onChangeModalVisible}>
          <View style={[styles.container]}>
            <View style={[styles.innerContainer]}>
              <Text>This modal was presented!</Text>
              <TouchableHighlight
                onPress={this._onChangeModalVisible}
                style={styles.modalButton}>
                <View style={styles.button}>
                  <Text>Close</Text>
                </View>
              </TouchableHighlight>
            </View>
          </View>
        </Modal>
      </View>
    );
  }
}

exports.framework = 'React';
exports.title = '<StatusBar>';
exports.description = 'Component for controlling the status bar';
exports.examples = [
  {
    title: 'StatusBar hidden',
    render() {
      return <StatusBarHiddenExample />;
    },
  },
  {
    title: 'StatusBar style',
    render() {
      return <StatusBarStyleExample />;
    },
    platform: 'ios',
  },
  {
    title: 'StatusBar network activity indicator',
    render() {
      return <StatusBarNetworkActivityExample />;
    },
    platform: 'ios',
  },
  {
    title: 'StatusBar background color',
    render() {
      return <StatusBarBackgroundColorExample />;
    },
    platform: 'android',
  },
  {
    title: 'StatusBar translucent',
    render() {
      return <StatusBarTranslucentExample />;
    },
    platform: 'android',
  },
  {
    title: 'StatusBar static API',
    render() {
      return <StatusBarStaticIOSExample />;
    },
    platform: 'ios',
  },
  {
    title: 'StatusBar static API',
    render() {
      return <StatusBarStaticAndroidExample />;
    },
    platform: 'android',
  },
  {
    title: 'StatusBar dimensions',
    render() {
      return (
        <View>
          <Text>Height (Android only): {StatusBar.currentHeight} pts</Text>
        </View>
      );
    },
    platform: 'android',
  },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5fcff',
  },
  innerContainer: {
    borderRadius: 10,
    alignItems: 'center',
  },
  wrapper: {
    borderRadius: 5,
    marginBottom: 5,
  },
  button: {
    borderRadius: 5,
    backgroundColor: '#eeeeee',
    padding: 10,
  },
  modalButton: {
    marginTop: 10,
  },
});
