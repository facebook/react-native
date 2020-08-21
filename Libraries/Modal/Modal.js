/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 * @generate-docs
 */

'use strict';

const AppContainer = require('../ReactNative/AppContainer');
const I18nManager = require('../ReactNative/I18nManager');
const React = require('react');
const ScrollView = require('../Components/ScrollView/ScrollView');
const StyleSheet = require('../StyleSheet/StyleSheet');
const View = require('../Components/View/View');

const {RootTagContext} = require('../ReactNative/RootTag');

import type {ViewProps} from '../Components/View/ViewPropTypes';
import {VirtualizedListContextResetter} from '../Lists/VirtualizedListContext.js';
import type {RootTag} from '../ReactNative/RootTag';
import type {DirectEventHandler} from '../Types/CodegenTypes';
import {type EventSubscription} from '../vendor/emitter/EventEmitter';
import RCTModalHostView from './RCTModalHostViewNativeComponent';

// In order to route onDismiss callbacks, we need to uniquely identifier each
// <Modal> on screen. There can be different ones, either nested or as siblings.
// We cannot pass the onDismiss callback to native as the view will be
// destroyed before the callback is fired.
let uniqueModalIdentifier = 0;

type OrientationChangeEvent = $ReadOnly<{|
  orientation: 'portrait' | 'landscape',
|}>;

export type Props = $ReadOnly<{|
  ...ViewProps,

  /**
    The `animationType` prop controls how the modal animates.

    - `slide` slides in from the bottom
    - `fade` fades into view
    - `none` appears without an animation

    @default none
   */
  animationType?: ?('none' | 'slide' | 'fade'),

  /**
    The `presentationStyle` prop controls how the modal appears (generally on
    larger devices such as iPad or plus-sized iPhones). See
    https://developer.apple.com/reference/uikit/uimodalpresentationstyle for
    details.

    - `fullScreen` covers the screen completely
    - `pageSheet` covers portrait-width view centered (only on larger devices)
    - `formSheet` covers narrow-width view centered (only on larger devices)
    - `overFullScreen` covers the screen completely, but allows transparency

    Default is set to `overFullScreen` or `fullScreen` depending on
    `transparent` property.

    @platform ios
   */
  presentationStyle?: ?(
    | 'fullScreen'
    | 'pageSheet'
    | 'formSheet'
    | 'overFullScreen'
  ),

  /**
    The `transparent` prop determines whether your modal will fill the entire
    view. Setting this to `true` will render the modal over a transparent
    background.
   */
  transparent?: ?boolean,

  /**
    The `statusBarTranslucent` prop determines whether your modal should go
    under the system statusbar.

    @platform android
   */
  statusBarTranslucent?: ?boolean,

  /**
    The `hardwareAccelerated` prop controls whether to force hardware
    acceleration for the underlying window.

    @platform android
   */
  hardwareAccelerated?: ?boolean,

  /**
    The `visible` prop determines whether your modal is visible.
   */
  visible?: ?boolean,

  /**
    The `onRequestClose` callback is called when the user taps the hardware back
    button on Android or the menu button on Apple TV. Because of this required
    prop, be aware that `BackHandler` events will not be emitted as long as the
    modal is open.
   */
  onRequestClose?: ?DirectEventHandler<null>,

  /**
    The `onShow` prop allows passing a function that will be called once the
    modal has been shown.
   */
  onShow?: ?DirectEventHandler<null>,

  /**
    The `onDismiss` prop allows passing a function that will be called once the
    modal has been dismissed.

    @platform ios
   */
  onDismiss?: ?() => mixed,

  /**
    The `supportedOrientations` prop allows the modal to be rotated to any of
    the specified orientations. On iOS, the modal is still restricted by what's
    specified in your app's Info.plist's UISupportedInterfaceOrientations field.
    When using `presentationStyle` of `pageSheet` or `formSheet`, this property
    will be ignored by iOS.

    @platform ios
   */
  supportedOrientations?: ?$ReadOnlyArray<
    | 'portrait'
    | 'portrait-upside-down'
    | 'landscape'
    | 'landscape-left'
    | 'landscape-right',
  >,

  /**
    The `onOrientationChange` callback is called when the orientation changes
    while the modal is being displayed. The orientation provided is only
    'portrait' or 'landscape'. This callback is also called on initial render,
    regardless of the current orientation.

    @platform ios
   */
  onOrientationChange?: ?DirectEventHandler<OrientationChangeEvent>,
|}>;

