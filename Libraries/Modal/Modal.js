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

const Platform = require('Platform');
const PropTypes = require('react/lib/ReactPropTypes');
const React = require('React');
const StyleSheet = require('StyleSheet');
const UIManager = require('UIManager');
const View = require('View');
const deprecatedPropType = require('deprecatedPropType');

const requireNativeComponent = require('requireNativeComponent');
const RCTModalHostView = requireNativeComponent('RCTModalHostView', null);

/**
 * The Modal component is a simple way to present content above an enclosing view.
 *
 * _Note: If you need more control over how to present modals over the rest of your app,
 * then consider using a top-level Navigator. Go [here](/react-native/docs/navigator-comparison.html) to compare navigation options._
 *
 * ```javascript
 * import React, { Component } from 'react';
 * import { Modal, Text, TouchableHighlight, View } from 'react-native';
 *
 * class ModalExample extends Component {
 *
 *   constructor(props) {
 *     super(props);
 *     this.state = {modalVisible: false};
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
 *           animationType={"slide"}
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
class Modal extends React.Component {
  static propTypes = {
    /**
     * The `animationType` prop controls how the modal animates.
     *
     * - `slide` slides in from the bottom
     * - `fade` fades into view
     * - `none` appears without an animation
     */
    animationType: PropTypes.oneOf(['none', 'slide', 'fade']),
    /**
     * The `transparent` prop determines whether your modal will fill the entire view. Setting this to `true` will render the modal over a transparent background.
     */
    transparent: PropTypes.bool,
    /**
     * The `visible` prop determines whether your modal is visible.
     */
    visible: PropTypes.bool,
    /**
     * The `onRequestClose` prop allows passing a function that will be called once the modal has been dismissed.
     *
     * _On the Android platform, this is a required function._
     */
    onRequestClose: Platform.OS === 'android' ? PropTypes.func.isRequired : PropTypes.func,
    /**
     * The `onShow` prop allows passing a function that will be called once the modal has been shown.
     */
    onShow: PropTypes.func,
    animated: deprecatedPropType(
      PropTypes.bool,
      'Use the `animationType` prop instead.'
    ),
  };

  static defaultProps = {
    visible: true,
  };

  render(): ?ReactElement<any> {
    if (this.props.visible === false) {
      return null;
    }

    const containerStyles = {
      backgroundColor: this.props.transparent ? 'transparent' : 'white',
      top: Platform.OS === 'android' && Platform.Version >= 19 ? UIManager.RCTModalHostView.Constants.StatusBarHeight : 0,
    };

    let animationType = this.props.animationType;
    if (!animationType) {
      // manually setting default prop here to keep support for the deprecated 'animated' prop
      animationType = 'none';
      if (this.props.animated) {
        animationType = 'slide';
      }
    }

    return (
      <RCTModalHostView
        animationType={animationType}
        transparent={this.props.transparent}
        onRequestClose={this.props.onRequestClose}
        onShow={this.props.onShow}
        style={styles.modal}
        onStartShouldSetResponder={this._shouldSetResponder}
        >
        <View style={[styles.container, containerStyles]}>
          {this.props.children}
        </View>
      </RCTModalHostView>
    );
  }

  // We don't want any responder events bubbling out of the modal.
  _shouldSetResponder(): boolean {
    return true;
  }
}

const styles = StyleSheet.create({
  modal: {
    position: 'absolute',
  },
  container: {
    position: 'absolute',
    left: 0,
    top: 0,
  }
});

module.exports = Modal;
