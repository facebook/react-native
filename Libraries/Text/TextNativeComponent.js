/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import ReactNativeViewAttributes from '../Components/View/ReactNativeViewAttributes';
import UIManager from '../ReactNative/UIManager';
import {type HostComponent} from '../Renderer/shims/ReactNativeTypes';
import createReactNativeComponentClass from '../Renderer/shims/createReactNativeComponentClass';
import {type ProcessedColorValue} from '../StyleSheet/processColor';
import {type TextProps} from './TextProps';

type NativeTextProps = $ReadOnly<{
  ...TextProps,
  isHighlighted?: ?boolean,
  selectionColor?: ?ProcessedColorValue,
}>;

export const NativeText: HostComponent<NativeTextProps> = (createReactNativeComponentClass(
  'RCTText',
  () => ({
    // $FlowFixMe[incompatible-call]
    validAttributes: {
      ...ReactNativeViewAttributes.UIView,
      isHighlighted: true,
      numberOfLines: true,
      ellipsizeMode: true,
      allowFontScaling: true,
      maxFontSizeMultiplier: true,
      disabled: true,
      selectable: true,
      selectionColor: true,
      adjustsFontSizeToFit: true,
      minimumFontScale: true,
      textBreakStrategy: true,
      onTextLayout: true,
      onInlineViewLayout: true,
      dataDetectorType: true,
      android_hyphenationFrequency: true,
    },
    directEventTypes: {
      topTextLayout: {
        registrationName: 'onTextLayout',
      },
      topInlineViewLayout: {
        registrationName: 'onInlineViewLayout',
      },
    },
    uiViewClassName: 'RCTText',
  }),
): any);

export const NativeVirtualText: HostComponent<NativeTextProps> =
  !global.RN$Bridgeless && !UIManager.hasViewManagerConfig('RCTVirtualText')
    ? NativeText
    : (createReactNativeComponentClass('RCTVirtualText', () => ({
        // $FlowFixMe[incompatible-call]
        validAttributes: {
          ...ReactNativeViewAttributes.UIView,
          isHighlighted: true,
          maxFontSizeMultiplier: true,
        },
        uiViewClassName: 'RCTVirtualText',
      })): any);
