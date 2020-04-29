/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const Platform = require('../../Utilities/Platform');
const React = require('react');
const View = require('../View/View');

<<<<<<< HEAD
import type {NativeComponent} from '../../Renderer/shims/ReactNative';
=======
import type {HostComponent} from '../../Renderer/shims/ReactNativeTypes';
>>>>>>> fb/0.62-stable
import type {ViewProps} from '../View/ViewPropTypes';

type Props = $ReadOnly<{|
  ...ViewProps,
  emulateUnlessSupported?: boolean,
|}>;

<<<<<<< HEAD
let exported: Class<React$Component<Props>> | Class<NativeComponent<Props>>;
=======
let exported: React.AbstractComponent<
  Props,
  React.ElementRef<HostComponent<mixed>>,
>;
>>>>>>> fb/0.62-stable

/**
 * Renders nested content and automatically applies paddings reflect the portion
 * of the view that is not covered by navigation bars, tab bars, toolbars, and
 * other ancestor views.
 *
 * Moreover, and most importantly, Safe Area's paddings reflect physical
 * limitation of the screen, such as rounded corners or camera notches (aka
 * sensor housing area on iPhone X).
 */
<<<<<<< HEAD
if (Platform.OS !== 'ios') {
  // TODO(macOS ISS#2323203)
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
=======
if (Platform.OS === 'android') {
  exported = React.forwardRef<Props, React.ElementRef<HostComponent<mixed>>>(
    function SafeAreaView(props, forwardedRef) {
      const {emulateUnlessSupported, ...localProps} = props;
      return <View {...localProps} ref={forwardedRef} />;
    },
  );
>>>>>>> fb/0.62-stable
} else {
  const RCTSafeAreaViewNativeComponent = require('./RCTSafeAreaViewNativeComponent')
    .default;

<<<<<<< HEAD
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
=======
  exported = React.forwardRef<Props, React.ElementRef<HostComponent<mixed>>>(
    function SafeAreaView(props, forwardedRef) {
      return (
        <RCTSafeAreaViewNativeComponent
          emulateUnlessSupported={true}
          {...props}
          ref={forwardedRef}
        />
      );
    },
  );
>>>>>>> fb/0.62-stable
}

module.exports = exported;
