/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import type {ViewProps} from './ViewPropTypes';

import ViewNativeComponent from './ViewNativeComponent';
import TextAncestor from '../../Text/TextAncestor';
import flattenStyle from '../../StyleSheet/flattenStyle';
import * as React from 'react';

export type Props = ViewProps;

/**
 * The most fundamental component for building a UI, View is a container that
 * supports layout with flexbox, style, some touch handling, and accessibility
 * controls.
 *
 * @see https://reactnative.dev/docs/view
 */
const View: React.AbstractComponent<
  ViewProps,
  React.ElementRef<typeof ViewNativeComponent>,
> = React.forwardRef(
  (
    {tabIndex, focusable, style, pointerEvents, ...otherProps}: ViewProps,
    forwardedRef,
  ) => {
    const flattendStyle = flattenStyle(style);
    const newPointerEvents = pointerEvents || flattendStyle?.pointerEvents;
    return (
      <TextAncestor.Provider value={false}>
        <ViewNativeComponent
          focusable={tabIndex !== undefined ? !tabIndex : focusable}
          {...otherProps}
          style={style}
          pointerEvents={newPointerEvents}
          ref={forwardedRef}
        />
      </TextAncestor.Provider>
    );
  },
);

View.displayName = 'View';

module.exports = View;
