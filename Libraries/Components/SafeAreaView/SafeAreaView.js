/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const Platform = require('Platform');
const React = require('React');
const View = require('View');
const requireNativeComponent = require('requireNativeComponent');

import type {ViewProps} from 'ViewPropTypes';

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
  exported = class SafeAreaView extends React.Component<Props> {
    render(): React.Node {
      const {emulateUnlessSupported, ...props} = this.props;
      return <View {...props} />;
    }
  };
} else {
  const RCTSafeAreaView = requireNativeComponent('RCTSafeAreaView');
  exported = class SafeAreaView extends React.Component<Props> {
    render(): React.Node {
      return <RCTSafeAreaView emulateUnlessSupported={true} {...this.props} />;
    }
  };
}

module.exports = exported;
