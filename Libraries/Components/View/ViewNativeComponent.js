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

const React = require('react');
const Platform = require('../../Utilities/Platform');
const ReactNative = require('../../Renderer/shims/ReactNative');
const ReactNativeViewViewConfigAndroid = require('./ReactNativeViewViewConfigAndroid');

const registerGeneratedViewConfig = require('../../Utilities/registerGeneratedViewConfig');
const requireNativeComponent = require('../../ReactNative/requireNativeComponent');
const codegenNativeCommands = require('../../Utilities/codegenNativeCommands')
  .default;

import type {Int32} from '../../Types/CodegenTypes';
import type {ViewProps} from './ViewPropTypes';

export type ViewNativeComponentType = Class<
  ReactNative.NativeComponent<ViewProps>,
>;

let NativeViewComponent;
let viewConfig:
  | {...}
  | {|
      bubblingEventTypes?: $ReadOnly<{
        [eventName: string]: $ReadOnly<{|
          phasedRegistrationNames: $ReadOnly<{|
            bubbled: string,
            captured: string,
          |}>,
        |}>,
      }>,
      directEventTypes?: $ReadOnly<{
        [eventName: string]: $ReadOnly<{|registrationName: string|}>,
      }>,
      uiViewClassName: string,
      validAttributes?: {
        [propName: string]:
          | true
          | $ReadOnly<{|
              diff?: <T>(arg1: any, arg2: any) => boolean,
              process?: (arg1: any) => any,
            |}>,
      },
    |};

// Only use the JS view config in DEV
if (__DEV__) {
  // On Android, View extends the base component with additional view-only props
  // On iOS, the base component is View
  if (Platform.OS === 'android') {
    viewConfig = ReactNativeViewViewConfigAndroid;
    registerGeneratedViewConfig('RCTView', ReactNativeViewViewConfigAndroid);
  } else {
    viewConfig = {};
    registerGeneratedViewConfig('RCTView', {uiViewClassName: 'RCTView'});
  }

  NativeViewComponent = 'RCTView';
} else {
  NativeViewComponent = requireNativeComponent('RCTView');
}

// These commands are Android only
interface NativeCommands {
  +hotspotUpdate: (
    viewRef: React.ElementRef<ViewNativeComponentType>,
    x: Int32,
    y: Int32,
  ) => void;
  +setPressed: (
    viewRef: React.ElementRef<ViewNativeComponentType>,
    pressed: boolean,
  ) => void;
}

export const Commands: NativeCommands = codegenNativeCommands<NativeCommands>({
  supportedCommands: ['hotspotUpdate', 'setPressed'],
});

export const __INTERNAL_VIEW_CONFIG = viewConfig;
export default ((NativeViewComponent: any): ViewNativeComponentType);
