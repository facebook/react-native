/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import type {ViewProps} from '../Components/View/ViewPropTypes';
import type {RootTag} from '../ReactNative/RootTag';
import type {DirectEventHandler} from '../Types/CodegenTypes';

import NativeEventEmitter from '../EventEmitter/NativeEventEmitter';
import {type EventSubscription} from '../vendor/emitter/EventEmitter';
import ModalInjection from './ModalInjection';
import NativeModalManager from './NativeModalManager';
import RCTModalHostView from './RCTModalHostViewNativeComponent';
import {VirtualizedListContextResetter} from '@react-native/virtualized-lists';

const ScrollView = require('../Components/ScrollView/ScrollView');
const View = require('../Components/View/View');
const AppContainer = require('../ReactNative/AppContainer');
const I18nManager = require('../ReactNative/I18nManager');
const {RootTagContext} = require('../ReactNative/RootTag');
const StyleSheet = require('../StyleSheet/StyleSheet');
const Platform = require('../Utilities/Platform');
const React = require('react');

type ModalEventDefinitions = {
  modalDismissed: [{modalID: number}],
};

const ModalEventEmitter =
  Platform.OS === 'ios' && NativeModalManager != null
    ? new NativeEventEmitter<ModalEventDefinitions>(
        // T88715063: NativeEventEmitter only used this parameter on iOS. Now it uses it on all platforms, so this code was modified automatically to preserve its behavior
        // If you want to use the native module on other platforms, please remove this condition and test its behavior
        Platform.OS !== 'ios' ? null : NativeModalManager,
      )
    : null;

/**
 * The Modal component is a simple way to present content above an enclosing view.
 *
 * See https://reactnative.dev/docs/modal
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
   * See https://reactnative.dev/docs/modal#animationtype
   */
  animationType?: ?('none' | 'slide' | 'fade'),

  /**
   * The `presentationStyle` prop controls how the modal appears.
   *
   * See https://reactnative.dev/docs/modal#presentationstyle
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
   * See https://reactnative.dev/docs/modal#transparent
   */
  transparent?: ?boolean,

  /**
   * The `statusBarTranslucent` prop determines whether your modal should go under
   * the system statusbar.
   *
   * See https://reactnative.dev/docs/modal.html#statusbartranslucent-android
   */
  statusBarTranslucent?: ?boolean,

  /**
   * The `navigationBarTranslucent` prop determines whether your modal should go under
   * the system navigationbar.
   *
   * See https://reactnative.dev/docs/modal.html#navigationbartranslucent-android
   */
  navigationBarTranslucent?: ?boolean,

  /**
   * The `hardwareAccelerated` prop controls whether to force hardware
   * acceleration for the underlying window.
   *
   * This prop works only on Android.
   *
   * See https://reactnative.dev/docs/modal#hardwareaccelerated
   */
  hardwareAccelerated?: ?boolean,

  /**
   * The `visible` prop determines whether your modal is visible.
   *
   * See https://reactnative.dev/docs/modal#visible
   */
  visible?: ?boolean,

  /**
   * The `onRequestClose` callback is called when the user taps the hardware
   * back button on Android or the menu button on Apple TV.
   *
   * This is required on Apple TV and Android.
   *
   * See https://reactnative.dev/docs/modal#onrequestclose
   */
  onRequestClose?: ?DirectEventHandler<null>,

  /**
   * The `onShow` prop allows passing a function that will be called once the
   * modal has been shown.
   *
   * See https://reactnative.dev/docs/modal#onshow
   */
  onShow?: ?DirectEventHandler<null>,

  /**
   * The `onDismiss` prop allows passing a function that will be called once
   * the modal has been dismissed.
   *
   * See https://reactnative.dev/docs/modal#ondismiss
   */
  onDismiss?: ?() => mixed,

  /**
   * The `supportedOrientations` prop allows the modal to be rotated to any of the specified orientations.
   *
   * See https://reactnative.dev/docs/modal#supportedorientations
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
   * See https://reactnative.dev/docs/modal#onorientationchange
   */
  onOrientationChange?: ?DirectEventHandler<OrientationChangeEvent>,

  /**
   * The `backdropColor` props sets the background color of the modal's container.
   * Defaults to `white` if not provided and transparent is `false`. Ignored if `transparent` is `true`.
   */
  backdropColor?: ?string,
