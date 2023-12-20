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

import ModalInjection from './ModalInjection';
import RCTModalHostView from './RCTModalHostViewNativeComponent';
import {VirtualizedListContextResetter} from '@react-native/virtualized-lists';

const ScrollView = require('../Components/ScrollView/ScrollView');
const View = require('../Components/View/View');
const AppContainer = require('../ReactNative/AppContainer');
const I18nManager = require('../ReactNative/I18nManager');
const {RootTagContext} = require('../ReactNative/RootTag');
const StyleSheet = require('../StyleSheet/StyleSheet');
const React = require('react');

/**
 * The Modal component is a simple way to present content above an enclosing view.
 *
 * See https://reactnative.dev/docs/modal
 */

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
|}>;

type State = {|
  isRendering: boolean,
|};

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
  }
}

class Modal extends React.Component<Props, State> {
  static defaultProps: {|hardwareAccelerated: boolean, visible: boolean|} = {
    visible: true,
    hardwareAccelerated: false,
  };

  static contextType: React.Context<RootTag> = RootTagContext;

  constructor(props: Props) {
    super(props);
    this.state = {
      isRendering: props.visible === true,
    };
    if (__DEV__) {
      confirmProps(props);
    }
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.visible !== true && this.props.visible === true) {
      this.setState({isRendering: true});
    }
    if (__DEV__) {
      confirmProps(this.props);
    }
  }

  render(): React.Node {
    if (this.props.visible !== true && !this.state.isRendering) {
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
        onDismiss={() => {
          this.setState({isRendering: false}, () => {
            if (this.props.onDismiss) {
              this.props.onDismiss();
            }
          });
        }}
        visible={this.props.visible}
        statusBarTranslucent={this.props.statusBarTranslucent}
        style={styles.modal}
        // $FlowFixMe[method-unbinding] added when improving typing for this parameters
        onStartShouldSetResponder={this._shouldSetResponder}
        supportedOrientations={this.props.supportedOrientations}
        onOrientationChange={this.props.onOrientationChange}
        testID={this.props.testID}>
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
    /* $FlowFixMe[invalid-computed-prop] (>=0.111.0 site=react_native_fb) This
     * comment suppresses an error found when Flow v0.111 was deployed. To see
     * the error, delete this comment and run Flow. */
    [side]: 0,
    top: 0,
    flex: 1,
  },
});

const ExportedModal: React.AbstractComponent<
  React.ElementConfig<typeof Modal>,
> = ModalInjection.unstable_Modal ?? Modal;

module.exports = ExportedModal;