/**
  The Modal component is a basic way to present content above an enclosing view.

  ```SnackPlayer name=Modal%20Function%20Component%20Example&supportedPlatforms=android,ios
  import React, { useState } from "react";
  import {
    Alert,
    Modal,
    StyleSheet,
    Text,
    TouchableHighlight,
    View
  } from "react-native";

  const App = () => {
    const [modalVisible, setModalVisible] = useState(false);
    return (
      <View style={styles.centeredView}>
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => {
            Alert.alert("Modal has been closed.");
          }}
        >
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <Text style={styles.modalText}>Hello World!</Text>

              <TouchableHighlight
                style={{ ...styles.openButton, backgroundColor: "#2196F3" }}
                onPress={() => {
                  setModalVisible(!modalVisible);
                }}
              >
                <Text style={styles.textStyle}>Hide Modal</Text>
              </TouchableHighlight>
            </View>
          </View>
        </Modal>

        <TouchableHighlight
          style={styles.openButton}
          onPress={() => {
            setModalVisible(true);
          }}
        >
          <Text style={styles.textStyle}>Show Modal</Text>
        </TouchableHighlight>
      </View>
    );
  };

  const styles = StyleSheet.create({
    centeredView: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      marginTop: 22
    },
    modalView: {
      margin: 20,
      backgroundColor: "white",
      borderRadius: 20,
      padding: 35,
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5
    },
    openButton: {
      backgroundColor: "#F194FF",
      borderRadius: 20,
      padding: 10,
      elevation: 2
    },
    textStyle: {
      color: "white",
      fontWeight: "bold",
      textAlign: "center"
    },
    modalText: {
      marginBottom: 15,
      textAlign: "center"
    }
  });

  export default App;
  ```

  ```SnackPlayer name=Modal%20Class%20Component%20Example&supportedPlatforms=android,ios
  import React, { Component } from "react";
  import {
    Alert,
    Modal,
    StyleSheet,
    Text,
    TouchableHighlight,
    View
  } from "react-native";

  class App extends Component {
    state = {
      modalVisible: false
    };

    setModalVisible = (visible) => {
      this.setState({ modalVisible: visible });
    }

    render() {
      const { modalVisible } = this.state;
      return (
        <View style={styles.centeredView}>
          <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => {
              Alert.alert("Modal has been closed.");
            }}
          >
            <View style={styles.centeredView}>
              <View style={styles.modalView}>
                <Text style={styles.modalText}>Hello World!</Text>

                <TouchableHighlight
                  style={{ ...styles.openButton, backgroundColor: "#2196F3" }}
                  onPress={() => {
                    this.setModalVisible(!modalVisible);
                  }}
                >
                  <Text style={styles.textStyle}>Hide Modal</Text>
                </TouchableHighlight>
              </View>
            </View>
          </Modal>

          <TouchableHighlight
            style={styles.openButton}
            onPress={() => {
              this.setModalVisible(true);
            }}
          >
            <Text style={styles.textStyle}>Show Modal</Text>
          </TouchableHighlight>
        </View>
      );
    }
  }

  const styles = StyleSheet.create({
    centeredView: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      marginTop: 22
    },
    modalView: {
      margin: 20,
      backgroundColor: "white",
      borderRadius: 20,
      padding: 35,
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5
    },
    openButton: {
      backgroundColor: "#F194FF",
      borderRadius: 20,
      padding: 10,
      elevation: 2
    },
    textStyle: {
      color: "white",
      fontWeight: "bold",
      textAlign: "center"
    },
    modalText: {
      marginBottom: 15,
      textAlign: "center"
    }
  });

  export default App;
  ```
 */
class Modal extends React.Component<Props> {
  static defaultProps: {|hardwareAccelerated: boolean, visible: boolean|} = {
    visible: true,
    hardwareAccelerated: false,
  };

  static contextType: React.Context<RootTag> = RootTagContext;

  _identifier: number;
  _eventSubscription: ?EventSubscription;

  constructor(props: Props) {
    super(props);
    Modal._confirmProps(props);
    this._identifier = uniqueModalIdentifier++;
  }

  componentWillUnmount() {
    if (this.props.onDismiss != null) {
      this.props.onDismiss();
    }
  }

  UNSAFE_componentWillReceiveProps(nextProps: Props) {
    Modal._confirmProps(nextProps);
  }

  static _confirmProps(props: Props) {
    if (
      props.presentationStyle &&
      props.presentationStyle !== 'overFullScreen' &&
      props.transparent === true
    ) {
      console.warn(
        `Modal with '${props.presentationStyle}' presentation style and 'transparent' value is not supported.`,
      );
    }
  }

  render(): React.Node {
    if (this.props.visible !== true) {
      return null;
    }

    const containerStyles = {
      backgroundColor:
        this.props.transparent === true ? 'transparent' : 'white',
    };

    let animationType = this.props.animationType || 'none';

    let presentationStyle = this.props.presentationStyle;
    if (!presentationStyle) {
      presentationStyle = 'fullScreen';
      if (this.props.transparent === true) {
        presentationStyle = 'overFullScreen';
      }
    }

    const innerChildren = __DEV__ ? (
      <AppContainer rootTag={this.context}>{this.props.children}</AppContainer>
    ) : (
      this.props.children
    );

    return (
      <RCTModalHostView
        animationType={animationType}
        presentationStyle={presentationStyle}
        transparent={this.props.transparent}
        hardwareAccelerated={this.props.hardwareAccelerated}
        onRequestClose={this.props.onRequestClose}
        onShow={this.props.onShow}
        statusBarTranslucent={this.props.statusBarTranslucent}
        identifier={this._identifier}
        style={styles.modal}
        onStartShouldSetResponder={this._shouldSetResponder}
        supportedOrientations={this.props.supportedOrientations}
        onOrientationChange={this.props.onOrientationChange}>
        <VirtualizedListContextResetter>
          <ScrollView.Context.Provider value={null}>
            <View
              style={[styles.container, containerStyles]}
              collapsable={false}>
              {innerChildren}
            </View>
          </ScrollView.Context.Provider>
        </VirtualizedListContextResetter>
      </RCTModalHostView>
    );
  }

  // We don't want any responder events bubbling out of the modal.
  _shouldSetResponder(): boolean {
    return true;
  }
}

const side = I18nManager.getConstants().isRTL ? 'right' : 'left';
const styles = StyleSheet.create({
  modal: {
    position: 'absolute',
  },
  container: {
    /* $FlowFixMe(>=0.111.0 site=react_native_fb) This comment suppresses an
     * error found when Flow v0.111 was deployed. To see the error, delete this
     * comment and run Flow. */
    [side]: 0,
    top: 0,
    flex: 1,
  },
});

module.exports = Modal;
