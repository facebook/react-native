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

import codegenNativeComponent from '../Utilities/codegenNativeComponent';
import type {HostComponent} from '../Renderer/shims/ReactNativeTypes';
import type {
  WithDefault,
  DirectEventHandler,
  BubblingEventHandler,
  Int32,
} from '../Types/CodegenTypes';

import type {ViewProps} from '../Components/View/ViewPropTypes';

type OrientationChangeEvent = $ReadOnly<{|
  orientation: 'portrait' | 'landscape',
|}>;

type NativeProps = $ReadOnly<{|
  ...ViewProps,

  /**
   * The `animationType` prop controls how the modal animates.
   *
   * See https://facebook.github.io/react-native/docs/modal.html#animationtype
   */
  animationType?: WithDefault<'none' | 'slide' | 'fade', 'none'>,

  /**
   * The `presentationStyle` prop controls how the modal appears.
   *
   * See https://facebook.github.io/react-native/docs/modal.html#presentationstyle
   */
  presentationStyle?: WithDefault<
    'fullScreen' | 'pageSheet' | 'formSheet' | 'overFullScreen',
    'fullScreen',
  >,

  /**
   * The `transparent` prop determines whether your modal will fill the
   * entire view.
   *
   * See https://facebook.github.io/react-native/docs/modal.html#transparent
   */
  transparent?: WithDefault<boolean, false>,

  /**
   * The `statusBarTranslucent` prop determines whether your modal should go under
   * the system statusbar.
   *
   * See https://facebook.github.io/react-native/docs/modal.html#statusBarTranslucent
   */
  statusBarTranslucent?: WithDefault<boolean, false>,

  /**
   * The `hardwareAccelerated` prop controls whether to force hardware
   * acceleration for the underlying window.
   *
   * See https://facebook.github.io/react-native/docs/modal.html#hardwareaccelerated
   */
  hardwareAccelerated?: WithDefault<boolean, false>,

  /**
   * The `onRequestClose` callback is called when the user taps the hardware
   * back button on Android or the menu button on Apple TV.
   *
   * This is required on Apple TV and Android.
   *
   * See https://facebook.github.io/react-native/docs/modal.html#onrequestclose
   */
  onRequestClose?: ?DirectEventHandler<null>,

  /**
   * The `onShow` prop allows passing a function that will be called once the
   * modal has been shown.
   *
   * See https://facebook.github.io/react-native/docs/modal.html#onshow
   */
  onShow?: ?DirectEventHandler<null>,

  /**
   * The `onDismiss` prop allows passing a function that will be called once
   * the modal has been dismissed.
   *
   * See https://facebook.github.io/react-native/docs/modal.html#ondismiss
   */
  onDismiss?: ?BubblingEventHandler<null>,

  /**
   * Deprecated. Use the `animationType` prop instead.
   */
  animated?: WithDefault<boolean, false>,

  /**
   * The `supportedOrientations` prop allows the modal to be rotated to any of the specified orientations.
   *
   * See https://facebook.github.io/react-native/docs/modal.html#supportedorientations
   */
  supportedOrientations?: WithDefault<
    $ReadOnlyArray<
      | 'portrait'
      | 'portrait-upside-down'
      | 'landscape'
      | 'landscape-left'
      | 'landscape-right',
    >,
    'portrait',
  >,

  /**
   * The `onOrientationChange` callback is called when the orientation changes while the modal is being displayed.
   *
   * See https://facebook.github.io/react-native/docs/modal.html#onorientationchange
   */
  onOrientationChange?: ?DirectEventHandler<OrientationChangeEvent>,

  /**
   * The `identifier` is the unique number for identifying Modal components.
   */
  identifier?: WithDefault<Int32, 0>,
|}>;

export default (codegenNativeComponent<NativeProps>('ModalHostView', {
  interfaceOnly: true,
  paperComponentName: 'RCTModalHostView',
}): HostComponent<NativeProps>);
