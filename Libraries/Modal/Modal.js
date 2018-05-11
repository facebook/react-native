/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const AppContainer = require('AppContainer');
const I18nManager = require('I18nManager');
const NativeEventEmitter = require('NativeEventEmitter');
const NativeModules = require('NativeModules');
const Platform = require('Platform');
const React = require('React');
const PropTypes = require('prop-types');
const StyleSheet = require('StyleSheet');
const View = require('View');

const deprecatedPropType = require('deprecatedPropType');
const requireNativeComponent = require('requireNativeComponent');
const RCTModalHostView = requireNativeComponent('RCTModalHostView', null);
const ModalEventEmitter =
  Platform.OS === 'ios' && NativeModules.ModalManager
    ? new NativeEventEmitter(NativeModules.ModalManager)
    : null;

import type EmitterSubscription from 'EmitterSubscription';

/**
 * The Modal component is a simple way to present content above an enclosing view.
 *
 * See https://facebook.github.io/react-native/docs/modal.html
 */

// In order to route onDismiss callbacks, we need to uniquely identifier each
// <Modal> on screen. There can be different ones, either nested or as siblings.
// We cannot pass the onDismiss callback to native as the view will be
// destroyed before the callback is fired.
let uniqueModalIdentifier = 0;

class Modal extends React.Component<Object> {
  static propTypes = {
    /**
     * The `animationType` prop controls how the modal animates.
     *
     * See https://facebook.github.io/react-native/docs/modal.html#animationtype
     */
    animationType: PropTypes.oneOf(['none', 'slide', 'fade']),
    /**
     * The `presentationStyle` prop controls how the modal appears.
     *
     * See https://facebook.github.io/react-native/docs/modal.html#presentationstyle
     */
    presentationStyle: PropTypes.oneOf([
      'fullScreen',
      'pageSheet',
      'formSheet',
      'overFullScreen',
    ]),
    /**
     * The `transparent` prop determines whether your modal will fill the
     * entire view.
     *
     * See https://facebook.github.io/react-native/docs/modal.html#transparent
     */
    transparent: PropTypes.bool,
    /**
     * The `hardwareAccelerated` prop controls whether to force hardware
     * acceleration for the underlying window.
     *
     * See https://facebook.github.io/react-native/docs/modal.html#hardwareaccelerated
     */
    hardwareAccelerated: PropTypes.bool,
    /**
     * The `visible` prop determines whether your modal is visible.
     *
     * See https://facebook.github.io/react-native/docs/modal.html#visible
     */
    visible: PropTypes.bool,
    /**
     * The `onRequestClose` callback is called when the user taps the hardware
     * back button on Android or the menu button on Apple TV.
     *
     * See https://facebook.github.io/react-native/docs/modal.html#onrequestclose
     */
    onRequestClose:
      Platform.isTVOS || Platform.OS === 'android'
        ? PropTypes.func.isRequired
        : PropTypes.func,
    /**
     * The `onShow` prop allows passing a function that will be called once the
     * modal has been shown.
     *
     * See https://facebook.github.io/react-native/docs/modal.html#onshow
     */
    onShow: PropTypes.func,
    /**
     * The `onDismiss` prop allows passing a function that will be called once
     * the modal has been dismissed.
     *
     * See https://facebook.github.io/react-native/docs/modal.html#ondismiss
     */
    onDismiss: PropTypes.func,
    animated: deprecatedPropType(
      PropTypes.bool,
      'Use the `animationType` prop instead.',
    ),
    /**
     * The `supportedOrientations` prop allows the modal to be rotated to any of the specified orientations.
     *
     * See https://facebook.github.io/react-native/docs/modal.html#supportedorientations
     */
    supportedOrientations: PropTypes.arrayOf(
      PropTypes.oneOf([
        'portrait',
        'portrait-upside-down',
        'landscape',
        'landscape-left',
        'landscape-right',
      ]),
    ),
    /**
     * The `onOrientationChange` callback is called when the orientation changes while the modal is being displayed.
     *
     * See https://facebook.github.io/react-native/docs/modal.html#onorientationchange
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

  _identifier: number;
  _eventSubscription: ?EmitterSubscription;

  constructor(props: Object) {
    super(props);
    Modal._confirmProps(props);
    this._identifier = uniqueModalIdentifier++;
  }

  static childContextTypes = {
    virtualizedList: PropTypes.object,
  };

  getChildContext() {
    // Reset the context so VirtualizedList doesn't get confused by nesting
    // in the React tree that doesn't reflect the native component heirarchy.
    return {
      virtualizedList: null,
    };
  }

  componentDidMount() {
    if (ModalEventEmitter) {
      this._eventSubscription = ModalEventEmitter.addListener(
        'modalDismissed',
        event => {
          if (event.modalID === this._identifier && this.props.onDismiss) {
            this.props.onDismiss();
          }
        },
      );
    }
  }

  componentWillUnmount() {
    if (this._eventSubscription) {
      this._eventSubscription.remove();
    }
  }

  UNSAFE_componentWillReceiveProps(nextProps: Object) {
    Modal._confirmProps(nextProps);
  }

  static _confirmProps(props: Object) {
    if (
      props.presentationStyle &&
      props.presentationStyle !== 'overFullScreen' &&
      props.transparent
    ) {
      console.warn(
        `Modal with '${
          props.presentationStyle
        }' presentation style and 'transparent' value is not supported.`,
      );
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

    const innerChildren = __DEV__ ? (
      <AppContainer rootTag={this.context.rootTag}>
        {this.props.children}
      </AppContainer>
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
        identifier={this._identifier}
        style={styles.modal}
        onStartShouldSetResponder={this._shouldSetResponder}
        supportedOrientations={this.props.supportedOrientations}
        onOrientationChange={this.props.onOrientationChange}>
        <View style={[styles.container, containerStyles]}>{innerChildren}</View>
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
    [side]: 0,
    top: 0,
  },
});

module.exports = Modal;
