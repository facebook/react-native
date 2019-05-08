/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

const Platform = require('../../Utilities/Platform');
const React = require('react');
const View = require('../View/View');

import type {ViewProps} from '../View/ViewPropTypes';
import type {NativeComponent} from '../../Renderer/shims/ReactNative';

type Props = $ReadOnly<{|
  ...ViewProps,
  emulateUnlessSupported?: boolean,
|}>;

let exported;

/**
 * Renders nested content and automatically applies paddings reflect the portion
 * of the view that is not covered by navigation bars, tab bars, toolbars, and
 * other ancestor views.
 *
 * Moreover, and most importantly, Safe Area's paddings reflect physical
 * limitation of the screen, such as rounded corners or camera notches (aka
 * sensor housing area on iPhone X).
 */
if (Platform.OS === 'android') {
  const SafeAreaView = (
    props: Props,
    forwardedRef?: ?React.Ref<typeof View>,
  ) => {
    const {emulateUnlessSupported, ...localProps} = props;
    return <View {...localProps} ref={forwardedRef} />;
  };

  const SafeAreaViewRef = React.forwardRef(SafeAreaView);
  SafeAreaViewRef.displayName = 'SafeAreaView';
  exported = ((SafeAreaViewRef: any): Class<React.Component<Props>>);
} else {
  const RCTSafeAreaViewNativeComponent = require('./RCTSafeAreaViewNativeComponent');

  const SafeAreaView = (
    props: Props,
    forwardedRef?: ?React.Ref<typeof RCTSafeAreaViewNativeComponent>,
  ) => {
    return (
      <RCTSafeAreaViewNativeComponent
        emulateUnlessSupported={true}
        {...props}
        ref={forwardedRef}
      />
    );
  };

  const SafeAreaViewRef = React.forwardRef(SafeAreaView);
  SafeAreaViewRef.displayName = 'SafeAreaView';
  exported = ((SafeAreaViewRef: any): Class<NativeComponent<Props>>);
}

module.exports = exported;
