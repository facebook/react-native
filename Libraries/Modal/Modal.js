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
const PropTypes = require('ReactPropTypes');
const React = require('React');
const StyleSheet = require('StyleSheet');
const UIManager = require('UIManager');
const View = require('View');
const deprecatedPropType = require('deprecatedPropType');

const requireNativeComponent = require('requireNativeComponent');
const RCTModalHostView = requireNativeComponent('RCTModalHostView', null);

/**
 * A Modal component covers the native view (e.g. UIViewController, Activity)
 * that contains the React Native root.
 *
 * Use Modal in hybrid apps that embed React Native; Modal allows the portion of
 * your app written in React Native to present content above the enclosing
 * native view hierarchy.
 *
 * In apps written with React Native from the root view down, you should use
 * Navigator instead of Modal. With a top-level Navigator, you have more control
 * over how to present the modal scene over the rest of your app by using the
 * configureScene property.
 */
class Modal extends React.Component {
  static propTypes = {
    animated: deprecatedPropType(
      PropTypes.bool,
      'Use the `animationType` prop instead.'
    ),
    animationType: PropTypes.oneOf(['none', 'slide', 'fade']),
    transparent: PropTypes.bool,
    visible: PropTypes.bool,
    onRequestClose: Platform.OS === 'android' ? PropTypes.func.isRequired : PropTypes.func,
    onShow: PropTypes.func,
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
