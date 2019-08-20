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
  Modal,
  Picker,
  Platform,
  StyleSheet,
  Switch,
  Text,
  TouchableHighlight,
  View,
} = require('react-native');

const Item = Picker.Item;

exports.displayName = (undefined: ?string);
exports.framework = 'React';
exports.title = '<Modal>';
exports.description = 'Component for presenting modal views.';

class Button extends React.Component<$FlowFixMeProps, $FlowFixMeState> {
  state = {
    active: false,
  };

  _onHighlight = () => {
    this.setState({active: true});
  };

  _onUnhighlight = () => {
    this.setState({active: false});
  };

  render() {
    const colorStyle = {
      color: this.state.active ? '#fff' : '#000',
    };
    return (
      <TouchableHighlight
        onHideUnderlay={this._onUnhighlight}
        onPress={this.props.onPress}
        onShowUnderlay={this._onHighlight}
        style={[styles.button, this.props.style]}
        underlayColor="#a9d9d4">
        <Text style={[styles.buttonText, colorStyle]}>
          {this.props.children}
        </Text>
      </TouchableHighlight>
    );
  }
}

const supportedOrientationsPickerValues = [
  ['portrait'],
  ['landscape'],
  ['landscape-left'],
  ['portrait', 'landscape-right'],
  ['portrait', 'landscape'],
  [],
];

class ModalExample extends React.Component<{}, $FlowFixMeState> {
  state = {
    animationType: 'none',
    modalVisible: false,
    transparent: false,
    presentationStyle: 'fullScreen',
    selectedSupportedOrientation: 0,
    currentOrientation: 'unknown',
  };

  _setModalVisible = visible => {
    this.setState({modalVisible: visible});
  };

  _setAnimationType = type => {
    this.setState({animationType: type});
  };

  _toggleTransparent = () => {
    this.setState({transparent: !this.state.transparent});
  };

  renderSwitch() {
    if (Platform.isTV) {
      return null;
    }
    return (
      <Switch
        value={this.state.transparent}
        onValueChange={this._toggleTransparent}
      />
    );
  }

  render() {
    const modalBackgroundStyle = {
      backgroundColor: this.state.transparent
        ? 'rgba(0, 0, 0, 0.5)'
        : '#f5fcff',
    };
    const innerContainerTransparentStyle = this.state.transparent
      ? {backgroundColor: '#fff', padding: 20}
      : null;
    const activeButtonStyle = {
      backgroundColor: '#ddd',
    };

    return (
      <View>
        <Modal
          animationType={this.state.animationType}
          presentationStyle={this.state.presentationStyle}
          transparent={this.state.transparent}
          visible={this.state.modalVisible}
          onRequestClose={() => this._setModalVisible(false)}
          supportedOrientations={
            supportedOrientationsPickerValues[
              this.state.selectedSupportedOrientation
            ]
          }
          onOrientationChange={evt =>
            this.setState({currentOrientation: evt.nativeEvent.orientation})
          }>
          <View style={[styles.container, modalBackgroundStyle]}>
            <View
              style={[styles.innerContainer, innerContainerTransparentStyle]}>
              <Text>
                This modal was presented{' '}
                {this.state.animationType === 'none' ? 'without' : 'with'}{' '}
                animation.
              </Text>
              <Text>
                It is currently displayed in {this.state.currentOrientation}{' '}
                mode.
              </Text>
              <Button
                onPress={this._setModalVisible.bind(this, false)}
                style={styles.modalButton}>
                Close
              </Button>
            </View>
          </View>
        </Modal>
        <View style={styles.row}>
          <Text style={styles.rowTitle}>Animation Type</Text>
          <Button
            onPress={this._setAnimationType.bind(this, 'none')}
            style={
              this.state.animationType === 'none' ? activeButtonStyle : {}
            }>
            none
          </Button>
          <Button
            onPress={this._setAnimationType.bind(this, 'slide')}
            style={
              this.state.animationType === 'slide' ? activeButtonStyle : {}
            }>
            slide
          </Button>
          <Button
            onPress={this._setAnimationType.bind(this, 'fade')}
            style={
              this.state.animationType === 'fade' ? activeButtonStyle : {}
            }>
            fade
          </Button>
        </View>

        <View style={styles.row}>
          <Text style={styles.rowTitle}>Transparent</Text>
          {this.renderSwitch()}
        </View>
        {this.renderPickers()}
        <Button onPress={this._setModalVisible.bind(this, true)}>
          Present
        </Button>
      </View>
    );
  }
  renderPickers() {
    if (Platform.isTV) {
      return null;
    }
    return (
      <View>
        <View>
          <Text style={styles.rowTitle}>Presentation style</Text>
          <Picker
            selectedValue={this.state.presentationStyle}
            onValueChange={presentationStyle =>
              this.setState({presentationStyle})
            }
            itemStyle={styles.pickerItem}>
            <Item label="Full Screen" value="fullScreen" />
            <Item label="Page Sheet" value="pageSheet" />
            <Item label="Form Sheet" value="formSheet" />
            <Item label="Over Full Screen" value="overFullScreen" />
            <Item label="Default presentationStyle" value={null} />
          </Picker>
        </View>

        <View>
          <Text style={styles.rowTitle}>Supported orientations</Text>
          <Picker
            selectedValue={this.state.selectedSupportedOrientation}
            onValueChange={(_, i) =>
              this.setState({selectedSupportedOrientation: i})
            }
            itemStyle={styles.pickerItem}>
            <Item label="Portrait" value={0} />
            <Item label="Landscape" value={1} />
            <Item label="Landscape left" value={2} />
            <Item label="Portrait and landscape right" value={3} />
            <Item label="Portrait and landscape" value={4} />
            <Item label="Default supportedOrientations" value={5} />
          </Picker>
        </View>
      </View>
    );
  }
}

exports.examples = [
  {
    title: 'Modal Presentation',
    description: 'Modals can be presented with or without animation',
    render: (): React.Node => <ModalExample />,
  },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  innerContainer: {
    borderRadius: 10,
    alignItems: 'center',
  },
  row: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    marginBottom: 20,
  },
  rowTitle: {
    flex: 1,
    fontWeight: 'bold',
  },
  button: {
    borderRadius: 5,
    flexGrow: 1,
    height: 44,
    alignSelf: 'stretch',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  buttonText: {
    fontSize: 18,
    margin: 5,
    textAlign: 'center',
  },
  modalButton: {
    marginTop: 10,
  },
  pickerItem: {
    fontSize: 16,
  },
});
