/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {HostComponent} from '../../src/private/types/HostComponent';
import type {ProcessedColorValue} from '../StyleSheet/processColor';
import type {GestureResponderEvent} from '../Types/CoreEventTypes';
import type {TextProps} from './TextProps';

import {createViewConfig} from '../NativeComponent/ViewConfig';
import UIManager from '../ReactNative/UIManager';
import createReactNativeComponentClass from '../Renderer/shims/createReactNativeComponentClass';

export type NativeTextProps = $ReadOnly<{
  ...TextProps,
  isHighlighted?: ?boolean,
  selectionColor?: ?ProcessedColorValue,
  onClick?: ?(event: GestureResponderEvent) => mixed,
  // This is only needed for platforms that optimize text hit testing, e.g.,
  // react-native-windows. It can be used to only hit test virtual text spans
  // that have pressable events attached to them.
  isPressable?: ?boolean,
}>;

const textViewConfig = {
  validAttributes: {
    isHighlighted: true as const,
    isPressable: true as const,
    numberOfLines: true as const,
    ellipsizeMode: true as const,
    allowFontScaling: true as const,
    dynamicTypeRamp: true as const,
    maxFontSizeMultiplier: true as const,
    disabled: true as const,
    selectable: true as const,
    selectionColor: true as const,
    adjustsFontSizeToFit: true as const,
    minimumFontScale: true as const,
    textBreakStrategy: true as const,
    onTextLayout: true as const,
    dataDetectorType: true as const,
    android_hyphenationFrequency: true as const,
    lineBreakStrategyIOS: true as const,
  },
  directEventTypes: {
    topTextLayout: {
      registrationName: 'onTextLayout',
    },
  },
  uiViewClassName: 'RCTText',
};

const virtualTextViewConfig = {
  validAttributes: {
    isHighlighted: true as const,
    isPressable: true as const,
    maxFontSizeMultiplier: true as const,
  },
  uiViewClassName: 'RCTVirtualText',
};

export const NativeText: HostComponent<NativeTextProps> =
  (createReactNativeComponentClass('RCTText', () =>
    createViewConfig(textViewConfig),
  ): any);

export const NativeVirtualText: HostComponent<NativeTextProps> =
  !global.RN$Bridgeless && !UIManager.hasViewManagerConfig('RCTVirtualText')
    ? NativeText
    : (createReactNativeComponentClass('RCTVirtualText', () =>
        createViewConfig(virtualTextViewConfig),
      ): any);
