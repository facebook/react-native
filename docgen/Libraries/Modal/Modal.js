/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule Modal
 * @flow
 */
'use strict';

const AppContainer = require('AppContainer');
const I18nManager = require('I18nManager');
const Platform = require('Platform');
const React = require('React');
const PropTypes = require('prop-types');
const StyleSheet = require('StyleSheet');
const View = require('View');

const deprecatedPropType = require('deprecatedPropType');
const requireNativeComponent = require('requireNativeComponent');
const RCTModalHostView = requireNativeComponent('RCTModalHostView', null);

/**
 * The Modal component is a simple way to present content above an enclosing view.
 *
 * _Note: If you need more control over how to present modals over the rest of your app,
 * then consider using a top-level Navigator._
 *
 * ```javascript
 * import React, { Component } from 'react';
 * import { Modal, Text, TouchableHighlight, View } from 'react-native';
 *
 * class ModalExample extends Component {
 *
 *   state = {
 *     modalVisible: false,
 *   }
 *
 *   setModalVisible(visible) {
 *     this.setState({modalVisible: visible});
 *   }
 *
 *   render() {
 *     return (
 *       <View style={{marginTop: 22}}>
 *         <Modal
 *           animationType="slide"
 *           transparent={false}
 *           visible={this.state.modalVisible}
 *           onRequestClose={() => {alert("Modal has been closed.")}}
 *           >
 *          <View style={{marginTop: 22}}>
 *           <View>
 *             <Text>Hello World!</Text>
 *
 *             <TouchableHighlight onPress={() => {
 *               this.setModalVisible(!this.state.modalVisible)
 *             }}>
 *               <Text>Hide Modal</Text>
 *             </TouchableHighlight>
 *
 *           </View>
 *          </View>
 *         </Modal>
 *
 *         <TouchableHighlight onPress={() => {
 *           this.setModalVisible(true)
 *         }}>
 *           <Text>Show Modal</Text>
 *         </TouchableHighlight>
 *
 *       </View>
 *     );
 *   }
 * }
 * ```
 */

class Modal extends React.Component<Object> {
  static propTypes = {
    /**
     * The `animationType` prop controls how the modal animates.
     *
     * - `slide` slides in from the bottom
     * - `fade` fades into view
     * - `none` appears without an animation
     *
     * Default is set to `none`.
     */
    animationType: PropTypes.oneOf(['none', 'slide', 'fade']),
    /**
     * The `presentationStyle` prop controls how the modal appears (generally on larger devices such as iPad or plus-sized iPhones).
     * See https://developer.apple.com/reference/uikit/uimodalpresentationstyle for details.
     * @platform ios
     *
     * - `fullScreen` covers the screen completely
     * - `pageSheet` covers portrait-width view centered (only on larger devices)
     * - `formSheet` covers narrow-width view centered (only on larger devices)
     * - `overFullScreen` covers the screen completely, but allows transparency
     *
     * Default is set to `overFullScreen` or `fullScreen` depending on `transparent` property.
     */
    presentationStyle: PropTypes.oneOf(['fullScreen', 'pageSheet', 'formSheet', 'overFullScreen']),
    /**
     * The `transparent` prop determines whether your modal will fill the entire view. Setting this to `true` will render the modal over a transparent background.
     */
    transparent: PropTypes.bool,
    /**
     * The `hardwareAccelerated` prop controls whether to force hardware acceleration for the underlying window.
     * @platform android
     */
    hardwareAccelerated: PropTypes.bool,
    /**
     * The `visible` prop determines whether your modal is visible.
     */
    visible: PropTypes.bool,
    /**
     * The `onRequestClose` callback is called when the user taps the hardware back button on Android or the menu button on Apple TV.
     */
    onRequestClose: (Platform.isTVOS || Platform.OS === 'android') ? PropTypes.func.isRequired : PropTypes.func,
    /**
     * The `onShow` prop allows passing a function that will be called once the modal has been shown.
     */
    onShow: PropTypes.func,
    animated: deprecatedPropType(
      PropTypes.bool,
      'Use the `animationType` prop instead.'
    ),
    /**
     * The `supportedOrientations` prop allows the modal to be rotated to any of the specified orientations.
     * On iOS, the modal is still restricted by what's specified in your app's Info.plist's UISupportedInterfaceOrientations field.
     * When using `presentationStyle` of `pageSheet` or `formSheet`, this property will be ignored by iOS.
     * @platform ios
     */
    supportedOrientations: PropTypes.arrayOf(PropTypes.oneOf(['portrait', 'portrait-upside-down', 'landscape', 'landscape-left', 'landscape-right'])),
    /**
     * The `onOrientationChange` callback is called when the orientation changes while the modal is being displayed.
     * The orientation provided is only 'portrait' or 'landscape'. This callback is also called on initial render, regardless of the current orientation.
     * @platform ios
     */
    onOrientationChange: PropTypes.func,
  };

  static defaultProps = {
    visible: true,
    hardwareAccelerated: false,
  };

  static contextTypes = {
    rootTag: PropTypes.number,
  };

  constructor(props: Object) {
    super(props);
    Modal._confirmProps(props);
  }

  componentWillReceiveProps(nextProps: Object) {
    Modal._confirmProps(nextProps);
  }

  static _confirmProps(props: Object) {
    if (props.presentationStyle && props.presentationStyle !== 'overFullScreen' && props.transparent) {
      console.warn(`Modal with '${props.presentationStyle}' presentation style and 'transparent' value is not supported.`);
    }
  }

  render(): React.Node {
    if (this.props.visible === false) {
      return null;
    }

    const containerStyles = {
      backgroundColor: this.props.transparent ? 'transparent' : 'white',
    };

    let animationType = this.props.animationType;
    if (!animationType) {
      // manually setting default prop here to keep support for the deprecated 'animated' prop
      animationType = 'none';
      if (this.props.animated) {
        animationType = 'slide';
      }
    }

    let presentationStyle = this.props.presentationStyle;
    if (!presentationStyle) {
      presentationStyle = 'fullScreen';
      if (this.props.transparent) {
        presentationStyle = 'overFullScreen';
      }
    }

    const innerChildren = __DEV__ ?
      ( <AppContainer rootTag={this.context.rootTag}>
          {this.props.children}
        </AppContainer>) :
      this.props.children;

    return (
      <RCTModalHostView
        animationType={animationType}
        presentationStyle={presentationStyle}
        transparent={this.props.transparent}
        hardwareAccelerated={this.props.hardwareAccelerated}
        onRequestClose={this.props.onRequestClose}
        onShow={this.props.onShow}
        style={styles.modal}
        onStartShouldSetResponder={this._shouldSetResponder}
        supportedOrientations={this.props.supportedOrientations}
        onOrientationChange={this.props.onOrientationChange}
        >
        <View style={[styles.container, containerStyles]}>
          {innerChildren}
        </View>
      </RCTModalHostView>
    );
  }

  // We don't want any responder events bubbling out of the modal.
  _shouldSetResponder(): boolean {
    return true;
  }
}

const side = I18nManager.isRTL ? 'right' : 'left';
const styles = StyleSheet.create({
  modal: {
    position: 'absolute',
  },
  container: {
    position: 'absolute',
    [side] : 0,
    top: 0,
  }
});

module.exports = Modal;