|}>;

function confirmProps(props: Props) {
  if (__DEV__) {
    if (
      props.presentationStyle &&
      props.presentationStyle !== 'overFullScreen' &&
      props.transparent === true
    ) {
      console.warn(
        `Modal with '${props.presentationStyle}' presentation style and 'transparent' value is not supported.`,
      );
    }
    if (
      props.navigationBarTranslucent === true &&
      props.statusBarTranslucent !== true
    ) {
      console.warn(
        'Modal with translucent navigation bar and without translucent status bar is not supported.',
      );
    }
  }
}

// Create a state to track whether the Modal is rendering or not.
// This is the only prop that controls whether the modal is rendered or not.
type State = {
  isRendered: boolean,
};

class Modal extends React.Component<Props, State> {
  static defaultProps: {|hardwareAccelerated: boolean, visible: boolean|} = {
    visible: true,
    hardwareAccelerated: false,
  };

  static contextType: React.Context<RootTag> = RootTagContext;

  _identifier: number;
  _eventSubscription: ?EventSubscription;

  constructor(props: Props) {
    super(props);
    if (__DEV__) {
      confirmProps(props);
    }
    this._identifier = uniqueModalIdentifier++;
    this.state = {
      isRendered: props.visible === true,
    };
  }

  componentDidMount() {
    // 'modalDismissed' is for the old renderer in iOS only
    if (ModalEventEmitter) {
      this._eventSubscription = ModalEventEmitter.addListener(
        'modalDismissed',
        event => {
          this.setState({isRendered: false}, () => {
            if (event.modalID === this._identifier && this.props.onDismiss) {
              this.props.onDismiss();
            }
          });
        },
      );
    }
  }

  componentWillUnmount() {
    if (Platform.OS === 'ios') {
      this.setState({isRendered: false});
    }
    if (this._eventSubscription) {
      this._eventSubscription.remove();
    }
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.visible === false && this.props.visible === true) {
      this.setState({isRendered: true});
    }

    if (__DEV__) {
      confirmProps(this.props);
    }
  }

  // Helper function to encapsulate platform specific logic to show or not the Modal.
  _shouldShowModal(): boolean {
    if (Platform.OS === 'ios') {
      return this.props.visible === true || this.state.isRendered === true;
    }

    return this.props.visible === true;
  }

  render(): React.Node {
    if (!this._shouldShowModal()) {
      return null;
    }

    const containerStyles = {
      backgroundColor:
        this.props.transparent === true
          ? 'transparent'
          : this.props.backdropColor ?? 'white',
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

    const onDismiss = () => {
      // OnDismiss is implemented on iOS only.
      if (Platform.OS === 'ios') {
        this.setState({isRendered: false}, () => {
          if (this.props.onDismiss) {
            this.props.onDismiss();
          }
        });
      }
    };

    return (
      <RCTModalHostView
        animationType={animationType}
        presentationStyle={presentationStyle}
        transparent={this.props.transparent}
        hardwareAccelerated={this.props.hardwareAccelerated}
        onRequestClose={this.props.onRequestClose}
        onShow={this.props.onShow}
        onDismiss={onDismiss}
        visible={this.props.visible}
        statusBarTranslucent={this.props.statusBarTranslucent}
        navigationBarTranslucent={this.props.navigationBarTranslucent}
        identifier={this._identifier}
        style={styles.modal}
        // $FlowFixMe[method-unbinding] added when improving typing for this parameters
        onStartShouldSetResponder={this._shouldSetResponder}
        supportedOrientations={this.props.supportedOrientations}
        onOrientationChange={this.props.onOrientationChange}
        testID={this.props.testID}>
        <VirtualizedListContextResetter>
          <ScrollView.Context.Provider value={null}>
            <View
              // $FlowFixMe[incompatible-type]
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
    /* $FlowFixMe[invalid-computed-prop] (>=0.111.0 site=react_native_fb) This
     * comment suppresses an error found when Flow v0.111 was deployed. To see
     * the error, delete this comment and run Flow. */
    // $FlowFixMe[incompatible-call]
    [side]: 0,
    top: 0,
    flex: 1,
  },
});

const ExportedModal: React.ComponentType<React.ElementConfig<typeof Modal>> =
  ModalInjection.unstable_Modal ?? Modal;

module.exports = ExportedModal;
