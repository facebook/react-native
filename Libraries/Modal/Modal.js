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

const AppContainer = require('../ReactNative/AppContainer');
const I18nManager = require('../ReactNative/I18nManager');
import NativeEventEmitter from '../EventEmitter/NativeEventEmitter';
import NativeModalManager from './NativeModalManager';
const Platform = require('../Utilities/Platform');
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

const ModalEventEmitter =
  Platform.OS === 'ios' && NativeModalManager != null
    ? new NativeEventEmitter(NativeModalManager)
    : null;

/**
 * The Modal component is a simple way to present content above an enclosing view.
 *
 * See https://reactnative.dev/docs/modal.html
 */

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
   * The `animationType` prop controls how the modal animates.
   *
   * See https://reactnative.dev/docs/modal.html#animationtype
   */
  animationType?: ?('none' | 'slide' | 'fade'),

  /**
   * The `presentationStyle` prop controls how the modal appears.
   *
   * See https://reactnative.dev/docs/modal.html#presentationstyle
   */
  presentationStyle?: ?(
    | 'fullScreen'
    | 'pageSheet'
    | 'formSheet'
    | 'overFullScreen'
  ),

  /**
   * The `transparent` prop determines whether your modal will fill the
   * entire view.
   *
   * See https://reactnative.dev/docs/modal.html#transparent
   */
  transparent?: ?boolean,

  /**
   * The `statusBarTranslucent` prop determines whether your modal should go under
   * the system statusbar.
   *
   * See https://reactnative.dev/docs/modal.html#transparent
   */
  statusBarTranslucent?: ?boolean,

  /**
   * The `hardwareAccelerated` prop controls whether to force hardware
   * acceleration for the underlying window.
   *
   * This prop works only on Android.
   *
   * See https://reactnative.dev/docs/modal.html#hardwareaccelerated
   */
  hardwareAccelerated?: ?boolean,

  /**
   * The `visible` prop determines whether your modal is visible.
   *
   * See https://reactnative.dev/docs/modal.html#visible
   */
  visible?: ?boolean,

  /**
   * The `onRequestClose` callback is called when the user taps the hardware
   * back button on Android or the menu button on Apple TV.
   *
   * This is required on Apple TV and Android.
   *
   * See https://reactnative.dev/docs/modal.html#onrequestclose
   */
  onRequestClose?: ?DirectEventHandler<null>,

  /**
   * The `onShow` prop allows passing a function that will be called once the
   * modal has been shown.
   *
   * See https://reactnative.dev/docs/modal.html#onshow
   */
  onShow?: ?DirectEventHandler<null>,

  /**
   * The `onDismiss` prop allows passing a function that will be called once
   * the modal has been dismissed.
   *
   * See https://reactnative.dev/docs/modal.html#ondismiss
   */
  onDismiss?: ?() => mixed,

  /**
   * The `supportedOrientations` prop allows the modal to be rotated to any of the specified orientations.
   *
   * See https://reactnative.dev/docs/modal.html#supportedorientations
   */
  supportedOrientations?: ?$ReadOnlyArray<
    | 'portrait'
    | 'portrait-upside-down'
    | 'landscape'
    | 'landscape-left'
    | 'landscape-right',
  >,

  /**
   * The `onOrientationChange` callback is called when the orientation changes while the modal is being displayed.
   *
   * See https://reactnative.dev/docs/modal.html#onorientationchange
   */
  onOrientationChange?: ?DirectEventHandler<OrientationChangeEvent>,
|}>;

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
