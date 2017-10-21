/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule SafeAreaView
 * @flow
 * @format
 */

const React = require('React');
const ViewPropTypes = require('ViewPropTypes');
const requireNativeComponent = require('requireNativeComponent');

import type {ViewProps} from 'ViewPropTypes';

type Props = ViewProps & {
  children: any,
};

/**
 * Renders nested content and automatically applies paddings reflect the portion of the view
 * that is not covered by navigation bars, tab bars, toolbars, and other ancestor views.
 * Moreover, and most importantly, Safe Area's paddings feflect physical limitation of the screen,
 * such as rounded corners or camera notches (aka sensor housing area on iPhone X).
 */
class SafeAreaView extends React.Component<Props> {
  static propTypes = {
    ...ViewPropTypes,
  };

  render() {
    return <RCTSafeAreaView {...this.props} />;
  }
}

const RCTSafeAreaView = requireNativeComponent('RCTSafeAreaView', {
  name: 'RCTSafeAreaView',
  displayName: 'RCTSafeAreaView',
  propTypes: {
    ...ViewPropTypes,
  },
});

module.exports = SafeAreaView;
