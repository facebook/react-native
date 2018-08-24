/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

const DeprecatedViewPropTypes = require('DeprecatedViewPropTypes');
const React = require('React');

const requireNativeComponent = require('requireNativeComponent');

import PropTypes from 'prop-types';
import type {ViewProps} from 'ViewPropTypes';
import type {InsetsChangeEvent} from 'CoreEventTypes';

const RCTSafeAreaView = requireNativeComponent('RCTSafeAreaView');

type Props = $ReadOnly<{|
  ...ViewProps,
  children?: ?React.Node,
  onInsetsChange?: ?(event: InsetsChangeEvent) => Promise<void> | void,
|}>;

/**
 * Renders nested content and automatically applies paddings reflect the portion of the view
 * that is not covered by navigation bars, tab bars, toolbars, and other ancestor views.
 * Moreover, and most importantly, Safe Area's paddings reflect physical limitation of the screen,
 * such as rounded corners or camera notches (aka sensor housing area on iPhone X).
 */
class SafeAreaView extends React.Component<Props> {
  static propTypes = {
    ...DeprecatedViewPropTypes,
    /**
     * Callback that is called when the safe area view insets changed.
     * This will be called with
     * `{ nativeEvent: { insets: { left, top, right, bottom } } }`.
     */
    onInsetsChange: PropTypes.func,
  };

  render() {
    return <RCTSafeAreaView {...this.props} />;
  }
}

module.exports = SafeAreaView;
