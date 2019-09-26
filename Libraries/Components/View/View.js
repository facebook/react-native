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

const React = require('react');
const ViewNativeComponent = require('./ViewNativeComponent');

import type {ViewProps} from './ViewPropTypes';

export type Props = ViewProps;

/**
 * The most fundamental component for building a UI, View is a container that
 * supports layout with flexbox, style, some touch handling, and accessibility
 * controls.
 *
 * @see http://facebook.github.io/react-native/docs/view.html
 */

let ViewToExport = ViewNativeComponent;
if (__DEV__) {
  if (!global.__RCTProfileIsProfiling) {
    const View = (
      props: Props,
      forwardedRef: React.Ref<typeof ViewNativeComponent>,
    ) => {
      return <ViewNativeComponent {...props} ref={forwardedRef} />;
    };
    ViewToExport = React.forwardRef(View);
    ViewToExport.displayName = 'View';
  }
}

module.exports = ((ViewToExport: $FlowFixMe): typeof ViewNativeComponent);
