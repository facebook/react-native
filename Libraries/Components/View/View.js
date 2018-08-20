/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

const React = require('React');
const TextAncestor = require('TextAncestor');
const ViewNativeComponent = require('ViewNativeComponent');

const invariant = require('fbjs/lib/invariant');

import type {ViewProps} from 'ViewPropTypes';

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
  const View = (
    props: Props,
    forwardedRef: React.Ref<typeof ViewNativeComponent>,
  ) => {
    return (
      <TextAncestor.Consumer>
        {hasTextAncestor => {
          invariant(
            !hasTextAncestor,
            'Nesting of <View> within <Text> is not currently supported.',
          );
          return <ViewNativeComponent {...props} ref={forwardedRef} />;
        }}
      </TextAncestor.Consumer>
    );
  };
  // $FlowFixMe - TODO T29156721 `React.forwardRef` is not defined in Flow, yet.
  ViewToExport = React.forwardRef(View);
}

module.exports = ((ViewToExport: $FlowFixMe): typeof ViewNativeComponent);
