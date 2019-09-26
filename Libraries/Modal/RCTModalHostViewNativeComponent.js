/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const requireNativeComponent = require('../ReactNative/requireNativeComponent');

import type {ViewProps} from '../Components/View/ViewPropTypes';
import type {SyntheticEvent} from '../Types/CoreEventTypes';
import type {NativeComponent} from '../Renderer/shims/ReactNative';

type OrientationChangeEvent = SyntheticEvent<
  $ReadOnly<{|
    orientation: 'portrait' | 'landscape',
  |}>,
>;

type ModalNativeProps = $ReadOnly<{|
  ...ViewProps,

  /**
   * The `animationType` prop controls how the modal animates.
   *
   * See https://facebook.github.io/react-native/docs/modal.html#animationtype
   */
  animationType?: ?('none' | 'slide' | 'fade'),

  /**
   * The `presentationStyle` prop controls how the modal appears.
   *
   * See https://facebook.github.io/react-native/docs/modal.html#presentationstyle
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
   * See https://facebook.github.io/react-native/docs/modal.html#transparent
   */
  transparent?: ?boolean,

  /**
   * The `hardwareAccelerated` prop controls whether to force hardware
   * acceleration for the underlying window.
   *
   * See https://facebook.github.io/react-native/docs/modal.html#hardwareaccelerated
   */
  hardwareAccelerated?: ?boolean,

  /**
   * The `visible` prop determines whether your modal is visible.
   *
   * See https://facebook.github.io/react-native/docs/modal.html#visible
   */
  visible?: ?boolean,

  /**
   * The `onRequestClose` callback is called when the user taps the hardware
   * back button on Android or the menu button on Apple TV.
   *
   * This is required on Apple TV and Android.
   *
   * See https://facebook.github.io/react-native/docs/modal.html#onrequestclose
   */
  onRequestClose?: ?(event?: SyntheticEvent<null>) => mixed,

  /**
   * The `onShow` prop allows passing a function that will be called once the
   * modal has been shown.
   *
   * See https://facebook.github.io/react-native/docs/modal.html#onshow
   */
  onShow?: ?(event?: SyntheticEvent<null>) => mixed,

  /**
   * The `onDismiss` prop allows passing a function that will be called once
   * the modal has been dismissed.
   *
   * See https://facebook.github.io/react-native/docs/modal.html#ondismiss
   */
  onDismiss?: ?() => mixed,

  /**
   * Deprecated. Use the `animationType` prop instead.
   */
  animated?: ?boolean,

  /**
   * The `supportedOrientations` prop allows the modal to be rotated to any of the specified orientations.
   *
   * See https://facebook.github.io/react-native/docs/modal.html#supportedorientations
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
   * See https://facebook.github.io/react-native/docs/modal.html#onorientationchange
   */
  onOrientationChange?: ?(event: OrientationChangeEvent) => mixed,

  /**
   * The `identifier` is the unique number for identifying Modal components.
   */
  identifier?: ?number,
|}>;

type RCTModalHostViewNativeType = Class<NativeComponent<ModalNativeProps>>;

module.exports = ((requireNativeComponent(
  'RCTModalHostView',
): any): RCTModalHostViewNativeType);
